import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }
    
    // Forward the file to the Python backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    
    const backendUrl = getBackendUrl()
    
    try {
      console.log(`Forwarding debate request to: ${backendUrl}/api/debate`)
      
      const response = await fetch(`${backendUrl}/api/debate`, {
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
      
      // Check if the response is a streaming response
      if (response.headers.get('content-type')?.includes('application/x-ndjson') || 
          response.headers.get('content-type')?.includes('text/plain')) {
        
        // Create a streaming response
        const stream = new ReadableStream({
          start(controller) {
            const reader = response.body?.getReader()
            if (!reader) {
              controller.close()
              return
            }
            
            function pump(): Promise<void> {
              return reader!.read().then(({ done, value }) => {
                if (done) {
                  controller.close()
                  return
                }
                controller.enqueue(value)
                return pump()
              }).catch(error => {
                console.error('Stream error:', error)
                controller.error(error)
              })
            }
            
            return pump()
          }
        })
        
        return new NextResponse(stream, {
          headers: {
            'Content-Type': response.headers.get('content-type') || 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })
      } else {
        // Handle regular JSON response
        const result = await response.json()
        return NextResponse.json(result)
      }
      
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
    console.error('Error processing debate request:', error)
    return NextResponse.json(
      { error: 'Failed to process debate request' },
      { status: 500 }
    )
  }
}