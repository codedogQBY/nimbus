import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

import prisma from "./prisma";

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// JWT Payload类型
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  isOwner: boolean;
  iat?: number;
  exp?: number;
}

// 用户类型（去除敏感信息）
export interface SafeUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOwner: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * 生成JWT Token
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * 从请求头中提取Token
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return null;
  }

  // 支持 "Bearer <token>" 格式
  const parts = authHeader.split(" ");

  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }

  return authHeader;
}

/**
 * 从请求中获取当前用户
 */
export async function getCurrentUser(
  request: NextRequest,
): Promise<SafeUser | null> {
  try {
    const token = extractToken(request);

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        isOwner: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return { valid: false, error: "密码长度至少为8个字符" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "密码必须包含至少一个大写字母" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "密码必须包含至少一个小写字母" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "密码必须包含至少一个数字" };
  }

  return { valid: true };
}

/**
 * 验证用户名
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return {
      valid: false,
      error: "用户名只能包含字母、数字和下划线，长度3-20个字符",
    };
  }

  return { valid: true };
}

/**
 * 验证邮箱
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "邮箱格式不正确" };
  }

  return { valid: true };
}

/**
 * 记录登录历史
 */
export async function logLogin(
  userId: number,
  loginMethod: "username" | "email",
  ipAddress: string | null,
  userAgent: string | null,
  status: "success" | "failed" | "blocked",
  failureReason?: string,
): Promise<void> {
  await prisma.loginHistory.create({
    data: {
      userId,
      loginMethod,
      ipAddress,
      userAgent,
      status,
      failureReason,
    },
  });
}

/**
 * 清理用户敏感信息
 */
export function sanitizeUser(user: any): SafeUser {
  const { passwordHash, ...safeUser } = user;

  return safeUser;
}

/**
 * 生成随机Token
 */
export function generateRandomToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * 获取客户端IP地址
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * 获取User Agent
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent");
}
