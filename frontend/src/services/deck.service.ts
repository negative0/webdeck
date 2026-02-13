import { api } from '../lib/api';

export interface DeckButton {
  id: string;
  label: string;
  icon?: string;
  command: string;
  type: 'COMMAND' | 'SHORTCUT' | 'EMOJI_KEYBOARD';
  color?: string;
  row: number;
  col: number;
  checkCommand?: string;
  activeIcon?: string;
  activeLabel?: string;
}

export const deckService = {
  getDeckConfig: async (): Promise<DeckButton[]> => {
    const response = await api.get('/deck');
    return response.data;
  },

  saveDeckConfig: async (config: DeckButton[]): Promise<void> => {
    await api.post('/deck', config);
  },

  executeCommand: async (command: string, type: string = 'COMMAND'): Promise<any> => {
    const response = await api.post('/deck/execute', { command, type });
    return response.data;
  },

  suggestCommand: async (prompt: string): Promise<Partial<DeckButton>> => {
    const response = await api.post('/ai/suggest', { prompt });
    return response.data;
  },
};
