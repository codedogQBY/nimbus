#!/bin/bash

echo "🚀 Nimbus 快速启动脚本"
echo "====================="
echo ""

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ 错误：需要 Node.js 18+ 版本"
  echo "当前版本：$(node -v)"
  echo "建议使用 nvm: nvm use 20"
  exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查PostgreSQL环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  警告：未设置 DATABASE_URL 环境变量"
  echo "请在 .env.local 中配置数据库连接"
  echo ""
  echo "示例："
  echo 'DATABASE_URL="postgresql://nimbus:password@localhost:5432/nimbus"'
  echo ""
  read -p "是否继续？(y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 生成Prisma客户端
echo "📦 生成 Prisma 客户端..."
pnpm db:generate
if [ $? -ne 0 ]; then
  echo "❌ Prisma 客户端生成失败"
  exit 1
fi
echo ""

# 推送数据库结构
echo "🗄️  推送数据库结构..."
read -p "是否推送数据库结构到PostgreSQL？(y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm db:push
  if [ $? -ne 0 ]; then
    echo "❌ 数据库推送失败"
    echo "请检查数据库连接配置"
    exit 1
  fi
  echo ""
fi

# 运行种子数据
echo "🌱 运行种子数据..."
read -p "是否运行种子数据？(y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm db:seed
  if [ $? -ne 0 ]; then
    echo "❌ 种子数据运行失败"
    exit 1
  fi
  echo ""
fi

echo "✅ 初始化完成！"
echo ""
echo "📝 下一步："
echo "   1. 配置 .env.local 文件（如果还没有）"
echo "   2. 运行 pnpm dev 启动开发服务器"
echo "   3. 访问 http://localhost:3000"
echo ""
echo "🎉 开始使用 Nimbus！"

