'use client';

import { useState } from 'react';
import { Card, CardBody, Tabs, Tab, Chip } from '@heroui/react';
import { ShieldIcon, UsersIcon, KeyIcon, ActivityIcon } from 'lucide-react';

export default function RBACPage() {
  const [selectedTab, setSelectedTab] = useState('roles');

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-dark-olive-800 flex items-center gap-3">
              <ShieldIcon className="w-7 h-7 lg:w-8 lg:h-8 text-primary-500" />
              权限管理
            </h1>
            <p className="text-sm lg:text-base text-default-500 mt-1">
              管理系统角色、权限和用户权限分配
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <CardBody className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                  <ShieldIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-default-600">角色总数</p>
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">5</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200">
            <CardBody className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
                  <KeyIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-default-600">权限总数</p>
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">24</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
            <CardBody className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success-500 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-default-600">已分配用户</p>
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">12</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
            <CardBody className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-warning-500 rounded-xl flex items-center justify-center">
                  <ActivityIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-default-600">今日操作</p>
                  <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">36</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Tab 导航 */}
        <Card>
          <CardBody className="p-0">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              aria-label="RBAC管理选项"
              classNames={{
                tabList: "w-full bg-default-50 p-2 rounded-t-xl",
                cursor: "bg-white shadow-sm",
                tab: "px-4 lg:px-6 h-10 lg:h-12",
                tabContent: "group-data-[selected=true]:text-primary-600 font-medium"
              }}
            >
              <Tab
                key="roles"
                title={
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">角色管理</span>
                    <span className="sm:hidden">角色</span>
                  </div>
                }
              />
              <Tab
                key="permissions"
                title={
                  <div className="flex items-center gap-2">
                    <KeyIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">权限管理</span>
                    <span className="sm:hidden">权限</span>
                  </div>
                }
              />
              <Tab
                key="assignments"
                title={
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">用户分配</span>
                    <span className="sm:hidden">分配</span>
                  </div>
                }
              />
              <Tab
                key="logs"
                title={
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">权限日志</span>
                    <span className="sm:hidden">日志</span>
                  </div>
                }
              />
            </Tabs>

            {/* Tab 内容区域 */}
            <div className="p-4 lg:p-6">
              {selectedTab === 'roles' && (
                <div className="text-center py-12">
                  <ShieldIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                    角色管理
                  </h3>
                  <p className="text-sm text-default-500">
                    正在开发中...
                  </p>
                </div>
              )}

              {selectedTab === 'permissions' && (
                <div className="text-center py-12">
                  <KeyIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                    权限管理
                  </h3>
                  <p className="text-sm text-default-500">
                    正在开发中...
                  </p>
                </div>
              )}

              {selectedTab === 'assignments' && (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                    用户分配
                  </h3>
                  <p className="text-sm text-default-500">
                    正在开发中...
                  </p>
                </div>
              )}

              {selectedTab === 'logs' && (
                <div className="text-center py-12">
                  <ActivityIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                    权限日志
                  </h3>
                  <p className="text-sm text-default-500">
                    正在开发中...
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

