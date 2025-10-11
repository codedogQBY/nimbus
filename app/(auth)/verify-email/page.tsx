'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Divider, Link } from '@heroui/react';
import { MailIcon, TimerIcon } from 'lucide-react';
import ky from 'ky';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // 倒计时
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // 自动聚焦和验证
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // 只允许数字

    const newCode = [...code];
    newCode[index] = value.slice(-1); // 只取最后一位
    setCode(newCode);

    // 自动聚焦下一个输入框
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // 如果所有输入框都已填写，自动提交
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      setError('请输入完整的6位验证码');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await ky.post('/api/auth/verify-email', {
        json: { email, code: codeToVerify },
      }).json<any>();

      if (response.success) {
        // 保存 token
        localStorage.setItem('token', response.token);
        
        // 跳转到文件管理页面
        router.push('/files');
      }
    } catch (err: any) {
      const errorData = await err.response?.json();
      setError(errorData?.error || '验证失败，请重试');
      setCode(['', '', '', '', '', '']); // 清空输入
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      await ky.post('/api/auth/resend-code', {
        json: { email, type: 'register' },
      }).json();

      setCanResend(false);
      setCountdown(60);
      setError('');
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      const errorData = await err.response?.json();
      setError(errorData?.error || '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-col gap-1 p-6 pb-0">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <MailIcon className="w-8 h-8 text-amber-brown-500" />
          </div>
          <h1 className="text-2xl font-bold text-dark-olive-800">验证您的邮箱</h1>
          <p className="text-sm text-dark-olive-600 mt-2">
            我们已向 <span className="font-medium">{email}</span> 发送了验证码
          </p>
        </div>
      </CardHeader>

      <CardBody className="p-6 pt-4">
        <div className="flex flex-col gap-6">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 验证码输入框 */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-default-200 rounded-lg focus:border-amber-brown-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-default-500">
            <TimerIcon className="w-4 h-4" />
            <span>验证码有效期：5分钟</span>
          </div>

          <Button
            color="primary"
            size="lg"
            isLoading={loading}
            onClick={() => handleVerify()}
            className="w-full bg-amber-brown-500 hover:bg-amber-brown-600 text-white font-medium"
          >
            验证
          </Button>

          <Divider />

          <div className="text-center">
            {canResend ? (
              <Button
                variant="light"
                size="sm"
                onClick={handleResend}
                isLoading={loading}
                className="text-amber-brown-500"
              >
                重新发送验证码
              </Button>
            ) : (
              <p className="text-sm text-default-500">
                {countdown}秒后可重新发送
              </p>
            )}
          </div>

          <div className="text-center text-sm text-dark-olive-600">
            <Link href="/login" className="text-amber-brown-500">
              返回登录
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

