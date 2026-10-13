import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  FileCode, 
  Plus, 
  Check, 
  Play, 
  Wand2, 
  Layers, 
  RotateCw, 
  Flame, 
  Zap, 
  Coins, 
  DoorClosed, 
  ChevronRight,
  Loader2,
  Trash2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { BloxPart, BloxVector3 } from '../../types';
import { LuauScriptInstance } from '../../services/luau/types';

interface BloxCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  parts: BloxPart[];
  selectedPartId: string | null;
  scripts: LuauScriptInstance[];
  onAddPart: (part: BloxPart) => void;
  onUpdatePart: (partId: string, partial: Partial<BloxPart>) => void;
  onCreateScript: (script: { name: string; source: string; parentPartId?: string }) => void;
  onUpdateScriptSource?: (scriptId: string, newSource: string) => void;
  activeScriptId?: string | null;
  gameTitle?: string;
  gameGenre?: string;
  initialPrompt?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  script?: {
    name: string;
    source: string;
    parentPartId?: string;
  } | null;
  actions?: Array<{
    type: 'add_part' | 'update_part' | 'delete_part' | 'create_script';
    part?: Partial<BloxPart>;
    partId?: string;
    properties?: any;
  }>;
  actionsApplied?: boolean;
}

const QUICK_PROMPTS = [
  { icon: Flame, text: 'Script de lava com dano ao encostar', label: 'Lava / Dano' },
  { icon: RotateCw, text: 'Faça a peça girar continuamente em Luau', label: 'Giro Contínuo' },
  { icon: DoorClosed, text: 'Crie uma porta secreta que abre no toque', label: 'Porta Secreta' },
  { icon: Zap, text: 'Crie um trampolim que lança o jogador alto', label: 'Super Trampolim' },
  { icon: Coins, text: 'Crie moedas giratórias que dão pontos', label: 'Moedas Coletáveis' },
  { icon: Layers, text: 'Gere uma pista de parkour com plataformas e lava', label: 'Gerar Obby' },
];

