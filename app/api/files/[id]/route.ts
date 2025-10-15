import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";
import { StorageAdapterFactory } from "@/lib/storage-adapters";

// 处理文件删除时的分享逻辑
async function handleSharesOnFileDelete(fileId: number) {
  try {
    // 1. 查找所有与此文件直接相关的分享快照（文件类型分享）
    const fileShareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        originalFileId: fileId,
        type: "file",
      },
      include: {
        share: true,
      },
    });

    // 删除文件类型的分享
    for (const snapshot of fileShareSnapshots) {
      console.log(`删除文件类型分享: ${snapshot.share.shareToken}`);
      await prisma.share.delete({
        where: { id: snapshot.shareId },
      });
    }

    // 2. 查找所有文件夹类型的分享快照，检查是否包含被删除的文件
    const folderShareSnapshots = await prisma.shareSnapshot.findMany({
      where: {
        type: "folder",
      },
      include: {
        share: true,
      },
    });

    let updatedFolderShares = 0;

    for (const snapshot of folderShareSnapshots) {
      // 检查快照数据中是否包含被删除的文件
      if (
        snapshot.snapshotData &&
        containsFile(snapshot.snapshotData, fileId)
      ) {
        console.log(`更新文件夹分享快照: ${snapshot.share.shareToken}`);
        await updateFolderSnapshotOnFileDelete(snapshot.id, fileId);
        updatedFolderShares++;
      }
    }

    console.log(
      `删除了 ${fileShareSnapshots.length} 个文件分享，更新了 ${updatedFolderShares} 个文件夹分享`,
    );
  } catch (error) {
    console.error("处理分享删除逻辑时出错:", error);
    // 不抛出错误，避免影响文件删除的主流程
  }
}

// 检查快照数据中是否包含指定的文件ID
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
    if (
      snapshotData.contents.files &&
      Array.isArray(snapshotData.contents.files)
    ) {
      if (snapshotData.contents.files.some((file: any) => file.id === fileId)) {
        return true;
      }
    }

    // 递归检查子文件夹
    if (
      snapshotData.contents.folders &&
      Array.isArray(snapshotData.contents.folders)
    ) {
      for (const subfolder of snapshotData.contents.folders) {
        if (containsFile(subfolder, fileId)) {
          return true;
        }
      }
    }
  }

  // 检查children对象（用于嵌套的子文件夹结构）
  if (snapshotData.children) {
    if (
      snapshotData.children.files &&
      Array.isArray(snapshotData.children.files)
    ) {
      if (snapshotData.children.files.some((file: any) => file.id === fileId)) {
        return true;
      }
    }

    if (
      snapshotData.children.folders &&
      Array.isArray(snapshotData.children.folders)
    ) {
      for (const subfolder of snapshotData.children.folders) {
        if (containsFile(subfolder, fileId)) {
          return true;
        }
      }
    }
  }

  return false;
}

// 递归函数：从文件夹结构中移除指定文件
function removeFileFromFolder(folderData: any, deletedFileId: number): any {
  if (!folderData) return folderData;

  // 处理根级别的files数组
  if (folderData.files && Array.isArray(folderData.files)) {
    folderData.files = folderData.files.filter(
      (file: any) => file.id !== deletedFileId,
    );
  }

  // 处理contents对象中的files数组
  if (folderData.contents) {
    if (folderData.contents.files && Array.isArray(folderData.contents.files)) {
      folderData.contents.files = folderData.contents.files.filter(
        (file: any) => file.id !== deletedFileId,
      );
    }

    // 递归处理子文件夹
    if (
      folderData.contents.folders &&
      Array.isArray(folderData.contents.folders)
    ) {
      folderData.contents.folders = folderData.contents.folders.map(
        (subfolder: any) => {
          // 递归处理子文件夹的children属性
          if (subfolder.children) {
            subfolder.children = removeFileFromFolder(
              subfolder.children,
              deletedFileId,
            );
          }

          return subfolder;
        },
      );
    }
  }

  // 处理children对象（用于嵌套的子文件夹结构）
  if (folderData.children) {
    if (folderData.children.files && Array.isArray(folderData.children.files)) {
      folderData.children.files = folderData.children.files.filter(
        (file: any) => file.id !== deletedFileId,
      );
    }

    if (
      folderData.children.folders &&
      Array.isArray(folderData.children.folders)
    ) {
      folderData.children.folders = folderData.children.folders.map(
        (subfolder: any) => removeFileFromFolder(subfolder, deletedFileId),
      );
    }
  }

  return folderData;
}

