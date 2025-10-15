/**
 * Owner 用户初始化脚本
 * 根据环境变量创建第一个 Owner 账号
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function initOwner() {
  console.log("🔧 开始初始化 Owner 用户...\n");

  // 检查是否已有用户
  const existingUserCount = await prisma.user.count();

  if (existingUserCount > 0) {
    console.log("⚠️  数据库中已存在用户，跳过初始化");
    console.log(`   当前用户数: ${existingUserCount}`);

    const owner = await prisma.user.findFirst({
      where: { isOwner: true },
      select: { username: true, email: true },
    });

    if (owner) {
      console.log(`   Owner 用户: ${owner.username} (${owner.email})`);
    }

    return;
  }

  // 从环境变量读取配置
  const username = process.env.INIT_OWNER_USERNAME || "admin";
  const email = process.env.INIT_OWNER_EMAIL || "admin@example.com";
  const password = process.env.INIT_OWNER_PASSWORD;

  if (!password) {
    console.error("❌ 错误：未设置 INIT_OWNER_PASSWORD 环境变量");
    console.log("\n请在 .env.local 中设置：");
    console.log('INIT_OWNER_PASSWORD="YourStrongPassword123"');
    process.exit(1);
  }

  // 验证密码强度
  if (password.length < 8) {
    console.error("❌ 错误：密码长度至少为8个字符");
    process.exit(1);
  }

  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    console.error("❌ 错误：密码必须包含大写字母、小写字母和数字");
    process.exit(1);
  }

  try {
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建 Owner 用户
    const owner = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isOwner: true,
        isActive: true,
      },
    });

    console.log("✅ Owner 用户创建成功！");
    console.log(`   用户名: ${owner.username}`);
    console.log(`   邮箱: ${owner.email}`);
    console.log(`   ID: ${owner.id}`);

    // 分配 Owner 角色
    const ownerRole = await prisma.role.findUnique({
      where: { name: "owner" },
    });

    if (ownerRole) {
      await prisma.userRole.create({
        data: {
          userId: owner.id,
          roleId: ownerRole.id,
          grantedBy: owner.id,
        },
      });
      console.log("✅ Owner 角色分配成功");
    } else {
      console.warn("⚠️  警告：未找到 Owner 角色，请先运行 pnpm db:seed");
    }

    console.log("\n🎉 初始化完成！");
    console.log("\n📝 登录信息：");
    console.log(`   用户名: ${username}`);
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log("\n⚠️  请妥善保管登录信息，并尽快修改密码！");
  } catch (error) {
    console.error("❌ 初始化失败:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        console.log("\n可能的原因：");
        console.log("- 用户名或邮箱已存在");
        console.log("- 请检查数据库或修改环境变量");
      }
    }

    process.exit(1);
  }
}

initOwner()
  .catch((e) => {
    console.error("❌ 脚本执行失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
