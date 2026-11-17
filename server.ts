import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

interface ZephyrRequestBody {
  prompt: string;
  context?: {
    parts?: any[];
    selectedPartId?: string | null;
    scripts?: any[];
    gameTitle?: string;
    gameGenre?: string;
  };
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Checks if the user explicitly requested to create/write/generate a script or code.
 * If false, Zephyr AI responds as a Roblox Studio Assistant without generating a script card.
 */
export function isExplicitScriptRequest(prompt: string): boolean {
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

/**
 * Zephyr AI request handler (100% standalone Roblox Studio Assistant engine)
 */
async function handleZephyrAIRequest(req: Request, res: Response) {
  const { prompt, context, chatHistory }: ZephyrRequestBody = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const parts = Array.isArray(context?.parts) ? context.parts : [];
  const scripts = Array.isArray(context?.scripts) ? context.scripts : [];
  const selectedPart = parts.find((p: any) => p.id === context?.selectedPartId) || null;
  const wantsScript = isExplicitScriptRequest(prompt);

  const response = generateZephyrStudioAssistantResponse(
    prompt,
    selectedPart,
    parts,
    scripts,
    chatHistory || [],
    context?.gameTitle || 'Experience',
    wantsScript
  );

  // Enforce strict rule: never attach a script unless explicitly requested
  if (!wantsScript) {
    response.script = null;
  }

  return res.json({
    success: true,
    data: response
  });
}

// Mount Zephyr AI endpoints
app.post('/api/zephyr', handleZephyrAIRequest);
app.post('/api/copilot', handleZephyrAIRequest);

/**
 * Parses Luau source code pasted in a prompt to provide real Roblox Studio Assistant diagnostics
 */
function analyzeLuauCode(source: string): string {
  const findings: string[] = [];
  const lines = source.split('\n');

  if (/\bwait\s*\(/.test(source) && !/\btask\.wait\s*\(/.test(source)) {
    findings.push('- **Uso de `wait()` legado**: Substitua `wait()` por `task.wait()` para sincronizar diretamente com o Heartbeat da engine sem atrasos.');
  }
  if (/\bspawn\s*\(/.test(source) && !/\btask\.spawn\s*\(/.test(source)) {
    findings.push('- **Uso de `spawn()` legado**: Prefira `task.spawn()` para iniciar threads imediatamente no mesmo frame.');
  }
  if (/while\s+true\s+do/i.test(source) && !/(task\.wait|wait)\s*\(/.test(source)) {
    findings.push('- **Aviso Crítico de Loop Infinito**: Há um `while true do` sem `task.wait()` dentro. Isso pode travar a execução do script (*Script timeout*).');
  }
  if (/\.Touched\s*:[Cc]onnect/.test(source)) {
    if (!/FindFirstChild\s*\(\s*["']Humanoid["']\s*\)|FindFirstChildWhichIsA\s*\(\s*["']Humanoid["']\s*\)/.test(source)) {
      findings.push('- **Validação no `.Touched`**: Adicione `local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")` para garantir que apenas personagens ativem o evento.');
    }
    if (!/debounce|cooldown|canDamage|isOpened|isTriggered|collected/i.test(source)) {
      findings.push('- **Controle de Debounce**: Eventos `.Touched` disparam várias vezes seguidas por frame. Considere usar uma variável `local debounce = false` para evitar repetições.');
    }
  }

  // Check basic block balance
  const openers = (source.match(/\b(function|if|while|for|do)\b/g) || []).length;
  const repeats = (source.match(/\brepeat\b/g) || []).length;
  const ends = (source.match(/\bend\b/g) || []).length;
  const untils = (source.match(/\buntil\b/g) || []).length;
  // Note: `while ... do` and `for ... do` count both keyword and `do`, so adjust by counting ` do\b` inside `while`/`for`
  const loopDos = (source.match(/\b(while|for)\b[^\n]*\bdo\b/g) || []).length;
  const expectedEnds = Math.max(0, openers - loopDos);

  if (expectedEnds > ends) {
    findings.push(`- **Estrutura de Blocos**: Possível falta de \`end\` no código (detectados ${ends} fechamentos para ~${expectedEnds} blocos abertos).`);
  }
  if (repeats > untils) {
    findings.push('- **Bloco `repeat` incompleto**: Todo `repeat` precisa terminar com `until <condição>`.');
  }

  if (findings.length === 0) {
    return `Revisei as **${lines.length} linhas** do seu código Luau e a estrutura está limpa:
- Sintaxe de blocos e eventos consistente.
- Referências da hierarquia (\`script.Parent\`, eventos e funções) bem organizadas.
- Se quiser que eu reescreva ou crie um novo script com alguma mecânica adicional, basta pedir *"Crie um script..."*.`;
  }

  return `Analisei o script enviado (**${lines.length} linhas**) e encontrei os seguintes pontos de melhoria para o Roblox Studio:\n\n${findings.join('\n')}\n\nSe quiser que eu gere a versão corrigida como uma nova instância, peça: *"Crie um script corrigido para..."*.`;
}

/**
 * Extracts color update intent from natural language
 */
function detectColorUpdate(p: string): { hex: string; label: string } | null {
  const map: Array<{ keys: string[]; hex: string; label: string }> = [
    { keys: ['vermelh', 'red'], hex: '#ef4444', label: 'Vermelho' },
    { keys: ['azul', 'blue'], hex: '#3b82f6', label: 'Azul' },
    { keys: ['verde', 'green'], hex: '#22c55e', label: 'Verde' },
    { keys: ['amarel', 'yellow'], hex: '#eab308', label: 'Amarelo' },
    { keys: ['rox', 'purple', 'violet'], hex: '#a855f7', label: 'Roxo' },
    { keys: ['laranj', 'orange'], hex: '#f97316', label: 'Laranja' },
    { keys: ['ros', 'pink'], hex: '#ec4899', label: 'Rosa' },
    { keys: ['cian', 'cyan', 'turquesa'], hex: '#06b6d4', label: 'Ciano' },
    { keys: ['dourad', 'ouro', 'gold'], hex: '#fbbf24', label: 'Dourado' },
    { keys: ['branc', 'white'], hex: '#ffffff', label: 'Branco' },
    { keys: ['pret', 'black', 'escur'], hex: '#111827', label: 'Preto' },
    { keys: ['cinz', 'gray', 'grey'], hex: '#64748b', label: 'Cinza' },
  ];
  for (const entry of map) {
    if (entry.keys.some(k => p.includes(k))) {
      return { hex: entry.hex, label: entry.label };
    }
  }
  return null;
}

/**
 * Detects material change intent
 */
function detectMaterialUpdate(p: string): string | null {
  if (p.includes('neon')) return 'neon';
  if (p.includes('metal') || p.includes('ferro') || p.includes('aço')) return 'metal';
  if (p.includes('vidro') || p.includes('glass')) return 'glass';
  if (p.includes('madeira') || p.includes('wood')) return 'wood';
  if (p.includes('tijolo') || p.includes('brick')) return 'brick';
  if (p.includes('plastico') || p.includes('plástico') || p.includes('plastic')) return 'plastic';
  if (p.includes('forcefield') || p.includes('energia')) return 'forcefield';
  return null;
}

/**
 * Core Roblox Studio Assistant Engine (Zephyr AI)
 */
function generateZephyrStudioAssistantResponse(
  prompt: string,
  selectedPart: any,
  currentParts: any[],
  currentScripts: any[],
  chatHistory: Array<{ role: string; content: string }>,
  gameTitle: string,
  wantsScript: boolean
): {
  message: string;
  script: { name: string; source: string; parentPartId?: string } | null;
  actions: Array<any>;
} {
  const p = prompt.toLowerCase().trim();

  // --------------------------------------------------------------------------
  // 1. CODE ANALYSIS MODE (When user clicks "Zephyr AI" from Script Editor or pastes code)
  // --------------------------------------------------------------------------
  const codeBlockMatch = prompt.match(/```(?:luau|lua)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && !wantsScript) {
    const code = codeBlockMatch[1].trim();
    return {
      message: analyzeLuauCode(code),
      script: null,
      actions: []
    };
  }

  // --------------------------------------------------------------------------
  // 2. NON-SCRIPT MODE: ROBLOX STUDIO ASSISTANT (Inspect, Edit, Build, Explain)
  // --------------------------------------------------------------------------
  if (!wantsScript) {
    // 2A. Direct Property Editing on Selected Part (Roblox Studio Assistant style)
    const isEditVerb = /\b(mude|mudar|alter|troc|deix|coloque|colocar|bota|botar|faça|fazer|ajuste|transforme|torne|pinte|pintar|aument|diminu|ancor|desancor|solt)\b/.test(p);
    const refersToPart = /\b(peça|peca|bloco|parte|part|selecionad|ela|esse|essa|este|esta|objeto|cor|material|tamanho|transpar|colis|ancor)\b/.test(p);

    if (selectedPart && isEditVerb && refersToPart) {
      const updates: Record<string, any> = {};
      const summaryLines: string[] = [];

      const colorMatch = detectColorUpdate(p);
      if (colorMatch) {
        updates.color = colorMatch.hex;
        summaryLines.push(`- **Color**: alterado para \`${colorMatch.label}\` (${colorMatch.hex})`);
      }

      const matMatch = detectMaterialUpdate(p);
      if (matMatch) {
        updates.material = matMatch;
        summaryLines.push(`- **Material**: alterado para \`${matMatch}\``);
      }

      if (p.includes('invisivel') || p.includes('invisível')) {
        updates.transparency = 1;
        summaryLines.push(`- **Transparency**: \`1\` (invisível)`);
      } else if (p.includes('transparent') || p.includes('vidro')) {
        updates.transparency = 0.65;
        summaryLines.push(`- **Transparency**: \`0.65\``);
      } else if (p.includes('opac') || p.includes('visivel') || p.includes('visível')) {
        updates.transparency = 0;
        summaryLines.push(`- **Transparency**: \`0\` (opaco)`);
      }

      if (p.includes('sem colis') || p.includes('atravess') || p.includes('cancollide false')) {
        updates.canCollide = false;
        summaryLines.push(`- **CanCollide**: \`false\``);
      } else if (p.includes('com colis') || p.includes('solido') || p.includes('sólido') || p.includes('cancollide true')) {
        updates.canCollide = true;
        summaryLines.push(`- **CanCollide**: \`true\``);
      }

      if (p.includes('desancor') || p.includes('solt') || p.includes('cair') || p.includes('anchored false')) {
        updates.anchored = false;
        updates.isAnchored = false;
        summaryLines.push(`- **Anchored**: \`false\` (física dinâmica ativada)`);
      } else if (p.includes('ancor') || p.includes('travar') || p.includes('fixar') || p.includes('anchored true')) {
        updates.anchored = true;
        updates.isAnchored = true;
        summaryLines.push(`- **Anchored**: \`true\``);
      }

      if (p.includes('maior') || p.includes('grand') || p.includes('dobrar') || p.includes('aument')) {
        const s = selectedPart.size || { x: 4, y: 1, z: 4 };
        updates.size = { x: +(s.x * 1.5).toFixed(1), y: +(s.y * 1.5).toFixed(1), z: +(s.z * 1.5).toFixed(1) };
        summaryLines.push(`- **Size**: expandido para \`${updates.size.x}, ${updates.size.y}, ${updates.size.z}\``);
      } else if (p.includes('menor') || p.includes('pequen') || p.includes('diminu')) {
        const s = selectedPart.size || { x: 4, y: 1, z: 4 };
        updates.size = { x: Math.max(0.5, +(s.x * 0.65).toFixed(1)), y: Math.max(0.5, +(s.y * 0.65).toFixed(1)), z: Math.max(0.5, +(s.z * 0.65).toFixed(1)) };
        summaryLines.push(`- **Size**: reduzido para \`${updates.size.x}, ${updates.size.y}, ${updates.size.z}\``);
      }

      if (Object.keys(updates).length > 0) {
        return {
          message: `Preparei as alterações de propriedade para a instância **${selectedPart.name}** (\`Workspace.${selectedPart.name}\`):\n\n${summaryLines.join('\n')}\n\nClique em **Aplicar Mudanças na Workspace** abaixo para confirmar no estúdio.`,
          script: null,
          actions: [
            {
              type: 'update_part',
              partId: selectedPart.id,
              properties: updates
            }
          ]
        };
      }
    }

    // 2B. Building Structures / Objects directly in Workspace (without generating scripts)
    const isBuildCommand = /\b(crie|criar|cria|gere|gerar|gera|construa|construir|monte|montar|adicione|adicionar|coloque|colocar|faça|fazer|faz)\b/.test(p);

    if (isBuildCommand && (p.includes('obby') || p.includes('parkour') || p.includes('obstaculo') || p.includes('obstáculo') || p.includes('fase'))) {
      const baseZ = currentParts.length ? Math.min(...currentParts.map((pt: any) => pt.position?.z ?? 0)) - 8 : -8;
      return {
        message: `Montei uma sequência de **Parkour / Obby** pronta para inserir no \`Workspace\`:\n\n1. **Parkour Platform 1** (ponto de entrada verde)\n2. **Lava Gap** (obstáculo neon com dano)\n3. **Parkour Platform 2** (plataforma elevada)\n4. **Reward Coin** (moeda coletável no topo)\n\nClique em **Aplicar Mudanças na Workspace** para gerar as instâncias na cena.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: 'Parkour Platform 1',
              type: 'block',
              position: { x: 0, y: 2, z: baseZ },
              size: { x: 5, y: 1, z: 5 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#10b981',
              material: 'plastic',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'Lava Gap',
              type: 'killbrick',
              position: { x: 0, y: 0.5, z: baseZ - 6 },
              size: { x: 8, y: 0.8, z: 4 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#ef4444',
              material: 'neon',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'Parkour Platform 2',
              type: 'block',
              position: { x: 4, y: 4, z: baseZ - 12 },
              size: { x: 4, y: 1, z: 4 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#f59e0b',
              material: 'plastic',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'Reward Coin',
              type: 'coin',
              position: { x: 4, y: 6, z: baseZ - 12 },
              size: { x: 1.5, y: 1.5, z: 0.4 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#fbbf24',
              material: 'neon',
              anchored: true,
              canCollide: false,
              transparency: 0
            }
          }
        ]
      };
    }

    if (isBuildCommand && (p.includes('escada') || p.includes('stairs') || p.includes('degrau'))) {
      const origin = selectedPart?.position || { x: 0, y: 1, z: -8 };
      const steps = Array.from({ length: 5 }, (_, idx) => ({
        type: 'add_part',
        part: {
          name: `Degrau_${idx + 1}`,
          type: 'block',
          position: { x: origin.x, y: origin.y + idx * 1.2, z: origin.z - idx * 2.2 },
          size: { x: 5, y: 1, z: 2.4 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#64748b',
          material: 'plastic',
          anchored: true,
          canCollide: true,
          transparency: 0
        }
      }));
      return {
        message: `Criei uma **Escada de 5 degraus** ancorada no \`Workspace\` a partir da posição (${origin.x}, ${origin.y}, ${origin.z}). Aplique abaixo para inserir as partes.`,
        script: null,
        actions: steps
      };
    }

    if (isBuildCommand && (p.includes('parede') || p.includes('muro') || p.includes('wall'))) {
      const origin = selectedPart?.position || { x: 0, y: 4, z: -10 };
      const colorMatch = detectColorUpdate(p);
      return {
        message: `Preparei uma instância **Wall** (\`Part\`, \`Brick\`) com \`Anchored = true\` e \`CanCollide = true\`. Clique abaixo para adicionar ao \`Workspace\`.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: 'Wall',
              type: 'block',
              position: { x: origin.x, y: Math.max(4, origin.y), z: origin.z - 4 },
              size: { x: 14, y: 8, z: 1.5 },
              rotation: { x: 0, y: 0, z: 0 },
              color: colorMatch?.hex || '#94a3b8',
              material: 'brick',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          }
        ]
      };
    }

    if (isBuildCommand && (p.includes('ponte') || p.includes('bridge'))) {
      const origin = selectedPart?.position || { x: 0, y: 2, z: -10 };
      return {
        message: `Preparei uma **Ponte de Madeira** (\`Wood\`) com corrimãos laterais para o \`Workspace\`.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: 'BridgeDeck',
              type: 'block',
              position: { x: origin.x, y: origin.y, z: origin.z - 8 },
              size: { x: 6, y: 0.8, z: 16 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#854d0e',
              material: 'wood',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'BridgeRailLeft',
              type: 'block',
              position: { x: origin.x - 2.8, y: origin.y + 1.2, z: origin.z - 8 },
              size: { x: 0.4, y: 1.6, z: 16 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#713f12',
              material: 'wood',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'BridgeRailRight',
              type: 'block',
              position: { x: origin.x + 2.8, y: origin.y + 1.2, z: origin.z - 8 },
              size: { x: 0.4, y: 1.6, z: 16 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#713f12',
              material: 'wood',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          }
        ]
      };
    }

    if (isBuildCommand && (p.includes('checkpoint') || p.includes('spawn'))) {
      const origin = selectedPart?.position || { x: 0, y: 1, z: -12 };
      return {
        message: `Criei uma instância de **Checkpoint** (\`SpawnLocation\`) pronta para adicionar no \`Workspace\`.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: 'Checkpoint',
              type: 'checkpoint',
              position: { x: origin.x, y: origin.y + 0.5, z: origin.z },
              size: { x: 6, y: 0.6, z: 6 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#38bdf8',
              material: 'neon',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          }
        ]
      };
    }

    if (isBuildCommand && (p.includes('arvore') || p.includes('árvore') || p.includes('tree'))) {
      const origin = selectedPart?.position || { x: 6, y: 0, z: -6 };
      return {
        message: `Preparei um modelo simples de **Árvore** (Tronco + Copa) para o \`Workspace\`.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: 'TreeTrunk',
              type: 'cylinder',
              position: { x: origin.x, y: 3, z: origin.z },
              size: { x: 1.5, y: 6, z: 1.5 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#78350f',
              material: 'wood',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'TreeLeaves',
              type: 'sphere',
              position: { x: origin.x, y: 7, z: origin.z },
              size: { x: 6, y: 5, z: 6 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#16a34a',
              material: 'plastic',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          }
        ]
      };
    }

    if (isBuildCommand && (p.includes('casa') || p.includes('house'))) {
      const origin = { x: 10, y: 0, z: -10 };
      return {
        message: `Preparei a estrutura básica de uma **Casa** (Piso, Paredes e Telhado) para inserir no \`Workspace\`.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: 'HouseFloor',
              type: 'block',
              position: { x: origin.x, y: 0.5, z: origin.z },
              size: { x: 14, y: 1, z: 14 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#94a3b8',
              material: 'plastic',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'HouseBackWall',
              type: 'block',
              position: { x: origin.x, y: 4.5, z: origin.z - 6.5 },
              size: { x: 14, y: 7, z: 1 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#cbd5e1',
              material: 'brick',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'HouseLeftWall',
              type: 'block',
              position: { x: origin.x - 6.5, y: 4.5, z: origin.z },
              size: { x: 1, y: 7, z: 14 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#cbd5e1',
              material: 'brick',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'HouseRightWall',
              type: 'block',
              position: { x: origin.x + 6.5, y: 4.5, z: origin.z },
              size: { x: 1, y: 7, z: 14 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#cbd5e1',
              material: 'brick',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          },
          {
            type: 'add_part',
            part: {
              name: 'HouseRoof',
              type: 'block',
              position: { x: origin.x, y: 8.5, z: origin.z },
              size: { x: 15, y: 1, z: 15 },
              rotation: { x: 0, y: 0, z: 0 },
              color: '#b91c1c',
              material: 'plastic',
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          }
        ]
      };
    }

    if (isBuildCommand && (p.includes('peça') || p.includes('peca') || p.includes('bloco') || p.includes('part') || p.includes('plataforma') || p.includes('esfera') || p.includes('bola') || p.includes('rampa'))) {
      const colorMatch = detectColorUpdate(p);
      const matMatch = detectMaterialUpdate(p) || 'plastic';
      const partType = (p.includes('esfera') || p.includes('bola')) ? 'sphere' : p.includes('rampa') ? 'wedge' : 'block';
      return {
        message: `Preparei uma nova instância **Part** (\`${partType}\`, material \`${matMatch}\`) para adicionar ao \`Workspace\`.`,
        script: null,
        actions: [
          {
            type: 'add_part',
            part: {
              name: colorMatch ? `${colorMatch.label}Part` : 'NewPart',
              type: partType,
              position: { x: 0, y: 4, z: -6 },
              size: { x: 4, y: partType === 'block' ? 1.5 : 4, z: 4 },
              rotation: { x: 0, y: 0, z: 0 },
              color: colorMatch?.hex || '#3b82f6',
              material: matMatch,
              anchored: true,
              canCollide: true,
              transparency: 0
            }
          }
        ]
      };
    }

    // 2C. Workspace & Selection Inspector
    if (p.includes('selecionad') || p.includes('propriedad') || p.includes('inspecion') || p.includes('o que tem') || p.includes('quantas') || p.includes('explorer') || p.includes('workspace')) {
      if (selectedPart) {
        return {
          message: `### Inspeção da Instância Selecionada

- **Name**: \`${selectedPart.name}\`
- **ClassName**: \`${selectedPart.className || 'Part'}\` (\`${selectedPart.type}\`)
- **Parent**: \`Workspace\`
- **Position**: \`(${selectedPart.position?.x ?? 0}, ${selectedPart.position?.y ?? 0}, ${selectedPart.position?.z ?? 0})\`
- **Size**: \`(${selectedPart.size?.x ?? 4}, ${selectedPart.size?.y ?? 1}, ${selectedPart.size?.z ?? 4})\`
- **Color**: \`${selectedPart.color}\` | **Material**: \`${selectedPart.material}\`
- **Anchored**: \`${selectedPart.anchored !== false}\` | **CanCollide**: \`${selectedPart.canCollide !== false}\`
- **Transparency**: \`${selectedPart.transparency ?? 0}\`

No total, o projeto **"${gameTitle}"** possui **${currentParts.length} partes** no \`Workspace\` e **${currentScripts.length} scripts**.

Você pode pedir para alterar qualquer propriedade dessa peça (ex: *"Deixe essa peça neon vermelha"* ou *"Crie um script para girar essa peça"*).`,
          script: null,
          actions: []
        };
      }

      const partNames = currentParts.slice(0, 8).map((pt: any) => `\`${pt.name}\``).join(', ');
      return {
        message: `### Resumo do Explorer — ${gameTitle}

- **Workspace**: ${currentParts.length} instâncias (${partNames}${currentParts.length > 8 ? ', ...' : ''})
- **Scripts ativos**: ${currentScripts.length}
- **Seleção atual**: Nenhuma instância selecionada

Selecione uma Part na cena 3D ou no Explorer para inspecionar e editar suas propriedades diretamente.`,
        script: null,
        actions: []
      };
    }

    // 2D. Roblox Studio Knowledge & API Documentation Responses
    if (p.includes('tween') || p.includes('animar') || p.includes('suave')) {
      return {
        message: `### TweenService no Roblox Studio

O **TweenService** interpola propriedades numéricas, vetoriais (\`Vector3\`, \`CFrame\`) ou de cor (\`Color3\`) de forma suave ao longo do tempo.

**Fluxo padrão no Studio:**
1. Obtenha o serviço: \`game:GetService("TweenService")\`
2. Defina a duração e o estilo em \`TweenInfo.new(tempo, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)\`
3. Crie e execute: \`TweenService:Create(part, info, { Position = ... }):Play()\`

Se quiser que eu gere um script pronto usando movimentação suave, peça: *"Crie um script de plataforma móvel"* ou *"Crie um script para animar essa peça"*.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('cframe') || p.includes('coordinateframe')) {
      return {
        message: `### CFrame (CoordinateFrame)

No Roblox Studio, **CFrame** armazena ao mesmo tempo a **posição 3D** e a **rotação** de uma instância (\`BasePart\`, \`Camera\`, etc.).

- **Diferença para \`Position\`**: Alterar \`part.Position\` tenta evitar sobreposição com outras partes sólidas; alterar \`part.CFrame\` move a peça exatamente para a coordenada definida.
- **Uso comum em teleporte**:
  \`humanoidRootPart.CFrame = CFrame.new(0, 10, -25)\`
- **Rotação relativa**:
  \`part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(45), 0)\`

Para aplicar isso em um portal funcional, basta pedir: *"Crie um script de teleporte"*.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('vector3') || p.includes('vetor')) {
      return {
        message: `### Vector3 no Roblox

**Vector3** representa um ponto ou direção nos três eixos (\`X\`, \`Y\`, \`Z\`) em *studs*:
- **\`part.Position\`**: Localização do centro da peça no \`Workspace\`.
- **\`part.Size\`**: Dimensões em largura (\`X\`), altura (\`Y\`) e profundidade (\`Z\`).
- **\`part.Rotation\`**: Ângulos em graus nos três eixos.

Você pode criar um vetor com \`Vector3.new(x, y, z)\` e somar vetores diretamente em Luau.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('humanoid') || p.includes('personagem') || p.includes('player') || p.includes('jogador')) {
      return {
        message: `### Humanoid & Character Model

O **Humanoid** é a instância filha do modelo do personagem (\`Character\`) responsável por controlar movimento, vida e estados físicos:

- **\`Health\` / \`MaxHealth\`**: Vida atual e máxima (padrão \`100\`).
- **\`WalkSpeed\`**: Velocidade de caminhada em studs por segundo (padrão \`16\`).
- **\`JumpPower\`**: Força de salto vertical.
- **\`TakeDamage(amount)\`**: Aplica dano no personagem.
- **\`Died\`**: Evento disparado quando \`Health\` chega a \`0\`.

Para acessar em um evento de toque, use \`hit.Parent:FindFirstChild("Humanoid")\`.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('touched') || p.includes('toque') || p.includes('encostar') || p.includes('colisao') || p.includes('colisão') || p.includes('debounce')) {
      return {
        message: `### Evento \`BasePart.Touched\` e Debounce

O evento **\`Touched\`** dispara sempre que outra \`BasePart\` entra em contato físico com a peça, passando o objeto que colidiu (\`hit\`).

**Boas práticas no Roblox Studio:**
1. Verifique se \`hit.Parent\` possui um \`Humanoid\` para filtrar objetos do cenário.
2. Use uma variável booleana de **debounce** (\`local debounce = false\`) com \`task.wait()\` para impedir que um mesmo toque execute o código dezenas de vezes seguidas.
3. Certifique-se de que \`CanTouch\` está ativo na peça.

Se precisar de um exemplo pronto para usar, peça: *"Crie um script de lava"* ou *"Crie um script de toque"*.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('localscript') || p.includes('local script') || p.includes('server script') || p.includes('diferenca') || p.includes('diferença')) {
      return {
        message: `### Script vs LocalScript no Roblox Studio

- **\`Script\` (Servidor)**: Executa no servidor e afeta toda a experiência. Ideal para lógica de jogo, dano, coleta de moedas, portas e movimentação de plataformas em \`Workspace\` ou \`ServerScriptService\`.
- **\`LocalScript\` (Cliente)**: Executa apenas no dispositivo do jogador local. Ideal para GUIs (\`StarterGui\`), entrada de teclado/mouse (\`UserInputService\`) e efeitos visuais locais.

Para comunicação segura entre cliente e servidor em projetos completos, utiliza-se \`RemoteEvent\` em \`ReplicatedStorage\`.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('task.wait') || p.includes('wait') || p.includes('task.spawn') || p.includes('runservice') || p.includes('loop')) {
      return {
        message: `### Biblioteca \`task\` e Loops no Luau

- **\`task.wait(seconds)\`**: Pausa a thread atual até o próximo frame (ou pelo tempo indicado), alinhado ao *Heartbeat* da engine. Substitui o antigo \`wait()\`.
- **\`task.spawn(fn)\`**: Executa uma função em paralelo imediatamente sem bloquear o restante do script.
- **\`task.delay(seconds, fn)\`**: Agenda uma execução após um intervalo sem pausar a thread principal.

Em loops \`while true do\`, inclua sempre \`task.wait()\` para não travar a engine.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('proximity') || p.includes('clickdetector') || p.includes('clicar') || p.includes('interag') || p.includes('gui') || p.includes('screengui')) {
      return {
        message: `### Interações e Interface no Studio

- **\`ClickDetector\`**: Adicione dentro de uma \`Part\` para detectar cliques do mouse através do evento \`MouseClick:Connect(function(player) ... end)\`.
- **\`ProximityPrompt\`**: Exibe uma tecla de interação quando o jogador se aproxima, disparando \`Triggered:Connect(function(player) ... end)\`.
- **\`ScreenGui\` / \`BillboardGui\`**: Usados em \`StarterGui\` ou anexados a partes para exibir HUDs, botões e textos flutuantes.

Se quiser um código funcional para uma dessas interações, peça: *"Crie um script de ClickDetector"* ou *"Crie um script de ProximityPrompt"*.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('dica') || p.includes('obby') || p.includes('parkour') || p.includes('jogo') || p.includes('game design')) {
      return {
        message: `### Diretrizes de Design no Roblox Studio

1. **Espaçamento de Pulos**: Com \`WalkSpeed = 16\` e \`JumpPower = 50\`, mantenha saltos entre **6 e 10 studs** de distância e até **4.5 studs** de altura para uma progressão consistente.
2. **Hierarquia Clara**: Dê nomes descritivos às suas partes no Explorer (ex: \`LavaHazard\`, \`Checkpoint_1\`) em vez de deixar tudo como \`Part\`.
3. **Propriedade \`Anchored\`**: Certifique-se de que plataformas e obstáculos estão com \`Anchored = true\` para não caírem com a gravidade quando a simulação iniciar.
4. **Feedback Visual**: Diferencie peças perigosas usando \`Material = Neon\` e cores quentes.

Posso construir plataformas de Obby ou editar propriedades da peça selecionada sempre que você pedir.`,
        script: null,
        actions: []
      };
    }

    if (p.includes('oi') || p.includes('ola') || p.includes('olá') || p.includes('bom dia') || p.includes('boa tarde') || p.includes('boa noite') || p.includes('quem e') || p.includes('quem é') || p.includes('ajuda') || p.includes('o que você faz') || p.includes('o que voce faz')) {
      return {
        message: `Olá! Sou o **Zephyr**, seu assistente de desenvolvimento para **Roblox Studio** e **Luau**.

Posso ajudar você com:
- **Inspeção e Propriedades**: Pergunte sobre a peça selecionada ou peça para alterar \`Color\`, \`Material\`, \`Size\`, \`Anchored\`, \`CanCollide\` ou \`Transparency\`.
- **Construção na Cena**: Peça para criar escadas, paredes, pontes, checkpoints ou uma pista de Obby no \`Workspace\`.
- **Explicações de Luau e Studio**: Tire dúvidas sobre \`CFrame\`, \`Vector3\`, \`Humanoid\`, \`Touched\`, \`TweenService\` e arquitetura Cliente-Servidor.
- **Scripts sob Demanda**: Só gero scripts quando você pedir explicitamente (ex: *"Crie um script de lava"* ou *"Escreva um script de elevador"*).

O que você gostaria de fazer no projeto${selectedPart ? ` (seleção atual: **${selectedPart.name}**)` : ''}?`,
        script: null,
        actions: []
      };
    }

    // Default Roblox Studio Assistant contextual reply (no unsolicited script)
    return {
      message: `Entendido. Estou acompanhando o estado atual do seu **Workspace** (${currentParts.length} partes${selectedPart ? `, seleção em **${selectedPart.name}**` : ', nenhuma peça selecionada'}).

Como posso prosseguir?
- Se quiser **alterar a peça selecionada**, diga por exemplo: *"Deixe essa peça neon azul"* ou *"Desancore essa peça"*.
- Se quiser **adicionar estruturas**, diga: *"Crie uma escada"*, *"Construa uma ponte"* ou *"Gere uma pista de parkour"*.
- Se quiser um **código Luau**, peça explicitamente: *"Crie um script de..."* (lava, giro, elevador, porta, moeda, trampolim, teleporte, etc.).`,
      script: null,
      actions: []
    };
  }

  // --------------------------------------------------------------------------
  // 3. EXPLICIT SCRIPT CREATION MODE (Triggered ONLY when user asks for a script)
  // --------------------------------------------------------------------------

  // ClickDetector / ProximityPrompt Script
  if (p.includes('click') || p.includes('clicar') || p.includes('botão') || p.includes('botao') || p.includes('proximity') || p.includes('interag')) {
    const partName = selectedPart ? selectedPart.name : 'InteractivePart';
    return {
      message: `Criei o script **${partName}_InteractScript** usando \`ClickDetector.MouseClick\`.

**Como configurar no Studio:**
- Certifique-se de que o script está associado à peça **${partName}**.
- Ao clicar na peça durante o teste, a ação será executada.`,
      script: {
        name: `${partName}_InteractScript`,
        source: `-- Script de Interação com ClickDetector
local part = script.Parent
local clickDetector = part:FindFirstChild("ClickDetector")
local isActive = false

print("🖱️ ClickDetector pronto em:", part.Name)

local function onClicked(player)
    if isActive then return end
    isActive = true

    print("Clique detectado por:", player.Name)
    part.Color = Color3.fromRGB(34, 197, 94)
    part.Material = Enum.Material.Neon

    task.wait(1.5)

    part.Color = Color3.fromRGB(59, 130, 246)
    part.Material = Enum.Material.Plastic
    isActive = false
end

if clickDetector then
    clickDetector.MouseClick:Connect(onClicked)
end
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: []
    };
  }

  // Lava / Damage / Killbrick
  if (p.includes('lava') || p.includes('dano') || p.includes('kill') || p.includes('morrer') || p.includes('hazard')) {
    const partName = selectedPart ? selectedPart.name : 'LavaBlock';
    return {
      message: `Criei o script **${partName}_LavaScript** com validação de \`Humanoid\` e controle de debounce para aplicar dano ao toque.`,
      script: {
        name: `${partName}_LavaScript`,
        source: `-- Script de Lava / Killbrick com Debounce
local part = script.Parent
local damage = 35
local debounceTime = 0.5
local canDamage = true

part.Touched:Connect(function(hit)
    if not canDamage then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid and humanoid.Health > 0 then
        canDamage = false
        humanoid:TakeDamage(damage)
        print("Dano aplicado em:", hit.Parent.Name, "| Vida restante:", humanoid.Health)

        task.wait(debounceTime)
        canDamage = true
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [
        {
          type: 'update_part',
          partId: selectedPart.id,
          properties: { color: '#ef4444', material: 'neon' }
        }
      ] : [
        {
          type: 'add_part',
          part: {
            name: 'LavaHazard',
            type: 'killbrick',
            position: { x: 0, y: 0.5, z: 0 },
            size: { x: 10, y: 1, z: 10 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#ef4444',
            material: 'neon',
            anchored: true,
            canCollide: true,
            transparency: 0
          }
        }
      ]
    };
  }

  // Continuous Rotation / Spinner
  if (p.includes('girar') || p.includes('gira') || p.includes('rotacion') || p.includes('spinner') || p.includes('helice') || p.includes('hélice')) {
    const partName = selectedPart ? selectedPart.name : 'Spinner';
    return {
      message: `Criei o script **${partName}_SpinScript** para rotacionar a instância continuamente no eixo Y usando \`task.wait(0.03)\`.`,
      script: {
        name: `${partName}_SpinScript`,
        source: `-- Script de Rotação Contínua
local part = script.Parent
local spinSpeed = 3

while true do
    part.Rotation = Vector3.new(part.Rotation.X, part.Rotation.Y + spinSpeed, part.Rotation.Z)
    task.wait(0.03)
end
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: []
    };
  }

  // Trampoline / Jump Pad
  if (p.includes('trampolim') || p.includes('bounce') || p.includes('pulo') || p.includes('pular') || p.includes('lancar') || p.includes('lançar') || p.includes('mola')) {
    const partName = selectedPart ? selectedPart.name : 'BouncePad';
    return {
      message: `Criei o script **${partName}_BounceScript** para impulsionar o \`Humanoid.JumpPower\` ao pisar na peça.`,
      script: {
        name: `${partName}_BounceScript`,
        source: `-- Script de Trampolim (JumpPad)
local pad = script.Parent
local boostJumpPower = 40
local defaultJumpPower = 18
local debounce = false

pad.Touched:Connect(function(hit)
    if debounce then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        debounce = true
        humanoid.JumpPower = boostJumpPower
        task.wait(1.5)
        humanoid.JumpPower = defaultJumpPower
        debounce = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [
        {
          type: 'update_part',
          partId: selectedPart.id,
          properties: { color: '#06b6d4', material: 'neon' }
        }
      ] : [
        {
          type: 'add_part',
          part: {
            name: 'BouncePad',
            type: 'bouncepad',
            position: { x: 0, y: 0.5, z: 0 },
            size: { x: 6, y: 0.8, z: 6 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#06b6d4',
            material: 'neon',
            anchored: true,
            canCollide: true,
            transparency: 0
          }
        }
      ]
    };
  }

  // Coins / Collectibles
  if (p.includes('moeda') || p.includes('coin') || p.includes('dinheiro') || p.includes('colet') || p.includes('pontos')) {
    return {
      message: `Criei o script **CoinCollectScript** com rotação paralela via \`task.spawn\` e respawn automático após coleta.`,
      script: {
        name: 'CoinCollectScript',
        source: `-- Script de Moeda Coletável com Respawn
local coin = script.Parent
local respawnTime = 4.0
local isCollected = false

task.spawn(function()
    while not isCollected do
        coin.Rotation = Vector3.new(coin.Rotation.X, coin.Rotation.Y + 4, coin.Rotation.Z)
        task.wait(0.03)
    end
end)

coin.Touched:Connect(function(hit)
    if isCollected then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        isCollected = true
        humanoid:AddCoins(10)
        coin.Transparency = 1
        coin.CanCollide = false

        task.wait(respawnTime)

        coin.Transparency = 0
        coin.CanCollide = true
        isCollected = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [] : [
        {
          type: 'add_part',
          part: {
            name: 'GoldCoin',
            type: 'coin',
            position: { x: 0, y: 3, z: 0 },
            size: { x: 1.5, y: 1.5, z: 0.4 },
            rotation: { x: 90, y: 0, z: 0 },
            color: '#fbbf24',
            material: 'neon',
            anchored: true,
            canCollide: false,
            transparency: 0
          }
        }
      ]
    };
  }

  // Speed Boost Pad
  if (p.includes('velocidade') || p.includes('speed') || p.includes('rapido') || p.includes('acelera') || p.includes('turbo')) {
    return {
      message: `Criei o script **SpeedBoostScript** para aumentar temporariamente \`Humanoid.WalkSpeed\` ao pisar na peça.`,
      script: {
        name: 'SpeedBoostScript',
        source: `-- Script de Speed Pad
local pad = script.Parent
local boostSpeed = 32
local normalSpeed = 16
local debounce = false

pad.Touched:Connect(function(hit)
    if debounce then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        debounce = true
        humanoid.WalkSpeed = boostSpeed
        task.wait(3.0)
        humanoid.WalkSpeed = normalSpeed
        debounce = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [] : [
        {
          type: 'add_part',
          part: {
            name: 'SpeedPad',
            type: 'speedpad',
            position: { x: 0, y: 0.5, z: 0 },
            size: { x: 6, y: 0.5, z: 8 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#eab308',
            material: 'neon',
            anchored: true,
            canCollide: true,
            transparency: 0
          }
        }
      ]
    };
  }

  // Elevator / Moving Platform
  if (p.includes('elevador') || p.includes('sobe') || p.includes('plataforma movel') || p.includes('plataforma móvel') || p.includes('movendo') || p.includes('flutua')) {
    const partName = selectedPart ? selectedPart.name : 'MovingPlatform';
    return {
      message: `Criei o script **${partName}_ElevatorScript** para movimentação vertical contínua entre \`startY\` e \`targetY\`.`,
      script: {
        name: `${partName}_ElevatorScript`,
        source: `-- Script de Plataforma Móvel (Elevador)
local platform = script.Parent
local startY = platform.Position.Y
local targetY = startY + 14
local speed = 0.15

while true do
    while platform.Position.Y < targetY do
        platform.Position = Vector3.new(platform.Position.X, platform.Position.Y + speed, platform.Position.Z)
        task.wait(0.03)
    end
    task.wait(2.0)

    while platform.Position.Y > startY do
        platform.Position = Vector3.new(platform.Position.X, platform.Position.Y - speed, platform.Position.Z)
        task.wait(0.03)
    end
    task.wait(2.0)
end
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [] : [
        {
          type: 'add_part',
          part: {
            name: 'ElevatorPlatform',
            type: 'block',
            position: { x: 0, y: 1, z: 0 },
            size: { x: 6, y: 1, z: 6 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#38bdf8',
            material: 'metal',
            anchored: true,
            canCollide: true,
            transparency: 0
          }
        }
      ]
    };
  }

  // Door / Secret Passage
  if (p.includes('porta') || p.includes('abrir') || p.includes('fechar') || p.includes('passagem') || p.includes('secret')) {
    return {
      message: `Criei o script **DoorControllerScript**, alternando \`Transparency\` e \`CanCollide\` temporariamente quando um jogador encosta.`,
      script: {
        name: 'DoorControllerScript',
        source: `-- Script de Porta Automática
local door = script.Parent
local isOpened = false

door.Touched:Connect(function(hit)
    if isOpened then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        isOpened = true
        door.Transparency = 0.85
        door.CanCollide = false

        task.wait(3.5)

        door.Transparency = 0
        door.CanCollide = true
        isOpened = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [] : [
        {
          type: 'add_part',
          part: {
            name: 'SecretDoor',
            type: 'block',
            position: { x: 0, y: 4, z: 5 },
            size: { x: 4, y: 7, z: 0.8 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#3b82f6',
            material: 'glass',
            anchored: true,
            canCollide: true,
            transparency: 0
          }
        }
      ]
    };
  }

  // Teleport
  if (p.includes('teleport') || p.includes('teleporte') || p.includes('portal') || p.includes('tp')) {
    return {
      message: `Criei o script **TeleportPortalScript** usando \`CFrame.new()\` em \`HumanoidRootPart\` com cooldown.`,
      script: {
        name: 'TeleportPortalScript',
        source: `-- Script de Portal de Teleporte
local portal = script.Parent
local targetPosition = Vector3.new(0, 5, -40)
local cooldown = false

portal.Touched:Connect(function(hit)
    if cooldown then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    local rootPart = hit.Parent and hit.Parent:FindFirstChild("HumanoidRootPart")
    if humanoid and rootPart then
        cooldown = true
        rootPart.CFrame = CFrame.new(targetPosition.X, targetPosition.Y + 2, targetPosition.Z)
        task.wait(2.0)
        cooldown = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: []
    };
  }

  // Day & Night Cycle
  if (p.includes('noite') || p.includes('dia') || p.includes('ciclo') || p.includes('ilumina')) {
    return {
      message: `Criei o script **DayNightCycleScript** para alternar cores de iluminação em ciclo contínuo.`,
      script: {
        name: 'DayNightCycleScript',
        source: `-- Script de Ciclo Dia / Noite
local lightPart = script.Parent
local cycleTime = 60

while true do
    lightPart.Color = Color3.fromRGB(255, 245, 200)
    task.wait(cycleTime * 0.4)

    lightPart.Color = Color3.fromRGB(255, 140, 60)
    task.wait(cycleTime * 0.1)

    lightPart.Color = Color3.fromRGB(30, 40, 90)
    task.wait(cycleTime * 0.4)

    lightPart.Color = Color3.fromRGB(255, 180, 180)
    task.wait(cycleTime * 0.1)
end
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: []
    };
  }

  // Rainbow Disco Colors
  if (p.includes('cor') || p.includes('rainbow') || p.includes('arco') || p.includes('disco') || p.includes('muda')) {
    const partName = selectedPart ? selectedPart.name : 'RainbowBlock';
    return {
      message: `Criei o script **${partName}_RainbowScript** iterando uma tabela de \`Color3.fromRGB\` com \`ipairs\`.`,
      script: {
        name: `${partName}_RainbowScript`,
        source: `-- Script de Cores Dinâmicas
local part = script.Parent
local colors = {
    Color3.fromRGB(239, 68, 68),
    Color3.fromRGB(249, 115, 22),
    Color3.fromRGB(234, 179, 8),
    Color3.fromRGB(34, 197, 94),
    Color3.fromRGB(59, 130, 246),
    Color3.fromRGB(168, 85, 247)
}

while true do
    for _, col in ipairs(colors) do
        part.Color = col
        task.wait(0.4)
    end
end
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [
        {
          type: 'update_part',
          partId: selectedPart.id,
          properties: { material: 'neon' }
        }
      ] : []
    };
  }

  // Healing / Health Regen
  if (p.includes('cura') || p.includes('heal') || p.includes('vida') || p.includes('regenera')) {
    return {
      message: `Criei o script **HealStationScript** para restaurar a propriedade \`Health\` do \`Humanoid\` até \`MaxHealth\`.`,
      script: {
        name: 'HealStationScript',
        source: `-- Script de Estação de Cura
local pad = script.Parent
local healAmount = 25
local debounce = false

pad.Touched:Connect(function(hit)
    if debounce then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid and humanoid.Health < humanoid.MaxHealth then
        debounce = true
        humanoid:Heal(healAmount)
        task.wait(1.0)
        debounce = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: selectedPart ? [] : [
        {
          type: 'add_part',
          part: {
            name: 'HealStation',
            type: 'block',
            position: { x: 0, y: 0.5, z: 0 },
            size: { x: 5, y: 0.5, z: 5 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#10b981',
            material: 'neon',
            anchored: true,
            canCollide: true,
            transparency: 0
          }
        }
      ]
    };
  }

  // Disappearing / Falling Platform
  if (p.includes('cai') || p.includes('desaparece') || p.includes('sumir') || p.includes('queda')) {
    return {
      message: `Criei o script **DisappearingPlatformScript** para desativar \`CanCollide\` e \`Transparency\` temporariamente após o toque.`,
      script: {
        name: 'DisappearingPlatformScript',
        source: `-- Script de Plataforma que Desaparece
local platform = script.Parent
local isTriggered = false

platform.Touched:Connect(function(hit)
    if isTriggered then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        isTriggered = true
        task.wait(0.6)
        platform.Transparency = 0.5
        task.wait(0.4)

        platform.Transparency = 1
        platform.CanCollide = false

        task.wait(3.0)
        platform.Transparency = 0
        platform.CanCollide = true
        isTriggered = false
    end
end)
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: []
    };
  }

  // General customizable Luau script generator for any other explicit script request
  const partName = selectedPart ? selectedPart.name : 'CustomPart';
  const cleanTitle = prompt.slice(0, 22).replace(/[^a-zA-Z0-9]/g, '') || partName;
  return {
    message: `Criei o script **${cleanTitle}_Script** em Luau para **${partName}** (\`script.Parent\`). Você pode inseri-lo no \`Workspace\` usando o botão abaixo.`,
    script: {
      name: `${cleanTitle}_Script`,
      source: `-- ${cleanTitle} (Luau Script)
local part = script.Parent
local debounce = false

part.Touched:Connect(function(hit)
    if debounce then return end

    local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        debounce = true
        print("Interação detectada em:", part.Name, "| Jogador:", hit.Parent.Name)
        task.wait(0.5)
        debounce = false
    end
end)
`,
      parentPartId: selectedPart ? selectedPart.id : 'Workspace'
    },
    actions: []
  };
}

async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BloxVerse Server] Dev server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
