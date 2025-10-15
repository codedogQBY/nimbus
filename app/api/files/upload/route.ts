import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";
import { StorageAdapterFactory, StorageType } from "@/lib/storage-adapters";

// POST /api/files/upload - 上传文件
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["files.upload"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string | null;
    const relativePath = formData.get("relativePath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "没有文件" }, { status: 400 });
    }

    // 检查是否为系统文件或隐藏文件
    const shouldSkipFile = (fileName: string): boolean => {
      const skipPatterns = [
        ".DS_Store", // macOS 系统文件
        "Thumbs.db", // Windows 缩略图文件
        "desktop.ini", // Windows 系统文件
        ".localized", // macOS 本地化文件
        "._*", // macOS 资源分叉文件
        ".Spotlight-V100", // macOS Spotlight 索引
        ".Trashes", // macOS 回收站
        ".fseventsd", // macOS 文件系统事件
        ".TemporaryItems", // macOS 临时文件
        ".DocumentRevisions-V100", // macOS 文档版本
        ".VolumeIcon.icns", // macOS 卷图标
        ".com.apple.*", // Apple 系统文件
        ".apdisk", // Apple 磁盘映像
      ];

      return skipPatterns.some((pattern) => {
        if (pattern.includes("*")) {
          const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");

          return regex.test(fileName);
        }

        return fileName === pattern;
      });
    };

    if (shouldSkipFile(file.name)) {
      return NextResponse.json(
        { error: "不允许上传系统文件" },
        { status: 400 },
      );
    }

    // 如果有relativePath，需要创建对应的文件夹结构
    let targetFolderId = folderId ? parseInt(folderId) : null;

    if (relativePath) {
      // 解析路径并创建文件夹结构
      const pathParts = relativePath.split("/").filter((p) => p);

      // relativePath包含完整路径（包括文件名），所以需要移除最后一个部分（文件名）
      const folderParts = pathParts.slice(0, -1); // 移除文件名，只保留文件夹路径

      let currentFolderId = targetFolderId;
      let currentPath = targetFolderId
        ? (await prisma.folder.findUnique({ where: { id: targetFolderId } }))
            ?.path || "/"
        : "/";

      // 只有当有文件夹路径时才创建文件夹
      for (let i = 0; i < folderParts.length; i++) {
        const folderName = folderParts[i];
        const folderPath =
          currentPath === "/"
            ? `/${folderName}`
            : `${currentPath}/${folderName}`;

        // 使用事务和锁机制来避免并发创建重复文件夹
        const folder = await prisma.$transaction(
          async (tx) => {
            // 先尝试查找现有文件夹（使用更宽松的条件先查询）
            let existingFolder = await tx.folder.findFirst({
              where: {
                name: folderName,
                parentId: currentFolderId,
              },
            });

            if (existingFolder) {
              return existingFolder;
            }

            // 如果不存在，尝试创建新文件夹
            try {
              const newFolder = await tx.folder.create({
                data: {
                  name: folderName,
                  path: folderPath,
                  parentId: currentFolderId,
                  createdBy: user.id,
                },
              });

              return newFolder;
            } catch (error: any) {
              // 如果创建失败（可能是并发创建导致的唯一约束冲突），再次查询
              if (error.code === "P2002") {
                // Unique constraint violation
                const retryFolder = await tx.folder.findFirst({
                  where: {
                    name: folderName,
                    parentId: currentFolderId,
                  },
                });

                if (retryFolder) {
                  return retryFolder;
                }
              }

              // 如果仍然失败，抛出详细错误信息
              console.error("Failed to create folder after retry:", {
                folderName,
                parentId: currentFolderId,
                path: folderPath,
                error: error.message,
                code: error.code,
              });
              throw new Error(
                `创建文件夹失败: ${folderName} (${error.message})`,
              );
            }
          },
          {
            maxWait: 5000, // 最大等待5秒
            timeout: 10000, // 事务超时10秒
          },
        );

        currentFolderId = folder.id;
        currentPath = folderPath;
      }

      targetFolderId = currentFolderId;
    }

    // 获取默认存储源（优先级最高的活跃存储源）
    const storageSource = await prisma.storageSource.findFirst({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    });

    if (!storageSource) {
      return NextResponse.json({ error: "没有可用的存储源" }, { status: 500 });
    }

    // 检查存储源配额
    const currentUsed = Number(storageSource.quotaUsed);
    const quotaLimit = Number(storageSource.quotaLimit);
    const fileSize = file.size;

    if (currentUsed + fileSize > quotaLimit) {
      return NextResponse.json({ error: "存储空间不足" }, { status: 400 });
    }

    // 生成文件名（保留原始名称，处理重名冲突）
    // 如果有relativePath，从中提取文件名；否则使用原始文件名
    let originalName = file.name;

    if (relativePath) {
      const pathParts = relativePath.split("/").filter((p) => p);

      if (pathParts.length > 0) {
        originalName = pathParts[pathParts.length - 1]; // 取最后一个部分作为文件名
      }
    }

    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    // 检查同一文件夹下是否有重名文件
    let finalName = originalName;
    let counter = 1;

    while (true) {
      const existingFile = await prisma.file.findFirst({
        where: {
          name: finalName,
          folderId: targetFolderId,
          uploadedBy: user.id,
        },
      });

      if (!existingFile) {
        break;
      }

      // 如果重名，添加数字后缀
      finalName = `${baseName}(${counter})${ext}`;
      counter++;
    }

    // 为物理存储生成唯一标识符（避免文件系统冲突）
    const storageFileName = `${nanoid()}-${Date.now()}${path.extname(originalName)}`;

    // 使用存储适配器上传文件
    const adapter = StorageAdapterFactory.create(
      storageSource.type as StorageType,
      storageSource.config,
    );

    // 对于本地存储，需要先初始化
    if (
      storageSource.type === "local" &&
      typeof (adapter as any).initialize === "function"
    ) {
      await (adapter as any).initialize();
    }

    // 读取文件内容一次，用于上传和哈希计算
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 创建一个新的File对象以避免重复读取
    const uploadFile = new File([fileBuffer], file.name, { type: file.type });

    const uploadResult = await adapter.upload(uploadFile, storageFileName);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "上传失败" },
        { status: 500 },
      );
    }

    // 计算文件哈希
    const crypto = await import("crypto");
    const md5Hash = crypto
      .createHash("md5")
      .update(new Uint8Array(fileBuffer))
      .digest("hex");

    // 保存文件信息到数据库
    const savedFile = await prisma.file.create({
      data: {
        name: finalName,
        originalName: file.name,
        size: BigInt(fileSize),
        mimeType: file.type || "application/octet-stream",
        md5Hash: md5Hash,
        storagePath: uploadResult.path || storageFileName,
        storageSourceId: storageSource.id,
        folderId: targetFolderId,
        uploadedBy: user.id,
      },
    });

    // 更新存储源使用量
    await prisma.storageSource.update({
      where: { id: storageSource.id },
      data: {
        quotaUsed: BigInt(currentUsed + fileSize),
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        name: savedFile.name,
        originalName: savedFile.originalName,
        size: Number(savedFile.size),
        mimeType: savedFile.mimeType,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        error: "上传失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// 配置上传大小限制（100MB）
export const config = {
  api: {
    bodyParser: false,
  },
};
