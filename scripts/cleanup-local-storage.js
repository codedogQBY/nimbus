const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupOldLocalStorage() {
  try {
    console.log("开始清理旧的本地存储源数据...");

    // 查找所有本地存储源
    const localSources = await prisma.storageSource.findMany({
      where: { type: "local" },
    });

    if (localSources.length === 0) {
      console.log("没有找到本地存储源，无需清理");
      return;
    }

    console.log(`找到 ${localSources.length} 个本地存储源`);

    // 删除关联的文件记录
    for (const source of localSources) {
      const fileCount = await prisma.file.count({
        where: { storageSourceId: source.id },
      });

      if (fileCount > 0) {
        console.log(
          `存储源 "${source.name}" 包含 ${fileCount} 个文件，删除文件记录...`,
        );
        await prisma.file.deleteMany({
          where: { storageSourceId: source.id },
        });
      }
    }

    // 删除本地存储源
    const deleteResult = await prisma.storageSource.deleteMany({
      where: { type: "local" },
    });

    console.log(`成功删除 ${deleteResult.count} 个本地存储源`);
    console.log("清理完成！");
  } catch (error) {
    console.error("清理失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupOldLocalStorage();
}

module.exports = { cleanupOldLocalStorage };
