import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/shares/[token]/contents - 获取分享文件夹内容（使用快照数据）
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;

    // 验证分享token并获取快照
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

    if (!share.snapshot) {
      return NextResponse.json({ error: '分享数据不完整' }, { status: 404 });
    }

    // 只有文件夹分享才能获取内容
    if (share.snapshot.type !== 'folder') {
      return NextResponse.json({ error: '此分享不是文件夹' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');
    const snapshotData = share.snapshot.snapshotData as any;

    // 如果没有指定folderId，返回根文件夹内容
    if (!folderId) {
      return NextResponse.json({
        currentFolder: {
          id: snapshotData.id,
          name: snapshotData.name,
          path: snapshotData.path,
        },
        breadcrumbs: [{
          id: snapshotData.id,
          name: snapshotData.name,
          path: snapshotData.path,
        }],
        folders: snapshotData.contents.folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          createdAt: folder.createdAt,
        })),
        files: snapshotData.contents.files,
        stats: {
          folderCount: snapshotData.contents.folders.length,
          fileCount: snapshotData.contents.files.length,
          totalSize: snapshotData.contents.files.reduce((sum: number, file: any) => sum + file.size, 0),
        },
      });
    }

    // 如果指定了folderId，在快照中查找对应文件夹
    const targetFolderId = parseInt(folderId);
    if (isNaN(targetFolderId)) {
      return NextResponse.json({ error: '无效的文件夹ID' }, { status: 400 });
    }

    const folderData = findFolderInSnapshot(targetFolderId, snapshotData);
    if (!folderData) {
      return NextResponse.json({ error: '文件夹不存在或无权访问' }, { status: 404 });
    }

    // 构建面包屑导航
    const breadcrumbs = buildBreadcrumbs(targetFolderId, snapshotData);

    return NextResponse.json({
      currentFolder: {
        id: folderData.id,
        name: folderData.name,
        path: folderData.path,
      },
      breadcrumbs,
      folders: folderData.children.folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
      })),
      files: folderData.children.files,
      stats: {
        folderCount: folderData.children.folders.length,
        fileCount: folderData.children.files.length,
        totalSize: folderData.children.files.reduce((sum: number, file: any) => sum + file.size, 0),
      },
    });
  } catch (error) {
    console.error('Get share contents error:', error);
    return NextResponse.json(
      { error: '获取文件夹内容失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 在快照数据中查找指定的文件夹
function findFolderInSnapshot(folderId: number, snapshotData: any): any | null {
  // 检查是否是根文件夹
  if (snapshotData.id === folderId) {
    return {
      id: snapshotData.id,
      name: snapshotData.name,
      path: snapshotData.path,
      children: snapshotData.contents,
    };
  }

  // 递归查找子文件夹
  return findFolderInContents(folderId, snapshotData.contents);
}

// 在文件夹内容中递归查找
function findFolderInContents(folderId: number, contents: any): any | null {
  if (!contents.folders) return null;

  for (const folder of contents.folders) {
    if (folder.id === folderId) {
      return folder;
    }

    // 递归查找子文件夹
    const found = findFolderInContents(folderId, folder.children);
    if (found) return found;
  }

  return null;
}

// 构建面包屑导航
function buildBreadcrumbs(targetFolderId: number, snapshotData: any): any[] {
  const breadcrumbs: any[] = [];

  function findPath(folderId: number, contents: any, path: any[]): boolean {
    // 检查是否是根文件夹
    if (snapshotData.id === folderId) {
      breadcrumbs.push(...path, {
        id: snapshotData.id,
        name: snapshotData.name,
        path: snapshotData.path,
      });
      return true;
    }

    if (!contents.folders) return false;

    for (const folder of contents.folders) {
      if (folder.id === folderId) {
        breadcrumbs.push(...path, {
          id: folder.id,
          name: folder.name,
          path: folder.path,
        });
        return true;
      }

      // 递归查找
      if (findPath(folderId, folder.children, [...path, {
        id: folder.id,
        name: folder.name,
        path: folder.path,
      }])) {
        return true;
      }
    }

    return false;
  }

  // 从根开始查找路径
  findPath(targetFolderId, snapshotData.contents, [{
    id: snapshotData.id,
    name: snapshotData.name,
    path: snapshotData.path,
  }]);

  return breadcrumbs;
}