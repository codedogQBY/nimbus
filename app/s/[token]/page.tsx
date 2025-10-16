"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Spinner,
  Divider,
  Chip,
  Breadcrumbs,
  BreadcrumbItem,
} from "@heroui/react";
import {
  LockIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  FolderIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  HomeIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
  GridIcon,
  ListIcon,
} from "lucide-react";
import ky from "ky";

import { ShareFilePreview } from "@/lib/file-preview/share-preview-components";
import { ShareFilePreviewModal } from "@/lib/file-preview/share-preview-manager";
import { ShareAuthenticatedImage } from "@/components/share-authenticated-image";
import { canPreview } from "@/lib/file-preview/types";

interface SharePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function SharePage({ params }: SharePageProps) {
  const [share, setShare] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [requirePassword, setRequirePassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [token, setToken] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 预览相关状态
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // 文件夹内容相关状态
  const [folderContents, setFolderContents] = useState<any>(null);
  const [_currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [loadingContents, setLoadingContents] = useState(false);

  // 清理文件名中的路径信息，只保留文件名部分
  const getCleanFileName = (fileName: string): string => {
    if (!fileName) return "";
    // 分割路径并取最后一部分作为文件名
    const parts = fileName.split(/[/\\]/);
    return parts[parts.length - 1] || fileName;
  };

  useEffect(() => {
    // 获取token
    params.then((p) => {
      setToken(p.token);
      loadShare();
    });
  }, []);

  useEffect(() => {
    if (share && share.type === "folder" && !requirePassword) {
      loadFolderContents(share.folderId);
    }
  }, [share, requirePassword]);

  const loadShare = async () => {
    try {
      setLoading(true);
      setError("");

      const { token: shareToken } = await params;
      const response = await ky.get(`/api/shares/${shareToken}`).json<any>();

      if (response.requirePassword) {
        setRequirePassword(true);
        setShare({ name: response.name, type: response.type });
      } else {
        setShare(response.share);
        // 记录访问
        recordView(shareToken);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("分享不存在或已失效");
      } else if (err.response?.status === 410) {
        setError("分享已过期");
      } else {
        setError("加载分享失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContents = async (folderId?: number) => {
    try {
      setLoadingContents(true);
      const { token } = await params;

      const url = folderId
        ? `/api/shares/${token}/contents?folderId=${folderId}`
        : `/api/shares/${token}/contents`;

      const response = await ky.get(url).json<any>();

      setFolderContents(response);
      setCurrentFolderId(folderId || share.folderId);
    } catch (err) {
      console.error("加载文件夹内容失败:", err);
    } finally {
      setLoadingContents(false);
    }
  };

  const verifyPassword = async () => {
    if (!password.trim()) {
      setError("请输入分享密码");

      return;
    }

    try {
      setVerifying(true);
      setError("");

      const { token } = await params;
      const response = await ky
        .post(`/api/shares/${token}/verify`, {
          json: { password: password.trim() },
        })
        .json<any>();

      setShare(response.share);
      setRequirePassword(false);
      // 记录访问
      recordView(token);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("密码错误");
      } else {
        setError("验证失败");
      }
    } finally {
      setVerifying(false);
    }
  };

  const recordView = async (token: string) => {
    try {
      await ky.post(`/api/shares/${token}/view`);

      // 手动增加viewCount以立即反映变化
      setShare((prevShare: any) => ({
        ...prevShare,
        viewCount: (prevShare.viewCount || 0) + 1,
      }));
    } catch (err) {
      // 静默处理访问记录错误
      console.error("记录访问失败:", err);
    }
  };

  const handleDownload = async () => {
    try {
      const { token } = await params;

      // 记录下载
      await ky.post(`/api/shares/${token}/download`);

      // 获取下载链接
      const response = await ky
        .get(`/api/shares/${token}/download`)
        .json<any>();

      window.open(response.downloadUrl, "_blank");
    } catch (err) {
      console.error("下载失败:", err);
    }
  };

  const handleFilePreview = (file: any) => {
    // 使用弹框预览，与主文件页面保持一致
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleFolderNavigate = (folderId: number) => {
    loadFolderContents(folderId);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取文件图标
  const getFileIcon = (mimeType?: string): JSX.Element => {
    if (mimeType?.startsWith("image/"))
      return <ImageIcon className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />;
    if (mimeType?.startsWith("video/"))
      return <VideoIcon className="w-8 h-8 lg:w-10 lg:h-10 text-warning" />;
    if (mimeType?.startsWith("audio/"))
      return <MusicIcon className="w-8 h-8 lg:w-10 lg:h-10 text-success" />;
    if (mimeType?.includes("pdf"))
      return <FileTextIcon className="w-8 h-8 lg:w-10 lg:h-10 text-danger" />;

    return (
      <FileTextIcon className="w-8 h-8 lg:w-10 lg:h-10 text-default-500" />
    );
  };

  // 获取文件缩略图URL（分享版本）
  const getShareFileThumbnailUrl = (file: any): string | null => {
    if (file.mimeType?.startsWith("image/")) {
      return `/api/files/${file.id}/serve?share=${token}`;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-brown-50 to-secondary-50">
        <div className="text-center">
          <Spinner color="primary" size="lg" />
          <p className="text-sm text-default-500 mt-3">加载分享中...</p>
        </div>
      </div>
    );
  }

  if (error && !requirePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-brown-50 to-secondary-50 p-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-8 text-center">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircleIcon className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-lg font-semibold text-dark-olive-800 mb-2">
              访问失败
            </h2>
            <p className="text-sm text-default-500 mb-6">{error}</p>
            <Button
              className="bg-amber-brown-500"
              color="primary"
              onPress={() => (window.location.href = "/")}
            >
              返回首页
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (requirePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-brown-50 to-secondary-50 p-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockIcon className="w-8 h-8 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-dark-olive-800 mb-2">
                密码保护
              </h2>
              <p className="text-sm text-default-500">
                此分享受密码保护，请输入密码访问
              </p>
            </div>

            <div className="bg-secondary-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                {share?.type === "folder" ? (
                  <FolderIcon className="w-6 h-6 text-amber-brown-500" />
                ) : (
                  <FileIcon className="w-6 h-6 text-primary" />
                )}
                <div>
                  <p className="text-sm font-semibold text-dark-olive-800 truncate">
                    {share?.name}
                  </p>
                  <p className="text-xs text-default-500">
                    {share?.type === "folder" ? "文件夹" : "文件"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                errorMessage={error}
                isInvalid={!!error}
                label="分享密码"
                placeholder="请输入分享密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && verifyPassword()}
              />

              <Button
                className="w-full bg-amber-brown-500"
                color="primary"
                isLoading={verifying}
                onPress={verifyPassword}
              >
                访问分享
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-brown-50 to-secondary-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* 分享信息卡片 */}
        <Card className="bg-white mb-6">
          <CardBody className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* 文件/文件夹图标 */}
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {share.type === "folder" ? (
                  <FolderIcon className="w-8 h-8 lg:w-10 lg:h-10 text-amber-brown-500" />
                ) : (
                  <FileIcon className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                )}
              </div>

              {/* 分享详情 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-dark-olive-800 truncate">
                    {share.name}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {share.hasPassword && (
                      <Chip
                        color="warning"
                        size="sm"
                        startContent={<LockIcon className="w-3 h-3" />}
                        variant="flat"
                      >
                        密码保护
                      </Chip>
                    )}
                    {share.expiresAt && (
                      <Chip
                        size="sm"
                        startContent={<ClockIcon className="w-3 h-3" />}
                        variant="flat"
                      >
                        {Math.ceil(
                          (new Date(share.expiresAt).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )}
                        天后过期
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {share.size && (
                    <div>
                      <p className="text-xs text-default-500">文件大小</p>
                      <p className="text-sm font-semibold text-dark-olive-800">
                        {formatFileSize(share.size)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-default-500">分享时间</p>
                    <p className="text-sm font-semibold text-dark-olive-800">
                      {formatDate(share.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-default-500">浏览次数</p>
                    <p className="text-sm font-semibold text-dark-olive-800">
                      {share.viewCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-default-500">下载次数</p>
                    <p className="text-sm font-semibold text-dark-olive-800">
                      {share.downloadCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-amber-brown-500 hover:bg-amber-brown-600"
                    color="primary"
                    size="lg"
                    startContent={<DownloadIcon className="w-5 h-5" />}
                    onPress={handleDownload}
                  >
                    下载{share.type === "folder" ? "文件夹" : "文件"}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 文件预览区域 */}
        {share.type === "file" &&
          canPreview(share.name || "", share.mimeType, share.size) && (
            <div className="mb-6">
              <ShareFilePreview
                file={{
                  id: share.fileId || share.id,
                  name: share.name,
                  originalName: share.name,
                  size: share.size,
                  mimeType: share.mimeType,
                }}
                shareToken={token}
                onDownload={handleDownload}
              />
            </div>
          )}

        {/* 文件夹内容 */}
        {share.type === "folder" && (
          <Card className="bg-white mb-6">
            <CardBody className="p-6">
              {/* 工具栏 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-dark-olive-800 mb-1">
                    文件夹内容
                  </h3>
                  {folderContents && (
                    <p className="text-sm text-default-500">
                      {folderContents.stats.folderCount} 个文件夹 •{" "}
                      {folderContents.stats.fileCount} 个文件
                    </p>
                  )}
                </div>

                {/* 视图切换 */}
                <div className="flex gap-1 bg-secondary-100 rounded-lg p-1">
                  <Button
                    isIconOnly
                    className={viewMode === "grid" ? "bg-white" : ""}
                    size="sm"
                    variant={viewMode === "grid" ? "solid" : "light"}
                    onClick={() => setViewMode("grid")}
                  >
                    <GridIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    className={viewMode === "list" ? "bg-white" : ""}
                    size="sm"
                    variant={viewMode === "list" ? "solid" : "light"}
                    onClick={() => setViewMode("list")}
                  >
                    <ListIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 面包屑导航 */}
              {folderContents?.breadcrumbs &&
                folderContents.breadcrumbs.length > 1 && (
                  <div className="mb-6">
                    <Breadcrumbs
                      separator={<ChevronRightIcon className="w-4 h-4" />}
                    >
                      {folderContents.breadcrumbs.map(
                        (crumb: any, index: number) => (
                          <BreadcrumbItem
                            key={`${crumb.id}-${index}`}
                            className={
                              index < folderContents.breadcrumbs.length - 1
                                ? "cursor-pointer hover:text-primary"
                                : ""
                            }
                            onClick={() =>
                              index < folderContents.breadcrumbs.length - 1 &&
                              handleFolderNavigate(crumb.id)
                            }
                          >
                            {index === 0 ? (
                              <HomeIcon className="w-4 h-4" />
                            ) : (
                              crumb.name
                            )}
                          </BreadcrumbItem>
                        ),
                      )}
                    </Breadcrumbs>
                  </div>
                )}

              {loadingContents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Spinner color="primary" size="lg" />
                    <p className="text-sm text-default-500 mt-3">加载中...</p>
                  </div>
                </div>
              ) : folderContents ? (
                <div className="space-y-6">
                  {/* 文件夹列表 */}
                  {folderContents.folders?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-dark-olive-800 mb-3 px-1">
                        文件夹
                      </h4>
                      <div
                        className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1"}`}
                      >
                        {folderContents.folders.map((folder: any) => (
                          <Card
                            key={folder.id}
                            isPressable
                            className="bg-secondary-50 hover:shadow-md transition-shadow border-none"
                            onPress={() => handleFolderNavigate(folder.id)}
                          >
                            <CardBody
                              className={
                                viewMode === "grid"
                                  ? "p-3 lg:p-4"
                                  : "p-3 lg:p-4"
                              }
                            >
                              <div
                                className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} items-start gap-3`}
                              >
                                <div
                                  className={`${viewMode === "grid" ? "w-full" : ""} flex items-center justify-center bg-primary-100 rounded-lg ${viewMode === "grid" ? "h-20 lg:h-24" : "w-12 h-12 flex-shrink-0"}`}
                                >
                                  <FolderIcon
                                    className={`${viewMode === "grid" ? "w-10 h-10 lg:w-12 lg:h-12" : "w-6 h-6"} text-amber-brown-500`}
                                  />
                                </div>

                                <div
                                  className={`flex-1 min-w-0 ${viewMode === "grid" ? "w-full" : ""}`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h5 className="text-xs lg:text-sm font-semibold text-dark-olive-800 truncate flex-1">
                                      {folder.name}
                                    </h5>
                                    <ChevronRightIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
                                  </div>
                                  <p className="text-xs text-default-500">
                                    {formatDate(folder.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 分隔符 */}
                  {folderContents.folders?.length > 0 &&
                    folderContents.files?.length > 0 && <Divider />}

                  {/* 文件列表 */}
                  {folderContents.files?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-dark-olive-800 mb-3 px-1">
                        文件
                      </h4>
                      <div
                        className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1"}`}
                      >
                        {folderContents.files.map((file: any) => {
                          const thumbnailUrl = getShareFileThumbnailUrl(file);

                          return (
                            <Card
                              key={file.id}
                              isPressable
                              className="bg-white hover:shadow-md transition-shadow"
                              data-file-id={file.id}
                              onPress={() => handleFilePreview(file)}
                            >
                              <CardBody
                                className={
                                  viewMode === "grid"
                                    ? "p-3 lg:p-4"
                                    : "p-3 lg:p-4"
                                }
                              >
                                <div
                                  className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} items-start gap-3`}
                                >
                                  {/* 文件缩略图或图标 */}
                                  <div
                                    className={`${viewMode === "grid" ? "w-full" : ""} flex items-center justify-center bg-secondary-100 rounded-lg ${viewMode === "grid" ? "h-20 lg:h-24" : "w-12 h-12 flex-shrink-0"} overflow-hidden relative`}
                                  >
                                    {thumbnailUrl ? (
                                      <>
                                        <ShareAuthenticatedImage
                                          alt={getCleanFileName(file.originalName || file.name)}
                                          className="w-full h-full object-cover"
                                          shareToken={token}
                                          src={thumbnailUrl}
                                          onError={() => {
                                            // 图片加载失败时显示默认图标
                                            const container =
                                              document.querySelector(
                                                `[data-file-id="${file.id}"] .thumbnail-fallback`,
                                              );

                                            if (container) {
                                              container.classList.remove(
                                                "hidden",
                                              );
                                            }
                                          }}
                                        />
                                        <div className="thumbnail-fallback hidden absolute inset-0 flex items-center justify-center w-full h-full">
                                          {getFileIcon(file.mimeType)}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex items-center justify-center w-full h-full">
                                        {getFileIcon(file.mimeType)}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    className={`flex-1 min-w-0 ${viewMode === "grid" ? "w-full" : ""}`}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h5
                                        className="text-xs lg:text-sm font-semibold text-dark-olive-800 truncate flex-1"
                                        title={getCleanFileName(file.originalName || file.name)}
                                      >
                                        {getCleanFileName(file.originalName || file.name)}
                                      </h5>
                                      {/* 预览/下载按钮 */}
                                      <div className="flex-shrink-0">
                                        {canPreview(
                                          getCleanFileName(file.originalName || file.name),
                                          file.mimeType,
                                          file.size,
                                        ) ? (
                                          <Button
                                            isIconOnly
                                            className="text-primary"
                                            size="sm"
                                            variant="light"
                                            onPress={() => {
                                              handleFilePreview(file);
                                            }}
                                          >
                                            <EyeIcon className="w-4 h-4" />
                                          </Button>
                                        ) : (
                                          <Button
                                            isIconOnly
                                            className="text-default-500"
                                            size="sm"
                                            variant="light"
                                            onPress={() => {
                                              handleFilePreview(file);
                                            }}
                                          >
                                            <DownloadIcon className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <p className="text-xs text-default-500">
                                        {formatFileSize(Number(file.size))} •{" "}
                                        {formatDate(file.createdAt)}
                                      </p>
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

                  {/* 空状态 */}
                  {!folderContents.folders?.length &&
                    !folderContents.files?.length && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FolderIcon className="w-8 h-8 text-default-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-dark-olive-800 mb-2">
                          文件夹为空
                        </h4>
                        <p className="text-sm text-default-500">
                          这个文件夹还没有任何内容
                        </p>
                      </div>
                    )}
                </div>
              ) : null}
            </CardBody>
          </Card>
        )}

        {/* 分享者信息 */}
        <Card className="bg-white">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <CheckCircle2Icon className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-olive-800">
                  {share.creatorName} 分享了这个
                  {share.type === "folder" ? "文件夹" : "文件"}
                </h3>
                <p className="text-xs text-default-500">
                  通过 Nimbus 安全分享 • {formatDate(share.createdAt)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 底部链接 */}
        <div className="text-center mt-8">
          <p className="text-xs text-default-400 mb-2">
            想要创建自己的分享链接？
          </p>
          <Button
            className="text-amber-brown-600"
            size="sm"
            variant="light"
            onPress={() => (window.location.href = "/")}
          >
            访问 Nimbus
          </Button>
        </div>
      </div>

      {/* 文件预览弹框 */}
      {showPreview && selectedFile && (
        <ShareFilePreviewModal
          file={selectedFile}
          shareToken={token}
          onClose={() => {
            setShowPreview(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}
