'use client';

import { Card, CardBody, CardHeader, CardFooter, Progress, Button, Chip, Divider } from '@heroui/react';
import { CloudIcon, PlusIcon, SettingsIcon, TestTubeIcon, TrashIcon } from 'lucide-react';

export default function StoragePage() {
  // Mock数据，后续从API获取
  const storageSources = [
    {
      id: 1,
      name: 'Cloudflare R2',
      type: 'r2',
      used: 1024 * 1024 * 1024 * 2, // 2GB
      total: 1024 * 1024 * 1024 * 10, // 10GB
      isActive: true,
    },
  ];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'r2':
        return <CloudIcon className="w-6 h-6 text-amber-brown-500" />;
      default:
        return <CloudIcon className="w-6 h-6 text-default-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-olive-800">存储源管理</h1>
          <p className="text-sm text-dark-olive-600 mt-1">配置和管理您的存储源</p>
        </div>

        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
        >
          添加存储源
        </Button>
      </div>

      {/* 总体存储概览 */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-olive-800">总体存储</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-dark-olive-800">
                {formatBytes(storageSources.reduce((acc, s) => acc + Number(s.used), 0))}
              </p>
              <p className="text-sm text-default-500">
                / {formatBytes(storageSources.reduce((acc, s) => acc + Number(s.total), 0))}
              </p>
            </div>
          </div>
          <Progress
            value={
              (storageSources.reduce((acc, s) => acc + Number(s.used), 0) /
                storageSources.reduce((acc, s) => acc + Number(s.total), 0)) *
              100
            }
            color="primary"
            size="lg"
            className="mb-2"
          />
          <p className="text-xs text-default-500">
            已配置 {storageSources.length} 个存储源 · 
            {storageSources.filter(s => s.isActive).length} 个在线
          </p>
        </CardBody>
      </Card>

      {/* 存储源列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storageSources.length === 0 ? (
          <Card className="col-span-full bg-white/60 backdrop-blur-sm">
            <CardBody className="py-16 text-center">
              <CloudIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dark-olive-800 mb-2">
                还没有配置存储源
              </h3>
              <p className="text-sm text-default-500 mb-6">
                添加您的第一个存储源，开始使用 Nimbus
              </p>
              <Button
                startContent={<PlusIcon className="w-4 h-4" />}
                className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
              >
                添加存储源
              </Button>
            </CardBody>
          </Card>
        ) : (
          storageSources.map((source) => (
            <Card key={source.id} className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex gap-3 p-4">
                {getStorageIcon(source.type)}
                <div className="flex flex-col flex-1">
                  <p className="text-md font-semibold text-dark-olive-800">
                    {source.name}
                  </p>
                  <p className="text-small text-default-500">{source.type.toUpperCase()}</p>
                </div>
                <Chip
                  size="sm"
                  color={source.isActive ? 'success' : 'default'}
                  variant="flat"
                >
                  {source.isActive ? '在线' : '离线'}
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">已使用</span>
                    <span className="font-medium text-dark-olive-800">
                      {formatBytes(Number(source.used))} / {formatBytes(Number(source.total))}
                    </span>
                  </div>
                  <Progress
                    value={(Number(source.used) / Number(source.total)) * 100}
                    color={Number(source.used) / Number(source.total) > 0.8 ? 'warning' : 'primary'}
                    size="sm"
                  />
                </div>
              </CardBody>
              <Divider />
              <CardFooter className="p-4">
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<TestTubeIcon className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    测试
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<SettingsIcon className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    设置
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    isIconOnly
                    startContent={<TrashIcon className="w-3.5 h-3.5" />}
                  >
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

