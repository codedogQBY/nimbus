import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/shares/[token]/verify - 验证分享密码
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: '请提供密码' }, { status: 400 });
    }

    const share = await prisma.share.findUnique({
      where: {
        shareToken: token,
        isActive: true,
      },
      include: {
        snapshot: true,
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
      return NextResponse.json({ error: '分享不存在或已失效' }, { status: 404 });
    }

    // 检查是否过期
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: '分享已过期' }, { status: 410 });
    }

    if (!share.snapshot) {
      return NextResponse.json({ error: '分享数据不完整' }, { status: 404 });
    }

    // 验证密码
    if (!share.passwordHash) {
      return NextResponse.json({ error: '此分享无需密码' }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, share.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const snapshotData = share.snapshot.snapshotData as any;
    const shareType = share.snapshot.type;

    // 返回完整分享信息
    const shareData = {
      id: share.id,
      name: snapshotData.name || snapshotData.originalName || '未知',
      type: shareType,
      size: shareType === 'file' ? snapshotData.size : snapshotData.totalSize,
      mimeType: shareType === 'file' ? snapshotData.mimeType : undefined,
      hasPassword: true,
      expiresAt: share.expiresAt,
      downloadCount: share.downloadCount,
      viewCount: share.viewCount || 0,
      createdAt: share.createdAt,
      creatorName: share.creator?.username || share.creator?.email || 'Unknown',
      // 使用快照数据中的ID
      fileId: shareType === 'file' ? snapshotData.id : undefined,
      folderId: shareType === 'folder' ? snapshotData.id : undefined,
    };

    return NextResponse.json({ share: shareData });
  } catch (error) {
    console.error('Verify share password error:', error);
    return NextResponse.json(
      { error: '验证失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}