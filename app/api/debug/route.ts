import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/api-config'

export async function GET() {
  try {
    const backendUrl = getBackendUrl()
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint active',
      timestamp: new Date().toISOString(),
      backendUrl,
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Debug POST endpoint received data',
      timestamp: new Date().toISOString(),
      receivedData: body
    })
  } catch (error) {
    console.error('Debug POST endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug POST endpoint failed' },
      { status: 500 }
    )
  }
}