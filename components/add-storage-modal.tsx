"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  CloudIcon,
  AlertCircleIcon,
  DatabaseIcon,
  SendIcon,
  GithubIcon,
  HardDriveIcon,
  ImageIcon,
  CodeIcon,
} from "lucide-react";
import ky from "ky";

interface AddStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const storageTypes = [
  { key: "local", label: "本地存储", Icon: HardDriveIcon },
  { key: "r2", label: "Cloudflare R2", Icon: CloudIcon },
  { key: "qiniu", label: "七牛云", Icon: DatabaseIcon },
  { key: "minio", label: "MinIO", Icon: HardDriveIcon },
  { key: "upyun", label: "又拍云", Icon: ImageIcon },
  { key: "telegram", label: "Telegram Bot", Icon: SendIcon },
  { key: "cloudinary", label: "Cloudinary", Icon: CloudIcon },
  { key: "github", label: "GitHub", Icon: GithubIcon },
  { key: "custom", label: "自定义图床", Icon: CodeIcon },
];

export function AddStorageModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStorageModalProps) {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [storageType, setStorageType] = useState("local");

  // 通用字段
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("10");
  const [quotaLimit, setQuotaLimit] = useState("10");

  // R2 配置
  const [r2AccountId, setR2AccountId] = useState("");
  const [r2AccessKeyId, setR2AccessKeyId] = useState("");
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState("");
  const [r2BucketName, setR2BucketName] = useState("");

  // 七牛云配置
  const [qiniuAccessKey, setQiniuAccessKey] = useState("");
  const [qiniuSecretKey, setQiniuSecretKey] = useState("");
  const [qiniuBucket, setQiniuBucket] = useState("");
  const [qiniuRegion, setQiniuRegion] = useState("");
  const [qiniuDomain, setQiniuDomain] = useState("");

  // Telegram 配置
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  // GitHub 配置
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubPath, setGithubPath] = useState("");

  // MinIO 配置
  const [minioEndpoint, setMinioEndpoint] = useState("");
  const [minioAccessKey, setMinioAccessKey] = useState("");
  const [minioSecretKey, setMinioSecretKey] = useState("");
  const [minioBucket, setMinioBucket] = useState("");
  const [minioUseSSL, setMinioUseSSL] = useState(true);

  // 又拍云配置
  const [upyunOperator, setUpyunOperator] = useState("");
  const [upyunPassword, setUpyunPassword] = useState("");
  const [upyunBucket, setUpyunBucket] = useState("");
  const [upyunDomain, setUpyunDomain] = useState("");

  // Cloudinary 配置
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");

  // 自定义图床配置
  const [customUploadUrl, setCustomUploadUrl] = useState("");
  const [customDownloadUrl, setCustomDownloadUrl] = useState("");
  const [customMethod, setCustomMethod] = useState("POST");
  const [customHeaders, setCustomHeaders] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customResponsePath, setCustomResponsePath] = useState("");

  // 本地存储配置
  const [localBasePath, setLocalBasePath] = useState("./storage");
  const [localMaxFileSize, setLocalMaxFileSize] = useState("100");

  const buildConfig = () => {
    switch (storageType) {
      case "local":
        return {
          basePath: localBasePath,
          maxFileSize: parseInt(localMaxFileSize) * 1024 * 1024, // MB to Bytes
        };
      case "r2":
        return {
          accountId: r2AccountId,
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
          bucketName: r2BucketName,
        };
      case "qiniu":
        return {
          accessKey: qiniuAccessKey,
          secretKey: qiniuSecretKey,
          bucket: qiniuBucket,
          region: qiniuRegion,
          domain: qiniuDomain,
        };
      case "telegram":
        return {
          botToken: telegramBotToken,
          chatId: telegramChatId,
        };
      case "github":
        return {
          token: githubToken,
          repo: githubRepo,
          branch: githubBranch,
          path: githubPath,
        };
      case "minio":
        return {
          endpoint: minioEndpoint,
          accessKey: minioAccessKey,
          secretKey: minioSecretKey,
          bucket: minioBucket,
          useSSL: minioUseSSL,
        };
      case "upyun":
        return {
          operator: upyunOperator,
          password: upyunPassword,
          bucket: upyunBucket,
          domain: upyunDomain,
        };
      case "cloudinary":
        return {
          cloudName: cloudinaryCloudName,
          apiKey: cloudinaryApiKey,
          apiSecret: cloudinaryApiSecret,
        };
      case "custom":
        return {
          uploadUrl: customUploadUrl,
          downloadUrl: customDownloadUrl,
          method: customMethod,
          headers: customHeaders ? JSON.parse(customHeaders) : {},
          body: customBody,
          responsePath: customResponsePath,
        };
      default:
        return {};
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError("请输入存储源名称");

      return false;
    }

    switch (storageType) {
      case "local":
        if (!localBasePath.trim()) {
          setError("请输入本地存储路径");

          return false;
        }
        if (!localMaxFileSize || parseInt(localMaxFileSize) <= 0) {
          setError("请输入有效的文件大小限制");

          return false;
        }
        break;
      case "r2":
        if (
          !r2AccountId ||
          !r2AccessKeyId ||
          !r2SecretAccessKey ||
          !r2BucketName
        ) {
          setError("请填写完整的 R2 配置信息");

          return false;
        }
        break;
      case "qiniu":
        if (
          !qiniuAccessKey ||
          !qiniuSecretKey ||
          !qiniuBucket ||
          !qiniuRegion ||
          !qiniuDomain
        ) {
          setError("请填写完整的七牛云配置信息");

          return false;
        }
        break;
      case "telegram":
        if (!telegramBotToken || !telegramChatId) {
          setError("请填写完整的 Telegram 配置信息");

          return false;
        }
        break;
      case "github":
        if (!githubToken || !githubRepo) {
          setError("请填写完整的 GitHub 配置信息");

          return false;
        }
        break;
      case "minio":
        if (
          !minioEndpoint ||
          !minioAccessKey ||
          !minioSecretKey ||
          !minioBucket
        ) {
          setError("请填写完整的 MinIO 配置信息");

          return false;
        }
        break;
      case "upyun":
        if (!upyunOperator || !upyunPassword || !upyunBucket || !upyunDomain) {
          setError("请填写完整的又拍云配置信息");

          return false;
        }
        break;
      case "cloudinary":
        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
          setError("请填写完整的 Cloudinary 配置信息");

          return false;
        }
        break;
      case "custom":
        if (!customUploadUrl || !customDownloadUrl || !customResponsePath) {
          setError(
            "请填写完整的自定义图床配置信息（上传URL、下载URL、响应路径）",
          );

          return false;
        }
        break;
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setTestLoading(true);
    setTestResult(null);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await ky
        .post("/api/storage-sources/test", {
          headers: { Authorization: `Bearer ${token}` },
          json: {
            type: storageType,
            config: buildConfig(),
          },
        })
        .json<{
          success: boolean;
          connected: boolean;
          message: string;
          error?: string;
        }>();

      setTestResult({
        success: response.connected,
        message: response.message,
      });

      if (!response.connected && response.error) {
        setError(`测试失败: ${response.error}`);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "测试连接失败",
      });
      setError(err.message || "测试连接失败");
    } finally {
      setTestLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      await ky
        .post("/api/storage-sources", {
          headers: { Authorization: `Bearer ${token}` },
          json: {
            name: name.trim(),
            type: storageType,
            config: buildConfig(),
            priority: parseInt(priority),
            quotaLimit: parseInt(quotaLimit) * 1024 * 1024 * 1024, // GB to Bytes
          },
        })
        .json();

      resetForm();
      onSuccess?.();
      onClose();

      // 触发存储更新事件，通知侧边栏刷新
      window.dispatchEvent(new CustomEvent("storageUpdated"));
    } catch (err: any) {
      setError(err.message || "添加存储源失败");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPriority("10");
    setQuotaLimit("10");
    setR2AccountId("");
    setR2AccessKeyId("");
    setR2SecretAccessKey("");
    setR2BucketName("");
    setQiniuAccessKey("");
    setQiniuSecretKey("");
    setQiniuBucket("");
    setQiniuRegion("");
    setQiniuDomain("");
    setTelegramBotToken("");
    setTelegramChatId("");
    setGithubToken("");
    setGithubRepo("");
    setGithubBranch("main");
    setGithubPath("");
    setMinioEndpoint("");
    setMinioAccessKey("");
    setMinioSecretKey("");
    setMinioBucket("");
    setMinioUseSSL(true);
    setUpyunOperator("");
    setUpyunPassword("");
    setUpyunBucket("");
    setUpyunDomain("");
    setCloudinaryCloudName("");
    setCloudinaryApiKey("");
    setCloudinaryApiSecret("");
    setCustomUploadUrl("");
    setCustomDownloadUrl("");
    setCustomMethod("POST");
    setCustomHeaders("");
    setCustomBody("");
    setCustomResponsePath("");
    setLocalBasePath("./storage");
    setLocalMaxFileSize("100");
    setError("");
    setTestResult(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      isDismissable={!loading}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <CloudIcon className="w-5 h-5 text-amber-brown-500" />
          添加存储源
        </ModalHeader>
        <ModalBody className="gap-4">
          {/* 存储源类型选择 */}
          <Tabs
            className="w-full"
            color="primary"
            selectedKey={storageType}
            variant="underlined"
            onSelectionChange={(key) => setStorageType(key as string)}
          >
            {storageTypes.map((type) => {
              const Icon = type.Icon;

              return (
                <Tab
                  key={type.key}
                  title={
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs lg:text-sm">{type.label}</span>
                    </div>
                  }
                />
              );
            })}
          </Tabs>

          <Divider />

          {/* 通用配置 */}
          <div className="space-y-3">
            <Input
              isRequired
              label="存储源名称"
              placeholder="例如：我的 Cloudflare R2"
              size="sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                description="数字越大优先级越高"
                label="优先级"
                max="100"
                min="0"
                placeholder="0-100"
                size="sm"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />

              <Input
                label="存储配额 (GB)"
                min="1"
                placeholder="10"
                size="sm"
                type="number"
                value={quotaLimit}
                onChange={(e) => setQuotaLimit(e.target.value)}
              />
            </div>
          </div>

          <Divider />

          {/* 特定存储源配置 */}
          <div className="space-y-3">
            {storageType === "local" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  本地存储配置
                </h4>
                <Input
                  isRequired
                  description="本地文件系统中存储文件的目录路径"
                  label="存储路径"
                  placeholder="./storage"
                  size="sm"
                  value={localBasePath}
                  onChange={(e) => setLocalBasePath(e.target.value)}
                />
                <Input
                  isRequired
                  description="单个文件的最大大小限制"
                  label="单文件大小限制 (MB)"
                  min="1"
                  placeholder="100"
                  size="sm"
                  type="number"
                  value={localMaxFileSize}
                  onChange={(e) => setLocalMaxFileSize(e.target.value)}
                />
                <div className="bg-info-50 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-info-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-info-700">
                      <p className="font-semibold mb-1">注意事项：</p>
                      <div className="space-y-1">
                        <p>• 确保指定的路径具有读写权限</p>
                        <p>• 建议使用绝对路径，避免相对路径</p>
                        <p>• 存储路径将自动创建（如果不存在）</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {storageType === "r2" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  Cloudflare R2 配置
                </h4>
                <Input
                  isRequired
                  label="Account ID"
                  placeholder="从 Cloudflare 控制台获取"
                  size="sm"
                  value={r2AccountId}
                  onChange={(e) => setR2AccountId(e.target.value)}
                />
                <Input
                  isRequired
                  label="Access Key ID"
                  placeholder="R2 API Token"
                  size="sm"
                  value={r2AccessKeyId}
                  onChange={(e) => setR2AccessKeyId(e.target.value)}
                />
                <Input
                  isRequired
                  label="Secret Access Key"
                  placeholder="R2 API Secret"
                  size="sm"
                  type="password"
                  value={r2SecretAccessKey}
                  onChange={(e) => setR2SecretAccessKey(e.target.value)}
                />
                <Input
                  isRequired
                  label="Bucket Name"
                  placeholder="your-bucket-name"
                  size="sm"
                  value={r2BucketName}
                  onChange={(e) => setR2BucketName(e.target.value)}
                />
              </>
            )}

            {storageType === "qiniu" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  七牛云配置
                </h4>
                <Input
                  isRequired
                  label="Access Key"
                  placeholder="从七牛云控制台获取"
                  size="sm"
                  value={qiniuAccessKey}
                  onChange={(e) => setQiniuAccessKey(e.target.value)}
                />
                <Input
                  isRequired
                  label="Secret Key"
                  placeholder="七牛云 Secret Key"
                  size="sm"
                  type="password"
                  value={qiniuSecretKey}
                  onChange={(e) => setQiniuSecretKey(e.target.value)}
                />
                <Input
                  isRequired
                  label="Bucket"
                  placeholder="存储空间名称"
                  size="sm"
                  value={qiniuBucket}
                  onChange={(e) => setQiniuBucket(e.target.value)}
                />
                <Select
                  isRequired
                  label="区域"
                  placeholder="选择区域"
                  selectedKeys={qiniuRegion ? [qiniuRegion] : []}
                  size="sm"
                  onChange={(e) => setQiniuRegion(e.target.value)}
                >
                  <SelectItem key="z0">华东</SelectItem>
                  <SelectItem key="z1">华北</SelectItem>
                  <SelectItem key="z2">华南</SelectItem>
                  <SelectItem key="na0">北美</SelectItem>
                  <SelectItem key="as0">东南亚</SelectItem>
                </Select>
                <Input
                  isRequired
                  label="CDN 域名"
                  placeholder="https://cdn.example.com"
                  size="sm"
                  value={qiniuDomain}
                  onChange={(e) => setQiniuDomain(e.target.value)}
                />
              </>
            )}

            {storageType === "telegram" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  Telegram Bot 配置
                </h4>
                <Input
                  isRequired
                  label="Bot Token"
                  placeholder="从 @BotFather 获取"
                  size="sm"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                />
                <Input
                  isRequired
                  label="Chat ID"
                  placeholder="频道或群组 ID"
                  size="sm"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
                <div className="bg-warning-50 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-700">
                      注意：Telegram 文件大小限制为 2GB，建议用于小文件存储
                    </p>
                  </div>
                </div>
              </>
            )}

            {storageType === "github" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  GitHub 配置
                </h4>
                <Input
                  isRequired
                  label="Personal Access Token"
                  placeholder="GitHub PAT"
                  size="sm"
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <Input
                  isRequired
                  label="Repository"
                  placeholder="username/repo-name"
                  size="sm"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
                <Input
                  label="Branch"
                  placeholder="main"
                  size="sm"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                />
                <Input
                  label="存储路径"
                  placeholder="files/ (可选)"
                  size="sm"
                  value={githubPath}
                  onChange={(e) => setGithubPath(e.target.value)}
                />
                <div className="bg-warning-50 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-700">
                      注意：GitHub 单文件限制为 100MB，仓库总大小建议不超过 5GB
                    </p>
                  </div>
                </div>
              </>
            )}

            {storageType === "minio" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  MinIO 配置
                </h4>
                <Input
                  isRequired
                  label="Endpoint"
                  placeholder="http://localhost:9000"
                  size="sm"
                  value={minioEndpoint}
                  onChange={(e) => setMinioEndpoint(e.target.value)}
                />
                <Input
                  isRequired
                  label="Access Key"
                  placeholder="MinIO Access Key"
                  size="sm"
                  value={minioAccessKey}
                  onChange={(e) => setMinioAccessKey(e.target.value)}
                />
                <Input
                  isRequired
                  label="Secret Key"
                  placeholder="MinIO Secret Key"
                  size="sm"
                  type="password"
                  value={minioSecretKey}
                  onChange={(e) => setMinioSecretKey(e.target.value)}
                />
                <Input
                  isRequired
                  label="Bucket Name"
                  placeholder="bucket-name"
                  size="sm"
                  value={minioBucket}
                  onChange={(e) => setMinioBucket(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    checked={minioUseSSL}
                    className="rounded"
                    id="minioSSL"
                    type="checkbox"
                    onChange={(e) => setMinioUseSSL(e.target.checked)}
                  />
                  <label
                    className="text-sm text-dark-olive-700"
                    htmlFor="minioSSL"
                  >
                    使用 HTTPS
                  </label>
                </div>
              </>
            )}

            {storageType === "upyun" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  又拍云配置
                </h4>
                <Input
                  isRequired
                  label="操作员"
                  placeholder="操作员账号"
                  size="sm"
                  value={upyunOperator}
                  onChange={(e) => setUpyunOperator(e.target.value)}
                />
                <Input
                  isRequired
                  label="密码"
                  placeholder="操作员密码"
                  size="sm"
                  type="password"
                  value={upyunPassword}
                  onChange={(e) => setUpyunPassword(e.target.value)}
                />
                <Input
                  isRequired
                  label="存储空间"
                  placeholder="bucket-name"
                  size="sm"
                  value={upyunBucket}
                  onChange={(e) => setUpyunBucket(e.target.value)}
                />
                <Input
                  isRequired
                  label="CDN 域名"
                  placeholder="https://cdn.example.com"
                  size="sm"
                  value={upyunDomain}
                  onChange={(e) => setUpyunDomain(e.target.value)}
                />
              </>
            )}

            {storageType === "cloudinary" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  Cloudinary 配置
                </h4>
                <Input
                  isRequired
                  label="Cloud Name"
                  placeholder="your-cloud-name"
                  size="sm"
                  value={cloudinaryCloudName}
                  onChange={(e) => setCloudinaryCloudName(e.target.value)}
                />
                <Input
                  isRequired
                  label="API Key"
                  placeholder="Cloudinary API Key"
                  size="sm"
                  value={cloudinaryApiKey}
                  onChange={(e) => setCloudinaryApiKey(e.target.value)}
                />
                <Input
                  isRequired
                  label="API Secret"
                  placeholder="Cloudinary API Secret"
                  size="sm"
                  type="password"
                  value={cloudinaryApiSecret}
                  onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                />
              </>
            )}

            {storageType === "custom" && (
              <>
                <h4 className="text-sm font-semibold text-dark-olive-800">
                  自定义图床配置
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  <Input
                    isRequired
                    label="上传接口 URL"
                    placeholder="https://api.example.com/upload"
                    size="sm"
                    value={customUploadUrl}
                    onChange={(e) => setCustomUploadUrl(e.target.value)}
                  />

                  <Input
                    isRequired
                    label="下载接口 URL"
                    placeholder="https://cdn.example.com/{filename} 或 https://api.example.com/files/{id}"
                    size="sm"
                    value={customDownloadUrl}
                    onChange={(e) => setCustomDownloadUrl(e.target.value)}
                  />
                </div>

                <Select
                  label="请求方法"
                  placeholder="选择请求方法"
                  selectedKeys={[customMethod]}
                  size="sm"
                  onChange={(e) => setCustomMethod(e.target.value)}
                >
                  <SelectItem key="POST">POST</SelectItem>
                  <SelectItem key="PUT">PUT</SelectItem>
                  <SelectItem key="PATCH">PATCH</SelectItem>
                </Select>

                <Textarea
                  label="请求头 (JSON 格式)"
                  minRows={3}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  size="sm"
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                />

                <Textarea
                  label="请求体模板"
                  minRows={3}
                  placeholder='{"file": "{{file}}", "folder": "uploads"}'
                  size="sm"
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                />

                <Input
                  isRequired
                  label="响应中文件URL的路径"
                  placeholder="data.url 或 result.link"
                  size="sm"
                  value={customResponsePath}
                  onChange={(e) => setCustomResponsePath(e.target.value)}
                />

                <div className="bg-info-50 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-info-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-info-700">
                      <p className="font-semibold mb-2">模板变量：</p>
                      <div className="space-y-1">
                        <p>
                          • <code>{"{{file}}"}</code> - 文件数据
                        </p>
                        <p>
                          • <code>{"{{filename}}"}</code> - 文件名
                        </p>
                        <p>
                          • <code>{"{{timestamp}}"}</code> - 时间戳
                        </p>
                      </div>
                      <p className="font-semibold mt-2 mb-1">下载URL变量：</p>
                      <div className="space-y-1">
                        <p>
                          • <code>{"{filename}"}</code> - 文件名
                        </p>
                        <p>
                          • <code>{"{id}"}</code> - 文件ID
                        </p>
                        <p>
                          • <code>{"{path}"}</code> - 文件路径
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-success-50 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-success-700">
                      <p className="font-semibold mb-1">示例配置：</p>
                      <p>
                        <strong>上传：</strong> https://api.example.com/upload
                      </p>
                      <p>
                        <strong>下载：</strong> https://cdn.example.com/
                        {"{filename}"}
                      </p>
                      <p>
                        <strong>响应路径：</strong> data.url
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="bg-danger-50 rounded-lg p-3">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          {testResult && (
            <div
              className={`rounded-lg p-3 ${testResult.success ? "bg-success-50" : "bg-danger-50"}`}
            >
              <p
                className={`text-xs ${testResult.success ? "text-success" : "text-danger"}`}
              >
                {testResult.message}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            isDisabled={loading || testLoading}
            variant="flat"
            onPress={handleClose}
          >
            取消
          </Button>
          <Button
            color="secondary"
            isDisabled={loading}
            isLoading={testLoading}
            variant="flat"
            onPress={handleTestConnection}
          >
            测试连接
          </Button>
          <Button
            className="bg-amber-brown-500"
            color="primary"
            isDisabled={testLoading}
            isLoading={loading}
            onPress={handleCreate}
          >
            添加
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
