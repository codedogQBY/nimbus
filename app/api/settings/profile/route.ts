import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取用户详细信息
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
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
    });

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Get profile error:", error);

    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 检查用户名是否已被其他用户使用
    if (validatedData.username !== user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "用户名已被使用" }, { status: 400 });
      }
    }

    // 更新用户资料
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: validatedData.username,
        avatarUrl: validatedData.avatarUrl || null,
        updatedAt: new Date(),
      },
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
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "资料更新成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Update profile error:", error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
