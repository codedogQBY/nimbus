import upyun from "upyun";

import { StorageAdapter, UploadResult, StorageConfig } from "./index";

export interface UpyunConfig extends StorageConfig {
  bucket: string;
  operator: string;
  password: string;
  domain: string; // CDN域名（文件访问域名）
  apiDomain?: string; // API域名（默认使用api.upyun.com）
  protocol?: "http" | "https";
}

export class UpyunAdapter implements StorageAdapter {
  name = "又拍云";
  private client: any;
  private service: any;
  private domain: string;
  private protocol: string;

  constructor(private config: UpyunConfig) {
    // 验证必要参数
    if (!config.bucket || !config.operator || !config.password) {
      throw new Error("又拍云配置缺少必要参数：bucket, operator, password");
    }

    // 清理配置参数
    const cleanDomain = config.domain.trim().replace(/[`'"]/g, "");
    const cleanBucket = config.bucket.trim();
    const cleanOperator = config.operator.trim();
    const cleanPassword = config.password.trim();

    console.log("初始化又拍云适配器:", {
      bucket: cleanBucket,
      operator: cleanOperator,
      domain: cleanDomain,
      apiDomain: config.apiDomain || "v0.api.upyun.com",
      apiProtocol: "http",
      cdnProtocol: config.protocol || "https",
      hasPassword: !!cleanPassword,
    });

    // 创建又拍云服务实例
    this.service = new upyun.Service(cleanBucket, cleanOperator, cleanPassword);

    // 创建又拍云客户端实例，关键：传入options参数
    const options = {
      domain: config.apiDomain || "v0.api.upyun.com", // 使用REST API成功的域名
      protocol: "http", // 使用http协议
    };

    this.client = new upyun.Client(this.service, options);
    this.domain = cleanDomain; // 这是CDN访问域名
    this.protocol = config.protocol || "https";
  }

  async upload(file: File, path: string): Promise<UploadResult> {
    try {
      // 将File转换为Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 清理路径格式
      const cleanPath = this.cleanPath(path);

      // 设置上传选项（根据blog项目的实现）
      const options: any = {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": buffer.length,
      };

      console.log(`Uploading file to Upyun:`, {
        path: cleanPath,
        size: buffer.length,
        contentType: file.type,
        fileName: file.name,
      });

      // 执行上传
      const result = await this.client.putFile(cleanPath, buffer, options);

      console.log("Raw putFile result:", {
        result,
        type: typeof result,
        isTrue: result === true,
        isTruthy: !!result,
      });

      // 根据blog项目的经验，putFile成功时应该返回true或truthy值
      if (result === true || (result && typeof result === "object")) {
        const url = this.getUrl(cleanPath);

        console.log(`File uploaded successfully: ${cleanPath} -> ${url}`);

        return {
          success: true,
          url,
          path: cleanPath,
          size: file.size,
          metadata: typeof result === "object" ? result : undefined,
        };
      } else {
        console.error("Upload failed - putFile returned:", result);

        return {
          success: false,
          error: `Upload failed: putFile returned ${JSON.stringify(result)}`,
        };
      }
    } catch (error) {
      console.error("Upyun upload error:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async download(path: string): Promise<Buffer> {
    try {
      // 构建完整的CDN URL
      const fullUrl = this.getUrl(path);

      console.log(`Downloading file from Upyun: ${path} -> ${fullUrl}`);

      // 使用HTTP请求下载文件
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Upyun download error:", error);
      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(path: string): Promise<boolean> {
    try {
      // 清理路径格式
      const cleanPath = this.cleanPath(path);

      console.log(`Deleting file from Upyun: ${cleanPath}`);

      // 执行删除操作
      const result = await this.client.deleteFile(cleanPath);

      return result === true;
    } catch (error) {
      console.error("Upyun delete error:", error);

      return false;
    }
  }

  getUrl(path: string): string {
    // 确保路径以/开头
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    // 确保域名不以/结尾
    let normalizedDomain = this.domain.endsWith("/")
      ? this.domain.slice(0, -1)
      : this.domain;

    // 如果域名不包含协议，则添加协议
    if (
      !normalizedDomain.startsWith("http://") &&
      !normalizedDomain.startsWith("https://")
    ) {
      normalizedDomain = `${this.protocol}://${normalizedDomain}`;
    }

    return `${normalizedDomain}${normalizedPath}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing Upyun connection with config:", {
        bucket: this.config.bucket,
        operator: this.config.operator,
        domain: this.config.domain,
        apiDomain: this.config.apiDomain || "api.upyun.com",
        hasPassword: !!this.config.password,
      });

      // 使用headFile检查根目录，如果不存在会报错但不影响连接测试
      // 或者使用listDir列举根目录
      try {
        const result = await this.client.listDir("/");

        console.log(
          "Upyun listDir result type:",
          typeof result,
          "value:",
          result,
        );

        // 又拍云的listDir在不同情况下可能返回不同类型的值：
        // - 有文件时返回 { files: [...] }
        // - 空目录时可能返回 true 或空对象
        // - 目录不存在时抛出异常
        if (result === true || result === false) {
          return true; // boolean结果表示操作成功
        }

        return !!(result && (result.files || Array.isArray(result)));
      } catch (listError: any) {
        // 如果listDir失败，尝试usage
        console.log("ListDir failed, trying usage API:", listError.message);
        const usage = await this.client.usage("/");

        console.log("Upyun usage result:", usage, "type:", typeof usage);

        // usage可能返回数字或包含数字的对象
        return (
          (typeof usage === "number" && usage >= 0) ||
          (usage && typeof usage === "object")
        );
      }
    } catch (error: any) {
      console.error("Upyun connection test error:", {
        message: error.message,
        code: error.code,
        status: error.status,
        statusCode: error.statusCode,
      });

      // 提供更详细的错误信息
      if (error.code === 40100005) {
        console.error("Auth error: 操作员不存在、密码错误或权限不足");
      }

      return false;
    }
  }

  /**
   * 获取目录列表
   */
  async listDir(
    path: string = "/",
    options?: { limit?: number; order?: "asc" | "desc" },
  ): Promise<any> {
    try {
      const cleanPath = this.cleanPath(path, true);
      const listOptions = {
        limit: options?.limit || 100,
        order: options?.order || "asc",
      };

      console.log(`Listing directory: ${cleanPath}`);

      return await this.client.listDir(cleanPath, listOptions);
    } catch (error) {
      console.error("Upyun listDir error:", error);
      throw error;
    }
  }

  /**
   * 获取服务使用量
   */
  async getUsage(path: string = "/"): Promise<number> {
    try {
      const cleanPath = this.cleanPath(path, true);

      return await this.client.usage(cleanPath);
    } catch (error) {
      console.error("Upyun getUsage error:", error);
      throw error;
    }
  }

  /**
   * 创建目录
   */
  async makeDir(path: string): Promise<boolean> {
    try {
      const cleanPath = this.cleanPath(path);
      const result = await this.client.makeDir(cleanPath);

      return result === true;
    } catch (error) {
      console.error("Upyun makeDir error:", error);

      return false;
    }
  }

  /**
   * 清理路径格式
   * @param path 原始路径
   * @param isDir 是否为目录
   * @returns 清理后的路径
   */
  private cleanPath(path: string, isDir: boolean = false): string {
    if (!path) {
      return "/";
    }

    // 移除多余的斜杠并确保以单个斜杠开头
    let cleanPath = path.replace(/\/+/g, "/"); // 将多个斜杠替换为单个斜杠

    if (!cleanPath.startsWith("/")) {
      cleanPath = "/" + cleanPath;
    }

    // 对于根目录，直接返回 '/'
    if (cleanPath === "/" && isDir) {
      return "/";
    }

    // 移除结尾的斜杠（除非是根目录）
    if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
      cleanPath = cleanPath.slice(0, -1);
    }

    return cleanPath;
  }
}
