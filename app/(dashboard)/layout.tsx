'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Link,
  Spinner
} from '@heroui/react';
import { CloudIcon, FilesIcon, ShareIcon, SettingsIcon, UsersIcon, HardDriveIcon, LogOutIcon } from 'lucide-react';
import ky from 'ky';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-green-50">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-green-50">
      {/* 顶部导航栏 */}
      <Navbar 
        isBordered 
        maxWidth="full"
        className="bg-white/80 backdrop-blur-md border-b border-dark-olive-800/10"
      >
        <NavbarBrand>
          <CloudIcon className="w-6 h-6 text-amber-brown-500 mr-2" />
          <p className="font-bold text-xl text-dark-olive-800">Nimbus</p>
        </NavbarBrand>

        <NavbarContent className="hidden sm:flex gap-6" justify="center">
          <NavbarItem>
            <Link 
              href="/files" 
              className="flex items-center gap-2 text-dark-olive-700 hover:text-amber-brown-500"
            >
              <FilesIcon className="w-4 h-4" />
              文件
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link 
              href="/shares" 
              className="flex items-center gap-2 text-dark-olive-700 hover:text-amber-brown-500"
            >
              <ShareIcon className="w-4 h-4" />
              分享
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link 
              href="/storage" 
              className="flex items-center gap-2 text-dark-olive-700 hover:text-amber-brown-500"
            >
              <HardDriveIcon className="w-4 h-4" />
              存储源
            </Link>
          </NavbarItem>
          {user?.isOwner && (
            <NavbarItem>
              <Link 
                href="/users" 
                className="flex items-center gap-2 text-dark-olive-700 hover:text-amber-brown-500"
              >
                <UsersIcon className="w-4 h-4" />
                用户
              </Link>
            </NavbarItem>
          )}
        </NavbarContent>

        <NavbarContent justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                src={user?.avatarUrl}
                name={user?.username}
                size="sm"
                color="primary"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="用户菜单">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{user?.username}</p>
                <p className="text-xs text-default-500">{user?.email}</p>
              </DropdownItem>
              <DropdownItem 
                key="settings" 
                startContent={<SettingsIcon className="w-4 h-4" />}
              >
                设置
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
        </NavbarContent>
      </Navbar>

      {/* 主内容区域 */}
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  );
}

