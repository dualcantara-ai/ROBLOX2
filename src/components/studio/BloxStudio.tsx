import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Upload, 
  Trash2, 
  Copy, 
  Plus, 
  Box, 
  Circle, 
  Zap, 
  Flame, 
  Coins, 
  Sparkles, 
  Move, 
  RotateCw, 
  Maximize, 
  Palette, 
  Layers, 
  FileCode, 
  ChevronRight, 
  ChevronDown,
  Eye,
  Settings,
  FolderOpen,
  Save,
  CheckCircle2,
  Compass,
  EyeOff,
  Shield,
  Anchor,
  Ghost,
  Tag,
  Sliders,
  User,
  Users,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  X,
  ArrowLeft,
  Smartphone,
  Pencil,
  Bot,
  Terminal
} from 'lucide-react';
import { BloxPart, PartType, MaterialType, BloxVector3, GameMetadata, AvatarAppearance, PlayerBodyPart, BloxTexture, BloxWeldConstraint, BloxTool, BloxGuiElement, NormalId } from '../../types';
import { BloxEngine3D } from '../engine/BloxEngine3D';
import { sounds } from '../../services/soundEffects';
import { getPlayerPartsList } from '../engine/character3D';
import { ScriptEditorModal } from './ScriptEditorModal';
import { BloxCopilot } from './BloxCopilot';
import { LuauScriptInstance } from '../../services/luau/types';
import { luauEngine } from '../../services/luau/luauRuntime';

interface BloxStudioProps {
  onPublishGame: (game: GameMetadata) => void;
  userAvatar: AvatarAppearance;
  username: string;
  onExitStudio?: () => void;
  initialGame?: GameMetadata | null;
}

