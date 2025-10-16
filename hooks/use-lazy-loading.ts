"use client";

import { useEffect, useRef, useState } from "react";

interface UseLazyLoadingOptions {
  /**
   * 根边距，用于提前触发加载
   * 例如 "100px" 表示在元素进入视口前100px就开始加载
   */
  rootMargin?: string;
  /**
   * 交叉比例阈值，0.1表示元素10%可见时触发
   */
  threshold?: number;
  /**
   * 是否启用懒加载，默认为true
   */
  enabled?: boolean;
}

interface UseLazyLoadingReturn {
  /**
   * 需要绑定到目标元素的ref
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * 是否应该加载内容
   */
  shouldLoad: boolean;
  /**
   * 是否正在观察中
   */
  isObserving: boolean;
}

/**
 * 懒加载Hook，使用Intersection Observer API实现
 * 
 * @param options 配置选项
 * @returns 懒加载状态和ref
 */
export function useLazyLoading(options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn {
  const {
    rootMargin = "50px",
    threshold = 0.1,
    enabled = true,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(!enabled);
  const [isObserving, setIsObserving] = useState(false);

  useEffect(() => {
    // 如果禁用懒加载，直接加载
    if (!enabled) {
      setShouldLoad(true);
      return;
    }

    // 检查浏览器是否支持Intersection Observer
    if (!window.IntersectionObserver) {
      setShouldLoad(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          setIsObserving(false);
          // 一旦触发加载，就停止观察
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    setIsObserving(true);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      setIsObserving(false);
    };
  }, [enabled, rootMargin, threshold]);

  return {
    ref,
    shouldLoad,
    isObserving,
  };
}

/**
 * 简化版的懒加载Hook，只返回是否应该加载
 * 
 * @param options 配置选项
 * @returns 是否应该加载
 */
export function useLazyLoadingSimple(options: UseLazyLoadingOptions = {}): boolean {
  const { shouldLoad } = useLazyLoading(options);
  return shouldLoad;
}