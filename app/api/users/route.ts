import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions, permissionService } from '@/lib/permissions';

// GET /api/users - 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['users.view']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        isOwner: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isOwner: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 获取每个用户的角色
    const usersWithRoles = await Promise.all(
      users.map(async (user: any) => {
        const roles = await permissionService.getUserRoles(user.id);
        return {
          ...user,
          roles: roles.map((r: any) => r.displayName),
        };
      })
    );

    // 统计数据
    const stats = {
      total: users.length,
      active: users.filter((u: any) => u.isActive).length,
      owners: users.filter((u: any) => u.isOwner).length,
      lastDay: users.filter((u: any) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return u.lastLoginAt && u.lastLoginAt > yesterday;
      }).length,
    };

    return NextResponse.json({
      users: usersWithRoles,
      stats,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

