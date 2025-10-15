import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

// POST /api/shares/[token]/view - 记录分享访问
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = await params;

    const share = await prisma.share.findUnique({
      where: {
        shareToken: token,
        isActive: true,
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: "分享不存在或已失效" },
        { status: 404 },
      );
    }

    // 检查是否过期
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: "分享已过期" }, { status: 410 });
    }

    // 增加访问计数（如果数据库有viewCount字段）
    try {
      await prisma.share.update({
        where: { id: share.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      // 如果viewCount字段不存在，静默处理错误
      console.log("ViewCount field may not exist in database:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record view error:", error);

    // 访问记录失败不应阻止用户访问分享
    return NextResponse.json({ success: true });
  }
}
