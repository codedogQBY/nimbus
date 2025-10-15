import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// POST /api/shares/create - 创建分享
const createShareSchema = z
  .object({
    fileId: z.number().optional(),
    folderId: z.number().optional(),
    password: z.string().optional(),
    expiresAt: z.string().optional(), // ISO date string
    downloadLimit: z.number().optional(),
  })
  .refine((data) => data.fileId || data.folderId, {
    message: "必须指定文件或文件夹",
  });

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ["shares.create"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createShareSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "参数错误", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { fileId, folderId, password, expiresAt, downloadLimit } =
      validation.data;

    // 验证文件或文件夹存在
    if (fileId) {
      const file = await prisma.file.findUnique({ where: { id: fileId } });

      if (!file) {
        return NextResponse.json({ error: "文件不存在" }, { status: 404 });
      }
    }

    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
      }
    }

    // 生成唯一的分享token
    const shareToken = nanoid(10);

    // 如果有密码，进行哈希
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // 创建分享
    const share = await prisma.share.create({
      data: {
        shareToken,
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        downloadLimit: downloadLimit || null,
        createdBy: user.id,
      },
    });

    // 创建快照
    let snapshotData: any = {};
    let originalFileId: number | null = null;
    let originalFolderId: number | null = null;
    let shareType = "";
    let shareName = "";

    if (fileId) {
      // 文件分享：保存文件信息快照
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          storageSource: true,
        },
      });

      if (!file) {
        // 删除已创建的分享记录
        await prisma.share.delete({ where: { id: share.id } });

        return NextResponse.json({ error: "文件不存在" }, { status: 404 });
      }

      originalFileId = file.id;
      shareType = "file";
      shareName = file.originalName;

      snapshotData = {
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        size: Number(file.size), // Convert BigInt to Number
        mimeType: file.mimeType,
        md5Hash: file.md5Hash,
        storagePath: file.storagePath,
        storageSourceId: file.storageSourceId,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      };
    }

    if (folderId) {
      // 文件夹分享：保存完整的文件夹结构快照
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        // 删除已创建的分享记录
        await prisma.share.delete({ where: { id: share.id } });

        return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
      }

      originalFolderId = folder.id;
      shareType = "folder";
      shareName = folder.name;

      // 递归获取文件夹的完整结构
      const getFolderSnapshot = async (folderId: number): Promise<any> => {
        const subFolders = await prisma.folder.findMany({
          where: { parentId: folderId },
          orderBy: { name: "asc" },
        });

        const files = await prisma.file.findMany({
          where: { folderId },
          orderBy: { name: "asc" },
        });

        const folderSnapshots = await Promise.all(
          subFolders.map(async (subfolder) => ({
            id: subfolder.id,
            name: subfolder.name,
            path: subfolder.path,
            createdAt: subfolder.createdAt.toISOString(),
            updatedAt: subfolder.updatedAt.toISOString(),
            children: await getFolderSnapshot(subfolder.id),
          })),
        );

        const fileSnapshots = files.map((file) => ({
          id: file.id,
          name: file.name,
          originalName: file.originalName,
          size: Number(file.size), // Convert BigInt to Number
          mimeType: file.mimeType,
          md5Hash: file.md5Hash,
          storagePath: file.storagePath,
          storageSourceId: file.storageSourceId,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        }));

        return {
          folders: folderSnapshots,
          files: fileSnapshots,
        };
      };

      const folderContents = await getFolderSnapshot(folder.id);

      snapshotData = {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        totalFiles: 0, // Will be calculated
        totalFolders: 0, // Will be calculated
        totalSize: 0, // Will be calculated
        contents: folderContents,
      };

      // 计算统计信息
      const calculateStats = (
        contents: any,
      ): {
        files: number;
        folders: number;
        size: number;
      } => {
        let files = contents.files.length;
        let folders = contents.folders.length;
        let size = contents.files.reduce(
          (sum: number, file: any) => sum + file.size,
          0,
        );

        for (const subfolder of contents.folders) {
          const subStats = calculateStats(subfolder.children);

          files += subStats.files;
          folders += subStats.folders;
          size += subStats.size;
        }

        return { files, folders, size };
      };

      const stats = calculateStats(folderContents);

      snapshotData.totalFiles = stats.files;
      snapshotData.totalFolders = stats.folders;
      snapshotData.totalSize = stats.size;
    }

    // 创建分享快照记录
    await prisma.shareSnapshot.create({
      data: {
        shareId: share.id,
        type: shareType,
        originalFileId,
        originalFolderId,
        snapshotData,
      },
    });

    return NextResponse.json({
      success: true,
      share: {
        id: share.id,
        shareToken: share.shareToken,
        name: shareName,
        type: shareType,
        hasPassword: !!passwordHash,
        expiresAt: share.expiresAt,
        shareUrl: `${request.nextUrl.origin}/s/${share.shareToken}`,
      },
    });
  } catch (error) {
    console.error("Create share error:", error);

    return NextResponse.json(
      {
        error: "创建分享失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
