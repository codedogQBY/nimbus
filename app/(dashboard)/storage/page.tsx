'use client';

import { 
  Card, 
  CardBody, 
  Progress, 
  Button, 
  Chip,
  Divider 
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

export default function StoragePage() {
  // Mock数据
  const storageSources = [
    {
      id: 1,
      name: 'Cloudflare R2 - 主存储',
      type: 'r2',
      used: 1024 * 1024 * 1024 * 2.3, // 2.3GB
      total: 1024 * 1024 * 1024 * 10, // 10GB
      isActive: true,
      fileCount: 1247,
      speed: '良好',
    },
    {
      id: 2,
      name: '七牛云 - 备份',
      type: 'qiniu',
      used: 1024 * 1024 * 1024 * 1.8,
      total: 1024 * 1024 * 1024 * 10,
      isActive: true,
      fileCount: 856,
      speed: '优秀',
    },
  ];

  const totalUsed = storageSources.reduce((acc, s) => acc + Number(s.used), 0);
  const totalCapacity = storageSources.reduce((acc, s) => acc + Number(s.total), 0);
  const totalFiles = storageSources.reduce((acc, s) => acc + s.fileCount, 0);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStorageIcon = (type: string) => {
    return <CloudIcon className="w-8 h-8 text-amber-brown-500" />;
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* 总存储空间 */}
          <Card className="bg-gradient-to-br from-amber-brown-500 to-amber-brown-600 text-white sm:col-span-2 lg:col-span-1">
            <CardBody className="p-4 lg:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">总存储空间</p>
                  <p className="text-3xl font-bold">{formatBytes(totalCapacity)}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DatabaseIcon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs opacity-75">
                已使用 {formatBytes(totalUsed)} ({((totalUsed/totalCapacity)*100).toFixed(1)}%)
              </p>
            </CardBody>
          </Card>

          {/* 存储源数量 */}
          <Card className="bg-white">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-default-500 mb-1">存储源数量</p>
                  <p className="text-3xl font-bold text-dark-olive-800">
                    {storageSources.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <HardDriveIcon className="w-6 h-6 text-amber-brown-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-success" />
                <p className="text-xs text-default-500">
                  {storageSources.filter(s => s.isActive).length} 个在线
                </p>
              </div>
            </CardBody>
          </Card>

          {/* 文件总数 */}
          <Card className="bg-white">
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-default-500 mb-1">文件总数</p>
                  <p className="text-3xl font-bold text-dark-olive-800">
                    {totalFiles.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <TrendingUpIcon className="w-6 h-6 text-success" />
                </div>
              </div>
              <p className="text-xs text-default-500">
                分布在 {storageSources.length} 个存储源
              </p>
            </CardBody>
          </Card>
        </div>

        {/* 总体存储使用情况 */}
        <Card className="bg-white">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-olive-800">总体存储使用</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-dark-olive-800">
                  {formatBytes(totalUsed)}
                </p>
                <p className="text-sm text-default-500">
                  / {formatBytes(totalCapacity)}
                </p>
              </div>
            </div>
            <Progress
              value={(totalUsed / totalCapacity) * 100}
              color="primary"
              size="lg"
              className="mb-3"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-600">
                已使用 {((totalUsed/totalCapacity)*100).toFixed(1)}%
              </span>
              <span className="text-success">
                剩余 {formatBytes(totalCapacity - totalUsed)}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* 存储源列表 */}
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-dark-olive-800 mb-3 lg:mb-4">我的存储源</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {storageSources.map((source) => (
              <Card key={source.id} className="bg-white">
                <CardBody className="p-5">
                  {/* 存储源头部 */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {getStorageIcon(source.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-dark-olive-800 truncate">
                          {source.name}
                        </h3>
                        <Chip
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<CheckCircle2Icon className="w-3 h-3" />}
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-600">存储使用</span>
                      <span className="font-semibold text-dark-olive-800">
                        {formatBytes(Number(source.used))} / {formatBytes(Number(source.total))}
                      </span>
                    </div>
                    <Progress
                      value={(Number(source.used) / Number(source.total)) * 100}
                      color={Number(source.used) / Number(source.total) > 0.8 ? 'warning' : 'primary'}
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
                        <p className="text-xs text-default-500">访问速度</p>
                        <p className="text-sm font-semibold text-success mt-0.5">
                          {source.speed}
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
              <CardBody className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="w-8 h-8 text-amber-brown-500" />
                </div>
                <h3 className="text-base font-semibold text-dark-olive-800 mb-2">
                  添加新存储源
                </h3>
                <p className="text-sm text-default-500 mb-4">
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
        </div>
      </div>
    </div>
  );
}
