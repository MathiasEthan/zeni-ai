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

async function fetchGraphDataFromBackend(): Promise<GraphData> {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/knowledge-graph/status`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const status = await response.json()
    console.log('Backend status:', status)
    
    // If backend is connected and has data, we could fetch it
    // For now, return mock data since we need a way to get existing graph data
    
    return getMockGraphData()
    
  } catch (error) {
    console.error('Backend connection error:', error)
    throw error
  }
}

// Mock data for development/demo purposes
function getMockGraphData(): GraphData {
  return {
    nodes: [
      { id: '1', label: 'Alice', group: 'Person', title: 'Person: Alice' },
      { id: '2', label: 'Bob', group: 'Person', title: 'Person: Bob' },
      { id: '3', label: 'Charlie', group: 'Person', title: 'Person: Charlie' },
      { id: '4', label: 'Acme Corp', group: 'Organization', title: 'Organization: Acme Corp' },
      { id: '5', label: 'Tech Inc', group: 'Organization', title: 'Organization: Tech Inc' },
      { id: '6', label: 'New York', group: 'Location', title: 'Location: New York' },
      { id: '7', label: 'Machine Learning', group: 'Concept', title: 'Concept: Machine Learning' },
      { id: '8', label: 'Data Science', group: 'Concept', title: 'Concept: Data Science' }
    ],
    edges: [
      { from: '1', to: '4', label: 'WORKS_FOR', title: 'Alice works for Acme Corp' },
      { from: '2', to: '5', label: 'WORKS_FOR', title: 'Bob works for Tech Inc' },
      { from: '3', to: '4', label: 'WORKS_FOR', title: 'Charlie works for Acme Corp' },
      { from: '1', to: '6', label: 'LIVES_IN', title: 'Alice lives in New York' },
      { from: '4', to: '6', label: 'LOCATED_IN', title: 'Acme Corp is located in New York' },
      { from: '1', to: '7', label: 'INTERESTED_IN', title: 'Alice is interested in Machine Learning' },
      { from: '2', to: '8', label: 'EXPERT_IN', title: 'Bob is expert in Data Science' },
      { from: '7', to: '8', label: 'RELATED_TO', title: 'Machine Learning is related to Data Science' }
    ]
  }
}

export async function GET() {
  try {
    // Check if we should use mock data or try to connect to backend
    const backendUrl = getBackendUrl()
    const useBackend = backendUrl && process.env.USE_BACKEND === 'true'
    
    let graphData: GraphData
    
    if (useBackend) {
      console.log('Fetching data from backend')
      graphData = await fetchGraphDataFromBackend()
    } else {
      console.log('Using mock graph data')
      graphData = getMockGraphData()
    }
    
    return NextResponse.json(graphData)
    
  } catch (error) {
    console.error('API error:', error)
    
    // Fallback to mock data if backend connection fails
    console.log('Falling back to mock data due to error')
    const mockData = getMockGraphData()
    
    return NextResponse.json(mockData, {
      headers: {
        'X-Fallback': 'true',
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

// Optional: Add POST method for uploading files to backend
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Forward the file to the Python backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    
    const backendUrl = getBackendUrl()
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
        graphData,
        metadata: {
          filename: result.filename,
          nodeCount: result.node_count,
          relationshipCount: result.relationship_count
        }
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to process file' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}