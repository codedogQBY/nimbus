import { StorageSource, StorageSourceConfig } from './base';
import { R2StorageSource, R2Config } from './r2';
import prisma from '../prisma';

/**
 * 存储源管理器
 * 负责存储源的创建、选择和管理
 */
export class StorageSourceManager {
  private sources: Map<number, StorageSource> = new Map();

  /**
   * 获取存储源实例
   */
  async getStorageSource(sourceId: number): Promise<StorageSource> {
    // 从缓存获取
    if (this.sources.has(sourceId)) {
      return this.sources.get(sourceId)!;
    }

    // 从数据库加载
    const sourceRecord = await prisma.storageSource.findUnique({
      where: { id: sourceId },
    });

    if (!sourceRecord) {
      throw new Error(`Storage source ${sourceId} not found`);
    }

    // 创建存储源实例
    const source = await this.createStorageSourceInstance(
      sourceRecord.type,
      sourceRecord.config as StorageSourceConfig,
      sourceRecord.name
    );

    await source.connect();

    // 缓存
    this.sources.set(sourceId, source);

    return source;
  }

  /**
   * 获取所有活跃的存储源
   */
  async getActiveStorageSources(): Promise<StorageSource[]> {
    const sources = await prisma.storageSource.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    const instances: StorageSource[] = [];

    for (const source of sources) {
      try {
        const instance = await this.getStorageSource(source.id);
        instances.push(instance);
      } catch (error) {
        console.error(`Failed to load storage source ${source.id}:`, error);
      }
    }

    return instances;
  }

  /**
   * 智能选择存储源
   */
  async selectStorageSource(
    fileSize: number,
    fileType: string
  ): Promise<{ source: StorageSource; sourceId: number }> {
    const sources = await prisma.storageSource.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // 筛选有足够空间的存储源
    const availableSources = sources.filter(source => {
      const available = Number(source.quotaLimit) - Number(source.quotaUsed);
      return available >= fileSize;
    });

    if (availableSources.length === 0) {
      throw new Error('没有可用的存储源，空间不足');
    }

    // 选择策略
    let selectedSource = availableSources[0];

    // 大文件优先选择R2/七牛云
    if (fileSize > 100 * 1024 * 1024) {
      const preferredSources = availableSources.filter(
        s => s.type === 'r2' || s.type === 'qiniu'
      );
      if (preferredSources.length > 0) {
        selectedSource = preferredSources[0];
      }
    }

    // 图片/视频优先选择有CDN的源
    if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
      const cdnSources = availableSources.filter(
        s => s.type === 'r2' || s.type === 'qiniu'
      );
      if (cdnSources.length > 0) {
        selectedSource = cdnSources[0];
      }
    }

    const instance = await this.getStorageSource(selectedSource.id);

    return {
      source: instance,
      sourceId: selectedSource.id,
    };
  }

  /**
   * 创建存储源实例
   */
  private async createStorageSourceInstance(
    type: string,
    config: StorageSourceConfig,
    name: string
  ): Promise<StorageSource> {
    switch (type) {
      case 'r2':
        return new R2StorageSource(config as R2Config, name);
      // 后续添加其他存储源
      // case 'qiniu':
      //   return new QiniuStorageSource(config as QiniuConfig, name);
      // case 'telegram':
      //   return new TelegramStorageSource(config as TelegramConfig, name);
      // case 'github':
      //   return new GitHubStorageSource(config as GitHubConfig, name);
      default:
        throw new Error(`Unsupported storage source type: ${type}`);
    }
  }

  /**
   * 更新存储源使用量
   */
  async updateStorageUsage(sourceId: number, sizeChange: number): Promise<void> {
    await prisma.storageSource.update({
      where: { id: sourceId },
      data: {
        quotaUsed: {
          increment: sizeChange,
        },
      },
    });
  }

  /**
   * 清除缓存
   */
  clearCache(sourceId?: number): void {
    if (sourceId) {
      this.sources.delete(sourceId);
    } else {
      this.sources.clear();
    }
  }
}

// 单例实例
export const storageManager = new StorageSourceManager();

