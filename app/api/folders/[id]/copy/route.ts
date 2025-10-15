import { copyFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// POST /api/folders/[id]/copy - 复制文件夹
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const folderId = parseInt(id);
    const body = await request.json();
    const { targetFolderId } = body;

    // 获取源文件夹信息
    const sourceFolder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!sourceFolder) {
      return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
    }

    // 递归复制文件夹
    const copyFolderRecursive = async (
      sourceFolderId: number,
      targetParentId: number | null,
      targetPath: string,
    ): Promise<number> => {
      // 获取源文件夹信息
      const folder = await prisma.folder.findUnique({
        where: { id: sourceFolderId },
      });

      if (!folder) {
        throw new Error("源文件夹不存在");
      }

      // 创建新文件夹
      const newFolderPath =
        targetPath === "/" ? `/${folder.name}` : `${targetPath}/${folder.name}`;
      const newFolder = await prisma.folder.create({
        data: {
          name: folder.name,
          path: newFolderPath,
          parentId: targetParentId,
          createdBy: user.id,
        },
      });

      // 复制该文件夹下的所有文件
      const files = await prisma.file.findMany({
        where: { folderId: sourceFolderId },
        include: { storageSource: true },
      });

      for (const file of files) {
        try {
          // 生成新文件名
          const ext = path.extname(file.name);
          const uniqueName = `${nanoid()}-${Date.now()}${ext}`;

          // 复制文件（本地存储）
          const sourcePath = path.join(process.cwd(), file.storagePath);
          const uploadDir = path.join(process.cwd(), "uploads");
          const destPath = path.join(uploadDir, uniqueName);

          await copyFile(sourcePath, destPath);

          // 创建新文件记录
          await prisma.file.create({
            data: {
              name: uniqueName,
              originalName: file.originalName,
              size: file.size,
              mimeType: file.mimeType,
              md5Hash: file.md5Hash,
              storagePath: `/uploads/${uniqueName}`,
              storageSourceId: file.storageSourceId,
              folderId: newFolder.id,
              uploadedBy: user.id,
            },
          });

          // 更新存储源使用量
          await prisma.storageSource.update({
            where: { id: file.storageSourceId },
            data: {
              quotaUsed: {
                increment: Number(file.size), // 确保转换为Number
              },
            },
          });
        } catch (error) {
          console.error(`Error copying file ${file.originalName}:`, error);
          // 继续复制其他文件
        }
      }

      // 递归复制子文件夹
      const subfolders = await prisma.folder.findMany({
        where: { parentId: sourceFolderId },
      });

      for (const subfolder of subfolders) {
        await copyFolderRecursive(subfolder.id, newFolder.id, newFolderPath);
      }

      return newFolder.id;
    };

    // 确定目标路径
    let targetPath = "/";

    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
      });

      if (!targetFolder) {
        return NextResponse.json(
          { error: "目标文件夹不存在" },
          { status: 404 },
        );
      }
      targetPath = targetFolder.path;
    }

    // 执行复制
    const newFolderId = await copyFolderRecursive(
      folderId,
      targetFolderId || null,
      targetPath,
    );

    return NextResponse.json({
      success: true,
      folder: {
        id: newFolderId,
      },
    });
  } catch (error) {
    console.error("Copy folder error:", error);

    return NextResponse.json(
      {
        error: "复制失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
