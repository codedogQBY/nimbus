import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// 处理文件删除时的分享逻辑（从文件删除API复制）
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
        await updateFolderSnapshotOnFileDelete(snapshot.id, fileId);
        updatedFolderShares++;
      }
    }
  } catch (error) {
    console.error("处理文件分享删除逻辑时出错:", error);
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

  return folderData;
}

// 更新文件夹分享快照，移除被删除的文件
async function updateFolderSnapshotOnFileDelete(
  snapshotId: number,
  deletedFileId: number,
) {
  try {
    const snapshot = await prisma.shareSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot || !snapshot.snapshotData) return;

    const snapshotData = snapshot.snapshotData as any;
    const updatedSnapshotData = removeFileFromFolder(
      snapshotData,
      deletedFileId,
    );

    await prisma.shareSnapshot.update({
      where: { id: snapshotId },
      data: {
        snapshotData: updatedSnapshotData,
      },
    });
  } catch (error) {
    console.error("更新文件夹快照时出错:", error);
  }
}

// 递归删除文件夹的所有内容（子文件夹和文件）
async function recursiveDeleteFolderContents(folderId: number) {
  try {
    // 1. 获取所有子文件夹
    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId },
      select: { id: true },
    });

    // 2. 递归删除每个子文件夹
    for (const subfolder of subfolders) {
      await recursiveDeleteFolderContents(subfolder.id);
      await handleSharesOnFolderDelete(subfolder.id);
      await prisma.folder.delete({
        where: { id: subfolder.id },
      });
    }

    // 3. 删除此文件夹中的所有文件
    const files = await prisma.file.findMany({
      where: { folderId: folderId },
      include: {
        storageSource: true,
      },
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
          where: { id: file.id },
        });
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
        // 继续删除其他文件，不因单个文件失败而停止
      }
    }

    console.log(
      `Deleted ${subfolders.length} subfolders and ${files.length} files from folder ${folderId}`,
    );
  } catch (error) {
    console.error(`Error in recursive delete for folder ${folderId}:`, error);
    throw error;
  }
}

// 从存储源删除文件的辅助函数
async function deleteFileFromStorage(file: any) {
  try {
    const { StorageAdapterFactory } = await import("@/lib/storage-adapters");
    const config = file.storageSource.config as Record<string, any>;
    const adapter = StorageAdapterFactory.create(
      file.storageSource.type as any,
      config,
    );

    if (adapter) {
      const deleteSuccess = await adapter.delete(file.storagePath);

      if (!deleteSuccess) {
        console.warn(`Failed to delete physical file: ${file.storagePath}`);
      }

      // 更新存储源使用量
      await prisma.storageSource.update({
        where: { id: file.storageSourceId },
        data: {
          quotaUsed: {
            decrement: Number(file.size), // 确保转换为Number
          },
        },
      });
    }
  } catch (error) {
    console.error(
      `Failed to delete file from storage: ${file.storagePath}`,
      error,
    );
    // 不抛出错误，允许数据库清理继续进行
  }
}
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
      if (snapshot.type === "folder") {
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
        type: "folder",
        originalFolderId: { not: folderId }, // 不是直接分享这个文件夹的
      },
    });

    for (const snapshot of allFolderSnapshots) {
      await updateFolderSnapshotOnFolderDelete(snapshot.id, folderId);
    }

    console.log(
      `处理了 ${shareSnapshots.length} 个直接分享和 ${allFolderSnapshots.length} 个包含此文件夹的分享`,
    );
  } catch (error) {
    console.error("处理文件夹分享删除逻辑时出错:", error);
    // 不抛出错误，避免影响文件夹删除的主流程
  }
}

// 递归函数：从文件夹结构中移除指定文件夹
function removeFolderFromSnapshot(
  folderData: any,
  deletedFolderId: number,
): any {
  if (!folderData) return folderData;

  // 如果有contents对象，递归处理
  if (folderData.contents) {
    // 处理子文件夹
    if (
      folderData.contents.folders &&
      Array.isArray(folderData.contents.folders)
    ) {
      folderData.contents.folders = folderData.contents.folders
        .filter((subfolder: any) => subfolder.id !== deletedFolderId)
        .map((subfolder: any) =>
          removeFolderFromSnapshot(subfolder, deletedFolderId),
        );
    }
  }

  return folderData;
}

// 更新文件夹分享快照，移除被删除的文件夹
async function updateFolderSnapshotOnFolderDelete(
  snapshotId: number,
  deletedFolderId: number,
) {
  try {
    const snapshot = await prisma.shareSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) return;

    const snapshotData = snapshot.snapshotData as any;

    // 更新快照数据
    const updatedSnapshotData = removeFolderFromSnapshot(
      snapshotData,
      deletedFolderId,
    );

    // 保存更新后的快照
    await prisma.shareSnapshot.update({
      where: { id: snapshotId },
      data: {
        snapshotData: updatedSnapshotData,
      },
    });

    console.log(`已从文件夹分享快照中移除文件夹 ID: ${deletedFolderId}`);
  } catch (error) {
    console.error("更新文件夹快照时出错:", error);
  }
}

// GET /api/folders/[id] - 获取文件夹详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ["files.view"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Get folder error:", error);

    return NextResponse.json(
      {
        error: "获取文件夹失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// DELETE /api/folders/[id] - 删除文件夹
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
    const folderId = parseInt(id);

    // 检查文件夹是否存在
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
    }

    // 递归删除子文件夹和文件
    await recursiveDeleteFolderContents(folderId);

    // 处理分享相关逻辑
    await handleSharesOnFolderDelete(folderId);

    // 最后删除文件夹本身
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete folder error:", error);

    return NextResponse.json(
      {
        error: "删除失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// PATCH /api/folders/[id] - 重命名文件夹
const updateFolderSchema = z.object({
  name: z.string().min(1).max(255),
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
    const folderId = parseInt(id);
    const body = await request.json();
    const validation = updateFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "参数错误", details: validation.error.issues },
        { status: 400 },
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
    console.error("Update folder error:", error);

    return NextResponse.json(
      {
        error: "更新失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
