'use client';

import { useState, useEffect } from 'react';

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
  draggable = false
}: ShareAuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // 使用分享token访问图片
        const imageUrl = `${src}${src.includes('?') ? '&' : '?'}share=${shareToken}`;
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
        console.error('Failed to load share authenticated image:', err);
        setError(true);
        setLoading(false);
        onError?.();
      }
    };

    if (src && shareToken) {
      loadImage();
    }

    // 清理函数
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, shareToken]);

  // 如果正在加载或出错，不渲染图片
  if (loading || error || !imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        setError(true);
        onError?.();
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      draggable={draggable}
    />
  );
}