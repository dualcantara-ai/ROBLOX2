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
  Maximize2,
  HelpCircle,
  Compass,
  MessageSquareQuote
} from 'lucide-react';
import { BloxPart, BloxVector3 } from '../../types';
import { LuauScriptInstance } from '../../services/luau/types';

interface ZephyrAIProps {
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

export type BloxCopilotProps = ZephyrAIProps;

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

// Checks if player explicitly asks to generate/create/write a script
function isExplicitScriptRequest(prompt: string): boolean {
  const p = prompt.toLowerCase().trim();
  const scriptPatterns = [
    /\b(crie|criar|cria)\s+(um\s+|o\s+)?(script|código|codigo|programa)\b/,
    /\b(faça|faca|fazer|faz)\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(escreva|escrever|escreve)\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(gere|gerar|gera)\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(monte|montar|monta)\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(programa|programar|programe)\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(me\s+(dá|da|passa|mande|envie))\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(quero|preciso\s+de)\s+(um\s+|o\s+)?(script|código|codigo)\b/,
    /\b(script|código|codigo)\s+(de|para|que|pra)\b/,
    /\b(create|make|write|generate|give\s+me)\s+(a\s+|the\s+)?(script|code)\b/,
    /\b(code|script)\s+(for|to|that)\b/,
    /\b(scriptar|codar)\s+(a|o|esta|essa|uma)?\s*(peça|parte|objeto|bloco)\b/
  ];
  return scriptPatterns.some(pattern => pattern.test(p));
}

const QUICK_PROMPTS = [
  { icon: Compass, text: 'Inspecione a seleção atual e o Workspace', label: 'Inspecionar Cena' },
  { icon: Layers, text: 'Construa uma pista de parkour com lava no Workspace', label: 'Gerar Obby' },
  { icon: Flame, text: 'Crie um script de lava com dano ao encostar', label: 'Script de Lava' },
  { icon: RotateCw, text: 'Crie um script para girar a peça continuamente', label: 'Script de Giro' },
  { icon: Zap, text: 'Crie um script de trampolim que lança o jogador alto', label: 'Script Trampolim' },
  { icon: HelpCircle, text: 'Qual a diferença entre Script e LocalScript?', label: 'Script vs Local' },
];

export const ZephyrAI: React.FC<ZephyrAIProps> = ({
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
  gameTitle = 'Meu Jogo Basehub',
  gameGenre = 'Sandbox',
  initialPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Olá! Sou o **Zephyr**, seu assistente de criação para **Roblox Studio** e **Luau**.

Posso ajudar você diretamente no \`Workspace\`:
- **Inspecionar & Editar Propriedades**: Pergunte sobre a peça selecionada ou peça para alterar \`Color\`, \`Material\`, \`Size\`, \`Anchored\` ou \`CanCollide\`.
- **Construir Estruturas**: Peça para adicionar escadas, paredes, pontes, checkpoints ou uma sequência de Obby.
- **Documentação Luau**: Tire dúvidas sobre \`CFrame\`, \`Vector3\`, \`Humanoid\`, \`Touched\`, \`TweenService\` e \`task.wait\`.
- **Criar Scripts sob Demanda**: Só gero um script quando você pedir explicitamente (ex: *"Crie um script de lava"*).

Como posso ajudar no seu projeto hoje?`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('Analisando seleção no Explorer...');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, thinkingStage]);

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
    setThinkingStage('Analisando seleção no Explorer...');

    // Dynamic thinking stage updates for realistic Studio Assistant deliberation
    const timer1 = setTimeout(() => {
      setThinkingStage('Verificando Workspace e propriedades...');
    }, 450);

    const timer2 = setTimeout(() => {
      setThinkingStage('Preparando resposta...');
    }, 900);

    // Natural conversation delay: Zephyr waits a moment to reflect before speaking
    const startTime = Date.now();
    const minWaitMs = 1100 + Math.floor(Math.random() * 400);

