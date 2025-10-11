import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';

// GET /api/shares - 获取用户的分享列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['shares.view']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 获取分享列表
    const shares = await prisma.share.findMany({
      where: {
        createdBy: user.id,
      },
      include: {
        file: {
          select: {
            id: true,
            name: true,
            size: true,
            mimeType: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 格式化分享数据
    const formattedShares = shares.map((share: any) => ({
      id: share.id,
      name: share.file?.name || share.folder?.name || '未知',
      type: share.file ? 'file' : 'folder',
      shareToken: share.shareToken,
      hasPassword: !!share.passwordHash,
      expiresAt: share.expiresAt,
      downloadCount: share.downloadCount,
      downloadLimit: share.downloadLimit,
      isActive: share.isActive,
      createdAt: share.createdAt,
      fileId: share.fileId,
      folderId: share.folderId,
    }));

    // 统计数据（mock浏览量，因为数据库没有此字段）
    const stats = {
      total: shares.length,
      totalViews: shares.reduce((sum: number, s: any) => sum + s.downloadCount * 3, 0), // 估算浏览量
      totalDownloads: shares.reduce((sum: number, s: any) => sum + s.downloadCount, 0),
      protected: shares.filter((s: any) => s.passwordHash).length,
      active: shares.filter((s: any) => s.isActive).length,
    };

    return NextResponse.json({
      shares: formattedShares.map((s: any) => ({
        ...s,
        viewCount: s.downloadCount * 3, // 估算
      })),
      stats,
    });
  } catch (error) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { error: '获取分享列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

