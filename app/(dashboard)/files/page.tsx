'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Divider,
  Spinner
} from '@heroui/react';
import { 
  FolderIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  ArchiveIcon,
  UploadIcon,
  SearchIcon,
  MoreVerticalIcon,
  DownloadIcon,
  Share2Icon,
  TrashIcon,
  EditIcon,
  FolderPlusIcon,
  GridIcon,
  ListIcon,
  SortAscIcon,
  ChevronLeftIcon
} from 'lucide-react';
import ky from 'ky';

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentFolderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = currentFolderId 
        ? `/api/files?folderId=${currentFolderId}` 
        : '/api/files';
        
      const response = await ky.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      }).json<any>();

      setFolders(response.folders || []);
      setFiles(response.files || []);
    } catch (err) {
      console.error('加载文件失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): JSX.Element => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />;
    if (mimeType?.startsWith('video/')) return <VideoIcon className="w-8 h-8 lg:w-10 lg:h-10 text-warning" />;
    if (mimeType?.startsWith('audio/')) return <MusicIcon className="w-8 h-8 lg:w-10 lg:h-10 text-success" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <ArchiveIcon className="w-8 h-8 lg:w-10 lg:h-10 text-danger" />;
    return <FileTextIcon className="w-8 h-8 lg:w-10 lg:h-10 text-default-500" />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-divider p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* 面包屑 */}
          {currentFolderId && (
            <Button
              size="sm"
              variant="flat"
              startContent={<ChevronLeftIcon className="w-4 h-4" />}
              onClick={() => setCurrentFolderId(null)}
              className="bg-secondary-100"
            >
              返回
            </Button>
          )}

          {/* 搜索框 */}
          <Input
            placeholder="搜索文件..."
            startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
            size="sm"
            className="flex-1 min-w-[200px]"
          />

          {/* 工具按钮 */}
          <div className="flex items-center gap-2">
            {/* 上传按钮 */}
            <Button
              size="sm"
              startContent={<UploadIcon className="w-4 h-4" />}
              className="flex-1 sm:flex-none bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
            >
              <span className="sm:inline">上传</span>
            </Button>

            {/* 新建文件夹 */}
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              className="bg-secondary-100"
            >
              <FolderPlusIcon className="w-4 h-4" />
            </Button>

            {/* 视图切换 */}
            <div className="hidden lg:flex gap-1 bg-secondary-100 rounded-lg p-1">
              <Button
                size="sm"
                isIconOnly
                variant={viewMode === 'grid' ? 'solid' : 'light'}
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white' : ''}
              >
                <GridIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                isIconOnly
                variant={viewMode === 'list' ? 'solid' : 'light'}
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white' : ''}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* 排序 */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  className="bg-secondary-100"
                >
                  <SortAscIcon className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="name">按名称</DropdownItem>
                <DropdownItem key="date">按日期</DropdownItem>
                <DropdownItem key="size">按大小</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* 空状态 */}
          {folders.length === 0 && files.length === 0 ? (
            <Card className="bg-white">
              <CardBody className="p-8 lg:p-12 text-center">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderIcon className="w-8 h-8 lg:w-10 lg:h-10 text-amber-brown-500" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-dark-olive-800 mb-2">
                  {currentFolderId ? '文件夹是空的' : '还没有文件'}
                </h3>
                <p className="text-sm text-default-500 mb-6">
                  上传您的第一个文件，开始使用 Nimbus
                </p>
                <Button
                  size="lg"
                  startContent={<UploadIcon className="w-5 h-5" />}
                  className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
                >
                  上传文件
                </Button>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* 文件夹列表 */}
              {folders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-olive-800 mb-3 px-1">我的文件夹</h3>
                  <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
                    {folders.map((folder) => (
                      <Card 
                        key={folder.id}
                        isPressable
                        className="bg-white hover:shadow-md transition-shadow"
                        onPress={() => setCurrentFolderId(folder.id)}
                      >
                        <CardBody className={viewMode === 'grid' ? 'p-3 lg:p-4' : 'p-3 lg:p-4'}>
                          <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row'} items-start gap-3`}>
                            {/* 文件夹图标 */}
                            <div className={`${viewMode === 'grid' ? 'w-full' : ''} flex items-center justify-center bg-primary-100 rounded-lg ${viewMode === 'grid' ? 'h-20 lg:h-24' : 'w-12 h-12 flex-shrink-0'}`}>
                              <FolderIcon className={`${viewMode === 'grid' ? 'w-10 h-10 lg:w-12 lg:h-12' : 'w-6 h-6'} text-amber-brown-500`} />
                            </div>
                            
                            {/* 文件夹信息 */}
                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-xs lg:text-sm font-semibold text-dark-olive-800 truncate flex-1">
                                  {folder.name}
                                </h4>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      className="flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVerticalIcon className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu>
                                    <DropdownItem key="rename" startContent={<EditIcon className="w-4 h-4" />}>
                                      重命名
                                    </DropdownItem>
                                    <DropdownItem key="share" startContent={<Share2Icon className="w-4 h-4" />}>
                                      分享
                                    </DropdownItem>
                                    <DropdownItem key="delete" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                      删除
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                              <p className="text-xs text-default-500">
                                {folder.itemCount} 项
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* 文件列表 */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-olive-800 mb-3 px-1">文件</h3>
                  <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
                    {files.map((file) => (
                      <Card 
                        key={file.id}
                        isPressable
                        className="bg-white hover:shadow-md transition-shadow"
                      >
                        <CardBody className={viewMode === 'grid' ? 'p-3 lg:p-4' : 'p-3 lg:p-4'}>
                          <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row'} items-start gap-3`}>
                            {/* 文件图标 */}
                            <div className={`${viewMode === 'grid' ? 'w-full' : ''} flex items-center justify-center bg-secondary-100 rounded-lg ${viewMode === 'grid' ? 'h-20 lg:h-24' : 'w-12 h-12 flex-shrink-0'}`}>
                              {getFileIcon(file.mimeType)}
                            </div>
                            
                            {/* 文件信息 */}
                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-xs lg:text-sm font-semibold text-dark-olive-800 truncate flex-1" title={file.name}>
                                  {file.name}
                                </h4>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      className="flex-shrink-0"
                                    >
                                      <MoreVerticalIcon className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu>
                                    <DropdownItem key="download" startContent={<DownloadIcon className="w-4 h-4" />}>
                                      下载
                                    </DropdownItem>
                                    <DropdownItem key="share" startContent={<Share2Icon className="w-4 h-4" />}>
                                      分享
                                    </DropdownItem>
                                    <DropdownItem key="rename" startContent={<EditIcon className="w-4 h-4" />}>
                                      重命名
                                    </DropdownItem>
                                    <DropdownItem key="delete" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                      删除
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-xs text-default-500">
                                  {formatFileSize(file.size)}
                                </p>
                                {file.storageSource && (
                                  <Chip size="sm" variant="flat" className="text-xs h-5">
                                    {file.storageSource.name}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
