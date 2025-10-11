import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';

// GET /api/folders/[id]/download - 下载文件夹（打包为zip）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['files.download']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const folderId = parseInt(id);

    // 获取文件夹信息
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
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

    const allFiles = await getAllFilesInFolder(folderId);

    if (allFiles.length === 0) {
      return NextResponse.json({ error: '文件夹为空' }, { status: 400 });
    }

    // 创建 ZIP 流
    const archive = archiver('zip', {
      zlib: { level: 9 } // 压缩级别
    });

    // 添加所有文件到 ZIP
    for (const { file, relativePath } of allFiles) {
      try {
        const filePath = path.join(process.cwd(), file.file.storagePath);
        const fileBuffer = await readFile(filePath);
        archive.append(fileBuffer, { name: relativePath });
      } catch (error) {
        console.error(`Error adding file ${relativePath}:`, error);
        // 继续处理其他文件
      }
    }

    // 完成归档
    archive.finalize();

    // 将 archiver 流转换为 web stream
    const stream = Readable.toWeb(archive as any) as ReadableStream;

    // 返回 ZIP 文件
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(folder.name)}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download folder error:', error);
    return NextResponse.json(
      { error: '下载失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

