'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { MessageComponent, type Message } from './message'
import { Button } from './button'
import { ArrowLeft, FileText } from 'lucide-react'

interface ChatContainerProps {
  uploadedFile: File | null
}

export function ChatContainer({ uploadedFile }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [debateStarted, setDebateStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startDebateAnalysis = useCallback(async () => {
    if (!uploadedFile) return
    
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      
      console.log('Starting streaming debate analysis...')
      
      const response = await fetch('http://localhost:5000/api/debate', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let buffer = ''
      let messageCount = 0
      
      console.log('Starting to read stream...')
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('Stream ended. Total messages received:', messageCount)
          break
        }
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        // Process complete lines (each message ends with \n)
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const messageData = JSON.parse(line)
              messageCount++
              
              console.log(`Received message ${messageCount}:`, {
                role: messageData.role,
                contentLength: messageData.content?.length || 0,
                pointNumber: messageData.point_number,
                isConclusion: messageData.is_conclusion
              })
              
              const newMessage: Message = {
                id: (Date.now() + Math.random()).toString(),
                content: messageData.content,
                role: messageData.role as 'pro' | 'con' | 'system',
                timestamp: new Date(),
              }
              
              // Add message immediately as it comes from the stream
              setMessages(prev => {
                console.log(`Adding message to UI. Total messages now: ${prev.length + 1}`)
                return [...prev, newMessage]
              })
              
            } catch (parseError) {
              console.error('Error parsing JSON line:', parseError, 'Line:', line)
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error starting debate:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Failed to start debate analysis. Please ensure the Flask server is running on localhost:5000. Error: ${error}`,
        role: 'system',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }, [uploadedFile])

  useEffect(() => {
    if (uploadedFile && !debateStarted) {
      setDebateStarted(true)
      
      // Clear any existing messages and start debate analysis
      setMessages([])
      startDebateAnalysis()
    }
  }, [uploadedFile, debateStarted, startDebateAnalysis])

  const resetDebate = () => {
    setMessages([])
    setDebateStarted(false)
  }

  return (
    <div className="max-w-4xl mx-auto h-[90vh] flex flex-col border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDebate}
            >
              <ArrowLeft className="w-4 h-4" />
              Reset
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-48">{uploadedFile?.name}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            AI Research Debate
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageComponent key={message.id} message={message} index={index} />
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Automated AI debate in progress</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatContainer