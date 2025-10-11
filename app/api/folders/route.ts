import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';

// POST /api/folders - 创建文件夹
const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.number().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ['files.upload']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '参数错误', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, parentId } = validation.data;

    // 检查同级目录是否有重名
    const existing = await prisma.folder.findFirst({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: '文件夹已存在' }, { status: 400 });
    }

    // 构建路径
    let folderPath = `/${name}`;
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (parentFolder) {
        folderPath = `${parentFolder.path}/${name}`;
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        path: folderPath,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: '创建失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

