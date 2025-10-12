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
        snapshot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 格式化分享数据
    const formattedShares = shares.map((share: any) => {
      const snapshotData = share.snapshot?.snapshotData;
      const shareType = share.snapshot?.type;

      return {
        id: share.id,
        name: snapshotData ? (snapshotData.name || snapshotData.originalName || '未知') : '未知',
        type: shareType || 'unknown',
        shareToken: share.shareToken,
        hasPassword: !!share.passwordHash,
        expiresAt: share.expiresAt,
        downloadCount: share.downloadCount,
        viewCount: share.viewCount || 0,
        downloadLimit: share.downloadLimit,
        isActive: share.isActive,
        createdAt: share.createdAt,
        // 使用快照数据中的ID
        fileId: shareType === 'file' ? snapshotData?.id : undefined,
        folderId: shareType === 'folder' ? snapshotData?.id : undefined,
        // 添加额外的元数据
        size: shareType === 'file' ? snapshotData?.size : snapshotData?.totalSize,
        mimeType: shareType === 'file' ? snapshotData?.mimeType : undefined,
        totalFiles: shareType === 'folder' ? snapshotData?.totalFiles : undefined,
        totalFolders: shareType === 'folder' ? snapshotData?.totalFolders : undefined,
      };
    });

    // 统计数据
    const stats = {
      total: shares.length,
      totalViews: shares.reduce((sum: number, s: any) => sum + (s.viewCount || 0), 0),
      totalDownloads: shares.reduce((sum: number, s: any) => sum + s.downloadCount, 0),
      protected: shares.filter((s: any) => s.passwordHash).length,
      active: shares.filter((s: any) => s.isActive).length,
    };

    return NextResponse.json({
      shares: formattedShares,
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

