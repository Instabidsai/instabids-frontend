import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test connection to backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'API URL not configured',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Try to fetch from backend health endpoint
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'success',
        message: 'Frontend and backend are connected',
        backend: data,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Backend health check failed',
          statusCode: response.status,
          timestamp: new Date().toISOString()
        },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to backend',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}