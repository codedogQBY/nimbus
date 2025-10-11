import nodemailer from 'nodemailer';
import { emailConfig } from '@/config/email';
import prisma from './prisma';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig.smtp);
  }

  /**
   * 生成6位随机验证码
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(
    email: string,
    type: 'register' | 'reset_password' | 'change_email',
    userId?: number
  ): Promise<{ code: string; expiresAt: Date }> {
    // 检查发送频率限制
    await this.checkRateLimit(email);

    // 生成验证码
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + emailConfig.templates.verification.expiresIn);

    // 保存验证码到数据库
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        type,
        userId,
        expiresAt,
      },
    });

    // 准备邮件内容
    const emailContent = this.buildEmailContent(type, code, expiresAt);

    try {
      // 发送邮件
      await this.transporter.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      // 记录发送日志
      await this.logEmail(email, emailContent.subject, type, 'sent');

      return { code, expiresAt };
    } catch (error) {
      // 记录失败日志
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logEmail(email, emailContent.subject, type, 'failed', errorMessage);
      throw new Error('邮件发送失败，请稍后重试');
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyCode(email: string, code: string, type: string): Promise<boolean> {
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        type,
        isVerified: false,
        expiresAt: {
          gt: new Date(),
        },
        attempts: {
          lt: prisma.emailVerification.fields.maxAttempts,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      // 记录失败尝试
      await prisma.emailVerification.updateMany({
        where: {
          email,
          type,
          isVerified: false,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return false;
    }

    // 标记为已验证
    await prisma.emailVerification.update({
      where: {
        id: verification.id,
      },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * 检查发送频率限制
   */
  private async checkRateLimit(email: string): Promise<void> {
    // 检查是否在冷却期内
    const lastSent = await prisma.emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastSent) {
      const cooldownEnd = lastSent.createdAt.getTime() + emailConfig.rateLimits.resendCooldown;
      if (Date.now() < cooldownEnd) {
        const waitSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000);
        throw new Error(`请等待 ${waitSeconds} 秒后再重新发送`);
      }
    }

    // 检查每小时发送次数
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.emailVerification.count({
      where: {
        email,
        createdAt: {
          gt: hourAgo,
        },
      },
    });

    if (recentCount >= emailConfig.rateLimits.maxAttemptsPerHour) {
      throw new Error('发送次数过多，请一小时后再试');
    }
  }

  /**
   * 构建邮件内容
   */
  private buildEmailContent(
    type: string,
    code: string,
    expiresAt: Date
  ): { subject: string; html: string; text: string } {
    const expiresInMinutes = Math.floor(
      (expiresAt.getTime() - Date.now()) / (60 * 1000)
    );

    const templates = {
      register: {
        subject: '验证您的邮箱 - Nimbus 网盘',
        title: '欢迎注册 Nimbus！',
        message: '感谢您注册 Nimbus 网盘。请使用以下验证码完成邮箱验证：',
      },
      reset_password: {
        subject: '重置密码 - Nimbus 网盘',
        title: '重置您的密码',
        message: '您请求重置密码。请使用以下验证码完成密码重置：',
      },
      change_email: {
        subject: '验证新邮箱 - Nimbus 网盘',
        title: '验证您的新邮箱',
        message: '您正在更改邮箱地址。请使用以下验证码验证新邮箱：',
      },
    };

    const template = templates[type as keyof typeof templates];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
          .content { padding: 30px 0; }
          .code-box { background: #f5f5f5; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; font-family: 'Courier New', monospace; }
          .footer { border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${template.title}</h1>
          </div>
          <div class="content">
            <p>${template.message}</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p>验证码有效期为 <strong>${expiresInMinutes} 分钟</strong>，请尽快完成验证。</p>
            <div class="warning">
              <strong>⚠️ 安全提示：</strong> 如果这不是您的操作，请忽略此邮件。
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Nimbus 网盘. 保留所有权利.</p>
            <p>这是一封自动发送的邮件，请勿直接回复。</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${template.title}

${template.message}

验证码：${code}

验证码有效期为 ${expiresInMinutes} 分钟。

安全提示：如果这不是您的操作，请忽略此邮件。

© ${new Date().getFullYear()} Nimbus 网盘
    `;

    return {
      subject: template.subject,
      html,
      text,
    };
  }

  /**
   * 记录邮件发送日志
   */
  private async logEmail(
    email: string,
    subject: string,
    type: string,
    status: 'sent' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await prisma.emailLog.create({
      data: {
        email,
        subject,
        type,
        status,
        errorMessage,
        sentAt: status === 'sent' ? new Date() : null,
      },
    });
  }
}

export default EmailService;

