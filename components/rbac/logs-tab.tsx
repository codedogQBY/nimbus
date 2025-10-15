"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Chip,
  Input,
  Spinner,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import {
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ShieldIcon,
} from "lucide-react";
import ky from "ky";

interface PermissionLog {
  id: number;
  userId: number;
  permission: string;
  resource: string | null;
  action: string;
  granted: boolean;
  reason: string | null;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
}

export function LogsTab() {
  const [logs, setLogs] = useState<PermissionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "granted" | "denied">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = await ky
        .get("/api/rbac/logs", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<{ logs: PermissionLog[] }>();

      setLogs(data.logs);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.permission.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "granted" && log.granted) ||
      (filter === "denied" && !log.granted);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage,
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 顶部过滤栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            classNames={{
              input: "text-sm",
              inputWrapper: "h-10",
            }}
            placeholder="搜索用户或权限..."
            startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>
        <Select
          className="w-full sm:w-40"
          placeholder="过滤"
          selectedKeys={[filter]}
          size="sm"
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <SelectItem key="all">全部</SelectItem>
          <SelectItem key="granted">已授权</SelectItem>
          <SelectItem key="denied">已拒绝</SelectItem>
        </Select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100">
          <CardBody className="p-3 lg:p-4">
            <p className="text-xs text-default-600 mb-1">总操作数</p>
            <p className="text-lg lg:text-2xl font-bold text-dark-olive-800">
              {logs.length}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-success-50 to-success-100">
          <CardBody className="p-3 lg:p-4">
            <p className="text-xs text-default-600 mb-1">已授权</p>
            <p className="text-lg lg:text-2xl font-bold text-success-600">
              {logs.filter((l) => l.granted).length}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-danger-50 to-danger-100">
          <CardBody className="p-3 lg:p-4">
            <p className="text-xs text-default-600 mb-1">已拒绝</p>
            <p className="text-lg lg:text-2xl font-bold text-danger-600">
              {logs.filter((l) => !l.granted).length}
            </p>
          </CardBody>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner color="primary" size="lg" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedLogs.map((log) => (
              <Card key={log.id} className="bg-white">
                <CardBody className="p-3 lg:p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        log.granted ? "bg-success-100" : "bg-danger-100"
                      }`}
                    >
                      {log.granted ? (
                        <CheckCircleIcon className="w-5 h-5 text-success-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-danger-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
                          <span className="font-medium text-dark-olive-800 truncate">
                            {log.user.username}
                          </span>
                        </div>
                        <span className="hidden lg:inline text-default-400">
                          •
                        </span>
                        <div className="flex items-center gap-2">
                          <ShieldIcon className="w-4 h-4 text-default-400 flex-shrink-0" />
                          <code className="text-sm font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded truncate">
                            {log.permission}
                          </code>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
                        <Chip
                          color={log.granted ? "success" : "danger"}
                          size="sm"
                          variant="flat"
                        >
                          {log.granted ? "已授权" : "已拒绝"}
                        </Chip>
                        <Chip color="secondary" size="sm" variant="flat">
                          {log.action}
                        </Chip>
                        {log.resource && (
                          <Chip size="sm" variant="flat">
                            {log.resource}
                          </Chip>
                        )}
                      </div>

                      {log.reason && (
                        <p className="text-sm text-default-500 mt-2">
                          原因：{log.reason}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs text-default-400">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <ShieldIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                没有权限日志
              </h3>
              <p className="text-sm text-default-500">
                {searchQuery ? "请尝试其他搜索关键词" : "暂无权限操作记录"}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                showControls
                color="primary"
                page={currentPage}
                total={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
