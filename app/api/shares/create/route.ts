import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

// POST /api/shares/create - 创建分享
const createShareSchema = z.object({
  fileId: z.number().optional(),
  folderId: z.number().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
  downloadLimit: z.number().optional(),
}).refine(
  (data) => data.fileId || data.folderId,
  { message: '必须指定文件或文件夹' }
);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorized } = await requirePermissions(request, ['shares.create']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createShareSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: '参数错误', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { fileId, folderId, password, expiresAt, downloadLimit } = validation.data;

    // 验证文件或文件夹存在
    if (fileId) {
      const file = await prisma.file.findUnique({ where: { id: fileId } });
      if (!file) {
        return NextResponse.json({ error: '文件不存在' }, { status: 404 });
      }
    }

    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) {
        return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
      }
    }

    // 生成唯一的分享token
    const shareToken = nanoid(10);

    // 如果有密码，进行哈希
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // 创建分享
    const share = await prisma.share.create({
      data: {
        shareToken,
        fileId: fileId || null,
        folderId: folderId || null,
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        downloadLimit: downloadLimit || null,
        createdBy: user.id,
      },
      include: {
        file: {
          select: {
            name: true,
          },
        },
        folder: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      share: {
        id: share.id,
        shareToken: share.shareToken,
        name: share.file?.name || share.folder?.name || '未知',
        type: share.file ? 'file' : 'folder',
        hasPassword: !!passwordHash,
        expiresAt: share.expiresAt,
        shareUrl: `${request.nextUrl.origin}/s/${share.shareToken}`,
      },
    });
  } catch (error) {
    console.error('Create share error:', error);
    return NextResponse.json(
      { error: '创建分享失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

