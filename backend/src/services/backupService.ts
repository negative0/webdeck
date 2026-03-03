import prisma from '../client.ts';
import ApiError from '../utils/ApiError.ts';

export const BACKUP_VERSION = 1;

interface BackupButton {
  label: string;
  icon?: string | null;
  command: string;
  type: string;
  color?: string | null;
  row: number;
  col: number;
  checkCommand?: string | null;
  activeIcon?: string | null;
  activeLabel?: string | null;
}

interface BackupDeck {
  name: string;
  rows: number;
  cols: number;
  buttons: BackupButton[];
}

export interface BackupData {
  version: number;
  exportedAt: string;
  decks: BackupDeck[];
}

// Migrate older backup versions to the current format
function migrateBackup(raw: any): BackupData {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Invalid backup file');
  }

  const version = typeof raw.version === 'number' ? raw.version : 1;

  if (version > BACKUP_VERSION) {
    // Future version: attempt best-effort restore, ignore unknown fields
    return normalizeV1(raw);
  }

  if (version === 1) {
    return normalizeV1(raw);
  }

  throw new ApiError(400, `Unsupported backup version: ${version}`);
}

function normalizeV1(raw: any): BackupData {
  if (!Array.isArray(raw.decks)) {
    throw new ApiError(400, 'Backup must contain a "decks" array');
  }

  const decks: BackupDeck[] = raw.decks.map((d: any, di: number) => {
    if (!d || typeof d !== 'object') {
      throw new ApiError(400, `Deck at index ${di} is invalid`);
    }
    if (!Array.isArray(d.buttons)) {
      throw new ApiError(400, `Deck "${d.name || di}" must contain a "buttons" array`);
    }

    const buttons: BackupButton[] = d.buttons.map((b: any, bi: number) => {
      if (!b || typeof b !== 'object') {
        throw new ApiError(400, `Button at index ${bi} in deck "${d.name || di}" is invalid`);
      }
      return {
        label: String(b.label ?? ''),
        icon: b.icon ?? null,
        command: String(b.command ?? ''),
        type: String(b.type ?? 'COMMAND'),
        color: b.color ?? null,
        row: Number(b.row ?? 0),
        col: Number(b.col ?? 0),
        checkCommand: b.checkCommand ?? null,
        activeIcon: b.activeIcon ?? null,
        activeLabel: b.activeLabel ?? null,
      };
    });

    return {
      name: String(d.name ?? 'Deck'),
      rows: Number(d.rows ?? 3),
      cols: Number(d.cols ?? 5),
      buttons,
    };
  });

  return {
    version: BACKUP_VERSION,
    exportedAt: raw.exportedAt ?? new Date().toISOString(),
    decks,
  };
}

export const backupService = {
  exportBackup: async (userId: string): Promise<BackupData> => {
    const decks = await prisma.deck.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: {
        buttons: {
          where: { isDeleted: false },
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
    });

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      decks: decks.map((deck) => ({
        name: deck.name,
        rows: deck.rows,
        cols: deck.cols,
        buttons: deck.buttons.map((btn) => ({
          label: btn.label,
          icon: btn.icon ?? null,
          command: btn.command,
          type: btn.type,
          color: btn.color ?? null,
          row: btn.row,
          col: btn.col,
          checkCommand: btn.checkCommand ?? null,
          activeIcon: btn.activeIcon ?? null,
          activeLabel: btn.activeLabel ?? null,
        })),
      })),
    };
  },

  restoreBackup: async (
    userId: string,
    rawData: unknown,
    merge = false
  ): Promise<{ decks: number; buttons: number }> => {
    const data = migrateBackup(rawData);

    return prisma.$transaction(async (tx) => {
      if (!merge) {
        // Soft-delete all existing decks and their buttons
        const existingDecks = await tx.deck.findMany({
          where: { userId, isDeleted: false },
          select: { id: true },
        });
        const existingDeckIds = existingDecks.map((d) => d.id);

        await tx.deckButton.updateMany({
          where: { deckId: { in: existingDeckIds } },
          data: { isDeleted: true },
        });
        await tx.deck.updateMany({
          where: { userId, isDeleted: false },
          data: { isDeleted: true },
        });
      }

      let totalButtons = 0;

      for (const deckData of data.decks) {
        const newDeck = await tx.deck.create({
          data: {
            name: deckData.name,
            rows: deckData.rows,
            cols: deckData.cols,
            userId,
          },
        });

        if (deckData.buttons.length > 0) {
          await tx.deckButton.createMany({
            data: deckData.buttons.map((btn) => ({
              label: btn.label,
              icon: btn.icon,
              command: btn.command,
              type: btn.type,
              color: btn.color,
              row: btn.row,
              col: btn.col,
              checkCommand: btn.checkCommand,
              activeIcon: btn.activeIcon,
              activeLabel: btn.activeLabel,
              userId,
              deckId: newDeck.id,
            })),
          });
          totalButtons += deckData.buttons.length;
        }
      }

      return { decks: data.decks.length, buttons: totalButtons };
    });
  },
};
