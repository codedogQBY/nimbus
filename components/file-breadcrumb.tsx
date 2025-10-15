"use client";

import { Button } from "@heroui/react";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

interface BreadcrumbItem {
  id: number | null;
  name: string;
  path: string;
}

interface FileBreadcrumbProps {
  currentFolder: {
    id: number;
    name: string;
    path: string;
  } | null;
  onNavigate: (folderId: number | null) => void;
}

export function FileBreadcrumb({
  currentFolder,
  onNavigate,
}: FileBreadcrumbProps) {
  // 构建面包屑路径
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { id: null, name: "根目录", path: "/" },
    ];

    if (currentFolder && currentFolder.path) {
      // 解析路径构建面包屑
      const pathParts = currentFolder.path
        .split("/")
        .filter((part) => part.length > 0);

      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        // 对于最后一个部分，使用当前文件夹的ID，其他部分暂时设为null
        // 在实际应用中，可能需要从API获取完整的路径信息
        const id = isLast ? currentFolder.id : null;
        const path = "/" + pathParts.slice(0, index + 1).join("/");

        breadcrumbs.push({
          id,
          name: part,
          path,
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      {breadcrumbs.map((item, index) => (
        <div key={`${item.id}-${index}`} className="flex items-center gap-1">
          {index === 0 ? (
            <Button
              className="text-default-600 hover:text-primary min-w-0 px-2"
              size="sm"
              startContent={<HomeIcon className="w-4 h-4" />}
              variant="light"
              onClick={() => onNavigate(item.id)}
            >
              <span className="hidden sm:inline">{item.name}</span>
            </Button>
          ) : (
            <>
              <ChevronRightIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
              <Button
                className="text-default-600 hover:text-primary min-w-0 px-2 truncate"
                size="sm"
                title={item.name}
                variant="light"
                onClick={() => onNavigate(item.id)}
              >
                {item.name}
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
