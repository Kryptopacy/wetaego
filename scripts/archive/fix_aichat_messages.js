const fs = require('fs');
const path = require('path');

const aiChatPath = path.join(__dirname, 'app', 'm', '[slug]', 'ai-chat.tsx');
let aiChat = fs.readFileSync(aiChatPath, 'utf8');

aiChat = aiChat.replace(`{messages.map((m) => {`, `{messages.map((msg) => {
                  const m = msg as unknown as { id: string; role: string; content: string };`);
fs.writeFileSync(aiChatPath, aiChat, 'utf8');

console.log('Fixed ai-chat.tsx message rendering');
