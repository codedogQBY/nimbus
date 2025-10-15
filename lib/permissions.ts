import { NextRequest } from "next/server";

import prisma from "./prisma";
import { getCurrentUser } from "./auth";

/**
 * 权限检查服务
 */
export class PermissionService {
  private permissionCache: Map<number, Set<string>> = new Map();

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean> {
    // 检查所有者权限
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOwner: true },
    });

    if (user?.isOwner) {
      return true; // 所有者拥有所有权限
    }

    // 从缓存获取用户权限
    let userPermissions = this.permissionCache.get(userId);

    if (!userPermissions) {
      userPermissions = await this.loadUserPermissions(userId);
      this.permissionCache.set(userId, userPermissions);
    }

    return userPermissions.has(permissionName);
  }

  /**
   * 加载用户的所有权限（合并所有角色的权限）
   */
  private async loadUserPermissions(userId: number): Promise<Set<string>> {
    const permissions = await prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: {
                  userId,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
              },
            },
          },
        },
      },
      select: {
        name: true,
      },
    });

    return new Set(permissions.map((p: { name: string }) => p.name));
  }

  /**
   * 批量检查权限（AND关系）
   */
  async hasPermissions(
    userId: number,
    permissionNames: string[],
  ): Promise<boolean> {
    for (const permission of permissionNames) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查用户是否拥有任一权限（OR关系）
   */
  async hasAnyPermission(
    userId: number,
    permissionNames: string[],
  ): Promise<boolean> {
    for (const permission of permissionNames) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const permissions = await prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: {
                  userId,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
              },
            },
          },
        },
      },
      select: {
        name: true,
        displayName: true,
        description: true,
      },
    });

    return permissions.map((p: { name: string }) => p.name);
  }

  /**
   * 获取用户的所有角色
   */
  async getUserRoles(userId: number) {
    return await prisma.role.findMany({
      where: {
        userRoles: {
          some: {
            userId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        priority: true,
      },
      orderBy: {
        priority: "desc",
      },
    });
  }

  /**
   * 为用户分配角色
   */
  async assignRole(
    userId: number,
    roleId: number,
    grantedBy: number,
    expiresAt?: Date,
  ): Promise<void> {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {
        grantedBy,
        expiresAt,
      },
      create: {
        userId,
        roleId,
        grantedBy,
        expiresAt,
      },
    });

    // 清除缓存
    this.permissionCache.delete(userId);
  }

  /**
   * 移除用户角色
   */
  async removeRole(userId: number, roleId: number): Promise<void> {
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    // 清除缓存
    this.permissionCache.delete(userId);
  }

  /**
   * 记录权限检查日志
   */
  async logPermissionCheck(
    userId: number,
    action: string,
    resourceType: string,
    resourceId: number | null,
    permissionRequired: string,
    granted: boolean,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    await prisma.permissionLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        permissionRequired,
        granted,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * 清除用户权限缓存
   */
  clearCache(userId?: number): void {
    if (userId) {
      this.permissionCache.delete(userId);
    } else {
      this.permissionCache.clear();
    }
  }
}

// 单例实例
export const permissionService = new PermissionService();

/**
 * 权限检查中间件助手
 */
export async function requirePermissions(
  request: NextRequest,
  permissions: string[],
): Promise<{ authorized: boolean; userId?: number; error?: string }> {
  const user = await getCurrentUser(request);

  if (!user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const hasPermission = await permissionService.hasPermissions(
    user.id,
    permissions,
  );

  if (!hasPermission) {
    return { authorized: false, userId: user.id, error: "Forbidden" };
  }

  return { authorized: true, userId: user.id };
}

/**
 * 任一权限检查中间件助手
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: string[],
): Promise<{ authorized: boolean; userId?: number; error?: string }> {
  const user = await getCurrentUser(request);

  if (!user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const hasPermission = await permissionService.hasAnyPermission(
    user.id,
    permissions,
  );

  if (!hasPermission) {
    return { authorized: false, userId: user.id, error: "Forbidden" };
  }

  return { authorized: true, userId: user.id };
}
