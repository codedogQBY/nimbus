'use client';

import { 
  Card, 
  CardBody,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
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
  CheckCircle2Icon
} from 'lucide-react';

export default function SharesPage() {
  // Mock数据
  const shares = [
    {
      id: 1,
      name: '项目文档.zip',
      type: 'file',
      shareToken: 'abc123xyz',
      hasPassword: true,
      expiresAt: new Date('2024-10-18'),
      downloadCount: 12,
      viewCount: 45,
      createdAt: new Date('2024-10-11'),
      isActive: true,
    },
    {
      id: 2,
      name: '设计稿文件夹',
      type: 'folder',
      shareToken: 'def456uvw',
      hasPassword: false,
      expiresAt: null,
      downloadCount: 8,
      viewCount: 23,
      createdAt: new Date('2024-10-10'),
      isActive: true,
    },
  ];

  const copyShareLink = (token: string) => {
    const link = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(link);
    // TODO: 显示复制成功提示
  };

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="bg-white">
            <CardBody className="p-4 lg:p-5">
              <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                  <Share2Icon className="w-5 h-5 lg:w-6 lg:h-6 text-amber-brown-500" />
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xs text-default-500">分享</p>
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{shares.length}</p>
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
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">
                    {shares.reduce((sum, s) => sum + s.viewCount, 0)}
                  </p>
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
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">
                    {shares.reduce((sum, s) => sum + s.downloadCount, 0)}
                  </p>
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
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">
                    {shares.filter(s => s.hasPassword).length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 分享列表 */}
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
                          {Math.ceil((share.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天
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
                        <span className="sm:inline">复制</span>
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
                        <span>{share.createdAt.toLocaleDateString('zh-CN')}</span>
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
                        <DropdownItem key="copy" startContent={<CopyIcon className="w-4 h-4" />}>
                          复制链接
                        </DropdownItem>
                        <DropdownItem key="edit">
                          编辑设置
                        </DropdownItem>
                        <DropdownItem 
                          key="delete" 
                          color="danger"
                          startContent={<Trash2Icon className="w-4 h-4" />}
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
      </div>
    </div>
  );
}