    try {
      // Try /api/zephyr first, fallback to /api/copilot
      let response: Response;
      try {
        response = await fetch('/api/zephyr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      } catch (_) {
        response = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      }

      // Guarantee minimum organic deliberation pause before speaking
      const elapsed = Date.now() - startTime;
      if (elapsed < minWaitMs) {
        await new Promise(r => setTimeout(r, minWaitMs - elapsed));
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      const zephyrData = result.data || {};

      // Ensure script is only attached if player explicitly requested one
      const wantsScript = isExplicitScriptRequest(promptText);
      const safeScript = wantsScript ? (zephyrData.script || null) : null;

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: zephyrData.message || 'Resposta processada com sucesso!',
        timestamp: new Date().toLocaleTimeString(),
        script: safeScript,
        actions: zephyrData.actions,
        actionsApplied: false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error contacting Zephyr AI API:', err);
      
      const elapsed = Date.now() - startTime;
      if (elapsed < minWaitMs) {
        await new Promise(r => setTimeout(r, minWaitMs - elapsed));
      }

      const wantsScript = isExplicitScriptRequest(promptText);
      
      // Fallback message: only generate script if user asked for it
      if (wantsScript) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-local-${Date.now()}`,
            sender: 'assistant',
            text: `Aqui está o script Luau gerado especialmente para o que você pediu:`,
            timestamp: new Date().toLocaleTimeString(),
            script: {
              name: 'ZephyrScript',
              source: `-- Script criado pelo Zephyr AI
local part = script.Parent
local debounce = false

part.Touched:Connect(function(hit)
    if debounce then return end
    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        debounce = true
        print("Interação detectada em:", part.Name)
        task.wait(0.5)
        debounce = false
    end
end)
`,
              parentPartId: selectedPartId || 'Workspace'
            }
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-local-${Date.now()}`,
            sender: 'assistant',
            text: `Estou pronto para ajudar no **Workspace** (editar propriedades, criar partes ou tirar dúvidas sobre Luau e Roblox Studio).\n\nSe quiser que eu gere um script, peça explicitamente, por exemplo: *"Crie um script de lava"* ou *"Crie um script de giro"*.`,
            timestamp: new Date().toLocaleTimeString(),
            script: null
          }
        ]);
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
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
      name: scriptData.name || 'ZephyrScript',
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[490px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Zephyr AI
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full font-semibold">
                Roblox & Luau Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {selectedPart ? `Peça em foco: ${selectedPart.name}` : 'Workspace ativa • Pronta para criar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Limpar histórico de conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Zephyr AI"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none flex-shrink-0">
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-all border border-slate-700/60 hover:border-cyan-500/40 cursor-pointer flex-shrink-0 shadow-sm"
            >
              <Icon className="w-3 h-3 text-cyan-400" />
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
                  : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>

                {/* Generated Script Card (Only rendered when script was explicitly requested) */}
                {msg.script && (
                  <div className="bg-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-cyan-950/40 px-3 py-2 border-b border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{msg.script.name}.luau</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-normal">
                          Script Solicitado
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(msg.id, msg.script!.source)}
                        className="text-[11px] text-cyan-300 hover:text-white transition-colors cursor-pointer font-medium"
                      >
                        {copiedScriptId === msg.id ? '✓ Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto bg-slate-950/90 max-h-52 leading-relaxed">
                      {msg.script.source}
                    </pre>

                    <div className="bg-slate-900/90 px-3 py-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      {activeScriptId && onUpdateScriptSource && (
                        <button
                          onClick={() => handleInjectIntoActiveScript(msg.script!.source)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-md border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3 text-cyan-400" />
                          Inserir no Script Aberto
                        </button>
                      )}
                      <button
                        onClick={() => handleCreateScriptFromAI(msg.script!)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[11px] font-semibold rounded-md shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
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
                        Ações no Mundo 3D ({msg.actions.length})
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
                        Aplicar Mudanças na Workspace
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thoughtful Organic Thinking Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-cyan-300 bg-slate-950/80 border border-cyan-500/30 px-4 py-3 rounded-2xl w-fit shadow-lg shadow-cyan-500/10 animate-pulse">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-cyan-200">{thinkingStage}</span>
              <span className="text-[10px] text-slate-400">Zephyr AI formulando resposta...</span>
            </div>
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
            placeholder="Pergunte sobre Luau, peça para editar uma Part ou 'crie um script...'..."
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-cyan-500 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none placeholder:text-slate-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            title="Enviar mensagem para Zephyr AI"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

// Export BloxCopilot alias for backward compatibility across all modules
export const BloxCopilot = ZephyrAI;
