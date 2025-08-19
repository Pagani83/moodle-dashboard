import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    env_status: {
      YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? 'CONFIGURED' : 'MISSING',
      YOUTUBE_CHANNEL_HANDLE: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE ? 'CONFIGURED' : 'MISSING',
      MOODLE_BASE_URL: process.env.NEXT_PUBLIC_MOODLE_BASE_URL ? 'CONFIGURED' : 'MISSING',
      MOODLE_TOKEN: process.env.NEXT_PUBLIC_MOODLE_TOKEN ? 'CONFIGURED' : 'MISSING',
    },
    actual_values: {
      YOUTUBE_CHANNEL_HANDLE: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE,
      MOODLE_BASE_URL: process.env.NEXT_PUBLIC_MOODLE_BASE_URL,
      // API keys hidden for security
    },
    recommendation: {
      message: 'Configure these environment variables in Vercel for production',
      vercel_variables: [
        'NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key',
        'NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE=@cjudtjrs',
        'NEXT_PUBLIC_MOODLE_BASE_URL=https://cjud.tjrs.jus.br/webservice/rest',
        'NEXT_PUBLIC_MOODLE_TOKEN=your_moodle_token'
      ]
    }
  });
}
