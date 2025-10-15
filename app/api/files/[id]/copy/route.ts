import { copyFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// POST /api/files/[id]/copy - 复制文件
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
    const fileId = parseInt(id);
    const body = await request.json();
    const { targetFolderId } = body;

    // 获取源文件信息
    const sourceFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: { storageSource: true },
    });

    if (!sourceFile) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 检查存储配额
    const storageSource = sourceFile.storageSource;
    const currentUsed = Number(storageSource.quotaUsed);
    const quotaLimit = Number(storageSource.quotaLimit);
    const fileSize = Number(sourceFile.size);

    if (currentUsed + fileSize > quotaLimit) {
      return NextResponse.json({ error: "存储空间不足" }, { status: 400 });
    }

    // 生成新文件名
    const ext = path.extname(sourceFile.name);
    const uniqueName = `${nanoid()}-${Date.now()}${ext}`;

    // TODO: 使用存储适配器复制文件
    // 目前使用本地存储
    const sourcePath = path.join(process.cwd(), sourceFile.storagePath);
    const uploadDir = path.join(process.cwd(), "uploads");
    const destPath = path.join(uploadDir, uniqueName);

    try {
      // 复制文件
      await copyFile(sourcePath, destPath);

      // 创建新文件记录
      const newFile = await prisma.file.create({
        data: {
          name: uniqueName,
          originalName: sourceFile.originalName,
          size: sourceFile.size,
          mimeType: sourceFile.mimeType,
          md5Hash: sourceFile.md5Hash,
          storagePath: `/uploads/${uniqueName}`,
          storageSourceId: storageSource.id,
          folderId: targetFolderId || null,
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
          id: newFile.id,
          name: newFile.name,
          originalName: newFile.originalName,
          size: Number(newFile.size),
        },
      });
    } catch (error) {
      console.error("File copy error:", error);

      return NextResponse.json({ error: "文件复制失败" }, { status: 500 });
    }
  } catch (error) {
    console.error("Copy error:", error);

    return NextResponse.json(
      {
        error: "复制失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
