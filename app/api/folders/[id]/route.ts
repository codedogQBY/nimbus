import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { z } from 'zod';

// DELETE /api/folders/[id] - 删除文件夹
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
    const folderId = parseInt(id);

    // 检查文件夹是否存在
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
    }

    // TODO: 递归删除子文件夹和文件

    // 删除文件夹
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: '删除失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/folders/[id] - 重命名文件夹
const updateFolderSchema = z.object({
  name: z.string().min(1).max(255),
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
    const folderId = parseInt(id);
    const body = await request.json();
    const validation = updateFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '参数错误', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { name: validation.data.name },
    });

    return NextResponse.json({
      success: true,
      folder: updatedFolder,
    });
  } catch (error) {
    console.error('Update folder error:', error);
    return NextResponse.json(
      { error: '更新失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

