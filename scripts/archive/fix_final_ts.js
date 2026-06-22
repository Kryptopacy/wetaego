const fs = require('fs');
const path = require('path');

// 1. Fix ai-chat.tsx (use 'CoreMessage' or 'UIMessage' and CoreToolCall)
// Actually, it's safer to just define our own interfaces instead of hunting the Vercel AI SDK exports.
const aiChatPath = path.join(__dirname, 'app', 'm', '[slug]', 'ai-chat.tsx');
let aiChat = fs.readFileSync(aiChatPath, 'utf8');
aiChat = aiChat.replace(`import { DefaultChatTransport, ToolCall, Message } from 'ai'`, `import { DefaultChatTransport } from 'ai'`);
aiChat = aiChat.replace(`async onToolCall({ toolCall }: { toolCall: ToolCall<string, unknown> }) {`, `async onToolCall({ toolCall }: { toolCall: { toolName: string; args: Record<string, unknown>; toolCallId: string } }) {`);
aiChat = aiChat.replace(`{messages.map((m: Message) => {`, `{messages.map((m: { id: string; role: string; content: string }) => {`);
fs.writeFileSync(aiChatPath, aiChat, 'utf8');

// 2. Fix menu-renderer.tsx implicit any on item
const menuRendererPath = path.join(__dirname, 'app', 'm', '[slug]', 'menu-renderer.tsx');
let menuRenderer = fs.readFileSync(menuRendererPath, 'utf8');
menuRenderer = menuRenderer.replace(`items: (cat.menu_items || []).map(item => ({`, `items: (cat.menu_items || []).map((item: Tables<'menu_items'>) => ({`);
fs.writeFileSync(menuRendererPath, menuRenderer, 'utf8');

console.log('Fixed final type checks');
