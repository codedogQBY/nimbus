'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  Progress, 
  Button, 
  Chip,
  Divider,
  Spinner
} from '@heroui/react';
import { 
  CloudIcon, 
  PlusIcon, 
  CheckCircle2Icon,
  AlertCircleIcon,
  HardDriveIcon,
  TrendingUpIcon,
  DatabaseIcon
} from 'lucide-react';
import ky from 'ky';

export default function StoragePage() {
  const [storageSources, setStorageSources] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStorageSources();
  }, []);

  const loadStorageSources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await ky.get('/api/storage-sources', {
        headers: { Authorization: `Bearer ${token}` },
      }).json<any>();

      setStorageSources(response.sources);
      setStats({
        totalUsed: response.usedQuota,
        totalCapacity: response.totalQuota,
        totalSources: response.totalSources,
        activeSources: response.activeSources,
        totalFiles: response.sources.reduce((sum: number, s: any) => sum + s.fileCount, 0),
      });
    } catch (err: any) {
      setError('加载存储源失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStorageIcon = (type: string): JSX.Element => {
    return <CloudIcon className="w-8 h-8 text-amber-brown-500" />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-dark-olive-800">存储源管理</h1>
            <p className="text-xs lg:text-sm text-default-500 mt-1">管理您的多源存储配置</p>
          </div>
          <Button
            size="sm"
            isIconOnly
            className="lg:hidden bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
          >
            <PlusIcon className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            startContent={<PlusIcon className="w-5 h-5" />}
            className="hidden lg:flex bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
          >
            添加存储源
          </Button>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {/* 总存储空间 */}
            <Card className="bg-gradient-to-br from-amber-brown-500 to-amber-brown-600 text-white sm:col-span-2 lg:col-span-1">
              <CardBody className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90 mb-1">总存储空间</p>
                    <p className="text-2xl lg:text-3xl font-bold">{formatBytes(stats.totalCapacity)}</p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <DatabaseIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
                <p className="text-xs opacity-75">
                  已使用 {formatBytes(stats.totalUsed)} ({stats.totalCapacity > 0 ? ((stats.totalUsed/stats.totalCapacity)*100).toFixed(1) : 0}%)
                </p>
              </CardBody>
            </Card>

            {/* 存储源数量 */}
            <Card className="bg-white">
              <CardBody className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-default-500 mb-1">存储源数量</p>
                    <p className="text-2xl lg:text-3xl font-bold text-dark-olive-800">
                      {stats.totalSources}
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <HardDriveIcon className="w-5 h-5 lg:w-6 lg:h-6 text-amber-brown-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="w-4 h-4 text-success" />
                  <p className="text-xs text-default-500">
                    {stats.activeSources} 个在线
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* 文件总数 */}
            <Card className="bg-white">
              <CardBody className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-default-500 mb-1">文件总数</p>
                    <p className="text-2xl lg:text-3xl font-bold text-dark-olive-800">
                      {stats.totalFiles.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <TrendingUpIcon className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-default-500">
                  分布在 {stats.totalSources} 个存储源
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* 总体存储使用情况 */}
        {stats && stats.totalCapacity > 0 && (
          <Card className="bg-white">
            <CardBody className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-dark-olive-800">总体存储使用</h3>
                <div className="text-right">
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">
                    {formatBytes(stats.totalUsed)}
                  </p>
                  <p className="text-xs lg:text-sm text-default-500">
                    / {formatBytes(stats.totalCapacity)}
                  </p>
                </div>
              </div>
              <Progress
                value={(stats.totalUsed / stats.totalCapacity) * 100}
                color="primary"
                size="lg"
                className="mb-3"
              />
              <div className="flex items-center justify-between text-xs lg:text-sm">
                <span className="text-default-600">
                  已使用 {((stats.totalUsed/stats.totalCapacity)*100).toFixed(1)}%
                </span>
                <span className="text-success">
                  剩余 {formatBytes(stats.totalCapacity - stats.totalUsed)}
                </span>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 存储源列表 */}
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-dark-olive-800 mb-3 lg:mb-4">我的存储源</h2>
          
          {storageSources.length === 0 ? (
            // 空状态
            <Card className="bg-white border-2 border-dashed border-default-300">
              <CardBody className="p-8 lg:p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <CloudIcon className="w-8 h-8 lg:w-10 lg:h-10 text-amber-brown-500" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-dark-olive-800 mb-2">
                  还没有配置存储源
                </h3>
                <p className="text-sm text-default-500 mb-6">
                  添加您的第一个存储源，开始使用 Nimbus 多源聚合网盘
                </p>
                <Button
                  size="lg"
                  startContent={<PlusIcon className="w-5 h-5" />}
                  className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
                >
                  添加存储源
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {storageSources.map((source) => (
                <Card key={source.id} className="bg-white">
                  <CardBody className="p-4 lg:p-5">
                    {/* 存储源头部 */}
                    <div className="flex items-start gap-3 lg:gap-4 mb-4">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {getStorageIcon(source.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm lg:text-base font-semibold text-dark-olive-800 truncate">
                            {source.name}
                          </h3>
                          <Chip
                            size="sm"
                            color={source.isActive ? "success" : "default"}
                            variant="flat"
                            startContent={source.isActive ? <CheckCircle2Icon className="w-3 h-3" /> : <AlertCircleIcon className="w-3 h-3" />}
                          >
                            {source.isActive ? '在线' : '离线'}
                          </Chip>
                        </div>
                        <p className="text-xs text-default-500">{source.type.toUpperCase()}</p>
                      </div>
                    </div>

                    <Divider className="my-4" />

                    {/* 存储详情 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-default-600">存储使用</span>
                        <span className="font-semibold text-dark-olive-800">
                          {formatBytes(source.quotaUsed)} / {formatBytes(source.quotaLimit)}
                        </span>
                      </div>
                      <Progress
                        value={(source.quotaUsed / source.quotaLimit) * 100}
                        color={source.quotaUsed / source.quotaLimit > 0.8 ? 'warning' : 'primary'}
                        size="md"
                      />
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-xs text-default-500">文件数量</p>
                          <p className="text-sm font-semibold text-dark-olive-800 mt-0.5">
                            {source.fileCount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">优先级</p>
                          <p className="text-sm font-semibold text-dark-olive-800 mt-0.5">
                            {source.priority}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Divider className="my-4" />

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="flex-1 bg-secondary-100 text-dark-olive-700"
                      >
                        测试连接
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        className="flex-1 bg-secondary-100 text-dark-olive-700"
                      >
                        配置
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                      >
                        删除
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}

              {/* 添加存储源卡片 */}
              <Card 
                isPressable
                className="bg-white border-2 border-dashed border-default-300 hover:border-amber-brown-500 hover:bg-amber-brown-50/30 transition-all cursor-pointer"
              >
                <CardBody className="p-6 lg:p-8 flex flex-col items-center justify-center text-center min-h-[280px] lg:min-h-[300px]">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <PlusIcon className="w-7 h-7 lg:w-8 lg:h-8 text-amber-brown-500" />
                  </div>
                  <h3 className="text-sm lg:text-base font-semibold text-dark-olive-800 mb-2">
                    添加新存储源
                  </h3>
                  <p className="text-xs lg:text-sm text-default-500 mb-4">
                    支持 Cloudflare R2、七牛云、<br />Telegram、GitHub 等多种存储
                  </p>
                  <Button
                    size="sm"
                    className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
                  >
                    开始配置
                  </Button>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
