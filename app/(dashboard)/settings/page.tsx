"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Tabs,
  Tab,
  Avatar,
  Button,
  Input,
  Chip,
} from "@heroui/react";
import { UserIcon, KeyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import ky from "ky";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  isOwner: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 个人资料表单状态
  const [profileForm, setProfileForm] = useState({
    username: "",
    avatarUrl: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  // 密码修改表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 密码强度检查
  const passwordChecks = {
    length: passwordForm.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    lowercase: /[a-z]/.test(passwordForm.newPassword),
    number: /[0-9]/.test(passwordForm.newPassword),
    match: Boolean(
      passwordForm.newPassword &&
        passwordForm.newPassword === passwordForm.confirmPassword,
    ),
  };

  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  // 获取用户资料
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await ky
        .get("/api/settings/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<{ user: UserProfile }>();

      setUserProfile(response.user);
      setProfileForm({
        username: response.user.username,
        avatarUrl: response.user.avatarUrl || "",
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setError("获取用户资料失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新个人资料
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await ky
        .put("/api/settings/profile", {
          headers: { Authorization: `Bearer ${token}` },
          json: profileForm,
        })
        .json<{ success: boolean; user: UserProfile; message: string }>();

      if (response.success) {
        setUserProfile(response.user);
        setProfileSuccess(response.message);
        setTimeout(() => setProfileSuccess(""), 3000);
      }
    } catch (error: any) {
      const errorData = await error.response?.json();

      setError(errorData?.error || "更新失败");
    } finally {
      setProfileLoading(false);
    }
  };

  // 修改密码
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPasswordChecksPassed) return;

    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");

    try {
      const token = localStorage.getItem("token");
      const response = await ky
        .post("/api/settings/password", {
          headers: { Authorization: `Bearer ${token}` },
          json: passwordForm,
        })
        .json<{ success: boolean; message: string }>();

      if (response.success) {
        setPasswordSuccess(response.message);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setPasswordSuccess(""), 3000);
      }
    } catch (error: any) {
      const errorData = await error.response?.json();

      setPasswordError(errorData?.error || "密码修改失败");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-default-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <p className="text-danger mb-4">{error}</p>
            <Button color="primary" onPress={fetchUserProfile}>
              重试
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <UserIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">个人设置</h1>
          <p className="text-default-500">管理您的账户信息和偏好设置</p>
        </div>
      </div>

      {/* 用户信息卡片 */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <Avatar
              className="w-16 h-16"
              name={userProfile?.username}
              size="lg"
              src={userProfile?.avatarUrl}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">
                  {userProfile?.username}
                </h2>
                {userProfile?.isOwner && (
                  <Chip color="warning" size="sm" variant="flat">
                    所有者
                  </Chip>
                )}
                <Chip
                  color={userProfile?.isActive ? "success" : "default"}
                  size="sm"
                  variant="dot"
                >
                  {userProfile?.isActive ? "活跃" : "未激活"}
                </Chip>
              </div>
              <p className="text-default-500">{userProfile?.email}</p>
              <p className="text-xs text-default-400 mt-1">
                注册时间：
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString("zh-CN")
                  : ""}
                {userProfile?.lastLoginAt && (
                  <span className="ml-4">
                    最后登录：
                    {new Date(userProfile.lastLoginAt).toLocaleString("zh-CN")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 设置选项卡 */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            classNames={{
              tabList:
                "gap-6 w-full relative rounded-none p-6 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab
              key="profile"
              title={
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>个人资料</span>
                </div>
              }
            >
              <div className="p-6">
                <form className="space-y-6" onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      isRequired
                      description="用户名只能包含字母、数字和下划线"
                      label="用户名"
                      placeholder="输入用户名"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          username: e.target.value,
                        })
                      }
                    />
                    <Input
                      description="支持 http:// 或 https:// 开头的图片链接"
                      label="头像链接"
                      placeholder="输入头像URL（可选）"
                      value={profileForm.avatarUrl}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          avatarUrl: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Input
                    isReadOnly
                    description="邮箱地址不可修改"
                    label="邮箱地址"
                    value={userProfile?.email || ""}
                  />

                  {profileSuccess && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-success text-sm">{profileSuccess}</p>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                      <p className="text-danger text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      className="px-8"
                      color="primary"
                      isLoading={profileLoading}
                      type="submit"
                    >
                      保存更改
                    </Button>
                  </div>
                </form>
              </div>
            </Tab>

            <Tab
              key="security"
              title={
                <div className="flex items-center space-x-2">
                  <KeyIcon className="w-4 h-4" />
                  <span>安全设置</span>
                </div>
              }
            >
              <div className="p-6">
                <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <Input
                      isRequired
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                        >
                          {showPasswords.current ? (
                            <EyeOffIcon className="w-4 h-4 text-default-400" />
                          ) : (
                            <EyeIcon className="w-4 h-4 text-default-400" />
                          )}
                        </button>
                      }
                      label="当前密码"
                      placeholder="输入当前密码"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                    />

                    <Input
                      isRequired
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                        >
                          {showPasswords.new ? (
                            <EyeOffIcon className="w-4 h-4 text-default-400" />
                          ) : (
                            <EyeIcon className="w-4 h-4 text-default-400" />
                          )}
                        </button>
                      }
                      label="新密码"
                      placeholder="输入新密码"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                    />

                    <Input
                      isRequired
                      endContent={
                        <button
                          className="focus:outline-none"
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                        >
                          {showPasswords.confirm ? (
                            <EyeOffIcon className="w-4 h-4 text-default-400" />
                          ) : (
                            <EyeIcon className="w-4 h-4 text-default-400" />
                          )}
                        </button>
                      }
                      label="确认新密码"
                      placeholder="再次输入新密码"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* 密码强度指示器 */}
                  {passwordForm.newPassword && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-default-700">
                        密码要求：
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div
                          className={`flex items-center gap-2 ${passwordChecks.length ? "text-success" : "text-default-400"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${passwordChecks.length ? "bg-success" : "bg-default-300"}`}
                          />
                          至少8个字符
                        </div>
                        <div
                          className={`flex items-center gap-2 ${passwordChecks.uppercase ? "text-success" : "text-default-400"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${passwordChecks.uppercase ? "bg-success" : "bg-default-300"}`}
                          />
                          包含大写字母
                        </div>
                        <div
                          className={`flex items-center gap-2 ${passwordChecks.lowercase ? "text-success" : "text-default-400"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${passwordChecks.lowercase ? "bg-success" : "bg-default-300"}`}
                          />
                          包含小写字母
                        </div>
                        <div
                          className={`flex items-center gap-2 ${passwordChecks.number ? "text-success" : "text-default-400"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${passwordChecks.number ? "bg-success" : "bg-default-300"}`}
                          />
                          包含数字
                        </div>
                        <div
                          className={`flex items-center gap-2 ${passwordChecks.match ? "text-success" : "text-default-400"} col-span-2`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${passwordChecks.match ? "bg-success" : "bg-default-300"}`}
                          />
                          两次密码输入一致
                        </div>
                      </div>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-success text-sm">{passwordSuccess}</p>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                      <p className="text-danger text-sm">{passwordError}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      className="px-8"
                      color="primary"
                      isDisabled={!allPasswordChecksPassed}
                      isLoading={passwordLoading}
                      type="submit"
                    >
                      修改密码
                    </Button>
                  </div>
                </form>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
