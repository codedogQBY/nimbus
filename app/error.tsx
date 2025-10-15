"use client";

import { useEffect } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-green-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardBody className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-100 rounded-full mb-4">
            <AlertCircleIcon className="w-8 h-8 text-danger-500" />
          </div>

          <h2 className="text-2xl font-bold text-dark-olive-800 mb-2">
            出错了
          </h2>

          <p className="text-default-600 mb-6">
            {error.message || "发生了一些错误，请稍后重试"}
          </p>

          {error.digest && (
            <p className="text-xs text-default-400 mb-6">
              错误ID: {error.digest}
            </p>
          )}

          <Button
            className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
            startContent={<RefreshCwIcon className="w-4 h-4" />}
            onClick={reset}
          >
            重试
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
