import { R2Adapter } from "./r2";
import { QiniuAdapter } from "./qiniu";
import { MinIOAdapter } from "./minio";
import { UpyunAdapter } from "./upyun";
import { TelegramAdapter } from "./telegram";
import { CloudinaryAdapter } from "./cloudinary";
import { GitHubAdapter } from "./github";
import { CustomAdapter } from "./custom";
import { LocalStorageAdapter } from "./local";

export interface StorageAdapter {
  name: string;
  initialize?(): Promise<void>;
  upload(file: File, path: string, options?: any): Promise<UploadResult>;
  download(url: string): Promise<Buffer>;
  delete(path: string): Promise<boolean>;
  getUrl(path: string): string;
  testConnection(): Promise<boolean>;

  // 扩展功能（可选）
  getFileMetadata?(path: string): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
    contentType: string;
    metadata?: Record<string, string>;
  }>;
  getSignedUrl?(path: string, expiresIn?: number): Promise<string>;
  getUploadSignedUrl?(
    path: string,
    contentType?: string,
    expiresIn?: number,
  ): Promise<string>;
  listObjects?(
    prefix?: string,
    maxKeys?: number,
  ): Promise<{
    objects: Array<{
      key: string;
      size: number;
      lastModified: Date;
      etag: string;
    }>;
    truncated: boolean;
    nextContinuationToken?: string;
  }>;
  getStorageUsage?(): Promise<{
    objectCount: number;
    totalSize: number;
  }>;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  size?: number;
  hash?: string;
  etag?: string;
  versionId?: string;
  multipart?: boolean;
  metadata?: Record<string, any>;
}

export interface StorageConfig {
  [key: string]: any;
}

// 存储源类型枚举
export enum StorageType {
  LOCAL = "local",
  R2 = "r2",
  QINIU = "qiniu",
  MINIO = "minio",
  UPYUN = "upyun",
  TELEGRAM = "telegram",
  CLOUDINARY = "cloudinary",
  GITHUB = "github",
  CUSTOM = "custom",
}

// 适配器工厂
export class StorageAdapterFactory {
  private static adapters = new Map<
    StorageType,
    new (config: any) => StorageAdapter
  >();

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

  constructor(
    private storageSources: Array<{
      id: number;
      type: StorageType;
      config: StorageConfig;
      priority: number;
      isActive: boolean;
    }>,
  ) {
    // 不在构造函数中调用异步方法
  }

  // 异步初始化方法
  async initialize(): Promise<void> {
    await this.initializeAdapters();
  }

  private async initializeAdapters() {
    for (const source of this.storageSources
      .filter((source) => source.isActive)
      .sort((a, b) => a.priority - b.priority)) {
      try {
        const adapter = StorageAdapterFactory.create(
          source.type,
          source.config,
        );

        // 调用适配器的初始化方法（如果存在）
        if (adapter.initialize) {
          await adapter.initialize();
        }

        this.adapters.set(source.id, adapter);
      } catch (error) {
        console.error(
          `Failed to initialize adapter for source ${source.id}:`,
          error,
        );
      }
    }
  }

  // 获取最佳存储源
  getBestStorageSource(fileSize?: number): StorageAdapter | null {
    return this.selectBestStorageSource(fileSize);
  }

  // 智能选择存储源
  selectBestStorageSource(fileSize?: number): StorageAdapter | null {
    const activeSources = this.storageSources
      .filter((source) => source.isActive)
      .sort((a, b) => b.priority - a.priority); // 降序排列，优先级高的在前

    // GitHub单文件大小限制为100MB
    const GITHUB_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    // 如果提供了文件大小，且大于100MB，排除GitHub
    let eligibleSources = activeSources;

    if (fileSize && fileSize > GITHUB_MAX_FILE_SIZE) {
      eligibleSources = activeSources.filter(
        (source) => source.type !== StorageType.GITHUB,
      );

      // 如果只有GitHub可用且文件超过100MB，返回null让调用方处理错误
      if (
        eligibleSources.length === 0 &&
        activeSources.some((source) => source.type === StorageType.GITHUB)
      ) {
        return null;
      }
    }

    for (const source of eligibleSources) {
      const adapter = this.adapters.get(source.id);

      if (adapter) {
        return adapter;
      }
    }

    return null;
  }

  // 检查是否只有GitHub可用（用于错误提示）
  isOnlyGitHubAvailable(): boolean {
    const activeSources = this.storageSources.filter(
      (source) => source.isActive,
    );

    return (
      activeSources.length > 0 &&
      activeSources.every((source) => source.type === StorageType.GITHUB)
    );
  }

  // 获取指定存储源
  getStorageSource(id: number): StorageAdapter | null {
    return this.adapters.get(id) || null;
  }

  // 上传文件（自动选择最佳存储源）
  async uploadFile(file: File, path: string): Promise<UploadResult> {
    const adapter = this.getBestStorageSource(file.size);

    if (!adapter) {
      // 检查是否只有GitHub可用但文件太大
      if (this.isOnlyGitHubAvailable() && file.size > 100 * 1024 * 1024) {
        return {
          success: false,
          error: `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过GitHub限制 100MB。请启用其他存储源（如又拍云、七牛云、R2等）或压缩文件后重试。`,
        };
      }

      return { success: false, error: "No active storage source available" };
    }

    try {
      return await adapter.upload(file, path);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // 上传文件到指定存储源
  async uploadFileToSource(
    sourceId: number,
    file: File,
    path: string,
  ): Promise<UploadResult> {
    const adapter = this.getStorageSource(sourceId);

    if (!adapter) {
      return { success: false, error: "Storage source not found or inactive" };
    }

    try {
      return await adapter.upload(file, path);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // 下载文件
  async downloadFile(url: string): Promise<Buffer> {
    // 这里需要根据 URL 判断是哪个存储源
    // 简化实现，可以扩展
    const adapter = this.getBestStorageSource();

    if (!adapter) {
      throw new Error("No active storage source available");
    }

    return await adapter.download(url);
  }

  // 删除文件
  async deleteFile(path: string, sourceId?: number): Promise<boolean> {
    const adapter = sourceId
      ? this.getStorageSource(sourceId)
      : this.getBestStorageSource();

    if (!adapter) {
      return false;
    }

    return await adapter.delete(path);
  }

  // 测试所有存储源连接
  async testAllConnections(): Promise<Record<number, boolean>> {
    const results: Record<number, boolean> = {};

    for (const [sourceId, adapter] of Array.from(this.adapters.entries())) {
      try {
        results[sourceId] = await adapter.testConnection();
      } catch (error) {
        results[sourceId] = false;
      }
    }

    return results;
  }
}
