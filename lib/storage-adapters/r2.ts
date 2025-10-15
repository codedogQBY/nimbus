import crypto from "crypto";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { StorageAdapter, UploadResult, StorageConfig } from "./index";

export interface R2Config extends StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  domain?: string;
  endpoint?: string;
  region?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  onProgress?: (uploaded: number, total: number) => void;
  multipartThreshold?: number; // 默认 100MB
}

export interface R2UploadResult extends UploadResult {
  etag?: string;
  versionId?: string;
  multipart?: boolean;
}

export class R2Adapter implements StorageAdapter {
  name = "Cloudflare R2";
  private client: S3Client;
  private bucketName: string;
  private domain?: string;
  private endpoint: string;
  private config: R2Config;

  constructor(config: R2Config) {
    this.config = config;
    this.bucketName = config.bucketName;
    this.domain = config.domain;
    this.endpoint =
      config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`;

    // 创建自定义的 HTTPS Agent 来处理 SSL 问题
    const httpsAgent = new (require("https").Agent)({
      keepAlive: true,
      timeout: 30000,
      // 对于某些网络环境，可能需要更宽松的 SSL 设置
      secureProtocol: "TLSv1_2_method",
      ciphers: "HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    });

    this.client = new S3Client({
      region: config.region || "auto",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // 首先尝试 path-style，这对某些网络环境更稳定
      forcePathStyle: true,
      // 自定义请求处理器
      requestHandler: {
        httpsAgent,
      },
      // 设置超时和重试
      requestTimeout: 30000,
      maxAttempts: 3,
    });
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.accountId) {
      throw new Error("accountId is required for R2 configuration");
    }
    if (!this.config.accessKeyId) {
      throw new Error("accessKeyId is required for R2 configuration");
    }
    if (!this.config.secretAccessKey) {
      throw new Error("secretAccessKey is required for R2 configuration");
    }
    if (!this.config.bucketName) {
      throw new Error("bucketName is required for R2 configuration");
    }
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    this.validateConfig();
    // 不在初始化时就测试连接，避免潜在的SSL问题
  }

  /**
   * 上传文件 - 支持单文件和分片上传
   */
  async upload(
    file: File,
    path: string,
    options?: UploadOptions,
  ): Promise<R2UploadResult> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileSize = buffer.length;
      const multipartThreshold =
        options?.multipartThreshold || 100 * 1024 * 1024; // 100MB

      // 大文件使用分片上传
      if (fileSize > multipartThreshold) {
        return await this.multipartUpload(buffer, path, file.type, options);
      } else {
        return await this.singleUpload(buffer, path, file.type, options);
      }
    } catch (error) {
      console.error("R2 upload error:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * 单文件上传
   */
  private async singleUpload(
    buffer: Buffer,
    path: string,
    contentType: string,
    options?: UploadOptions,
  ): Promise<R2UploadResult> {
    const metadata = {
      uploadedAt: new Date().toISOString(),
      size: buffer.length.toString(),
      hash: crypto.createHash("md5").update(buffer).digest("hex"),
      ...options?.metadata,
    };

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
      Metadata: metadata,
      ContentMD5: crypto.createHash("md5").update(buffer).digest("base64"),
    });

    const response = await this.client.send(command);

    return {
      success: true,
      url: this.getUrl(path),
      path,
      size: buffer.length,
      hash: metadata.hash,
      etag: response.ETag,
      versionId: response.VersionId,
      multipart: false,
      metadata: {
        etag: response.ETag,
        versionId: response.VersionId,
      },
    };
  }

  /**
   * 分片上传
   */
  private async multipartUpload(
    buffer: Buffer,
    path: string,
    contentType: string,
    options?: UploadOptions,
  ): Promise<R2UploadResult> {
    const chunkSize = 5 * 1024 * 1024; // 5MB per chunk
    const chunks = Math.ceil(buffer.length / chunkSize);

    const metadata = {
      uploadedAt: new Date().toISOString(),
      size: buffer.length.toString(),
      hash: crypto.createHash("md5").update(buffer).digest("hex"),
      chunks: chunks.toString(),
      ...options?.metadata,
    };

    // 创建分片上传
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: path,
      ContentType: contentType || "application/octet-stream",
      Metadata: metadata,
    });

    const { UploadId } = await this.client.send(createCommand);

    if (!UploadId) {
      throw new Error("Failed to create multipart upload");
    }

    try {
      const parts: Array<{ ETag: string; PartNumber: number }> = [];

      // 上传分片
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, buffer.length);
        const chunkBuffer = buffer.slice(start, end);

        const uploadCommand = new UploadPartCommand({
          Bucket: this.bucketName,
          Key: path,
          UploadId,
          PartNumber: i + 1,
          Body: chunkBuffer,
        });

        const partResponse = await this.client.send(uploadCommand);

        if (partResponse.ETag) {
          parts.push({
            ETag: partResponse.ETag,
            PartNumber: i + 1,
          });
        }

        // 进度回调
        if (options?.onProgress) {
          options.onProgress(end, buffer.length);
        }
      }

      // 完成分片上传
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: path,
        UploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

      const completeResponse = await this.client.send(completeCommand);

      return {
        success: true,
        url: this.getUrl(path),
        path,
        size: buffer.length,
        hash: metadata.hash,
        etag: completeResponse.ETag,
        versionId: completeResponse.VersionId,
        multipart: true,
        metadata: {
          etag: completeResponse.ETag,
          versionId: completeResponse.VersionId,
          chunks: chunks.toString(),
        },
      };
    } catch (error) {
      // 上传失败，取消分片上传
      try {
        await this.client.send(
          new AbortMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: path,
            UploadId,
          }),
        );
      } catch (abortError) {
        console.error("Failed to abort multipart upload:", abortError);
      }
      throw error;
    }
  }

  /**
   * 下载文件 - 优化的流处理
   */
  async download(path: string): Promise<Buffer> {
    try {
      // 如果已经是一个路径（不是完整URL），直接使用；否则提取路径
      const filePath = path.startsWith("http")
        ? this.extractPathFromUrl(path)
        : path;

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error("File not found or empty");
      }

      // 优化的流处理
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;

      if (stream.transformToByteArray) {
        // 使用 AWS SDK 的内置方法（更高效）
        return Buffer.from(await stream.transformToByteArray());
      } else {
        // 回退到手动处理
        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        return Buffer.concat(chunks);
      }
    } catch (error) {
      console.error("R2 download error:", error);
      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 删除文件 - 增强错误处理
   */
  async delete(path: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await this.client.send(command);

      return true;
    } catch (error) {
      console.error("R2 delete error:", error);
      // 如果文件不存在，也算删除成功
      if (error instanceof Error && error.name === "NoSuchKey") {
        return true;
      }

      return false;
    }
  }

  /**
   * 获取文件元数据
   */
  async getFileMetadata(path: string): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
    contentType: string;
    metadata?: Record<string, string>;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || "",
        contentType: response.ContentType || "application/octet-stream",
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("Get file metadata error:", error);
      throw new Error(
        `Failed to get file metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 生成预签名URL
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error("Get signed URL error:", error);
      throw new Error(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 生成上传预签名URL
   */
  async getUploadSignedUrl(
    path: string,
    contentType?: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        ContentType: contentType,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error("Get upload signed URL error:", error);
      throw new Error(
        `Failed to generate upload signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 列出文件夹内容
   */
  async listObjects(
    prefix: string = "",
    maxKeys: number = 1000,
  ): Promise<{
    objects: Array<{
      key: string;
      size: number;
      lastModified: Date;
      etag: string;
    }>;
    truncated: boolean;
    nextContinuationToken?: string;
  }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);

      const objects = (response.Contents || []).map((obj) => ({
        key: obj.Key || "",
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || "",
      }));

      return {
        objects,
        truncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      console.error("List objects error:", error);
      throw new Error(
        `Failed to list objects: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * 优化的URL生成
   */
  getUrl(path: string): string {
    // 清理路径，移除开头的斜杠
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    if (this.domain) {
      // 自定义域名，确保以 https:// 开头
      const domain = this.domain.startsWith("http")
        ? this.domain
        : `https://${this.domain}`;

      return `${domain}/${cleanPath}`;
    }

    // 使用 R2 默认域名
    return `https://pub-${this.config.accountId}.r2.dev/${cleanPath}`;
  }

  /**
   * 测试连接 - 改进的连接测试
   */
  async testConnection(): Promise<boolean> {
    try {
      // 尝试列出 bucket 内容来测试连接
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      });

      await this.client.send(command);

      return true;
    } catch (error: any) {
      console.error("R2 connection test failed:", error);

      // 详细的错误分析
      const errorMessage = error.message || "";
      const errorCode = error.code || error.name || "";

      // SSL/TLS 相关错误 - 提供具体的解决建议
      if (
        errorMessage.includes("EPROTO") ||
        errorMessage.includes("SSL") ||
        errorMessage.includes("TLS") ||
        errorMessage.includes("handshake failure")
      ) {
        throw new Error(
          "❌ 网络环境阻止了到 Cloudflare R2 的连接。\n" +
            "可能原因：\n" +
            "• 公司/学校网络阻止对象存储服务\n" +
            "• VPN 或代理干扰 SSL 连接\n" +
            "• 防火墙规则阻止连接\n\n" +
            "建议解决方案：\n" +
            "1. 尝试切换到个人网络（手机热点）\n" +
            "2. 联系网络管理员白名单 *.r2.cloudflarestorage.com\n" +
            "3. 考虑使用其他存储服务（如又拍云、七牛云）",
        );
      }

      // AWS S3 相关错误
      if (errorCode === "NoSuchBucket") {
        throw new Error(`存储桶 '${this.bucketName}' 不存在，请检查存储桶名称`);
      } else if (errorCode === "InvalidAccessKeyId") {
        throw new Error("Access Key ID 无效，请检查您的 API 凭据");
      } else if (errorCode === "SignatureDoesNotMatch") {
        throw new Error("Secret Access Key 无效，请检查您的 API 凭据");
      } else if (errorCode === "AccessDenied") {
        throw new Error("权限被拒绝，请检查 API 密钥的权限设置");
      } else if (
        errorCode === "RequestTimeout" ||
        errorMessage.includes("timeout")
      ) {
        throw new Error("连接超时，请检查网络连接");
      }

      // 网络连接错误
      if (
        errorMessage.includes("ENOTFOUND") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        throw new Error("无法连接到 Cloudflare R2 服务器，请检查网络连接");
      }

      // 未知错误
      throw new Error(`连接测试失败: ${errorMessage}`);
    }
  }

  /**
   * 从URL提取路径 - 改进的路径提取
   */
  private extractPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // 自定义域名
      if (this.domain) {
        const domainObj = new URL(
          this.domain.startsWith("http")
            ? this.domain
            : `https://${this.domain}`,
        );

        if (urlObj.hostname === domainObj.hostname) {
          return urlObj.pathname.startsWith("/")
            ? urlObj.pathname.slice(1)
            : urlObj.pathname;
        }
      }

      // R2 默认域名格式
      const r2Pattern = /^https:\/\/pub-([^.]+)\.r2\.dev\/(.+)$/;
      const match = url.match(r2Pattern);

      if (match) {
        return match[2];
      }

      // 如果都不匹配，返回 pathname
      return urlObj.pathname.startsWith("/")
        ? urlObj.pathname.slice(1)
        : urlObj.pathname;
    } catch (error) {
      // 如果不是有效的URL，直接返回原始路径
      return url;
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{
    objectCount: number;
    totalSize: number;
  }> {
    try {
      let objectCount = 0;
      let totalSize = 0;
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });

        const response = await this.client.send(command);

        if (response.Contents) {
          objectCount += response.Contents.length;
          totalSize += response.Contents.reduce(
            (sum, obj) => sum + (obj.Size || 0),
            0,
          );
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return { objectCount, totalSize };
    } catch (error) {
      console.error("Get storage usage error:", error);
      throw new Error(
        `Failed to get storage usage: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
