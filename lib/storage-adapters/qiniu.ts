import { StorageAdapter, UploadResult, StorageConfig } from './index';
import * as qiniu from 'qiniu';

export class QiniuAdapter implements StorageAdapter {
  name = '七牛云';
  private mac: qiniu.auth.digest.Mac;
  private config: qiniu.conf.Config;
  private bucket: string;
  private domain: string;
  private region: string;

  constructor(private storageConfig: StorageConfig) {
    this.mac = new qiniu.auth.digest.Mac(storageConfig.accessKey, storageConfig.secretKey);
    this.bucket = storageConfig.bucket;
    this.domain = storageConfig.domain;
    this.region = storageConfig.region || 'z0';

    // 配置七牛云区域
    this.config = new qiniu.conf.Config();
    this.config.zone = this.getZone(this.region);
    this.config.useHttpsDomain = true;
    this.config.useCdnDomain = false;
  }

  private getZone(region: string): qiniu.zone.Zone {
    const zoneMap: Record<string, qiniu.zone.Zone> = {
      'z0': qiniu.zone.Zone_z0,  // 华东
      'z1': qiniu.zone.Zone_z1,  // 华北
      'z2': qiniu.zone.Zone_z2,  // 华南
      'na0': qiniu.zone.Zone_na0, // 北美
      'as0': qiniu.zone.Zone_as0, // 东南亚
    };
    return zoneMap[region] || qiniu.zone.Zone_z0;
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      // 创建上传策略
      const putPolicy = new qiniu.rs.PutPolicy({
        scope: `${this.bucket}:${path}`,
        returnBody: '{"key":"$(key)","hash":"$(etag)","bucket":"$(bucket)","fsize":$(fsize)}'
      });

      // 生成上传token
      const uploadToken = putPolicy.uploadToken(this.mac);

      // 创建FormUploader
      const formUploader = new qiniu.form_up.FormUploader(this.config);
      const putExtra = new qiniu.form_up.PutExtra();

      // 将File转换为Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Promise((resolve) => {
        formUploader.put(
          uploadToken,
          path,
          buffer,
          putExtra,
          (respErr: any, respBody: any, respInfo: any) => {
            if (respErr) {
              console.error('Qiniu upload error:', respErr);
              resolve({
                success: false,
                error: respErr.message || 'Upload failed',
              });
              return;
            }

            if (respInfo.statusCode === 200) {
              const url = this.getUrl(path);
              resolve({
                success: true,
                url,
                path,
                size: respBody.fsize || file.size,
                hash: respBody.hash,
              });
            } else {
              console.error('Qiniu upload failed:', respInfo.statusCode, respBody);
              resolve({
                success: false,
                error: `Upload failed with status: ${respInfo.statusCode}`,
              });
            }
          }
        );
      });
    } catch (error) {
      console.error('Qiniu upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async download(url: string): Promise<Buffer> {
    try {
      // 如果是私有空间，需要生成签名URL
      let downloadUrl = url;

      // 简单判断：如果URL包含我们的domain，则认为是七牛云的URL
      if (url.includes(this.domain)) {
        // 为私有空间生成带签名的下载URL
        downloadUrl = this.generatePrivateDownloadUrl(url);
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Qiniu download error:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 生成私有空间的下载URL
  private generatePrivateDownloadUrl(url: string, expires: number = 3600): string {
    const deadline = Math.floor(Date.now() / 1000) + expires;
    const signUrl = `${url}?e=${deadline}`;

    // 使用官方SDK生成签名
    const accessToken = qiniu.util.generateAccessToken(this.mac, signUrl);
    return `${signUrl}&token=${accessToken}`;
  }

  async delete(path: string): Promise<boolean> {
    try {
      const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);

      return new Promise((resolve) => {
        bucketManager.delete(this.bucket, path, (err: any, respBody: any, respInfo: any) => {
          if (err) {
            console.error('Delete failed:', err);
            resolve(false);
            return;
          }

          if (respInfo.statusCode === 200) {
            resolve(true);
          } else {
            console.error('Delete failed with status:', respInfo.statusCode, respBody);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  getUrl(path: string): string {
    return `${this.domain}/${path}`;
  }

  // 获取文件的下载URL（支持私有空间）
  getDownloadUrl(path: string, expires: number = 3600): string {
    const url = this.getUrl(path);

    // 如果需要签名（私有空间），生成带签名的URL
    // 这里可以根据配置决定是否需要签名，暂时默认为公开空间
    // return this.generatePrivateDownloadUrl(url, expires);

    return url;
  }

  async testConnection(): Promise<boolean> {
    try {
      const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);

      console.log('Testing Qiniu connection using official SDK...');

      return new Promise((resolve) => {
        // 使用bucketStat API测试连接，这是一个轻量级的测试方式
        bucketManager.stat(this.bucket, 'non-existent-test-file', (err: any, respBody: any, respInfo: any) => {
          console.log(`Qiniu test response status: ${respInfo.statusCode}`);

          // 612表示文件不存在，但这说明认证是成功的
          // 200表示成功
          // 401表示认证失败
          if (respInfo.statusCode === 200 || respInfo.statusCode === 612) {
            console.log('Qiniu connection test successful');
            resolve(true);
          } else if (respInfo.statusCode === 401) {
            console.error('Qiniu authentication failed:', respBody);
            resolve(false);
          } else {
            console.error(`Qiniu connection test failed with status: ${respInfo.statusCode}`, respBody);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Qiniu connection test error:', error);
      return false;
    }
  }

}
