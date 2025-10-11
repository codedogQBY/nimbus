'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Chip,
  Input,
  Spinner,
  Accordion,
  AccordionItem,
} from '@heroui/react';
import {
  SearchIcon,
  FileIcon,
  UsersIcon,
  ShareIcon,
  HardDriveIcon,
  KeyIcon,
  ShieldIcon,
} from 'lucide-react';
import ky from 'ky';

interface Permission {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: string;
  _count: {
    rolePermissions: number;
  };
}

interface PermissionGroup {
  resource: string;
  icon: any;
  color: string;
  permissions: Permission[];
}

const RESOURCE_ICONS: Record<string, any> = {
  files: FileIcon,
  users: UsersIcon,
  shares: ShareIcon,
  storage: HardDriveIcon,
  permissions: KeyIcon,
  system: ShieldIcon,
};

const RESOURCE_COLORS: Record<string, string> = {
  files: 'primary',
  users: 'secondary',
  shares: 'success',
  storage: 'warning',
  permissions: 'danger',
  system: 'default',
};

const RESOURCE_NAMES: Record<string, string> = {
  files: '文件管理',
  users: '用户管理',
  shares: '分享管理',
  storage: '存储管理',
  permissions: '权限管理',
  system: '系统管理',
};

export function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    // 按资源分组
    const groups: Record<string, Permission[]> = {};
    
    permissions.forEach((permission) => {
      if (!groups[permission.resource]) {
        groups[permission.resource] = [];
      }
      groups[permission.resource].push(permission);
    });

    const groupedPermissions: PermissionGroup[] = Object.entries(groups).map(([resource, perms]) => ({
      resource,
      icon: RESOURCE_ICONS[resource] || KeyIcon,
      color: RESOURCE_COLORS[resource] || 'default',
      permissions: perms,
    }));

    setPermissionGroups(groupedPermissions);
  }, [permissions]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await ky.get('/api/rbac/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      }).json<{ permissions: Permission[] }>();

      setPermissions(data.permissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = permissionGroups.map(group => ({
    ...group,
    permissions: group.permissions.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter(group => group.permissions.length > 0);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 顶部搜索栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="搜索权限..."
            startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            classNames={{
              input: "text-sm",
              inputWrapper: "h-10"
            }}
          />
        </div>
        <Chip color="primary" variant="flat" size="lg">
          共 {permissions.length} 个权限
        </Chip>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 桌面端 - 使用手风琴 */}
          <div className="hidden lg:block">
            <Accordion 
              variant="splitted"
              selectionMode="multiple"
              defaultExpandedKeys={filteredGroups.map(g => g.resource)}
            >
              {filteredGroups.map((group) => {
                const IconComponent = group.icon;
                return (
                  <AccordionItem
                    key={group.resource}
                    aria-label={RESOURCE_NAMES[group.resource] || group.resource}
                    title={
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${group.color}-100 flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 text-${group.color}-600`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-olive-800">
                            {RESOURCE_NAMES[group.resource] || group.resource}
                          </h4>
                          <p className="text-sm text-default-500">
                            {group.permissions.length} 个权限
                          </p>
                        </div>
                      </div>
                    }
                    className="bg-white"
                  >
                    <div className="space-y-2 pb-4">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start justify-between p-4 bg-default-50 rounded-lg hover:bg-default-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                {permission.name}
                              </code>
                              <Chip size="sm" variant="flat" color={group.color as any}>
                                {permission.action}
                              </Chip>
                            </div>
                            {permission.description && (
                              <p className="text-sm text-default-600 mt-2">
                                {permission.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm text-default-500">
                              {permission._count.rolePermissions} 个角色
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* 移动端 - 直接显示分组卡片 */}
          <div className="lg:hidden space-y-4">
            {filteredGroups.map((group) => {
              const IconComponent = group.icon;
              return (
                <Card key={group.resource} className="bg-white">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-${group.color}-100 flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 text-${group.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dark-olive-800">
                          {RESOURCE_NAMES[group.resource] || group.resource}
                        </h4>
                        <p className="text-sm text-default-500">
                          {group.permissions.length} 个权限
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="p-3 bg-default-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <code className="text-xs font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded">
                              {permission.name}
                            </code>
                            <Chip size="sm" variant="flat" color={group.color as any}>
                              {permission.action}
                            </Chip>
                          </div>
                          {permission.description && (
                            <p className="text-xs text-default-600 mt-1">
                              {permission.description}
                            </p>
                          )}
                          <p className="text-xs text-default-500 mt-2">
                            {permission._count.rolePermissions} 个角色使用
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <KeyIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                没有找到权限
              </h3>
              <p className="text-sm text-default-500">
                请尝试其他搜索关键词
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

