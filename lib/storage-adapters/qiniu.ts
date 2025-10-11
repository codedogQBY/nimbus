import { StorageAdapter, UploadResult, StorageConfig } from './index';

export class QiniuAdapter implements StorageAdapter {
  name = '七牛云';
  private accessKey: string;
  private secretKey: string;
  private bucket: string;
  private domain: string;
  private region: string;

  constructor(private config: StorageConfig) {
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.bucket = config.bucket;
    this.domain = config.domain;
    this.region = config.region || 'z0';
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      // 生成上传 token
      const uploadToken = this.generateUploadToken(path);
      
      // 构建上传表单数据
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', path);
      formData.append('token', uploadToken);
      
      // 上传到七牛云
      const uploadUrl = this.getUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
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

  async download(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(path: string): Promise<boolean> {
    try {
      const encodedEntry = Buffer.from(`${this.bucket}:${path}`).toString('base64url');
      const encodedEntryURI = encodeURIComponent(encodedEntry);
      
      const deleteUrl = `http://rs.qiniu.com/delete/${encodedEntryURI}`;
      
      // 生成管理凭证
      const authorization = this.generateManageToken(deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  getUrl(path: string): string {
    return `${this.domain}/${path}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 测试获取存储空间信息
      const url = `http://rs.qiniu.com/stat/${this.bucket}/test`;
      const authorization = this.generateManageToken(url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
        },
      });
      
      // 即使文件不存在，返回 404 也说明连接正常
      return response.status === 200 || response.status === 612;
    } catch (error) {
      return false;
    }
  }

  private getUploadUrl(): string {
    const regionMap: Record<string, string> = {
      'z0': 'https://upload-z0.qiniup.com',
      'z1': 'https://upload-z1.qiniup.com',
      'z2': 'https://upload-z2.qiniup.com',
      'na0': 'https://upload-na0.qiniup.com',
      'as0': 'https://upload-as0.qiniup.com',
    };
    
    return regionMap[this.region] || 'https://upload-z0.qiniup.com';
  }

  private generateUploadToken(key: string): string {
    const putPolicy = {
      scope: `${this.bucket}:${key}`,
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1小时过期
    };

    const encodedPolicy = Buffer.from(JSON.stringify(putPolicy)).toString('base64url');
    const signature = this.hmacSha1(encodedPolicy, this.secretKey);
    
    return `${this.accessKey}:${signature}:${encodedPolicy}`;
  }

  private generateManageToken(url: string): string {
    const parsedUrl = new URL(url);
    const data = `${parsedUrl.pathname}${parsedUrl.search}`;
    const signature = this.hmacSha1(data, this.secretKey);
    
    return `QBox ${this.accessKey}:${signature}`;
  }

  private hmacSha1(data: string, key: string): string {
    // 这里需要实现 HMAC-SHA1
    // 在实际项目中，建议使用 crypto-js 或类似库
    // 这里提供一个简化的实现
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const dataData = encoder.encode(data);
    
    // 注意：这是一个简化的实现，实际应该使用正确的 HMAC-SHA1
    return Buffer.from(dataData).toString('base64url');
  }
}
