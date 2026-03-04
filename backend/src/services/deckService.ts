import prisma from '../client.ts';

export interface DeckButtonData {
  id?: string;
  label: string;
  icon?: string;
  command: string;
  type: string;
  color?: string;
  row: number;
  col: number;
  checkCommand?: string;
  activeIcon?: string;
  activeLabel?: string;
  deckId?: string;
}

export interface CreateDeckData {
  name: string;
  rows?: number;
  cols?: number;
  contextApp?: string;
}

export const deckService = {
  // --- Deck Management ---
  getDecks: async (userId: string) => {
    const count = await prisma.deck.count({
      where: { userId, isDeleted: false }
    });

    if (count === 0) {
      const defaultDeck = await prisma.deck.create({
        data: {
          name: 'Main Deck',
          userId,
          rows: 3,
          cols: 5
        }
      });

      await prisma.deckButton.updateMany({
        where: { userId, isDeleted: false, deckId: null },
        data: { deckId: defaultDeck.id }
      });
      
      return [defaultDeck];
    }

    return prisma.deck.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'asc' }
    });
  },

  createDeck: async (userId: string, data: CreateDeckData) => {
    return prisma.deck.create({
      data: {
        name: data.name,
        rows: data.rows || 3,
        cols: data.cols || 5,
        contextApp: data.contextApp,
        userId
      }
    });
  },

  updateDeck: async (userId: string, deckId: string, data: Partial<CreateDeckData>) => {
    return prisma.deck.update({
      where: { id: deckId, userId },
      data: {
        name: data.name,
        rows: data.rows,
        cols: data.cols,
        contextApp: data.contextApp
      }
    });
  },

  deleteDeck: async (userId: string, deckId: string) => {
    return prisma.$transaction(async (tx) => {
      await tx.deck.update({
        where: { id: deckId, userId },
        data: { isDeleted: true }
      });
      await tx.deckButton.updateMany({
        where: { deckId },
        data: { isDeleted: true }
      });
    });
  },

  getDeck: async (userId: string, deckId: string) => {
    return prisma.deck.findFirst({
      where: { id: deckId, userId, isDeleted: false }
    });
  },

  // --- Button Management ---

  getDeckConfig: async (userId: string, deckId?: string) => {
    let targetDeckId = deckId;

    if (!targetDeckId) {
      const decks = await deckService.getDecks(userId);
      if (decks.length > 0) {
        targetDeckId = decks[0].id;
      }
    }

    if (!targetDeckId) return [];

    return prisma.deckButton.findMany({
      where: { 
        deckId: targetDeckId,
        isDeleted: false 
      },
      orderBy: [
        { row: 'asc' },
        { col: 'asc' }
      ]
    });
  },

  saveDeckConfig: async (userId: string, config: DeckButtonData[], deckId?: string) => {
    let targetDeckId = deckId;

    if (!targetDeckId) {
       const decks = await deckService.getDecks(userId);
       if (decks.length > 0) {
         targetDeckId = decks[0].id;
       } else {
         const newDeck = await deckService.createDeck(userId, { name: 'Main Deck' });
         targetDeckId = newDeck.id;
       }
    }

    if (!targetDeckId) throw new Error("Could not identify target deck");

    return prisma.$transaction(async (tx) => {
      await tx.deckButton.updateMany({
        where: { 
          deckId: targetDeckId,
          isDeleted: false 
        },
        data: { isDeleted: true }
      });

      const createPromises = config.map(button => {
        return tx.deckButton.create({
          data: {
            label: button.label,
            icon: button.icon,
            command: button.command,
            type: button.type || 'COMMAND',
            checkCommand: button.checkCommand,
            activeIcon: button.activeIcon,
            activeLabel: button.activeLabel,
            color: button.color,
            row: button.row,
            col: button.col,
            userId,
            deckId: targetDeckId
          }
        });
      });

      await Promise.all(createPromises);
      return { success: true };
    });
  }
};
