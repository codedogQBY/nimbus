"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
} from "@heroui/react";
import { EyeIcon, EyeOffIcon, CheckCircle2Icon } from "lucide-react";
import ky from "ky";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 密码强度检查
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: Boolean(newPassword && newPassword === confirmPassword),
  };

  const allChecksPassed =
    Object.values(passwordChecks).every(Boolean) && code.join("").length === 6;

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);

      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);

      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allChecksPassed) {
      setError("请填写所有必填项并满足密码要求");

      return;
    }

    setLoading(true);

    try {
      const response = await ky
        .post("/api/auth/reset-password", {
          json: {
            email,
            code: code.join(""),
            newPassword,
          },
        })
        .json<any>();

      if (response.success) {
        // 保存 token（自动登录）
        localStorage.setItem("token", response.token);

        // 跳转到文件管理页面
        router.push("/files");
      }
    } catch (err: any) {
      const errorData = await err.response?.json();

      setError(errorData?.error || "重置密码失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-col gap-1 p-6 pb-0">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark-olive-800">重置密码</h1>
          <p className="text-sm text-dark-olive-600 mt-2">
            请输入验证码和新密码
          </p>
        </div>
      </CardHeader>

      <CardBody className="p-6 pt-4">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 验证码输入 */}
          <div>
            <p className="text-sm font-medium text-dark-olive-800 mb-2">
              邮箱验证码
            </p>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-default-200 rounded-lg focus:border-amber-brown-500 focus:outline-none transition-colors"
                  disabled={loading}
                  id={`code-${index}`}
                  inputMode="numeric"
                  maxLength={1}
                  type="text"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* 新密码 */}
          <Input
            isRequired
            autoComplete="new-password"
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4 text-default-400" />
                ) : (
                  <EyeIcon className="w-4 h-4 text-default-400" />
                )}
              </button>
            }
            label="新密码"
            placeholder="至少8个字符"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            variant="bordered"
            onValueChange={setNewPassword}
          />

          <Input
            isRequired
            autoComplete="new-password"
            label="确认新密码"
            placeholder="再次输入新密码"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            variant="bordered"
            onValueChange={setConfirmPassword}
          />

          {/* 密码强度指示器 */}
          {newPassword && (
            <div className="bg-secondary-100 p-3 rounded-lg space-y-2">
              <p className="text-xs font-medium text-dark-olive-700">
                密码要求：
              </p>
              <div className="space-y-1 text-xs">
                <PasswordCheck
                  checked={passwordChecks.length}
                  text="至少8个字符"
                />
                <PasswordCheck
                  checked={passwordChecks.uppercase}
                  text="包含大写字母"
                />
                <PasswordCheck
                  checked={passwordChecks.lowercase}
                  text="包含小写字母"
                />
                <PasswordCheck
                  checked={passwordChecks.number}
                  text="包含数字"
                />
                {confirmPassword && (
                  <PasswordCheck
                    checked={passwordChecks.match}
                    text="两次密码一致"
                  />
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-amber-brown-500 hover:bg-amber-brown-600 text-white font-medium"
            color="primary"
            isDisabled={!allChecksPassed}
            isLoading={loading}
            size="lg"
            type="submit"
          >
            重置密码
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function PasswordCheck({ checked, text }: { checked: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2Icon
        className={`w-3.5 h-3.5 ${checked ? "text-success" : "text-default-300"}`}
      />
      <span className={checked ? "text-success" : "text-default-500"}>
        {text}
      </span>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