// 重新计算文件夹快照的统计信息
function recalculateStats(contents: any): {
  files: number;
  folders: number;
  size: number;
} {
  if (!contents) return { files: 0, folders: 0, size: 0 };

  let files = 0;
  let folders = 0;
  let size = 0;

  // 计算当前级别的文件
  if (contents.files && Array.isArray(contents.files)) {
    files += contents.files.length;
    size += contents.files.reduce(
      (sum: number, file: any) => sum + (file.size || 0),
      0,
    );
  }

  // 计算当前级别的文件夹
  if (contents.folders && Array.isArray(contents.folders)) {
    folders += contents.folders.length;

    // 递归计算子文件夹
    for (const subfolder of contents.folders) {
      if (subfolder.children) {
        const subStats = recalculateStats(subfolder.children);

        files += subStats.files;
        folders += subStats.folders;
        size += subStats.size;
      }
    }
  }

  return { files, folders, size };
}

// 更新文件夹分享快照，移除被删除的文件
async function updateFolderSnapshotOnFileDelete(
  snapshotId: number,
  deletedFileId: number,
) {
  try {
    // 获取当前快照数据
    const snapshot = await prisma.shareSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot || !snapshot.snapshotData) {
      console.log(`快照 ${snapshotId} 不存在或数据为空`);

      return;
    }

    const snapshotData = snapshot.snapshotData as any;

    // 从快照数据中移除被删除的文件
    const updatedSnapshotData = removeFileFromFolder(
      snapshotData,
      deletedFileId,
    );

    // 重新计算统计信息
    if (updatedSnapshotData.contents) {
      const stats = recalculateStats(updatedSnapshotData.contents);

      updatedSnapshotData.totalFiles = stats.files;
      updatedSnapshotData.totalFolders = stats.folders;
      updatedSnapshotData.totalSize = stats.size;
    }

    // 保存更新后的快照
    await prisma.shareSnapshot.update({
      where: { id: snapshotId },
      data: {
        snapshotData: updatedSnapshotData,
      },
    });

    console.log(
      `已从文件夹分享快照中移除文件 ID: ${deletedFileId}，并更新了统计信息`,
    );
  } catch (error) {
    console.error("更新文件夹快照时出错:", error);
  }
}

// DELETE /api/files/[id] - 删除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ["files.delete"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const fileId = parseInt(id);

    // 获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { storageSource: true },
    });

    if (!file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 删除实际的物理文件
    try {
      const config = file.storageSource.config as Record<string, any>;
      const adapter = StorageAdapterFactory.create(
        file.storageSource.type as any,
        config,
      );

      if (adapter) {
        // 使用存储路径，不需要去掉前缀
        const filePath = file.storagePath;

        const deleteSuccess = await adapter.delete(filePath);

        if (!deleteSuccess) {
          console.warn(`Failed to delete physical file: ${file.storagePath}`);
        }
      }
    } catch (error) {
      console.error("Error deleting physical file:", error);
      // 继续执行数据库删除，即使物理文件删除失败
    }

    // 处理分享相关逻辑
    await handleSharesOnFileDelete(fileId);

    // 删除文件记录
    await prisma.file.delete({
      where: { id: fileId },
    });

    // 更新存储源使用量，确保不会变成负数
    const storageSource = await prisma.storageSource.findUnique({
      where: { id: file.storageSource.id },
      select: { quotaUsed: true },
    });

    if (storageSource) {
      const currentUsed = Number(storageSource.quotaUsed);
      const fileSize = Number(file.size);
      const newUsed = Math.max(0, currentUsed - fileSize); // 确保不为负数

      await prisma.storageSource.update({
        where: { id: file.storageSource.id },
        data: {
          quotaUsed: newUsed,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);

    return NextResponse.json(
      {
        error: "删除失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ["files.edit"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const fileId = parseInt(id);
    const body = await request.json();
    const validation = updateFileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "参数错误", details: validation.error.issues },
        { status: 400 },
      );
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      file: {
        ...updatedFile,
        size: Number(updatedFile.size), // 转换BigInt为Number
      },
    });
  } catch (error) {
    console.error("Update file error:", error);

    return NextResponse.json(
      {
        error: "更新失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
