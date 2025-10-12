import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { StorageAdapterFactory, StorageType } from '@/lib/storage-adapters';
import fs from 'fs';
import path from 'path';

// GET /api/files/[id]/serve - 提供文件访问（支持用户认证和分享token）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    const shareToken = searchParams.get('share');
    const download = searchParams.get('download') === '1';

    if (isNaN(fileId)) {
      return NextResponse.json({ error: '无效的文件ID' }, { status: 400 });
    }

    let hasAccess = false;
    let file: any = null;

    // 如果有分享token，验证分享访问
    if (shareToken) {
      const share = await prisma.share.findUnique({
        where: {
          shareToken,
          isActive: true,
        },
        include: {
          snapshot: true, // 包含快照数据
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

      // 使用快照数据验证文件访问权限并获取文件信息
      let fileFromSnapshot: any = null;
      
      if (share.snapshot.type === 'file') {
        // 文件分享：检查是否是分享的文件
        const snapshotData = share.snapshot.snapshotData as any;
        if (snapshotData.id === fileId) {
          hasAccess = true;
          fileFromSnapshot = snapshotData;
        }
      } else if (share.snapshot.type === 'folder') {
        // 文件夹分享：检查文件是否在快照中
        const snapshotData = share.snapshot.snapshotData as any;
        fileFromSnapshot = getFileFromSnapshot(fileId, snapshotData);
        hasAccess = !!fileFromSnapshot;
      }

      if (!hasAccess || !fileFromSnapshot) {
        return NextResponse.json({ error: '无权访问此文件' }, { status: 403 });
      }

      // 获取存储源信息（从数据库）
      const storageSource = await prisma.storageSource.findUnique({
        where: { id: fileFromSnapshot.storageSourceId },
      });

      if (!storageSource) {
        return NextResponse.json({ error: '存储源不存在' }, { status: 404 });
      }

      // 构建文件对象（使用快照数据）
       file = {
         id: fileFromSnapshot.id,
         name: fileFromSnapshot.name,
         originalName: fileFromSnapshot.originalName,
         size: fileFromSnapshot.size,
         mimeType: fileFromSnapshot.mimeType,
         md5Hash: fileFromSnapshot.md5Hash || undefined,
         storagePath: fileFromSnapshot.storagePath,
         storageSource: storageSource,
         storageSourceId: fileFromSnapshot.storageSourceId,
         createdAt: new Date(fileFromSnapshot.createdAt),
         updatedAt: new Date(fileFromSnapshot.updatedAt),
       };
    } else {
      // 常规用户认证
      let token = request.headers.get('authorization')?.replace('Bearer ', '');

      // 如果没有 Authorization header，尝试从 URL 参数获取
      if (!token) {
        token = searchParams.get('token');
      }

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 创建一个新的请求对象，将token放入Authorization header
      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set('authorization', `Bearer ${token}`);

      const modifiedRequest = new NextRequest(request.url, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.body,
      });

      // 验证token并获取用户
      const user = await getCurrentUser(modifiedRequest);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { authorized } = await requirePermissions(modifiedRequest, ['files.read']);
      if (!authorized) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 获取文件信息
      file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { storageSource: true },
      });

      if (!file) {
        return NextResponse.json({ error: '文件不存在' }, { status: 404 });
      }

      hasAccess = true;
    }

    if (!file || !hasAccess) {
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
    console.error('Serve file error:', error);
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

// 从快照数据中获取文件信息
function getFileFromSnapshot(fileId: number, snapshotData: any): any | null {
  // 检查根级文件
  if (snapshotData.contents?.files) {
    for (const file of snapshotData.contents.files) {
      if (file.id === fileId) {
        return file;
      }
    }
  }

  // 递归检查子文件夹中的文件
  if (snapshotData.contents?.folders) {
    for (const folder of snapshotData.contents.folders) {
      const found = getFileFromFolderSnapshot(fileId, folder.children);
      if (found) {
        return found;
      }
    }
  }

  return null;
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

// 从文件夹快照中获取文件信息
function getFileFromFolderSnapshot(fileId: number, folderContents: any): any | null {
  // 检查当前文件夹的文件
  if (folderContents.files) {
    for (const file of folderContents.files) {
      if (file.id === fileId) {
        return file;
      }
    }
  }

  // 递归检查子文件夹
  if (folderContents.folders) {
    for (const folder of folderContents.folders) {
      const found = getFileFromFolderSnapshot(fileId, folder.children);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

// 获取文件夹路径的辅助函数
async function getFolderPath(folderId: number): Promise<string> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { path: true },
  });
  return folder?.path || '';
}