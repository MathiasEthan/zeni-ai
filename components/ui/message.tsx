'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from './avatar'

export interface Message {
  id: string
  content: string
  role: 'pro' | 'con' | 'system'
  timestamp: Date
  isTyping?: boolean
}

interface MessageComponentProps {
  message: Message
  index: number
}

export function MessageComponent({ message, index }: MessageComponentProps) {
  const isPro = message.role === 'pro'
  const isCon = message.role === 'con'
  const isSystem = message.role === 'system'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        'flex gap-3 p-4 rounded-lg max-w-4xl border',
        isPro && 'border-green-200 dark:border-green-800',
        isCon && 'border-red-200 dark:border-red-800',
        isSystem && 'border-border'
      )}
    >
      <Avatar className="w-8 h-8 mt-1">
        <AvatarFallback 
          className={cn(
            'text-xs font-semibold',
            isPro && 'text-green-700',
            isCon && 'text-red-700',
            isSystem && 'text-muted-foreground'
          )}
        >
          {isPro ? 'PRO' : isCon ? 'CON' : 'SYS'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            isPro && 'text-green-700',
            isCon && 'text-red-700',
            isSystem && 'text-foreground'
          )}>
            {isPro ? 'AI Pro' : isCon ? 'AI Con' : 'System'}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        
        <div className="text-sm text-foreground leading-relaxed">
          {message.isTyping ? (
            <TypingIndicator />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {message.content}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">Thinking</span>
      <motion.div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-muted-foreground rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}