'use client'

import { useEffect, useRef } from 'react'

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

interface KnowledgeGraphVisualizationProps {
  data: GraphData
}

export function KnowledgeGraphVisualization({ data }: KnowledgeGraphVisualizationProps) {
  const networkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!networkRef.current || !data) return

    const initializeNetwork = async () => {
      // Dynamic import to avoid SSR issues
      const { Network } = await import('vis-network')
      const { DataSet } = await import('vis-data')

      // Create data sets with simplified format
      const nodes = new DataSet(data.nodes.map(node => ({
        id: node.id,
        label: node.label,
        group: node.group,
        title: node.title || node.label,
        shape: 'circle',
        size: 25,
        font: { size: 14, color: '#ffffff' },
        borderWidth: 2,
        shadow: true
      })))

      const edges = new DataSet(data.edges.map((edge, index) => ({
        id: `edge-${index}`,
        from: edge.from,
        to: edge.to,
        label: edge.label || '',
        title: edge.title || edge.label || '',
        arrows: 'to',
        width: 2
      })))

      // Network options
      const options = {
        nodes: {
          borderWidth: 2,
          shadow: true,
          font: { size: 14, color: '#ffffff' }
        },
        edges: {
          width: 2,
          shadow: true,
          smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 }
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 100 },
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 200,
            springConstant: 0.08,
            damping: 0.4,
            avoidOverlap: 1
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 300,
          zoomView: true,
          dragView: true
        },
        groups: {
          Person: { color: { background: '#FF6B6B', border: '#FF5252' } },
          Organization: { color: { background: '#4ECDC4', border: '#26A69A' } },
          Location: { color: { background: '#45B7D1', border: '#1976D2' } },
          Concept: { color: { background: '#96CEB4', border: '#66BB6A' } },
          Event: { color: { background: '#FFEAA7', border: '#FDD835' } },
          Document: { color: { background: '#DDA0DD', border: '#BA68C8' } },
          default: { color: { background: '#97C2FC', border: '#2B7CE9' } }
        },
        layout: {
          improvedLayout: true,
          clusterThreshold: 150
        }
      }

      // Create network
      const network = new Network(networkRef.current!, { nodes, edges }, options)

      // Add event listeners
      network.on('selectNode', (params: { nodes: string[] }) => {
        console.log('Node selected:', params)
      })

      network.on('selectEdge', (params: { edges: string[] }) => {
        console.log('Edge selected:', params)
      })

      network.on('hoverNode', () => {
        if (networkRef.current) {
          networkRef.current.style.cursor = 'pointer'
        }
      })

      network.on('blurNode', () => {
        if (networkRef.current) {
          networkRef.current.style.cursor = 'default'
        }
      })

      // Store network instance for cleanup
      return network
    }

    let networkInstance: import('vis-network').Network | null = null

    initializeNetwork().then(network => {
      networkInstance = network
    })

    // Cleanup function
    return () => {
      if (networkInstance) {
        networkInstance.destroy()
      }
    }
  }, [data])

  return (
    <div className="w-full h-full">
      <div
        ref={networkRef}
        className="w-full h-full bg-background"
        style={{ minHeight: '600px' }}
      />
    </div>
  )
}