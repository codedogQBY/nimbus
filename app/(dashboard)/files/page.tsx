'use client';

import { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  ButtonGroup,
  Breadcrumbs,
  BreadcrumbItem,
  Divider,
  Chip
} from '@heroui/react';
import { 
  UploadIcon, 
  FolderPlusIcon, 
  LayoutGridIcon, 
  LayoutListIcon,
  HomeIcon,
  FolderIcon
} from 'lucide-react';

export default function FilesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPath, setCurrentPath] = useState<string[]>(['我的文件']);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-olive-800">文件管理</h1>
          <p className="text-sm text-dark-olive-600 mt-1">管理您的云端文件</p>
        </div>

        <div className="flex gap-2">
          <Button
            startContent={<FolderPlusIcon className="w-4 h-4" />}
            className="bg-secondary-200 text-dark-olive-800 hover:bg-secondary-300"
          >
            新建文件夹
          </Button>
          <Button
            startContent={<UploadIcon className="w-4 h-4" />}
            className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
          >
            上传文件
          </Button>
        </div>
      </div>

      {/* 面包屑导航 */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardBody className="py-3">
          <div className="flex items-center justify-between">
            <Breadcrumbs>
              <BreadcrumbItem>
                <div className="flex items-center gap-1">
                  <HomeIcon className="w-4 h-4" />
                  <span>我的文件</span>
                </div>
              </BreadcrumbItem>
              {currentPath.slice(1).map((folder, index) => (
                <BreadcrumbItem key={index}>
                  <div className="flex items-center gap-1">
                    <FolderIcon className="w-4 h-4" />
                    <span>{folder}</span>
                  </div>
                </BreadcrumbItem>
              ))}
            </Breadcrumbs>

            <ButtonGroup size="sm" variant="flat">
              <Button
                isIconOnly
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-amber-brown-100' : ''}
              >
                <LayoutGridIcon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-amber-brown-100' : ''}
              >
                <LayoutListIcon className="w-4 h-4" />
              </Button>
            </ButtonGroup>
          </div>
        </CardBody>
      </Card>

      {/* 文件列表区域 */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-dark-olive-800">文件列表</h2>
              <Chip size="sm" variant="flat" className="bg-secondary-200">
                0 项
              </Chip>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          {/* 空状态 */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <FolderIcon className="w-12 h-12 text-amber-brown-500" />
            </div>
            <h3 className="text-lg font-medium text-dark-olive-800 mb-2">
              文件夹为空
            </h3>
            <p className="text-sm text-dark-olive-600 mb-6">
              拖拽文件到这里，或点击上传按钮开始上传
            </p>
            <div className="flex gap-3">
              <Button
                startContent={<UploadIcon className="w-4 h-4" />}
                className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
              >
                上传文件
              </Button>
              <Button
                startContent={<FolderPlusIcon className="w-4 h-4" />}
                variant="bordered"
                className="border-amber-brown-500 text-amber-brown-500 hover:bg-amber-brown-50"
              >
                创建文件夹
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 拖拽上传区域（待实现） */}
      <Card className="bg-white/60 backdrop-blur-sm border-2 border-dashed border-default-300 hover:border-amber-brown-500 transition-colors cursor-pointer">
        <CardBody className="py-8">
          <div className="text-center">
            <UploadIcon className="w-12 h-12 text-default-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-dark-olive-800">
              拖拽文件到这里上传
            </p>
            <p className="text-sm text-default-500 mt-1">
              或点击选择文件 · 支持单个文件最大 5GB
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

