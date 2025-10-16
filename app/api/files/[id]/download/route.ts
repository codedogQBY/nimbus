import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";
import { StorageAdapterFactory, StorageType } from "@/lib/storage-adapters";
import { appConfig } from "@/config/app";

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
    
    // 检查是否请求直接URL重定向
    const { searchParams } = new URL(request.url);
    const useDirectUrl = searchParams.get("direct") === "true" && appConfig.enableDirectUrl;

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

    // 如果请求直接URL且适配器支持，则重定向到直接URL
    if (useDirectUrl && adapter.getDirectUrl) {
      try {
        const directUrl = await adapter.getDirectUrl(file.storagePath);
        if (directUrl) {
          return NextResponse.redirect(directUrl, 302);
        }
      } catch (error) {
        console.error('Failed to get direct URL:', error);
        // 如果获取直接URL失败，继续使用代理方式
      }
    }

    // 否则通过服务器代理下载文件
    const fileBuffer = await adapter.download(file.storagePath);

    // 设置响应头
    const headers = new Headers();
    
    if (file.mimeType) {
      headers.set("Content-Type", file.mimeType);
    }

    // 正确的文件名编码处理
    // 确保文件名不包含路径信息
    let filename = file.originalName || file.name;
    
    // 提取文件名部分，移除可能的路径前缀
    if (filename) {
      const pathSeparators = ['/', '\\'];
      for (const separator of pathSeparators) {
        if (filename.includes(separator)) {
          const parts = filename.split(separator);
          filename = parts[parts.length - 1]; // 取最后一部分作为文件名
        }
      }
    }
    
    // 检查文件名是否包含非ASCII字符
    const hasNonAscii = /[^\x00-\x7F]/.test(filename);
    
    if (hasNonAscii) {
      // 对于包含非ASCII字符的文件名，使用RFC 5987编码
      const encodedFilename = encodeURIComponent(filename);
      headers.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodedFilename}`,
      );
    } else {
      // 对于纯ASCII文件名，直接使用
      headers.set(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
    }
    headers.set("Content-Length", fileBuffer.length.toString());
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
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
