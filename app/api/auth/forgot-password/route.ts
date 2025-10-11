import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import EmailService from '@/lib/email';

// 忘记密码请求 Schema
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '请提供有效的邮箱地址', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 3. 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    // 4. 无论用户是否存在，都返回相同的响应（安全考虑）
    const emailService = new EmailService();
    
    if (user && user.isActive) {
      try {
        await emailService.sendVerificationEmail(email, 'reset_password', user.id);
      } catch (error) {
        console.error('Failed to send reset password email:', error);
        // 不向用户暴露发送失败的具体原因
      }
    }

    // 5. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: '如果该邮箱已注册，重置密码的验证码已发送至您的邮箱',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        error: '操作失败，请稍后重试',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

