"use client";

import { useState, useEffect } from "react";
import { useLazyLoading } from "@/hooks/use-lazy-loading";

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
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, shouldLoad]);

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
