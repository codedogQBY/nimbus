'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
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
  MoreVerticalIcon,
  DownloadIcon,
  Share2Icon,
  TrashIcon,
  EditIcon,
  FolderPlusIcon,
  GridIcon,
  ListIcon,
  SortAscIcon,
  ChevronLeftIcon,
  EyeIcon,
  CheckSquareIcon,
  SquareIcon,
  XIcon
} from 'lucide-react';
import ky from 'ky';
import { UploadButton } from '@/components/upload-button';
import { CreateFolderModal } from '@/components/create-folder-modal';
import { RenameModal } from '@/components/rename-modal';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { BatchDeleteConfirmModal } from '@/components/batch-delete-confirm-modal';
import { CreateShareModal } from '@/components/create-share-modal';
import { FileBreadcrumb } from '@/components/file-breadcrumb';
import { FilePreview } from '@/lib/file-preview/preview-manager';
import { AuthenticatedImage } from '@/components/authenticated-image';
import { useToast } from '@/components/toast-provider';

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<number>>(new Set());

  // Modal states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadFiles();
  }, [currentFolderId]);

  useEffect(() => {
    // 阻止浏览器默认的拖放行为
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      preventDefaults(e);
      setDragCounter(prev => prev + 1);
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      preventDefaults(e);
      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragOver(false);
        }
        return newCounter;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      preventDefaults(e);
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      preventDefaults(e);
      setIsDragOver(false);
      setDragCounter(0);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFilesDrop(files);
      }
    };

    // 添加事件监听器
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [currentFolderId]);

  const handleFilesDrop = async (files: FileList) => {
    const fileArray = Array.from(files);

    // 检查文件大小
    const oversizedFiles = fileArray.filter(f => f.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showError(
        '文件大小超限',
        `以下文件超过100MB限制：${oversizedFiles.map(f => f.name).join(', ')}`
      );
      return;
    }

    // 模拟 UploadButton 的上传逻辑
    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
          formData.append('folderId', currentFolderId.toString());
        }

        const token = localStorage.getItem('token');
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`上传 ${file.name} 失败`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      showSuccess(`成功上传 ${fileArray.length} 个文件`);
      loadFiles(); // 重新加载文件列表
      window.dispatchEvent(new Event('storageUpdated'));
    } catch (error) {
      console.error('拖放上传失败:', error);
      showError('上传失败', error instanceof Error ? error.message : '未知错误');
    }
  };

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

      // 获取当前文件夹信息
      if (currentFolderId) {
        try {
          const folderResponse = await ky.get(`/api/folders/${currentFolderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).json<any>();
          setCurrentFolder(folderResponse);
        } catch (folderErr) {
          console.error('获取文件夹信息失败:', folderErr);
          setCurrentFolder(null);
        }
      } else {
        setCurrentFolder(null);
      }
    } catch (err) {
      console.error('加载文件失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 排序函数
  const sortItems = (items: any[], type: 'files' | 'folders') => {
    return [...items].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = (type === 'files' ? a.name : a.name).toLowerCase();
          valueB = (type === 'files' ? b.name : b.name).toLowerCase();
          break;
        case 'date':
          valueA = new Date(a.createdAt || a.updatedAt || 0).getTime();
          valueB = new Date(b.createdAt || b.updatedAt || 0).getTime();
          break;
        case 'size':
          valueA = type === 'files' ? (a.size || 0) : 0; // 文件夹大小为0
          valueB = type === 'files' ? (b.size || 0) : 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 处理排序选择
  const handleSort = (key: string) => {
    const sortType = key as 'name' | 'date' | 'size';
    if (sortBy === sortType) {
      // 如果是同一个排序字段，切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果是不同排序字段，设置为新字段并重置为升序
      setSortBy(sortType);
      setSortOrder('asc');
    }
  };

  // 获取排序后的数据
  const sortedFolders = sortItems(folders, 'folders');
  const sortedFiles = sortItems(files, 'files');

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
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

  const handleRename = (item: any, type: 'file' | 'folder') => {
    setSelectedItem({ ...item, type });
    setShowRename(true);
  };

  const handleDelete = (item: any, type: 'file' | 'folder') => {
    setSelectedItem({ ...item, type });
    setShowDelete(true);
  };

  const handleShare = (item: any, type: 'file' | 'folder') => {
    setSelectedItem({ ...item, type });
    setShowShare(true);
  };

  const handlePreview = (file: any) => {
    setSelectedItem({ ...file, type: 'file' });
    setShowPreview(true);
  };

  const handleDownload = async (file: any) => {
    try {
      const token = localStorage.getItem('token');
      const downloadUrl = `/api/files/${file.id}/serve?download=1&token=${encodeURIComponent(token || '')}`;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // 获取文件缩略图URL
  const getFileThumbnailUrl = (file: any): string | null => {
    if (file.mimeType?.startsWith('image/')) {
      return `/api/files/${file.id}/serve`;
    }
    return null;
  };

  // 批量操作相关函数
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // 退出选择模式时清空选择
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
    }
  };

  const toggleFileSelection = (fileId: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleFolderSelection = (folderId: number) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
    setSelectedFolders(new Set(folders.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const getSelectedCount = () => {
    return selectedFiles.size + selectedFolders.size;
  };

  const handleBatchDelete = () => {
    if (getSelectedCount() === 0) {
      showError('请先选择要删除的文件或文件夹');
      return;
    }
    setShowBatchDelete(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* 拖放覆盖层 */}
      {isDragOver && (
        <div className="fixed inset-0 bg-primary-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-dashed border-primary-500 max-w-md text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
              拖放文件到此处上传
            </h3>
            <p className="text-sm text-default-500">
              支持多文件上传，单个文件最大 100MB
            </p>
          </div>
        </div>
      )}

      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-divider p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* 面包屑导航 */}
          <FileBreadcrumb
            currentFolder={currentFolder}
            onNavigate={setCurrentFolderId}
          />

          {/* 工具按钮 */}
          <div className="flex items-center gap-2">
            {/* 上传按钮 */}
            <UploadButton
              folderId={currentFolderId}
              onSuccess={loadFiles}
              className="flex-1 sm:flex-none bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
              size="sm"
            />

            {/* 新建文件夹 */}
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              className="bg-secondary-100"
              onPress={() => setShowCreateFolder(true)}
            >
              <FolderPlusIcon className="w-4 h-4" />
            </Button>

            {/* 批量操作按钮 */}
            <Button
              size="sm"
              variant={isSelectionMode ? "solid" : "flat"}
              isIconOnly
              className={isSelectionMode ? "bg-primary-500 text-white" : "bg-secondary-100"}
              onPress={toggleSelectionMode}
            >
              {isSelectionMode ? <XIcon className="w-4 h-4" /> : <CheckSquareIcon className="w-4 h-4" />}
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
                  title={`当前排序：${sortBy === 'name' ? '按名称' : sortBy === 'date' ? '按日期' : '按大小'} (${sortOrder === 'asc' ? '升序' : '降序'})`}
                >
                  <SortAscIcon className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="排序选项"
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey) {
                    handleSort(selectedKey);
                  }
                }}
                selectionMode="single"
              >
                <DropdownItem
                  key="name"
                  description={sortBy === 'name' ? (sortOrder === 'asc' ? '升序' : '降序') : undefined}
                >
                  按名称 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownItem>
                <DropdownItem
                  key="date"
                  description={sortBy === 'date' ? (sortOrder === 'asc' ? '升序' : '降序') : undefined}
                >
                  按日期 {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownItem>
                <DropdownItem
                  key="size"
                  description={sortBy === 'size' ? (sortOrder === 'asc' ? '升序' : '降序') : undefined}
                >
                  按大小 {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* 批量操作工具栏 */}
      {isSelectionMode && (
        <div className="bg-white border-b border-divider p-3 lg:p-4">
          <div className="flex flex-col gap-3">
            {/* 选择状态信息 */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-default-600">
                已选择 <span className="font-semibold text-primary">{getSelectedCount()}</span> 项
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={selectAll}
                  className="text-xs px-3 h-8"
                >
                  全选
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={clearSelection}
                  className="text-xs px-3 h-8"
                >
                  清空
                </Button>
              </div>
            </div>

            {/* 批量操作按钮 */}
            {getSelectedCount() > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={handleBatchDelete}
                  className="flex-1 h-10"
                >
                  删除选中项 ({getSelectedCount()})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* 空状态 */}
          {sortedFolders.length === 0 && sortedFiles.length === 0 ? (
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
                <UploadButton 
                  folderId={currentFolderId}
                  onSuccess={loadFiles}
                  className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
                  size="lg"
                />
              </CardBody>
            </Card>
          ) : (
            <>
              {/* 文件夹列表 */}
              {sortedFolders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-olive-800 mb-3 px-1">文件夹</h3>
                  <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
                    {sortedFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="cursor-pointer relative"
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleFolderSelection(folder.id);
                          } else {
                            setCurrentFolderId(folder.id);
                          }
                        }}
                      >
                        <Card
                          className={`bg-white hover:shadow-md transition-all ${
                            isSelectionMode && selectedFolders.has(folder.id)
                              ? 'ring-2 ring-primary-500 shadow-md'
                              : ''
                          }`}
                        >
                        <CardBody className={viewMode === 'grid' ? 'p-3 lg:p-4' : 'p-3 lg:p-4'}>
                          <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row'} items-start gap-3`}>
                            {/* 选择模式下的复选框 */}
                            {isSelectionMode && (
                              <div className={`${viewMode === 'grid' ? 'absolute top-2 left-2 z-10' : 'flex-shrink-0'}`}>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="flat"
                                  className={`w-8 h-8 min-w-8 ${
                                    selectedFolders.has(folder.id)
                                      ? 'bg-primary-500 text-white'
                                      : 'bg-white border border-default-300'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolderSelection(folder.id);
                                  }}
                                >
                                  {selectedFolders.has(folder.id) ? (
                                    <CheckSquareIcon className="w-4 h-4" />
                                  ) : (
                                    <SquareIcon className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            )}

                            <div className={`${viewMode === 'grid' ? 'w-full' : ''} flex items-center justify-center bg-primary-100 rounded-lg ${viewMode === 'grid' ? 'h-20 lg:h-24' : 'w-12 h-12 flex-shrink-0'}`}>
                              <FolderIcon className={`${viewMode === 'grid' ? 'w-10 h-10 lg:w-12 lg:h-12' : 'w-6 h-6'} text-amber-brown-500`} />
                            </div>

                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-xs lg:text-sm font-semibold text-dark-olive-800 truncate flex-1">
                                  {folder.name}
                                </h4>
                                {!isSelectionMode && (
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
                                      <DropdownItem
                                        key="rename"
                                        startContent={<EditIcon className="w-4 h-4" />}
                                        onPress={() => {
                                          handleRename(folder, 'folder');
                                        }}
                                      >
                                        重命名
                                      </DropdownItem>
                                      <DropdownItem
                                        key="share"
                                        startContent={<Share2Icon className="w-4 h-4" />}
                                        onPress={() => {
                                          handleShare(folder, 'folder');
                                        }}
                                      >
                                        分享
                                      </DropdownItem>
                                      <DropdownItem
                                        key="delete"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => {
                                          handleDelete(folder, 'folder');
                                        }}
                                      >
                                        删除
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                                )}
                              </div>
                              <p className="text-xs text-default-500">
                                {folder.itemCount} 项
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* 文件列表 */}
              {sortedFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-olive-800 mb-3 px-1">文件</h3>
                  <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
                    {sortedFiles.map((file) => {
                      const thumbnailUrl = getFileThumbnailUrl(file);
                      return (
                      <Card
                        key={file.id}
                        isPressable
                        className={`bg-white hover:shadow-md transition-all relative ${
                          isSelectionMode && selectedFiles.has(file.id)
                            ? 'ring-2 ring-primary-500 shadow-md'
                            : ''
                        }`}
                        onPress={() => {
                          if (isSelectionMode) {
                            toggleFileSelection(file.id);
                          } else {
                            handlePreview(file);
                          }
                        }}
                        data-file-id={file.id}
                      >
                        <CardBody className={viewMode === 'grid' ? 'p-3 lg:p-4' : 'p-3 lg:p-4'}>
                          <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row'} items-start gap-3`}>
                            {/* 选择模式下的复选框 */}
                            {isSelectionMode && (
                              <div className={`${viewMode === 'grid' ? 'absolute top-2 left-2 z-10' : 'flex-shrink-0'}`}>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="flat"
                                  className={`w-8 h-8 min-w-8 ${
                                    selectedFiles.has(file.id)
                                      ? 'bg-primary-500 text-white'
                                      : 'bg-white border border-default-300'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFileSelection(file.id);
                                  }}
                                >
                                  {selectedFiles.has(file.id) ? (
                                    <CheckSquareIcon className="w-4 h-4" />
                                  ) : (
                                    <SquareIcon className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            )}

                            <div className={`${viewMode === 'grid' ? 'w-full' : ''} flex items-center justify-center bg-secondary-100 rounded-lg ${viewMode === 'grid' ? 'h-20 lg:h-24' : 'w-12 h-12 flex-shrink-0'} overflow-hidden relative`}>
                              {thumbnailUrl ? (
                                <>
                                  <AuthenticatedImage
                                    src={thumbnailUrl}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    onError={() => {
                                      // 图片加载失败时显示默认图标
                                      const container = document.querySelector(`[data-file-id="${file.id}"] .thumbnail-fallback`);
                                      if (container) {
                                        container.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                  <div className={`thumbnail-fallback hidden absolute inset-0 flex items-center justify-center w-full h-full`}>
                                    {getFileIcon(file.mimeType)}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                  {getFileIcon(file.mimeType)}
                                </div>
                              )}
                            </div>

                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-xs lg:text-sm font-semibold text-dark-olive-800 truncate flex-1" title={file.name}>
                                  {file.name}
                                </h4>
                                {!isSelectionMode && (
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
                                      <DropdownItem
                                        key="preview"
                                        startContent={<EyeIcon className="w-4 h-4" />}
                                        onPress={() => handlePreview(file)}
                                      >
                                        预览
                                      </DropdownItem>
                                      <DropdownItem
                                        key="download"
                                        startContent={<DownloadIcon className="w-4 h-4" />}
                                        onPress={() => handleDownload(file)}
                                      >
                                        下载
                                      </DropdownItem>
                                      <DropdownItem
                                        key="share"
                                        startContent={<Share2Icon className="w-4 h-4" />}
                                        onPress={() => handleShare(file, 'file')}
                                      >
                                        分享
                                      </DropdownItem>
                                      <DropdownItem
                                        key="rename"
                                        startContent={<EditIcon className="w-4 h-4" />}
                                        onPress={() => handleRename(file, 'file')}
                                      >
                                        重命名
                                      </DropdownItem>
                                      <DropdownItem
                                        key="delete"
                                        color="danger"
                                        startContent={<TrashIcon className="w-4 h-4" />}
                                        onPress={() => handleDelete(file, 'file')}
                                      >
                                        删除
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                                )}
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
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        parentId={currentFolderId}
        onSuccess={loadFiles}
      />

      <BatchDeleteConfirmModal
        isOpen={showBatchDelete}
        onClose={() => setShowBatchDelete(false)}
        selectedFiles={selectedFiles}
        selectedFolders={selectedFolders}
        onSuccess={() => {
          loadFiles();
          // 批量删除成功后，清空选择并退出选择模式
          setSelectedFiles(new Set());
          setSelectedFolders(new Set());
          setIsSelectionMode(false);
        }}
      />

      {selectedItem && (
        <>
          <RenameModal
            isOpen={showRename}
            onClose={() => {
              setShowRename(false);
              setSelectedItem(null);
            }}
            fileId={selectedItem.id}
            currentName={selectedItem.type === 'file' ? selectedItem.name : selectedItem.name}
            type={selectedItem.type}
            onSuccess={loadFiles}
          />

          <DeleteConfirmModal
            isOpen={showDelete}
            onClose={() => {
              setShowDelete(false);
              setSelectedItem(null);
            }}
            itemId={selectedItem.id}
            itemName={selectedItem.type === 'file' ? selectedItem.name : selectedItem.name}
            type={selectedItem.type}
            onSuccess={loadFiles}
          />

          <CreateShareModal
            isOpen={showShare}
            onClose={() => {
              setShowShare(false);
              setSelectedItem(null);
            }}
            itemId={selectedItem.id}
            itemName={selectedItem.type === 'file' ? selectedItem.name : selectedItem.name}
            type={selectedItem.type}
            onSuccess={loadFiles}
          />
        </>
      )}

      {/* 文件预览 */}
      {showPreview && selectedItem && selectedItem.type === 'file' && (
        <FilePreview
          file={{
            ...selectedItem,
            storagePath: `/api/files/${selectedItem.id}/serve`
          }}
          onClose={() => {
            setShowPreview(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
