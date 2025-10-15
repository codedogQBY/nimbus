import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";
import { StorageAdapterFactory, StorageType } from "@/lib/storage-adapters";
import prisma from "@/lib/prisma";

// POST /api/storage-sources/[id]/test - 测试现有存储源连接
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, [
      "storage.manage",
    ]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const sourceId = parseInt(id);

    if (isNaN(sourceId)) {
      return NextResponse.json({ error: "无效的存储源ID" }, { status: 400 });
    }

    // 获取存储源
    const source = await prisma.storageSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json({ error: "存储源不存在" }, { status: 404 });
    }

    try {
      console.log("Testing storage source:", {
        id: sourceId,
        type: source.type,
        config: source.config,
        configType: typeof source.config,
      });

      // 确保配置是一个对象
      let config = source.config;

      if (typeof config === "string") {
        try {
          config = JSON.parse(config);
        } catch (parseError) {
          throw new Error(`Invalid config format: ${parseError}`);
        }
      }

      // 对于本地存储，确保有默认配置
      if (source.type === "local" && (!config || !config.basePath)) {
        config = {
          basePath: "./storage",
          maxFileSize: 100 * 1024 * 1024,
          ...config,
        };
        console.log("Using default local storage config:", config);
      }

      // 创建存储适配器
      const adapter = StorageAdapterFactory.create(
        source.type as StorageType,
        config,
      );

      // 对于本地存储，需要先初始化
      if (
        source.type === "local" &&
        typeof (adapter as any).initialize === "function"
      ) {
        await (adapter as any).initialize();
      }

      // 测试连接
      const isConnected = await adapter.testConnection();

      // 更新存储源的状态
      await prisma.storageSource.update({
        where: { id: sourceId },
        data: { isActive: isConnected },
      });

      return NextResponse.json({
        success: true,
        connected: isConnected,
        message: isConnected ? "连接测试成功" : "连接测试失败",
      });
    } catch (error) {
      console.error("Storage connection test error:", error);

      // 更新存储源状态为离线
      await prisma.storageSource.update({
        where: { id: sourceId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: false,
        connected: false,
        message: "连接测试失败",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    console.error("Test storage source error:", error);

    return NextResponse.json(
      {
        error: "测试存储源失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
