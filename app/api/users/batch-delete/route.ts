import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { permissionService } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 验证token并获取当前用户
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 检查权限
    if (
      !(await permissionService.hasPermission(
        currentUser.id,
        "user_management",
      ))
    ) {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "请选择要删除的用户" },
        { status: 400 },
      );
    }

    // 获取要删除的用户信息
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (usersToDelete.length === 0) {
      return NextResponse.json(
        { error: "未找到要删除的用户" },
        { status: 404 },
      );
    }

    // 检查是否包含Owner用户
    const hasOwner = usersToDelete.some((user: any) =>
      user.userRoles.some((ur: any) => ur.role.name === "Owner"),
    );

    if (hasOwner) {
      return NextResponse.json({ error: "不能删除Owner用户" }, { status: 400 });
    }

    // 检查是否包含当前用户
    if (userIds.includes(currentUser.id)) {
      return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
    }

    // 使用事务批量删除用户及其相关数据
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const deletedUsers = [];

      for (const userId of userIds) {
        // 删除用户相关的分享
        await tx.share.deleteMany({
          where: { createdBy: userId },
        });

        // 删除用户的文件
        await tx.file.deleteMany({
          where: { uploadedBy: userId },
        });

        // 删除用户的文件夹
        await tx.folder.deleteMany({
          where: { createdBy: userId },
        });

        // 删除用户角色关联
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // 删除邮件验证记录
        await tx.emailVerification.deleteMany({
          where: { userId },
        });

        // 删除邮件日志（注意：EmailLog表没有userId字段，需要通过email关联）
        const userToDelete = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (userToDelete) {
          await tx.emailLog.deleteMany({
            where: { email: userToDelete.email },
          });
        }

        // 删除权限日志
        await tx.permissionLog.deleteMany({
          where: { userId },
        });

        // 删除用户
        const deletedUser = await tx.user.delete({
          where: { id: userId },
        });

        deletedUsers.push(deletedUser);
      }

      return deletedUsers;
    });

    return NextResponse.json({
      message: `成功删除 ${result.length} 个用户`,
      deletedCount: result.length,
      deletedUsers: result.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
      })),
    });
  } catch (error) {
    console.error("批量删除用户失败:", error);

    return NextResponse.json(
      { error: "批量删除用户失败，请稍后重试" },
      { status: 500 },
    );
  }
}
