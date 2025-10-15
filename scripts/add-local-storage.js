const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

async function addLocalStorageSource() {
  try {
    // 检查是否已经存在本地存储源
    const existingLocal = await prisma.storageSource.findFirst({
      where: { type: "local" },
    });

    if (existingLocal) {
      console.log("本地存储源已存在，跳过创建");
      return;
    }

    // 创建本地存储目录
    const storageDir = path.join(process.cwd(), "storage");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
      console.log(`创建存储目录: ${storageDir}`);
    }

    // 配置
    const config = {
      basePath: storageDir,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: [
        "image/*",
        "video/*",
        "audio/*",
        "application/pdf",
        "text/*",
      ],
    };

    // 创建本地存储源
    const localSource = await prisma.storageSource.create({
      data: {
        name: "本地存储",
        type: "local",
        config: config, // 直接使用配置对象，不加密
        isActive: true,
        priority: 1, // 最高优先级
        quotaUsed: 0,
        quotaLimit: 10 * 1024 * 1024 * 1024, // 10GB 默认配额
      },
    });

    console.log("成功创建本地存储源:", localSource);
  } catch (error) {
    console.error("创建本地存储源失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addLocalStorageSource();
}

module.exports = { addLocalStorageSource };
