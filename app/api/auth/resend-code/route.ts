import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import EmailService from "@/lib/email";
import prisma from "@/lib/prisma";

// 重发验证码请求 Schema
const resendCodeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["register", "reset_password", "change_email"]),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入
    const validation = resendCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "输入数据格式不正确", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { email, type } = validation.data;

    // 3. 如果是注册类型，检查用户是否存在且未激活
    if (type === "register") {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isActive: true },
      });

      if (!user) {
        return NextResponse.json({ error: "该邮箱未注册" }, { status: 404 });
      }

      if (user.isActive) {
        return NextResponse.json(
          { error: "该账号已激活，请直接登录" },
          { status: 400 },
        );
      }
    }

    // 4. 发送验证邮件
    const emailService = new EmailService();

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      const { expiresAt } = await emailService.sendVerificationEmail(
        email,
        type,
        user?.id,
      );

      // 计算下次可发送时间（60秒后）
      const canResendAt = new Date(Date.now() + 60 * 1000).toISOString();

      return NextResponse.json(
        {
          success: true,
          message: "验证码已发送至您的邮箱",
          canResendAt,
          expiresAt: expiresAt.toISOString(),
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 如果是频率限制错误，返回特定错误
      if (errorMessage.includes("等待") || errorMessage.includes("次数过多")) {
        return NextResponse.json({ error: errorMessage }, { status: 429 });
      }

      return NextResponse.json(
        { error: "验证码发送失败，请稍后重试" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Resend code error:", error);

    return NextResponse.json(
      {
        error: "操作失败，请稍后重试",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
