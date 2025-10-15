'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Progress,
  Divider,
  Spinner,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from '@heroui/react';
import { 
  CloudIcon, 
  FilesIcon, 
  ShareIcon, 
  HardDriveIcon,
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronRightIcon,
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';
import ky from 'ky';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storageStats, setStorageStats] = useState<any>({ totalUsed: 0, totalCapacity: 0 });

  useEffect(() => {
    checkAuth();
    loadStorageStats();

    // 监听存储更新事件
    const handleStorageUpdate = () => {
      loadStorageStats();
    };
    window.addEventListener('storageUpdated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storageUpdated', handleStorageUpdate);
    };
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await ky.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).json<any>();

      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await ky.get('/api/storage-sources', {
        headers: { Authorization: `Bearer ${token}` },
      }).json<any>();

      setStorageStats({
        totalUsed: response.usedQuota || 0,
        totalCapacity: response.totalQuota || 0,
      });
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0 || isNaN(bytes) || bytes < 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + ' GB';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const menuItems = [
    { 
      key: 'files', 
      label: '文件', 
      icon: FilesIcon, 
      href: '/files',
      show: true 
    },
    { 
      key: 'shares', 
      label: '分享', 
      icon: ShareIcon, 
      href: '/shares',
      show: true 
    },
    { 
      key: 'storage', 
      label: '存储源', 
      icon: HardDriveIcon, 
      href: '/storage',
      show: true 
    },
    { 
      key: 'settings', 
      label: '个人设置', 
      icon: SettingsIcon, 
      href: '/settings',
      show: true 
    },
    { 
      key: 'users', 
      label: '用户', 
      icon: UsersIcon, 
      href: '/users',
      show: user?.isOwner 
    },
    { 
      key: 'rbac', 
      label: '权限管理', 
      icon: ShieldIcon, 
      href: '/rbac',
      show: user?.isOwner 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-green-50">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-cream-green-50">
      {/* 桌面端侧边栏 */}
      <aside 
        className={`
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          bg-white border-r border-divider transition-all duration-300 flex-col
          hidden lg:flex
        `}
      >
        <SidebarContent 
          collapsed={sidebarCollapsed}
          menuItems={menuItems}
          pathname={pathname}
          router={router}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          storageStats={storageStats}
          formatBytes={formatBytes}
        />
      </aside>

      {/* 移动端抽屉菜单 */}
      <Drawer
        isOpen={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        placement="left"
        size="xs"
        hideCloseButton
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerBody className="p-0">
                <SidebarContent 
                  collapsed={false}
                  menuItems={menuItems}
                  pathname={pathname}
                  router={router}
                  onToggle={() => {}}
                  storageStats={storageStats}
                  formatBytes={formatBytes}
                  onItemClick={onClose}
                  hideLogo={true}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-14 lg:h-16 bg-white border-b border-divider flex items-center justify-between px-4 lg:px-6">
          {/* 移动端：菜单按钮 + Logo */}
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="lg:hidden"
              onPress={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2 lg:hidden">
              <CloudIcon className="w-5 h-5 text-amber-brown-500" />
              <span className="font-bold text-dark-olive-800">Nimbus</span>
            </div>
          </div>

          {/* 桌面端：搜索框 */}
          <div className="hidden lg:block flex-1 max-w-xl">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
              <input
                type="text"
                placeholder="搜索文件..."
                className="w-full pl-10 pr-4 py-2 bg-secondary-50 border border-transparent rounded-lg text-sm 
                  focus:outline-none focus:border-amber-brown-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* 移动端：搜索按钮 */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="lg:hidden"
            >
              <SearchIcon className="w-5 h-5 text-dark-olive-700" />
            </Button>

            {/* 通知 */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="relative"
            >
              <BellIcon className="w-5 h-5 text-dark-olive-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
            </Button>

            <Divider orientation="vertical" className="h-6 hidden lg:block" />

            {/* 用户菜单 */}
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <div className="flex items-center gap-2 lg:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.username}
                    size="sm"
                    className="bg-primary-200 text-dark-olive-800"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-dark-olive-800">
                      {user?.username}
                    </p>
                    <p className="text-xs text-default-500">
                      {user?.isOwner ? 'Owner' : 'User'}
                    </p>
                  </div>
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="用户菜单" className="w-56">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-xs text-default-500">{user?.email}</p>
                </DropdownItem>
                <DropdownItem 
                  key="settings" 
                  startContent={<SettingsIcon className="w-4 h-4" />}
                  onClick={() => router.push('/settings')}
                >
                  个人设置
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOutIcon className="w-4 h-4" />}
                  onClick={handleLogout}
                >
                  退出登录
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto bg-cream-green-50 pb-16 lg:pb-0">
          <div className="h-full">
            {children}
          </div>
        </main>

        {/* 移动端底部导航栏 */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-divider z-50">
          <div className="grid grid-cols-4 h-16">
            {menuItems.filter(item => item.show).slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.href)}
                  className={`
                    flex flex-col items-center justify-center gap-1 transition-colors
                    ${isActive 
                      ? 'text-amber-brown-500' 
                      : 'text-dark-olive-600'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 w-12 h-0.5 bg-amber-brown-500 rounded-t-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

// 侧边栏内容组件（桌面端和移动端共用）
function SidebarContent({ 
  collapsed, 
  menuItems, 
  pathname, 
  router,
  onToggle,
  onItemClick,
  storageStats,
  formatBytes,
  hideLogo = false
}: any) {
  return (
    <>
      {/* 移动端关闭按钮 */}
      {hideLogo && (
        <div className="h-16 flex items-center justify-between px-4 border-b border-divider">
          <div className="flex items-center gap-2">
            <CloudIcon className="w-6 h-6 text-amber-brown-500" />
            <span className="text-lg font-bold text-dark-olive-800">Nimbus</span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onItemClick}
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>
      )}
      
      {/* Logo区域（桌面端） */}
      {!hideLogo && (
        <div className="h-16 flex items-center px-4 border-b border-divider">
          {collapsed ? (
            <CloudIcon className="w-8 h-8 text-amber-brown-500" />
          ) : (
            <div className="flex items-center gap-2">
              <CloudIcon className="w-8 h-8 text-amber-brown-500" />
              <span className="text-xl font-bold text-dark-olive-800">Nimbus</span>
            </div>
          )}
        </div>
      )}

      {/* 导航菜单 */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.filter((item: any) => item.show).map((item: any) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.key}
              onClick={() => {
                router.push(item.href);
                onItemClick?.();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${isActive 
                  ? 'bg-amber-brown-500 text-white shadow-md' 
                  : 'text-dark-olive-700 hover:bg-secondary-100'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <ChevronRightIcon className="w-4 h-4 ml-auto" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 存储空间指示器 */}
      {!collapsed && (
        <div className="p-4 border-t border-divider">
          <div className="bg-secondary-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-dark-olive-700">存储空间</span>
              <span className="text-xs text-dark-olive-600">
                {formatBytes(storageStats.totalUsed)} / {formatBytes(storageStats.totalCapacity)}
              </span>
            </div>
            <Progress 
              value={storageStats.totalCapacity > 0 ? (storageStats.totalUsed / storageStats.totalCapacity) * 100 : 0} 
              color="primary"
              aria-label="存储空间使用情况"
              size="sm"
              className="mb-1"
            />
            <p className="text-xs text-default-500">
              还有 {formatBytes(storageStats.totalCapacity - storageStats.totalUsed)} 可用
            </p>
          </div>
        </div>
      )}

      {/* 折叠按钮（仅桌面端显示） */}
      <div className="p-3 border-t border-divider hidden lg:block">
        <Button
          isIconOnly={collapsed}
          size="sm"
          variant="light"
          onClick={onToggle}
          className="w-full"
        >
          <MenuIcon className="w-4 h-4" />
          {!collapsed && <span className="ml-2">收起</span>}
        </Button>
      </div>
    </>
  );
}
