const fs = require('fs');
const path = require('path');

// Fix unknown errors
function fixUnknownError(file) {
  const p = path.join(__dirname, 'app', 'api', ...file.split('/'));
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/error\.message/g, '(error as Error).message');
    content = content.replace(/apiError\.message/g, '(apiError as Error).message');
    content = content.replace(/err\.message/g, '(err as Error).message');
    fs.writeFileSync(p, content, 'utf8');
  }
}

['ai/generate-cover/route.ts', 'ai/generate-item-image/route.ts', 'chat/route.ts', 'cron/daily-report/route.ts'].forEach(fixUnknownError);

// Fix service-worker-registration.tsx
const swPath = path.join(__dirname, 'app', 'components', 'service-worker-registration.tsx');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(`applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),`, `applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,`);
fs.writeFileSync(swPath, sw, 'utf8');

// Fix ai-chat.tsx
const aiChatPath = path.join(__dirname, 'app', 'm', '[slug]', 'ai-chat.tsx');
let aiChat = fs.readFileSync(aiChatPath, 'utf8');
aiChat = aiChat.replace(`const { itemId, quantity } = toolCall.args as { itemId: string; quantity: number }`, `const { itemId, quantity } = (toolCall as unknown as { args: { itemId: string; quantity: number } }).args`);
aiChat = aiChat.replace(`const { itemId } = toolCall.args as { itemId: string }`, `const { itemId } = (toolCall as unknown as { args: { itemId: string } }).args`);
aiChat = aiChat.replace(`const { requestType } = toolCall.args as { requestType: 'waiter' | 'bill' | 'cleanup' }`, `const { requestType } = (toolCall as unknown as { args: { requestType: Extract<Parameters<typeof callStaffFromAi>[3], string> } }).args`);
aiChat = aiChat.replace(`{messages.map((m: { id: string; role: string; content: string }) => {`, `{messages.map((m) => {`);
fs.writeFileSync(aiChatPath, aiChat, 'utf8');

console.log('Fixed strict mode leftovers');
