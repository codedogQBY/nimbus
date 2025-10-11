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

    // 获取所有用户及其角色
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
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isOwner: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 格式化用户数据（兼容旧格式）
    const usersWithRoles = users.map((user: any) => ({
      ...user,
      avatar_url: user.avatarUrl,
      is_owner: user.isOwner,
      is_active: user.isActive,
      roles: user.userRoles.map((ur: any) => ur.role.name),
    }));

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

