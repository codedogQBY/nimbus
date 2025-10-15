import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

// GET /api/shares/[token] - 获取分享信息（使用快照数据）
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = await params;

    const share = await prisma.share.findUnique({
      where: {
        shareToken: token,
        isActive: true,
      },
      include: {
        snapshot: true, // 包含快照数据
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: "分享不存在或已失效" },
        { status: 404 },
      );
    }

    // 调试信息
    console.log("Share creator data:", {
      creator: share.creator,
      creatorId: share.createdBy,
      username: share.creator?.username,
      email: share.creator?.email,
    });

    // 检查是否过期
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: "分享已过期" }, { status: 410 });
    }

    if (!share.snapshot) {
      return NextResponse.json({ error: "分享数据不完整" }, { status: 404 });
    }

    const snapshotData = share.snapshot.snapshotData as any;
    const shareType = share.snapshot.type;

    // 如果有密码保护，只返回基本信息
    if (share.passwordHash) {
      return NextResponse.json({
        requirePassword: true,
        name: snapshotData.name || snapshotData.originalName || "未知",
        type: shareType,
      });
    }

    // 返回完整分享信息（基于快照数据）
    const shareData = {
      id: share.id,
      name: snapshotData.name || snapshotData.originalName || "未知",
      type: shareType,
      size: shareType === "file" ? snapshotData.size : snapshotData.totalSize,
      mimeType: shareType === "file" ? snapshotData.mimeType : undefined,
      hasPassword: !!share.passwordHash,
      expiresAt: share.expiresAt,
      downloadCount: share.downloadCount,
      viewCount: share.viewCount || 0,
      createdAt: share.createdAt,
      creatorName: share.creator?.username || share.creator?.email || "Unknown",
      // 使用快照数据中的ID
      fileId: shareType === "file" ? snapshotData.id : undefined,
      folderId: shareType === "folder" ? snapshotData.id : undefined,
    };

    return NextResponse.json({ share: shareData });
  } catch (error) {
    console.error("Get share error:", error);

    return NextResponse.json(
      {
        error: "获取分享失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
