'use client';

import { useState } from 'react';
import { 
  Button,
  Breadcrumbs,
  BreadcrumbItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Card,
  CardBody,
  Divider,
} from '@heroui/react';
import { 
  UploadIcon, 
  FolderPlusIcon, 
  LayoutGridIcon, 
  LayoutListIcon,
  HomeIcon,
  FolderIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  DownloadIcon,
  Share2Icon,
  MoreVerticalIcon,
  SortAscIcon,
  FilterIcon,
  FolderOpenIcon,
  PlusIcon
} from 'lucide-react';

export default function FilesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPath, setCurrentPath] = useState<string[]>(['我的文件']);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [showSidebar, setShowSidebar] = useState(false);

  // Mock数据
  const folders = [
    { id: 1, name: '工作文档', itemCount: 24, size: '2.3 GB', updatedAt: '2024-10-10' },
    { id: 2, name: '个人照片', itemCount: 156, size: '4.8 GB', updatedAt: '2024-10-09' },
    { id: 3, name: '视频文件', itemCount: 12, size: '8.2 GB', updatedAt: '2024-10-08' },
  ];

  const files = [
    { id: 4, name: '项目提案.pdf', type: 'pdf', size: '2.4 MB', updatedAt: '2024-10-11 14:30' },
    { id: 5, name: '设计稿.fig', type: 'figma', size: '8.1 MB', updatedAt: '2024-10-11 12:15' },
    { id: 6, name: '会议录音.mp3', type: 'audio', size: '15.2 MB', updatedAt: '2024-10-10 16:45' },
  ];

  const getFileIcon = (type: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
    
    switch (type) {
      case 'pdf':
      case 'doc':
        return <FileTextIcon className={`${sizeClass} text-danger`} />;
      case 'image':
      case 'jpg':
      case 'png':
        return <ImageIcon className={`${sizeClass} text-primary`} />;
      case 'video':
      case 'mp4':
        return <VideoIcon className={`${sizeClass} text-warning`} />;
      default:
        return <FileIcon className={`${sizeClass} text-default-400`} />;
    }
  };

  return (
    <div className="h-full flex">
      {/* 左侧文件夹树（仅桌面端） */}
      <aside className="hidden xl:flex w-56 bg-white border-r border-divider flex-col">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-dark-olive-800 mb-3">快速访问</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-brown-50 text-amber-brown-700 font-medium">
              <FolderIcon className="w-4 h-4" />
              <span className="text-sm">全部文件</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-50 text-dark-olive-700">
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm">图片</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-50 text-dark-olive-700">
              <VideoIcon className="w-4 h-4" />
              <span className="text-sm">视频</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-50 text-dark-olive-700">
              <FileTextIcon className="w-4 h-4" />
              <span className="text-sm">文档</span>
            </button>
          </div>
        </div>

        <Divider />

        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-dark-olive-800 mb-3">我的文件夹</h3>
          <div className="space-y-1">
            {folders.map(folder => (
              <button 
                key={folder.id}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-50 text-dark-olive-700 text-left"
              >
                <FolderIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 工具栏 */}
        <div className="bg-white border-b border-divider">
          {/* 面包屑和操作按钮 */}
          <div className="h-14 px-3 lg:px-6 flex items-center justify-between gap-2">
            <Breadcrumbs className="hidden sm:flex">
              <BreadcrumbItem>
                <div className="flex items-center gap-1.5">
                  <HomeIcon className="w-4 h-4" />
                  <span className="text-sm">我的文件</span>
                </div>
              </BreadcrumbItem>
              {currentPath.slice(1).map((folder, index) => (
                <BreadcrumbItem key={index}>
                  <span className="text-sm">{folder}</span>
                </BreadcrumbItem>
              ))}
            </Breadcrumbs>

            {/* 移动端：仅显示当前文件夹名 */}
            <h2 className="sm:hidden text-base font-semibold text-dark-olive-800">
              我的文件
            </h2>

            <div className="flex items-center gap-2">
              {/* 移动端：浮动操作按钮 */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    isIconOnly
                    className="lg:hidden bg-amber-brown-500 text-white"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="upload" startContent={<UploadIcon className="w-4 h-4" />}>
                    上传文件
                  </DropdownItem>
                  <DropdownItem key="folder" startContent={<FolderPlusIcon className="w-4 h-4" />}>
                    新建文件夹
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              {/* 桌面端：分开的按钮 */}
              <Button
                size="sm"
                startContent={<FolderPlusIcon className="w-4 h-4" />}
                className="hidden lg:flex bg-white border border-default-200 text-dark-olive-700 hover:border-amber-brown-500"
              >
                新建文件夹
              </Button>
              <Button
                size="sm"
                startContent={<UploadIcon className="w-4 h-4" />}
                className="hidden lg:flex bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
              >
                上传文件
              </Button>
            </div>
          </div>

          {/* 视图和排序选项 */}
          <div className="h-12 px-3 lg:px-6 flex items-center justify-between border-t border-divider bg-secondary-50/50">
            <div className="flex items-center gap-2 lg:gap-4">
              <span className="text-xs lg:text-sm text-dark-olive-600">
                {folders.length + files.length} 项
              </span>
              {selectedFiles.size > 0 && (
                <Chip size="sm" variant="flat" color="primary">
                  已选 {selectedFiles.size}
                </Chip>
              )}
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<SortAscIcon className="w-4 h-4" />}
                    className="text-dark-olive-700 hidden sm:flex"
                  >
                    排序
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="name">按名称</DropdownItem>
                  <DropdownItem key="date">按时间</DropdownItem>
                  <DropdownItem key="size">按大小</DropdownItem>
                  <DropdownItem key="type">按类型</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    className="sm:hidden"
                  >
                    <SortAscIcon className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="name">按名称</DropdownItem>
                  <DropdownItem key="date">按时间</DropdownItem>
                  <DropdownItem key="size">按大小</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <div className="flex bg-default-100 rounded-lg p-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant={viewMode === 'grid' ? 'flat' : 'light'}
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
                >
                  <LayoutGridIcon className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant={viewMode === 'list' ? 'flat' : 'light'}
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                >
                  <LayoutListIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 文件列表区域 */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6">
          {viewMode === 'grid' ? (
            /* 网格视图 - 响应式列数 */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
              {/* 文件夹 */}
              {folders.map(folder => (
                <Card 
                  key={folder.id}
                  isPressable
                  className="bg-white hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardBody className="p-3 lg:p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-2 lg:mb-3 group-hover:bg-primary-200 transition-colors">
                        <FolderIcon className="w-6 h-6 lg:w-8 lg:h-8 text-amber-brown-500" />
                      </div>
                      <p className="text-xs lg:text-sm font-medium text-dark-olive-800 mb-1 line-clamp-2 w-full">
                        {folder.name}
                      </p>
                      <p className="text-xs text-default-500">
                        {folder.itemCount} 项
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}

              {/* 文件 */}
              {files.map(file => (
                <Card 
                  key={file.id}
                  isPressable
                  className="bg-white hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardBody className="p-3 lg:p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2 lg:mb-3">
                        {getFileIcon(file.type, 'md')}
                      </div>
                      <p className="text-xs lg:text-sm font-medium text-dark-olive-800 mb-1 line-clamp-2 w-full">
                        {file.name}
                      </p>
                      <p className="text-xs text-default-500">
                        {file.size}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            /* 列表视图 - 移动端优化 */
            <div className="bg-white rounded-lg overflow-hidden">
              {/* 表头（仅桌面端） */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-secondary-50 border-b border-divider text-xs font-medium text-dark-olive-700">
                <div className="col-span-6">文件名</div>
                <div className="col-span-2">大小</div>
                <div className="col-span-3">修改时间</div>
                <div className="col-span-1 text-right">操作</div>
              </div>

              {/* 文件夹 */}
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 border-b border-divider hover:bg-secondary-50/50 cursor-pointer group transition-colors"
                >
                  <div className="lg:col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderIcon className="w-5 h-5 text-amber-brown-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-olive-800 truncate">{folder.name}</p>
                      <p className="text-xs text-default-500 lg:hidden">{folder.itemCount} 项 · {folder.size}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex lg:col-span-2 items-center text-sm text-default-600">
                    {folder.size}
                  </div>
                  <div className="hidden lg:flex lg:col-span-3 items-center text-sm text-default-500">
                    {folder.updatedAt}
                  </div>
                  <div className="hidden lg:flex lg:col-span-1 items-center justify-end">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVerticalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key="open" startContent={<FolderOpenIcon className="w-4 h-4" />}>
                          打开
                        </DropdownItem>
                        <DropdownItem key="download" startContent={<DownloadIcon className="w-4 h-4" />}>
                          下载
                        </DropdownItem>
                        <DropdownItem key="share" startContent={<Share2Icon className="w-4 h-4" />}>
                          分享
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              ))}

              {/* 文件 */}
              {files.map(file => (
                <div 
                  key={file.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 border-b border-divider hover:bg-secondary-50/50 cursor-pointer group transition-colors"
                >
                  <div className="lg:col-span-6 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type, 'sm')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-olive-800 truncate">{file.name}</p>
                      <p className="text-xs text-default-500 lg:hidden">{file.size} · {file.updatedAt}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex lg:col-span-2 items-center text-sm text-default-600">
                    {file.size}
                  </div>
                  <div className="hidden lg:flex lg:col-span-3 items-center text-sm text-default-500">
                    {file.updatedAt}
                  </div>
                  <div className="hidden lg:flex lg:col-span-1 items-center justify-end">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVerticalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key="download" startContent={<DownloadIcon className="w-4 h-4" />}>
                          下载
                        </DropdownItem>
                        <DropdownItem key="share" startContent={<Share2Icon className="w-4 h-4" />}>
                          分享
                        </DropdownItem>
                        <DropdownItem key="delete" color="danger">
                          删除
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {folders.length === 0 && files.length === 0 && (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                  <FolderOpenIcon className="w-12 h-12 lg:w-16 lg:h-16 text-amber-brown-500" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-dark-olive-800 mb-2">
                  文件夹为空
                </h3>
                <p className="text-sm text-default-500 mb-6 lg:mb-8">
                  开始上传您的第一个文件，或创建文件夹来组织内容
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    startContent={<UploadIcon className="w-5 h-5" />}
                    className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white font-medium"
                  >
                    上传文件
                  </Button>
                  <Button
                    size="lg"
                    variant="bordered"
                    startContent={<FolderPlusIcon className="w-5 h-5" />}
                    className="border-amber-brown-500 text-amber-brown-500 hover:bg-amber-brown-50"
                  >
                    新建文件夹
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
