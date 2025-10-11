import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';

// GET /api/rbac/permissions - 获取所有权限
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['permissions.view']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: '获取权限列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

