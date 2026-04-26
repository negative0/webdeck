import { getInstance } from '../integrations/llm/main.ts';
import { LLMProvider } from '../integrations/llm/types.ts';
import { deckService } from '../services/deckService.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsync from '../utils/catchAsync.ts';
import { Hono } from 'hono';
import os from 'os';

const aiRoutes = new Hono();

aiRoutes.post(
    '/suggest',
    catchAsync(async c => {
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

        const result = (await llm.generateText({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        })) as { text: string };

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
    })
);

aiRoutes.post(
    '/generate-deck',
    catchAsync(async c => {
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

        const systemPrompt = `You are an expert at creating WebDecks - customized control centers with buttons for terminal commands and keyboard shortcuts.
Your task is to generate a complete deck configuration based on the user's request.

CRITICAL CONTEXT:
The user's host system is:
- Platform: ${systemInfo.platform}
- Architecture: ${systemInfo.arch}
- OS Type: ${systemInfo.type}
- OS Release: ${systemInfo.release}
- Likely Shell: ${systemInfo.shell}

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation):
{
  "name": "Deck Name",
  "contextApp": "optional app name like 'Spotify', 'Arc', 'VS Code'",
  "rows": 3,
  "cols": 5,
  "buttons": [
    {
      "label": "Button Label",
      "command": "terminal command or keyboard shortcut",
      "type": "COMMAND" or "SHORTCUT",
      "icon": "LucideIconName",
      "color": "#HEXCODE",
      "row": 0,
      "col": 0,
      "checkCommand": "optional - shell command returning 'true' or '1' if active",
      "activeIcon": "optional - icon when active",
      "activeLabel": "optional - label when active"
    }
  ]
}

RULES:
1. Create 5-12 relevant buttons based on the user's intent
2. Position buttons naturally in the grid (fill left-to-right, top-to-bottom)
3. Use valid Lucide icon names (Chrome, Terminal, Music, Volume2, Play, Pause, SkipForward, SkipBack, Mic, MicOff, etc)
4. Choose hex colors that match each button's function (e.g. #EF4444 for power, #10B981 for play)
5. Set appropriate rows/cols (e.g. 3x5 for general, 2x4 for simple, 4x6 for complex)
6. Ensure commands are compatible with ${systemInfo.platform}
7. Extract app name from prompt if mentioned (e.g. "for Spotify" -> contextApp: "Spotify")
8. Generate a professional deck name

COMMON BUTTONS TO INCLUDE:
- For music apps: Play, Pause, Next, Previous, Volume Up, Volume Down
- For browsers/Arc: New Tab, Back, Forward, Close Tab, Search
- For code: Format, Run, Debug, Terminal, Git Commit
- For macOS: Spotlight Search, Mission Control, Command Palette

Example prompt: "Create a Spotify deck for macOS"
Example response:
{
  "name": "Spotify Remote",
  "contextApp": "Spotify",
  "rows": 2,
  "cols": 5,
  "buttons": [
    {"label": "Play", "command": "osascript -e 'tell application \\"Spotify\\" to play'", "type": "COMMAND", "icon": "Play", "color": "#10B981", "row": 0, "col": 0},
    ...
  ]
}`;

        const result = (await llm.generateText({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        })) as { text: string };

        try {
            // Find the JSON block in the response (remove markdown code blocks if present)
            let jsonText = result.text;
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }
            const parsed = JSON.parse(jsonMatch[0]);

            // Validate required fields
            if (!parsed.name || !parsed.buttons || !Array.isArray(parsed.buttons)) {
                throw new Error('Invalid deck structure');
            }

            return c.json({
                name: parsed.name,
                contextApp: parsed.contextApp || undefined,
                rows: parsed.rows || 3,
                cols: parsed.cols || 5,
                buttons: parsed.buttons
            });
        } catch (error) {
            console.error('Deck Generation Error:', error, 'Result:', result.text);
            throw new ApiError(500, 'Failed to generate deck from AI');
        }
    })
);

export default aiRoutes;
