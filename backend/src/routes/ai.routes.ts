import { Hono } from 'hono';
import { getInstance } from '../integrations/llm/main.ts';
import { LLMProvider } from '../integrations/llm/types.ts';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';
import os from 'os';
import { deckService } from '../services/deckService.ts';

const aiRoutes = new Hono();

aiRoutes.post('/suggest', catchAsync(async (c) => {
    const { prompt } = await c.req.json();
    const userId = c.get('userId');

    if (!prompt) {
        throw new ApiError(400, 'Prompt is required');
    }

    const llm = getInstance({ provider: LLMProvider.Gemini });

    const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        type: os.type(),
        shell: process.env.SHELL || (os.platform() === 'win32' ? 'cmd/powershell' : 'sh/bash')
    };

    const currentDeck = await deckService.getDeckConfig(userId);
    const existingCommands = currentDeck.map(b => ({ label: b.label, command: b.command }));

    const systemPrompt = `You are an expert at terminal commands and keyboard shortcuts for Linux, macOS, and Windows.
Your task is to suggest a command or shortcut, a type (COMMAND or SHORTCUT), a label, a Lucide icon name, and a color for a "WebDeck" button based on the user's intent.

CRITICAL CONTEXT:
The user's host system is:
- Platform: ${systemInfo.platform}
- Architecture: ${systemInfo.arch}
- OS Type: ${systemInfo.type}
- OS Release: ${systemInfo.release}
- Likely Shell: ${systemInfo.shell}

Existing buttons on the deck:
${JSON.stringify(existingCommands, null, 2)}

Ensure the suggestion is compatible with this specific system.

TYPES:
- COMMAND: A terminal command that can be executed in the shell (e.g. "ls", "open .", "google-chrome").
- SHORTCUT: A keyboard key or combination (e.g. "F5", "ctrl+c", "Alt+Tab"). 

Respond ONLY with a JSON object in the following format:
{
  "label": "Short Label",
  "command": "terminal shell command compatible with (/bin/sh) or shortcut key",
  "type": "COMMAND" | "SHORTCUT",
  "icon": "LucideIconName",
  "color": "#HEXCODE",
  "checkCommand": "optional shell command returning 'true' or '1' if active",
  "activeIcon": "optional icon when active",
  "activeLabel": "optional label when active"
}

Common Lucide icons: Chrome, Terminal, Music, Volume2, Monitor, Cpu, Power, Globe, Folder, Play, Pause, SkipForward, SkipBack, Image, Mail, Github, Code, Hash, Command, Shield, Settings, Database, Cloud, Zap, Flame, Heart, Star, Mic, MicOff, Video, VideoOff.

Example:
User: "Open Chrome"
Response: { "label": "Chrome", "command": "google-chrome", "type": "COMMAND", "icon": "Chrome", "color": "#4285F4" }

User: "Refresh page"
Response: { "label": "Refresh", "command": "F5", "type": "SHORTCUT", "icon": "RefreshCw", "color": "#3B82F6" }

User: "Toggle Mute"
Response: { "label": "Mute", "command": "amixer set Master toggle", "type": "COMMAND", "icon": "Mic", "color": "#EF4444", "checkCommand": "amixer get Master | grep '\\[off\\]'", "activeIcon": "MicOff", "activeLabel": "Unmute" }
`;

    const result = await llm.generateText({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    }) as { text: string };

    try {
        // Find the JSON block in the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return c.json(parsed);
    } catch (error) {
        console.error('AI Parsing Error:', error, 'Result:', result.text);
        throw new ApiError(500, 'Failed to process AI suggestion');
    }
}));

export default aiRoutes;