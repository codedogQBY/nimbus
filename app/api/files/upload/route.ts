import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { nanoid } from 'nanoid';
import { StorageAdapterFactory, StorageType } from '@/lib/storage-adapters';

// POST /api/files/upload - 上传文件
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['files.upload']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;
    const relativePath = formData.get('relativePath') as string | null;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    // 如果有relativePath，需要创建对应的文件夹结构
    let targetFolderId = folderId ? parseInt(folderId) : null;

    if (relativePath) {
      // 解析路径并创建文件夹结构
      const pathParts = relativePath.split('/').filter(p => p);
      pathParts.pop(); // 移除文件名，只保留文件夹路径

      let currentFolderId = targetFolderId;
      let currentPath = targetFolderId ?
        (await prisma.folder.findUnique({ where: { id: targetFolderId } }))?.path || '/' :
        '/';

      for (const folderName of pathParts) {
        const folderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;

        // 检查文件夹是否存在（更严格的唯一性检查）
        let folder = await prisma.folder.findFirst({
          where: {
            name: folderName,
            parentId: currentFolderId,
            path: folderPath,
          },
        });

        // 不存在则创建
        if (!folder) {
          // 使用 upsert 来避免竞争条件
          try {
            folder = await prisma.folder.create({
              data: {
                name: folderName,
                path: folderPath,
                parentId: currentFolderId,
                createdBy: user.id,
              },
            });
          } catch (error: any) {
            // 如果创建失败（可能是并发创建），再次查询
            if (error.code === 'P2002') { // Unique constraint violation
              folder = await prisma.folder.findFirst({
                where: {
                  name: folderName,
                  parentId: currentFolderId,
                  path: folderPath,
                },
              });
              if (!folder) {
                throw error; // 如果仍然找不到，抛出原始错误
              }
            } else {
              throw error;
            }
          }
        }

        currentFolderId = folder.id;
        currentPath = folderPath;
      }

      targetFolderId = currentFolderId;
    }

    // 获取默认存储源（优先级最高的活跃存储源）
    const storageSource = await prisma.storageSource.findFirst({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    if (!storageSource) {
      return NextResponse.json({ error: '没有可用的存储源' }, { status: 500 });
    }

    // 检查存储源配额
    const currentUsed = Number(storageSource.quotaUsed);
    const quotaLimit = Number(storageSource.quotaLimit);
    const fileSize = file.size;

    if (currentUsed + fileSize > quotaLimit) {
      return NextResponse.json({ error: '存储空间不足' }, { status: 400 });
    }

    // 生成文件名（保留原始名称，处理重名冲突）
    const originalName = file.name;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // 检查同一文件夹下是否有重名文件
    let finalName = originalName;
    let counter = 1;
    
    while (true) {
      const existingFile = await prisma.file.findFirst({
        where: {
          name: finalName,
          folderId: targetFolderId,
          uploadedBy: user.id,
        },
      });
      
      if (!existingFile) {
        break;
      }
      
      // 如果重名，添加数字后缀
      finalName = `${baseName}(${counter})${ext}`;
      counter++;
    }
    
    // 为物理存储生成唯一标识符（避免文件系统冲突）
    const storageFileName = `${nanoid()}-${Date.now()}${path.extname(originalName)}`;

    // 使用存储适配器上传文件
    console.log('Creating storage adapter for:', storageSource.type, 'with config keys:', Object.keys(storageSource.config));
    const adapter = StorageAdapterFactory.create(storageSource.type as StorageType, storageSource.config);

    // 对于本地存储，需要先初始化
    if (storageSource.type === 'local' && typeof (adapter as any).initialize === 'function') {
      await (adapter as any).initialize();
    }

    console.log('Starting upload with adapter:', adapter.name, 'file:', storageFileName);

    // 读取文件内容一次，用于上传和哈希计算
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 创建一个新的File对象以避免重复读取
    const uploadFile = new File([fileBuffer], file.name, { type: file.type });

    const uploadResult = await adapter.upload(uploadFile, storageFileName);
    console.log('Upload result:', uploadResult);

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error || '上传失败' }, { status: 500 });
    }

    // 计算文件哈希
    const crypto = await import('crypto');
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // 保存文件信息到数据库
    const savedFile = await prisma.file.create({
      data: {
        name: finalName,
        originalName: file.name,
        size: BigInt(fileSize),
        mimeType: file.type || 'application/octet-stream',
        md5Hash: md5Hash,
        storagePath: uploadResult.path || storageFileName,
        storageSourceId: storageSource.id,
        folderId: targetFolderId,
        uploadedBy: user.id,
      },
    });

    // 更新存储源使用量
    await prisma.storageSource.update({
      where: { id: storageSource.id },
      data: {
        quotaUsed: BigInt(currentUsed + fileSize),
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        name: savedFile.name,
        originalName: savedFile.originalName,
        size: Number(savedFile.size),
        mimeType: savedFile.mimeType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '上传失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 配置上传大小限制（100MB）
export const config = {
  api: {
    bodyParser: false,
  },
};

