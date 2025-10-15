import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// POST /api/files/[id]/move - 移动文件
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
    const { authorized } = await requirePermissions(request, ["files.edit"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const fileId = parseInt(id);
    const body = await request.json();
    const { targetFolderId } = body;

    // 获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 检查目标文件夹是否存在
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
    }

    // 更新文件的文件夹ID
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        folderId: targetFolderId || null,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: updatedFile.id,
        name: updatedFile.name,
        originalName: updatedFile.originalName,
        folderId: updatedFile.folderId,
      },
    });
  } catch (error) {
    console.error("Move error:", error);

    return NextResponse.json(
      {
        error: "移动失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
