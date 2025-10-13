import { StorageAdapter, UploadResult, StorageConfig } from './index';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class R2Adapter implements StorageAdapter {
  name = 'Cloudflare R2';
  private client: S3Client;
  private bucketName: string;
  private domain?: string;

  constructor(private config: StorageConfig) {
    this.bucketName = config.bucketName;
    this.domain = config.domain;
    
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.client.send(command);
      
      const url = this.getUrl(path);
      return {
        success: true,
        url,
        path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async download(path: string): Promise<Buffer> {
    try {
      // 如果已经是一个路径（不是完整URL），直接使用；否则提取路径
      const filePath = path.startsWith('http') ? this.extractPathFromUrl(path) : path;
      console.log(`Downloading file from R2: ${path} -> ${filePath}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const response = await this.client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        const stream = response.Body as any;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('R2 download error:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(path: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  getUrl(path: string): string {
    if (this.domain) {
      return `${this.domain}/${path}`;
    }
    return `https://pub-${this.config.accountId}.r2.dev/${path}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 尝试列出对象来测试连接
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: 'test-connection',
      });
      
      await this.client.send(command);
      return true;
    } catch (error: any) {
      // 如果是 404，说明连接正常但文件不存在
      if (error.name === 'NoSuchKey') {
        return true;
      }
      return false;
    }
  }

  private extractPathFromUrl(url: string): string {
    if (this.domain && url.startsWith(this.domain)) {
      return url.replace(this.domain + '/', '');
    }
    // 从 R2 URL 中提取路径
    const match = url.match(/https:\/\/pub-[^.]+\.r2\.dev\/(.+)/);
    return match ? match[1] : url;
  }
}
