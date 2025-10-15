import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { z } from 'zod';
import { StorageAdapterFactory } from '@/lib/storage-adapters';

// 批量删除请求验证
const batchDeleteSchema = z.object({
  fileIds: z.array(z.number()).optional().default([]),
  folderIds: z.array(z.number()).optional().default([]),
});

// 处理文件删除时的分享逻辑
async function handleSharesOnFileDelete(fileId: number) {
  try {
    // 1. 查找所有与此文件直接相关的分享快照（文件类型分享）
    const fileShareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        originalFileId: fileId,
        type: 'file',
      },
      include: {
        share: true,
      },
    });

    // 删除文件类型的分享
    for (const snapshot of fileShareSnapshots) {
      await prisma.share.delete({
        where: { id: snapshot.shareId },
      });
    }

    // 2. 查找所有文件夹类型的分享快照，检查是否包含被删除的文件
    const folderShareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        type: 'folder',
      },
      include: {
        share: true,
      },
    });

    for (const snapshot of folderShareSnapshots) {
      // 检查快照数据中是否包含被删除的文件
      if (snapshot.snapshotData && containsFile(snapshot.snapshotData, fileId)) {
        await updateFolderSnapshotOnFileDelete(snapshot.id, fileId);
      }
    }
  } catch (error) {
    console.error('处理文件分享删除逻辑时出错:', error);
    // 不抛出错误，避免影响文件删除的主流程
  }
}

// 处理文件夹删除时的分享逻辑
async function handleSharesOnFolderDelete(folderId: number) {
  try {
    // 1. 查找所有与此文件夹直接相关的分享快照（文件夹类型分享）
    const folderShareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        originalFolderId: folderId,
        type: 'folder',
      },
      include: {
        share: true,
      },
    });

    // 删除文件夹类型的分享
    for (const snapshot of folderShareSnapshots) {
      await prisma.share.delete({
        where: { id: snapshot.shareId },
      });
    }

    // 2. 查找所有其他文件夹类型的分享快照，检查是否包含被删除的文件夹
    const otherFolderShareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        type: 'folder',
        originalFolderId: {
          not: folderId,
        },
      },
      include: {
        share: true,
      },
    });

    for (const snapshot of otherFolderShareSnapshots) {
      // 检查快照数据中是否包含被删除的文件夹
      if (snapshot.snapshotData && containsFolder(snapshot.snapshotData, folderId)) {
        await updateFolderSnapshotOnFolderDelete(snapshot.id, folderId);
      }
    }
  } catch (error) {
    console.error('处理文件夹分享删除逻辑时出错:', error);
    // 不抛出错误，避免影响文件夹删除的主流程
  }
}

// 检查快照数据中是否包含指定文件
function containsFile(snapshotData: any, fileId: number): boolean {
  if (!snapshotData) return false;

  // 检查根级别的files数组
  if (snapshotData.files && Array.isArray(snapshotData.files)) {
    if (snapshotData.files.some((file: any) => file.id === fileId)) {
      return true;
    }
  }

  // 检查contents对象中的files数组
  if (snapshotData.contents) {
    if (snapshotData.contents.files && Array.isArray(snapshotData.contents.files)) {
      if (snapshotData.contents.files.some((file: any) => file.id === fileId)) {
        return true;
      }
    }

    // 递归检查子文件夹
    if (snapshotData.contents.folders && Array.isArray(snapshotData.contents.folders)) {
      for (const subfolder of snapshotData.contents.folders) {
        if (subfolder.children && containsFile(subfolder.children, fileId)) {
          return true;
        }
      }
    }
  }

  return false;
}

// 检查快照数据中是否包含指定文件夹
function containsFolder(snapshotData: any, folderId: number): boolean {
  if (!snapshotData) return false;

  // 检查contents对象中的folders数组
  if (snapshotData.contents && snapshotData.contents.folders && Array.isArray(snapshotData.contents.folders)) {
    for (const subfolder of snapshotData.contents.folders) {
      if (subfolder.id === folderId) {
        return true;
      }
      // 递归检查子文件夹
      if (subfolder.children && containsFolder(subfolder.children, folderId)) {
        return true;
      }
    }
  }

  return false;
}

// 更新文件夹快照，移除指定文件
async function updateFolderSnapshotOnFileDelete(snapshotId: number, deletedFileId: number) {
  try {
    const snapshot = await prisma.shareSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot || !snapshot.snapshotData) return;

    const updatedData = removeFileFromFolder(snapshot.snapshotData, deletedFileId);

    await prisma.shareSnapshot.update({
      where: { id: snapshotId },
      data: {
        snapshotData: updatedData,
      },
    });
  } catch (error) {
    console.error(`更新分享快照 ${snapshotId} 时出错:`, error);
  }
}

// 更新文件夹快照，移除指定文件夹
async function updateFolderSnapshotOnFolderDelete(snapshotId: number, deletedFolderId: number) {
  try {
    const snapshot = await prisma.shareSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot || !snapshot.snapshotData) return;

    const updatedData = removeFolderFromSnapshot(snapshot.snapshotData, deletedFolderId);

    await prisma.shareSnapshot.update({
      where: { id: snapshotId },
      data: {
        snapshotData: updatedData,
      },
    });
  } catch (error) {
    console.error(`更新分享快照 ${snapshotId} 时出错:`, error);
  }
}

