import { api } from '../lib/api';

export interface Deck {
  id: string;
  name: string;
  rows: number;
  cols: number;
}

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
  deckId?: string;
}

export const deckService = {
  getDecks: async (): Promise<Deck[]> => {
    const response = await api.get('/deck/list');
    return response.data;
  },
  
  createDeck: async (name: string, rows: number = 3, cols: number = 5): Promise<Deck> => {
    const response = await api.post('/deck/list', { name, rows, cols });
    return response.data;
  },

  updateDeckMetadata: async (deckId: string, data: Partial<Deck>): Promise<Deck> => {
    const response = await api.put(`/deck/${deckId}/metadata`, data);
    return response.data;
  },

  deleteDeck: async (deckId: string): Promise<void> => {
    await api.delete(`/deck/${deckId}`);
  },

  getDeckConfig: async (deckId?: string): Promise<DeckButton[]> => {
    const url = deckId ? `/deck/${deckId}` : '/deck';
    const response = await api.get(url);
    return response.data;
  },

  saveDeckConfig: async (config: DeckButton[], deckId?: string): Promise<void> => {
    const url = deckId ? `/deck/${deckId}` : '/deck';
    await api.post(url, config);
  },

  executeCommand: async (command: string, type: string = 'COMMAND'): Promise<any> => {
    const response = await api.post('/deck/execute', { command, type });
    return response.data;
  },

  suggestCommand: async (prompt: string): Promise<Partial<DeckButton>> => {
    const response = await api.post('/ai/suggest', { prompt });
    return response.data;
  },

  exportBackup: async (): Promise<void> => {
    const response = await api.get('/backup');
    const data = response.data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `webdeck-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup: async (file: File): Promise<{ decks: number; buttons: number }> => {
    const text = await file.text();
    const data = JSON.parse(text);
    const response = await api.post('/backup/restore', data);
    return response.data;
  },
};
