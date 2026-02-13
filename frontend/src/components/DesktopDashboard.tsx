import React, { useState, useEffect } from 'react';
import { Power, Play, StopCircle, RefreshCw, Monitor, Smartphone, Globe, Settings } from 'lucide-react';

export function DesktopDashboard() {
  const [serverStatus, setServerStatus] = useState<'running' | 'stopped' | 'starting' | 'stopping'>('running');
  const [port, setPort] = useState(3333);
  const [ipAddress, setIpAddress] = useState<string>('Loading...');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initial fetch of status
    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.send('get-server-status');
      (window as any).electron.ipcRenderer.send('get-ip-address');

      (window as any).electron.ipcRenderer.on('server-status', (status: any) => {
        setServerStatus(status ? 'running' : 'stopped');
      });

      (window as any).electron.ipcRenderer.on('ip-address', (ip: string) => {
        setIpAddress(ip);
      });
      
      (window as any).electron.ipcRenderer.on('server-log', (log: string) => {
          setLogs(prev => [log, ...prev].slice(0, 50));
      });
    }
  }, []);

  const handleToggleServer = () => {
    if (serverStatus === 'running') {
      setServerStatus('stopping');
      (window as any).electron.ipcRenderer.send('stop-server');
    } else {
      setServerStatus('starting');
      (window as any).electron.ipcRenderer.send('start-server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Monitor className="w-8 h-8 text-blue-400" />
            WebDeck Desktop Control
          </h1>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
            serverStatus === 'running' ? 'bg-green-500/20 text-green-400' : 
            serverStatus === 'stopped' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              serverStatus === 'running' ? 'bg-green-400 animate-pulse' : 
              serverStatus === 'stopped' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
            }`} />
            {serverStatus.toUpperCase()}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Server Control Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Power className="w-5 h-5 text-purple-400" />
              Server Control
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="font-medium text-lg">{serverStatus === 'running' ? 'Active' : 'Inactive'}</p>
                </div>
                <button
                  onClick={handleToggleServer}
                  disabled={serverStatus === 'starting' || serverStatus === 'stopping'}
                  className={`p-3 rounded-full transition-all ${
                    serverStatus === 'running' 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {serverStatus === 'running' ? <StopCircle size={24} /> : <Play size={24} />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Port</p>
                  <p className="font-mono text-lg text-blue-300">{port}</p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Local IP</p>
                  <p className="font-mono text-lg text-blue-300">{ipAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Info Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-400" />
              Connect Device
            </h2>
            
            <div className="flex flex-col gap-4 h-full">
              <p className="text-gray-300">
                Open the following URL on your phone or tablet to control your deck:
              </p>
              
              <div className="bg-black/40 p-4 rounded-lg border border-gray-700 font-mono text-center text-lg text-green-400 select-all cursor-pointer hover:bg-black/60 transition-colors">
                http://{ipAddress}:{port}
              </div>

              <div className="mt-auto">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Troubleshooting</h3>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>Ensure devices are on the same Wi-Fi network</li>
                  <li>Check firewall settings if unable to connect</li>
                  <li>Restart server if issues persist</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Console */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              Server Logs
            </h2>
            <button 
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} /> Clear
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4 bg-black/80 font-mono text-xs text-gray-300 space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-600 italic">No logs available...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="break-all border-b border-gray-800/50 pb-0.5 mb-0.5 last:border-0">
                  <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
