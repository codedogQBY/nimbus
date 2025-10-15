import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";
import { StorageAdapterFactory, StorageType } from "@/lib/storage-adapters";

// POST /api/storage-sources/test - 测试存储源连接
const testStorageSourceSchema = z.object({
  type: z.enum([
    "local",
    "r2",
    "qiniu",
    "minio",
    "upyun",
    "telegram",
    "cloudinary",
    "github",
    "custom",
  ]),
  config: z.any(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = testStorageSourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "输入数据格式不正确", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { type, config } = validation.data;

    try {
      // 创建存储适配器
      const adapter = StorageAdapterFactory.create(type as StorageType, config);

      // 对于需要初始化的适配器（本地存储、R2等），先进行初始化
      if (typeof (adapter as any).initialize === "function") {
        try {
          await (adapter as any).initialize();
        } catch (initError) {
          console.error("Adapter initialization failed:", initError);

          return NextResponse.json({
            success: false,
            connected: false,
            message: "适配器初始化失败",
            error:
              initError instanceof Error
                ? initError.message
                : String(initError),
          });
        }
      }

      // 测试连接
      const isConnected = await adapter.testConnection();

      return NextResponse.json({
        success: true,
        connected: isConnected,
        message: isConnected ? "连接测试成功" : "连接测试失败",
      });
    } catch (error) {
      console.error("Storage connection test error:", error);

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
