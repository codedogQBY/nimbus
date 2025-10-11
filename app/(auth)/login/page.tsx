'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Input, Button, Link, Divider } from '@heroui/react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import ky from 'ky';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await ky.post('/api/auth/login', {
        json: { identifier, password },
      }).json<any>();

      if (response.success) {
        // 保存 token 到 localStorage
        localStorage.setItem('token', response.token);
        
        // 跳转到文件管理页面
        router.push('/files');
      } else if (response.requireEmailVerification) {
        // 需要验证邮箱，跳转到验证页面
        router.push(`/verify-email?email=${encodeURIComponent(response.email)}`);
      }
    } catch (err: any) {
      const errorData = await err.response?.json();
      setError(errorData?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-col gap-1 p-6 pb-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark-olive-800">Nimbus</h1>
          <p className="text-sm text-dark-olive-600 mt-2">个人多源聚合网盘</p>
        </div>
      </CardHeader>

      <CardBody className="p-6 pt-4">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="用户名或邮箱"
            placeholder="请输入用户名或邮箱"
            value={identifier}
            onValueChange={setIdentifier}
            variant="bordered"
            isRequired
            autoComplete="username"
          />

          <Input
            label="密码"
            placeholder="请输入密码"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onValueChange={setPassword}
            variant="bordered"
            isRequired
            autoComplete="current-password"
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

          <div className="flex justify-end">
            <Link href="/forgot-password" size="sm" className="text-amber-brown-500">
              忘记密码？
            </Link>
          </div>

          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={loading}
            className="w-full bg-amber-brown-500 hover:bg-amber-brown-600 text-white font-medium"
          >
            登录
          </Button>

          <Divider className="my-2" />

          <div className="text-center text-sm text-dark-olive-600">
            还没有账号？{' '}
            <Link href="/register" className="text-amber-brown-500 font-medium">
              立即注册
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

