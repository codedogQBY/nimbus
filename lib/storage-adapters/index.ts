import { R2Adapter } from './r2';
import { QiniuAdapter } from './qiniu';
import { MinIOAdapter } from './minio';
import { UpyunAdapter } from './upyun';
import { TelegramAdapter } from './telegram';
import { CloudinaryAdapter } from './cloudinary';
import { GitHubAdapter } from './github';
import { CustomAdapter } from './custom';
import { LocalStorageAdapter } from './local';

export interface StorageAdapter {
  name: string;
  upload(file: File, path: string): Promise<UploadResult>;
  download(url: string): Promise<Buffer>;
  delete(path: string): Promise<boolean>;
  getUrl(path: string): string;
  testConnection(): Promise<boolean>;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  size?: number;
  hash?: string;
  metadata?: Record<string, any>;
}

export interface StorageConfig {
  [key: string]: any;
}

// 存储源类型枚举
export enum StorageType {
  LOCAL = 'local',
  R2 = 'r2',
  QINIU = 'qiniu',
  MINIO = 'minio',
  UPYUN = 'upyun',
  TELEGRAM = 'telegram',
  CLOUDINARY = 'cloudinary',
  GITHUB = 'github',
  CUSTOM = 'custom'
}

// 适配器工厂
export class StorageAdapterFactory {
  private static adapters = new Map<StorageType, new (config: StorageConfig) => StorageAdapter>();

  static {
    // 注册所有适配器
    this.adapters.set(StorageType.LOCAL, LocalStorageAdapter);
    this.adapters.set(StorageType.R2, R2Adapter);
    this.adapters.set(StorageType.QINIU, QiniuAdapter);
    this.adapters.set(StorageType.MINIO, MinIOAdapter);
    this.adapters.set(StorageType.UPYUN, UpyunAdapter);
    this.adapters.set(StorageType.TELEGRAM, TelegramAdapter);
    this.adapters.set(StorageType.CLOUDINARY, CloudinaryAdapter);
    this.adapters.set(StorageType.GITHUB, GitHubAdapter);
    this.adapters.set(StorageType.CUSTOM, CustomAdapter);
  }

  static create(type: StorageType, config: StorageConfig): StorageAdapter {
    const AdapterClass = this.adapters.get(type);
    if (!AdapterClass) {
      throw new Error(`Unsupported storage type: ${type}`);
    }
    return new AdapterClass(config);
  }

  static getSupportedTypes(): StorageType[] {
    return Array.from(this.adapters.keys());
  }
}

// 存储源管理器
export class StorageManager {
  private adapters = new Map<number, StorageAdapter>();

  constructor(private storageSources: Array<{
    id: number;
    type: StorageType;
    config: StorageConfig;
    priority: number;
    isActive: boolean;
  }>) {
    this.initializeAdapters();
  }

  private initializeAdapters() {
    this.storageSources
      .filter(source => source.isActive)
      .sort((a, b) => a.priority - b.priority)
      .forEach(source => {
        try {
          const adapter = StorageAdapterFactory.create(source.type, source.config);
          this.adapters.set(source.id, adapter);
        } catch (error) {
          console.error(`Failed to initialize adapter for source ${source.id}:`, error);
        }
      });
  }

  // 获取最佳存储源
  getBestStorageSource(): StorageAdapter | null {
    const activeSources = this.storageSources
      .filter(source => source.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const source of activeSources) {
      const adapter = this.adapters.get(source.id);
      if (adapter) {
        return adapter;
      }
    }
    return null;
  }

  // 获取指定存储源
  getStorageSource(id: number): StorageAdapter | null {
    return this.adapters.get(id) || null;
  }

  // 上传文件（自动选择最佳存储源）
  async uploadFile(file: File, path: string): Promise<UploadResult> {
    const adapter = this.getBestStorageSource();
    if (!adapter) {
      return { success: false, error: 'No active storage source available' };
    }

    try {
      return await adapter.upload(file, path);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // 上传文件到指定存储源
  async uploadFileToSource(sourceId: number, file: File, path: string): Promise<UploadResult> {
    const adapter = this.getStorageSource(sourceId);
    if (!adapter) {
      return { success: false, error: 'Storage source not found or inactive' };
    }

    try {
      return await adapter.upload(file, path);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // 下载文件
  async downloadFile(url: string): Promise<Buffer> {
    // 这里需要根据 URL 判断是哪个存储源
    // 简化实现，可以扩展
    const adapter = this.getBestStorageSource();
    if (!adapter) {
      throw new Error('No active storage source available');
    }
    return await adapter.download(url);
  }

  // 删除文件
  async deleteFile(path: string, sourceId?: number): Promise<boolean> {
    const adapter = sourceId ? this.getStorageSource(sourceId) : this.getBestStorageSource();
    if (!adapter) {
      return false;
    }
    return await adapter.delete(path);
  }

  // 测试所有存储源连接
  async testAllConnections(): Promise<Record<number, boolean>> {
    const results: Record<number, boolean> = {};
    
    for (const [sourceId, adapter] of this.adapters) {
      try {
        results[sourceId] = await adapter.testConnection();
      } catch (error) {
        results[sourceId] = false;
      }
    }
    
    return results;
  }
}
