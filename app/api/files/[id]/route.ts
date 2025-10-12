import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { z } from 'zod';
import { StorageAdapterFactory } from '@/lib/storage-adapters';

// DELETE /api/files/[id] - 删除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ['files.delete']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const fileId = parseInt(id);

    // 获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { storageSource: true },
    });

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 删除实际的物理文件
    try {
      const config = file.storageSource.config as Record<string, any>;
      const adapter = StorageAdapterFactory.create(file.storageSource.type as any, config);
      if (adapter) {
        // 使用存储路径，不需要去掉前缀
        const filePath = file.storagePath;

        const deleteSuccess = await adapter.delete(filePath);
        if (!deleteSuccess) {
          console.warn(`Failed to delete physical file: ${file.storagePath}`);
        }
      }
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // 继续执行数据库删除，即使物理文件删除失败
    }

    // 删除文件记录
    await prisma.file.delete({
      where: { id: fileId },
    });

    // 更新存储源使用量
    await prisma.storageSource.update({
      where: { id: file.storageSourceId },
      data: {
        quotaUsed: {
          decrement: file.size,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: '删除失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/files/[id] - 重命名文件
const updateFileSchema = z.object({
  originalName: z.string().min(1).max(255).optional(),
  folderId: z.number().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ['files.edit']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const fileId = parseInt(id);
    const body = await request.json();
    const validation = updateFileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '参数错误', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      file: updatedFile,
    });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: '更新失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

