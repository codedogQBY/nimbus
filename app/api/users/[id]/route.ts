import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermissions } from '@/lib/permissions';

// DELETE /api/users/[id] - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ['users.manage']);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 });
    }

    // 不能删除自己
    if (targetUserId === user.id) {
      return NextResponse.json({ error: '不能删除自己的账号' }, { status: 403 });
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        filesUploaded: {
          select: { id: true },
        },
        foldersCreated: {
          select: { id: true },
        },
        sharesCreated: {
          select: { id: true },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 不能删除Owner用户
    if (targetUser.isOwner) {
      return NextResponse.json({ error: '不能删除Owner用户' }, { status: 403 });
    }

    // 使用事务删除用户及其相关数据
    await prisma.$transaction(async (tx: typeof prisma) => {
      // 1. 删除用户的分享
      if (targetUser.sharesCreated.length > 0) {
        await tx.share.deleteMany({
          where: { createdBy: targetUserId },
        });
      }

      // 2. 删除用户的文件（注意：这里只删除数据库记录，不删除物理文件）
      // 在实际应用中，可能需要将文件转移给其他用户或删除物理文件
      if (targetUser.filesUploaded.length > 0) {
        await tx.file.deleteMany({
          where: { uploadedBy: targetUserId },
        });
      }

      // 3. 删除用户的文件夹
      if (targetUser.foldersCreated.length > 0) {
        await tx.folder.deleteMany({
          where: { createdBy: targetUserId },
        });
      }

      // 4. 删除用户角色关联
      if (targetUser.userRoles.length > 0) {
        await tx.userRole.deleteMany({
          where: { userId: targetUserId },
        });
      }

      // 5. 删除邮件验证记录
      await tx.emailVerification.deleteMany({
        where: { userId: targetUserId },
      });

      // 6. 删除邮件日志记录（通过邮箱删除）
      await tx.emailLog.deleteMany({
        where: { email: targetUser.email },
      });

      // 7. 删除权限日志记录
      await tx.permissionLog.deleteMany({
        where: { userId: targetUserId },
      });

      // 8. 最后删除用户
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: '用户删除成功',
      deletedUser: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { 
        error: '删除用户失败', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// GET /api/users/[id] - 获取单个用户信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            filesUploaded: true,
            foldersCreated: true,
            sharesCreated: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 格式化用户数据
    const userWithRoles = {
      ...targetUser,
      roles: targetUser.userRoles.map((ur: any) => ur.role.name),
      stats: targetUser._count,
    };

    return NextResponse.json({ user: userWithRoles });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        error: '获取用户信息失败', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}