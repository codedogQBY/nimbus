import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/shares/[token]/download - 记录下载
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;

    const share = await prisma.share.findUnique({
      where: {
        shareToken: token,
        isActive: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在或已失效' }, { status: 404 });
    }

    // 检查是否过期
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: '分享已过期' }, { status: 410 });
    }

    // 检查下载次数限制
    if (share.downloadLimit && share.downloadCount >= share.downloadLimit) {
      return NextResponse.json({ error: '下载次数已达上限' }, { status: 403 });
    }

    // 增加下载计数
    await prisma.share.update({
      where: { id: share.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record download error:', error);
    return NextResponse.json(
      { error: '记录下载失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/shares/[token]/download - 获取下载链接
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;

    const share = await prisma.share.findUnique({
      where: {
        shareToken: token,
        isActive: true,
      },
      include: {
        snapshot: true,
      },
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在或已失效' }, { status: 404 });
    }

    // 检查是否过期
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: '分享已过期' }, { status: 410 });
    }

    // 检查下载次数限制
    if (share.downloadLimit && share.downloadCount >= share.downloadLimit) {
      return NextResponse.json({ error: '下载次数已达上限' }, { status: 403 });
    }

    if (!share.snapshot) {
      return NextResponse.json({ error: '分享数据不完整' }, { status: 404 });
    }

    const snapshotData = share.snapshot.snapshotData as any;
    const shareType = share.snapshot.type;

    // 生成下载链接
    let downloadUrl: string;

    if (shareType === 'file') {
      // 文件下载 - 使用快照数据中的文件ID
      downloadUrl = `/api/files/${snapshotData.id}/serve?download=1&share=${token}`;
    } else if (shareType === 'folder') {
      // 文件夹下载（压缩包） - 使用快照数据中的文件夹ID
      downloadUrl = `/api/folders/${snapshotData.id}/download?share=${token}`;
    } else {
      return NextResponse.json({ error: '分享内容不存在' }, { status: 404 });
    }

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Get download URL error:', error);
    return NextResponse.json(
      { error: '获取下载链接失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}