import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import {
  verifyPassword,
  generateToken,
  sanitizeUser,
  logLogin,
  getClientIp,
  getUserAgent,
} from "@/lib/auth";
import EmailService from "@/lib/email";

// 登录请求验证 Schema
const loginSchema = z.object({
  identifier: z.string().min(1), // 用户名或邮箱
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "请提供用户名/邮箱和密码", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { identifier, password } = validation.data;
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // 3. 查找用户（支持用户名或邮箱）
    const isEmail = identifier.includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { username: identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 4. 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // 记录失败日志
      await logLogin(
        user.id,
        isEmail ? "email" : "username",
        ipAddress,
        userAgent,
        "failed",
        "密码错误",
      );

      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 5. 检查账号是否已激活
    if (!user.isActive) {
      // 重新发送验证邮件
      const emailService = new EmailService();

      try {
        await emailService.sendVerificationEmail(
          user.email,
          "register",
          user.id,
        );
      } catch (error) {
        console.error("Failed to resend verification email:", error);
      }

      return NextResponse.json(
        {
          success: false,
          error: "账号未激活，验证码已重新发送至您的邮箱",
          requireEmailVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    // 6. 生成 JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      isOwner: user.isOwner,
    });

    // 7. 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. 记录成功登录
    await logLogin(
      user.id,
      isEmail ? "email" : "username",
      ipAddress,
      userAgent,
      "success",
    );

    // 9. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        token,
        user: sanitizeUser(user),
        expiresIn: 7 * 24 * 60 * 60, // 7天，单位：秒
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "登录失败，请稍后重试",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
