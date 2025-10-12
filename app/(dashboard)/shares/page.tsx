'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/toast-provider';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import {
  Share2Icon,
  LinkIcon,
  EyeIcon,
  DownloadIcon,
  LockIcon,
  ClockIcon,
  MoreVerticalIcon,
  CopyIcon,
  Trash2Icon,
  BarChart3Icon,
  FileIcon,
  FolderIcon,
  CalendarIcon,
  CheckCircle2Icon,
  EditIcon,
  SettingsIcon,
  TrendingUpIcon
} from 'lucide-react';
import ky from 'ky';

export default function SharesPage() {
  const { showSuccess, showError } = useToast();
  const [shares, setShares] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShare, setSelectedShare] = useState<any>(null);

  // Modals
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await ky.get('/api/shares', {
        headers: { Authorization: `Bearer ${token}` },
      }).json<any>();

      setShares(response.shares);
      setStats(response.stats);
    } catch (err) {
      console.error('加载分享失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async (token: string) => {
    try {
      const link = `${window.location.origin}/s/${token}`;
      await navigator.clipboard.writeText(link);
      showSuccess('复制成功', '分享链接已复制到剪贴板');
    } catch (error) {
      showError('复制失败', '无法复制分享链接');
    }
  };

  const handleDeleteShare = (share: any) => {
    setSelectedShare(share);
    onDeleteOpen();
  };

  const handleShowStats = (share: any) => {
    setSelectedShare(share);
    onStatsOpen();
  };

  const confirmDelete = async () => {
    if (!selectedShare) return;

    try {
      const token = localStorage.getItem('token');
      await ky.delete(`/api/shares/delete/${selectedShare.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShares(shares.filter(s => s.id !== selectedShare.id));
      showSuccess('删除成功', '分享链接已删除');
      onDeleteClose();
      setSelectedShare(null);
    } catch (error) {
      console.error('Delete share error:', error);
      showError('删除失败', '无法删除分享链接');
    }
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
            <h1 className="text-xl lg:text-2xl font-bold text-dark-olive-800">我的分享</h1>
            <p className="text-xs lg:text-sm text-default-500 mt-1">管理您的分享链接</p>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <Share2Icon className="w-5 h-5 lg:w-6 lg:h-6 text-amber-brown-500" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">分享</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.total}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <EyeIcon className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">浏览</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.totalViews}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <DownloadIcon className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">下载</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.totalDownloads}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-danger-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <LockIcon className="w-5 h-5 lg:w-6 lg:h-6 text-danger" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">受保护</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.protected}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* 分享列表 */}
        {shares.length === 0 ? (
          <Card className="bg-white">
            <CardBody className="p-8 lg:p-12 text-center">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2Icon className="w-8 h-8 lg:w-10 lg:h-10 text-amber-brown-500" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-dark-olive-800 mb-2">
                还没有分享
              </h3>
              <p className="text-sm text-default-500 mb-6">
                分享文件给朋友，让协作更简单
              </p>
              <Button
                size="lg"
                startContent={<Share2Icon className="w-5 h-5" />}
                className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
                onClick={() => window.location.href = '/files'}
              >
                前往文件管理
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <Card key={share.id} className="bg-white">
                <CardBody className="p-4 lg:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-4">
                    {/* 文件/文件夹图标 */}
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {share.type === 'folder' ? (
                        <FolderIcon className="w-6 h-6 lg:w-7 lg:h-7 text-amber-brown-500" />
                      ) : (
                        <FileIcon className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                      )}
                    </div>

                    {/* 分享信息 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题和标签 */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h4 className="text-base font-semibold text-dark-olive-800 truncate">
                          {share.name}
                        </h4>
                        {share.hasPassword && (
                          <Chip size="sm" startContent={<LockIcon className="w-3 h-3" />} variant="flat" color="warning">
                            密码
                          </Chip>
                        )}
                        {share.expiresAt && (
                          <Chip size="sm" startContent={<ClockIcon className="w-3 h-3" />} variant="flat">
                            {Math.ceil((new Date(share.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天
                          </Chip>
                        )}
                        {!share.isActive && (
                          <Chip size="sm" color="danger" variant="flat">
                            已失效
                          </Chip>
                        )}
                      </div>

                      {/* 分享链接 */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                        <div className="flex-1 bg-secondary-50 px-3 py-2 rounded-lg flex items-center gap-2 min-w-0">
                          <LinkIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
                          <code className="text-xs text-default-600 truncate">
                            /s/{share.shareToken}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<CopyIcon className="w-4 h-4" />}
                          onClick={() => copyShareLink(share.shareToken)}
                          className="bg-secondary-100 sm:w-auto"
                        >
                          复制
                        </Button>
                      </div>

                      {/* 统计数据 */}
                      <div className="grid grid-cols-3 gap-3 lg:flex lg:items-center lg:gap-6 text-xs lg:text-sm text-default-500">
                        <div className="flex items-center gap-1.5">
                          <EyeIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          <span>{share.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DownloadIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          <span>{share.downloadCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-3 lg:col-span-1">
                          <CalendarIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          <span>{new Date(share.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex lg:flex-col gap-2 lg:items-end">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<BarChart3Icon className="w-4 h-4" />}
                        className="flex-1 lg:flex-none bg-secondary-100"
                        onPress={() => handleShowStats(share)}
                      >
                        统计
                      </Button>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            className="bg-secondary-100"
                          >
                            <MoreVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="copy"
                            startContent={<CopyIcon className="w-4 h-4" />}
                            onPress={() => copyShareLink(share.shareToken)}
                          >
                            复制链接
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<SettingsIcon className="w-4 h-4" />}
                            onPress={() => {
                              // TODO: 实现编辑设置功能
                              showError('功能开发中', '编辑设置功能正在开发中');
                            }}
                          >
                            编辑设置
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            color="danger"
                            startContent={<Trash2Icon className="w-4 h-4" />}
                            onPress={() => handleDeleteShare(share)}
                          >
                            删除分享
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认模态框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>删除分享</ModalHeader>
          <ModalBody>
            <p>确定要删除分享 <strong>{selectedShare?.name}</strong> 吗？</p>
            <p className="text-danger text-sm mt-2">
              此操作不可撤销，分享链接将立即失效。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              取消
            </Button>
            <Button color="danger" onPress={confirmDelete}>
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 统计信息模态框 */}
      <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-primary" />
            分享统计 - {selectedShare?.name}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-primary-50">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500">总浏览量</p>
                      <p className="text-xl font-bold text-primary">
                        {selectedShare?.viewCount || 0}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-success-50">
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                      <DownloadIcon className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500">总下载量</p>
                      <p className="text-xl font-bold text-success">
                        {selectedShare?.downloadCount || 0}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-default-600">创建时间</span>
                <span className="text-sm font-medium">
                  {selectedShare?.createdAt && new Date(selectedShare.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>

              {selectedShare?.expiresAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-default-600">过期时间</span>
                  <span className="text-sm font-medium">
                    {new Date(selectedShare.expiresAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-default-600">分享类型</span>
                <Chip size="sm" variant="flat">
                  {selectedShare?.type === 'folder' ? '文件夹' : '文件'}
                </Chip>
              </div>

              {selectedShare?.hasPassword && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-default-600">访问控制</span>
                  <Chip size="sm" color="warning" variant="flat" startContent={<LockIcon className="w-3 h-3" />}>
                    密码保护
                  </Chip>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={onStatsClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