const TEMPLATES: { [key: string]: BloxPart[] } = {
  'baseplate': [
    {
      id: 'sp-1',
      name: 'Spawn Location',
      className: 'SpawnLocation',
      type: 'spawn',
      position: { x: 0, y: 0.5, z: 0 },
      size: { x: 12, y: 1, z: 12 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#10b981',
      material: 'plastic',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0,
      label: 'SPAWN'
    },
    {
      id: 'sp-crate-1',
      name: 'Physics Crate 1',
      className: 'Part',
      type: 'block',
      position: { x: 3, y: 3.5, z: -4 },
      size: { x: 2.5, y: 2.5, z: 2.5 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#d97706',
      material: 'wood',
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      attributes: {
        Mass: 10,
        Pushable: true
      }
    },
    {
      id: 'sp-boulder-1',
      name: 'Rolling Boulder',
      className: 'Part',
      type: 'sphere',
      position: { x: -3, y: 3.5, z: -4 },
      size: { x: 3, y: 3, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#0284c7',
      material: 'plastic',
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      attributes: {
        Mass: 8,
        Pushable: true
      }
    },
    {
      id: 'sp-barrier-1',
      name: 'Invisible Barrier Wall',
      className: 'Part',
      type: 'block',
      position: { x: 0, y: 3, z: -10 },
      size: { x: 14, y: 6, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#64748b',
      material: 'forcefield',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 1.0,
      attributes: {
        Barrier: true
      }
    }
  ],
  'obby': [
    {
      id: 'sp-1',
      name: 'Spawn Platform',
      className: 'SpawnLocation',
      type: 'spawn',
      position: { x: 0, y: 0.5, z: 0 },
      size: { x: 10, y: 1, z: 10 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#10b981',
      material: 'plastic',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0,
      label: 'START'
    },
    {
      id: 'p-dyn-crate',
      name: 'Pushable Physics Crate',
      className: 'Part',
      type: 'block',
      position: { x: 2.5, y: 2.5, z: -1 },
      size: { x: 2, y: 2, z: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#d97706',
      material: 'wood',
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      attributes: {
        Mass: 5,
        Pushable: true
      }
    },
    {
      id: 'p-step-1',
      name: 'Neon Platform 1',
      className: 'Part',
      type: 'block',
      position: { x: 0, y: 1.5, z: -10 },
      size: { x: 4, y: 1, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#00a2ff',
      material: 'neon',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'p-coin-1',
      name: 'Bonus Coin',
      className: 'Part',
      type: 'coin',
      position: { x: 0, y: 3.5, z: -10 },
      size: { x: 1.2, y: 1.2, z: 0.3 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#fbbf24',
      material: 'neon',
      anchored: true,
      isAnchored: true,
      canCollide: false,
      transparency: 0,
      coinValue: 25,
      attributes: { Value: 25 }
    },
    {
      id: 'p-invis-shield',
      name: 'Invisible Barrier Wall',
      className: 'Part',
      type: 'block',
      position: { x: -3.5, y: 3, z: -10 },
      size: { x: 1, y: 5, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#94a3b8',
      material: 'forcefield',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 1.0,
      attributes: {
        Barrier: true
      }
    },
    {
      id: 'p-lava-1',
      name: 'Lava Hurdle',
      className: 'Part',
      type: 'killbrick',
      position: { x: 0, y: 2.5, z: -18 },
      size: { x: 8, y: 0.8, z: 1.2 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#ef4444',
      material: 'neon',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0,
      script: { trigger: 'onTouch', action: 'damage', parameter: 100 },
      attributes: { Damage: 100 }
    },
    {
      id: 'p-bounce-1',
      name: 'Super Trampoline',
      className: 'Part',
      type: 'bouncepad',
      position: { x: 0, y: 3, z: -26 },
      size: { x: 4, y: 0.8, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#06b6d4',
      material: 'neon',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0,
      script: { trigger: 'onTouch', action: 'bounce', parameter: 26 },
      attributes: { BounceForce: 26 }
    },
    {
      id: 'p-ghost-1',
      name: 'Hologram Pass-Through',
      className: 'Part',
      type: 'block',
      position: { x: 0, y: 8, z: -32 },
      size: { x: 6, y: 4, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#38bdf8',
      material: 'forcefield',
      anchored: true,
      isAnchored: true,
      canCollide: false,
      transparency: 0.5,
      attributes: { Ghost: true }
    },
    {
      id: 'p-finish',
      name: 'Victory Stage',
      className: 'Part',
      type: 'teleporter',
      position: { x: 0, y: 14, z: -38 },
      size: { x: 8, y: 1.5, z: 8 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#fbbf24',
      material: 'metal',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0,
      label: 'WINNER'
    }
  ]
};

const COLOR_PRESETS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', 
  '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#ffffff', 
  '#94a3b8', '#1e293b', '#000000', '#ef4444', '#10b981'
];

export const BloxStudio: React.FC<BloxStudioProps> = ({
  onPublishGame,
  userAvatar,
  username,
  onExitStudio,
  initialGame
}) => {
  const [parts, setParts] = useState<BloxPart[]>(() => {
    if (initialGame && initialGame.parts && initialGame.parts.length > 0) {
      return initialGame.parts;
    }
    return TEMPLATES.obby;
  });
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedPlayerPartId, setSelectedPlayerPartId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isPhysicsRunning, setIsPhysicsRunning] = useState<boolean>(false);
  const [spawnPoint, setSpawnPoint] = useState<BloxVector3>(() => {
    if (initialGame && initialGame.spawnPoint) {
      return initialGame.spawnPoint;
    }
    return { x: 0, y: 2, z: 0 };
  });
  
  // Luau Scripting & AI Copilot State
  const [scripts, setScripts] = useState<LuauScriptInstance[]>(() => {
    if (initialGame && initialGame.scripts && initialGame.scripts.length > 0) {
      return initialGame.scripts;
    }
    return [
      {
        id: 'script-welcome-1',
        name: 'GameController',
        className: 'Script',
        source: `-- Script Principal do Jogo (Luau)
-- Este código executa em tempo real no Studio e durante a partida!

print("🎮 [BloxVerse] Inicializando sistemas do jogo em Luau...")
print("✨ Desenvolvedor:", "${username || 'BloxMaster'}")

-- Exemplo: Rotação ou detecção de toque em peças
-- local part = workspace:FindFirstChild("Part")
-- if part then print("Peça encontrada no Workspace!") end
`,
        enabled: true,
        parentPartId: 'Workspace',
        createdAt: new Date().toISOString()
      }
    ];
  });
  const [activeEditingScript, setActiveEditingScript] = useState<LuauScriptInstance | null>(null);
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string>('');

  // Custom Instance Attributes creation state
  const [newAttrKey, setNewAttrKey] = useState<string>('');
  const [newAttrType, setNewAttrType] = useState<'number' | 'string' | 'boolean'>('number');
  const [newAttrVal, setNewAttrVal] = useState<string>('10');
  const [showAddAttr, setShowAddAttr] = useState<boolean>(false);

  // Studio UI panels (On mobile screens, panels start closed so 3D viewport has 100% space)
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'scale' | 'color'>('select');
  const [showToolbox, setShowToolbox] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [showProperties, setShowProperties] = useState<boolean>(true);
  const [showExplorer, setShowExplorer] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [mobileRightTab, setMobileRightTab] = useState<'explorer' | 'properties'>('properties');
  const [isFullscreenViewport, setIsFullscreenViewport] = useState<boolean>(false);
  const [workspaceExpanded, setWorkspaceExpanded] = useState<boolean>(true);
  const [playersExpanded, setPlayersExpanded] = useState<boolean>(true);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);

  // Tools & GUIs state
  const [tools, setTools] = useState<BloxTool[]>(() => initialGame?.tools || []);
  const [guis, setGuis] = useState<BloxGuiElement[]>(() => initialGame?.guis || []);
  const [starterPackExpanded, setStarterPackExpanded] = useState<boolean>(true);
  const [starterGuiExpanded, setStarterGuiExpanded] = useState<boolean>(true);

  // Instance management helpers
  const handleAddTextureToPart = (partId: string, texturePreset: string = 'studs', face: NormalId = 'Top') => {
    sounds.playClick();
    const newTex: BloxTexture = {
      id: `tex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${texturePreset.toUpperCase()}_Texture`,
      className: 'Texture',
      texture: texturePreset,
      face,
      studsPerTileU: 2,
      studsPerTileV: 2,
      transparency: 0
    };
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      return { ...p, textures: [...(p.textures || []), newTex] };
    }));
  };

  const handleRemoveTextureFromPart = (partId: string, textureId: string) => {
    sounds.playClick();
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      return { ...p, textures: (p.textures || []).filter(t => t.id !== textureId) };
    }));
  };

  const handleAddWeldConstraint = (part0Id: string, part1Id: string) => {
    sounds.playClick();
    const newWeld: BloxWeldConstraint = {
      id: `weld-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'WeldConstraint',
      className: 'WeldConstraint',
      part0Id,
      part1Id,
      enabled: true
    };
    setParts(prev => prev.map(p => {
      if (p.id !== part0Id) return p;
      return { ...p, weldConstraints: [...(p.weldConstraints || []), newWeld] };
    }));
  };

  const handleRemoveWeldConstraint = (partId: string, weldId: string) => {
    sounds.playClick();
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      return { ...p, weldConstraints: (p.weldConstraints || []).filter(w => w.id !== weldId) };
    }));
  };

  const handleAddBillboardGui = (partId: string, text: string = 'Billboard Label') => {
    sounds.playClick();
    const newGui: BloxGuiElement = {
      id: `gui-bb-${Date.now()}`,
      name: 'BillboardGui',
      className: 'BillboardGui',
      parentPartId: partId,
      text,
      textColor: '#38bdf8',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      visible: true
    };
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      return { ...p, guis: [...(p.guis || []), newGui] };
    }));
  };

  const handleAddTool = () => {
    sounds.playClick();
    const newTool: BloxTool = {
      id: `tool-${Date.now()}`,
      name: `Tool_${tools.length + 1}`,
      className: 'Tool',
      icon: '⚔️',
      toolTip: 'Custom Tool',
      actionType: 'sword'
    };
    setTools(prev => [...prev, newTool]);
  };

  const handleAddScreenGui = () => {
    sounds.playClick();
    const newGui: BloxGuiElement = {
      id: `gui-${Date.now()}`,
      name: `ScreenLabel_${guis.length + 1}`,
      className: 'TextLabel',
      text: 'Roblox ScreenGui',
      textColor: '#ffffff',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      position: { x: 20, y: 70 + guis.length * 45 },
      visible: true
    };
    setGuis(prev => [...prev, newGui]);
  };

  // Sync fullscreen state with browser changes
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreenViewport(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // When initialGame prop changes, load it into studio state
  useEffect(() => {
    if (initialGame) {
      if (initialGame.parts && initialGame.parts.length > 0) {
        setParts(initialGame.parts);
      }
      if (initialGame.spawnPoint) {
        setSpawnPoint(initialGame.spawnPoint);
      }
      setPublishTitle(initialGame.title);
      setPublishDesc(initialGame.description);
      setPublishGenre(initialGame.genre);
      setPublishPrice(initialGame.price || 0);
    }
  }, [initialGame]);

  // When a part is selected on mobile, auto-switch to properties tab
  useEffect(() => {
    if (selectedPartId) {
      setMobileRightTab('properties');
    }
  }, [selectedPartId]);

  const handleSelectPart = useCallback((id: string | null) => {
    setSelectedPartId(id);
    setSelectedPlayerPartId(null);
  }, []);

  // Universal Fullscreen Toggle (supports both container full-viewport and real browser fullscreen)
  const handleToggleFullscreen = () => {
    sounds.playClick();
    if (isFullscreenViewport) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreenViewport(false);
    } else {
      if (!document.fullscreenElement && document.documentElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // If browser policy blocks native fullscreen (e.g. inside iframe), container fullscreen still takes effect
        });
      }
      setIsFullscreenViewport(true);
    }
  };

  // Publish Form State (pre-filled with initialGame when in Edit mode)
  const [publishTitle, setPublishTitle] = useState<string>(() => initialGame ? initialGame.title : 'My Awesome Obby');
  const [publishDesc, setPublishDesc] = useState<string>(() => initialGame ? initialGame.description : 'Built in BloxVerse Studio! Can you beat the parkour jumps?');
  const [publishGenre, setPublishGenre] = useState<GameMetadata['genre']>(() => initialGame ? initialGame.genre : 'Obby / Parkour');
  const [publishPrice, setPublishPrice] = useState<number>(() => initialGame ? (initialGame.price || 0) : 0);

  const selectedPart = parts.find(p => p.id === selectedPartId);
  const playerPartsList = getPlayerPartsList(userAvatar);
  const selectedPlayerPart = playerPartsList.find(p => p.id === selectedPlayerPartId);

  // Script Management Handlers
  const handleOpenScript = (script: LuauScriptInstance) => {
    sounds.playClick();
    setActiveEditingScript(script);
    setIsScriptEditorOpen(true);
  };

  const handleCreateNewScript = (parentPartId: string = 'Workspace', name?: string, source?: string) => {
    sounds.playClick();
    const targetPart = parts.find(p => p.id === parentPartId);
    const newScript: LuauScriptInstance = {
      id: `script-${Date.now()}`,
      name: name || (targetPart ? `${targetPart.name}Script` : 'NewScript'),
      className: 'Script',
      source: source || (targetPart ? `-- Script da peça: ${targetPart.name}
local part = script.Parent

print("Script inicializado na peça:", part.Name)

part.Touched:Connect(function(hit)
    print("Jogador encostou em:", part.Name)
end)
` : `-- Script Global do Workspace
print("Script Global do Workspace em execução!")
`),
      enabled: true,
      parentPartId,
      createdAt: new Date().toISOString()
    };

    setScripts(prev => [...prev, newScript]);
    setActiveEditingScript(newScript);
    setIsScriptEditorOpen(true);
  };

  const handleSaveScript = (updated: LuauScriptInstance) => {
    sounds.playClick();
    setScripts(prev => prev.map(s => s.id === updated.id ? updated : s));
    setActiveEditingScript(updated);
  };

  const handleDeleteScript = (scriptId: string) => {
    sounds.playClick();
    setScripts(prev => prev.filter(s => s.id !== scriptId));
    if (activeEditingScript?.id === scriptId) {
      setIsScriptEditorOpen(false);
      setActiveEditingScript(null);
    }
  };

  const handleOpenCopilotForScript = (prompt: string) => {
    setCopilotInitialPrompt(prompt);
    setIsCopilotOpen(true);
  };

  // Run/Stop Luau Scripts when Play Testing starts/stops in Studio
  useEffect(() => {
    if (isTesting) {
      scripts.forEach(script => {
        if (script.enabled) {
          const targetPart = parts.find(p => p.id === script.parentPartId);
          luauEngine.executeScript(script, {
            scriptId: script.id,
            scriptName: script.name,
            parentPart: targetPart,
            parts,
            onUpdatePart: (id, partial) => {
              setParts(prev => prev.map(p => p.id === id ? { ...p, ...partial } : p));
            },
            onAddPart: (newPart) => {
              setParts(prev => [...prev, newPart]);
            },
            onRemovePart: (id) => {
              setParts(prev => prev.filter(p => p.id !== id));
            },
            onLog: (entry) => {
              console.log(`[Studio Luau: ${entry.scriptName}]`, entry.message);
            }
          });
        }
      });
    } else {
      luauEngine.stopAll();
    }
    return () => {
      luauEngine.stopAll();
    };
  }, [isTesting, scripts]);

  // Add Part from toolbox
  const handleAddPart = (type: PartType | 'physics-crate' | 'physics-sphere' | 'invisible-barrier' | 'ghost-part') => {
    sounds.playClick();
    const newId = `part-${Date.now()}`;
    let newPart: BloxPart;

    const baseZ = selectedPart ? selectedPart.position.z - 6 : -5;
    const baseY = selectedPart ? selectedPart.position.y : 2;

    switch (type) {
      case 'physics-crate':
        newPart = {
          id: newId,
          name: 'Physics Crate',
          className: 'Part',
          type: 'block',
          position: { x: 0, y: baseY + 3, z: baseZ },
          size: { x: 3, y: 3, z: 3 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#d97706',
          material: 'wood',
          anchored: false,
          isAnchored: false,
          canCollide: true,
          transparency: 0,
          attributes: {
            Mass: 10,
            Pushable: true
          }
        };
        break;
      case 'physics-sphere':
        newPart = {
          id: newId,
          name: 'Rolling Boulder',
          className: 'Part',
          type: 'sphere',
          position: { x: 0, y: baseY + 3, z: baseZ },
          size: { x: 3, y: 3, z: 3 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#0284c7',
          material: 'plastic',
          anchored: false,
          isAnchored: false,
          canCollide: true,
          transparency: 0,
          attributes: {
            Mass: 8,
            Pushable: true
          }
        };
        break;
      case 'invisible-barrier':
        newPart = {
          id: newId,
          name: 'Invisible Barrier Wall',
          className: 'Part',
          type: 'block',
          position: { x: 0, y: baseY + 2, z: baseZ },
          size: { x: 8, y: 6, z: 1 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#64748b',
          material: 'forcefield',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 1.0,
          attributes: {
            Barrier: true,
            InvisibleWall: true
          }
        };
        break;
      case 'ghost-part':
        newPart = {
          id: newId,
          name: 'Hologram Pass-Through',
          className: 'Part',
          type: 'block',
          position: { x: 0, y: baseY + 2, z: baseZ },
          size: { x: 4, y: 6, z: 4 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#06b6d4',
          material: 'forcefield',
          anchored: true,
          isAnchored: true,
          canCollide: false,
          transparency: 0.5,
          attributes: {
            Hologram: true,
            Ghost: true
          }
        };
        break;
      case 'killbrick':
        newPart = {
          id: newId,
          name: 'Lava Block',
          className: 'Part',
          type: 'killbrick',
          position: { x: 0, y: baseY, z: baseZ },
          size: { x: 6, y: 0.8, z: 2 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#ef4444',
          material: 'neon',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0,
          script: { trigger: 'onTouch', action: 'damage', parameter: 100 },
          attributes: { Damage: 100 }
        };
        break;
      case 'bouncepad':
        newPart = {
          id: newId,
          name: 'Bounce Spring',
          className: 'Part',
          type: 'bouncepad',
          position: { x: 0, y: baseY, z: baseZ },
          size: { x: 4, y: 0.8, z: 4 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#06b6d4',
          material: 'neon',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0,
          script: { trigger: 'onTouch', action: 'bounce', parameter: 26 },
          attributes: { BounceForce: 26 }
        };
        break;
      case 'speedpad':
        newPart = {
          id: newId,
          name: 'Speed Booster',
          className: 'Part',
          type: 'speedpad',
          position: { x: 0, y: baseY, z: baseZ },
          size: { x: 4, y: 0.4, z: 6 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#10b981',
          material: 'neon',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0,
          script: { trigger: 'onTouch', action: 'speedBoost', parameter: 2.5 },
          attributes: { Multiplier: 2.5 }
        };
        break;
      case 'coin':
        newPart = {
          id: newId,
          name: 'Gold Coin',
          className: 'Part',
          type: 'coin',
          position: { x: 0, y: baseY + 2, z: baseZ },
          size: { x: 1.4, y: 1.4, z: 0.3 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#fbbf24',
          material: 'neon',
          anchored: true,
          isAnchored: true,
          canCollide: false,
          transparency: 0,
          coinValue: 25,
          attributes: { Value: 25 }
        };
        break;
      case 'teleporter':
        newPart = {
          id: newId,
          name: 'Finish Portal',
          className: 'Part',
          type: 'teleporter',
          position: { x: 0, y: baseY, z: baseZ },
          size: { x: 6, y: 1.5, z: 6 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#f59e0b',
          material: 'metal',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0,
          label: 'WINNER'
        };
        break;
      case 'sphere':
        newPart = {
          id: newId,
          name: 'Voxel Sphere',
          className: 'Part',
          type: 'sphere',
          position: { x: 0, y: baseY + 1.5, z: baseZ },
          size: { x: 3, y: 3, z: 3 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#3b82f6',
          material: 'plastic',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0
        };
        break;
      case 'wedge':
        newPart = {
          id: newId,
          name: 'Wedge Ramp',
          className: 'WedgePart',
          type: 'wedge',
          position: { x: 0, y: baseY + 1.5, z: baseZ },
          size: { x: 4, y: 3, z: 6 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#10b981',
          material: 'plastic',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0
        };
        break;
      case 'cylinder':
        newPart = {
          id: newId,
          name: 'Cylinder Pillar',
          className: 'Part',
          type: 'cylinder',
          position: { x: 0, y: baseY + 3, z: baseZ },
          size: { x: 2, y: 6, z: 2 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#8b5cf6',
          material: 'metal',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0
        };
        break;
      default:
        newPart = {
          id: newId,
          name: 'Platform Part',
          className: 'Part',
          type: 'block',
          position: { x: 0, y: baseY, z: baseZ },
          size: { x: 5, y: 1, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#6366f1',
          material: 'plastic',
          anchored: true,
          isAnchored: true,
          canCollide: true,
          transparency: 0
        };
        break;
    }

    setParts(prev => [...prev, newPart]);
    setSelectedPartId(newId);
    setSelectedPlayerPartId(null);
  };

  // Update selected part property
  const updateSelectedPart = (updates: Partial<BloxPart>) => {
    if (!selectedPartId) return;
    setParts(prev => prev.map(p => {
      if (p.id === selectedPartId) {
        const next = { ...p, ...updates };
        if (updates.isAnchored !== undefined) next.anchored = updates.isAnchored;
        if (updates.anchored !== undefined) next.isAnchored = updates.anchored;
        return next;
      }
      return p;
    }));
  };

  // Add custom instance attribute to selected part
  const handleAddAttribute = () => {
    if (!selectedPart || !newAttrKey.trim()) return;
    let parsedVal: string | number | boolean = newAttrVal;
    if (newAttrType === 'number') {
      parsedVal = parseFloat(newAttrVal) || 0;
    } else if (newAttrType === 'boolean') {
      parsedVal = newAttrVal === 'true' || newAttrVal === '1';
    }
    const currentAttrs = selectedPart.attributes || {};
    updateSelectedPart({
      attributes: {
        ...currentAttrs,
        [newAttrKey.trim()]: parsedVal
      }
    });
    setNewAttrKey('');
    setNewAttrVal(newAttrType === 'number' ? '10' : newAttrType === 'boolean' ? 'true' : 'Custom');
    setShowAddAttr(false);
  };

  const handleRemoveAttribute = (attrKey: string) => {
    if (!selectedPart || !selectedPart.attributes) return;
    const nextAttrs = { ...selectedPart.attributes };
    delete nextAttrs[attrKey];
    updateSelectedPart({ attributes: nextAttrs });
  };

  const handleUpdateAttributeValue = (attrKey: string, val: string | number | boolean) => {
    if (!selectedPart) return;
    updateSelectedPart({
      attributes: {
        ...(selectedPart.attributes || {}),
        [attrKey]: val
      }
    });
  };

  // Duplicate part
  const handleDuplicate = () => {
    if (!selectedPart) return;
    sounds.playClick();
    const newPart: BloxPart = {
      ...selectedPart,
      id: `part-${Date.now()}`,
      name: `${selectedPart.name} (Copy)`,
      position: {
        x: selectedPart.position.x,
        y: selectedPart.position.y,
        z: selectedPart.position.z - (selectedPart.size.z + 2)
      }
    };
    setParts(prev => [...prev, newPart]);
    setSelectedPartId(newPart.id);
  };

  // Delete part
  const handleDelete = () => {
    if (!selectedPartId) return;
    sounds.playClick();
    setParts(prev => prev.filter(p => p.id !== selectedPartId));
    setSelectedPartId(null);
  };

  // Publish / Save Experience
  const handlePublish = () => {
    sounds.playPurchase();
    const newGame: GameMetadata = {
      id: initialGame ? initialGame.id : `game-${Date.now()}`,
      title: publishTitle,
      description: publishDesc,
      genre: publishGenre,
      creator: initialGame ? initialGame.creator : {
        id: 'user-self',
        username: username,
        isVerified: true
      },
      thumbnail: initialGame?.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      playingCount: initialGame ? initialGame.playingCount : 1,
      visits: initialGame ? initialGame.visits : 1,
      likes: initialGame ? initialGame.likes : 5,
      dislikes: initialGame ? initialGame.dislikes : 0,
      price: publishPrice,
      parts: [...parts],
      scripts: [...scripts],
      tools: [...tools],
      guis: [...guis],
      spawnPoint: { ...spawnPoint },
      gamePasses: initialGame?.gamePasses,
      badges: initialGame?.badges,
      createdAt: initialGame ? initialGame.createdAt : 'Today',
      updatedAt: 'Just now'
    };

    onPublishGame(newGame);
    setShowPublishModal(false);
  };

  return (
    <div className={`flex flex-col ${isFullscreenViewport ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[calc(100vh-4rem)]'} bg-[#14151b] text-slate-200 select-none overflow-hidden`}>
      {/* Studio Top Ribbon Toolbar */}
      <div className="min-h-[3.25rem] bg-[#1e2029] border-b border-[#2d313f] px-2 sm:px-4 flex items-center justify-between gap-2 shadow-md z-20 shrink-0">
        {/* Scrollable Left & Center Tools Area */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 py-1 mr-1">
          {/* Optional Back to Discover button */}
          {onExitStudio && (
            <button
              onClick={() => { sounds.playClick(); onExitStudio(); }}
              className="p-1.5 rounded-xl bg-[#252836] hover:bg-[#2f3345] text-slate-300 hover:text-white transition-colors shrink-0"
              title="Voltar ao Catálogo de Jogos (Exit Studio)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Logo Badge */}
          <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-[#2d313f] shrink-0">
            <div className="w-7 h-7 bg-[#00a2ff] rounded-lg flex items-center justify-center font-black text-xs text-white shadow">
              BS
            </div>
            <span className="font-bold text-sm tracking-wide text-white hidden sm:inline">Blox Studio</span>
          </div>

          {/* Edit Mode Badge if editing an existing game */}
          {initialGame && (
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/35 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 shadow-xs">
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Editando:</span>
              <span className="max-w-[130px] sm:max-w-[180px] truncate text-white">{initialGame.title}</span>
            </div>
          )}

          {/* Test / Play Controls */}
          {!isTesting ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsTesting(true);
                  setSelectedPartId(null);
                  setSelectedPlayerPartId(null);
                }}
                className="flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                Play
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsPhysicsRunning(prev => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 ${
                  isPhysicsRunning 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                    : 'bg-[#252836] hover:bg-[#2d3142] text-amber-300 border border-amber-600/40'
                }`}
                title="Simular física dinâmica em tempo real"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">{isPhysicsRunning ? 'Pause Physics' : 'Run'}</span>
                <span className="sm:hidden">{isPhysicsRunning ? 'Pausar' : 'Física'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                setIsTesting(false);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer animate-pulse shrink-0 active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop
            </button>
          )}

          {/* Tools: Move, Scale, Color */}
          <div className="flex items-center bg-[#14151b] p-1 rounded-xl border border-[#2d313f] shrink-0">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTool === 'select' ? 'bg-[#00a2ff] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Select Part"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Select</span>
            </button>
            <button
              onClick={() => setActiveTool('move')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTool === 'move' ? 'bg-[#00a2ff] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Transform Position"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Move</span>
            </button>
            <button
              onClick={() => setActiveTool('scale')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTool === 'scale' ? 'bg-[#00a2ff] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Resize / Scale"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Scale</span>
            </button>
          </div>

          {/* Quick Actions for Selected Part */}
          {selectedPart && !isTesting && (
            <div className="flex items-center gap-1 pl-2 border-l border-[#2d313f] shrink-0">
              <button
                onClick={handleDuplicate}
                className="p-1.5 rounded-lg bg-[#282c38] hover:bg-[#323746] text-slate-300 hover:text-white transition-colors"
                title="Duplicate Part (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 transition-colors"
                title="Delete Part (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Script Editor & Copilot AI Buttons */}
          <div className="flex items-center gap-1.5 bg-[#14151b] p-1 rounded-xl border border-[#2d313f] shrink-0">
            <button
              onClick={() => {
                if (scripts.length > 0) {
                  handleOpenScript(scripts[0]);
                } else {
                  handleCreateNewScript(selectedPartId || 'Workspace');
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-[#202330] hover:bg-[#282d3e] border border-blue-500/30 transition-all cursor-pointer shadow-xs"
              title="Abrir Editor de Scripts Luau"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Script ({scripts.length})</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setIsCopilotOpen(prev => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
                isCopilotOpen
                  ? 'bg-purple-600 text-white shadow-purple-600/40 ring-1 ring-purple-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 active:scale-95'
              }`}
              title="Abrir Assistente IA Copilot (Luau & Game Builder)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
              <span>Copilot IA</span>
            </button>
          </div>

          {/* Template Loader (Desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-[#14151b] px-2 py-1 rounded-xl border border-[#2d313f] shrink-0">
            <span className="text-[11px] text-slate-400">Template:</span>
            <button
              onClick={() => { sounds.playClick(); setParts(TEMPLATES.obby); setSelectedPartId(null); }}
              className="text-xs px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-[#252836]"
            >
              Obby
            </button>
            <button
              onClick={() => { sounds.playClick(); setParts(TEMPLATES.baseplate); setSelectedPartId(null); }}
              className="text-xs px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-[#252836]"
            >
              Baseplate
            </button>
          </div>
        </div>

        {/* Pinned Right Side: Panels, Fullscreen & Publish (NEVER cut off or scrolled away) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1 border-l border-[#2d313f]/60 z-10">
          {/* Panel Visibility & Viewport Controls (Desktop only) */}
          {!isTesting && (
            <div className="hidden md:flex items-center bg-[#14151b] p-1 rounded-xl border border-[#2d313f] gap-0.5 shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowToolbox(prev => !prev);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showToolbox ? 'bg-[#252836] text-[#00a2ff]' : 'text-slate-400 hover:text-white'
                }`}
                title={showToolbox ? "Recolher Toolbox" : "Abrir Toolbox"}
              >
                {showToolbox ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                <span className="hidden xl:inline">Toolbox</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setShowExplorer(prev => !prev);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showExplorer ? 'bg-[#252836] text-[#00a2ff]' : 'text-slate-400 hover:text-white'
                }`}
                title={showExplorer ? "Recolher Explorer & Propriedades" : "Abrir Explorer & Propriedades"}
              >
                {showExplorer ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                <span className="hidden xl:inline">Explorer</span>
              </button>
            </div>
          )}

          {/* Fullscreen / Tela Cheia Toggle (ALWAYS VISIBLE & PINNED) */}
          <button
            onClick={handleToggleFullscreen}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-md ${
              isFullscreenViewport
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 ring-2 ring-amber-400'
                : 'bg-gradient-to-r from-[#00a2ff] to-[#0070f3] hover:from-[#38bdf8] hover:to-[#00a2ff] text-white shadow-blue-500/25 ring-1 ring-blue-400/40'
            }`}
            title={isFullscreenViewport ? "Sair da Tela Cheia" : "Tela Cheia (Fullscreen)"}
          >
            {isFullscreenViewport ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-black shrink-0" />
                <span className="font-bold hidden sm:inline">Sair Tela Cheia</span>
                <span className="font-bold sm:hidden">Sair</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="font-bold hidden sm:inline">Tela Cheia</span>
                <span className="font-bold sm:hidden">Tela Cheia</span>
              </>
            )}
          </button>

          {/* Publish / Save Experience Button */}
          <button
            onClick={() => { sounds.playClick(); setShowPublishModal(true); }}
            className={`flex items-center gap-1.5 sm:gap-2 text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer shrink-0 active:scale-95 ${
              initialGame
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/25 ring-1 ring-amber-400/50'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25'
            }`}
            title={initialGame ? "Salvar e Atualizar Experiência" : "Publicar Experiência"}
          >
            {initialGame ? <Save className="w-4 h-4 shrink-0" /> : <Upload className="w-4 h-4 shrink-0" />}
            <span className="hidden sm:inline">{initialGame ? 'Salvar Jogo' : 'Publish'}</span>
            <span className="sm:hidden">{initialGame ? 'Salvar' : 'Publicar'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Insert Toolbox & Asset Library */}
        {showToolbox && !isTesting && (
          <>
            {/* Mobile backdrop */}
            <div 
              onClick={() => setShowToolbox(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:relative lg:inset-auto lg:w-64 lg:z-10 bg-[#1a1c24] border-r border-[#2d313f] flex flex-col shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-[#2d313f] flex items-center justify-between shrink-0">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-[#00a2ff]" />
                  Insert Toolbox
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-[#252836] text-slate-400 px-1.5 py-0.5 rounded hidden sm:inline">
                    Click to place
                  </span>
                  <button
                    onClick={() => setShowToolbox(false)}
                    className="p-1 rounded-lg hover:bg-[#252836] text-slate-400 hover:text-white"
                    title="Fechar Toolbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Dynamic Physics & Instance Attributes section */}
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  Physics & Special Instances
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddPart('physics-crate')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/50 hover:border-amber-400 transition-all group cursor-pointer text-center"
                    title="Dynamic unanchored crate (Anchored: false, CanCollide: true)"
                  >
                    <Box className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-amber-300">Physics Crate</span>
                    <span className="text-[10px] text-amber-400/80">Unanchored (Falls)</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('physics-sphere')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-950/30 hover:bg-blue-900/50 border border-blue-900/50 hover:border-blue-400 transition-all group cursor-pointer text-center"
                    title="Dynamic rolling sphere (Anchored: false, CanCollide: true)"
                  >
                    <Circle className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-blue-300">Rolling Boulder</span>
                    <span className="text-[10px] text-blue-400/80">Unanchored (Rolls)</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('invisible-barrier')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-300 transition-all group cursor-pointer text-center"
                    title="Invisible Barrier (Transparency: 1.0, CanCollide: true)"
                  >
                    <EyeOff className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-200">Invisible Barrier</span>
                    <span className="text-[10px] text-slate-400">Transp: 1.0 (Solid)</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('ghost-part')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-900/50 hover:border-cyan-400 transition-all group cursor-pointer text-center"
                    title="Ghost Part (Transparency: 0.5, CanCollide: false)"
                  >
                    <Ghost className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-cyan-300">Hologram Ghost</span>
                    <span className="text-[10px] text-cyan-400/80">CanCollide: OFF</span>
                  </button>
                </div>
              </div>

              {/* Basic Geometry */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  Basic 3D Primitives
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddPart('block')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#222531] hover:bg-[#2c3040] border border-[#2d313f] hover:border-[#00a2ff] transition-all group cursor-pointer text-center"
                  >
                    <Box className="w-5 h-5 text-[#00a2ff] group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-200">Block / Cube</span>
                    <span className="text-[10px] text-slate-400">Anchored</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('sphere')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#222531] hover:bg-[#2c3040] border border-[#2d313f] hover:border-[#00a2ff] transition-all group cursor-pointer text-center"
                  >
                    <Circle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-200">Sphere</span>
                    <span className="text-[10px] text-slate-400">Anchored</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('wedge')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#222531] hover:bg-[#2c3040] border border-[#2d313f] hover:border-[#00a2ff] transition-all group cursor-pointer text-center"
                  >
                    <Move className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-200">Wedge Ramp</span>
                    <span className="text-[10px] text-slate-400">Slope</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('cylinder')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#222531] hover:bg-[#2c3040] border border-[#2d313f] hover:border-[#00a2ff] transition-all group cursor-pointer text-center"
                  >
                    <Maximize className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-slate-200">Cylinder</span>
                    <span className="text-[10px] text-slate-400">Column</span>
                  </button>
                </div>
              </div>

              {/* Interactive Game Mechanics */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  Gameplay Mechanics
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddPart('killbrick')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-500 transition-all group cursor-pointer text-center"
                  >
                    <Flame className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-rose-300">Killbrick</span>
                    <span className="text-[10px] text-rose-400/80">Lava / Trap</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('bouncepad')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-900/40 hover:border-cyan-500 transition-all group cursor-pointer text-center"
                  >
                    <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-cyan-300">Bounce Pad</span>
                    <span className="text-[10px] text-cyan-400/80">Super Spring</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('speedpad')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/40 hover:border-emerald-500 transition-all group cursor-pointer text-center"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-emerald-300">Nitro Pad</span>
                    <span className="text-[10px] text-emerald-400/80">Speed Boost</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('coin')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-950/60 border border-amber-900/40 hover:border-amber-500 transition-all group cursor-pointer text-center"
                  >
                    <Coins className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-amber-300">Blox Coin</span>
                    <span className="text-[10px] text-amber-400/80">Collectible</span>
                  </button>

                  <button
                    onClick={() => handleAddPart('teleporter')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-950/30 hover:bg-purple-950/60 border border-purple-900/40 hover:border-purple-500 transition-all group cursor-pointer col-span-2 text-center"
                  >
                    <Compass className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-bold text-amber-200">Victory Portal</span>
                    <span className="text-[10px] text-amber-400/80">Stage Goal & Confetti</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

        {/* Center: 3D Viewport */}
        <div className="flex-1 h-full relative overflow-hidden">
          <BloxEngine3D
            parts={parts}
            spawnPoint={spawnPoint}
            avatar={userAvatar}
            username={username}
            isStudioMode={true}
            isStudioTesting={isTesting}
            isPhysicsRunning={isPhysicsRunning}
            selectedPartId={selectedPartId}
            onSelectPart={handleSelectPart}
            showMobileControls={isTesting}
            scripts={scripts}
            tools={tools}
            guis={guis}
            className="w-full h-full"
          />

          {/* Left Edge Panel Toggle Tab */}
          {!isTesting && (
            <button
              onClick={() => {
                sounds.playClick();
                setShowToolbox(prev => !prev);
              }}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-30 flex items-center justify-center w-5 h-14 bg-[#1a1c24]/90 hover:bg-[#00a2ff] text-slate-400 hover:text-white rounded-r-lg border-y border-r border-[#2d313f] shadow-xl transition-all cursor-pointer group"
              title={showToolbox ? "Collapse Toolbox (Maximize Viewport)" : "Expand Insert Toolbox"}
            >
              <span className="text-[10px] font-bold group-hover:scale-125 transition-transform">
                {showToolbox ? '◀' : '▶'}
              </span>
            </button>
          )}

          {/* Right Edge Panel Toggle Tab */}
          {!isTesting && (
            <button
              onClick={() => {
                sounds.playClick();
                setShowExplorer(prev => !prev);
              }}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-30 flex items-center justify-center w-5 h-14 bg-[#1a1c24]/90 hover:bg-[#00a2ff] text-slate-400 hover:text-white rounded-l-lg border-y border-l border-[#2d313f] shadow-xl transition-all cursor-pointer group"
              title={showExplorer ? "Collapse Explorer (Maximize Viewport)" : "Expand Explorer & Properties"}
            >
              <span className="text-[10px] font-bold group-hover:scale-125 transition-transform">
                {showExplorer ? '▶' : '◀'}
              </span>
            </button>
          )}

          {/* Floating Pill: Quick Insert Part when Toolbox is Collapsed */}
          {!showToolbox && !isTesting && (
            <button
              onClick={() => {
                sounds.playClick();
                setShowToolbox(true);
              }}
              className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[#1a1c24]/90 hover:bg-[#232734] border border-[#00a2ff]/50 hover:border-[#00a2ff] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md transition-all cursor-pointer transform hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5 text-[#00a2ff]" />
              <span>+ Insert Part</span>
            </button>
          )}

          {/* Top Right Floating Controls in Viewport */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            {/* Floating Pill: Quick Inspector / Explorer when Right Panel is Collapsed */}
            {!showExplorer && !isTesting && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowExplorer(true);
                }}
                className="flex items-center gap-1.5 bg-[#1a1c24]/90 hover:bg-[#232734] border border-[#00a2ff]/50 hover:border-[#00a2ff] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Layers className="w-3.5 h-3.5 text-[#00a2ff]" />
                <span className="hidden sm:inline">{selectedPart ? `Properties (${selectedPart.name})` : 'Explorer'}</span>
                <span className="sm:hidden">{selectedPart ? 'Props' : 'Painel'}</span>
              </button>
            )}

            {/* Persistent Floating Fullscreen Button in Canvas */}
            <button
              onClick={handleToggleFullscreen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xl backdrop-blur-md transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
                isFullscreenViewport
                  ? 'bg-amber-500/95 hover:bg-amber-400 text-black border border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-[#181a24]/90 hover:bg-[#222534] text-white border border-[#00a2ff]/60 hover:border-[#00a2ff] ring-1 ring-[#00a2ff]/30'
              }`}
              title={isFullscreenViewport ? "Sair da Tela Cheia" : "Tela Cheia (Fullscreen)"}
            >
              {isFullscreenViewport ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="hidden sm:inline">Sair Tela Cheia</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#00a2ff] shrink-0" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Quick Action Floating Bar for Selected Part */}
          {selectedPart && !isTesting && (
            <div className="lg:hidden absolute bottom-3 left-3 right-3 z-30 bg-[#181a22]/95 backdrop-blur-md border border-[#00a2ff]/50 rounded-2xl p-2.5 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div 
                  className="w-4 h-4 rounded-md border border-white/20 shrink-0 shadow-sm"
                  style={{ backgroundColor: selectedPart.color }}
                />
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">{selectedPart.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedPart.className || 'Part'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setMobileRightTab('properties');
                    setShowExplorer(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 rounded-xl bg-[#252836] hover:bg-[#2f3346] text-slate-300 active:scale-95 cursor-pointer"
                  title="Duplicar"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 active:scale-95 cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedPartId(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  title="Desmarcar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Viewport Overlay Controls / Info Banner */}
          <div className="absolute top-14 left-3 pointer-events-none flex items-center gap-2 z-10 max-w-[calc(100vw-2rem)]">
            <div className="bg-[#181a20]/85 backdrop-blur-md px-3 py-1 rounded-xl border border-[#2b2f3c] text-xs font-medium text-slate-300 shadow-md">
              {isTesting ? (
                <span className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Testing • WASD / Space / Joystick
                </span>
              ) : isPhysicsRunning ? (
                <span className="flex items-center gap-2 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Physics Sim Active • Gravity & Collisions live
                </span>
              ) : (
                <>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Left-drag to rotate • Wheel to zoom • Click part to select • Use [<span className="text-[#00a2ff]">◀</span> <span className="text-[#00a2ff]">▶</span>] to expand viewport
                  </span>
                  <span className="text-[11px] text-slate-400 sm:hidden">
                    📱 1 dedo: girar • Pinça: zoom • Toque na peça para editar
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scene Explorer & Properties Inspector */}
        {!isTesting && showExplorer && (
          <>
            {/* Mobile backdrop */}
            <div
              onClick={() => setShowExplorer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
            />
            <div className="fixed inset-y-0 right-0 z-50 w-84 max-w-[92vw] lg:relative lg:inset-auto lg:w-80 lg:z-10 bg-[#1a1c24] border-l border-[#2d313f] flex flex-col shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
              {/* Mobile Drawer Top Bar */}
              <div className="lg:hidden p-2.5 bg-[#14151c] border-b border-[#2d313f] flex items-center justify-between shrink-0">
                <span className="font-bold text-xs text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00a2ff]" />
                  Explorer & Propriedades
                </span>
                <button
                  onClick={() => setShowExplorer(false)}
                  className="p-1 rounded-lg hover:bg-[#252836] text-slate-400 hover:text-white cursor-pointer"
                  title="Fechar Painel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="lg:hidden flex border-b border-[#2d313f] bg-[#12131a] shrink-0">
                <button
                  onClick={() => setMobileRightTab('explorer')}
                  className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                    mobileRightTab === 'explorer'
                      ? 'border-[#00a2ff] text-[#00a2ff] bg-[#1a1c26]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Explorer ({parts.length})
                </button>
                <button
                  onClick={() => setMobileRightTab('properties')}
                  className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                    mobileRightTab === 'properties'
                      ? 'border-purple-500 text-purple-400 bg-[#1a1c26]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Propriedades {selectedPart ? `(${selectedPart.name})` : ''}
                </button>
              </div>

              {/* Explorer Panel */}
              <div className={`${mobileRightTab === 'explorer' ? 'flex-1 flex' : 'hidden lg:flex'} lg:h-[45%] border-b border-[#2d313f] flex-col overflow-hidden`}>
              <div className="p-2.5 border-b border-[#2d313f] flex items-center justify-between bg-[#1f222d] shrink-0">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00a2ff]" />
                  Explorer ({parts.length + 8} instances)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Workspace</span>
              </div>

              <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
                {/* 1. Workspace Folder */}
                <div className="rounded-lg bg-[#14151c]/60 border border-[#262936] p-1">
                  <div className="flex items-center justify-between px-1.5 py-1 text-slate-300 font-semibold text-xs">
                    <button
                      onClick={() => setWorkspaceExpanded(prev => !prev)}
                      className="flex items-center gap-1.5 hover:text-white"
                    >
                      {workspaceExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Workspace</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCreateNewScript('Workspace')}
                        className="p-1 hover:bg-[#252836] rounded text-blue-400 hover:text-blue-300 cursor-pointer"
                        title="Adicionar Script ao Workspace"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-500">({parts.length} parts)</span>
                    </div>
                  </div>

                  {workspaceExpanded && (
                    <div className="pl-4 pr-1 py-0.5 space-y-0.5">
                      {/* Global Workspace Scripts */}
                      {scripts.filter(s => !s.parentPartId || s.parentPartId === 'Workspace').map(scr => (
                        <div
                          key={scr.id}
                          onClick={() => handleOpenScript(scr)}
                          className="flex items-center justify-between px-2 py-1 text-[11px] text-blue-300 hover:text-white rounded bg-blue-950/20 border border-blue-900/30 hover:bg-blue-900/30 cursor-pointer font-mono transition-colors"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCode className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate">{scr.name}</span>
                          </div>
                          <span className="text-[9px] text-blue-400/80 font-mono">Script</span>
                        </div>
                      ))}

                      {/* Built-in Camera Instance */}
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-400 rounded hover:bg-[#252836]">
                        <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">Camera</span>
                        <span className="text-[9px] text-slate-500 font-mono ml-auto">Camera</span>
                      </div>

                      {/* Built-in Terrain Baseplate Instance */}
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-400 rounded hover:bg-[#252836]">
                        <Layers className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">Baseplate</span>
                        <span className="text-[9px] text-emerald-500 font-mono ml-auto">500×2×500 studs</span>
                      </div>

                      {/* World Parts */}
                      {parts.map(part => {
                        const isSelected = part.id === selectedPartId;
                        const isPartAnchored = (part.anchored ?? part.isAnchored) ?? true;
                        const partScripts = scripts.filter(s => s.parentPartId === part.id);

                        return (
                          <div key={part.id} className="space-y-0.5">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setSelectedPartId(part.id);
                                setSelectedPlayerPartId(null);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition-all text-left group ${
                                isSelected
                                  ? 'bg-[#00a2ff] text-white shadow-sm'
                                  : 'text-slate-300 hover:bg-[#252836] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <div 
                                  className="w-2.5 h-2.5 rounded-sm border border-white/20 shrink-0"
                                  style={{ backgroundColor: part.color }}
                                />
                                <span className="truncate">{part.name}</span>
                              </div>
                              <div className="flex items-center gap-1 ml-1 shrink-0">
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateNewScript(part.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/30 rounded text-blue-300 hover:text-white cursor-pointer transition-opacity"
                                  title="Adicionar Script Luau nesta peça"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </span>
                                {part.transparency >= 1 && (
                                  <span title="Invisible (Transparency: 1.0)">
                                    <EyeOff className="w-2.5 h-2.5 text-slate-400" />
                                  </span>
                                )}
                                {!part.canCollide && (
                                  <span title="CanCollide: false (Pass-through)">
                                    <Ghost className="w-2.5 h-2.5 text-cyan-300" />
                                  </span>
                                )}
                                {!isPartAnchored ? (
                                  <span title="Unanchored (Dynamic Physics)">
                                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                                  </span>
                                ) : (
                                  <span title="Anchored (Locked)">
                                    <Anchor className="w-2.5 h-2.5 text-blue-300 opacity-60" />
                                  </span>
                                )}
                                <span className="text-[9px] opacity-70 uppercase font-mono">
                                  {part.className || 'Part'}
                                </span>
                              </div>
                            </button>

                            {/* Scripts attached to this specific Part */}
                            {partScripts.map(scr => (
                              <div
                                key={scr.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenScript(scr);
                                }}
                                className="ml-5 flex items-center justify-between px-2 py-0.5 rounded text-[10px] text-blue-300 hover:text-white hover:bg-blue-600/20 cursor-pointer font-mono border-l border-blue-500/30"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileCode className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                                  <span className="truncate">{scr.name}</span>
                                </div>
                                <span className="text-[8px] text-slate-400 font-mono">.luau</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Players Folder -> Character Model with Parts */}
                <div className="rounded-lg bg-[#14151c]/60 border border-[#262936] p-1">
                  <button
                    onClick={() => setPlayersExpanded(prev => !prev)}
                    className="w-full flex items-center gap-1.5 px-1.5 py-1 text-slate-300 hover:text-white font-semibold text-xs"
                  >
                    {playersExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Players</span>
                    <span className="text-[10px] text-slate-500 ml-auto">(1 Player)</span>
                  </button>

                  {playersExpanded && (
                    <div className="pl-3 pr-1 py-0.5 space-y-0.5">
                      {/* Character Model */}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-emerald-300 font-semibold">
                        <User className="w-3 h-3 text-emerald-400" />
                        <span>{username} (Character)</span>
                        <span className="text-[9px] text-emerald-500/80 ml-auto font-mono">Model</span>
                      </div>

                      {/* Character Limbs / Parts */}
                      <div className="pl-3 space-y-0.5">
                        {playerPartsList.map(pPart => {
                          const isSelected = pPart.id === selectedPlayerPartId;
                          return (
                            <button
                              key={pPart.id}
                              onClick={() => {
                                sounds.playClick();
                                setSelectedPlayerPartId(pPart.id);
                                setSelectedPartId(null);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition-all text-left ${
                                isSelected
                                  ? 'bg-[#00a2ff] text-white shadow-sm'
                                  : 'text-slate-300 hover:bg-[#252836] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Box className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span className="truncate">{pPart.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[9px] text-emerald-400 font-mono">CanCollide</span>
                                <span className="text-[9px] opacity-70 uppercase font-mono">Part</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Properties Inspector */}
            <div className={`${mobileRightTab === 'properties' ? 'flex-1 flex' : 'hidden lg:flex'} lg:h-[55%] flex-col overflow-hidden bg-[#161820]`}>
              <div className="p-2.5 border-b border-[#2d313f] flex items-center justify-between bg-[#1f222d] shrink-0">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-purple-400" />
                  Properties
                </span>
                {selectedPart ? (
                  <span className="text-[10px] text-purple-400 font-mono bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                    {selectedPart.className || 'Part'}
                  </span>
                ) : selectedPlayerPart ? (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    Player Part
                  </span>
                ) : null}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
                {/* CASE 1: Player Body Part is Selected */}
                {selectedPlayerPart ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs">{selectedPlayerPart.name}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded ml-auto">
                          Player Limb
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-300/80">
                        Player character components are active parts with <span className="font-bold text-white">CanCollide = true</span> and <span className="font-bold text-white">isAnchored = false</span> to interact with dynamic physics and push blocks.
                      </p>
                    </div>

                    {/* Transform (Studs) */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                        Vector3 Size (Studs)
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                        <div className="bg-[#1a1c24] p-1.5 rounded border border-[#2d313f]">
                          <span className="text-[9px] text-slate-500 block">X (Width)</span>
                          <span className="text-white font-bold">{selectedPlayerPart.size.x} studs</span>
                        </div>
                        <div className="bg-[#1a1c24] p-1.5 rounded border border-[#2d313f]">
                          <span className="text-[9px] text-slate-500 block">Y (Height)</span>
                          <span className="text-white font-bold">{selectedPlayerPart.size.y} studs</span>
                        </div>
                        <div className="bg-[#1a1c24] p-1.5 rounded border border-[#2d313f]">
                          <span className="text-[9px] text-slate-500 block">Z (Depth)</span>
                          <span className="text-white font-bold">{selectedPlayerPart.size.z} studs</span>
                        </div>
                      </div>
                    </div>

                    {/* Physics & Collision Status */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                        Collision & Physics
                      </span>
                      <div className="flex items-center justify-between bg-[#1a1c24] px-2.5 py-1.5 rounded border border-[#2d313f]">
                        <span className="text-slate-300">CanCollide</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          TRUE (Solid)
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-[#1a1c24] px-2.5 py-1.5 rounded border border-[#2d313f]">
                        <span className="text-slate-300">isAnchored</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          FALSE (Dynamic)
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-[#1a1c24] px-2.5 py-1.5 rounded border border-[#2d313f]">
                        <span className="text-slate-300">Transparency</span>
                        <span className="font-mono text-slate-300 font-bold">
                          {selectedPlayerPart.transparency} {selectedPlayerPart.transparency === 1 ? '(Invisible)' : '(Opaque)'}
                        </span>
                      </div>
                    </div>

                    {/* Instance Attributes on Player */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                        Instance Attributes
                      </span>
                      <div className="space-y-1 font-mono text-[11px]">
                        {Object.entries(selectedPlayerPart.attributes || {}).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between bg-[#1a1c24] px-2 py-1 rounded border border-[#2d313f]">
                            <span className="text-slate-400">{k}</span>
                            <span className="text-amber-400 font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : selectedPart ? (
                  /* CASE 2: World Part is Selected */
                  <>
                    {/* Part Name & ClassName */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">Name</label>
                        <span className="text-[9px] text-slate-500 font-mono">ClassName: {selectedPart.className || 'Part'}</span>
                      </div>
                      <input
                        type="text"
                        value={selectedPart.name}
                        onChange={(e) => updateSelectedPart({ name: e.target.value })}
                        className="w-full bg-[#111216] border border-[#2b2f3c] rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-[#00a2ff]"
                      />
                    </div>

                    {/* Transform: Position (Studs) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">Vector3 Position (Studs)</label>
                        <span className="text-[9px] text-slate-500 font-mono">X, Y, Z</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>X</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => updateSelectedPart({ position: { ...selectedPart.position, x: selectedPart.position.x - 1 } })} className="hover:text-white px-0.5">-1</button>
                              <button onClick={() => updateSelectedPart({ position: { ...selectedPart.position, x: selectedPart.position.x + 1 } })} className="hover:text-white px-0.5">+1</button>
                            </div>
                          </div>
                          <input
                            type="number"
                            value={selectedPart.position.x}
                            onChange={(e) => updateSelectedPart({
                              position: { ...selectedPart.position, x: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full bg-[#111216] border border-[#2b2f3c] rounded px-1.5 py-1 text-white text-center font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>Y</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => updateSelectedPart({ position: { ...selectedPart.position, y: selectedPart.position.y - 1 } })} className="hover:text-white px-0.5">-1</button>
                              <button onClick={() => updateSelectedPart({ position: { ...selectedPart.position, y: selectedPart.position.y + 1 } })} className="hover:text-white px-0.5">+1</button>
                            </div>
                          </div>
                          <input
                            type="number"
                            value={selectedPart.position.y}
                            onChange={(e) => updateSelectedPart({
                              position: { ...selectedPart.position, y: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full bg-[#111216] border border-[#2b2f3c] rounded px-1.5 py-1 text-white text-center font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>Z</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => updateSelectedPart({ position: { ...selectedPart.position, z: selectedPart.position.z - 1 } })} className="hover:text-white px-0.5">-1</button>
                              <button onClick={() => updateSelectedPart({ position: { ...selectedPart.position, z: selectedPart.position.z + 1 } })} className="hover:text-white px-0.5">+1</button>
                            </div>
                          </div>
                          <input
                            type="number"
                            value={selectedPart.position.z}
                            onChange={(e) => updateSelectedPart({
                              position: { ...selectedPart.position, z: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full bg-[#111216] border border-[#2b2f3c] rounded px-1.5 py-1 text-white text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transform: Vector3 Size (Studs) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">Vector3 Size (Studs)</label>
                        <span className="text-[9px] text-emerald-400 font-mono">
                          {selectedPart.size.x} × {selectedPart.size.y} × {selectedPart.size.z} studs
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mb-1.5">
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>Width (X)</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => updateSelectedPart({ size: { ...selectedPart.size, x: Math.max(0.5, selectedPart.size.x - 1) } })} className="hover:text-white px-0.5">-1</button>
                              <button onClick={() => updateSelectedPart({ size: { ...selectedPart.size, x: selectedPart.size.x + 1 } })} className="hover:text-white px-0.5">+1</button>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedPart.size.x}
                            onChange={(e) => updateSelectedPart({
                              size: { ...selectedPart.size, x: Math.max(0.2, parseFloat(e.target.value) || 1) }
                            })}
                            className="w-full bg-[#111216] border border-[#2b2f3c] rounded px-1.5 py-1 text-white text-center font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>Height (Y)</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => updateSelectedPart({ size: { ...selectedPart.size, y: Math.max(0.5, selectedPart.size.y - 1) } })} className="hover:text-white px-0.5">-1</button>
                              <button onClick={() => updateSelectedPart({ size: { ...selectedPart.size, y: selectedPart.size.y + 1 } })} className="hover:text-white px-0.5">+1</button>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedPart.size.y}
                            onChange={(e) => updateSelectedPart({
                              size: { ...selectedPart.size, y: Math.max(0.2, parseFloat(e.target.value) || 1) }
                            })}
                            className="w-full bg-[#111216] border border-[#2b2f3c] rounded px-1.5 py-1 text-white text-center font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>Depth (Z)</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => updateSelectedPart({ size: { ...selectedPart.size, z: Math.max(0.5, selectedPart.size.z - 1) } })} className="hover:text-white px-0.5">-1</button>
                              <button onClick={() => updateSelectedPart({ size: { ...selectedPart.size, z: selectedPart.size.z + 1 } })} className="hover:text-white px-0.5">+1</button>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedPart.size.z}
                            onChange={(e) => updateSelectedPart({
                              size: { ...selectedPart.size, z: Math.max(0.2, parseFloat(e.target.value) || 1) }
                            })}
                            className="w-full bg-[#111216] border border-[#2b2f3c] rounded px-1.5 py-1 text-white text-center font-mono"
                          />
                        </div>
                      </div>

                      {/* Quick Stud Presets */}
                      <div className="flex flex-wrap gap-1">
                        {[
                          { l: '1×1×1', s: { x: 1, y: 1, z: 1 } },
                          { l: '2×2×2', s: { x: 2, y: 2, z: 2 } },
                          { l: '4×1×4', s: { x: 4, y: 1, z: 4 } },
                          { l: '4×4×1', s: { x: 4, y: 4, z: 1 } },
                          { l: '12×1×12', s: { x: 12, y: 1, z: 12 } },
                          { l: 'Barrier', s: { x: 14, y: 6, z: 1 } }
                        ].map(preset => (
                          <button
                            key={preset.l}
                            onClick={() => updateSelectedPart({ size: preset.s })}
                            className="text-[9px] bg-[#1a1c24] hover:bg-[#252836] border border-[#2b2f3c] hover:border-[#00a2ff] px-1.5 py-0.5 rounded text-slate-300 font-mono transition-colors"
                          >
                            {preset.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Appearance: Color & Material */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Color & Material</label>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {COLOR_PRESETS.slice(0, 10).map(c => (
                          <button
                            key={c}
                            onClick={() => updateSelectedPart({ color: c })}
                            className={`w-5 h-5 rounded-md border transition-transform ${
                              selectedPart.color === c ? 'scale-125 border-white ring-2 ring-[#00a2ff]' : 'border-white/10 hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="color"
                          value={selectedPart.color}
                          onChange={(e) => updateSelectedPart({ color: e.target.value })}
                          className="w-full h-8 rounded bg-[#111216] border border-[#2b2f3c] cursor-pointer p-0.5"
                        />
                        <select
                          value={selectedPart.material}
                          onChange={(e) => updateSelectedPart({ material: e.target.value as MaterialType })}
                          className="w-full bg-[#111216] border border-[#2b2f3c] rounded-lg px-2 py-1 text-white text-[11px]"
                        >
                          <option value="plastic">SmoothPlastic</option>
                          <option value="neon">Neon (Glow)</option>
                          <option value="metal">DiamondPlate Metal</option>
                          <option value="glass">Glass</option>
                          <option value="brick">Brick</option>
                          <option value="forcefield">Forcefield (Grid)</option>
                        </select>
                      </div>
                    </div>

                    {/* Appearance: Transparency (0 to 1) */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-400 flex items-center gap-1 font-bold">
                          {selectedPart.transparency >= 1 ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                          Transparency (0 to 1)
                        </label>
                        <span className="font-mono text-xs font-bold text-white bg-[#1a1c24] px-1.5 py-0.5 rounded border border-[#2d313f]">
                          {(selectedPart.transparency ?? 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={selectedPart.transparency ?? 0}
                          onChange={(e) => updateSelectedPart({ transparency: parseFloat(e.target.value) || 0 })}
                          className="flex-1 accent-[#00a2ff] cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={selectedPart.transparency ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0));
                            updateSelectedPart({ transparency: val });
                          }}
                          className="w-12 bg-[#1a1c24] border border-[#2b2f3c] rounded px-1 py-0.5 text-center text-white font-mono text-[11px]"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateSelectedPart({ transparency: 0 })}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors ${
                              (selectedPart.transparency ?? 0) === 0 ? 'bg-[#00a2ff] text-white border-blue-400' : 'bg-[#1a1c24] text-slate-400 border-[#2b2f3c] hover:text-white'
                            }`}
                          >
                            0 (Opaque)
                          </button>
                          <button
                            onClick={() => updateSelectedPart({ transparency: 0.5 })}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors ${
                              (selectedPart.transparency ?? 0) === 0.5 ? 'bg-[#00a2ff] text-white border-blue-400' : 'bg-[#1a1c24] text-slate-400 border-[#2b2f3c] hover:text-white'
                            }`}
                          >
                            0.5 (Semi)
                          </button>
                          <button
                            onClick={() => updateSelectedPart({ transparency: 1.0 })}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors ${
                              (selectedPart.transparency ?? 0) === 1.0 ? 'bg-[#00a2ff] text-white border-blue-400' : 'bg-[#1a1c24] text-slate-400 border-[#2b2f3c] hover:text-white'
                            }`}
                          >
                            1.0 (Invisible)
                          </button>
                        </div>
                      </div>

                      {/* Informational description based on transparency & collision */}
                      <div className="text-[10px] text-slate-400 bg-[#171922] p-1.5 rounded border border-[#252835]">
                        {(selectedPart.transparency ?? 0) >= 1 ? (
                          selectedPart.canCollide ? (
                            <span className="text-amber-300 font-medium">
                              🛡️ Invisible Barrier Wall: Part is completely invisible (1.0), but solid collision is ON so players/parts cannot pass through.
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              👻 Ghost Trigger: Part is completely invisible (1.0) and non-solid (CanCollide is OFF).
                            </span>
                          )
                        ) : (selectedPart.transparency ?? 0) > 0 ? (
                          <span className="text-cyan-300">
                            ✨ Semi-Transparent Part ({Math.round((selectedPart.transparency ?? 0) * 100)}% transparent).
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            🧱 Opaque Solid Part (Normal rendering).
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Collision & Physics: isAnchored & canCollide */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                        Collision & Physics
                      </span>

                      {/* isAnchored / Anchored */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(selectedPart.anchored ?? selectedPart.isAnchored) ?? true}
                              onChange={(e) => updateSelectedPart({
                                anchored: e.target.checked,
                                isAnchored: e.target.checked
                              })}
                              className="rounded text-[#00a2ff] w-4 h-4"
                            />
                            <span className="font-bold text-white text-xs flex items-center gap-1">
                              <Anchor className="w-3.5 h-3.5 text-blue-400" />
                              isAnchored (Anchored)
                            </span>
                          </label>
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            ((selectedPart.anchored ?? selectedPart.isAnchored) ?? true)
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {((selectedPart.anchored ?? selectedPart.isAnchored) ?? true) ? 'LOCKED' : 'DYNAMIC'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-6 leading-tight">
                          {((selectedPart.anchored ?? selectedPart.isAnchored) ?? true)
                            ? 'Part is locked in place and does NOT react with physics/gravity.'
                            : 'Part is dynamic! Falls with gravity, rolls/tumbles, and reacts to collisions & player pushing.'}
                        </p>
                      </div>

                      {/* canCollide */}
                      <div className="space-y-1 pt-1 border-t border-[#232634]">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPart.canCollide ?? true}
                              onChange={(e) => updateSelectedPart({ canCollide: e.target.checked })}
                              className="rounded text-[#00a2ff] w-4 h-4"
                            />
                            <span className="font-bold text-white text-xs flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-emerald-400" />
                              canCollide (Solid)
                            </span>
                          </label>
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            selectedPart.canCollide
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {selectedPart.canCollide ? 'SOLID' : 'PASS-THROUGH'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-6 leading-tight">
                          {selectedPart.canCollide
                            ? 'Collides with other parts and player characters.'
                            : 'Pass-through phantom part. Players and other parts pass right through.'}
                        </p>
                      </div>
                    </div>

                    {/* Luau Scripts for this Part */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-blue-400" />
                          Scripts Luau ({scripts.filter(s => s.parentPartId === selectedPart.id).length})
                        </span>
                        <button
                          onClick={() => handleCreateNewScript(selectedPart.id)}
                          className="flex items-center gap-1 text-[10px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar Script
                        </button>
                      </div>

                      <div className="space-y-1">
                        {scripts.filter(s => s.parentPartId === selectedPart.id).length === 0 ? (
                          <div className="text-[11px] text-slate-500 italic py-1 text-center">
                            Nenhum script anexado a esta peça.
                          </div>
                        ) : (
                          scripts.filter(s => s.parentPartId === selectedPart.id).map(scr => (
                            <div
                              key={scr.id}
                              onClick={() => handleOpenScript(scr)}
                              className="flex items-center justify-between p-2 rounded-lg bg-[#181a24] hover:bg-[#202330] border border-[#2b2f3c] text-xs cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="font-semibold text-slate-200 truncate">{scr.name}</span>
                              </div>
                              <span className="text-[10px] text-blue-400 hover:text-white font-medium bg-blue-500/10 px-2 py-0.5 rounded">
                                Editar
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Custom Instance Attributes Manager */}
                    <div className="bg-[#111216] border border-[#2b2f3c] rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          Attributes ({Object.keys(selectedPart.attributes || {}).length})
                        </span>
                        <button
                          onClick={() => setShowAddAttr(prev => !prev)}
                          className="flex items-center gap-1 text-[10px] bg-[#1e212b] hover:bg-[#282c3a] text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded font-semibold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Attribute
                        </button>
                      </div>

                      {/* Add Attribute Inline Form */}
                      {showAddAttr && (
                        <div className="bg-[#191b24] p-2 rounded-lg border border-amber-500/30 space-y-2">
                          <span className="text-[10px] font-bold text-amber-300 block">New Instance Attribute</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-slate-400">Name</span>
                              <input
                                type="text"
                                placeholder="e.g. Mass, Damage, Speed"
                                value={newAttrKey}
                                onChange={(e) => setNewAttrKey(e.target.value)}
                                className="w-full bg-[#111216] border border-[#2d313f] rounded px-1.5 py-0.5 text-white text-[11px]"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400">Type</span>
                              <select
                                value={newAttrType}
                                onChange={(e) => {
                                  const t = e.target.value as 'number' | 'string' | 'boolean';
                                  setNewAttrType(t);
                                  setNewAttrVal(t === 'number' ? '10' : t === 'boolean' ? 'true' : 'Custom');
                                }}
                                className="w-full bg-[#111216] border border-[#2d313f] rounded px-1.5 py-0.5 text-white text-[11px]"
                              >
                                <option value="number">number</option>
                                <option value="string">string</option>
                                <option value="boolean">boolean</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400">Value</span>
                            {newAttrType === 'boolean' ? (
                              <select
                                value={newAttrVal}
                                onChange={(e) => setNewAttrVal(e.target.value)}
                                className="w-full bg-[#111216] border border-[#2d313f] rounded px-1.5 py-0.5 text-white text-[11px]"
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type={newAttrType === 'number' ? 'number' : 'text'}
                                value={newAttrVal}
                                onChange={(e) => setNewAttrVal(e.target.value)}
                                className="w-full bg-[#111216] border border-[#2d313f] rounded px-1.5 py-0.5 text-white text-[11px]"
                              />
                            )}
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setShowAddAttr(false)}
                              className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddAttribute}
                              className="px-2.5 py-0.5 rounded text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold"
                            >
                              Save Attribute
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Attributes List */}
                      {selectedPart.attributes && Object.keys(selectedPart.attributes).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(selectedPart.attributes).map(([attrKey, attrVal]) => {
                            const valType = typeof attrVal;
                            return (
                              <div
                                key={attrKey}
                                className="flex items-center justify-between bg-[#191b24] px-2 py-1.5 rounded border border-[#2b2f3c] text-[11px]"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-200">{attrKey}</span>
                                  <span className="text-[9px] bg-[#252836] text-slate-400 px-1 py-0.2 rounded font-mono">
                                    {valType}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {valType === 'boolean' ? (
                                    <button
                                      onClick={() => handleUpdateAttributeValue(attrKey, !attrVal)}
                                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                        attrVal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                      }`}
                                    >
                                      {String(attrVal)}
                                    </button>
                                  ) : (
                                    <input
                                      type={valType === 'number' ? 'number' : 'text'}
                                      value={attrVal as any}
                                      onChange={(e) => {
                                        const newVal = valType === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value;
                                        handleUpdateAttributeValue(attrKey, newVal);
                                      }}
                                      className="w-16 bg-[#111216] border border-[#2d313f] rounded px-1 py-0.5 text-white font-mono text-center text-[10px]"
                                    />
                                  )}
                                  <button
                                    onClick={() => handleRemoveAttribute(attrKey)}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                                    title="Delete Attribute"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic text-center py-1">
                          No custom attributes defined on this Part. Click &quot;Add Attribute&quot; to attach properties like Mass, Pushable, or Damage.
                        </p>
                      )}
                    </div>

                    {/* Floating Sign / Text Label */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Floating Sign Label</label>
                      <input
                        type="text"
                        placeholder="e.g. STAGE 2, CHECKPOINT, DANGER"
                        value={selectedPart.label || ''}
                        onChange={(e) => updateSelectedPart({ label: e.target.value })}
                        className="w-full bg-[#111216] border border-[#2b2f3c] rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-[#00a2ff]"
                      />
                    </div>
                  </>
                ) : (
                  /* CASE 3: Nothing Selected */
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <Box className="w-8 h-8 mb-2 opacity-40 text-purple-400" />
                    <p className="text-xs text-slate-400 font-semibold mb-1">No Instance Selected</p>
                    <p className="text-[11px] text-slate-500">
                      Select a Part in the Viewport or click on Workspace / Players in the Explorer to inspect its Vector3 size (studs), Transparency (0 to 1), isAnchored, CanCollide, and custom Attributes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Mobile Studio Bottom Action Bar (Visible on < lg screens) */}
      {!isTesting ? (
        <div className="lg:hidden bg-[#161820]/95 backdrop-blur-md border-t border-[#2d313f] px-2 py-1.5 flex items-center justify-around z-30 shrink-0 shadow-2xl select-none">
          {/* 1. Play / Test */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsTesting(true);
              setSelectedPartId(null);
              setSelectedPlayerPartId(null);
            }}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-emerald-400 active:scale-95 transition-transform cursor-pointer"
          >
            <Play className="w-5 h-5 fill-emerald-400" />
            <span className="text-[10px] font-bold">Testar</span>
          </button>

          {/* 2. Inserir (Toolbox) */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowToolbox(prev => !prev);
              setShowExplorer(false);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
              showToolbox ? 'text-[#00a2ff] font-bold' : 'text-slate-300'
            }`}
          >
            <Box className="w-5 h-5" />
            <span className="text-[10px]">Inserir</span>
          </button>

          {/* 3. Ferramenta Ativa (Select / Move / Scale) */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTool(prev => prev === 'select' ? 'move' : prev === 'move' ? 'scale' : 'select');
            }}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-300 active:scale-95 transition-transform cursor-pointer"
            title="Alternar Ferramenta: Selecionar, Mover ou Escalar"
          >
            {activeTool === 'select' ? <Box className="w-5 h-5 text-[#00a2ff]" /> :
             activeTool === 'move' ? <Move className="w-5 h-5 text-amber-400" /> :
             <Maximize className="w-5 h-5 text-emerald-400" />}
            <span className="text-[10px] capitalize">{activeTool}</span>
          </button>

          {/* 4. Explorer & Propriedades */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowExplorer(prev => !prev);
              setShowToolbox(false);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
              showExplorer ? 'text-[#00a2ff] font-bold' : 'text-slate-300'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">Painel</span>
          </button>

          {/* 5. Tela Cheia (Fullscreen) */}
          <button
            onClick={handleToggleFullscreen}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-transform active:scale-95 cursor-pointer ${
              isFullscreenViewport ? 'text-amber-400 font-bold' : 'text-cyan-400'
            }`}
            title="Tela Cheia (Fullscreen)"
          >
            {isFullscreenViewport ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            <span className="text-[10px]">{isFullscreenViewport ? 'Sair' : 'Tela Cheia'}</span>
          </button>

          {/* 6. Publicar / Salvar Experiência */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowPublishModal(true);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl active:scale-95 transition-transform cursor-pointer ${
              initialGame ? 'text-amber-400 font-bold' : 'text-emerald-400'
            }`}
          >
            {initialGame ? <Save className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            <span className="text-[10px]">{initialGame ? 'Salvar' : 'Publicar'}</span>
          </button>
        </div>
      ) : (
        /* Mobile Bar during testing: prominent Stop and Fullscreen */
        <div className="lg:hidden bg-[#161820]/95 backdrop-blur-md border-t border-[#2d313f] px-4 py-2 flex items-center justify-between z-30 shrink-0 select-none">
          <button
            onClick={() => {
              sounds.playClick();
              setIsTesting(false);
            }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 animate-pulse active:scale-95 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            Parar Teste (Stop)
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#252836] border border-cyan-500/40 text-cyan-300 font-bold text-xs active:scale-95 cursor-pointer"
          >
            {isFullscreenViewport ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
            <span>{isFullscreenViewport ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
          </button>
        </div>
      )}

      {/* Publish Game Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1b1d26] border border-[#2e3242] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2e3242] mb-5">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  initialGame ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-[#00a2ff]'
                }`}>
                  {initialGame ? <Save className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {initialGame ? 'Salvar e Atualizar Experiência' : 'Publish Experience'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {initialGame ? 'Suas alterações serão salvas diretamente no Catálogo de Jogos' : 'Deploy your 3D world to the BloxVerse Discover Feed'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Game Title</label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  className="w-full bg-[#121319] border border-[#2b2f3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00a2ff] text-sm"
                  placeholder="e.g. Super Neon Parkour Obby"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Description</label>
                <textarea
                  value={publishDesc}
                  onChange={(e) => setPublishDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121319] border border-[#2b2f3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00a2ff] text-sm resize-none"
                  placeholder="Tell players what makes your experience epic..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Genre</label>
                  <select
                    value={publishGenre}
                    onChange={(e) => setPublishGenre(e.target.value as GameMetadata['genre'])}
                    className="w-full bg-[#121319] border border-[#2b2f3c] rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="Obby / Parkour">Obby / Parkour</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Tycoon">Tycoon</option>
                    <option value="Survival">Survival</option>
                    <option value="Horror">Horror</option>
                    <option value="Sandbox">Sandbox</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Price (BloxBux)</label>
                  <input
                    type="number"
                    min="0"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121319] border border-[#2b2f3c] rounded-xl px-3 py-2 text-white text-sm"
                    placeholder="0 = Free"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">0 = Free to Play for everyone</span>
                </div>
              </div>

              <div className="bg-[#121319] border border-[#282b36] rounded-xl p-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-slate-300">
                  Ready to deploy! Your experience has <span className="font-bold text-emerald-400">{parts.length} parts</span> and includes automatic leaderboard & checkpoints.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2e3242]">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                  initialGame
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-amber-500/25 ring-2 ring-amber-300'
                    : 'bg-[#00a2ff] hover:bg-[#0090e0] text-white shadow-blue-500/25'
                }`}
              >
                {initialGame ? <Save className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                <span>{initialGame ? 'Salvar Alterações no Catálogo' : 'Publish to Discover'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luau Script Editor Modal */}
      {isScriptEditorOpen && activeEditingScript && (
        <ScriptEditorModal
          script={activeEditingScript}
          parts={parts}
          isOpen={isScriptEditorOpen}
          onClose={() => setIsScriptEditorOpen(false)}
          onSaveScript={handleSaveScript}
          onDeleteScript={handleDeleteScript}
          onUpdatePart={(id, partial) => setParts(prev => prev.map(p => p.id === id ? { ...p, ...partial } : p))}
          onAddPart={(newPart) => setParts(prev => [...prev, newPart])}
          onRemovePart={(id) => setParts(prev => prev.filter(p => p.id !== id))}
          onOpenCopilotWithPrompt={handleOpenCopilotForScript}
          playerPos={spawnPoint}
        />
      )}

      {/* BloxCopilot AI Assistant Drawer */}
      <BloxCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        parts={parts}
        selectedPartId={selectedPartId}
        scripts={scripts}
        onAddPart={(newPart) => {
          sounds.playPurchase();
          setParts(prev => [...prev, newPart]);
        }}
        onUpdatePart={(id, partial) => {
          setParts(prev => prev.map(p => p.id === id ? { ...p, ...partial } : p))}
        }
        onCreateScript={({ name, source, parentPartId }) => {
          handleCreateNewScript(parentPartId || 'Workspace', name, source);
        }}
        onUpdateScriptSource={(scriptId, newSource) => {
          setScripts(prev => prev.map(s => s.id === scriptId ? { ...s, source: newSource } : s));
          if (activeEditingScript?.id === scriptId) {
            setActiveEditingScript(prev => prev ? { ...prev, source: newSource } : null);
          }
        }}
        activeScriptId={activeEditingScript?.id}
        gameTitle={publishTitle}
        gameGenre={publishGenre}
        initialPrompt={copilotInitialPrompt}
      />
    </div>
  );
};
