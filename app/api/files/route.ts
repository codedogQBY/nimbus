import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// GET /api/files - 获取文件和文件夹列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["files.view"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 查询文件夹
    const folders = await prisma.folder.findMany({
      where: {
        parentId: folderId ? parseInt(folderId) : null,
      },
      include: {
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
        creator: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        [sortBy === "name" ? "name" : "createdAt"]: sortOrder as "asc" | "desc",
      },
    });

    // 查询文件
    const skip = (page - 1) * limit;
    const [files, totalFiles] = await Promise.all([
      prisma.file.findMany({
        where: {
          folderId: folderId ? parseInt(folderId) : null,
        },
        include: {
          uploader: {
            select: {
              username: true,
            },
          },
          storageSource: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          [sortBy === "name"
            ? "name"
            : sortBy === "size"
              ? "size"
              : "createdAt"]: sortOrder as "asc" | "desc",
        },
        skip,
        take: limit,
      }),
      prisma.file.count({
        where: {
          folderId: folderId ? parseInt(folderId) : null,
        },
      }),
    ]);

    // 格式化文件夹数据
    const formattedFolders = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      itemCount: folder._count.files + folder._count.children,
      size: "计算中...", // 需要递归计算
      updatedAt: folder.updatedAt.toISOString(),
      createdBy: folder.creator.username,
    }));

    // 格式化文件数据
    const formattedFiles = files.map((file) => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      size: Number(file.size),
      mimeType: file.mimeType,
      type: file.mimeType?.split("/")[0] || "file",
      updatedAt: file.updatedAt.toISOString(),
      uploadedBy: file.uploader.username,
      storageSource: {
        name: file.storageSource.name,
        type: file.storageSource.type,
      },
    }));

    return NextResponse.json({
      folders: formattedFolders,
      files: formattedFiles,
      pagination: {
        page,
        limit,
        total: totalFiles,
        totalPages: Math.ceil(totalFiles / limit),
        hasMore: skip + files.length < totalFiles,
      },
    });
  } catch (error) {
    console.error("Get files error:", error);

    return NextResponse.json(
      {
        error: "获取文件列表失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
