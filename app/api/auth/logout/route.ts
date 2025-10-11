import { NextResponse } from 'next/server';

export async function POST() {
  // JWT 是无状态的，登出主要在客户端清除 token
  // 这里提供一个端点供客户端调用，可以在此添加额外的登出逻辑
  // 比如：将 token 加入黑名单、清理 session 等

  return NextResponse.json(
    {
      success: true,
      message: '退出登录成功',
    },
    { status: 200 }
  );
}

