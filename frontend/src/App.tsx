import React, { useState, useEffect, useRef } from 'react';
import { Layout, Settings, Plus, RefreshCw, Monitor, Smartphone, Terminal, Play, LogOut, Sparkles, Trash2, Download, Upload } from 'lucide-react';
import { DeckGrid } from './components/DeckGrid';
import { CommandConfig } from './components/CommandConfig';
import { EmojiKeyboard } from './components/EmojiKeyboard';
import { deckService, DeckButton, Deck } from './services/deck.service';
import { authService } from './services/auth.service';
import { AuthPage } from './pages/AuthPage';
import { DesktopDashboard } from './components/DesktopDashboard';

function App() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [buttons, setButtons] = useState<DeckButton[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<DeckButton | undefined>();
  const [targetPosition, setTargetPosition] = useState<{ row: number; col: number } | undefined>();
  const [isAiMode, setIsAiMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'control' | 'edit'>('control');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [logs, setLogs] = useState<{ msg: string; type: 'success' | 'error' | 'info' }[]>([]);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  
  // Contextual deck state
  const [manualDeckId, setManualDeckId] = useState<string | null>(null);
  const [contextualDeckId, setContextualDeckId] = useState<string | null>(null);
  const [isDeckSettingsOpen, setIsDeckSettingsOpen] = useState(false);
  const [settingsDeckName, setSettingsDeckName] = useState('');
  const [settingsContextApp, setSettingsContextApp] = useState('');

  // Check if running in Electron
  const isElectron = !!window.electron;

  useEffect(() => {
    if (user && !isElectron) {
      loadDecks();
    }
  }, [user, isElectron]);

  // Auto-switch deck based on focused app — polls backend every 1.5s
  useEffect(() => {
    const hasContextualDecks = decks.some(d => d.contextApp);
    if (!hasContextualDecks) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const appName = await deckService.getActiveApp();
        if (cancelled || !appName) return;

        const match = decks.find(
          (d) => d.contextApp && appName.toLowerCase().includes(d.contextApp.toLowerCase())
        );

        setContextualDeckId((prevContextualId) => {
          if (match) {
            if (match.id !== prevContextualId) {
              setActiveDeckId(match.id);
              fetchDeck(match.id);
            }
            return match.id;
          } else if (prevContextualId) {
            // No match — revert to last manually selected deck
            setManualDeckId((prevManualId) => {
              const revertId = prevManualId || decks[0]?.id;
              if (revertId) {
                setActiveDeckId(revertId);
                fetchDeck(revertId);
              }
              return prevManualId;
            });
            return null;
          }
          return prevContextualId;
        });
      } catch {
        // Server unreachable — silently skip
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks]);

  const loadDecks = async () => {
    setIsLoading(true);
    try {
      const deckList = await deckService.getDecks();
      setDecks(deckList);
      if (deckList.length > 0) {
        // If no active deck or active deck not in list, select first
        if (!activeDeckId || !deckList.find(d => d.id === activeDeckId)) {
          setActiveDeckId(deckList[0].id);
          fetchDeck(deckList[0].id);
        } else {
          fetchDeck(activeDeckId);
        }
      }
    } catch (error) {
      addLog('Failed to load decks', 'error');
      setIsLoading(false);
    }
  };

  const fetchDeck = async (deckId?: string) => {
    const targetId = deckId || activeDeckId;
    if (!targetId) return;

    setIsLoading(true);
    try {
      const data = await deckService.getDeckConfig(targetId);
      setButtons(data);
      addLog('Deck configuration loaded', 'info');
    } catch (error) {
      addLog('Failed to load deck configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setButtons([]);
  };

  const addLog = (msg: string, type: 'success' | 'error' | 'info') => {
    setLogs((prev) => [{ msg, type }, ...prev].slice(0, 5));
  };

  if (isElectron) {
    return <DesktopDashboard />;
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => setUser(authService.getCurrentUser())} />;
  }


  const handleExecute = async (command: string, type: string = 'COMMAND') => {
    if (type === 'EMOJI_KEYBOARD') {
      setIsEmojiOpen(true);
      return;
    }
    addLog(`Executing ${type}: ${command}`, 'info');
    try {
      const result = await deckService.executeCommand(command, type);
      if (result.success) {
        addLog(`${type} executed successfully`, 'success');
      } else {
        addLog(`Execution error: ${result.error}`, 'error');
      }
    } catch (error: any) {
      addLog(`Failed to execute: ${error.message}`, 'error');
    }
  };

  const handleSaveButton = async (button: DeckButton) => {
    if (!activeDeckId) {
      addLog('No deck selected', 'error');
      return;
    }
    const newButtons = [...buttons];
    const index = newButtons.findIndex((b) => b.id === button.id);
    
    if (index >= 0) {
      newButtons[index] = button;
    } else {
      newButtons.push(button);
    }

    try {
      await deckService.saveDeckConfig(newButtons, activeDeckId);
      setButtons(newButtons);
      setIsConfigOpen(false);
      setIsAiMode(false);
      setEditingButton(undefined);
      setTargetPosition(undefined);
      addLog('Button saved', 'success');
    } catch (error) {
      addLog('Failed to save button', 'error');
    }
  };

  const handleDeleteButton = async (id: string) => {
    if (!activeDeckId) return;
    const newButtons = buttons.filter((b) => b.id !== id);
    try {
      await deckService.saveDeckConfig(newButtons, activeDeckId);
      setButtons(newButtons);
      setIsConfigOpen(false);
      setIsAiMode(false);
      setEditingButton(undefined);
      setTargetPosition(undefined);
      addLog('Button deleted', 'success');
    } catch (error) {
      addLog('Failed to delete button', 'error');
    }
  };

  const handleCreateDeck = async () => {
    const name = prompt("Enter new deck name:");
    if (!name) return;
    try {
      const newDeck = await deckService.createDeck(name);
      setDecks([...decks, newDeck]);
      setActiveDeckId(newDeck.id);
      setManualDeckId(newDeck.id);
      setContextualDeckId(null);
      fetchDeck(newDeck.id);
      addLog(`Deck "${name}" created`, 'success');
    } catch (error) {
      addLog('Failed to create deck', 'error');
    }
  };

  const handleOpenDeckSettings = () => {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck) return;
    setSettingsDeckName(deck.name);
    setSettingsContextApp(deck.contextApp || '');
    setIsDeckSettingsOpen(true);
  };

  const handleSaveDeckSettings = async () => {
    if (!activeDeckId) return;
    try {
      const updated = await deckService.updateDeckMetadata(activeDeckId, {
        name: settingsDeckName,
        contextApp: settingsContextApp || undefined,
      });
      setDecks(decks.map(d => d.id === activeDeckId ? updated : d));
      setIsDeckSettingsOpen(false);
      addLog('Deck settings saved', 'success');
    } catch (error) {
      addLog('Failed to save deck settings', 'error');
    }
  };

  const handleCaptureActiveApp = async () => {
    try {
      const appName = await deckService.getActiveApp();
      if (appName) setSettingsContextApp(appName);
    } catch {
      addLog('Failed to capture active app', 'error');
    }
  };

  const handleDeleteDeck = async () => {
    if (!activeDeckId) return;
    if (!confirm("Are you sure you want to delete this deck?")) return;
    
    try {
        await deckService.deleteDeck(activeDeckId);
        addLog('Deck deleted', 'success');
        // Reload decks to pick a new one
        loadDecks();
    } catch (error) {
        addLog('Failed to delete deck', 'error');
    }
  }

  const activeDeck = decks.find(d => d.id === activeDeckId);
  const rows = activeDeck?.rows || 3;
  const cols = activeDeck?.cols || 5;

  const activeDeckIndex = decks.findIndex(d => d.id === activeDeckId);
  
  const handleNextDeck = () => {
    if (activeDeckIndex < decks.length - 1) {
      const nextId = decks[activeDeckIndex + 1].id;
      setActiveDeckId(nextId);
      fetchDeck(nextId);
    }
  };

  const handlePrevDeck = () => {
    if (activeDeckIndex > 0) {
      const prevId = decks[activeDeckIndex - 1].id;
      setActiveDeckId(prevId);
      fetchDeck(prevId);
    }
  };

  const handleAddAtPosition = (row: number, col: number) => {
    if (activeTab === 'edit') {
      setEditingButton(undefined);
      setTargetPosition({ row, col });
      setIsAiMode(false);
      setIsConfigOpen(true);
    }
  };

  const getAvailablePositions = () => {
    const positions = [];
    if (targetPosition) return [targetPosition];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!buttons.find((b) => b.row === r && b.col === c)) {
          positions.push({ row: r, col: c });
        }
      }
    }
    return positions;
  };

  const handleMoveButton = async (source: { row: number; col: number }, target: { row: number; col: number }) => {
    if (source.row === target.row && source.col === target.col) return;
    if (!activeDeckId) return;

    const newButtons = [...buttons];
    const sourceBtnIndex = newButtons.findIndex((b) => b.row === source.row && b.col === source.col);
    const targetBtnIndex = newButtons.findIndex((b) => b.row === target.row && b.col === target.col);

    if (sourceBtnIndex === -1) return;

    // Optimistic update
    const sourceBtn = { ...newButtons[sourceBtnIndex] };

    if (targetBtnIndex !== -1) {
      // Swap
      const targetBtn = { ...newButtons[targetBtnIndex] };
      sourceBtn.row = target.row;
      sourceBtn.col = target.col;
      targetBtn.row = source.row;
      targetBtn.col = source.col;

      newButtons[sourceBtnIndex] = sourceBtn;
      newButtons[targetBtnIndex] = targetBtn;
    } else {
      // Move to empty
      sourceBtn.row = target.row;
      sourceBtn.col = target.col;
      newButtons[sourceBtnIndex] = sourceBtn;
    }

    setButtons(newButtons);

    try {
      await deckService.saveDeckConfig(newButtons, activeDeckId);
      addLog('Layout updated', 'success');
    } catch (error) {
      addLog('Failed to save layout', 'error');
      fetchDeck(activeDeckId);
    }
  };

  const handleExportBackup = async () => {
    try {
      await deckService.exportBackup();
      addLog('Backup exported', 'success');
    } catch (error) {
      addLog('Failed to export backup', 'error');
    }
  };

  const handleImportBackup = () => {
    backupFileInputRef.current?.click();
  };

  const handleBackupFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    e.target.value = '';
    if (!confirm(`Restore from "${file.name}"? This will replace all your current decks.`)) return;
    try {
      const result = await deckService.importBackup(file);
      addLog(`Restored ${result.decks} deck(s) and ${result.buttons} button(s)`, 'success');
      loadDecks();
    } catch (error: any) {
      addLog(`Restore failed: ${error?.response?.data?.message || error.message}`, 'error');
    }
  }

  const handleLayoutChange = async (newRows: number, newCols: number) => {
    if (!activeDeckId) return;
    try {
      const updatedDeck = await deckService.updateDeckMetadata(activeDeckId, { rows: newRows, cols: newCols });
      setDecks(decks.map(d => d.id === activeDeckId ? updatedDeck : d));
      addLog(`Grid resized to ${newRows}x${newCols}`, 'success');
    } catch (error) {
      addLog('Failed to update grid size', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 relative">
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none"></div>
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layout className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">WebDeck</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Virtual Control Center</p>
            </div>

             {/* Deck Selector */}
             <div className="ml-4 flex items-center gap-2">
                <select
                    value={activeDeckId || ''}
                    onChange={(e) => {
                        if (e.target.value === 'new') {
                            handleCreateDeck();
                        } else {
                            setActiveDeckId(e.target.value);
                            setManualDeckId(e.target.value);
                            setContextualDeckId(null);
                            fetchDeck(e.target.value);
                        }
                    }}
                    className="bg-gray-800 text-white text-sm rounded-lg border-none focus:ring-2 focus:ring-blue-500 py-1 pl-3 pr-8"
                >
                    {decks.map(deck => (
                        <option key={deck.id} value={deck.id}>
                            {deck.contextApp ? `⚡ ${deck.name}` : deck.name}
                        </option>
                    ))}
                    <option value="new">+ New Deck</option>
                </select>
                {contextualDeckId && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                        Auto
                    </span>
                )}
                {activeDeckId && (
                    <button
                        onClick={handleOpenDeckSettings}
                        className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
                        title="Deck settings"
                    >
                        <Settings size={14} />
                    </button>
                )}
                {activeDeckId && decks.length > 1 && (
                    <button
                        onClick={handleDeleteDeck}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
                        title="Delete current deck"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('control')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'control' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Play size={16} />
                Deck
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'edit' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Settings size={16} />
                Config
              </button>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-500 font-medium">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all"
                title="Log Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Tab Switcher */}
        <div className="sm:hidden border-t border-gray-800 flex bg-gray-900/50">
          <button
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${
              activeTab === 'control' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            <Play size={14} />
            Deck
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${
              activeTab === 'edit' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            <Settings size={14} />
            Config
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Main Grid Section */}
          <section className="relative">
            {activeTab === 'edit' && (
              <div className="absolute -top-4 -right-4 z-10 flex items-center bg-black rounded-full border border-gray-800 p-1 gap-1 shadow-2xl">
                <button
                  onClick={() => {
                    setEditingButton(undefined);
                    setTargetPosition(undefined);
                    setIsAiMode(false);
                    setIsConfigOpen(true);
                  }}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold flex items-center gap-2 transition-all active:scale-95"
                  title="Create New"
                >
                  <Plus size={20} />
                  <span>Create</span>
                </button>
                <button
                  onClick={() => {
                    setEditingButton(undefined);
                    setTargetPosition(undefined);
                    setIsAiMode(true);
                    setIsConfigOpen(true);
                  }}
                  className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
                  title="AI Generate"
                >
                  <Sparkles size={20} />
                </button>
              </div>
            )}

            <div className="relative min-h-[24rem]">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-gray-500 bg-black/50 backdrop-blur-sm rounded-3xl">
                  <RefreshCw className="animate-spin" size={48} />
                  <p className="font-medium">Connecting to Host...</p>
                </div>
              )}
              
              <div className={activeTab === 'edit' ? '' : ''}>
                <DeckGrid
                  buttons={buttons}
                  onAdd={activeTab === 'edit' ? handleAddAtPosition : undefined}
                  onMove={activeTab === 'edit' ? handleMoveButton : undefined}
                  onExecute={(btn) => {
                    if (activeTab === 'edit') {
                      setEditingButton(btn);
                      setTargetPosition(undefined);
                      setIsAiMode(false);
                      setIsConfigOpen(true);
                    } else {
                      handleExecute(btn.command, btn.type);
                    }
                  }}
                  rows={rows}
                  cols={cols}
                  onNextDeck={activeDeckIndex < decks.length - 1 ? handleNextDeck : undefined}
                  onPrevDeck={activeDeckIndex > 0 ? handlePrevDeck : undefined}
                  onLayoutChange={activeTab === 'edit' ? handleLayoutChange : undefined}
                />
              </div>
            </div>
          </section>
          
          {/* Action Row for Mobile/Better Visibility */}
          {activeTab === 'edit' && (
            <div className="flex bg-gray-900 border border-gray-800 p-2 rounded-2xl gap-2 sm:hidden shadow-xl">
              <button
                onClick={() => {
                  setEditingButton(undefined);
                  setTargetPosition(undefined);
                  setIsAiMode(false);
                  setIsConfigOpen(true);
                }}
                className="flex-1 bg-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Plus size={20} /> Create
              </button>
              <button
                onClick={() => {
                  setEditingButton(undefined);
                  setTargetPosition(undefined);
                  setIsAiMode(true);
                  setIsConfigOpen(true);
                }}
                className="w-14 bg-indigo-600 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <Sparkles size={20} className="text-white" />
              </button>
            </div>
          )}

          {/* Backup & Restore — visible in Config tab */}
          {activeTab === 'edit' && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Download size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Backup & Restore</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Export your decks and buttons as a JSON file, or restore from a previous backup.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={handleImportBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Upload size={16} />
                  Import
                </button>
              </div>
            </div>
          )}

          {/* Status & Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logs */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Terminal size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Activity Log</h3>
              </div>
              <div className="space-y-2 font-mono text-sm h-32 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${
                        log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                      }`}
                    >
                      <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                      <span>{log.msg}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-700 italic">No activity yet...</div>
                )}
              </div>
            </div>

            {/* Quick Tips / Instructions */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 text-blue-500/10 group-hover:scale-110 transition-transform duration-500">
                <Smartphone size={160} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-blue-400">
                  <Monitor size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Setup Guide</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    Run this app on your PC.
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    Open the local IP on your phone.
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    Add to Home Screen for full-screen experience.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isConfigOpen && (
        <CommandConfig
          button={editingButton}
          onSave={handleSaveButton}
          onDelete={handleDeleteButton}
          onCancel={() => {
            setIsConfigOpen(false);
            setIsAiMode(false);
            setEditingButton(undefined);
          }}
          availablePositions={getAvailablePositions()}
          autoFocusAI={isAiMode}
        />
      )}

      {isEmojiOpen && (
        <EmojiKeyboard
          onEmojiClick={(emojiData) => {
            handleExecute(emojiData.emoji, 'PASTE');
            setIsEmojiOpen(false);
          }}
          onClose={() => setIsEmojiOpen(false)}
        />
      )}

      {/* Deck Settings Modal */}
      {isDeckSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4">Deck Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={settingsDeckName}
                  onChange={(e) => setSettingsDeckName(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Context App
                  <span className="ml-1 normal-case font-normal text-gray-600">(auto-switch when this app is focused)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settingsContextApp}
                    onChange={(e) => setSettingsContextApp(e.target.value)}
                    placeholder="e.g. Visual Studio Code"
                    className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCaptureActiveApp}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                    title="Capture currently focused app"
                  >
                    Capture
                  </button>
                </div>
                {settingsContextApp && (
                  <p className="mt-1 text-xs text-blue-400">
                    Will auto-activate when &ldquo;{settingsContextApp}&rdquo; is focused
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveDeckSettings}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsDeckSettingsOpen(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

<input
              ref={backupFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleBackupFileChange}
      />


      {/* Footer / Connection Status */}
      <footer className="mt-auto py-8 border-t border-gray-900">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Host Connected: {window.location.hostname}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
