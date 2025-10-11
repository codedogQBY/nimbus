'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Input, Button, Link, Divider } from '@heroui/react';
import { EyeIcon, EyeOffIcon, CheckCircle2Icon } from 'lucide-react';
import ky from 'ky';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 密码强度检查
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password && password === confirmPassword,
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 前端验证
    if (!allChecksPassed) {
      setError('请满足所有密码要求');
      return;
    }

    setLoading(true);

    try {
      const response = await ky.post('/api/auth/register', {
        json: { username, email, password },
      }).json<any>();

      if (response.success) {
        // 注册成功，跳转到邮箱验证页面
        router.push(`/verify-email?email=${encodeURIComponent(response.email)}`);
      }
    } catch (err: any) {
      const errorData = await err.response?.json();
      setError(errorData?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-col gap-1 p-6 pb-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark-olive-800">创建账号</h1>
          <p className="text-sm text-dark-olive-600 mt-2">加入 Nimbus，开始您的云存储之旅</p>
        </div>
      </CardHeader>

      <CardBody className="p-6 pt-4">
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="用户名"
            placeholder="3-20个字符，仅限字母数字下划线"
            value={username}
            onValueChange={setUsername}
            variant="bordered"
            isRequired
            autoComplete="username"
            description="用于登录和显示"
          />

          <Input
            label="邮箱"
            placeholder="your@email.com"
            type="email"
            value={email}
            onValueChange={setEmail}
            variant="bordered"
            isRequired
            autoComplete="email"
            description="用于接收验证码和找回密码"
          />

          <Input
            label="密码"
            placeholder="至少8个字符"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onValueChange={setPassword}
            variant="bordered"
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
          />

          <Input
            label="确认密码"
            placeholder="再次输入密码"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            variant="bordered"
            isRequired
            autoComplete="new-password"
          />

          {/* 密码强度指示器 */}
          {password && (
            <div className="bg-secondary-100 p-3 rounded-lg space-y-2">
              <p className="text-xs font-medium text-dark-olive-700">密码要求：</p>
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
            type="submit"
            color="primary"
            size="lg"
            isLoading={loading}
            isDisabled={!allChecksPassed}
            className="w-full bg-amber-brown-500 hover:bg-amber-brown-600 text-white font-medium"
          >
            注册
          </Button>

          <Divider className="my-2" />

          <div className="text-center text-sm text-dark-olive-600">
            已有账号？{' '}
            <Link href="/login" className="text-amber-brown-500 font-medium">
              立即登录
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

// 密码检查项组件
function PasswordCheck({ checked, text }: { checked: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2Icon
        className={`w-3.5 h-3.5 ${
          checked ? 'text-success' : 'text-default-300'
        }`}
      />
      <span className={checked ? 'text-success' : 'text-default-500'}>
        {text}
      </span>
    </div>
  );
}

