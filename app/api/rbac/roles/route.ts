import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// GET /api/rbac/roles - 获取所有角色
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, [
      "permissions.view",
    ]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const stats = {
      total: roles.length,
      systemRoles: roles.filter((r) => r.isSystem).length,
      customRoles: roles.filter((r) => !r.isSystem).length,
    };

    return NextResponse.json({ roles, stats });
  } catch (error) {
    console.error("Get roles error:", error);

    return NextResponse.json(
      {
        error: "获取角色列表失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// POST /api/rbac/roles - 创建新角色
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, [
      "permissions.manage",
    ]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "角色名称不能为空" }, { status: 400 });
    }

    // 检查角色名是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json({ error: "角色名称已存在" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: false,
      },
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("Create role error:", error);

    return NextResponse.json(
      {
        error: "创建角色失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
