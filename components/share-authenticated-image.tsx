"use client";

import { useState, useEffect } from "react";
import { useLazyLoading } from "@/hooks/use-lazy-loading";

interface ShareAuthenticatedImageProps {
  src: string;
  alt: string;
  shareToken: string;
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
}

export function ShareAuthenticatedImage({
  src,
  alt,
  shareToken,
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
}: ShareAuthenticatedImageProps) {
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

        // 使用分享token访问图片
        const imageUrl = `${src}${src.includes("?") ? "&" : "?"}share=${shareToken}`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setImageSrc(blobUrl);
        setLoading(false);
        onLoad?.();
      } catch (err) {
        console.error("Failed to load share authenticated image:", err);
        setError(true);
        setLoading(false);
        onError?.();
      }
    };

    // 只有在应该加载时才加载图片
    if (src && shareToken && shouldLoad) {
      loadImage();
    }

    // 清理函数
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, shareToken, shouldLoad]);

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
      role="button"
      style={style}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(e as any);
        }
      }}
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
