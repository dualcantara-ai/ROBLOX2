import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Save, 
  Trash2, 
  Sparkles, 
  X, 
  FileCode, 
  Check, 
  AlertCircle, 
  Terminal, 
  Copy, 
  RefreshCw,
  FolderTree,
  ChevronDown
} from 'lucide-react';
import { BloxPart, BloxVector3 } from '../../types';
import { LuauScriptInstance, LuauLogEntry } from '../../services/luau/types';
import { LUAU_TEMPLATES } from '../../services/luau/luauTemplates';
import { luauEngine } from '../../services/luau/luauRuntime';

interface ScriptEditorModalProps {
  script: LuauScriptInstance;
  parts: BloxPart[];
  isOpen: boolean;
  onClose: () => void;
  onSaveScript: (updatedScript: LuauScriptInstance) => void;
  onDeleteScript: (scriptId: string) => void;
  onUpdatePart: (partId: string, partial: Partial<BloxPart>) => void;
  onAddPart: (part: BloxPart) => void;
  onRemovePart: (partId: string) => void;
  onOpenCopilotWithPrompt?: (prompt: string) => void;
  playerPos?: BloxVector3;
}

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  script,
  parts,
  isOpen,
  onClose,
  onSaveScript,
  onDeleteScript,
  onUpdatePart,
  onAddPart,
  onRemovePart,
  onOpenCopilotWithPrompt
}) => {
  const [source, setSource] = useState(script.source);
  const [name, setName] = useState(script.name);
  const [parentPartId, setParentPartId] = useState(script.parentPartId || 'Workspace');
  const [enabled, setEnabled] = useState(script.enabled);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LuauLogEntry[]>([]);
  const [activeLogFilter, setActiveLogFilter] = useState<'all' | 'print' | 'warn' | 'error'>('all');
  const [copied, setCopied] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync state when script changes
  useEffect(() => {
    setSource(script.source);
    setName(script.name);
    setParentPartId(script.parentPartId || 'Workspace');
    setEnabled(script.enabled);
  }, [script]);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle running script directly inside editor
  const handleRunScript = async () => {
    setIsRunning(true);
    setLogs(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: `[Studio] Executando script: ${name}...`,
        scriptId: script.id,
        scriptName: name
      }
    ]);

    const currentScript: LuauScriptInstance = {
      ...script,
      name,
      source,
      parentPartId,
      enabled: true
    };

    const targetPart = parts.find(p => p.id === parentPartId);

    await luauEngine.executeScript(currentScript, {
      scriptId: script.id,
      scriptName: name,
      parentPart: targetPart,
      parts,
      onUpdatePart,
      onAddPart,
      onRemovePart,
      onLog: (entry) => {
        setLogs(prev => [...prev.slice(-150), entry]);
      }
    });
  };

  const handleStopScript = () => {
    luauEngine.stopScript(script.id);
    setIsRunning(false);
    setLogs(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: `[Studio] Script ${name} interrompido.`,
        scriptId: script.id,
        scriptName: name
      }
    ]);
  };

  const handleSave = () => {
    const updated: LuauScriptInstance = {
      ...script,
      name,
      source,
      parentPartId,
      enabled
    };
    onSaveScript(updated);
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = LUAU_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setSource(tpl.code);
      setSelectedTemplateId(templateId);
      setLogs(prev => [
        ...prev,
        {
          id: `tpl-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'info',
          message: `[Template] Carregado template "${tpl.name}".`
        }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Support TAB indentation inside code editor
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newSource = source.substring(0, start) + '    ' + source.substring(end);
      setSource(newSource);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    if (activeLogFilter === 'all') return true;
    return l.type === activeLogFilter;
  });

  const parentPart = parts.find(p => p.id === parentPartId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header Bar (Roblox Studio Script Editor style) */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 text-sm font-bold text-white px-2.5 py-1 rounded-md outline-none focus:border-blue-500 transition-all"
                  placeholder="Nome do Script"
                />
                <span className="text-xs text-slate-400 font-mono">.luau</span>
                {isRunning ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Executando
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Pronto
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Instância: <strong className="text-slate-300">Script</strong></span>
                <span>•</span>
                <span>Parent: <strong className="text-blue-400">{parentPart ? parentPart.name : 'Workspace'}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={handleStopScript}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Parar
              </button>
            ) : (
              <button
                onClick={handleRunScript}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Executar
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar
            </button>

            {onOpenCopilotWithPrompt && (
              <button
                onClick={() => {
                  onOpenCopilotWithPrompt(`Melhore ou me ajude a scriptar o código do script "${name}":\n\n\`\`\`luau\n${source}\n\`\`\``);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                title="Pedir ajuda ao Copilot AI para este script"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Copilot IA
              </button>
            )}

            <button
              onClick={() => onDeleteScript(script.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Excluir Script"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Templates, Parent selector, Quick tools */}
        <div className="bg-slate-900/90 px-5 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Modelos Prontos:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Selecione um template Luau...</option>
                {LUAU_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>

            {/* Parent Part Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Associar Peça:</span>
              <select
                value={parentPartId}
                onChange={(e) => setParentPartId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 outline-none focus:border-blue-500 cursor-pointer max-w-[180px] truncate"
              >
                <option value="Workspace">Workspace (Global)</option>
                {parts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Habilitado</span>
            </label>
          </div>
        </div>

        {/* Main Work Area: Code Editor & Output Terminal */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Code Textarea Area */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
            <div className="flex-1 flex overflow-hidden relative">
              {/* Line numbers column */}
              <div className="w-12 bg-slate-950/80 border-r border-slate-800/80 py-3 text-right pr-3 select-none text-[12px] font-mono text-slate-600 flex-shrink-0">
                {source.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">{i + 1}</div>
                ))}
              </div>

              {/* Editable code textarea */}
              <textarea
                ref={textareaRef}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 bg-transparent p-3 text-[13px] font-mono text-slate-100 outline-none resize-none leading-6 whitespace-pre tab-[4] selection:bg-blue-600/40"
                placeholder="-- Digite seu código Luau aqui..."
              />
            </div>

            {/* Quick Lua Helpers footer */}
            <div className="bg-slate-900/60 border-t border-slate-800/60 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3 font-mono">
                <span>Luau 5.1/Roblox</span>
                <span>•</span>
                <span>Linhas: {source.split('\n').length}</span>
                <span>•</span>
                <span>Tamanho: {source.length} chars</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Dica: Suporta script.Parent.Touched:Connect, Vector3, Color3, task.wait</span>
              </div>
            </div>
          </div>

          {/* Terminal / Output Dock (Roblox Output Window) */}
          <div className="w-full md:w-96 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col flex-shrink-0">
            {/* Terminal Header */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Console de Saída (Output)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogs([])}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="bg-slate-900/40 px-3 py-1.5 border-b border-slate-800/60 flex items-center gap-1.5 text-[11px]">
              <button
                onClick={() => setActiveLogFilter('all')}
                className={`px-2 py-0.5 rounded cursor-pointer ${activeLogFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Todos ({logs.length})
              </button>
              <button
                onClick={() => setActiveLogFilter('print')}
                className={`px-2 py-0.5 rounded cursor-pointer ${activeLogFilter === 'print' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Prints
              </button>
              <button
                onClick={() => setActiveLogFilter('warn')}
                className={`px-2 py-0.5 rounded cursor-pointer ${activeLogFilter === 'warn' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Avisos
              </button>
              <button
                onClick={() => setActiveLogFilter('error')}
                className={`px-2 py-0.5 rounded cursor-pointer ${activeLogFilter === 'error' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Erros
              </button>
            </div>

            {/* Log Stream */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1.5 bg-slate-950">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-600 italic text-center py-8">
                  Nenhuma mensagem no console.<br/>
                  Clique em "Executar" para testar o script!
                </div>
              ) : (
                filteredLogs.map(log => {
                  let colorClass = 'text-slate-300';
                  let icon = '>';
                  if (log.type === 'error') {
                    colorClass = 'text-rose-400 font-semibold';
                    icon = '❌';
                  } else if (log.type === 'warn') {
                    colorClass = 'text-amber-300';
                    icon = '⚠️';
                  } else if (log.type === 'info') {
                    colorClass = 'text-blue-400 italic';
                    icon = 'ℹ️';
                  }

                  return (
                    <div key={log.id} className={`flex items-start gap-1.5 leading-tight ${colorClass}`}>
                      <span className="text-slate-600 select-none text-[10px]">{log.timestamp}</span>
                      <span className="select-none">{icon}</span>
                      <span className="flex-1 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
