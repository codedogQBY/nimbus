import { readFile, stat } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// GET /api/files/[id]/download - 下载文件
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
    const { authorized } = await requirePermissions(request, [
      "files.download",
    ]);

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

    // TODO: 使用存储适配器获取文件
    // 目前使用本地存储
    const filePath = path.join(process.cwd(), file.storagePath);

    try {
      // 检查文件是否存在
      await stat(filePath);

      // 读取文件
      const fileBuffer = await readFile(filePath);

      // 返回文件流
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": file.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          "Content-Length": String(file.size),
        },
      });
    } catch (error) {
      console.error("File read error:", error);

      return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
    }
  } catch (error) {
    console.error("Download error:", error);

    return NextResponse.json(
      {
        error: "下载失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
