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
}

export const deckService = {
  getDeckConfig: async (userId: string) => {
    return prisma.deckButton.findMany({
      where: { 
        userId,
        isDeleted: false 
      },
      orderBy: [
        { row: 'asc' },
        { col: 'asc' }
      ]
    });
  },

  saveDeckConfig: async (userId: string, config: DeckButtonData[]) => {
    return prisma.$transaction(async (tx) => {
      // Mark all existing buttons for this user as deleted first
      await tx.deckButton.updateMany({
        where: { 
          userId,
          isDeleted: false 
        },
        data: { isDeleted: true }
      });

      // Create new ones
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
          }
        });
      });

      await Promise.all(createPromises);
      return { success: true };
    });
  }
};
