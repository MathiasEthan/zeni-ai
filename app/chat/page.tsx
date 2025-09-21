'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ChatContainer } from '@/components/ui/chat-container'
import { FileUpload } from '@/components/ui/file-upload'

export default function ChatPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showChat, setShowChat] = useState(false)

  // Check for extracted PDF data on component mount
  useEffect(() => {
    const extractedData = sessionStorage.getItem('extractedPDFData');
    if (extractedData) {
      try {
        const data = JSON.parse(extractedData);
        // Create a File object from the extracted text data
        const blob = new Blob([data.text], { type: 'text/plain' });
        const file = new File([blob], data.filename || 'extracted_text.txt', { 
          type: 'text/plain' 
        });
        
        setUploadedFile(file);
        setShowChat(true);
        
        // Clear the data from sessionStorage after using it
        sessionStorage.removeItem('extractedPDFData');
        
        console.log(`PDF text extraction complete. Starting AI debate for: ${data.filename}`);
      } catch (error) {
        console.error('Error parsing extracted PDF data:', error);
      }
    }
  }, []);

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0])
      setShowChat(true)
    }
  }

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {!showChat ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <h1 className="text-4xl font-bold tracking-tight">
                AI Research Debate
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Upload a document and watch two AIs debate whether it qualifies as a research paper.
                One AI will argue for, while the other argues against.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <FileUpload onChange={handleFileUpload} />
            </motion.div>
          </div>
        ) : (
          <ChatContainer uploadedFile={uploadedFile} />
        )}
      </motion.div>
    </div>
  )
}