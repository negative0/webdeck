export const MAC_OS_PRESETS = [
  {
    category: 'System',
    items: [
      { label: 'Mute', command: 'osascript -e "set volume output muted true"', icon: 'VolumeX', type: 'COMMAND' },
      { label: 'Unmute', command: 'osascript -e "set volume output muted false"', icon: 'Volume2', type: 'COMMAND' },
      { 
        label: 'Mute', 
        command: 'osascript -e "set volume output muted not (output muted of (get volume settings))"', 
        icon: 'Volume2', 
        type: 'COMMAND',
        checkCommand: 'osascript -e "output muted of (get volume settings)"',
        activeIcon: 'VolumeX',
        activeLabel: 'Unmute'
      },
      { label: 'Volume Up (+10)', command: 'osascript -e "set volume output volume (output volume of (get volume settings) + 10)"', icon: 'Volume2', type: 'COMMAND' },
      { label: 'Volume Down (-10)', command: 'osascript -e "set volume output volume (output volume of (get volume settings) - 10)"', icon: 'Volume1', type: 'COMMAND' },
      { label: 'Sleep Display', command: 'pmset displaysleepnow', icon: 'Moon', type: 'COMMAND' },
      { label: 'Lock Screen', command: 'pmset displaysleepnow', icon: 'Lock', type: 'COMMAND' },
      { label: 'Empty Trash', command: 'osascript -e \'tell application "Finder" to empty trash\'', icon: 'Trash2', type: 'COMMAND' },
    ]
  },
  {
    category: 'Media',
    items: [
      { 
        label: 'Play/Pause', 
        command: `osascript -e 'if application "Spotify" is running then' -e 'tell application "Spotify" to playpause' -e 'else if application "Music" is running then' -e 'tell application "Music" to playpause' -e 'else' -e 'tell application "System Events" to key code 100' -e 'end if'`, 
        icon: 'Play', 
        type: 'COMMAND' 
      },
      { 
        label: 'Next Track', 
        command: `osascript -e 'if application "Spotify" is running then' -e 'tell application "Spotify" to next track' -e 'else if application "Music" is running then' -e 'tell application "Music" to next track' -e 'else' -e 'tell application "System Events" to key code 101' -e 'end if'`, 
        icon: 'SkipForward', 
        type: 'COMMAND' 
      },
      { 
        label: 'Previous Track', 
        command: `osascript -e 'if application "Spotify" is running then' -e 'tell application "Spotify" to previous track' -e 'else if application "Music" is running then' -e 'tell application "Music" to previous track' -e 'else' -e 'tell application "System Events" to key code 98' -e 'end if'`, 
        icon: 'SkipBack', 
        type: 'COMMAND' 
      },
    ]
  },
  {
    category: 'Apps',
    items: [
      { label: 'Open App...', command: 'open -a "Application Name"', icon: 'AppWindow', type: 'COMMAND' },
      { label: 'Open URL...', command: 'open "https://google.com"', icon: 'Globe', type: 'COMMAND' },
      { label: 'Google Chrome', command: 'open -a "Google Chrome"', icon: 'Chrome', type: 'COMMAND' },
      { label: 'Safari', command: 'open -a "Safari"', icon: 'Compass', type: 'COMMAND' },
      { label: 'VS Code', command: 'open -a "Visual Studio Code"', icon: 'Code', type: 'COMMAND' },
      { label: 'Terminal', command: 'open -a "Terminal"', icon: 'Terminal', type: 'COMMAND' },
      { label: 'Spotify', command: 'open -a "Spotify"', icon: 'Music', type: 'COMMAND' },
      { label: 'Slack', command: 'open -a "Slack"', icon: 'MessageSquare', type: 'COMMAND' },
      { label: 'System Settings', command: 'open -a "System Settings"', icon: 'Settings', type: 'COMMAND' },
    ]
  },
  {
    category: 'Random',
    items: [
        { label: 'Inspiration', command: 'quote=$(curl -s https://zenquotes.io/api/random | grep -o \'"q":"[^"]*\' | cut -d\'"\' -f4); osascript -e "display notification \\"$quote\\" with title \\"Inspiration\\""', icon: 'Lightbulb', type: 'COMMAND' },
    ]
  }
];
