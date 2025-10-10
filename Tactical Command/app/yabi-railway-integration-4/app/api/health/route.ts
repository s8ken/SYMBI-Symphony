import { NextResponse } from 'next/server';

export async function GET() {
  // Health check logic
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json(health);
}
