import fs from "fs/promises";
import path from "path";

import { StorageAdapter, StorageConfig, UploadResult } from "./index";

export interface LocalConfig extends StorageConfig {
  basePath: string; // 本地存储的基础路径
  maxFileSize?: number; // 最大文件大小限制
}

export class LocalStorageAdapter implements StorageAdapter {
  public name: string;
  private config: LocalConfig;

  constructor(config: LocalConfig) {
    // 确保配置正确
    this.config = {
      ...config,
      basePath: config.basePath || (config as any).path || "./storage", // 兼容性处理
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 默认100MB
    };
    this.name = "Local Storage";

    console.log("LocalStorageAdapter initialized with config:", this.config);
  }

  async initialize(): Promise<void> {
    // 验证basePath配置
    if (!this.config.basePath) {
      throw new Error("Local storage basePath configuration is missing");
    }

    console.log(
      "Initializing local storage with basePath:",
      this.config.basePath,
    );

    // 确保存储目录存在
    try {
      await fs.access(this.config.basePath);
    } catch {
      await fs.mkdir(this.config.basePath, { recursive: true });
    }
  }

  async upload(file: File, filePath: string): Promise<UploadResult> {
    try {
      // 检查文件大小限制
      if (this.config.maxFileSize && file.size > this.config.maxFileSize) {
        return {
          success: false,
          error: `文件大小超过限制 ${this.config.maxFileSize} 字节`,
        };
      }

      const fullPath = path.join(this.config.basePath, filePath);
      const dir = path.dirname(fullPath);

      // 确保目录存在
      await fs.mkdir(dir, { recursive: true });

      // 写入文件
      const buffer = new Uint8Array(await file.arrayBuffer());

      await fs.writeFile(fullPath, buffer);

      return {
        success: true,
        url: `/api/files/local/${encodeURIComponent(filePath)}`,
        path: filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: `本地存储上传失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async download(filePath: string): Promise<Buffer> {
    try {
      console.log(`Downloading file from local storage: ${filePath}`);

      const fullPath = path.join(this.config.basePath, filePath);
      const buffer = await fs.readFile(fullPath);

      return buffer;
    } catch (error) {
      console.error("Local storage download error:", error);
      throw new Error(
        `本地存储下载失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.basePath, filePath);

      await fs.unlink(fullPath);

      return true;
    } catch (error) {
      console.error(
        `本地存储删除失败: ${error instanceof Error ? error.message : String(error)}`,
      );

      return false;
    }
  }

  getUrl(filePath: string): string {
    // 本地存储通过服务器代理提供访问，但这里我们不能直接返回文件ID的URL
    // 因为这个方法只接收文件路径，不知道文件ID
    // 这个方法主要用于上传后返回URL，实际访问应该通过文件ID
    return `/storage/${encodeURIComponent(filePath)}`;
  }

  getDirectUrl(path: string): string {
    // 本地存储无法提供真正的直接URL，返回null表示不支持
    // 这将导致系统回退到代理模式
    return null as any;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 测试目录访问权限
      await fs.access(
        this.config.basePath,
        fs.constants.R_OK | fs.constants.W_OK,
      );

      // 测试写入权限
      const testFile = path.join(this.config.basePath, ".test");

      await fs.writeFile(testFile, "test");
      await fs.unlink(testFile);

      return true;
    } catch (error) {
      console.error(
        `本地存储连接测试失败: ${error instanceof Error ? error.message : String(error)}`,
      );

      return false;
    }
  }
}
