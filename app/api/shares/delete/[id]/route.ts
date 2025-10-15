import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requirePermissions } from "@/lib/permissions";

// DELETE /api/shares/delete/[id] - 删除分享
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查权限
    const { authorized } = await requirePermissions(request, ["shares.manage"]);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const shareId = parseInt(id);

    if (isNaN(shareId)) {
      return NextResponse.json({ error: "无效的分享ID" }, { status: 400 });
    }

    // 检查分享是否存在且属于当前用户
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      return NextResponse.json({ error: "分享不存在" }, { status: 404 });
    }

    if (share.createdBy !== user.id) {
      return NextResponse.json({ error: "无权删除此分享" }, { status: 403 });
    }

    // 删除分享
    await prisma.share.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true, message: "分享已删除" });
  } catch (error) {
    console.error("Delete share error:", error);

    return NextResponse.json(
      {
        error: "删除分享失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
