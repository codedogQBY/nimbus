import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { permissionService } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // 1. 获取当前用户
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 获取用户角色
    const roles = await permissionService.getUserRoles(user.id);

    // 3. 获取用户权限
    const permissions = await permissionService.getUserPermissions(user.id);

    // 4. 返回用户信息
    return NextResponse.json(
      {
        user,
        roles,
        permissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      {
        error: '获取用户信息失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

