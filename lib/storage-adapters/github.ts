import { StorageAdapter, UploadResult, StorageConfig } from './index';

export interface GitHubConfig extends StorageConfig {
  token: string;
  repo: string; // 格式: username/repository
  branch?: string;
  path?: string;
}

export class GitHubAdapter implements StorageAdapter {
  name = 'GitHub';
  private token: string;
  private repo: string;
  private branch: string;
  private path: string;

  // GitHub单文件大小限制为100MB
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  constructor(private config: GitHubConfig) {
    if (!config.token) {
      throw new Error('GitHub token is required');
    }
    if (!config.repo) {
      throw new Error('GitHub repository is required');
    }

    this.token = config.token;
    this.repo = config.repo;
    this.branch = config.branch || 'main';
    this.path = config.path || 'uploads/';

    // 确保路径以 / 结尾
    if (this.path && !this.path.endsWith('/')) {
      this.path += '/';
    }
  }

  async initialize(): Promise<void> {
    // 测试连接和权限
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to GitHub repository. Please check your token and repository permissions.');
    }
  }

  async upload(file: File, filePath: string): Promise<UploadResult> {
    try {
      // 检查文件大小限制
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过GitHub限制 ${this.MAX_FILE_SIZE / 1024 / 1024}MB。请使用其他存储源或压缩文件。`
        };
      }

      // 读取文件内容并转换为base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const content = buffer.toString('base64');

      const fullPath = `${this.path}${filePath}`;

      // 检查文件是否已存在
      const existingFile = await this.getFileInfo(fullPath);

      const apiUrl = `https://api.github.com/repos/${this.repo}/contents/${fullPath}`;
      const requestBody: any = {
        message: `Upload file: ${filePath}`,
        content: content,
        branch: this.branch
      };

      // 如果文件已存在，需要提供 sha
      if (existingFile) {
        requestBody.sha = existingFile.sha;
        requestBody.message = `Update file: ${filePath}`;
      }

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error(`GitHub API认证失败: Token无效或已过期。请检查GitHub Personal Access Token。`);
        } else if (response.status === 403) {
          if (errorData.message?.includes('Resource not accessible')) {
            throw new Error(`GitHub API权限不足: Token缺少必要权限。请确保Token具有 "Contents" 写入权限和 "Metadata" 读取权限。当前错误: ${errorData.message || ''}`);
          } else {
            throw new Error(`GitHub API权限被拒绝: ${errorData.message || '权限不足'}`);
          }
        } else if (response.status === 404) {
          throw new Error(`GitHub仓库未找到: 请检查仓库名称 "${this.repo}" 是否正确，或Token是否有访问权限。`);
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
        }
      }

      const responseData = await response.json();

      return {
        success: true,
        url: this.getUrl(filePath),
        path: filePath,
        metadata: {
          sha: responseData.content?.sha,
          download_url: responseData.content?.download_url
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `GitHub上传失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async download(pathOrUrl: string): Promise<Buffer> {
    try {
      let downloadUrl: string;

      // 如果是完整URL，直接使用；否则构建URL
      if (pathOrUrl.startsWith('http')) {
        downloadUrl = pathOrUrl;
      } else {
        downloadUrl = this.getUrl(pathOrUrl);
      }

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3.raw',
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      throw new Error(`GitHub下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = `${this.path}${filePath}`;

      // 获取文件信息以获取 sha
      const fileInfo = await this.getFileInfo(fullPath);
      if (!fileInfo) {
        return true; // 文件不存在，认为删除成功
      }

      const apiUrl = `https://api.github.com/repos/${this.repo}/contents/${fullPath}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Delete file: ${filePath}`,
          sha: fileInfo.sha,
          branch: this.branch
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error(`GitHub API认证失败: Token无效或已过期。`);
        } else if (response.status === 403) {
          throw new Error(`GitHub API权限不足: Token缺少删除文件的权限。`);
        } else if (response.status === 404) {
          return true; // 文件不存在，认为删除成功
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
        }
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  getUrl(filePath: string): string {
    // 使用 raw.githubusercontent.com 获取原始文件内容
    return `https://raw.githubusercontent.com/${this.repo}/${this.branch}/${this.path}${filePath}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 测试仓库访问权限
      const response = await fetch(`https://api.github.com/repos/${this.repo}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('GitHub connection test failed: Invalid token (401 Unauthorized)');
        } else if (response.status === 403) {
          console.error('GitHub connection test failed: Token lacks required permissions (403 Forbidden)');
        } else if (response.status === 404) {
          console.error('GitHub connection test failed: Repository not found or no access (404 Not Found)');
        } else {
          console.error(`GitHub connection test failed: ${response.status} ${response.statusText}`);
        }
        return false;
      }

      const repoInfo = await response.json();

      // 检查是否有写权限
      const hasWritePermission = repoInfo.permissions?.push || repoInfo.permissions?.admin;
      if (!hasWritePermission) {
        return false;
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件信息（包括 sha）
   */
  private async getFileInfo(filePath: string): Promise<{ sha: string; download_url: string } | null> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.repo}/contents/${filePath}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (response.status === 404) {
        return null; // 文件不存在
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const fileData = await response.json();
      return {
        sha: fileData.sha,
        download_url: fileData.download_url
      };

    } catch (error) {
      return null;
    }
  }
}
