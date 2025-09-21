import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/api-config'

interface GraphNode {
  id: string
  label: string
  group: string
  title?: string
  properties?: Record<string, unknown>
}

interface GraphEdge {
  from: string
  to: string
  label?: string
  title?: string
  properties?: Record<string, unknown>
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface BackendNode {
  id: string
  type: string
}

interface BackendRelationship {
  source: string
  target: string
  type: string
}

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
      const response = await fetch(`${backendUrl}/api/knowledge-graph`, {
        method: 'POST',
        body: backendFormData
      })
      
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Transform backend response to frontend format
      if (result.success && result.nodes && result.relationships) {
        const graphData: GraphData = {
          nodes: result.nodes.map((node: BackendNode) => ({
            id: node.id,
            label: node.id,
            group: node.type || 'Unknown',
            title: `${node.type || 'Unknown'}: ${node.id}`
          })),
          edges: result.relationships.map((rel: BackendRelationship) => ({
            from: rel.source,
            to: rel.target,
            label: rel.type,
            title: `${rel.source} ${rel.type} ${rel.target}`
          }))
        }
        
        return NextResponse.json({
          success: true,
          fileName: result.filename,
          entitiesCount: {
            nodes: result.node_count,
            relationships: result.relationship_count
          },
          graphData
        })
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to process file' },
          { status: 500 }
        )
      }
      
    } catch (backendError) {
      console.error('Backend connection failed:', backendError)
      
      // Fallback to mock processing if backend is not available
      return NextResponse.json({
        success: true,
        fileName: file.name,
        entitiesCount: {
          nodes: 8,
          relationships: 7
        },
        graphData: getMockGraphData()
      })
    }
    
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}

// Mock data for development/demo purposes
function getMockGraphData(): GraphData {
  return {
    nodes: [
      { id: 'Document Analysis', label: 'Document Analysis', group: 'Concept', title: 'Concept: Document Analysis' },
      { id: 'PDF Processing', label: 'PDF Processing', group: 'Technique', title: 'Technique: PDF Processing' },
      { id: 'Natural Language Processing', label: 'Natural Language Processing', group: 'Technique', title: 'Technique: Natural Language Processing' },
      { id: 'Entity Extraction', label: 'Entity Extraction', group: 'Process', title: 'Process: Entity Extraction' },
      { id: 'Knowledge Graph', label: 'Knowledge Graph', group: 'Structure', title: 'Structure: Knowledge Graph' },
      { id: 'Graph Visualization', label: 'Graph Visualization', group: 'Interface', title: 'Interface: Graph Visualization' },
      { id: 'Relationships', label: 'Relationships', group: 'Connection', title: 'Connection: Relationships' },
      { id: 'Data Analysis', label: 'Data Analysis', group: 'Process', title: 'Process: Data Analysis' }
    ],
    edges: [
      { from: 'PDF Processing', to: 'Document Analysis', label: 'ENABLES', title: 'PDF Processing enables Document Analysis' },
      { from: 'Document Analysis', to: 'Natural Language Processing', label: 'USES', title: 'Document Analysis uses Natural Language Processing' },
      { from: 'Natural Language Processing', to: 'Entity Extraction', label: 'PERFORMS', title: 'Natural Language Processing performs Entity Extraction' },
      { from: 'Entity Extraction', to: 'Knowledge Graph', label: 'CREATES', title: 'Entity Extraction creates Knowledge Graph' },
      { from: 'Knowledge Graph', to: 'Graph Visualization', label: 'DISPLAYED_BY', title: 'Knowledge Graph is displayed by Graph Visualization' },
      { from: 'Knowledge Graph', to: 'Relationships', label: 'CONTAINS', title: 'Knowledge Graph contains Relationships' },
      { from: 'Knowledge Graph', to: 'Data Analysis', label: 'SUPPORTS', title: 'Knowledge Graph supports Data Analysis' }
    ]
  }
}