import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// POST /api/folders/[id]/move - 移动文件夹
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["files.edit"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const folderId = parseInt(id);
    const body = await request.json();
    const { targetFolderId } = body;

    // 获取文件夹信息
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
    }

    // 检查目标文件夹是否存在
    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
      });

      if (!targetFolder) {
        return NextResponse.json(
          { error: "目标文件夹不存在" },
          { status: 404 },
        );
      }

      // 检查是否试图将文件夹移动到自己或子文件夹中
      let checkFolder: typeof targetFolder | null = targetFolder;

      while (checkFolder) {
        if (checkFolder.id === folderId) {
          return NextResponse.json(
            { error: "不能将文件夹移动到自己或子文件夹中" },
            { status: 400 },
          );
        }
        if (checkFolder.parentId) {
          checkFolder = await prisma.folder.findUnique({
            where: { id: checkFolder.parentId },
          });
        } else {
          break;
        }
      }
    }

    // 计算新路径
    let newPath = "/";

    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
      });

      newPath =
        targetFolder!.path === "/"
          ? `/${folder.name}`
          : `${targetFolder!.path}/${folder.name}`;
    } else {
      newPath = `/${folder.name}`;
    }

    // 递归更新所有子文件夹的路径
    const updateFolderPaths = async (folderId: number, newBasePath: string) => {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) return;

      // 更新当前文件夹
      await prisma.folder.update({
        where: { id: folderId },
        data: { path: newBasePath },
      });

      // 递归更新子文件夹
      const subfolders = await prisma.folder.findMany({
        where: { parentId: folderId },
      });

      for (const subfolder of subfolders) {
        const subPath =
          newBasePath === "/"
            ? `/${subfolder.name}`
            : `${newBasePath}/${subfolder.name}`;

        await updateFolderPaths(subfolder.id, subPath);
      }
    };

    // 更新文件夹的父ID
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        parentId: targetFolderId || null,
        path: newPath,
      },
    });

    // 更新所有子文件夹的路径
    await updateFolderPaths(folderId, newPath);

    return NextResponse.json({
      success: true,
      folder: {
        id: folderId,
        name: folder.name,
        path: newPath,
        parentId: targetFolderId || null,
      },
    });
  } catch (error) {
    console.error("Move folder error:", error);

    return NextResponse.json(
      {
        error: "移动失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
