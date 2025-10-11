/**
 * 存储源抽象接口
 * 所有存储源插件必须实现此接口
 */

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  etag?: string;
  contentType?: string;
}

export interface FolderInfo {
  name: string;
  path: string;
  lastModified: Date;
  itemCount: number;
}

export interface FolderContents {
  files: FileInfo[];
  folders: FolderInfo[];
  totalFiles: number;
  totalSize: number;
}

export interface UploadResult {
  path: string;
  size: number;
  etag?: string;
  uploadTime: Date;
}

export interface QuotaInfo {
  used: number;
  total: number;
  available: number;
}

export interface StorageSourceConfig {
  [key: string]: any;
}

export abstract class StorageSource {
  // 基础信息
  abstract readonly type: string;
  abstract readonly name: string;
  protected config: StorageSourceConfig;

  constructor(config: StorageSourceConfig) {
    this.config = config;
  }

  // 连接和认证
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;

  // 文件操作
  abstract uploadFile(path: string, file: Buffer | ReadableStream): Promise<UploadResult>;
  abstract downloadFile(path: string): Promise<ReadableStream>;
  abstract deleteFile(path: string): Promise<void>;
  abstract getFileInfo(path: string): Promise<FileInfo>;
  abstract moveFile(oldPath: string, newPath: string): Promise<void>;
  abstract copyFile(sourcePath: string, targetPath: string): Promise<void>;

  // 文件夹操作（所有存储源必须支持）
  abstract createFolder(path: string): Promise<void>;
  abstract deleteFolder(path: string, recursive?: boolean): Promise<void>;
  abstract moveFolder(oldPath: string, newPath: string): Promise<void>;
  abstract listFolder(path: string): Promise<FolderContents>;
  abstract folderExists(path: string): Promise<boolean>;

  /**
   * 确保文件夹路径存在，递归创建
   */
  async ensureFolderPath(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of parts) {
      currentPath += '/' + part;
      const exists = await this.folderExists(currentPath);
      
      if (!exists) {
        await this.createFolder(currentPath);
      }
    }
  }

  // 配额管理
  abstract getQuotaInfo(): Promise<QuotaInfo>;

  // 同步相关
  abstract getLastSyncTime(): Promise<Date>;
  abstract setLastSyncTime(time: Date): Promise<void>;
}

