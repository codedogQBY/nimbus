import { Readable } from "stream";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import {
  StorageSource,
  FileInfo,
  FolderInfo,
  FolderContents,
  UploadResult,
  QuotaInfo,
  StorageSourceConfig,
} from "./base";

export interface R2Config extends StorageSourceConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
}

export class R2StorageSource extends StorageSource {
  readonly type = "r2";
  readonly name: string;
  private s3Client: S3Client | null = null;
  private bucket: string;
  private lastSync: Date = new Date();

  constructor(config: R2Config, name: string = "Cloudflare R2") {
    super(config);
    this.name = name;
    this.bucket = config.bucket;
  }

  async connect(): Promise<void> {
    const config = this.config as R2Config;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async disconnect(): Promise<void> {
    if (this.s3Client) {
      this.s3Client.destroy();
      this.s3Client = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.s3Client) {
        await this.connect();
      }

      // 尝试列出bucket（测试连接）
      await this.s3Client!.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 1,
        }),
      );

      return true;
    } catch (error) {
      console.error("R2 connection test failed:", error);

      return false;
    }
  }

  async uploadFile(
    path: string,
    file: Buffer | ReadableStream,
  ): Promise<UploadResult> {
    if (!this.s3Client) {
      await this.connect();
    }

    const body = file instanceof Buffer ? file : Readable.from(file as any);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: body,
    });

    const result = await this.s3Client!.send(command);

    return {
      path,
      size: file instanceof Buffer ? file.length : 0,
      etag: result.ETag,
      uploadTime: new Date(),
    };
  }

  async downloadFile(path: string): Promise<ReadableStream> {
    if (!this.s3Client) {
      await this.connect();
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const result = await this.s3Client!.send(command);

    if (!result.Body) {
      throw new Error("File not found");
    }

    // 将 Node.js stream 转换为 Web ReadableStream
    return Readable.toWeb(result.Body as any) as ReadableStream;
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.s3Client) {
      await this.connect();
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.s3Client!.send(command);
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    if (!this.s3Client) {
      await this.connect();
    }

    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const result = await this.s3Client!.send(command);

    return {
      name: path.split("/").pop() || path,
      path,
      size: result.ContentLength || 0,
      lastModified: result.LastModified || new Date(),
      etag: result.ETag,
      contentType: result.ContentType,
    };
  }

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    await this.copyFile(oldPath, newPath);
    await this.deleteFile(oldPath);
  }

  async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    if (!this.s3Client) {
      await this.connect();
    }

    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourcePath}`,
      Key: targetPath,
    });

    await this.s3Client!.send(command);
  }

  async createFolder(path: string): Promise<void> {
    // S3/R2 使用空对象模拟文件夹
    const folderPath = path.endsWith("/") ? path : path + "/";

    await this.uploadFile(folderPath, Buffer.from(""));
  }

  async deleteFolder(path: string, recursive: boolean = false): Promise<void> {
    if (!this.s3Client) {
      await this.connect();
    }

    const folderPath = path.endsWith("/") ? path : path + "/";

    if (recursive) {
      // 列出所有文件
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: folderPath,
      });

      const result = await this.s3Client!.send(command);

      // 删除所有文件
      if (result.Contents) {
        for (const object of result.Contents) {
          if (object.Key) {
            await this.deleteFile(object.Key);
          }
        }
      }
    }

    // 删除文件夹标记
    try {
      await this.deleteFile(folderPath);
    } catch (error) {
      // 文件夹标记可能不存在
    }
  }

  async moveFolder(oldPath: string, newPath: string): Promise<void> {
    if (!this.s3Client) {
      await this.connect();
    }

    const oldFolderPath = oldPath.endsWith("/") ? oldPath : oldPath + "/";
    const newFolderPath = newPath.endsWith("/") ? newPath : newPath + "/";

    // 列出所有文件
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: oldFolderPath,
    });

    const result = await this.s3Client!.send(command);

    // 移动所有文件
    if (result.Contents) {
      for (const object of result.Contents) {
        if (object.Key) {
          const relativePath = object.Key.substring(oldFolderPath.length);
          const newKey = newFolderPath + relativePath;

          await this.moveFile(object.Key, newKey);
        }
      }
    }
  }

  async listFolder(path: string): Promise<FolderContents> {
    if (!this.s3Client) {
      await this.connect();
    }

    const folderPath =
      path === "/" || path === "" ? "" : path.endsWith("/") ? path : path + "/";

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: folderPath,
      Delimiter: "/",
    });

    const result = await this.s3Client!.send(command);

    const files: FileInfo[] = [];
    const folders: FolderInfo[] = [];
    let totalSize = 0;

    // 处理文件
    if (result.Contents) {
      for (const object of result.Contents) {
        if (object.Key && object.Key !== folderPath) {
          files.push({
            name: object.Key.split("/").pop() || object.Key,
            path: object.Key,
            size: object.Size || 0,
            lastModified: object.LastModified || new Date(),
            etag: object.ETag,
          });
          totalSize += object.Size || 0;
        }
      }
    }

    // 处理文件夹
    if (result.CommonPrefixes) {
      for (const prefix of result.CommonPrefixes) {
        if (prefix.Prefix) {
          const folderName = prefix.Prefix.replace(folderPath, "").replace(
            "/",
            "",
          );

          folders.push({
            name: folderName,
            path: prefix.Prefix,
            lastModified: new Date(),
            itemCount: 0, // R2不直接提供
          });
        }
      }
    }

    return {
      files,
      folders,
      totalFiles: files.length,
      totalSize,
    };
  }

  async folderExists(path: string): Promise<boolean> {
    try {
      const folderPath = path.endsWith("/") ? path : path + "/";
      const contents = await this.listFolder(folderPath);

      return contents.files.length > 0 || contents.folders.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getQuotaInfo(): Promise<QuotaInfo> {
    // R2 没有直接的配额API，需要通过计算
    // 这里返回估算值，实际使用时应该从数据库获取
    const total = 10 * 1024 * 1024 * 1024; // 10GB 默认
    const used = 0; // 需要从数据库计算

    return {
      used,
      total,
      available: total - used,
    };
  }

  async getLastSyncTime(): Promise<Date> {
    return this.lastSync;
  }

  async setLastSyncTime(time: Date): Promise<void> {
    this.lastSync = time;
  }
}
