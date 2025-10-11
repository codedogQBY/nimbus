import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { nanoid } from 'nanoid';

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

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
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

    // 生成唯一文件名
    const ext = path.extname(file.name);
    const uniqueName = `${nanoid()}-${Date.now()}${ext}`;
    
    // 本地存储路径（临时方案，后续对接真实存储）
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件到本地
    await writeFile(filePath, new Uint8Array(buffer));

    // TODO: 计算文件哈希
    const md5Hash = Buffer.from(bytes).toString('hex').substring(0, 32);

    // 保存文件信息到数据库
    const savedFile = await prisma.file.create({
      data: {
        name: uniqueName,
        originalName: file.name,
        size: BigInt(fileSize),
        mimeType: file.type || 'application/octet-stream',
        md5Hash: md5Hash,
        storagePath: `/uploads/${uniqueName}`,
        storageSourceId: storageSource.id,
        folderId: folderId ? parseInt(folderId) : null,
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

