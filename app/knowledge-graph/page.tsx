'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { KnowledgeGraphVisualization } from '@/components/ui/knowledge-graph'
import { FileUpload } from '@/components/ui/file-upload'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Zap, FileText, ArrowLeft } from 'lucide-react'
import { createBackendUrl } from '@/lib/api-config'

interface GraphNode {
  id: string
  label: string
  group: string
  title?: string
  color?: string
}

interface GraphEdge {
  from: string
  to: string
  label?: string
  title?: string
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export default function KnowledgeGraphPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processingFile, setProcessingFile] = useState(false)
  const [showUpload, setShowUpload] = useState(true)

  const fetchGraphData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(createBackendUrl('/api/knowledge-graph/status'))
      if (!response.ok) {
        throw new Error('Failed to fetch graph data')
      }
      const data = await response.json()
      setGraphData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      setProcessingFile(true)
      setError(null)
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch(createBackendUrl('/api/knowledge-graph'), {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to process PDF')
        }
        
        const result = await response.json()
        
        if (result.success && result.graphData) {
          setGraphData(result.graphData)
          setShowUpload(false)
        } else {
          throw new Error(result.error || 'Failed to generate graph data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file')
      } finally {
        setProcessingFile(false)
      }
    }
  }

  const resetToUpload = () => {
    setShowUpload(true)
    setUploadedFile(null)
    setGraphData(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {showUpload ? (
          /* File Upload Interface */
          <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <Database className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight">
                  Knowledge Graph Generator
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload a PDF document to automatically extract entities and relationships, 
                then visualize them as an interactive knowledge graph.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <FileUpload onChange={handleFileUpload} />
            </motion.div>

            {processingFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">
                  Processing PDF and extracting knowledge graph...
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center"
            >
              <Button
                variant="outline"
                onClick={fetchGraphData}
                className="space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>Or Load Demo Graph</span>
              </Button>
            </motion.div>
          </div>
        ) : (
          /* Knowledge Graph Interface */
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-4 mb-8"
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight">
                  Knowledge Graph
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {uploadedFile ? `Generated from: ${uploadedFile.name}` : 'Interactive knowledge graph visualization'}
              </p>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex justify-center space-x-4 mb-8"
            >
              <Button
                onClick={resetToUpload}
                variant="outline"
                className="space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Upload New File</span>
              </Button>
              
              <Button
                onClick={fetchGraphData}
                disabled={isLoading}
                className="space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Graph</span>
              </Button>
              
              <Button variant="outline" className="space-x-2">
                <Zap className="h-4 w-4" />
                <span>Quick Query</span>
              </Button>
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center"
              >
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchGraphData}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </motion.div>
            )}

            {/* Graph Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full h-[700px] border border-border rounded-lg overflow-hidden bg-card"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading knowledge graph...</p>
                  </div>
                </div>
              ) : graphData ? (
                <KnowledgeGraphVisualization data={graphData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No graph data available</p>
                    <Button onClick={fetchGraphData} variant="outline">
                      Load Graph
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Graph Stats */}
            {graphData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-primary">
                    {graphData.nodes?.length || 0}
                  </h3>
                  <p className="text-muted-foreground">Nodes</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-primary">
                    {graphData.edges?.length || 0}
                  </h3>
                  <p className="text-muted-foreground">Relationships</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-primary">
                    {new Set(graphData.nodes?.map((node: GraphNode) => node.group)).size || 0}
                  </h3>
                  <p className="text-muted-foreground">Node Types</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}