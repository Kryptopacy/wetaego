'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Terminal, Cpu, FileJson, X, ExternalLink, ShieldCheck } from 'lucide-react'

interface McpConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export function McpConfigModal({ isOpen, onClose }: McpConfigModalProps) {
  const [activeClient, setActiveClient] = useState<'claude' | 'cursor' | 'openai' | 'curl'>('claude')
  const [copied, setCopied] = useState(false)

  const serverUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'https://ourmenuos.online/api/mcp'

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        wetaego: {
          url: serverUrl,
          headers: {
            Authorization: 'Bearer <YOUR_MERCHANT_API_KEY>'
          }
        }
      }
    },
    null,
    2
  )

  const cursorConfig = JSON.stringify(
    {
      name: 'wetaego-commerce-mcp',
      type: 'sse-or-http',
      url: serverUrl,
      headers: {
        Authorization: 'Bearer <YOUR_MERCHANT_API_KEY>'
      }
    },
    null,
    2
  )

  const curlSnippet = `curl -X POST ${serverUrl} \\
  -H "Authorization: Bearer key_sec_live_demo" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "get_daily_sales", "arguments": { "date": "${new Date().toISOString().split('T')[0]}" }}'`

  const openaiActionSchema = JSON.stringify(
    {
      openapi: '3.1.0',
      info: {
        title: 'WETAEGO Staff & Operations MCP',
        version: '1.0.0'
      },
      servers: [{ url: typeof window !== 'undefined' ? window.location.origin : 'https://ourmenuos.online' }],
      paths: {
        '/api/mcp': {
          post: {
            summary: 'Execute Staff MCP Tool',
            operationId: 'executeMcpTool',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: { type: 'string', enum: ['get_active_orders', 'update_order_status', 'mark_item_unavailable', 'get_daily_sales'] },
                      arguments: { type: 'object' }
                    }
                  }
                }
              }
            },
            responses: {
              '200': { description: 'Tool execution result' }
            }
          }
        }
      }
    },
    null,
    2
  )

  const getActiveCode = () => {
    switch (activeClient) {
      case 'claude':
        return claudeConfig
      case 'cursor':
        return cursorConfig
      case 'openai':
        return openaiActionSchema
      case 'curl':
        return curlSnippet
      default:
        return ''
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-100">1-Click MCP Client Configurations</h3>
                  <p className="text-xs text-zinc-400">Instantly connect external agents to WETAEGO Staff MCP</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Client Tabs */}
            <div className="flex border-b border-zinc-800/80 bg-zinc-950 px-6 pt-3 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveClient('claude')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                  activeClient === 'claude'
                    ? 'border-emerald-400 text-emerald-400 bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                Claude Desktop
              </button>
              <button
                onClick={() => setActiveClient('cursor')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                  activeClient === 'cursor'
                    ? 'border-emerald-400 text-emerald-400 bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                Cursor / Windsurf
              </button>
              <button
                onClick={() => setActiveClient('openai')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                  activeClient === 'openai'
                    ? 'border-emerald-400 text-emerald-400 bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileJson className="h-3.5 w-3.5" />
                OpenAI Actions
              </button>
              <button
                onClick={() => setActiveClient('curl')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                  activeClient === 'curl'
                    ? 'border-emerald-400 text-emerald-400 bg-zinc-900/60'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                cURL / Python
              </button>
            </div>

            {/* Code Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {activeClient === 'claude' && 'Add to ~/Library/Application Support/Claude/claude_desktop_config.json'}
                  {activeClient === 'cursor' && 'Add to .cursor/mcp.json in your workspace root'}
                  {activeClient === 'openai' && 'Import as OpenAPI schema in Custom GPT Actions'}
                  {activeClient === 'curl' && 'Execute in any terminal with valid Merchant Bearer key'}
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Snippet
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-64 shadow-inner">
                <pre>{getActiveCode()}</pre>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500 border-t border-zinc-800/60">
                <span>Discovery Manifest: <code className="text-zinc-400">/.well-known/mcp.json</code></span>
                <a
                  href="https://modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  MCP Standard Docs
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