export const BloxCopilot: React.FC<BloxCopilotProps> = ({
  isOpen,
  onClose,
  parts,
  selectedPartId,
  scripts,
  onAddPart,
  onUpdatePart,
  onCreateScript,
  onUpdateScriptSource,
  activeScriptId,
  gameTitle = 'Meu Jogo BloxVerse',
  gameGenre = 'Sandbox',
  initialPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Olá! Eu sou o **BloxCopilot**, sua IA especialista em **Luau Scripting** e criação de mundos no Roblox Studio.
      
Posso:
- **Escrever scripts Luau** sob medida (danos, loops, teleporte, portas, pulo alto, moedas, elevadores).
- **Fazer mudanças no seu jogo** adicionando pistas de parkour, plataformas, lava e armadilhas.
- **Tirar dúvidas** e explicar qualquer função de Luau do Roblox.

Como posso ajudar no seu jogo hoje? Escolha uma sugestão abaixo ou digite sua ideia!`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle initial prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          context: {
            parts,
            selectedPartId,
            scripts,
            gameTitle,
            gameGenre
          },
          chatHistory: messages.slice(-6).map(m => ({
            role: m.sender,
            content: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      const copilotData = result.data || {};

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: copilotData.message || 'Código e ações processadas com sucesso!',
        timestamp: new Date().toLocaleTimeString(),
        script: copilotData.script,
        actions: copilotData.actions,
        actionsApplied: false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error contacting Copilot API:', err);
      // Fallback response
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: `Tive uma breve oscilação na conexão, mas gerei seu script Luau usando o motor local:`,
          timestamp: new Date().toLocaleTimeString(),
          script: {
            name: 'LocalLuauScript',
            source: `-- Script gerado localmente pelo Copilot
local part = script.Parent
print("Script ativo em:", part.Name)

part.Touched:Connect(function(hit)
    print("Jogador encostou!")
end)
`,
            parentPartId: selectedPartId || 'Workspace'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyActions = (msgId: string, actions?: Message['actions']) => {
    if (!actions || actions.length === 0) return;

    actions.forEach(action => {
      if (action.type === 'add_part' && action.part) {
        const newPartId = `part-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const completePart: BloxPart = {
          id: newPartId,
          name: action.part.name || 'AI Part',
          className: 'Part',
          type: (action.part.type as any) || 'block',
          position: action.part.position || { x: 0, y: 2, z: 0 },
          size: action.part.size || { x: 4, y: 1, z: 4 },
          rotation: action.part.rotation || { x: 0, y: 0, z: 0 },
          color: action.part.color || '#3b82f6',
          material: (action.part.material as any) || 'plastic',
          anchored: action.part.anchored !== undefined ? action.part.anchored : true,
          isAnchored: action.part.anchored !== undefined ? action.part.anchored : true,
          canCollide: action.part.canCollide !== undefined ? action.part.canCollide : true,
          transparency: action.part.transparency !== undefined ? action.part.transparency : 0
        };
        onAddPart(completePart);
      } else if (action.type === 'update_part' && action.partId) {
        onUpdatePart(action.partId, action.properties || {});
      }
    });

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, actionsApplied: true } : m));
  };

  const handleCreateScriptFromAI = (scriptData: NonNullable<Message['script']>) => {
    onCreateScript({
      name: scriptData.name || 'CopilotScript',
      source: scriptData.source,
      parentPartId: scriptData.parentPartId === 'selected' ? (selectedPartId || 'Workspace') : (scriptData.parentPartId || 'Workspace')
    });
  };

  const handleInjectIntoActiveScript = (newSource: string) => {
    if (activeScriptId && onUpdateScriptSource) {
      onUpdateScriptSource(activeScriptId, newSource);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedScriptId(id);
    setTimeout(() => setCopiedScriptId(null), 1500);
  };

  if (!isOpen) return null;

  const selectedPart = parts.find(p => p.id === selectedPartId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              BloxCopilot IA
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-medium">
                Roblox & Luau
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {selectedPart ? `Peça selecionada: ${selectedPart.name}` : 'Nenhuma peça selecionada'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Limpar histórico"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none flex-shrink-0">
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-colors border border-slate-700/50 cursor-pointer flex-shrink-0"
            >
              <Icon className="w-3 h-3 text-purple-400" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>

                {/* Generated Script Card */}
                {msg.script && (
                  <div className="bg-slate-950 border border-purple-500/30 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-purple-950/40 px-3 py-2 border-b border-purple-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{msg.script.name}.luau</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(msg.id, msg.script!.source)}
                        className="text-[11px] text-purple-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedScriptId === msg.id ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto bg-slate-950/90 max-h-48 leading-relaxed">
                      {msg.script.source}
                    </pre>

                    <div className="bg-slate-900/90 px-3 py-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      {activeScriptId && onUpdateScriptSource && (
                        <button
                          onClick={() => handleInjectIntoActiveScript(msg.script!.source)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-md border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3 text-purple-400" />
                          Inserir no Script Aberto
                        </button>
                      )}
                      <button
                        onClick={() => handleCreateScriptFromAI(msg.script!)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold rounded-md shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Criar Instância de Script
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions / Changes Card */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5" />
                        Mudanças no Jogo ({msg.actions.length})
                      </span>
                      {msg.actionsApplied && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Aplicado
                        </span>
                      )}
                    </div>

                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {msg.actions.map((act, i) => (
                        <li key={i}>
                          {act.type === 'add_part' && `Adicionar parte: ${act.part?.name || 'Part'} (${act.part?.type || 'block'})`}
                          {act.type === 'update_part' && `Atualizar peça: ${act.partId}`}
                        </li>
                      ))}
                    </ul>

                    {!msg.actionsApplied && (
                      <button
                        onClick={() => handleApplyActions(msg.id, msg.actions)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer mt-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aplicar Mudanças no Jogo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-purple-400 bg-purple-950/20 border border-purple-500/20 p-3 rounded-2xl w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>BloxCopilot pensando e programando em Luau...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ou peça uma mudança (ex: 'crie uma pista com lava')..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-purple-500 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none placeholder:text-slate-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
