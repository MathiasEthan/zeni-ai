import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Forward the file to the Python backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    
    const backendUrl = getBackendUrl()
    
    try {
      console.log(`Forwarding debate-json request to: ${backendUrl}/api/debate-json`)
      
      const response = await fetch(`${backendUrl}/api/debate-json`, {
        method: 'POST',
        body: backendFormData,
        headers: {
          // Don't set Content-Type header, let fetch set it automatically for FormData
        }
      })
      
      if (!response.ok) {
        console.error(`Backend responded with status: ${response.status}`)
        throw new Error(`Backend responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return NextResponse.json(result)
      
    } catch (backendError) {
      console.error('Backend connection failed:', backendError)
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Backend service unavailable. Please ensure the backend server is running.',
          details: backendError instanceof Error ? backendError.message : 'Unknown error'
        },
        { status: 502 }
      )
    }
    
  } catch (error) {
    console.error('Error processing debate-json request:', error)
    return NextResponse.json(
      { error: 'Failed to process debate-json request' },
      { status: 500 }
    )
  }
}