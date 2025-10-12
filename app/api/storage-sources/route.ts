import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';

// GET /api/storage-sources - 获取所有存储源
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['storage.view']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 获取所有存储源
    const sources = await prisma.storageSource.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 计算总配额
    const totalQuota = sources.reduce((sum: number, s: any) => sum + Number(s.quotaLimit), 0);
    const usedQuota = sources.reduce((sum: number, s: any) => sum + Number(s.quotaUsed), 0);

    // 统计文件数量
    const fileCounts = await Promise.all(
      sources.map(async (source: any) => ({
        sourceId: source.id,
        count: await prisma.file.count({
          where: { storageSourceId: source.id },
        }),
      }))
    );

    const sourcesWithStats = sources.map((source: any) => ({
      ...source,
      fileCount: fileCounts.find((fc: any) => fc.sourceId === source.id)?.count || 0,
      quotaUsed: Number(source.quotaUsed),
      quotaLimit: Number(source.quotaLimit),
    }));

    return NextResponse.json({
      sources: sourcesWithStats,
      totalQuota: Number(totalQuota),
      usedQuota: Number(usedQuota),
      totalSources: sources.length,
      activeSources: sources.filter((s: any) => s.isActive).length,
    });
  } catch (error) {
    console.error('Get storage sources error:', error);
    return NextResponse.json(
      { error: '获取存储源失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/storage-sources - 创建存储源
const createStorageSourceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['local', 'r2', 'qiniu', 'minio', 'upyun', 'telegram', 'cloudinary', 'github', 'custom']),
  config: z.any(),
  priority: z.number().int().min(0).max(100).optional(),
  quotaLimit: z.number().int().min(0).optional(),
});

// PUT /api/storage-sources - 修改存储源
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    await requirePermissions(request, ['storage.manage']);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: '存储源ID是必需的' }, { status: 400 });
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      type: z.enum(['local', 'r2', 'qiniu', 'minio', 'upyun', 'telegram', 'cloudinary', 'github', 'custom']).optional(),
      config: z.any().optional(),
      priority: z.number().int().min(0).max(100).optional(),
      quotaLimit: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    });

    const validatedData = updateSchema.parse(updateData);

    const updatedSource = await prisma.storageSource.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    // 转换 BigInt 为 Number
    const sourceData = {
      ...updatedSource,
      quotaUsed: Number(updatedSource.quotaUsed),
      quotaLimit: Number(updatedSource.quotaLimit),
    };

    return NextResponse.json({
      success: true,
      data: sourceData,
      message: '存储源更新成功'
    });

  } catch (error) {
    console.error('Update storage source error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: '数据验证失败', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: '更新存储源失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['storage.manage']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createStorageSourceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入数据格式不正确', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, type, config, priority, quotaLimit } = validation.data;

    // 创建存储源
    const source: any = await prisma.storageSource.create({
      data: {
        name,
        type,
        config,
        priority: priority || 0,
        quotaLimit: quotaLimit || 10 * 1024 * 1024 * 1024, // 默认10GB
      },
    });

    // 转换 BigInt 为 Number
    const sourceData = {
      ...source,
      quotaUsed: Number(source.quotaUsed),
      quotaLimit: Number(source.quotaLimit),
    };

    return NextResponse.json(
      { success: true, source: sourceData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create storage source error:', error);
    return NextResponse.json(
      { error: '创建存储源失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

