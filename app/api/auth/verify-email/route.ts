import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { generateToken, sanitizeUser } from "@/lib/auth";
import EmailService from "@/lib/email";

// 验证邮箱请求 Schema
const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入
    const validation = verifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "输入数据格式不正确", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { email, code } = validation.data;

    // 3. 验证验证码
    const emailService = new EmailService();
    const isValid = await emailService.verifyCode(email, code, "register");

    if (!isValid) {
      return NextResponse.json(
        { error: "验证码错误或已过期" },
        { status: 400 },
      );
    }

    // 4. 激活用户账号
    await prisma.user.update({
      where: { email },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // 5. 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 6. 为首个注册用户自动设置为 Owner
    const userCount = await prisma.user.count({
      where: { isActive: true },
    });

    if (userCount === 1) {
      // 第一个用户设置为 Owner
      await prisma.user.update({
        where: { id: user.id },
        data: { isOwner: true },
      });

      // 分配 Owner 角色
      const ownerRole = await prisma.role.findUnique({
        where: { name: "owner" },
      });

      if (ownerRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: ownerRole.id,
            grantedBy: user.id,
          },
        });
      }

      user.isOwner = true;
    } else {
      // 其他用户默认分配 Viewer 角色
      const viewerRole = await prisma.role.findUnique({
        where: { name: "viewer" },
      });

      if (viewerRole) {
        // 获取 Owner 用户ID
        const owner = await prisma.user.findFirst({
          where: { isOwner: true },
        });

        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: viewerRole.id,
            grantedBy: owner?.id || user.id,
          },
        });
      }
    }

    // 7. 生成 JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      isOwner: user.isOwner,
    });

    // 8. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: "邮箱验证成功",
        token,
        user: sanitizeUser(user),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      {
        error: "验证失败，请稍后重试",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
