import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CopilotRequestBody {
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

// AI Copilot endpoint
app.post('/api/copilot', async (req: Request, res: Response) => {
  const { prompt, context, chatHistory }: CopilotRequestBody = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const selectedPart = context?.parts?.find((p: any) => p.id === context?.selectedPartId);
  const partsSummary = (context?.parts || []).map((p: any) => ({
    name: p.name,
    type: p.type,
    position: p.position,
    color: p.color,
    material: p.material,
    anchored: p.anchored
  })).slice(0, 20);

  const systemInstruction = `
Você é o "BloxCopilot", a inteligência artificial especialista do Roblox Studio e da plataforma BloxVerse.
Você é um engenheiro de jogos e programador sênior de Luau (Roblox Lua).
Seu objetivo é ajudar o desenvolvedor a construir seu jogo:
1. Responder dúvidas e explicar conceitos de Luau e mecânicas de jogos.
2. Escrever scripts Luau prontos para produção com eventos como \`Touched:Connect\`, manipulação de \`Vector3\`, \`Color3\`, loops com \`task.wait()\`, \`Instance.new("Part")\`, \`Humanoid\` (Health, WalkSpeed, JumpPower), etc.
3. Fazer mudanças diretas no jogo quando solicitado (criar pistas de obstáculos, adicionar peças, trampolins, lava, moedas, portas, luzes, elevadores).

Contexto atual do jogo:
- Título do Jogo: "${context?.gameTitle || 'Meu Jogo BloxVerse'}"
- Gênero: "${context?.gameGenre || 'Sandbox'}"
- Peça Selecionada pelo Usuário: ${selectedPart ? JSON.stringify({ name: selectedPart.name, type: selectedPart.type, position: selectedPart.position, color: selectedPart.color, material: selectedPart.material }) : 'Nenhuma peça selecionada'}
- Resumo de Peças no Cenário: ${JSON.stringify(partsSummary)}

IMPORTANTE: Responda SEMPRE em Português do Brasil com tom empolgante, claro e amigável.
Você DEVE estruturar sua resposta como um JSON válido no formato:
{
  "message": "Texto explicativo para o usuário em Markdown, detalhando o que foi feito ou explicando o código Luau.",
  "script": {
    "name": "NomeDoScript",
    "source": "-- Código Luau aqui...",
    "parentPartId": "ID ou 'selected' ou 'Workspace'"
  },
  "actions": [
    {
      "type": "add_part",
      "part": {
        "name": "NomeDaPeca",
        "type": "block" | "sphere" | "cylinder" | "wedge" | "killbrick" | "bouncepad" | "speedpad" | "coin",
        "position": { "x": 0, "y": 2, "z": 0 },
        "size": { "x": 4, "y": 1, "z": 4 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#ff0000",
        "material": "plastic" | "neon" | "metal" | "glass" | "wood" | "brick" | "forcefield",
        "anchored": true,
        "canCollide": true,
        "transparency": 0
      }
    }
  ]
}

Se a solicitação for apenas uma pergunta conceitual sem modificação, actions pode ser um array vazio [] e script pode ser null ou conter o código Luau de exemplo.
Retorne APENAS o JSON puro (ou dentro de um bloco \`\`\`json \`\`\`).
`;

  try {
    if (process.env.GEMINI_API_KEY) {
      // Build conversation contents
      const contents: any[] = [];

      // Add recent history if present
      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.slice(-4).forEach(item => {
          contents.push({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }]
          });
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = response.text || '';
      
      // Parse JSON from response
      let parsedData: any = null;
      try {
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
        const rawJson = jsonMatch[1] || responseText;
        parsedData = JSON.parse(rawJson.trim());
      } catch (jsonErr) {
        // If JSON parsing fails, extract text and any Lua code block
        const luaMatch = responseText.match(/```(?:lua|luau)?\s*([\s\S]*?)\s*```/);
        parsedData = {
          message: responseText.replace(/```[\s\S]*?```/g, '').trim() || responseText,
          script: luaMatch ? {
            name: 'GeneratedScript',
            source: luaMatch[1].trim(),
            parentPartId: selectedPart ? selectedPart.id : 'Workspace'
          } : null,
          actions: []
        };
      }

      return res.json({
        success: true,
        data: parsedData
      });
    }
  } catch (err: any) {
    console.error('Error in Gemini API call, using smart local fallback:', err);
  }

  // Smart local fallback if Gemini API is unreachable or key not set
  const fallback = generateSmartFallback(prompt, selectedPart, context?.parts || []);
  return res.json({
    success: true,
    data: fallback,
    isFallback: true
  });
});

/**
 * Intelligent local Luau & Game generation fallback
 */
function generateSmartFallback(prompt: string, selectedPart: any, currentParts: any[]) {
  const p = prompt.toLowerCase();
  
  if (p.includes('lava') || p.includes('dano') || p.includes('kill') || p.includes('morrer')) {
    const partName = selectedPart ? selectedPart.name : 'LavaBlock';
    return {
      message: `Criei um script Luau de **Lava / Killbrick** completo! Quando o jogador pisa na peça, ele recebe dano diretamente no \`Humanoid\`. Também ajustei o material para \`neon\` e a cor para vermelho fogo!`,
      script: {
        name: `${partName}_LavaScript`,
        source: `-- Script de Lava / Killbrick (Dano ao tocar)
local part = script.Parent
local damage = 35 -- Dano por toque (coloque 100 para morte instantânea)

print("🔥 Lava ativada em:", part.Name)

part.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        humanoid:TakeDamage(damage)
        print("💥 Jogador tocou na lava! Dano causado:", damage)
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

  if (p.includes('girar') || p.includes('gira') || p.includes('rotacion') || p.includes('spinner')) {
    const partName = selectedPart ? selectedPart.name : 'Spinner';
    return {
      message: `Aqui está o script Luau de **Rotação Contínua**! Ele atualiza a rotação no eixo Y suavemente a cada frame com \`task.wait(0.04)\`.`,
      script: {
        name: `${partName}_SpinScript`,
        source: `-- Script de Rotação Contínua
local part = script.Parent
local spinSpeed = 3 -- Graus por ciclo

print("🌀 Iniciando rotação contínua na peça:", part.Name)

while true do
    part.Rotation = Vector3.new(part.Rotation.X, part.Rotation.Y + spinSpeed, part.Rotation.Z)
    task.wait(0.04)
end
`,
        parentPartId: selectedPart ? selectedPart.id : 'Workspace'
      },
      actions: []
    };
  }

  if (p.includes('porta') || p.includes('abrir') || p.includes('fechar') || p.includes('passagem')) {
    return {
      message: `Criei uma **Porta Secreta com Mecânica Luau**! Ao encostar na porta, ela fica transparente (\`Transparency = 0.85\`) e sem colisão (\`CanCollide = false\`), permitindo passar. Depois de 3.5 segundos, fecha automaticamente!`,
      script: {
        name: 'DoorControllerScript',
        source: `-- Script de Porta Automática
local door = script.Parent
local isOpened = false

print("🚪 Sistema de Porta pronto:", door.Name)

door.Touched:Connect(function(hit)
    if not isOpened then
        isOpened = true
        print("🔓 Abrindo porta...")
        door.Transparency = 0.85
        door.CanCollide = false
        
        task.wait(3.5)
        
        print("🔒 Fechando porta...")
        door.Transparency = 0
        door.CanCollide = true
        isOpened = false
    end
end)
`,
        parentPartId: 'selected'
      },
      actions: [
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

  if (p.includes('obby') || p.includes('parkour') || p.includes('obstaculo') || p.includes('fase')) {
    const baseZ = currentParts.length ? Math.min(...currentParts.map(p => p.position.z)) - 8 : -8;
    return {
      message: `Construí uma nova sequência de **Parkour / Obby** com 4 plataformas suspensas e lava entre elas! Todas já com física correta.`,
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

  // Default helpful response with general Luau script
  return {
    message: `Olá! Eu sou o **BloxCopilot**, sua IA assistente de criação e script Luau.
Posso escrever qualquer código Luau para o seu jogo (dano, plataformas móveis, teleporte, portas, pulo duplo, coleta de moedas) ou gerar partes e fases inteiras no mapa!

Diga-me o que você quer construir ou clique em uma das sugestões rápidas abaixo.`,
    script: {
      name: 'InteractiveScript',
      source: `-- Script Interativo Luau
local part = script.Parent

print("Script carregado em:", part.Name)

part.Touched:Connect(function(hit)
    print("Objeto tocado por:", hit.Name)
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
