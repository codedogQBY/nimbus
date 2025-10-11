import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, validatePassword, generateToken, sanitizeUser } from '@/lib/auth';
import EmailService from '@/lib/email';

// 重置密码请求 Schema
const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入数据格式不正确', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = validation.data;

    // 3. 验证新密码强度
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 4. 验证验证码
    const emailService = new EmailService();
    const isValid = await emailService.verifyCode(email, code, 'reset_password');

    if (!isValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 5. 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 6. 更新密码
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // 7. 生成 JWT token（自动登录）
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
        message: '密码重置成功',
        token,
        user: sanitizeUser(user),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        error: '密码重置失败，请稍后重试',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

