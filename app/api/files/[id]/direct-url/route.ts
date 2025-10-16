import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";
import { StorageAdapterFactory, StorageType } from "@/lib/storage-adapters";
import { appConfig } from "@/config/app";

// GET /api/files/[id]/direct-url - 获取文件的直接访问URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 检查是否启用直接URL功能
    if (!appConfig.enableDirectUrl) {
      return NextResponse.json(
        { error: '直接URL功能未启用' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["files.view"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const fileId = parseInt(id);

    // 获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        storageSource: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 创建存储适配器
    const adapter = StorageAdapterFactory.create(
      file.storageSource.type as StorageType,
      file.storageSource.config as Record<string, any>,
    );

    // 检查适配器是否支持直接URL
    if (!adapter.getDirectUrl) {
      return NextResponse.json(
        { error: "此存储源不支持直接URL访问" },
        { status: 400 },
      );
    }

    // 获取直接访问URL（支持异步操作）
    const directUrlResult = adapter.getDirectUrl(file.storagePath);
    const directUrl = await Promise.resolve(directUrlResult);

    // 如果适配器不支持直接URL（返回null），返回错误
    if (!directUrl) {
      return NextResponse.json(
        { error: "此存储源不支持直接URL访问" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      url: directUrl,
      fileInfo: {
        id: Number(file.id),
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: Number(file.size),
      },
    });
  } catch (error) {
    console.error("Get direct URL error:", error);

    return NextResponse.json(
      {
        error: "获取直接URL失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}