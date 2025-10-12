import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StorageAdapterFactory, StorageType } from '@/lib/storage-adapters';

// GET /api/files/[id]/share?token=xxx - 通过分享访问文件
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    const shareToken = searchParams.get('token');
    const download = searchParams.get('download') === '1';

    if (isNaN(fileId)) {
      return NextResponse.json({ error: '无效的文件ID' }, { status: 400 });
    }

    if (!shareToken) {
      return NextResponse.json({ error: '需要分享token' }, { status: 400 });
    }

    // 验证分享token
    const share = await prisma.share.findUnique({
      where: {
        shareToken,
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

    if (!share.snapshot) {
      return NextResponse.json({ error: '分享数据不完整' }, { status: 404 });
    }

    // 获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        storageSource: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 使用快照数据验证文件访问权限
    let hasAccess = false;
    const snapshotData = share.snapshot.snapshotData as any;

    if (share.snapshot.type === 'file') {
      // 文件分享：检查是否是分享的文件
      hasAccess = snapshotData.id === fileId;
    } else if (share.snapshot.type === 'folder') {
      // 文件夹分享：检查文件是否在快照中
      hasAccess = isFileInSnapshot(fileId, snapshotData);
    }

    if (!hasAccess) {
      return NextResponse.json({ error: '无权访问此文件' }, { status: 403 });
    }

    // 创建存储适配器
    const adapter = StorageAdapterFactory.create(
      file.storageSource.type as StorageType,
      file.storageSource.config
    );

    // 下载文件
    const fileBuffer = await adapter.download(file.storagePath);

    // 设置响应头
    const headers = new Headers();

    if (file.mimeType) {
      headers.set('Content-Type', file.mimeType);
    }

    // RFC 5987 编码文件名
    const encodedFilename = encodeURIComponent(file.originalName || file.name)
      .replace(/['()]/g, escape)
      .replace(/\\*/g, '%2A');

    if (download) {
      headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    } else {
      // 对于图片和PDF，默认内联显示
      if (file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf') {
        headers.set('Content-Disposition', 'inline');
      } else {
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      }
    }

    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Share file access error:', error);
    return NextResponse.json(
      { error: '文件访问失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 检查文件是否在快照数据中
function isFileInSnapshot(fileId: number, snapshotData: any): boolean {
  // 检查根级文件
  if (snapshotData.contents?.files) {
    for (const file of snapshotData.contents.files) {
      if (file.id === fileId) {
        return true;
      }
    }
  }

  // 递归检查子文件夹中的文件
  if (snapshotData.contents?.folders) {
    for (const folder of snapshotData.contents.folders) {
      if (isFileInFolderSnapshot(fileId, folder.children)) {
        return true;
      }
    }
  }

  return false;
}

// 递归检查文件夹快照中的文件
function isFileInFolderSnapshot(fileId: number, folderContents: any): boolean {
  // 检查当前文件夹的文件
  if (folderContents.files) {
    for (const file of folderContents.files) {
      if (file.id === fileId) {
        return true;
      }
    }
  }

  // 递归检查子文件夹
  if (folderContents.folders) {
    for (const folder of folderContents.folders) {
      if (isFileInFolderSnapshot(fileId, folder.children)) {
        return true;
      }
    }
  }

  return false;
}