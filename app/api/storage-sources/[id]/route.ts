import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// DELETE /api/storage-sources/[id] - 删除存储源
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    await requirePermissions(request, ["storage.manage"]);

    const { id } = await params;
    const storageSourceId = parseInt(id);

    // 检查存储源是否存在
    const storageSource = await prisma.storageSource.findUnique({
      where: { id: storageSourceId },
      include: {
        files: true,
      },
    });

    if (!storageSource) {
      return NextResponse.json({ error: "存储源不存在" }, { status: 404 });
    }

    // 检查是否为本地存储源
    if (storageSource.type === "local") {
      // 检查是否还有其他存储源
      const otherSources = await prisma.storageSource.count({
        where: {
          id: { not: storageSourceId },
          isActive: true,
        },
      });

      if (otherSources === 0) {
        return NextResponse.json(
          {
            error: "无法删除本地存储源，因为它是唯一的存储源",
            details: {
              message: "请先添加其他存储源后再删除本地存储源",
            },
          },
          { status: 400 },
        );
      }
    }

    // 检查是否有文件正在使用此存储源
    if (storageSource.files.length > 0) {
      return NextResponse.json(
        {
          error: "无法删除存储源，因为还有文件正在使用此存储源",
          details: {
            fileCount: storageSource.files.length,
            message: "请先迁移或删除相关文件后再删除存储源",
          },
        },
        { status: 400 },
      );
    }

    // 删除存储源
    await prisma.storageSource.delete({
      where: { id: storageSourceId },
    });

    return NextResponse.json({
      success: true,
      message: "存储源删除成功",
    });
  } catch (error) {
    console.error("Delete storage source error:", error);

    return NextResponse.json({ error: "删除存储源失败" }, { status: 500 });
  }
}

// GET /api/storage-sources/[id] - 获取单个存储源详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    await requirePermissions(request, ["storage.view"]);

    const { id } = await params;
    const storageSourceId = parseInt(id);

    const storageSource = await prisma.storageSource.findUnique({
      where: { id: storageSourceId },
      include: {
        files: {
          select: {
            id: true,
            originalName: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!storageSource) {
      return NextResponse.json({ error: "存储源不存在" }, { status: 404 });
    }

    // 计算存储使用情况
    const totalFiles = storageSource.files.length;
    const calculatedUsed = storageSource.files.reduce(
      (sum, file) => sum + Number(file.size),
      0,
    );
    const quotaLimit = storageSource.quotaLimit
      ? Number(storageSource.quotaLimit)
      : null;

    // 使用数据库中的quotaUsed字段，但确保不为负数且不为NaN
    const dbQuotaUsed = Number(storageSource.quotaUsed);
    const quotaUsed = Math.max(
      0,
      isNaN(dbQuotaUsed) ? calculatedUsed : dbQuotaUsed,
    );

    const result = {
      ...storageSource,
      quotaLimit: quotaLimit,
      quotaUsed: quotaUsed,
      fileCount: totalFiles,
      usage: quotaLimit ? ((quotaUsed / quotaLimit) * 100).toFixed(2) : null,
      remaining: quotaLimit ? quotaLimit - quotaUsed : null,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get storage source error:", error);

    return NextResponse.json({ error: "获取存储源详情失败" }, { status: 500 });
  }
}
