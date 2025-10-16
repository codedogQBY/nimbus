import { NextResponse } from 'next/server';
import { appConfig } from '@/config/app';

export async function GET() {
  return NextResponse.json({
    enableDirectUrl: appConfig.enableDirectUrl,
    envValue: process.env.ENABLE_DIRECT_URL,
    appUrl: appConfig.appUrl,
    isDevelopment: appConfig.isDevelopment,
    port: appConfig.port,
  });
}