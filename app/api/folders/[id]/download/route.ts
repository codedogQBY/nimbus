import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { StorageAdapterFactory, StorageType } from '@/lib/storage-adapters';

// 从快照数据中获取所有文件
async function getAllFilesFromSnapshot(contents: any, basePath: string = ''): Promise<Array<{ file: any; relativePath: string }>> {
  let files: Array<{ file: any; relativePath: string }> = [];
  
  // 添加当前层级的文件
  if (contents.files) {
    // 获取所有唯一的存储源ID
    const storageSourceIds = Array.from(new Set(contents.files.map((file: any) => file.storageSourceId)));
    
    // 批量获取存储源配置
    const storageSources = await prisma.storageSource.findMany({
      where: { id: { in: storageSourceIds } },
    });
    
    const storageSourceMap = new Map(storageSources.map((source: any) => [source.id, source]));
    
    files = contents.files.map((file: any) => ({
      file: {
        ...file,
        storageSource: storageSourceMap.get(file.storageSourceId) || { type: 'local', config: {} },
      },
      relativePath: basePath ? `${basePath}/${file.originalName}` : file.originalName,
    }));
  }
  
  // 递归处理子文件夹
  if (contents.folders) {
    for (const folder of contents.folders) {
      const subPath = basePath ? `${basePath}/${folder.name}` : folder.name;
      const subFiles = await getAllFilesFromSnapshot(folder.children, subPath);
      files = [...files, ...subFiles];
    }
  }
  
  return files;
}

// 递归获取文件夹下所有文件和子文件夹
async function getAllFilesInFolder(folderId: number, basePath: string = ''): Promise<Array<{ file: any; relativePath: string }>> {
  const files = await prisma.file.findMany({
    where: { folderId },
    include: { storageSource: true },
  });

  const subfolders = await prisma.folder.findMany({
    where: { parentId: folderId },
  });

  let allFiles = files.map(file => ({
    file,
    relativePath: basePath ? `${basePath}/${file.originalName}` : file.originalName,
  }));

  for (const subfolder of subfolders) {
    const subPath = basePath ? `${basePath}/${subfolder.name}` : subfolder.name;
    const subFiles = await getAllFilesInFolder(subfolder.id, subPath);
    allFiles = [...allFiles, ...subFiles];
  }

  return allFiles;
}

// GET /api/folders/[id]/download - 下载文件夹（打包为zip）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folderId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    const shareToken = searchParams.get('share');

    if (isNaN(folderId)) {
      return NextResponse.json({ error: '无效的文件夹ID' }, { status: 400 });
    }

    let hasAccess = false;
    let shareSnapshot: any = null;
    let folderName = '';

    // 如果有分享token，验证分享访问
    if (shareToken) {
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

      // 验证是否是文件夹分享且匹配
      const snapshotData = share.snapshot.snapshotData as any;
      if (share.snapshot.type === 'folder' && snapshotData.id === folderId) {
        hasAccess = true;
        shareSnapshot = snapshotData;
        folderName = snapshotData.name;
      }
    } else {
      // 常规用户认证
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 检查权限
      const { authorized } = await requirePermissions(request, ['files.download']);
      if (!authorized) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: '无权访问此文件夹' }, { status: 403 });
    }

    let allFiles: Array<{ file: any; relativePath: string }>;

    if (shareSnapshot) {
      // 分享模式：使用快照数据
      allFiles = await getAllFilesFromSnapshot(shareSnapshot.contents);
    } else {
      // 常规模式：从数据库查询
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
      }

      folderName = folder.name;
      allFiles = await getAllFilesInFolder(folderId);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: '文件夹为空' }, { status: 400 });
    }

    // 创建 ZIP 流
    const archive = archiver('zip', {
      zlib: { level: 6 } // 压缩级别
    });

    // 设置响应头
    const encodedFolderName = encodeURIComponent(folderName);
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedFolderName}.zip`,
      'Transfer-Encoding': 'chunked',
    });

    // 创建可读流
    const readableStream = new ReadableStream({
      start(controller) {
        archive.on('error', (err) => {
          console.error('Archive error:', err);
          controller.error(err);
        });

        archive.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        archive.on('end', () => {
          controller.close();
        });

        // 添加文件到压缩包
        addFilesToArchive(archive, allFiles).then(() => {
          archive.finalize();
        }).catch((err) => {
          console.error('Error adding files to archive:', err);
          controller.error(err);
        });
      }
    });

    return new Response(readableStream, { headers });
  } catch (error) {
    console.error('Download folder error:', error);
    return NextResponse.json(
      { error: '下载失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 添加文件到压缩包
async function addFilesToArchive(archive: archiver.Archiver, allFiles: Array<{ file: any; relativePath: string }>) {
  for (const { file, relativePath } of allFiles) {
    try {
      // 创建存储适配器
      const adapter = StorageAdapterFactory.create(
        file.storageSource.type as StorageType,
        file.storageSource.config
      );

      // 下载文件内容
      const fileBuffer = await adapter.download(file.storagePath);

      // 添加文件到压缩包
      archive.append(fileBuffer, { name: relativePath });
    } catch (error) {
      console.error(`Error adding file ${relativePath} to archive:`, error);
      // 继续处理其他文件，不让单个文件错误影响整个下载
    }
  }
}

