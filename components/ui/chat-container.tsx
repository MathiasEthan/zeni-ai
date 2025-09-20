'use client'

import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (uploadedFile && !debateStarted) {
      const mockMessages = [
        {
          content: "I believe this document demonstrates clear research qualities. It follows a structured methodology and presents systematic findings that contribute to the field.",
          role: 'pro' as const,
        },
        {
          content: "While the document has some academic elements, it lacks the depth and rigor expected of true research. The methodology appears superficial and doesn't meet peer-review standards.",
          role: 'con' as const,
        },
        {
          content: "The document shows rigorous analysis with proper citations and references to existing literature, which is fundamental to academic research.",
          role: 'pro' as const,
        },
        {
          content: "The literature review is insufficient and fails to comprehensively address existing work in this domain. This undermines the foundation of the research.",
          role: 'con' as const,
        },
        {
          content: "Based on my analysis, this document demonstrates strong research characteristics. It follows established academic conventions with clear methodology, comprehensive results, and proper citation practices that align with peer-reviewed standards.",
          role: 'pro' as const,
        },
        {
          content: "While the document has academic structure, critical examination reveals significant methodological limitations. The sample size appears insufficient, and the statistical analysis lacks the depth required for robust scientific conclusions.",
          role: 'con' as const,
        }
      ]
      
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `Analysis complete for "${uploadedFile?.name}". Final assessment: The document demonstrates research potential but requires significant methodological improvements to meet full research paper standards. Score: 75/100`,
        role: 'system',
        timestamp: new Date(),
      }

      setMessages([systemMessage])
      setDebateStarted(true)
      
      // Start adding messages progressively
      const addMessage = (index: number) => {
        if (index < mockMessages.length) {
          setTimeout(() => {
            const newMessage: Message = {
              id: (Date.now() + index).toString(),
              content: mockMessages[index].content,
              role: mockMessages[index].role,
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, newMessage])
            addMessage(index + 1)
          }, 2000 + Math.random() * 2000)
        }
      }
      
      setTimeout(() => addMessage(0), 1500)
    }
  }, [uploadedFile, debateStarted])

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