// 递归函数：从文件夹结构中移除指定文件
function removeFileFromFolder(folderData: any, deletedFileId: number): any {
  if (!folderData) return folderData;

  // 处理根级别的files数组
  if (folderData.files && Array.isArray(folderData.files)) {
    folderData.files = folderData.files.filter((file: any) => file.id !== deletedFileId);
  }

  // 处理contents对象中的files数组
  if (folderData.contents) {
    if (folderData.contents.files && Array.isArray(folderData.contents.files)) {
      folderData.contents.files = folderData.contents.files.filter((file: any) => file.id !== deletedFileId);
    }

    // 递归处理子文件夹
    if (folderData.contents.folders && Array.isArray(folderData.contents.folders)) {
      folderData.contents.folders = folderData.contents.folders.map((subfolder: any) => {
        if (subfolder.children) {
          subfolder.children = removeFileFromFolder(subfolder.children, deletedFileId);
        }
        return subfolder;
      });
    }
  }

  return folderData;
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

// 递归删除文件夹的所有内容（子文件夹和文件）
async function recursiveDeleteFolderContents(folderId: number) {
  try {
    // 1. 获取所有子文件夹
    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId },
      select: { id: true }
    });

    // 2. 递归删除每个子文件夹
    for (const subfolder of subfolders) {
      await recursiveDeleteFolderContents(subfolder.id);
      await handleSharesOnFolderDelete(subfolder.id);
      await prisma.folder.delete({
        where: { id: subfolder.id }
      });
    }

    // 3. 删除此文件夹中的所有文件
    const files = await prisma.file.findMany({
      where: { folderId: folderId },
      include: {
        storageSource: true
      }
    });

    // 删除每个文件（包括存储源中的实际文件）
    for (const file of files) {
      try {
        // 处理文件的分享相关逻辑
        await handleSharesOnFileDelete(file.id);

        // 从存储源删除实际文件
        await deleteFileFromStorage(file);

        // 从数据库删除文件记录
        await prisma.file.delete({
          where: { id: file.id }
        });
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
        // 继续删除其他文件，不因单个文件失败而停止
      }
    }

    console.log(`Deleted ${subfolders.length} subfolders and ${files.length} files from folder ${folderId}`);
  } catch (error) {
    console.error(`Error in recursive delete for folder ${folderId}:`, error);
    throw error;
  }
}

// 从存储源删除文件的辅助函数
async function deleteFileFromStorage(file: any) {
  try {
    const config = file.storageSource.config as Record<string, any>;
    const adapter = StorageAdapterFactory.create(file.storageSource.type as any, config);

    if (adapter) {
      const deleteSuccess = await adapter.delete(file.storagePath);
      if (!deleteSuccess) {
        console.warn(`Failed to delete physical file: ${file.storagePath}`);
      }

      // 更新存储源使用量，确保不会变成负数
      const storageSource = await prisma.storageSource.findUnique({
        where: { id: file.storageSourceId },
        select: { quotaUsed: true }
      });
      
      if (storageSource) {
        const currentUsed = Number(storageSource.quotaUsed);
        const fileSize = Number(file.size);
        const newUsed = Math.max(0, currentUsed - fileSize); // 确保不为负数
        
        await prisma.storageSource.update({
          where: { id: file.storageSourceId },
          data: {
            quotaUsed: newUsed,
          },
        });
      }
    }
  } catch (error) {
    console.error(`Failed to delete file from storage: ${file.storagePath}`, error);
    // 不抛出错误，允许数据库清理继续进行
  }
}

// POST /api/files/batch-delete - 批量删除文件和文件夹
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ['files.delete']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { fileIds, folderIds } = batchDeleteSchema.parse(body);

    if (fileIds.length === 0 && folderIds.length === 0) {
      return NextResponse.json({ error: '请选择要删除的文件或文件夹' }, { status: 400 });
    }

    const results = {
      deletedFiles: 0,
      deletedFolders: 0,
      errors: [] as string[],
    };

    // 删除文件
    for (const fileId of fileIds) {
      try {
        // 获取文件信息
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          include: { storageSource: true },
        });

        if (!file) {
          results.errors.push(`文件 ID ${fileId} 不存在`);
          continue;
        }

        // 删除实际的物理文件
        try {
          await deleteFileFromStorage(file);
        } catch (error) {
          console.error('Error deleting physical file:', error);
          // 继续执行数据库删除，即使物理文件删除失败
        }

        // 处理分享相关逻辑
        await handleSharesOnFileDelete(fileId);

        // 删除文件记录
        await prisma.file.delete({
          where: { id: fileId },
        });

        results.deletedFiles++;
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
        results.errors.push(`删除文件 ID ${fileId} 失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 删除文件夹
    for (const folderId of folderIds) {
      try {
        // 检查文件夹是否存在
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
        });

        if (!folder) {
          results.errors.push(`文件夹 ID ${folderId} 不存在`);
          continue;
        }

        // 递归删除子文件夹和文件
        await recursiveDeleteFolderContents(folderId);

        // 处理分享相关逻辑
        await handleSharesOnFolderDelete(folderId);

        // 最后删除文件夹本身
        await prisma.folder.delete({
          where: { id: folderId },
        });

        results.deletedFolders++;
      } catch (error) {
        console.error(`Error deleting folder ${folderId}:`, error);
        results.errors.push(`删除文件夹 ID ${folderId} 失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `成功删除 ${results.deletedFiles} 个文件和 ${results.deletedFolders} 个文件夹${results.errors.length > 0 ? `，${results.errors.length} 个项目删除失败` : ''}`,
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    return NextResponse.json(
      { error: '批量删除失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}