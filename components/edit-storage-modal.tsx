'use client';

import { useState, useEffect } from 'react';
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
  Chip,
} from '@heroui/react';
import {
  CloudIcon,
  DatabaseIcon,
  SendIcon,
  GithubIcon,
  ServerIcon,
  HardDriveIcon,
  ImageIcon,
  CodeIcon,
  AlertCircleIcon,
} from 'lucide-react';
import ky from 'ky';

interface EditStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storageSource: any;
}

const storageTypes = [
  { key: 'r2', label: 'Cloudflare R2', icon: CloudIcon },
  { key: 'qiniu', label: '七牛云', icon: CloudIcon },
  { key: 'minio', label: 'MinIO', icon: DatabaseIcon },
  { key: 'upyun', label: '又拍云', icon: CloudIcon },
  { key: 'telegram', label: 'Telegram', icon: SendIcon },
  { key: 'cloudinary', label: 'Cloudinary', icon: ImageIcon },
  { key: 'github', label: 'GitHub', icon: GithubIcon },
  { key: 'custom', label: '自定义图床', icon: CodeIcon },
];

export function EditStorageModal({ isOpen, onClose, onSuccess, storageSource }: EditStorageModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 基本信息
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState(50);
  const [quotaLimit, setQuotaLimit] = useState('');
  const [isActive, setIsActive] = useState(true);

  // 各种存储源的配置
  const [r2AccountId, setR2AccountId] = useState('');
  const [r2AccessKey, setR2AccessKey] = useState('');
  const [r2SecretKey, setR2SecretKey] = useState('');
  const [r2Bucket, setR2Bucket] = useState('');
  const [r2Domain, setR2Domain] = useState('');

  const [qiniuAccessKey, setQiniuAccessKey] = useState('');
  const [qiniuSecretKey, setQiniuSecretKey] = useState('');
  const [qiniuBucket, setQiniuBucket] = useState('');
  const [qiniuDomain, setQiniuDomain] = useState('');
  const [qiniuRegion, setQiniuRegion] = useState('');

  const [minioEndpoint, setMinioEndpoint] = useState('');
  const [minioAccessKey, setMinioAccessKey] = useState('');
  const [minioSecretKey, setMinioSecretKey] = useState('');
  const [minioBucket, setMinioBucket] = useState('');
  const [minioUseSSL, setMinioUseSSL] = useState(false);

  const [upyunBucket, setUpyunBucket] = useState('');
  const [upyunOperator, setUpyunOperator] = useState('');
  const [upyunPassword, setUpyunPassword] = useState('');
  const [upyunDomain, setUpyunDomain] = useState('');

  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState('');
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState('');

  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubPath, setGithubPath] = useState('uploads/');

  const [customUploadUrl, setCustomUploadUrl] = useState('');
  const [customDownloadUrl, setCustomDownloadUrl] = useState('');
  const [customMethod, setCustomMethod] = useState('POST');
  const [customHeaders, setCustomHeaders] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customResponsePath, setCustomResponsePath] = useState('');

  useEffect(() => {
    if (storageSource && isOpen) {
      // 填充基本信息
      setName(storageSource.name || '');
      setType(storageSource.type || '');
      setPriority(storageSource.priority || 50);
      setQuotaLimit(storageSource.quotaLimit ? storageSource.quotaLimit.toString() : '');
      setIsActive(storageSource.isActive !== false);

      // 填充配置信息
      const config = storageSource.config || {};
      
      if (type === 'r2') {
        setR2AccountId(config.accountId || '');
        setR2AccessKey(config.accessKeyId || '');
        setR2SecretKey(config.secretAccessKey || '');
        setR2Bucket(config.bucketName || '');
        setR2Domain(config.domain || '');
      } else if (type === 'qiniu') {
        setQiniuAccessKey(config.accessKey || '');
        setQiniuSecretKey(config.secretKey || '');
        setQiniuBucket(config.bucket || '');
        setQiniuDomain(config.domain || '');
        setQiniuRegion(config.region || '');
      } else if (type === 'minio') {
        setMinioEndpoint(config.endpoint || '');
        setMinioAccessKey(config.accessKey || '');
        setMinioSecretKey(config.secretKey || '');
        setMinioBucket(config.bucket || '');
        setMinioUseSSL(config.useSSL || false);
      } else if (type === 'upyun') {
        setUpyunBucket(config.bucket || '');
        setUpyunOperator(config.operator || '');
        setUpyunPassword(config.password || '');
        setUpyunDomain(config.domain || '');
      } else if (type === 'telegram') {
        setTelegramBotToken(config.botToken || '');
        setTelegramChatId(config.chatId || '');
      } else if (type === 'cloudinary') {
        setCloudinaryCloudName(config.cloudName || '');
        setCloudinaryApiKey(config.apiKey || '');
        setCloudinaryApiSecret(config.apiSecret || '');
      } else if (type === 'github') {
        setGithubToken(config.token || '');
        setGithubRepo(config.repo || '');
        setGithubBranch(config.branch || 'main');
        setGithubPath(config.path || 'uploads/');
      } else if (type === 'custom') {
        setCustomUploadUrl(config.uploadUrl || '');
        setCustomDownloadUrl(config.downloadUrl || '');
        setCustomMethod(config.method || 'POST');
        setCustomHeaders(config.headers ? JSON.stringify(config.headers, null, 2) : '');
        setCustomBody(config.body || '');
        setCustomResponsePath(config.responsePath || '');
      }
    }
  }, [storageSource, isOpen, type]);

  const buildConfig = () => {
    switch (type) {
      case 'r2':
        return {
          accountId: r2AccountId,
          accessKeyId: r2AccessKey,
          secretAccessKey: r2SecretKey,
          bucketName: r2Bucket,
          domain: r2Domain,
        };
      case 'qiniu':
        return {
          accessKey: qiniuAccessKey,
          secretKey: qiniuSecretKey,
          bucket: qiniuBucket,
          domain: qiniuDomain,
          region: qiniuRegion,
        };
      case 'minio':
        return {
          endpoint: minioEndpoint,
          accessKey: minioAccessKey,
          secretKey: minioSecretKey,
          bucket: minioBucket,
          useSSL: minioUseSSL,
        };
      case 'upyun':
        return {
          bucket: upyunBucket,
          operator: upyunOperator,
          password: upyunPassword,
          domain: upyunDomain,
        };
      case 'telegram':
        return {
          botToken: telegramBotToken,
          chatId: telegramChatId,
        };
      case 'cloudinary':
        return {
          cloudName: cloudinaryCloudName,
          apiKey: cloudinaryApiKey,
          apiSecret: cloudinaryApiSecret,
        };
      case 'github':
        return {
          token: githubToken,
          repo: githubRepo,
          branch: githubBranch,
          path: githubPath,
        };
      case 'custom':
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
      setError('请输入存储源名称');
      return false;
    }

    if (!type) {
      setError('请选择存储源类型');
      return false;
    }

    switch (type) {
      case 'r2':
        if (!r2AccountId || !r2AccessKey || !r2SecretKey || !r2Bucket) {
          setError('请填写完整的 Cloudflare R2 配置信息');
          return false;
        }
        break;
      case 'qiniu':
        if (!qiniuAccessKey || !qiniuSecretKey || !qiniuBucket) {
          setError('请填写完整的七牛云配置信息');
          return false;
        }
        break;
      case 'minio':
        if (!minioEndpoint || !minioAccessKey || !minioSecretKey || !minioBucket) {
          setError('请填写完整的 MinIO 配置信息');
          return false;
        }
        break;
      case 'upyun':
        if (!upyunBucket || !upyunOperator || !upyunPassword) {
          setError('请填写完整的又拍云配置信息');
          return false;
        }
        break;
      case 'telegram':
        if (!telegramBotToken || !telegramChatId) {
          setError('请填写完整的 Telegram 配置信息');
          return false;
        }
        break;
      case 'cloudinary':
        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
          setError('请填写完整的 Cloudinary 配置信息');
          return false;
        }
        break;
      case 'github':
        if (!githubToken || !githubRepo) {
          setError('请填写完整的 GitHub 配置信息');
          return false;
        }
        break;
      case 'custom':
        if (!customUploadUrl || !customDownloadUrl || !customResponsePath) {
          setError('请填写完整的自定义图床配置信息（上传URL、下载URL、响应路径）');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = buildConfig();

      await ky.put('/api/storage-sources', {
        headers: { Authorization: `Bearer ${token}` },
        json: {
          id: storageSource.id,
          name,
          type,
          config,
          priority: parseInt(priority.toString()),
          quotaLimit: quotaLimit ? parseInt(quotaLimit) : null,
          isActive,
        },
      });

      onSuccess();
    } catch (err: any) {
      const errorData = await err.response?.json?.();
      setError(errorData?.error || '更新存储源失败');
    } finally {
      setLoading(false);
    }
  };

  const getStorageIcon = (storageType: string) => {
    const typeInfo = storageTypes.find(t => t.key === storageType);
    const IconComponent = typeInfo?.icon || CloudIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {getStorageIcon(type)}
            <span>编辑存储源</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-dark-olive-800">基本信息</h4>
              <Input
                label="存储源名称"
                placeholder="我的 R2 存储"
                value={name}
                onChange={(e) => setName(e.target.value)}
                isRequired
                size="sm"
              />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">存储类型:</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={getStorageIcon(type)}
                >
                  {storageTypes.find(t => t.key === type)?.label}
                </Chip>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="优先级"
                  type="number"
                  placeholder="50"
                  value={priority.toString()}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 50)}
                  size="sm"
                />
                <Input
                  label="存储限制 (GB)"
                  type="number"
                  placeholder="10"
                  value={quotaLimit}
                  onChange={(e) => setQuotaLimit(e.target.value)}
                  size="sm"
                />
              </div>
            </div>

            {/* 配置信息 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-dark-olive-800">配置信息</h4>
              
              {type === 'r2' && (
                <>
                  <Input
                    label="Account ID"
                    placeholder="your-account-id"
                    value={r2AccountId}
                    onChange={(e) => setR2AccountId(e.target.value)}
                    isRequired
                    size="sm"
                  />
                  <Input
                    label="Access Key ID"
                    placeholder="your-access-key"
                    value={r2AccessKey}
                    onChange={(e) => setR2AccessKey(e.target.value)}
                    isRequired
                    size="sm"
                  />
                  <Input
                    label="Secret Access Key"
                    placeholder="your-secret-key"
                    type="password"
                    value={r2SecretKey}
                    onChange={(e) => setR2SecretKey(e.target.value)}
                    isRequired
                    size="sm"
                  />
                  <Input
                    label="Bucket Name"
                    placeholder="my-bucket"
                    value={r2Bucket}
                    onChange={(e) => setR2Bucket(e.target.value)}
                    isRequired
                    size="sm"
                  />
                  <Input
                    label="自定义域名 (可选)"
                    placeholder="https://cdn.example.com"
                    value={r2Domain}
                    onChange={(e) => setR2Domain(e.target.value)}
                    size="sm"
                  />
                </>
              )}

              {type === 'custom' && (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      label="上传接口 URL"
                      placeholder="https://api.example.com/upload"
                      value={customUploadUrl}
                      onChange={(e) => setCustomUploadUrl(e.target.value)}
                      isRequired
                      size="sm"
                    />
                    
                    <Input
                      label="下载接口 URL"
                      placeholder="https://cdn.example.com/{filename}"
                      value={customDownloadUrl}
                      onChange={(e) => setCustomDownloadUrl(e.target.value)}
                      isRequired
                      size="sm"
                    />
                  </div>
                  
                  <Select
                    label="请求方法"
                    placeholder="选择请求方法"
                    selectedKeys={[customMethod]}
                    onChange={(e) => setCustomMethod(e.target.value)}
                    size="sm"
                  >
                    <SelectItem key="POST">POST</SelectItem>
                    <SelectItem key="PUT">PUT</SelectItem>
                    <SelectItem key="PATCH">PATCH</SelectItem>
                  </Select>
                  
                  <Textarea
                    label="请求头 (JSON 格式)"
                    placeholder='{"Authorization": "Bearer token"}'
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    size="sm"
                    minRows={3}
                  />
                  
                  <Input
                    label="响应中文件URL的路径"
                    placeholder="data.url"
                    value={customResponsePath}
                    onChange={(e) => setCustomResponsePath(e.target.value)}
                    isRequired
                    size="sm"
                  />
                </>
              )}
            </div>

            {error && (
              <div className="bg-danger-50 rounded-lg p-3">
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={loading}
            className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
          >
            保存更改
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
