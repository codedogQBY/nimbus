import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, validateUsername, validateEmail, validatePassword, getClientIp, getUserAgent } from '@/lib/auth';
import EmailService from '@/lib/email';

// 注册请求验证 Schema
const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    
    // 2. 验证输入
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '输入数据格式不正确', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { username, email, password } = validation.data;

    // 3. 验证用户名格式
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    // 4. 验证邮箱格式
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // 5. 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 6. 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: '用户名已被使用' },
        { status: 409 }
      );
    }

    // 7. 检查邮箱是否已注册
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (existingEmail) {
      if (existingEmail.isActive) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 409 }
        );
      } else {
        // 如果账号存在但未激活，删除旧账号重新注册
        await prisma.user.delete({
          where: { id: existingEmail.id },
        });
      }
    }

    // 8. 加密密码
    const passwordHash = await hashPassword(password);

    // 9. 创建未激活的用户账号
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isActive: false,
      },
    });

    // 10. 发送验证邮件
    const emailService = new EmailService();
    try {
      await emailService.sendVerificationEmail(email, 'register', user.id);
    } catch (error) {
      // 如果邮件发送失败，删除用户并返回错误
      await prisma.user.delete({ where: { id: user.id } });
      
      return NextResponse.json(
        { 
          error: '验证邮件发送失败，请检查邮箱地址或稍后重试',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

    // 11. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: '注册成功，验证码已发送至您的邮箱',
        email,
        verificationRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: '注册失败，请稍后重试',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

