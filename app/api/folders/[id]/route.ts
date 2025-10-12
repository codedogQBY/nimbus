import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { z } from 'zod';

// 处理文件夹删除时的分享逻辑
async function handleSharesOnFolderDelete(folderId: number) {
  try {
    // 1. 查找所有与此文件夹相关的分享快照
    const shareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        originalFolderId: folderId,
      },
      include: {
        share: true,
      },
    });

    for (const snapshot of shareSnapshots) {
      if (snapshot.type === 'folder') {
        // 文件夹类型分享：删除整个分享链接
        console.log(`删除文件夹类型分享: ${snapshot.share.shareToken}`);
        await prisma.share.delete({
          where: { id: snapshot.shareId },
        });
      }
    }

    // 2. 查找包含此文件夹的其他文件夹分享，并从快照中移除
    const allFolderSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        type: 'folder',
        originalFolderId: { not: folderId }, // 不是直接分享这个文件夹的
      },
    });

    for (const snapshot of allFolderSnapshots) {
      await updateFolderSnapshotOnFolderDelete(snapshot.id, folderId);
    }

    console.log(`处理了 ${shareSnapshots.length} 个直接分享和 ${allFolderSnapshots.length} 个包含此文件夹的分享`);
  } catch (error) {
    console.error('处理文件夹分享删除逻辑时出错:', error);
    // 不抛出错误，避免影响文件夹删除的主流程
  }
}

// 递归函数：从文件夹结构中移除指定文件夹
function removeFolderFromSnapshot(folderData: any, deletedFolderId: number): any {
  if (!folderData) return folderData;

  // 如果有contents对象，递归处理
  if (folderData.contents) {
    // 处理子文件夹
    if (folderData.contents.folders && Array.isArray(folderData.contents.folders)) {
      folderData.contents.folders = folderData.contents.folders
        .filter((subfolder: any) => subfolder.id !== deletedFolderId)
        .map((subfolder: any) => removeFolderFromSnapshot(subfolder, deletedFolderId));
    }
  }

  return folderData;
}

// 更新文件夹分享快照，移除被删除的文件夹
async function updateFolderSnapshotOnFolderDelete(snapshotId: number, deletedFolderId: number) {
  try {
    const snapshot = await prisma.shareSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) return;

    const snapshotData = snapshot.snapshotData as any;
    
    // 更新快照数据
    const updatedSnapshotData = removeFolderFromSnapshot(snapshotData, deletedFolderId);

    // 保存更新后的快照
    await prisma.shareSnapshot.update({
      where: { id: snapshotId },
      data: {
        snapshotData: updatedSnapshotData,
      },
    });

    console.log(`已从文件夹分享快照中移除文件夹 ID: ${deletedFolderId}`);
  } catch (error) {
    console.error('更新文件夹快照时出错:', error);
  }
}

// GET /api/folders/[id] - 获取文件夹详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ['files.view']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const folderId = parseInt(id);

    // 获取文件夹详情
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        creator: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            files: true,
            children: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Get folder error:', error);
    return NextResponse.json(
      { error: '获取文件夹失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

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

    // 处理分享相关逻辑
    await handleSharesOnFolderDelete(folderId);

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

