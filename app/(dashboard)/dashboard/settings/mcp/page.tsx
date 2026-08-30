import { Metadata } from 'next'
import { McpSettingsClient } from './mcp-settings-client'

export const metadata: Metadata = {
  title: 'AI & MCP Agent Integrations | WETAEGO Dashboard',
  description: 'Manage and export Model Context Protocol (MCP) integrations for external AI agents, Claude Desktop, Cursor, and enterprise bots.'
}

export default function McpSettingsPage() {
  return <McpSettingsClient />
}
