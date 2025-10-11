import prisma from './prisma';
import { StorageManager, StorageType } from './storage-adapters';

// 存储服务类
export class StorageService {
  private static instance: StorageService;
  private storageManager: StorageManager | null = null;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // 初始化存储管理器
  async initialize() {
    try {
      const storageSources = await prisma.storageSource.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      });

      this.storageManager = new StorageManager(
        storageSources.map(source => ({
          id: source.id,
          type: source.type as StorageType,
          config: source.config as any,
          priority: source.priority || 50,
          isActive: source.isActive,
        }))
      );
    } catch (error) {
      console.error('Failed to initialize storage manager:', error);
      this.storageManager = null;
    }
  }

  // 获取存储管理器
  getStorageManager(): StorageManager | null {
    return this.storageManager;
  }

  // 上传文件
  async uploadFile(file: File, path: string, sourceId?: number) {
    if (!this.storageManager) {
      await this.initialize();
      if (!this.storageManager) {
        throw new Error('Storage manager not available');
      }
    }

    if (sourceId) {
      return await this.storageManager.uploadFileToSource(sourceId, file, path);
    } else {
      return await this.storageManager.uploadFile(file, path);
    }
  }

  // 下载文件
  async downloadFile(url: string) {
    if (!this.storageManager) {
      await this.initialize();
      if (!this.storageManager) {
        throw new Error('Storage manager not available');
      }
    }

    return await this.storageManager.downloadFile(url);
  }

  // 删除文件
  async deleteFile(path: string, sourceId?: number) {
    if (!this.storageManager) {
      await this.initialize();
      if (!this.storageManager) {
        throw new Error('Storage manager not available');
      }
    }

    return await this.storageManager.deleteFile(path, sourceId);
  }

  // 测试所有存储源连接
  async testAllConnections() {
    if (!this.storageManager) {
      await this.initialize();
      if (!this.storageManager) {
        throw new Error('Storage manager not available');
      }
    }

    return await this.storageManager.testAllConnections();
  }
}

// 导出单例实例
export const storageService = StorageService.getInstance();
