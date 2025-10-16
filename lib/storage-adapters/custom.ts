import { StorageAdapter, UploadResult, StorageConfig } from "./index";

export class CustomAdapter implements StorageAdapter {
  name = "自定义图床";
  private uploadUrl: string;
  private downloadUrl: string;
  private method: string;
  private headers: Record<string, string>;
  private bodyTemplate: string;
  private responsePath: string;

  constructor(private config: StorageConfig) {
    this.uploadUrl = config.uploadUrl;
    this.downloadUrl = config.downloadUrl;
    this.method = config.method || "POST";
    this.headers = config.headers || {};
    this.bodyTemplate = config.body || "{}";
    this.responsePath = config.responsePath;
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      // 构建请求体
      const body = this.buildRequestBody(file, path);

      // 发送上传请求
      const response = await fetch(this.uploadUrl, {
        method: this.method,
        headers: {
          ...this.headers,
          "Content-Type": this.headers["Content-Type"] || "application/json",
        },
        body: this.method === "GET" ? undefined : body,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      // 从响应中提取文件 URL
      const fileUrl = this.extractUrlFromResponse(result);

      return {
        success: true,
        url: fileUrl,
        path: path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async download(url: string): Promise<Buffer> {
    try {
      // 构建下载 URL
      const downloadUrl = this.buildDownloadUrl(url);

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(path: string): Promise<boolean> {
    // 自定义图床通常不支持删除操作
    // 这里可以扩展支持删除 API
    console.warn("Delete operation not supported for custom storage");

    return false;
  }

  getUrl(path: string): string {
    return this.buildDownloadUrl(path);
  }

  getDirectUrl(path: string): string {
    // 自定义图床可以直接通过配置的下载URL访问文件
    return this.buildDownloadUrl(path);
  }

  async testConnection(): Promise<boolean> {
    try {
      // 发送一个测试请求
      const response = await fetch(this.uploadUrl, {
        method: "HEAD", // 使用 HEAD 请求测试连接
        headers: this.headers,
      });

      // 即使返回 405 Method Not Allowed，也说明服务器可达
      return response.status < 500;
    } catch (error) {
      return false;
    }
  }

  private buildRequestBody(file: File, path: string): string {
    const timestamp = Date.now().toString();

    // 替换模板变量
    let body = this.bodyTemplate
      .replace(/\{\{filename\}\}/g, file.name)
      .replace(/\{\{path\}\}/g, path)
      .replace(/\{\{timestamp\}\}/g, timestamp)
      .replace(/\{\{file\}\}/g, file.name); // 占位符，实际实现可能需要 base64

    try {
      // 如果是 JSON 格式，解析并验证
      const parsed = JSON.parse(body);

      return JSON.stringify(parsed);
    } catch {
      // 如果不是 JSON，直接返回
      return body;
    }
  }

  private extractUrlFromResponse(response: any): string {
    try {
      // 根据配置的路径提取 URL
      const pathParts = this.responsePath.split(".");
      let result = response;

      for (const part of pathParts) {
        if (result && typeof result === "object" && part in result) {
          result = result[part];
        } else {
          throw new Error(`Invalid response path: ${this.responsePath}`);
        }
      }

      if (typeof result === "string") {
        return result;
      }

      throw new Error("Invalid URL in response");
    } catch (error) {
      throw new Error(
        `Failed to extract URL from response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private buildDownloadUrl(path: string): string {
    // 从路径中提取文件名或 ID
    const filename = path.split("/").pop() || path;
    const id = filename.split(".")[0]; // 假设文件名格式为 id.extension

    return this.downloadUrl
      .replace(/\{filename\}/g, filename)
      .replace(/\{id\}/g, id)
      .replace(/\{path\}/g, path);
  }
}
