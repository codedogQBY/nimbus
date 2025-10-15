export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: {
    name: 'Nimbus 网盘',
    email: process.env.SMTP_FROM || 'noreply@nimbus.com',
  },
  templates: {
    verification: {
      subject: '验证您的邮箱 - Nimbus',
      expiresIn: 5 * 60 * 1000, // 5分钟
    },
    resetPassword: {
      subject: '重置密码 - Nimbus',
      expiresIn: 10 * 60 * 1000, // 10分钟
    },
  },
  rateLimits: {
    resendCooldown: 60 * 1000, // 60秒
    maxAttemptsPerHour: 10, // 每小时最多10次
  },
};

