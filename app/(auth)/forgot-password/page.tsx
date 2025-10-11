'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Input, Button, Link } from '@heroui/react';
import { KeyRoundIcon } from 'lucide-react';
import ky from 'ky';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await ky.post('/api/auth/forgot-password', {
        json: { email },
      }).json<any>();

      if (response.success) {
        setSuccess(true);
        // 3秒后跳转到重置密码页面
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 3000);
      }
    } catch (err: any) {
      const errorData = await err.response?.json();
      setError(errorData?.error || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-col gap-1 p-6 pb-0">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <KeyRoundIcon className="w-8 h-8 text-amber-brown-500" />
          </div>
          <h1 className="text-2xl font-bold text-dark-olive-800">忘记密码</h1>
          <p className="text-sm text-dark-olive-600 mt-2">
            输入您的邮箱地址，我们将发送验证码
          </p>
        </div>
      </CardHeader>

      <CardBody className="p-6 pt-4">
        {success ? (
          <div className="text-center space-y-4">
            <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
              <p className="font-medium">验证码已发送！</p>
              <p className="text-sm mt-1">请检查您的邮箱，正在跳转...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="邮箱地址"
              placeholder="your@email.com"
              type="email"
              value={email}
              onValueChange={setEmail}
              variant="bordered"
              isRequired
              autoComplete="email"
              autoFocus
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={loading}
              className="w-full bg-amber-brown-500 hover:bg-amber-brown-600 text-white font-medium"
            >
              发送验证码
            </Button>

            <div className="text-center text-sm text-dark-olive-600">
              <Link href="/login" className="text-amber-brown-500">
                返回登录
              </Link>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

