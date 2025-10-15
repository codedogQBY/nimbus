"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem("token");

    if (token) {
      // 已登录，跳转到文件管理页面
      router.push("/files");
    } else {
      // 未登录，跳转到登录页面
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-green-50">
      <Spinner color="primary" size="lg" />
    </div>
  );
}
