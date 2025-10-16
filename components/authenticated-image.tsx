"use client";

import { useState, useEffect } from "react";
import { useLazyLoading } from "@/hooks/use-lazy-loading";
import { shouldUseDirectUrl, getDirectUrl } from "@/lib/direct-url";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
  onLoad?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  /**
   * 是否启用懒加载，默认为true
   */
  lazy?: boolean;
  /**
   * 懒加载的根边距，默认为"50px"
   */
  rootMargin?: string;
  /**
   * 懒加载占位符内容
   */
  placeholder?: React.ReactNode;
  /**
   * 是否使用直接URL访问，绕过服务器代理，默认为false
   */
  useDirectUrl?: boolean;
}

export function AuthenticatedImage({
  src,
  alt,
  className,
  style,
  onError,
  onLoad,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onClick,
  draggable = false,
  lazy = true,
  rootMargin = "50px",
  placeholder,
  useDirectUrl = true, // 默认启用，由shouldUseDirectUrl函数控制实际行为
}: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 懒加载hook
  const { ref, shouldLoad } = useLazyLoading({
    enabled: lazy,
    rootMargin,
    threshold: 0.1,
  });

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // 检查是否应该使用直接URL
        const shouldUseDirect = useDirectUrl && await shouldUseDirectUrl();
        console.log('AuthenticatedImage Debug:', {
          src,
          useDirectUrl,
          shouldUseDirect
        });

        if (shouldUseDirect) {
          // 如果src是API路径，需要获取直接URL
          if (src.startsWith('/api/files/')) {
            // 从API URL中提取文件ID (支持 /serve 和 /download 格式)
            const fileIdMatch = src.match(/\/api\/files\/([^\/]+)\/(?:serve|download)/);
            if (fileIdMatch) {
              const fileId = fileIdMatch[1];
              console.log('Attempting to get direct URL for fileId:', fileId);
              const directUrl = await getDirectUrl(fileId);
              if (directUrl) {
                console.log('Got direct URL:', directUrl);
                setImageSrc(directUrl);
                setLoading(false);
                onLoad?.();
              } else {
                console.warn('Failed to get direct URL, falling back to authenticated loading');
                // 如果获取直接URL失败，强制使用认证加载模式
                const token = localStorage.getItem("token");
                const response = await fetch(src, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }

                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);

                setImageSrc(imageUrl);
                setLoading(false);
                onLoad?.();
              }
            } else {
              console.log('No fileId match found in src:', src);
              setImageSrc(src);
              setLoading(false);
              onLoad?.();
            }
          } else {
            // 直接使用提供的URL
            console.log('Using direct URL (not API path):', src);
            setImageSrc(src);
            setLoading(false);
            onLoad?.();
          }
        } else {
          // 使用认证加载
          const token = localStorage.getItem("token");
          const response = await fetch(src, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);

          setImageSrc(imageUrl);
          setLoading(false);
          onLoad?.();
        }
      } catch (err) {
        console.error("Failed to load authenticated image:", err);
        setError(true);
        setLoading(false);
        onError?.();
      }
    };

    // 只有在应该加载时才加载图片
    if (src && shouldLoad) {
      loadImage();
    }

    // 清理函数
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        // 只有blob URL才需要清理
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, shouldLoad, useDirectUrl]);

  // 如果还没有开始加载，显示占位符
  if (!shouldLoad) {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={className}
        style={style}
      >
        {placeholder || (
          <div className="w-full h-full bg-default-100 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-default-200 rounded"></div>
          </div>
        )}
      </div>
    );
  }

  // 如果正在加载或出错，显示相应状态
  if (loading || error || !imageSrc) {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={className}
        style={style}
      >
        {loading && (
          <div className="w-full h-full bg-default-100 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-default-200 rounded animate-spin"></div>
          </div>
        )}
        {error && (
          <div className="w-full h-full bg-danger-50 flex items-center justify-center">
            <div className="text-danger-500 text-sm">加载失败</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      role={onClick ? "button" : undefined}
      style={style}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as any);
              }
            }
          : undefined
      }
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <img
        alt={alt}
        draggable={draggable}
        src={imageSrc}
        style={{ width: "100%", height: "100%" }}
        onError={() => {
          setError(true);
          onError?.();
        }}
      />
    </div>
  );
}
