'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Terminal, FileJson, Copy, Check, ShieldCheck, Key, RefreshCw, ExternalLink, Zap } from 'lucide-react'

export function McpSettingsClient() {
  const [activeClient, setActiveClient] = useState<'claude' | 'cursor' | 'openai' | 'curl'>('claude')
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState('key_sec_live_928f8d7123acb89')

  const serverUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'https://ourmenuos.online/api/mcp'

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        wetaego: {
          url: serverUrl,
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      }
    },
    null,
    2
  )

  const cursorConfig = JSON.stringify(
    {
      name: 'wetaego-staff-mcp',
      type: 'sse-or-http',
      url: serverUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    },
    null,
    2
  )

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
            operationId: 'executeStaffMcpTool',
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
            }
          }
        }
      }
    },
    null,
    2
  )

  const curlSnippet = `curl -X POST ${serverUrl} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "get_daily_sales", "arguments": { "date": "${new Date().toISOString().split('T')[0]}" }}'`

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
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">AI & Agent Integrations (Model Context Protocol)</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Connect external autonomous agents (Claude Desktop, Cursor, Custom Bots) to execute staff back-office tools and audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            SSE & HTTP Ready
          </span>
        </div>
      </div>

      {/* API Key Box */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" /> Merchant Staff API Key
          </label>
          <button
            onClick={() => setApiKey(`key_sec_live_${Math.random().toString(36).substring(2, 12)}`)}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-emerald-400 transition"
          >
            <RefreshCw className="w-3 h-3" /> Roll Key
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={apiKey}
            readOnly
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(apiKey)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Key</span>
          </button>
        </div>
      </div>

      {/* Snippet Exporter */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveClient('claude')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
              activeClient === 'claude'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Claude Desktop
          </button>
          <button
            onClick={() => setActiveClient('cursor')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
              activeClient === 'cursor'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Cursor / Windsurf
          </button>
          <button
            onClick={() => setActiveClient('openai')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
              activeClient === 'openai'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="h-3.5 w-3.5" />
            OpenAI Custom GPT
          </button>
          <button
            onClick={() => setActiveClient('curl')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
              activeClient === 'curl'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            cURL / Python
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {activeClient === 'claude' && 'Paste into ~/Library/Application Support/Claude/claude_desktop_config.json'}
              {activeClient === 'cursor' && 'Add to .cursor/mcp.json in your workspace root'}
              {activeClient === 'openai' && 'Import as OpenAPI 3.1.0 schema in Custom GPT Actions'}
              {activeClient === 'curl' && 'Execute in any terminal or automation cron script'}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Configuration</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
            <pre>{getActiveCode()}</pre>
          </div>

          <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500 border-t border-zinc-800/60">
            <span>Discovery Manifest: <code className="text-zinc-400">/.well-known/mcp.json</code></span>
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition"
            >
              Learn more about MCP <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
