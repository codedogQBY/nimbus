import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// POST /api/rbac/assign - 为用户分配角色
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["users.manage"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleName } = body;

    if (!userId || !roleName) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 不能修改Owner用户的角色
    if (targetUser.isOwner) {
      return NextResponse.json(
        { error: "不能修改Owner用户的角色" },
        { status: 403 },
      );
    }

    // 获取角色
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 检查用户是否已有此角色
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId: role.id,
      },
    });

    if (existingUserRole) {
      return NextResponse.json({ error: "用户已拥有此角色" }, { status: 400 });
    }

    // 分配角色
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        grantedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      userRole: {
        id: userRole.id,
        userId: userRole.userId,
        roleId: userRole.roleId,
      },
    });
  } catch (error) {
    console.error("Assign role error:", error);

    return NextResponse.json(
      {
        error: "角色分配失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// DELETE /api/rbac/assign - 移除用户角色
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["users.manage"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleName } = body;

    if (!userId || !roleName) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 不能修改Owner用户的角色
    if (targetUser.isOwner) {
      return NextResponse.json(
        { error: "不能修改Owner用户的角色" },
        { status: 403 },
      );
    }

    // 获取角色
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 });
    }

    // 删除用户角色关联
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke role error:", error);

    return NextResponse.json(
      {
        error: "移除角色失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
