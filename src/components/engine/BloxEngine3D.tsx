import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import confetti from 'canvas-confetti';
import { 
  BloxPart, 
  AvatarAppearance, 
  BloxVector3, 
  BloxTexture, 
  BloxWeldConstraint, 
  BloxTool, 
  BloxGuiElement,
  NormalId 
} from '../../types';
import { createBlockyCharacter, CharacterMeshController } from './character3D';
import { sounds } from '../../services/soundEffects';
import { MobileControls, MobileControlState } from './MobileControls';
import { LuauScriptInstance } from '../../services/luau/types';
import { luauEngine } from '../../services/luau/luauRuntime';
import {
  ColliderShapeType,
  ShapeCollider,
  collideShapePair,
  doesCapsuleOverlapCollider,
  eulerDegToQuaternion,
  getBoundingRadius,
  getLowestPointOnShape,
  getPartColliderShape,
  intersectCapsuleWithCollider,
  partToCollider,
  sampleWalkableSurfaceOnCollider
} from './collision3D';
import { Sword, Zap, Compass, Moon, Flashlight, Heart, Coins, Move, Navigation, MousePointer } from 'lucide-react';

export interface RuntimeTool {
  id: string;
  name: string;
  icon: string;
  slot: number; // 1 to 5
  type: 'sword' | 'cola' | 'speed_coil' | 'gravity_coil' | 'flashlight' | 'custom';
  description: string;
}

export const BUILTIN_TOOLS: RuntimeTool[] = [
  { id: 'tool-sword', name: 'Espada Blox', icon: '⚔️', slot: 1, type: 'sword', description: 'Ataca e causa dano ao clicar' },
  { id: 'tool-cola', name: 'Bloxy Cola', icon: '🥤', slot: 2, type: 'cola', description: 'Bebe e recupera 25 HP' },
  { id: 'tool-speed', name: 'Speed Coil', icon: '🌀', slot: 3, type: 'speed_coil', description: 'Velocidade extrema (+16)' },
  { id: 'tool-gravity', name: 'Gravity Coil', icon: '🚀', slot: 4, type: 'gravity_coil', description: 'Pulo lunar com gravidade reduzida' },
  { id: 'tool-flashlight', name: 'Lanterna', icon: '🔦', slot: 5, type: 'flashlight', description: 'Ilumina o cenário em 3D' }
];

interface BloxEngine3DProps {
  gameId?: string;
  experienceTitle?: string;
  incomingChatMessage?: { sender: string; text: string; timestamp?: string } | null;
  parts: BloxPart[];
  spawnPoint: BloxVector3;
  avatar: AvatarAppearance;
  isStudioMode?: boolean;
  isStudioTesting?: boolean;
  isPhysicsRunning?: boolean;
  selectedPartId?: string | null;
  onSelectPart?: (partId: string | null) => void;
  onCoinCollected?: (amount: number) => void;
  onVictory?: () => void;
  activePasses?: string[];
  chatBubbleText?: string | null;
  className?: string;
  onTransformPart?: (partId: string, newPosition: BloxVector3) => void;
  showMobileControls?: boolean;
  resetTrigger?: number;
  onHealthChange?: (hp: number) => void;
  username?: string;
  scripts?: LuauScriptInstance[];
  onUpdatePart?: (partId: string, partial: Partial<BloxPart>) => void;
  userBloxbux?: number;
  tools?: BloxTool[];
  guis?: BloxGuiElement[];
}

export const BloxEngine3D: React.FC<BloxEngine3DProps> = ({
  gameId = 'experience-default',
  experienceTitle,
  incomingChatMessage,
  parts,
  spawnPoint,
  avatar,
  isStudioMode = false,
  isStudioTesting = false,
  isPhysicsRunning = false,
  selectedPartId,
  onSelectPart,
  onCoinCollected,
  onVictory,
  activePasses = [],
  chatBubbleText,
  className = '',
  onTransformPart,
  showMobileControls = true,
  resetTrigger,
  onHealthChange,
  username = 'BloxMaster',
  scripts = [],
  onUpdatePart,
  userBloxbux = 100,
  tools: customTools = [],
  guis = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collectedCoinIds, setCollectedCoinIds] = useState<Set<string>>(new Set());

  // Detect active StarterCharacter Rig in the world
  const starterRig = useMemo(
    () => parts.find(p => (p.type === 'rig' || p.type === 'npc') && p.attributes?.StarterCharacter === true) || null,
    [parts]
  );
  const starterRigRef = useRef<BloxPart | null>(starterRig);
  starterRigRef.current = starterRig;

  const effectiveMaxHealth = useMemo(() => {
    if (!starterRig) return 100;
    const mh = Number(starterRig.attributes?.MaxHealth ?? 100);
    return Number.isFinite(mh) && mh >= 1 ? mh : 100;
  }, [starterRig]);

  const effectiveAvatar = useMemo<AvatarAppearance>(() => {
    if (!starterRig) return avatar;
    const attrs = starterRig.attributes || {};
    const headCol = String(attrs.RigHeadColor || '#facc15');
    const torsoCol = String(attrs.RigTorsoColor || starterRig.color || '#0284c7');
    const armCol = String(attrs.RigArmColor || attrs.RigHeadColor || '#facc15');
    const legCol = String(attrs.RigLegColor || '#1e293b');
    const face = String(attrs.RigFace || 'face-smile');
    return {
      bodyColors: {
        head: headCol,
        torso: torsoCol,
        leftArm: armCol,
        rightArm: armCol,
        leftLeg: legCol,
        rightLeg: legCol
      },
      equippedFace: face,
      equippedShirt: 'rig-plain',
      equippedPants: 'rig-plain',
      scale: {
        width: Math.max(0.25, (starterRig.size?.x || 4) / 4),
        height: Math.max(0.25, (starterRig.size?.y || 5.5) / 5.5),
        head: 1
      },
      animation: 'idle'
    };
  }, [starterRig, avatar]);

  const [health, setHealth] = useState<number>(effectiveMaxHealth);
  const [maxHealth, setMaxHealth] = useState<number>(effectiveMaxHealth);
  const healthRef = useRef<number>(health);
  healthRef.current = health;
  const maxHealthRef = useRef<number>(maxHealth);
  maxHealthRef.current = maxHealth;

  const customWalkSpeedRef = useRef<number | null>(null);
  const customJumpPowerRef = useRef<number | null>(null);

  const [showDamageFlash, setShowDamageFlash] = useState<boolean>(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<BloxVector3>(spawnPoint);

  // Equipped tool state
  const [equippedTool, setEquippedTool] = useState<RuntimeTool | null>(null);
  const equippedToolRef = useRef<RuntimeTool | null>(null);
  equippedToolRef.current = equippedTool;

  // ScreenGui state
  const [screenGuis, setScreenGuis] = useState<BloxGuiElement[]>(guis);

  // Dynamic Hotbar Tools (Builtin + Custom Game Tools)
  const [availableTools, setAvailableTools] = useState<RuntimeTool[]>(() => {
    const list = [...BUILTIN_TOOLS];
    if (customTools && customTools.length > 0) {
      customTools.forEach((ct, i) => {
        list.push({
          id: ct.id,
          name: ct.name,
          icon: ct.icon || '⚔️',
          slot: 6 + i,
          type: (ct.actionType as any) || 'custom',
          description: ct.toolTip || ct.name
        });
      });
    }
    return list;
  });
  const availableToolsRef = useRef<RuntimeTool[]>(availableTools);
  availableToolsRef.current = availableTools;

  useEffect(() => {
    setAvailableTools(prev => {
      const builtinIds = new Set(BUILTIN_TOOLS.map(b => b.id));
      const nonBuiltin = prev.filter(t => !builtinIds.has(t.id));
      const nextCustom = (customTools || []).map((ct, i) => ({
        id: ct.id,
        name: ct.name,
        icon: ct.icon || '⚔️',
        slot: 6 + i,
        type: (ct.actionType as any) || 'custom',
        description: ct.toolTip || ct.name
      }));
      const merged = [...BUILTIN_TOOLS];
      const seen = new Set(merged.map(m => m.id));
      [...nextCustom, ...nonBuiltin].forEach(item => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      });
      return merged;
    });
  }, [customTools]);

  useEffect(() => {
    setScreenGuis(guis);
  }, [guis]);

  const usernameRef = useRef<string>(username);
  usernameRef.current = username;

  const scriptsRef = useRef<LuauScriptInstance[]>(scripts);
  scriptsRef.current = scripts;

  const runAllScriptsRef = useRef<(() => void) | null>(null);

  // Signature of all scripts and scripted parts to ensure scripts are always executing when changed
  const scriptsSignature = useMemo(() => {
    const sSig = (scripts || []).map(s => `${s.id}:${s.enabled !== false}:${s.source}`).join('|');
    const pSig = (parts || []).map(p => {
      const pL = (p.luauScripts || []).map(l => `${l.id}:${l.enabled !== false}:${l.source}`).join(';');
      const pS = p.script ? `${p.script.trigger}:${p.script.action}:${p.script.parameter}` : '';
      return `${p.id}:${pL}:${pS}`;
    }).join('|');
    return `${sSig}__${pSig}`;
  }, [scripts, parts]);

  useEffect(() => {
    if (runAllScriptsRef.current) {
      runAllScriptsRef.current();
    }
  }, [scriptsSignature]);

  const onUpdatePartRef = useRef(onUpdatePart);
  onUpdatePartRef.current = onUpdatePart;

  const characterControllerRef = useRef<CharacterMeshController | null>(null);
  const activeToolMeshRef = useRef<THREE.Group | null>(null);
  const flashlightLightRef = useRef<THREE.SpotLight | null>(null);
  const onSwordAttackRef = useRef<((damage: number) => void) | null>(null);
  const swordSwingTimerRef = useRef<number>(0);
  const lastSwordAttackTimeRef = useRef<number>(0);
  const updateNameTagRef = useRef<((hp: number, maxHp: number, scaleH?: number) => void) | null>(null);
  const updateCoPlayersAppearanceRef = useRef<((starterApp: AvatarAppearance | null) => void) | null>(null);

  const avatarRef = useRef<AvatarAppearance>(effectiveAvatar);
  avatarRef.current = effectiveAvatar;

  const gameIdRef = useRef<string>(gameId);
  gameIdRef.current = gameId;

  const onOtherChatMessageRef = useRef<((sender: string, text: string) => void) | null>(null);

  useEffect(() => {
    if (incomingChatMessage && incomingChatMessage.text) {
      if (onOtherChatMessageRef.current) {
        onOtherChatMessageRef.current(incomingChatMessage.sender, incomingChatMessage.text);
      }
    }
  }, [incomingChatMessage]);

  // Update maxHealth & reset health when StarterCharacter config changes or when entering test mode
  useEffect(() => {
    setMaxHealth(effectiveMaxHealth);
    maxHealthRef.current = effectiveMaxHealth;
    setHealth(effectiveMaxHealth);
    customWalkSpeedRef.current = null;
    customJumpPowerRef.current = null;
  }, [effectiveMaxHealth, starterRig?.id, isStudioTesting]);

  // Keep overhead nametag and parent HUD synced with health / maxHealth / scale
  useEffect(() => {
    if (updateNameTagRef.current) {
      updateNameTagRef.current(health, maxHealth, effectiveAvatar.scale?.height || 1);
    }
    if (onHealthChangeRef.current) {
      onHealthChangeRef.current(health);
    }
  }, [health, maxHealth, effectiveAvatar.scale?.height]);

  // Update avatar textures & clothing in-place without resetting camera or player
  useEffect(() => {
    if (characterControllerRef.current) {
      characterControllerRef.current.updateAppearance(effectiveAvatar);
    }
    if (updateCoPlayersAppearanceRef.current) {
      updateCoPlayersAppearanceRef.current(starterRig ? effectiveAvatar : null);
    }
  }, [effectiveAvatar, starterRig]);

  // References to keep inside render loop without re-triggering effects
  const clonePartsList = (list: BloxPart[]): BloxPart[] =>
    list.map(p => ({
      ...p,
      position: { ...p.position },
      rotation: { ...p.rotation },
      size: { ...p.size },
      attributes: p.attributes ? { ...p.attributes } : undefined
    }));

  const latestPropsPartsRef = useRef<BloxPart[]>(parts);
  latestPropsPartsRef.current = parts;

  const partsRef = useRef<BloxPart[]>(clonePartsList(parts));

  const selectedPartIdRef = useRef<string | null | undefined>(selectedPartId);
  selectedPartIdRef.current = selectedPartId;

  const onSelectPartRef = useRef(onSelectPart);
  onSelectPartRef.current = onSelectPart;

  const onTransformPartRef = useRef(onTransformPart);
  onTransformPartRef.current = onTransformPart;

  const isStudioModeRef = useRef(isStudioMode);
  isStudioModeRef.current = isStudioMode;

  const [selectedPartCoords, setSelectedPartCoords] = useState<{ id: string; name: string; x: number; y: number; z: number } | null>(null);

  useEffect(() => {
    if (selectedPartId) {
      const p = parts.find(pt => pt.id === selectedPartId);
      if (p) {
        setSelectedPartCoords({ id: p.id, name: p.name, x: p.position.x, y: p.position.y, z: p.position.z });
      } else {
        setSelectedPartCoords(null);
      }
    } else {
      setSelectedPartCoords(null);
    }
  }, [selectedPartId, parts]);

  const onCoinCollectedRef = useRef(onCoinCollected);
  onCoinCollectedRef.current = onCoinCollected;

  const onVictoryRef = useRef(onVictory);
  onVictoryRef.current = onVictory;

  const onHealthChangeRef = useRef(onHealthChange);
  onHealthChangeRef.current = onHealthChange;

  const spawnPointRef = useRef(spawnPoint);
  spawnPointRef.current = spawnPoint;

  const isStudioTestingRef = useRef(isStudioTesting);
  isStudioTestingRef.current = isStudioTesting;

  const chatBubbleTextRef = useRef(chatBubbleText);
  chatBubbleTextRef.current = chatBubbleText;

  const collectedCoinsRef = useRef<Set<string>>(collectedCoinIds);
  collectedCoinsRef.current = collectedCoinIds;

  const checkpointRef = useRef<BloxVector3>(currentCheckpoint);
  checkpointRef.current = currentCheckpoint;

  const activePassesRef = useRef<string[]>(activePasses);
  activePassesRef.current = activePasses;

  const resetTriggerRef = useRef<number | undefined>(resetTrigger);
  resetTriggerRef.current = resetTrigger;
  const lastResetRef = useRef<number | undefined>(resetTrigger);

  const isPhysicsRunningRef = useRef<boolean>(isPhysicsRunning);
  isPhysicsRunningRef.current = isPhysicsRunning;

  // Persistent camera and player state so camera & player NEVER reset on re-renders, chat, edits or resize
  const persistentCameraState = useRef<{
    yaw: number;
    pitch: number;
    distance: number;
    studioCamPos: THREE.Vector3;
    studioCamYaw: number;
    studioCamPitch: number;
    studioTarget: THREE.Vector3;
    playerPos: THREE.Vector3 | null;
    currentVelX: number;
    currentVelZ: number;
    hasSpawned: boolean;
  }>({
    yaw: 0,
    pitch: 0.35,
    distance: 14,
    studioCamPos: new THREE.Vector3(spawnPoint.x, spawnPoint.y + 12, spawnPoint.z + 24),
    studioCamYaw: 0,
    studioCamPitch: -0.28,
    studioTarget: new THREE.Vector3(0, 2, 0),
    playerPos: null,
    currentVelX: 0,
    currentVelZ: 0,
    hasSpawned: false
  });

  const syncPartsRef = useRef<(() => void) | null>(null);
  const partMeshesRef = useRef<Map<string, THREE.Mesh | THREE.Group> | null>(null);

  // Synchronize parts in the 3D scene without recreating scene or resetting camera
  useEffect(() => {
    if (!isStudioTestingRef.current) {
      partsRef.current = clonePartsList(parts);
      if (syncPartsRef.current) {
        syncPartsRef.current();
      }
    }
  }, [parts]);

  // Touch / Mobile Joystick state
  const touchControlState = useRef<MobileControlState>({
    forward: 0,
    turn: 0,
    jump: false,
    sprint: false
  });

  const cameraDeltaRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });

  const handleMobileControlChange = useCallback((controls: MobileControlState) => {
    touchControlState.current = controls;
  }, []);

  const handleMobileCameraRotate = useCallback((deltaYaw: number, deltaPitch: number) => {
    cameraDeltaRef.current.yaw += deltaYaw;
    cameraDeltaRef.current.pitch += deltaPitch;
  }, []);

  // Keyboard controls
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const focusRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    const isInputElement = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;

      // Modifier shortcuts (Ctrl+D, Ctrl+S, Alt+E, etc.) should not fly the camera or equip tools
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const lower = e.key.toLowerCase();
      keysPressed.current[lower] = true;

      if (e.key === ' ' && !isStudioMode) {
        e.preventDefault();
      }

      // Roblox Studio 'F' shortcut: focus camera on selected part
      if (lower === 'f' && isStudioMode && !isStudioTestingRef.current) {
        focusRequestedRef.current = true;
        return;
      }

      // Hotbar Number Keys 1-9 to equip/unequip tools during gameplay / playtesting
      if ((!isStudioMode || isStudioTestingRef.current) && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const slotNum = parseInt(e.key, 10);
        const targetTool = availableToolsRef.current.find(t => t.slot === slotNum);
        if (targetTool) {
          sounds.playClick();
          setEquippedTool(prev => (prev?.id === targetTool.id ? null : targetTool));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleBlur = () => {
      keysPressed.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isStudioMode]);

  // Tool activation action (sword swing, cola drink, coil boost, flashlight toggle)
  const triggerToolAction = useCallback(() => {
    const tool = equippedToolRef.current;
    if (!tool) return;

    if (tool.type === 'sword' || tool.type === 'custom') {
      const nowMs = performance.now();
      if (nowMs - lastSwordAttackTimeRef.current < 260) return;
      lastSwordAttackTimeRef.current = nowMs;

      swordSwingTimerRef.current = 0.28;
      sounds.playSwordSlash();
      if (onSwordAttackRef.current) {
        onSwordAttackRef.current(tool.type === 'sword' ? 25 : 20);
      }
    } else if (tool.type === 'cola') {
      sounds.playCoin();
      const cap = maxHealthRef.current;
      const next = Math.min(cap, healthRef.current + 25);
      healthRef.current = next;
      setHealth(next);
      if (onHealthChangeRef.current) onHealthChangeRef.current(next);
    } else if (tool.type === 'speed_coil') {
      sounds.playBoost();
    } else if (tool.type === 'gravity_coil') {
      sounds.playJump();
    } else if (tool.type === 'flashlight') {
      sounds.playClick();
      if (flashlightLightRef.current) {
        flashlightLightRef.current.visible = !flashlightLightRef.current.visible;
      }
    }

    luauEngine.triggerToolActivated(tool.name);
  }, []);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x70b5f9); // Sky blue
    scene.fog = new THREE.FogExp2(0x8bc7ff, 0.007);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.25);
    sunLight.position.set(40, 70, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    const d = 55;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Procedural Roblox Studs Canvas Texture
    const createStudsTexture = (repeatX: number, repeatZ: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 64, 64);

      const cx = 32, cy = 32, r = 16;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.beginPath();
      ctx.arc(cx + 1.5, cy + 2, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1.5, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1f4f8';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3.5, 0, Math.PI * 2);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(Math.max(1, Math.round(repeatX)), Math.max(1, Math.round(repeatZ)));
      return tex;
    };

    // Procedural Texture / Decal Creator
    const createProceduralTexture = (texType: string, repeatU = 2, repeatV = 2): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      if (texType === 'hazard') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#0f172a';
        for (let i = -128; i < 256; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 16, 0);
          ctx.lineTo(i + 16 + 128, 128);
          ctx.lineTo(i + 128, 128);
          ctx.fill();
        }
      } else if (texType === 'lava') {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, 20); ctx.lineTo(60, 50); ctx.lineTo(110, 30);
        ctx.moveTo(30, 80); ctx.lineTo(80, 70); ctx.lineTo(120, 110);
        ctx.stroke();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (texType === 'cyber') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, 112, 112);
        ctx.strokeRect(28, 28, 72, 72);
      } else if (texType === 'brick') {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        for (let y = 0; y < 128; y += 32) {
          ctx.strokeRect(0, y, 128, 32);
          for (let x = (y % 64 === 0 ? 0 : 32); x < 128; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x, y + 32);
            ctx.stroke();
          }
        }
      } else if (texType === 'metal') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 108, 108);
      } else if (texType === 'smile') {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, 128, 128);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(40, 45, 8, 0, Math.PI * 2);
        ctx.arc(88, 45, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(64, 75, 28, 0.2, Math.PI - 0.2);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
      } else if (texType === 'welds') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 124, 124);
      } else {
        return createStudsTexture(repeatU, repeatV);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatU, repeatV);
      return tex;
    };

    // Classic Roblox Grid Baseplate
    const createBaseplateTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#263428';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#324535';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(64, 64);
      return tex;
    };

    const baseplateGeo = new THREE.PlaneGeometry(500, 500);
    const baseplateMat = new THREE.MeshStandardMaterial({
      color: 0x334435,
      map: createBaseplateTexture(),
      roughness: 0.8,
      metalness: 0.05
    });
    const baseplate = new THREE.Mesh(baseplateGeo, baseplateMat);
    baseplate.rotation.x = -Math.PI / 2;
    baseplate.position.y = -0.05;
    baseplate.receiveShadow = true;
    scene.add(baseplate);

    const gridHelper = new THREE.GridHelper(300, 75, 0x475e4b, 0x2b3d2e);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Part Meshes map
    const partMeshes = new Map<string, THREE.Mesh | THREE.Group>();
    partMeshesRef.current = partMeshes;
    const partMeshesList: THREE.Object3D[] = [];
    const rigControllers: CharacterMeshController[] = [];
    const rigStates = new Map<string, {
      controller: CharacterMeshController;
      wrapper: THREE.Group;
      isMoving: boolean;
      attackTimer: number;
      moveTarget: THREE.Vector3 | null;
      moveSpeed: number;
      lastPos: THREE.Vector3;
      speedScale: number;
      damagedTimer: number;
      isDead?: boolean;
      hpSprite?: THREE.Sprite;
      hpCanvas?: HTMLCanvasElement;
      hpCtx?: CanvasRenderingContext2D;
      hpTex?: THREE.CanvasTexture;
      lastHpVal?: number;
      lastMaxHpVal?: number;
    }>();

    const damagePopups: {
      sprite: THREE.Sprite;
      tex: THREE.CanvasTexture;
      mat: THREE.SpriteMaterial;
      life: number;
      maxLife: number;
    }[] = [];

    const spawnDamagePopup = (worldPos: THREE.Vector3, amount: number) => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 192;
      pCanvas.height = 80;
      const pCtx = pCanvas.getContext('2d')!;
      pCtx.font = '900 44px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'middle';
      pCtx.lineWidth = 8;
      pCtx.strokeStyle = '#18181b';
      pCtx.strokeText(`-${amount}`, 96, 40);
      pCtx.fillStyle = '#fb7185';
      pCtx.fillText(`-${amount}`, 96, 40);

      const pTex = new THREE.CanvasTexture(pCanvas);
      const pMat = new THREE.SpriteMaterial({ map: pTex, transparent: true, depthTest: false });
      const pSprite = new THREE.Sprite(pMat);
      pSprite.scale.set(2.4, 1.0, 1);
      pSprite.position.copy(worldPos);
      pSprite.position.x += (Math.random() - 0.5) * 0.8;
      pSprite.renderOrder = 10050;
      pSprite.raycast = () => {};
      scene.add(pSprite);
      damagePopups.push({ sprite: pSprite, tex: pTex, mat: pMat, life: 0.7, maxLife: 0.7 });
    };

    const updateRigHealthBar = (rigId: string) => {
      const rs = rigStates.get(rigId);
      const rigPart = partsRef.current.find(p => p.id === rigId);
      if (!rs || !rigPart) return;
      const maxHp = Math.max(1, Number(rigPart.attributes?.MaxHealth ?? 100));
      const hp = Math.max(0, Number(rigPart.attributes?.Health ?? maxHp));
      const isStarterTemplate = rigPart.attributes?.StarterCharacter === true;
      const shouldShow = !rs.isDead && !isStarterTemplate && (!isStudioModeRef.current || isStudioTestingRef.current);

      if (!rs.hpSprite) {
        const hpCanvas = document.createElement('canvas');
        hpCanvas.width = 256;
        hpCanvas.height = 48;
        const hpCtx = hpCanvas.getContext('2d')!;
        const hpTex = new THREE.CanvasTexture(hpCanvas);
        const hpMat = new THREE.SpriteMaterial({ map: hpTex, transparent: true });
        const hpSprite = new THREE.Sprite(hpMat);
        hpSprite.scale.set(3.2, 0.56, 1);
        const yOffset = (rigPart.size?.y || 5.5) / 2 + (rigPart.label ? 1.55 : 0.85);
        hpSprite.position.set(0, yOffset, 0);
        hpSprite.raycast = () => {};
        rs.wrapper.add(hpSprite);
        rs.hpSprite = hpSprite;
        rs.hpCanvas = hpCanvas;
        rs.hpCtx = hpCtx;
        rs.hpTex = hpTex;
      }

      rs.hpSprite.visible = shouldShow;
      if (!shouldShow || !rs.hpCtx || !rs.hpTex) return;
      if (rs.lastHpVal === hp && rs.lastMaxHpVal === maxHp) return;
      rs.lastHpVal = hp;
      rs.lastMaxHpVal = maxHp;

      const ctx = rs.hpCtx;
      const ratio = Math.max(0, Math.min(1, hp / maxHp));
      ctx.clearRect(0, 0, 256, 48);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(6, 6, 244, 36, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();

      const barColor = ratio > 0.55 ? '#22c55e' : ratio > 0.25 ? '#eab308' : '#ef4444';
      const fillW = Math.round(232 * ratio);
      if (fillW > 0) {
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(12, 12, Math.max(8, fillW), 24, 6);
        ctx.fill();
      }

      ctx.font = '900 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      const hpText = `${Math.ceil(hp)} / ${Math.ceil(maxHp)}`;
      ctx.strokeText(hpText, 128, 25);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(hpText, 128, 25);
      rs.hpTex.needsUpdate = true;
    };

    // ==========================================
    // ROBLOX STUDIO 2022 AXIS TRANSFORM GIZMO
    // ==========================================
    const gizmoGroup = new THREE.Group();
    gizmoGroup.name = 'AxisGizmo';
    gizmoGroup.visible = false;
    gizmoGroup.renderOrder = 9999;
    scene.add(gizmoGroup);

    const gizmoHandlesList: THREE.Mesh[] = [];

    const shaftRad = 0.09;
    const shaftLen = 3.6;
    const coneRad = 0.32;
    const coneLen = 1.0;

    const matX = new THREE.MeshBasicMaterial({ color: 0xff2a4b, depthTest: false, transparent: true, opacity: 0.95 });
    const matY = new THREE.MeshBasicMaterial({ color: 0x00e676, depthTest: false, transparent: true, opacity: 0.95 });
    const matZ = new THREE.MeshBasicMaterial({ color: 0x00a2ff, depthTest: false, transparent: true, opacity: 0.95 });
    const matCenter = new THREE.MeshBasicMaterial({ color: 0xffea00, depthTest: false, transparent: true, opacity: 0.9 });
    const matXZ = new THREE.MeshBasicMaterial({ color: 0xffea00, depthTest: false, transparent: true, opacity: 0.4, side: THREE.DoubleSide });

    // X Axis (Red)
    const shaftXGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, shaftLen, 12);
    shaftXGeo.rotateZ(-Math.PI / 2);
    shaftXGeo.translate(shaftLen / 2, 0, 0);
    const shaftX = new THREE.Mesh(shaftXGeo, matX);
    shaftX.userData = { isGizmo: true, axis: 'X' };
    shaftX.renderOrder = 10000;
    gizmoGroup.add(shaftX);
    gizmoHandlesList.push(shaftX);

    const coneXGeo = new THREE.ConeGeometry(coneRad, coneLen, 16);
    coneXGeo.rotateZ(-Math.PI / 2);
    coneXGeo.translate(shaftLen + coneLen / 2, 0, 0);
    const coneX = new THREE.Mesh(coneXGeo, matX);
    coneX.userData = { isGizmo: true, axis: 'X' };
    coneX.renderOrder = 10000;
    gizmoGroup.add(coneX);
    gizmoHandlesList.push(coneX);

    // Y Axis (Green)
    const shaftYGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, shaftLen, 12);
    shaftYGeo.translate(0, shaftLen / 2, 0);
    const shaftY = new THREE.Mesh(shaftYGeo, matY);
    shaftY.userData = { isGizmo: true, axis: 'Y' };
    shaftY.renderOrder = 10000;
    gizmoGroup.add(shaftY);
    gizmoHandlesList.push(shaftY);

    const coneYGeo = new THREE.ConeGeometry(coneRad, coneLen, 16);
    coneYGeo.translate(0, shaftLen + coneLen / 2, 0);
    const coneY = new THREE.Mesh(coneYGeo, matY);
    coneY.userData = { isGizmo: true, axis: 'Y' };
    coneY.renderOrder = 10000;
    gizmoGroup.add(coneY);
    gizmoHandlesList.push(coneY);

    // Z Axis (Blue)
    const shaftZGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, shaftLen, 12);
    shaftZGeo.rotateX(Math.PI / 2);
    shaftZGeo.translate(0, 0, shaftLen / 2);
    const shaftZ = new THREE.Mesh(shaftZGeo, matZ);
    shaftZ.userData = { isGizmo: true, axis: 'Z' };
    shaftZ.renderOrder = 10000;
    gizmoGroup.add(shaftZ);
    gizmoHandlesList.push(shaftZ);

    const coneZGeo = new THREE.ConeGeometry(coneRad, coneLen, 16);
    coneZGeo.rotateX(Math.PI / 2);
    coneZGeo.translate(0, 0, shaftLen + coneLen / 2);
    const coneZ = new THREE.Mesh(coneZGeo, matZ);
    coneZ.userData = { isGizmo: true, axis: 'Z' };
    coneZ.renderOrder = 10000;
    gizmoGroup.add(coneZ);
    gizmoHandlesList.push(coneZ);

    // Center Sphere (XYZ / Free Drag)
    const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), matCenter);
    centerSphere.userData = { isGizmo: true, axis: 'XYZ' };
    centerSphere.renderOrder = 10000;
    gizmoGroup.add(centerSphere);
    gizmoHandlesList.push(centerSphere);

    // Ground Plane Quad (XZ Drag)
    const xzQuadGeo = new THREE.PlaneGeometry(1.2, 1.2);
    xzQuadGeo.rotateX(-Math.PI / 2);
    xzQuadGeo.translate(0.9, 0, 0.9);
    const xzQuad = new THREE.Mesh(xzQuadGeo, matXZ);
    xzQuad.userData = { isGizmo: true, axis: 'XZ' };
    xzQuad.renderOrder = 9999;
    gizmoGroup.add(xzQuad);
    gizmoHandlesList.push(xzQuad);

    // Selection Box Outline
    const dummyBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    const selectionBox = new THREE.BoxHelper(dummyBoxMesh, 0x00a2ff);
    selectionBox.visible = false;
    (selectionBox.material as THREE.LineBasicMaterial).depthTest = false;
    (selectionBox.material as THREE.LineBasicMaterial).transparent = true;
    (selectionBox.material as THREE.LineBasicMaterial).opacity = 0.9;
    selectionBox.renderOrder = 9998;
    scene.add(selectionBox);

    // Dynamic Physics simulation state for unanchored parts (Roblox PGS Physics Engine)
    interface PartPhysicsItem {
      id: string;
      shape: ColliderShapeType;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      rot: THREE.Vector3;
      quat: THREE.Quaternion;
      rotVel: THREE.Vector3; // 3D angular velocity (deg/s) for authentic Roblox tumbling
      size: THREE.Vector3;
      mass: number;          // Roblox Mass = Volume * Density
      restitution: number;   // Roblox Elasticity / Restitution
      friction: number;      // Surface friction
      material: string;
      originalPos: THREE.Vector3;
      originalRot: THREE.Vector3;
      isGrounded: boolean;
      anchored: boolean;
      canCollide: boolean;
      pushable: boolean;
    }
    const dynamicPartsPhysics = new Map<string, PartPhysicsItem>();

    // Helper: Material creator
    const getMaterial = (part: BloxPart) => {
      const color = new THREE.Color(part.color);
      const transparency = Math.max(0, Math.min(1, part.transparency ?? 0));
      const isTransparent = transparency > 0;
      const opacity = (isStudioMode && !isStudioTesting && transparency >= 1)
        ? 0.18
        : Math.max(0, 1 - transparency);

      switch (part.material) {
        case 'neon':
          return new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.75,
            roughness: 0.1,
            metalness: 0.1,
            transparent: isTransparent,
            opacity
          });
        case 'metal':
          return new THREE.MeshStandardMaterial({
            color,
            metalness: 0.85,
            roughness: 0.25,
            transparent: isTransparent,
            opacity
          });
        case 'glass':
          return new THREE.MeshPhysicalMaterial({
            color,
            transmission: 0.9,
            opacity: Math.min(0.4, opacity),
            transparent: true,
            roughness: 0.1
          });
        case 'forcefield':
          return new THREE.MeshStandardMaterial({
            color,
            wireframe: true,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: isTransparent,
            opacity
          });
        case 'brick':
        case 'plastic':
        default:
          return new THREE.MeshStandardMaterial({
            color,
            map: createStudsTexture(part.size.x / 2, part.size.z / 2),
            roughness: 0.35,
            metalness: 0.05,
            transparent: isTransparent,
            opacity
          });
      }
    };

    // Helper: Geometry creator
    const getGeometry = (part: BloxPart) => {
      const { size, type } = part;
      switch (type) {
        case 'sphere':
          return new THREE.SphereGeometry(size.x / 2, 24, 24);
        case 'cylinder':
          return new THREE.CylinderGeometry(size.x / 2, size.x / 2, size.y, 24);
        case 'coin':
          return new THREE.CylinderGeometry(size.x / 2, size.x / 2, size.z, 20);
        case 'wedge': {
          const wedgeGeo = new THREE.BufferGeometry();
          const sX = size.x / 2, sY = size.y / 2, sZ = size.z / 2;
          const vertices = new Float32Array([
            -sX, -sY, sZ,   sX, -sY, sZ,   sX, sY, sZ,
            -sX, -sY, -sZ,  sX, sY, -sZ,   sX, -sY, -sZ,
            -sX, -sY, sZ,   sX, sY, sZ,    sX, sY, -sZ,
            -sX, -sY, sZ,   sX, sY, -sZ,   -sX, -sY, -sZ,
            -sX, -sY, -sZ,  sX, -sY, -sZ,  sX, -sY, sZ,
            -sX, -sY, -sZ,  sX, -sY, sZ,   -sX, -sY, sZ,
            sX, -sY, -sZ,   sX, sY, -sZ,   sX, sY, sZ,
            sX, -sY, -sZ,   sX, sY, sZ,    sX, -sY, sZ
          ]);
          wedgeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          wedgeGeo.computeVertexNormals();
          return wedgeGeo;
        }
        default: {
          const minDim = Math.min(size.x, size.y, size.z);
          const radius = Math.min(0.08, minDim * 0.12);
          if (radius >= 0.02) {
            return new RoundedBoxGeometry(size.x, size.y, size.z, 2, radius);
          }
          return new THREE.BoxGeometry(size.x, size.y, size.z);
        }
      }
    };

    // Attach Texture or Decal planar mesh onto part face
    const attachFaceTexture = (parentMesh: THREE.Mesh, texObj: BloxTexture, partSize: BloxVector3) => {
      let geo: THREE.PlaneGeometry;
      let pos = new THREE.Vector3(0, 0, 0);
      let rot = new THREE.Euler(0, 0, 0);

      const offset = 0.005;
      const { face, texture: texType, studsPerTileU = 2, studsPerTileV = 2, transparency = 0 } = texObj;

      switch (face) {
        case 'Top':
          geo = new THREE.PlaneGeometry(partSize.x, partSize.z);
          pos.set(0, partSize.y / 2 + offset, 0);
          rot.set(-Math.PI / 2, 0, 0);
          break;
        case 'Bottom':
          geo = new THREE.PlaneGeometry(partSize.x, partSize.z);
          pos.set(0, -partSize.y / 2 - offset, 0);
          rot.set(Math.PI / 2, 0, 0);
          break;
        case 'Front':
          geo = new THREE.PlaneGeometry(partSize.x, partSize.y);
          pos.set(0, 0, partSize.z / 2 + offset);
          break;
        case 'Back':
          geo = new THREE.PlaneGeometry(partSize.x, partSize.y);
          pos.set(0, 0, -partSize.z / 2 - offset);
          rot.set(0, Math.PI, 0);
          break;
        case 'Left':
          geo = new THREE.PlaneGeometry(partSize.z, partSize.y);
          pos.set(-partSize.x / 2 - offset, 0, 0);
          rot.set(0, -Math.PI / 2, 0);
          break;
        case 'Right':
          geo = new THREE.PlaneGeometry(partSize.z, partSize.y);
          pos.set(partSize.x / 2 + offset, 0, 0);
          rot.set(0, Math.PI / 2, 0);
          break;
        default:
          geo = new THREE.PlaneGeometry(partSize.x, partSize.z);
          pos.set(0, partSize.y / 2 + offset, 0);
          rot.set(-Math.PI / 2, 0, 0);
          break;
      }

      const map = createProceduralTexture(texType, studsPerTileU, studsPerTileV);
      const mat = new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity: Math.max(0, 1 - transparency),
        side: THREE.DoubleSide
      });

      const plane = new THREE.Mesh(geo, mat);
      plane.position.copy(pos);
      plane.rotation.copy(rot);
      parentMesh.add(plane);
    };

    // Attach BillboardGui above part
    const attachBillboardGui = (parentMesh: THREE.Mesh, gui: BloxGuiElement, partSize: BloxVector3) => {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 256;
      bCanvas.height = 64;
      const bCtx = bCanvas.getContext('2d')!;
      bCtx.fillStyle = gui.backgroundColor || 'rgba(15, 23, 42, 0.85)';
      bCtx.roundRect(8, 8, 240, 48, 12);
      bCtx.fill();
      bCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      bCtx.lineWidth = 2;
      bCtx.stroke();

      bCtx.fillStyle = gui.textColor || '#38bdf8';
      bCtx.font = 'bold 20px system-ui, sans-serif';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(gui.text || gui.name || 'GUI', 128, 32);

      const bTex = new THREE.CanvasTexture(bCanvas);
      const bMat = new THREE.SpriteMaterial({ map: bTex, transparent: true });
      const sprite = new THREE.Sprite(bMat);
      sprite.scale.set(3, 0.75, 1);
      const offY = gui.studsOffset?.y ?? (partSize.y / 2 + 1.2);
      sprite.position.set(gui.studsOffset?.x ?? 0, offY, gui.studsOffset?.z ?? 0);
      sprite.raycast = () => {};
      parentMesh.add(sprite);
    };

    // Helper: Build AvatarAppearance from a Rig/NPC BloxPart
    const buildPartRigAppearance = (part: BloxPart): AvatarAppearance => {
      const attrs = part.attributes || {};
      return {
        bodyColors: {
          head: String(attrs.RigHeadColor || '#facc15'),
          torso: String(attrs.RigTorsoColor || part.color || '#0284c7'),
          leftArm: String(attrs.RigArmColor || attrs.RigHeadColor || '#facc15'),
          rightArm: String(attrs.RigArmColor || attrs.RigHeadColor || '#facc15'),
          leftLeg: String(attrs.RigLegColor || '#1e293b'),
          rightLeg: String(attrs.RigLegColor || '#1e293b')
        },
        equippedFace: String(attrs.RigFace || 'face-smile'),
        equippedShirt: 'rig-plain',
        equippedPants: 'rig-plain',
        scale: {
          width: Math.max(0.25, (part.size?.x || 4) / 4),
          height: Math.max(0.25, (part.size?.y || 5.5) / 5.5),
          head: 1
        },
        animation: 'idle'
      };
    };

    const unmountPartMesh = (partId: string) => {
      const existing = partMeshes.get(partId);
      if (existing) {
        scene.remove(existing);
        partMeshes.delete(partId);
        const idx = partMeshesList.indexOf(existing);
        if (idx !== -1) partMeshesList.splice(idx, 1);
      }
      dynamicPartsPhysics.delete(partId);
    };

    const mountSingleNonRigPart = (part: BloxPart) => {
      unmountPartMesh(part.id);
      if (part.type === 'coin' && collectedCoinsRef.current.has(part.id)) {
        return;
      }
      const geo = getGeometry(part);
      const mat = getMaterial(part);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(part.position.x, part.position.y, part.position.z);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(part.rotation.x),
        THREE.MathUtils.degToRad(part.rotation.y),
        THREE.MathUtils.degToRad(part.rotation.z)
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { partId: part.id, partData: part };

      if (part.type === 'coin') {
        mesh.rotation.x = Math.PI / 2;
      }

      if (part.textures && part.textures.length > 0) {
        part.textures.forEach(tex => {
          attachFaceTexture(mesh, tex, part.size);
        });
      }

      if (part.guis && part.guis.length > 0) {
        part.guis.forEach(g => {
          if (g.className === 'BillboardGui') {
            attachBillboardGui(mesh, g, part.size);
          }
        });
      }

      if (part.label) {
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256;
        signCanvas.height = 64;
        const sCtx = signCanvas.getContext('2d')!;
        sCtx.fillStyle = '#0f172a';
        sCtx.fillRect(0, 0, 256, 64);
        sCtx.lineWidth = 4;
        sCtx.strokeStyle = '#38bdf8';
        sCtx.strokeRect(2, 2, 252, 60);
        sCtx.fillStyle = '#ffffff';
        sCtx.font = 'bold 24px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText(part.label, 128, 32);

        const signTex = new THREE.CanvasTexture(signCanvas);
        const signPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(part.size.x * 0.9, 0.8),
          new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
        );
        signPlane.position.set(0, part.size.y / 2 + 0.5, 0);
        mesh.add(signPlane);
      }

      scene.add(mesh);
      partMeshes.set(part.id, mesh);
      partMeshesList.push(mesh);
    };

    // Build parts in scene
    const syncParts = () => {
      partMeshes.forEach(mesh => scene.remove(mesh));
      partMeshes.clear();
      partMeshesList.length = 0;
      rigControllers.length = 0;
      rigStates.clear();

      partsRef.current.forEach(part => {
        if (part.type === 'coin' && collectedCoinsRef.current.has(part.id)) {
          return;
        }

        if (part.type === 'rig' || part.type === 'npc') {
          const rigWrapper = new THREE.Group();
          const rigApp = buildPartRigAppearance(part);
          const rigCtrl = createBlockyCharacter(rigApp);
          rigCtrl.root.position.y = -(part.size.y / 2);

          const transparency = Math.max(0, Math.min(1, part.transparency ?? 0));
          if (transparency > 0) {
            const opacity = (isStudioMode && !isStudioTesting && transparency >= 1)
              ? 0.18
              : Math.max(0, 1 - transparency);
            rigCtrl.root.traverse(child => {
              if ((child as THREE.Mesh).isMesh) {
                const m = (child as THREE.Mesh).material;
                if (m && !Array.isArray(m)) {
                  m.transparent = true;
                  m.opacity = opacity;
                }
              }
            });
          }

          rigWrapper.add(rigCtrl.root);
          rigWrapper.position.set(part.position.x, part.position.y, part.position.z);
          rigWrapper.rotation.set(
            THREE.MathUtils.degToRad(part.rotation.x),
            THREE.MathUtils.degToRad(part.rotation.y),
            THREE.MathUtils.degToRad(part.rotation.z)
          );
          rigWrapper.userData = { partId: part.id, partData: part };

          // Show label or StarterCharacter badge above Rig
          const rigTagText = part.label || (isStudioMode && !isStudioTesting && part.attributes?.StarterCharacter ? '⭐ SPAWN RIG' : '');
          if (rigTagText) {
            const signCanvas = document.createElement('canvas');
            signCanvas.width = 280;
            signCanvas.height = 64;
            const sCtx = signCanvas.getContext('2d')!;
            sCtx.fillStyle = part.attributes?.StarterCharacter ? '#064e3b' : '#0f172a';
            sCtx.fillRect(0, 0, 280, 64);
            sCtx.lineWidth = 4;
            sCtx.strokeStyle = part.attributes?.StarterCharacter ? '#10b981' : '#38bdf8';
            sCtx.strokeRect(2, 2, 276, 60);
            sCtx.fillStyle = '#ffffff';
            sCtx.font = 'bold 22px sans-serif';
            sCtx.textAlign = 'center';
            sCtx.textBaseline = 'middle';
            sCtx.fillText(rigTagText, 140, 32);

            const signTex = new THREE.CanvasTexture(signCanvas);
            const signMat = new THREE.SpriteMaterial({ map: signTex, transparent: true });
            const signSprite = new THREE.Sprite(signMat);
            signSprite.scale.set(3.2, 0.75, 1);
            signSprite.position.set(0, part.size.y / 2 + 0.9, 0);
            signSprite.raycast = () => {};
            rigWrapper.add(signSprite);
          }

          scene.add(rigWrapper);
          partMeshes.set(part.id, rigWrapper);
          partMeshesList.push(rigWrapper);
          rigControllers.push(rigCtrl);
          rigStates.set(part.id, {
            controller: rigCtrl,
            wrapper: rigWrapper,
            isMoving: false,
            attackTimer: 0,
            moveTarget: null,
            moveSpeed: Number(part.attributes?.WalkSpeed ?? 12),
            lastPos: new THREE.Vector3(part.position.x, part.position.y, part.position.z),
            speedScale: 1.0,
            damagedTimer: 0,
            isDead: false
          });
          return;
        }

        mountSingleNonRigPart(part);
      });

      // Initialize dynamic physics state for unanchored parts (Roblox PGS properties)
      dynamicPartsPhysics.clear();
      partsRef.current.forEach(part => {
        const isAnchored = (part.anchored ?? part.isAnchored) ?? true;
        if (!isAnchored) {
          const matName = part.material || 'plastic';
          let density = 0.7; // Standard Roblox plastic density
          let restitution = 0.25;
          let friction = 0.45; // Standard Roblox surface friction

          if (matName === 'metal') {
            density = 2.4;
            restitution = 0.12;
            friction = 0.45;
          } else if (matName === 'glass') {
            density = 1.2;
            restitution = 0.18;
            friction = 0.18;
          } else if (matName === 'brick') {
            density = 1.8;
            restitution = 0.15;
            friction = 0.72;
          } else if (matName === 'wood') {
            density = 0.55;
            restitution = 0.2;
            friction = 0.58;
          } else if (matName === 'neon') {
            density = 0.5;
            restitution = 0.4;
            friction = 0.35;
          }
          if (part.script?.action === 'bounce' || part.name?.toLowerCase().includes('trampoline') || part.name?.toLowerCase().includes('bounce')) {
            restitution = 0.85;
          }

          const shape = getPartColliderShape(part.type);
          let vol = part.size.x * part.size.y * part.size.z;
          if (shape === 'sphere') {
            vol = (4 / 3) * Math.PI * Math.pow(Math.max(0.1, part.size.x * 0.5), 3);
          } else if (shape === 'cylinder') {
            vol = Math.PI * Math.pow(Math.max(0.1, part.size.x * 0.5), 2) * part.size.y;
          } else if (shape === 'wedge') {
            vol = 0.5 * part.size.x * part.size.y * part.size.z;
          }
          vol = Math.max(0.2, vol);

          const attrMass = Number(part.attributes?.Mass);
          const explicitMass = (typeof part.mass === 'number' && part.mass > 0)
            ? part.mass
            : (Number.isFinite(attrMass) && attrMass > 0 ? attrMass : null);
          const mass = explicitMass !== null ? explicitMass : Math.max(0.5, vol * density);
          const pushable = part.attributes?.Pushable !== false;

          dynamicPartsPhysics.set(part.id, {
            id: part.id,
            shape,
            pos: new THREE.Vector3(part.position.x, part.position.y, part.position.z),
            vel: new THREE.Vector3(0, 0, 0),
            rot: new THREE.Vector3(part.rotation.x, part.rotation.y, part.rotation.z),
            quat: eulerDegToQuaternion(part.rotation || { x: 0, y: 0, z: 0 }),
            rotVel: new THREE.Vector3(0, 0, 0),
            size: new THREE.Vector3(part.size.x, part.size.y, part.size.z),
            mass,
            restitution,
            friction,
            material: matName,
            originalPos: new THREE.Vector3(part.position.x, part.position.y, part.position.z),
            originalRot: new THREE.Vector3(part.rotation.x, part.rotation.y, part.rotation.z),
            isGrounded: false,
            anchored: false,
            canCollide: part.canCollide ?? true,
            pushable
          });
        }
      });
    };

    syncParts();
    syncPartsRef.current = syncParts;

    // Player Avatar Character (uses active StarterCharacter Rig if enabled, else user avatar)
    const characterController: CharacterMeshController = createBlockyCharacter(avatarRef.current);
    scene.add(characterController.root);
    characterControllerRef.current = characterController;

    // Authentic Floating Roblox Name Billboard & Mini Health Bar above Player Head
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 300;
    nameCanvas.height = 80;
    const nCtx = nameCanvas.getContext('2d')!;
    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSpriteMat = new THREE.SpriteMaterial({ map: nameTex, transparent: true });
    const nameSprite = new THREE.Sprite(nameSpriteMat);
    nameSprite.scale.set(3.4, 0.9, 1);
    nameSprite.position.set(0, 6.2, 0);
    nameSprite.raycast = () => {};
    characterController.root.add(nameSprite);

    const renderNameTag = (currentHp: number = 100, currentMaxHp: number = 100, scaleH: number = 1) => {
      nCtx.clearRect(0, 0, 300, 80);
      nCtx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      nCtx.beginPath();
      nCtx.roundRect(10, 8, 280, 64, 16);
      nCtx.fill();
      nCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      nCtx.lineWidth = 2;
      nCtx.stroke();

      nCtx.fillStyle = '#ffffff';
      nCtx.font = '900 20px system-ui, -apple-system, sans-serif';
      nCtx.textAlign = 'center';
      nCtx.textBaseline = 'top';
      const displayName = usernameRef.current || 'BloxMaster';
      nCtx.fillText(displayName, 150, 16);

      const barX = 35;
      const barY = 46;
      const barW = 230;
      const barH = 10;
      nCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      nCtx.beginPath();
      nCtx.roundRect(barX, barY, barW, barH, 5);
      nCtx.fill();

      const denom = currentMaxHp > 0 ? currentMaxHp : 100;
      const hpRatio = Math.max(0, Math.min(1, currentHp / denom));
      nCtx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
      nCtx.beginPath();
      nCtx.roundRect(barX + 1, barY + 1, Math.max(4, (barW - 2) * hpRatio), barH - 2, 4);
      nCtx.fill();
      nameTex.needsUpdate = true;

      const invScale = scaleH > 0 ? 1 / scaleH : 1;
      nameSprite.scale.set(3.4 * invScale, 0.9 * invScale, 1);
      nameSprite.position.set(0, 6.2, 0);
    };

    renderNameTag(healthRef.current, maxHealthRef.current, avatarRef.current.scale?.height || 1);
    updateNameTagRef.current = renderNameTag;

    // Speech bubble sprite if chatBubbleText exists
    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 512;
    bubbleCanvas.height = 128;
    const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    const bubbleMat = new THREE.SpriteMaterial({ map: bubbleTex, transparent: true });
    const bubbleSprite = new THREE.Sprite(bubbleMat);
    bubbleSprite.scale.set(5.5, 1.4, 1);
    bubbleSprite.position.set(0, 7.5, 0);
    bubbleSprite.visible = false;
    bubbleSprite.raycast = () => {};
    characterController.root.add(bubbleSprite);

    // Dynamic Tool Hand Attachment
    let lastHandToolKey = '';
    const updateHandToolMesh = (tool: RuntimeTool | null) => {
      const nextKey = tool ? `${tool.id}:${tool.type}` : '';
      if (nextKey === lastHandToolKey) return;
      lastHandToolKey = nextKey;

      if (activeToolMeshRef.current) {
        characterController.rightArm.remove(activeToolMeshRef.current);
        activeToolMeshRef.current = null;
        flashlightLightRef.current = null;
      }

      if (!tool) return;

      const toolGroup = new THREE.Group();
      const isSwordLikeCustom =
        tool.type === 'custom' &&
        (tool.icon === '⚔️' || tool.icon === '🗡️' || /espada|sword|blade|katana/i.test(tool.name));

      if (tool.type === 'sword' || isSwordLikeCustom) {
        const bladeGeo = new THREE.BoxGeometry(0.3, 2.4, 0.1);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 1.2;

        const hiltGeo = new THREE.BoxGeometry(0.8, 0.2, 0.3);
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
        const hilt = new THREE.Mesh(hiltGeo, hiltMat);

        const handleGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.y = -0.3;

        toolGroup.add(blade);
        toolGroup.add(hilt);
        toolGroup.add(handle);
        toolGroup.position.set(0, -1.0, 0.5);
        toolGroup.rotation.x = Math.PI / 4;
      } else if (tool.type === 'cola') {
        const canGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 16);
        const canMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.3 });
        const can = new THREE.Mesh(canGeo, canMat);
        toolGroup.add(can);
        toolGroup.position.set(0, -0.9, 0.3);
      } else if (tool.type === 'speed_coil') {
        const coilGeo = new THREE.TorusGeometry(0.35, 0.1, 16, 32);
        const coilMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.8 });
        const coil = new THREE.Mesh(coilGeo, coilMat);
        toolGroup.add(coil);
        toolGroup.position.set(0, -0.9, 0.3);
      } else if (tool.type === 'gravity_coil') {
        const coilGeo = new THREE.TorusGeometry(0.35, 0.1, 16, 32);
        const coilMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.8 });
        const coil = new THREE.Mesh(coilGeo, coilMat);
        toolGroup.add(coil);
        toolGroup.position.set(0, -0.9, 0.3);
      } else if (tool.type === 'flashlight') {
        const flGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 16);
        const flMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
        const fl = new THREE.Mesh(flGeo, flMat);
        fl.rotation.x = Math.PI / 2;
        toolGroup.add(fl);

        // Real 3D SpotLight
        const spot = new THREE.SpotLight(0xfffbeb, 4, 35, Math.PI / 5, 0.3);
        spot.position.set(0, 0, 0.6);
        spot.target.position.set(0, 0, 5);
        toolGroup.add(spot);
        toolGroup.add(spot.target);
        flashlightLightRef.current = spot;

        toolGroup.position.set(0, -0.9, 0.4);
      } else if (tool.type === 'custom') {
        const handleGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.2, 12);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.3 });
        const wand = new THREE.Mesh(handleGeo, handleMat);
        const tipGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.y = 0.65;
        toolGroup.add(wand);
        toolGroup.add(tip);
        toolGroup.position.set(0, -0.9, 0.4);
        toolGroup.rotation.x = Math.PI / 4;
      }

      characterController.rightArm.add(toolGroup);
      activeToolMeshRef.current = toolGroup;
    };

    // ==========================================
    // MULTIPLAYER: Other Players in Experience
    // ==========================================
    interface OtherPlayerMesh {
      id: string;
      username: string;
      originalAvatar: AvatarAppearance;
      controller: CharacterMeshController;
      nameSprite: THREE.Sprite;
      nameCanvas: HTMLCanvasElement;
      nameCtx: CanvasRenderingContext2D;
      nameTex: THREE.CanvasTexture;
      bubbleSprite: THREE.Sprite;
      bubbleCanvas: HTMLCanvasElement;
      bubbleCtx: CanvasRenderingContext2D;
      bubbleTex: THREE.CanvasTexture;
      bubbleTimeout?: any;
      targetPos: THREE.Vector3;
      targetRotY: number;
      isMoving: boolean;
      isGrounded: boolean;
      velocityY: number;
      speedMultiplier: number;
      lastSeen: number;
      isSimulated?: boolean;
      simTimer?: number;
      simTarget?: THREE.Vector3;
    }

    const otherPlayers = new Map<string, OtherPlayerMesh>();

    const updateOtherPlayerNameTag = (player: OtherPlayerMesh, currentHp: number = 100) => {
      const { nameCtx, nameCanvas, nameTex } = player;
      nameCtx.clearRect(0, 0, 300, 80);
      nameCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      nameCtx.beginPath();
      nameCtx.roundRect(10, 8, 280, 64, 16);
      nameCtx.fill();
      nameCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      nameCtx.lineWidth = 2;
      nameCtx.stroke();

      nameCtx.fillStyle = '#ffffff';
      nameCtx.font = '900 20px system-ui, -apple-system, sans-serif';
      nameCtx.textAlign = 'center';
      nameCtx.textBaseline = 'top';
      nameCtx.fillText(player.username, 150, 16);

      const barX = 35;
      const barY = 46;
      const barW = 230;
      const barH = 10;
      nameCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      nameCtx.beginPath();
      nameCtx.roundRect(barX, barY, barW, barH, 5);
      nameCtx.fill();

      const denom = maxHealthRef.current > 0 ? maxHealthRef.current : 100;
      const hpRatio = Math.max(0, Math.min(1, currentHp / denom));
      nameCtx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
      nameCtx.beginPath();
      nameCtx.roundRect(barX + 1, barY + 1, Math.max(4, (barW - 2) * hpRatio), barH - 2, 4);
      nameCtx.fill();
      nameTex.needsUpdate = true;
    };

    const showOtherPlayerBubble = (player: OtherPlayerMesh, text: string) => {
      if (!text) return;
      player.bubbleSprite.visible = true;
      const ctx = player.bubbleCtx;
      ctx.clearRect(0, 0, 512, 128);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 90, 20);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.slice(0, 34), 256, 55);
      player.bubbleTex.needsUpdate = true;

      if (player.bubbleTimeout) clearTimeout(player.bubbleTimeout);
      player.bubbleTimeout = setTimeout(() => {
        player.bubbleSprite.visible = false;
      }, 5000);
    };

    const createOtherPlayer = (id: string, name: string, app: AvatarAppearance, initPos: THREE.Vector3, isSim = false): OtherPlayerMesh => {
      const effectiveOtherApp = starterRigRef.current ? buildPartRigAppearance(starterRigRef.current) : app;
      const controller = createBlockyCharacter(effectiveOtherApp);
      scene.add(controller.root);
      controller.root.position.copy(initPos);

      const nameCanvas = document.createElement('canvas');
      nameCanvas.width = 300;
      nameCanvas.height = 80;
      const nameCtx = nameCanvas.getContext('2d')!;
      const nameTex = new THREE.CanvasTexture(nameCanvas);
      const nameMat = new THREE.SpriteMaterial({ map: nameTex, transparent: true });
      const nameSprite = new THREE.Sprite(nameMat);
      nameSprite.scale.set(3.4, 0.9, 1);
      nameSprite.position.set(0, 6.2, 0);
      nameSprite.raycast = () => {};
      controller.root.add(nameSprite);

      const bubbleCanvas = document.createElement('canvas');
      bubbleCanvas.width = 512;
      bubbleCanvas.height = 128;
      const bubbleCtx = bubbleCanvas.getContext('2d')!;
      const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
      const bubbleMat = new THREE.SpriteMaterial({ map: bubbleTex, transparent: true });
      const bubbleSprite = new THREE.Sprite(bubbleMat);
      bubbleSprite.scale.set(5.5, 1.4, 1);
      bubbleSprite.position.set(0, 7.5, 0);
      bubbleSprite.visible = false;
      bubbleSprite.raycast = () => {};
      controller.root.add(bubbleSprite);

      const entity: OtherPlayerMesh = {
        id,
        username: name,
        originalAvatar: app,
        controller,
        nameSprite,
        nameCanvas,
        nameCtx,
        nameTex,
        bubbleSprite,
        bubbleCanvas,
        bubbleCtx,
        bubbleTex,
        targetPos: initPos.clone(),
        targetRotY: 0,
        isMoving: false,
        isGrounded: true,
        velocityY: 0,
        speedMultiplier: 1,
        lastSeen: Date.now(),
        isSimulated: isSim,
        simTimer: Math.random() * 4,
        simTarget: initPos.clone()
      };

      updateOtherPlayerNameTag(entity, maxHealthRef.current);
      return entity;
    };

    updateCoPlayersAppearanceRef.current = (starterApp: AvatarAppearance | null) => {
      otherPlayers.forEach(p => {
        p.controller.updateAppearance(starterApp || p.originalAvatar);
        updateOtherPlayerNameTag(p, maxHealthRef.current);
      });
    };

    // Co-players in experience for alive multiplayer world
    if (!isStudioMode || isStudioTestingRef.current) {
      const gabrielAvatar: AvatarAppearance = {
        bodyColors: { head: '#ffd1a4', torso: '#1e3a8a', leftArm: '#1e3a8a', rightArm: '#1e3a8a', leftLeg: '#0f172a', rightLeg: '#0f172a' },
        equippedHat: 'hat-cap',
        equippedFace: 'face-smile',
        equippedShirt: 'shirt-hoodie',
        equippedPants: 'pants-jeans',
        scale: { height: 1, width: 1, head: 1 },
        animation: 'idle'
      };
      otherPlayers.set('sim_gabriel2025', createOtherPlayer('sim_gabriel2025', 'gabriel2025', gabrielAvatar, new THREE.Vector3(spawnPointRef.current.x + 3.5, spawnPointRef.current.y, spawnPointRef.current.z - 2), true));

      const larryAvatar: AvatarAppearance = {
        bodyColors: { head: '#ffd700', torso: '#0284c7', leftArm: '#ffd700', rightArm: '#ffd700', leftLeg: '#22c55e', rightLeg: '#22c55e' },
        equippedHat: 'hat-noob',
        equippedFace: 'face-smile',
        equippedShirt: 'none',
        equippedPants: 'none',
        scale: { height: 1, width: 1, head: 1 },
        animation: 'idle'
      };
      otherPlayers.set('sim_larry', createOtherPlayer('sim_larry', 'larry', larryAvatar, new THREE.Vector3(spawnPointRef.current.x - 3.5, spawnPointRef.current.y, spawnPointRef.current.z - 3), true));

      const weyAvatar: AvatarAppearance = {
        bodyColors: { head: '#ffdab9', torso: '#18181b', leftArm: '#18181b', rightArm: '#18181b', leftLeg: '#27272a', rightLeg: '#27272a' },
        equippedHat: 'hat-ninja',
        equippedFace: 'face-epic',
        equippedShirt: 'shirt-ninja',
        equippedPants: 'pants-camo',
        scale: { height: 1, width: 1, head: 1 },
        animation: 'idle'
      };
      otherPlayers.set('sim_WEY', createOtherPlayer('sim_WEY', 'WEY', weyAvatar, new THREE.Vector3(spawnPointRef.current.x, spawnPointRef.current.y, spawnPointRef.current.z - 5), true));
    }

    // Real cross-window synchronization via BroadcastChannel
    const localPlayerId = 'usr_' + Math.random().toString(36).substring(2, 9);
    let broadcastChannel: BroadcastChannel | null = null;
    let lastBroadcastTime = 0;
    try {
      const channelName = `blox_multiplayer_${gameIdRef.current || 'default'}`;
      broadcastChannel = new BroadcastChannel(channelName);
      broadcastChannel.onmessage = (ev) => {
        const data = ev.data;
        if (!data || data.senderId === localPlayerId) return;
        if (data.type === 'sync') {
          let other = otherPlayers.get(data.senderId);
          if (!other) {
            const startPos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
            other = createOtherPlayer(data.senderId, data.username || 'BloxPlayer', data.avatar || avatarRef.current, startPos, false);
            otherPlayers.set(data.senderId, other);
          }
          other.targetPos.set(data.pos.x, data.pos.y, data.pos.z);
          other.targetRotY = data.rotY;
          other.isMoving = data.isMoving;
          other.isGrounded = data.isGrounded;
          other.velocityY = data.velocityY;
          other.speedMultiplier = data.speedMultiplier || 1;
          other.lastSeen = Date.now();
          if (data.chatBubble) {
            showOtherPlayerBubble(other, data.chatBubble);
          }
        } else if (data.type === 'leave') {
          const other = otherPlayers.get(data.senderId);
          if (other) {
            scene.remove(other.controller.root);
            otherPlayers.delete(data.senderId);
          }
        }
      };
    } catch (_) {}

    onOtherChatMessageRef.current = (sender: string, text: string) => {
      otherPlayers.forEach((player) => {
        if (player.username.toLowerCase() === sender.toLowerCase() || player.id.includes(sender)) {
          showOtherPlayerBubble(player, text);
        }
      });
    };

    let scriptWatchdogCounter = 0;

    // Physics & Player State
    const savedPlayerPos = persistentCameraState.current.playerPos;
    const playerPos = (persistentCameraState.current.hasSpawned && savedPlayerPos)
      ? savedPlayerPos.clone()
      : new THREE.Vector3(spawnPointRef.current.x, spawnPointRef.current.y, spawnPointRef.current.z);
    persistentCameraState.current.hasSpawned = true;
    characterController.root.position.copy(playerPos);

    let velocityX = persistentCameraState.current.currentVelX || 0;
    let velocityZ = persistentCameraState.current.currentVelZ || 0;
    let velocityY = 0;
    let isGrounded = true;
    let isClimbing = false;
    let canDoubleJump = false;
    let hasDoubleJumped = false;
    let speedBoostTimer = 0;
    let invulnerabilityTimer = 0;
    let lastGroundPartId: string | null = null;
    const lastGroundPartPos = new THREE.Vector3();
    const lastGroundPartQuat = new THREE.Quaternion();

    let cameraYaw = persistentCameraState.current.yaw;
    let cameraPitch = persistentCameraState.current.pitch;
    let cameraDistance = persistentCameraState.current.distance;
    const studioCamPos = persistentCameraState.current.studioCamPos.clone();
    let studioCamYaw = persistentCameraState.current.studioCamYaw;
    let studioCamPitch = persistentCameraState.current.studioCamPitch;

    let isRightDragging = false;
    let isDragging = false;
    let isDraggingGizmo = false;
    let activeGizmoAxis: 'X' | 'Y' | 'Z' | 'XZ' | 'XYZ' | null = null;
    const dragStartPartPos = new THREE.Vector3();
    const dragStartIntersect = new THREE.Vector3();
    const dragPlane = new THREE.Plane();
    const dragPlaneIntersect = new THREE.Vector3();
    const activeDragPos = new THREE.Vector3();
    let prevMouseX = 0;
    let prevMouseY = 0;
    let wasTesting = isStudioTestingRef.current;

    // Mouse Controls
    const onMouseDown = (e: MouseEvent) => {
      // In Studio Mode (non-testing)
      if (isStudioMode && !isStudioTestingRef.current) {
        // Right or Middle Click: Camera Look Around
        if (e.button === 2 || e.button === 1) {
          isRightDragging = true;
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
          return;
        }

        // Left Click: Check Axis Gizmo first, then Part selection
        if (e.button === 0) {
          const rect = renderer.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );
          const raycaster = new THREE.Raycaster();
          raycaster.camera = camera;
          raycaster.setFromCamera(mouse, camera);

          // 1. Raycast against Gizmo handles if active and a part is selected
          if (selectedPartIdRef.current && gizmoGroup.visible) {
            const gizmoHits = raycaster.intersectObjects(gizmoHandlesList, true);
            if (gizmoHits.length > 0) {
              const hitObj = gizmoHits[0].object;
              const axis = hitObj.userData.axis as 'X' | 'Y' | 'Z' | 'XZ' | 'XYZ';
              if (axis) {
                isDraggingGizmo = true;
                activeGizmoAxis = axis;

                const curMesh = partMeshes.get(selectedPartIdRef.current);
                const currentP = curMesh ? curMesh.position : new THREE.Vector3();
                dragStartPartPos.copy(currentP);
                activeDragPos.copy(currentP);

                // Configure drag plane passing through current part position
                if (axis === 'Y') {
                  const camHorizDir = new THREE.Vector3(camera.position.x - currentP.x, 0, camera.position.z - currentP.z).normalize();
                  dragPlane.setFromNormalAndCoplanarPoint(camHorizDir.lengthSq() > 0.01 ? camHorizDir : new THREE.Vector3(0, 0, 1), currentP);
                } else if (axis === 'X') {
                  const camDir = new THREE.Vector3();
                  camera.getWorldDirection(camDir);
                  const norm = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), camDir).cross(new THREE.Vector3(1, 0, 0)).normalize();
                  dragPlane.setFromNormalAndCoplanarPoint(norm.lengthSq() > 0.01 ? norm : new THREE.Vector3(0, 0, 1), currentP);
                } else if (axis === 'Z') {
                  const camDir = new THREE.Vector3();
                  camera.getWorldDirection(camDir);
                  const norm = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, 1), camDir).cross(new THREE.Vector3(0, 0, 1)).normalize();
                  dragPlane.setFromNormalAndCoplanarPoint(norm.lengthSq() > 0.01 ? norm : new THREE.Vector3(1, 0, 0), currentP);
                } else {
                  // XZ or Center Sphere (XYZ): Ground plane
                  dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), currentP);
                }

                raycaster.ray.intersectPlane(dragPlane, dragStartIntersect);
                sounds.playClick();
                return;
              }
            }
          }

          // 2. Raycast against part meshes to select
          const partHits = raycaster.intersectObjects(partMeshesList, true);
          if (partHits.length > 0) {
            let obj: THREE.Object3D | null = partHits[0].object;
            while (obj && !obj.userData?.partId && obj.parent) {
              obj = obj.parent;
            }
            const hitPid = obj?.userData?.partId;
            if (hitPid) {
              sounds.playClick();
              if (onSelectPartRef.current) {
                onSelectPartRef.current(hitPid);
              }
              return;
            }
          }

          // 3. Clicked empty space: deselect
          if (onSelectPartRef.current) {
            onSelectPartRef.current(null);
          }
          return;
        }
      }

      // Normal In-Game Mode / Studio Testing Mode
      if (e.button === 2 || e.button === 1) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      if (e.button === 0) {
        triggerToolAction();

        // Raycast for ClickDetectors & ProximityPrompts
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.camera = camera;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(partMeshesList, true);
        if (hits.length > 0) {
          let hitObj: THREE.Object3D | null = hits[0].object;
          while (hitObj && !hitObj.userData?.partId && hitObj.parent) {
            hitObj = hitObj.parent;
          }
          const pid = hitObj?.userData?.partId;
          if (pid) {
            const charProxy = getCharacterProxy();
            luauEngine.triggerClick(pid, {
              Name: usernameRef.current,
              name: usernameRef.current,
              UserId: 1,
              userId: 1,
              Position: playerPos,
              position: playerPos,
              Character: charProxy,
              character: charProxy,
              Backpack: []
            });
          }
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Studio Mode (non-testing)
      if (isStudioMode && !isStudioTestingRef.current) {
        if (isDraggingGizmo && selectedPartIdRef.current) {
          const rect = renderer.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );
          const ray = new THREE.Raycaster();
          ray.camera = camera;
          ray.setFromCamera(mouse, camera);
          if (ray.ray.intersectPlane(dragPlane, dragPlaneIntersect)) {
            const delta = dragPlaneIntersect.clone().sub(dragStartIntersect);
            const snap = 0.5; // Authentic Roblox 0.5 stud snap
            const snapVal = (v: number) => Math.round(v / snap) * snap;

            let nx = dragStartPartPos.x;
            let ny = dragStartPartPos.y;
            let nz = dragStartPartPos.z;

            if (activeGizmoAxis === 'X') {
              nx = snapVal(dragStartPartPos.x + delta.x);
            } else if (activeGizmoAxis === 'Y') {
              ny = Math.max(0.5, snapVal(dragStartPartPos.y + delta.y));
            } else if (activeGizmoAxis === 'Z') {
              nz = snapVal(dragStartPartPos.z + delta.z);
            } else if (activeGizmoAxis === 'XZ' || activeGizmoAxis === 'XYZ') {
              nx = snapVal(dragStartPartPos.x + delta.x);
              nz = snapVal(dragStartPartPos.z + delta.z);
            }

            activeDragPos.set(nx, ny, nz);

            // Update mesh position immediately for 60fps responsiveness
            const curMesh = partMeshes.get(selectedPartIdRef.current);
            if (curMesh) {
              curMesh.position.set(nx, ny, nz);
              if (selectionBox) selectionBox.setFromObject(curMesh);
            }
            if (gizmoGroup) {
              gizmoGroup.position.set(nx, ny, nz);
            }

            setSelectedPartCoords(prev => prev ? { ...prev, x: nx, y: ny, z: nz } : null);
          }
          return;
        }

        if (isRightDragging) {
          const dx = e.clientX - prevMouseX;
          const dy = e.clientY - prevMouseY;
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;

          studioCamYaw -= dx * 0.004;
          studioCamPitch = Math.max(-1.45, Math.min(1.45, studioCamPitch - dy * 0.004));
          persistentCameraState.current.studioCamYaw = studioCamYaw;
          persistentCameraState.current.studioCamPitch = studioCamPitch;
          return;
        }
      }

      // Normal In-Game Mode
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraYaw -= dx * 0.006;
      cameraPitch = Math.max(-0.2, Math.min(1.4, cameraPitch + dy * 0.006));
    };

    const onMouseUp = () => {
      if (isDraggingGizmo && selectedPartIdRef.current) {
        isDraggingGizmo = false;
        activeGizmoAxis = null;
        sounds.playClick();
        const finalPos = { x: activeDragPos.x, y: activeDragPos.y, z: activeDragPos.z };
        if (onTransformPartRef.current) {
          onTransformPartRef.current(selectedPartIdRef.current, finalPos);
        }
        if (onUpdatePartRef.current) {
          onUpdatePartRef.current(selectedPartIdRef.current, { position: finalPos });
        }
      }
      isDragging = false;
      isRightDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (isStudioMode && !isStudioTestingRef.current) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        studioCamPos.addScaledVector(forward, -e.deltaY * 0.04);
        persistentCameraState.current.studioCamPos.copy(studioCamPos);
        return;
      }
      cameraDistance = Math.max(2, Math.min(120, cameraDistance + e.deltaY * 0.02));
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel);
    dom.addEventListener('contextmenu', onContextMenu);

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchDragging = false;
    let touchMoved = false;
    let initialPinchDistance = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.target !== renderer.domElement) return;
      if (e.touches.length === 1) {
        isTouchDragging = true;
        touchMoved = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isTouchDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouchDragging) {
        const cx = e.touches[0].clientX;
        const cy = e.touches[0].clientY;
        const dx = cx - prevMouseX;
        const dy = cy - prevMouseY;
        if (Math.abs(cx - touchStartX) > 6 || Math.abs(cy - touchStartY) > 6) {
          touchMoved = true;
        }
        prevMouseX = cx;
        prevMouseY = cy;

        cameraYaw -= dx * 0.007;
        cameraPitch = Math.max(-0.2, Math.min(1.4, cameraPitch + dy * 0.007));
      } else if (e.touches.length === 2 && initialPinchDistance > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const diff = initialPinchDistance - currentDistance;
        cameraDistance = Math.max(2, Math.min(120, cameraDistance + diff * 0.06));
        initialPinchDistance = currentDistance;
      }
    };

    const onTouchEnd = () => {
      if (isTouchDragging && !touchMoved) {
        triggerToolAction();
      }
      isTouchDragging = false;
      initialPinchDistance = 0;
    };

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // Clock
    const clock = new THREE.Clock();

    // Respawn helper
    const respawn = () => {
      sounds.playOof();
      setShowDamageFlash(true);
      setTimeout(() => setShowDamageFlash(false), 300);

      const targetMaxHp = maxHealthRef.current || 100;
      healthRef.current = 0;
      setHealth(0);
      if (onHealthChangeRef.current) {
        onHealthChangeRef.current(0);
      }
      setTimeout(() => {
        healthRef.current = targetMaxHp;
        setHealth(targetMaxHp);
        if (onHealthChangeRef.current) onHealthChangeRef.current(targetMaxHp);
      }, 400);

      playerPos.set(
        checkpointRef.current.x,
        checkpointRef.current.y + 0.1,
        checkpointRef.current.z
      );
      velocityX = 0;
      velocityZ = 0;
      velocityY = 0;
      isGrounded = true;
      isClimbing = false;
      lastGroundPartId = null;
      characterController.root.position.copy(playerPos);
      invulnerabilityTimer = 1.2;

      dynamicPartsPhysics.forEach(item => {
        item.pos.copy(item.originalPos);
        item.rot.copy(item.originalRot);
        eulerDegToQuaternion(item.originalRot, item.quat);
        item.vel.set(0, 0, 0);
        item.rotVel.set(0, 0, 0);
      });
    };

    // Roblox Character and Player Model Proxy for Luau Scripts (Touched, ClickDetector, ProximityPrompt)
    const getCharacterProxy = () => {
      const getEffectiveWalkSpeed = () => {
        if (customWalkSpeedRef.current !== null) return customWalkSpeedRef.current;
        if (starterRigRef.current) return Math.max(0, Number(starterRigRef.current.attributes?.WalkSpeed ?? 16));
        return 16;
      };
      const getEffectiveJumpPower = () => {
        if (customJumpPowerRef.current !== null) return customJumpPowerRef.current;
        if (starterRigRef.current) return Math.max(0, Number(starterRigRef.current.attributes?.JumpPower ?? 50));
        return 50;
      };
      const humanoidObj = {
        TakeDamage: (dmg: number) => {
          if (invulnerabilityTimer <= 0) {
            setHealth(h => {
              const next = Math.max(0, h - dmg);
              if (next <= 0) respawn();
              return next;
            });
            setShowDamageFlash(true);
            sounds.playOof();
            setTimeout(() => setShowDamageFlash(false), 300);
          }
        },
        takeDamage: (dmg: number) => {
          if (invulnerabilityTimer <= 0) {
            setHealth(h => {
              const next = Math.max(0, h - dmg);
              if (next <= 0) respawn();
              return next;
            });
            setShowDamageFlash(true);
            sounds.playOof();
            setTimeout(() => setShowDamageFlash(false), 300);
          }
        },
        Heal: (amt: number) => {
          setHealth(h => Math.min(maxHealthRef.current, h + amt));
        },
        heal: (amt: number) => {
          setHealth(h => Math.min(maxHealthRef.current, h + amt));
        },
        get Health() { return healthRef.current; },
        set Health(v: number) {
          setHealth(Math.max(0, Math.min(maxHealthRef.current, v)));
          if (v <= 0) respawn();
        },
        get health() { return healthRef.current; },
        set health(v: number) {
          setHealth(Math.max(0, Math.min(maxHealthRef.current, v)));
          if (v <= 0) respawn();
        },
        get MaxHealth() { return maxHealthRef.current; },
        get maxHealth() { return maxHealthRef.current; },
        get WalkSpeed() { return speedBoostTimer > 0 ? Math.max(32, getEffectiveWalkSpeed() * 2) : getEffectiveWalkSpeed(); },
        set WalkSpeed(spd: number) {
          const n = Number(spd);
          if (Number.isFinite(n) && n >= 0) customWalkSpeedRef.current = n;
          else speedBoostTimer = 4.0;
        },
        get walkSpeed() { return speedBoostTimer > 0 ? Math.max(32, getEffectiveWalkSpeed() * 2) : getEffectiveWalkSpeed(); },
        set walkSpeed(spd: number) {
          const n = Number(spd);
          if (Number.isFinite(n) && n >= 0) customWalkSpeedRef.current = n;
          else speedBoostTimer = 4.0;
        },
        get JumpPower() { return getEffectiveJumpPower(); },
        set JumpPower(jp: number) {
          const n = Number(jp);
          if (Number.isFinite(n) && n >= 0) customJumpPowerRef.current = n;
          if (velocityY <= 0 && n > 0) {
            velocityY = Math.max(20, (n / 50) * 34);
            isGrounded = false;
            sounds.playBoost();
          }
        },
        get jumpPower() { return getEffectiveJumpPower(); },
        set jumpPower(jp: number) {
          const n = Number(jp);
          if (Number.isFinite(n) && n >= 0) customJumpPowerRef.current = n;
          if (velocityY <= 0 && n > 0) {
            velocityY = Math.max(20, (n / 50) * 34);
            isGrounded = false;
            sounds.playBoost();
          }
        },
        AddCoins: (amt: number) => {
          if (onCoinCollectedRef.current) onCoinCollectedRef.current(amt);
          sounds.playCoin();
        },
        addCoins: (amt: number) => {
          if (onCoinCollectedRef.current) onCoinCollectedRef.current(amt);
          sounds.playCoin();
        },
        IsA: (cls: string) => String(cls).toLowerCase() === 'humanoid',
        isA: (cls: string) => String(cls).toLowerCase() === 'humanoid'
      };

      const rootPartObj = {
        get Position() { return { x: playerPos.x, y: playerPos.y + 2.75, z: playerPos.z, X: playerPos.x, Y: playerPos.y + 2.75, Z: playerPos.z }; },
        set Position(val: any) {
          if (!val) return;
          const x = Number(val.x ?? val.X ?? playerPos.x);
          const y = Number(val.y ?? val.Y ?? playerPos.y + 2.75);
          const z = Number(val.z ?? val.Z ?? playerPos.z);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            playerPos.set(x, Math.max(0, y - 2.75), z);
          }
        },
        get position() { return this.Position; },
        set position(val: any) { this.Position = val; },
        get CFrame() {
          const pos = this.Position;
          return { Position: pos, p: pos, X: pos.x, Y: pos.y, Z: pos.z };
        },
        set CFrame(val: any) {
          if (!val) return;
          this.Position = val.Position || val.p || val;
        }
      };

      const parentProxy = {
        Name: usernameRef.current,
        name: usernameRef.current,
        Humanoid: humanoidObj,
        humanoid: humanoidObj,
        HumanoidRootPart: rootPartObj,
        humanoidRootPart: rootPartObj,
        FindFirstChild: (childName: string) => {
          const lower = String(childName).toLowerCase();
          if (lower === 'humanoid') return humanoidObj;
          if (lower === 'humanoidrootpart') return rootPartObj;
          return null;
        },
        findFirstChild: (childName: string) => {
          const lower = String(childName).toLowerCase();
          if (lower === 'humanoid') return humanoidObj;
          if (lower === 'humanoidrootpart') return rootPartObj;
          return null;
        },
        WaitForChild: (childName: string) => {
          const lower = String(childName).toLowerCase();
          if (lower === 'humanoid') return humanoidObj;
          if (lower === 'humanoidrootpart') return rootPartObj;
          return null;
        },
        waitForChild: (childName: string) => {
          const lower = String(childName).toLowerCase();
          if (lower === 'humanoid') return humanoidObj;
          if (lower === 'humanoidrootpart') return rootPartObj;
          return null;
        },
        FindFirstChildWhichIsA: (cName: string) => {
          if (String(cName).toLowerCase() === 'humanoid') return humanoidObj;
          return null;
        },
        findFirstChildWhichIsA: (cName: string) => {
          if (String(cName).toLowerCase() === 'humanoid') return humanoidObj;
          return null;
        },
        FindFirstChildOfClass: (cName: string) => {
          if (String(cName).toLowerCase() === 'humanoid') return humanoidObj;
          return null;
        },
        findFirstChildOfClass: (cName: string) => {
          if (String(cName).toLowerCase() === 'humanoid') return humanoidObj;
          return null;
        },
        IsA: (cls: string) => String(cls).toLowerCase() === 'model',
        isA: (cls: string) => String(cls).toLowerCase() === 'model'
      };

      return parentProxy;
    };

    // Continuous WeldConstraint solver: update connected parts
    const solveWeldConstraints = () => {
      partsRef.current.forEach(partA => {
        if (!partA.weldConstraints || partA.weldConstraints.length === 0) return;
        const meshA = partMeshes.get(partA.id);
        if (!meshA) return;

        partA.weldConstraints.forEach(weld => {
          if (!weld.enabled) return;
          const targetPart = partsRef.current.find(p => p.id === weld.part1Id);
          if (!targetPart) return;
          const isTargetAnchored = (targetPart.anchored ?? targetPart.isAnchored) ?? true;
          if (isTargetAnchored) return; // Only moves unanchored welded children

          const meshB = partMeshes.get(targetPart.id);
          const physB = dynamicPartsPhysics.get(targetPart.id);
          if (meshB) {
            const off = weld.offset || { x: targetPart.position.x - partA.position.x, y: targetPart.position.y - partA.position.y, z: targetPart.position.z - partA.position.z };
            meshB.position.set(meshA.position.x + off.x, meshA.position.y + off.y, meshA.position.z + off.z);
            if (physB) {
              physB.pos.copy(meshB.position);
              physB.vel.set(0, 0, 0);
              physB.rotVel.set(0, 0, 0);
            }
          }
        });
      });
    };

    // Sub-stepped PGS Physics Step function for unanchored parts (Roblox-authentic + Shape-accurate)
    const physEuler = new THREE.Euler(0, 0, 0, 'XYZ');
    const physAxis = new THREE.Vector3();
    const physDeltaQ = new THREE.Quaternion();
    const physLowestPt = new THREE.Vector3();
    const physRel = new THREE.Vector3();
    const physTorque = new THREE.Vector3();
    const physPushNormal = new THREE.Vector3();
    const physPushContact = new THREE.Vector3();
    const physUp = new THREE.Vector3(0, 1, 0);

    const simulatePhysicsStep = (subDt: number, moveDirX = 0, moveDirZ = 0, playerWalkingSpeed = 0, workspaceGravity = -80.0) => {
      if (dynamicPartsPhysics.size === 0) return;

      const dynamicItems = Array.from(dynamicPartsPhysics.values());

      // Prebuild colliders for all static solid parts once per substep
      const staticColliders: ShapeCollider[] = [];
      for (const sp of partsRef.current) {
        const isSpAnchored = (sp.anchored ?? sp.isAnchored) ?? true;
        if (!isSpAnchored || sp.canCollide === false || sp.type === 'coin') continue;
        staticColliders.push(partToCollider(sp));
      }

      const isRollingItem = (item: PartPhysicsItem): boolean => {
        if (item.shape === 'sphere') return true;
        if (item.shape === 'cylinder') {
          physAxis.set(0, 1, 0).applyQuaternion(item.quat);
          // Only cylinders lying on their side roll like wheels/barrels
          return Math.abs(physAxis.y) < 0.55;
        }
        return false;
      };

      const applySurfaceFriction = (item: PartPhysicsItem, normal: THREE.Vector3) => {
        const rolling = isRollingItem(item);
        const vDotN = item.vel.dot(normal);
        const vtx = item.vel.x - normal.x * vDotN;
        const vty = item.vel.y - normal.y * vDotN;
        const vtz = item.vel.z - normal.z * vDotN;
        const vtMag = Math.hypot(vtx, vty, vtz);

        if (rolling) {
          // Very low rolling resistance for spheres / sideways barrels
          const rollDecay = Math.pow(1 - Math.min(0.15, item.friction * 0.08), subDt * 60);
          item.vel.x = normal.x * vDotN + vtx * rollDecay;
          item.vel.y = normal.y * vDotN + vty * rollDecay;
          item.vel.z = normal.z * vDotN + vtz * rollDecay;
          return;
        }

        // Real Coulomb sliding friction for boxes, wedges & upright cylinders (stops squarely instead of gliding like a ball)
        if (vtMag > 1e-5) {
          const mu = Math.max(0.32, item.friction * 1.45);
          const maxDv = mu * Math.abs(workspaceGravity) * Math.max(0.25, Math.abs(normal.y)) * subDt;
          if (vtMag <= maxDv) {
            item.vel.x = normal.x * vDotN;
            item.vel.y = normal.y * vDotN;
            item.vel.z = normal.z * vDotN;
          } else {
            const keepRatio = (vtMag - maxDv) / vtMag;
            item.vel.x = normal.x * vDotN + vtx * keepRatio;
            item.vel.y = normal.y * vDotN + vty * keepRatio;
            item.vel.z = normal.z * vDotN + vtz * keepRatio;
          }
        }
      };

      const applySurfaceRollingAndTorque = (
        item: PartPhysicsItem,
        normal: THREE.Vector3,
        contactWorld: THREE.Vector3,
        impulseScalar: number
      ) => {
        if (isRollingItem(item)) {
          const rad = Math.max(0.1, item.size.x * 0.5);
          // Tangential velocity -> true rolling coupling: omega = (n x vTan) / R
          const vDotN = item.vel.dot(normal);
          const vtx = item.vel.x - normal.x * vDotN;
          const vty = item.vel.y - normal.y * vDotN;
          const vtz = item.vel.z - normal.z * vDotN;
          const ox = ((normal.y * vtz - normal.z * vty) / rad) * (180 / Math.PI);
          const oy = ((normal.z * vtx - normal.x * vtz) / rad) * (180 / Math.PI);
          const oz = ((normal.x * vty - normal.y * vtx) / rad) * (180 / Math.PI);
          const blend = Math.min(1, subDt * 14);
          item.rotVel.x = THREE.MathUtils.lerp(item.rotVel.x, ox, blend);
          item.rotVel.y = THREE.MathUtils.lerp(item.rotVel.y, oy, blend);
          item.rotVel.z = THREE.MathUtils.lerp(item.rotVel.z, oz, blend);
          return;
        }

        // Rigid-body off-center torque from hard impacts only (prevents blocks from rolling while sliding)
        if (impulseScalar > item.mass * 2.5) {
          physRel.copy(contactWorld).sub(item.pos);
          const inertia = Math.max(1.2, item.mass * (item.size.x * item.size.x + item.size.y * item.size.y + item.size.z * item.size.z) / 8);
          physTorque.crossVectors(physRel, normal).multiplyScalar(impulseScalar / inertia);
          const degFactor = 180 / Math.PI;
          item.rotVel.x += physTorque.x * degFactor * 0.35;
          item.rotVel.y += physTorque.y * degFactor * 0.25;
          item.rotVel.z += physTorque.z * degFactor * 0.35;
        }

        // Flat-face support settling so boxes/wedges sit solidly on their faces instead of wobbling like balls
        if (normal.y > 0.7) {
          const horizOffX = contactWorld.x - item.pos.x;
          const horizOffZ = contactWorld.z - item.pos.z;
          if (Math.hypot(horizOffX, horizOffZ) > 0.15) {
            item.rotVel.x += horizOffZ * 120 * subDt;
            item.rotVel.z -= horizOffX * 120 * subDt;
          }
          const flatDamp = Math.pow(0.68, subDt * 60);
          item.rotVel.multiplyScalar(flatDamp);
        }
      };

      // 1. Unanchored Parts Kinematic, Gravity & Shape-Accurate Static Collisions
      dynamicItems.forEach((item) => {
        item.vel.y += workspaceGravity * subDt;
        if (item.vel.y < -130) item.vel.y = -130;

        const airDamp = Math.pow(0.992, subDt * 60);
        item.vel.x *= airDamp;
        item.vel.z *= airDamp;

        item.pos.x += item.vel.x * subDt;
        item.pos.y += item.vel.y * subDt;
        item.pos.z += item.vel.z * subDt;

        // World-space quaternion integration from deg/s angular velocity
        const wx = THREE.MathUtils.degToRad(item.rotVel.x);
        const wy = THREE.MathUtils.degToRad(item.rotVel.y);
        const wz = THREE.MathUtils.degToRad(item.rotVel.z);
        const wMag = Math.hypot(wx, wy, wz);
        if (wMag > 1e-5) {
          physAxis.set(wx / wMag, wy / wMag, wz / wMag);
          physDeltaQ.setFromAxisAngle(physAxis, wMag * subDt);
          item.quat.premultiply(physDeltaQ).normalize();
        }

        const rotDamp = Math.pow(item.isGrounded ? (isRollingItem(item) ? 0.96 : 0.78) : 0.985, subDt * 60);
        item.rotVel.multiplyScalar(rotDamp);

        const colA: ShapeCollider = {
          id: item.id,
          shape: item.shape,
          pos: item.pos,
          quat: item.quat,
          size: item.size,
          canCollide: item.canCollide,
          anchored: false
        };

        if (item.canCollide) {
          item.isGrounded = false;

          // Baseplate collision at Y = 0 (exact lowest point of rotated shape, within 500x500 baseplate)
          if (Math.abs(item.pos.x) <= 250 && Math.abs(item.pos.z) <= 250) {
            const lowestY = getLowestPointOnShape(colA, physLowestPt);
            if (lowestY <= 0) {
              const pen = -lowestY;
              item.pos.y += pen;
              physLowestPt.y += pen;
              let impulseMag = 0;
              if (item.vel.y < 0) {
                const impactSpeed = Math.abs(item.vel.y);
                if (impactSpeed > 4) sounds.playImpact(impactSpeed / 30);
                const bounceVel = isRollingItem(item) ? -item.vel.y * item.restitution : -item.vel.y * Math.min(0.2, item.restitution);
                impulseMag = item.mass * (impactSpeed + (Math.abs(bounceVel) >= 0.8 ? bounceVel : 0));
                item.vel.y = Math.abs(bounceVel) < 0.8 ? 0 : bounceVel;
              }
              applySurfaceFriction(item, physUp);
              applySurfaceRollingAndTorque(item, physUp, physLowestPt, impulseMag);
              item.isGrounded = true;
            }
          }

          // Dynamic Part vs Static Anchored Parts (exact shape-to-shape)
          for (let sIdx = 0; sIdx < staticColliders.length; sIdx++) {
            const colB = staticColliders[sIdx];
            if (colB.id === item.id) continue;

            const hit = collideShapePair(colA, colB);
            if (!hit.collided) continue;

            item.pos.addScaledVector(hit.normalOnBToA, hit.penetration);

            const vDotN = item.vel.dot(hit.normalOnBToA);
            let impulseMag = 0;
            if (vDotN < 0) {
              const impactSpd = -vDotN;
              if (impactSpd > 4) sounds.playImpact(impactSpd / 30);
              const effRestitution = isRollingItem(item) ? item.restitution : Math.min(0.22, item.restitution);
              const bounce = Math.abs(impactSpd * effRestitution) < 0.8 ? 0 : impactSpd * effRestitution;
              impulseMag = item.mass * (impactSpd + bounce);
              item.vel.addScaledVector(hit.normalOnBToA, impactSpd + bounce);
            }

            applySurfaceFriction(item, hit.normalOnBToA);
            applySurfaceRollingAndTorque(item, hit.normalOnBToA, hit.contactWorld, impulseMag);
            if (hit.normalOnBToA.y >= 0.45) {
              item.isGrounded = true;
            }
          }
        }

        // Void recovery
        if (item.pos.y < -45) {
          item.pos.copy(item.originalPos);
          item.rot.copy(item.originalRot);
          eulerDegToQuaternion(item.originalRot, item.quat);
          item.vel.set(0, 0, 0);
          item.rotVel.set(0, 0, 0);
        }
      });

      // 2. Dynamic Part-to-Part Collisions (Shape-to-Shape Roblox PGS solver)
      for (let i = 0; i < dynamicItems.length; i++) {
        const itemA = dynamicItems[i];
        if (!itemA.canCollide) continue;
        const colA: ShapeCollider = {
          id: itemA.id,
          shape: itemA.shape,
          pos: itemA.pos,
          quat: itemA.quat,
          size: itemA.size,
          canCollide: true,
          anchored: false
        };

        for (let j = i + 1; j < dynamicItems.length; j++) {
          const itemB = dynamicItems[j];
          if (!itemB.canCollide) continue;
          const colB: ShapeCollider = {
            id: itemB.id,
            shape: itemB.shape,
            pos: itemB.pos,
            quat: itemB.quat,
            size: itemB.size,
            canCollide: true,
            anchored: false
          };

          const hit = collideShapePair(colA, colB);
          if (!hit.collided) continue;

          const totalMass = itemA.mass + itemB.mass;
          const ratioA = itemB.mass / totalMass;
          const ratioB = itemA.mass / totalMass;
          const restitution = Math.max(itemA.restitution, itemB.restitution);

          // hit.normalOnBToA points from B toward A (push A along +normal, B along -normal)
          itemA.pos.addScaledVector(hit.normalOnBToA, hit.penetration * ratioA);
          itemB.pos.addScaledVector(hit.normalOnBToA, -hit.penetration * ratioB);

          const relVelDotN =
            (itemA.vel.x - itemB.vel.x) * hit.normalOnBToA.x +
            (itemA.vel.y - itemB.vel.y) * hit.normalOnBToA.y +
            (itemA.vel.z - itemB.vel.z) * hit.normalOnBToA.z;

          if (relVelDotN < 0) {
            const jImpulse = -(1 + restitution) * relVelDotN / (1 / itemA.mass + 1 / itemB.mass);
            itemA.vel.addScaledVector(hit.normalOnBToA, jImpulse / itemA.mass);
            itemB.vel.addScaledVector(hit.normalOnBToA, -jImpulse / itemB.mass);

            applySurfaceRollingAndTorque(itemA, hit.normalOnBToA, hit.contactWorld, jImpulse * 0.5);
            const negNormal = hit.normalOnBToA.clone().negate();
            applySurfaceRollingAndTorque(itemB, negNormal, hit.contactWorld, jImpulse * 0.5);

            if (hit.normalOnBToA.y >= 0.45) itemA.isGrounded = true;
            if (hit.normalOnBToA.y <= -0.45) itemB.isGrounded = true;
          }
        }
      }

      // 3. Player-to-Dynamic-Part Momentum Transfer (Mass-aware Roblox Push & Resistance)
      if (characterController.root.visible) {
        const rigScaleX = starterRigRef.current ? Math.max(0.25, (starterRigRef.current.size?.x || 4) / 4) : 1;
        const rigScaleY = starterRigRef.current ? Math.max(0.25, (starterRigRef.current.size?.y || 5.5) / 5.5) : 1;
        const pRad = 0.85 * rigScaleX;
        const pHeight = 5.0 * rigScaleY;
        const rigAttrMass = Number(starterRigRef.current?.attributes?.Mass);
        const playerMass = (Number.isFinite(rigAttrMass) && rigAttrMass > 0)
          ? rigAttrMass
          : 16 * rigScaleX * rigScaleX * rigScaleY;

        // Normalize incoming movement direction
        const moveMag = Math.hypot(moveDirX, moveDirZ);
        const normMoveX = moveMag > 0.05 ? moveDirX / moveMag : 0;
        const normMoveZ = moveMag > 0.05 ? moveDirZ / moveMag : 0;

        dynamicItems.forEach((item) => {
          if (!item.canCollide) return;
          const colItem: ShapeCollider = {
            id: item.id,
            shape: item.shape,
            pos: item.pos,
            quat: item.quat,
            size: item.size,
            canCollide: true,
            anchored: false
          };

          const pen = intersectCapsuleWithCollider(playerPos, pRad, pHeight, colItem, physPushNormal, physPushContact);
          if (pen <= 0) return;

          if (physPushNormal.y >= 0.45 && velocityY <= 2.5) {
            // Player standing on / walking across dynamic part
            item.vel.y -= (playerMass / (playerMass + item.mass)) * 10 * subDt;
          } else {
            // If object mass is greater than player's mass (or marked non-pushable), player CANNOT push it
            if (!item.pushable || item.mass > playerMass) {
              return;
            }

            // Lateral push direction (from player toward object normal)
            const awayX = -physPushNormal.x;
            const awayZ = -physPushNormal.z;
            const blendX = moveMag > 0.05 ? THREE.MathUtils.lerp(awayX, normMoveX, 0.45) : awayX;
            const blendZ = moveMag > 0.05 ? THREE.MathUtils.lerp(awayZ, normMoveZ, 0.45) : awayZ;
            const bLen = Math.hypot(blendX, blendZ) || 1;
            const nx = blendX / bLen;
            const nz = blendZ / bLen;

            // Only push if player is moving/pressing into the object
            const pushingIntoObj = moveMag > 0.05 ? (normMoveX * nx + normMoveZ * nz) > 0.05 : pen > 0.01;
            if (!pushingIntoObj) return;

            const massRatio = item.mass / playerMass; // 0 .. 1.0
            let pushEase: number;
            if (massRatio >= 0.75) {
              // Close to or equal to player's mass => very difficult to push (crawling effort)
              const t = Math.min(1, (massRatio - 0.75) / 0.25); // 0 at 0.75, 1 at 1.0
              pushEase = THREE.MathUtils.lerp(0.16, 0.045, t);
            } else {
              pushEase = Math.pow(Math.max(0.08, 1 - massRatio * 0.85), 1.4);
            }

            const rolling = isRollingItem(item);
            // Square/non-rolling objects also resist sliding via floor friction compared to round balls
            const shapeMobility = rolling ? 1.15 : 0.72;
            const targetPushSpeed = Math.max(2.5, playerWalkingSpeed) * pushEase * shapeMobility;

            // Accelerate object smoothly toward targetPushSpeed while overcoming floor friction
            const curProj = item.vel.x * nx + item.vel.z * nz;
            if (curProj < targetPushSpeed) {
              const nextProj = THREE.MathUtils.lerp(curProj, targetPushSpeed, Math.min(1, subDt * (rolling ? 28 : 42)));
              const deltaV = nextProj - curProj;
              item.vel.x += nx * deltaV;
              item.vel.z += nz * deltaV;
            }

            // Tiny positional yield only proportional to pushEase (almost zero when heavy)
            const posYield = Math.min(0.45, pen * pushEase * (rolling ? 0.45 : 0.2));
            item.pos.x += nx * posYield;
            item.pos.z += nz * posYield;

            // Slow the player down while straining to push a heavy / near-equal mass object
            if (massRatio >= 0.45) {
              const vInto = velocityX * nx + velocityZ * nz;
              if (vInto > targetPushSpeed) {
                const slowAmt = (vInto - targetPushSpeed) * Math.min(1, 0.35 + massRatio * 0.65);
                velocityX -= nx * slowAmt;
                velocityZ -= nz * slowAmt;
              }
            }

            // Only spheres / rolling cylinders receive rolling spin when pushed; blocks slide flat!
            if (rolling) {
              const rad = Math.max(0.15, item.size.x * 0.5);
              const rollDeg = (targetPushSpeed / rad) * (180 / Math.PI);
              item.rotVel.x = THREE.MathUtils.lerp(item.rotVel.x, nz * rollDeg, Math.min(1, subDt * 12));
              item.rotVel.z = THREE.MathUtils.lerp(item.rotVel.z, -nx * rollDeg, Math.min(1, subDt * 12));
            }
          }
        });
      }

      // Sync physics transform back to mesh and Euler cache
      dynamicPartsPhysics.forEach((item, id) => {
        physEuler.setFromQuaternion(item.quat, 'XYZ');
        item.rot.set(
          THREE.MathUtils.radToDeg(physEuler.x),
          THREE.MathUtils.radToDeg(physEuler.y),
          THREE.MathUtils.radToDeg(physEuler.z)
        );
        const mesh = partMeshes.get(id);
        if (mesh) {
          mesh.position.copy(item.pos);
          mesh.quaternion.copy(item.quat);
        }
      });
    };

    const applyPartUpdateInEngine = (partId: string, partial: Partial<BloxPart>) => {
      const targetP = partsRef.current.find(p => p.id === partId);
      let needsRebuild = false;
      if (targetP) {
        if (partial.name !== undefined) targetP.name = partial.name;
        if (partial.position) targetP.position = { ...targetP.position, ...partial.position };
        if (partial.rotation) targetP.rotation = { ...targetP.rotation, ...partial.rotation };
        if (partial.size) {
          targetP.size = { ...targetP.size, ...partial.size };
          needsRebuild = true;
        }
        if (partial.type && partial.type !== targetP.type) {
          targetP.type = partial.type;
          needsRebuild = true;
        }
        if (partial.coinValue !== undefined) targetP.coinValue = partial.coinValue;
        if (partial.color) targetP.color = partial.color;
        if (partial.material && partial.material !== targetP.material) {
          targetP.material = partial.material;
          needsRebuild = true;
        }
        if (partial.transparency !== undefined) targetP.transparency = partial.transparency;
        if (partial.canCollide !== undefined) targetP.canCollide = partial.canCollide;
        if (partial.anchored !== undefined) {
          targetP.anchored = partial.anchored;
          targetP.isAnchored = partial.anchored;
        }
        if (partial.attributes) {
          targetP.attributes = { ...(targetP.attributes || {}), ...partial.attributes };
        }
      }

      if (needsRebuild && targetP && targetP.type !== 'rig' && targetP.type !== 'npc') {
        mountSingleNonRigPart(targetP);
        return;
      }

      const mesh = partMeshes.get(partId);
      if (mesh) {
        if (partial.position) {
          mesh.position.set(partial.position.x, partial.position.y, partial.position.z);
          const phys = dynamicPartsPhysics.get(partId);
          if (phys) phys.pos.set(partial.position.x, partial.position.y, partial.position.z);
        }
        if (partial.rotation) {
          mesh.rotation.set(
            THREE.MathUtils.degToRad(partial.rotation.x),
            THREE.MathUtils.degToRad(partial.rotation.y),
            THREE.MathUtils.degToRad(partial.rotation.z)
          );
          const phys = dynamicPartsPhysics.get(partId);
          if (phys) {
            phys.rot.set(partial.rotation.x, partial.rotation.y, partial.rotation.z);
            eulerDegToQuaternion(partial.rotation, phys.quat);
          }
        }
        if (partial.color && 'material' in mesh && (mesh as any).material) {
          const mat = (mesh as any).material;
          if (mat.color) mat.color.set(partial.color);
          if (mat.emissive) mat.emissive.set(partial.color);
        }
        if (partial.transparency !== undefined && 'material' in mesh) {
          const mat = (mesh as any).material;
          mat.transparent = partial.transparency > 0;
          mat.opacity = 1 - partial.transparency;
        }
      }
    };

    const handleRigDiedInEngine = (rigPartId: string) => {
      const rs = rigStates.get(rigPartId);
      const rigPart = partsRef.current.find(p => p.id === rigPartId);
      if (rs && !rs.isDead) {
        rs.isDead = true;
        rs.moveTarget = null;
        rs.isMoving = false;
        rs.attackTimer = 0;
        rs.damagedTimer = 0.4;
        if (rs.hpSprite) rs.hpSprite.visible = false;
        rs.wrapper.rotation.x = -Math.PI / 2;
        const rigHalfH = (rigPart?.size?.y || 5.5) * 0.5;
        rs.wrapper.position.y = Math.max(0.65, rs.wrapper.position.y - rigHalfH + 0.65);
        rs.controller.root.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const m = (child as THREE.Mesh).material;
            if (m && !Array.isArray(m)) {
              m.transparent = true;
              m.opacity = 0.55;
            }
          }
        });
      }
      if (rigPart) {
        rigPart.canCollide = false;
        rigPart.attributes = { ...(rigPart.attributes || {}), Health: 0 };
      }
    };

    onSwordAttackRef.current = (damage: number) => {
      if (isStudioModeRef.current && !isStudioTestingRef.current) return;
      const meleeReach = 8.0;
      const playerCenterY = playerPos.y + 2.75;
      let hitAny = false;
      rigStates.forEach((rs, rigId) => {
        if (rs.isDead) return;
        const rigPart = partsRef.current.find(p => p.id === rigId);
        if (!rigPart) return;
        if (rigPart.attributes?.StarterCharacter === true && (rigPart.transparency ?? 0) >= 1) return;

        const rigRadius = Math.max(rigPart.size?.x || 4, rigPart.size?.z || 2) * 0.45;
        const rigHalfH = (rigPart.size?.y || 5.5) * 0.5;
        const dx = rs.wrapper.position.x - playerPos.x;
        const dz = rs.wrapper.position.z - playerPos.z;
        const distHoriz = Math.hypot(dx, dz);
        const yDiff = Math.abs(rs.wrapper.position.y - playerCenterY);

        if (distHoriz <= meleeReach + rigRadius && yDiff <= rigHalfH + 4.5) {
          hitAny = true;
          rs.damagedTimer = 0.32;
          const result = luauEngine.damageRig(
            rigId,
            damage,
            partsRef.current,
            applyPartUpdateInEngine,
            handleRigDiedInEngine
          );
          updateRigHealthBar(rigId);
          spawnDamagePopup(
            new THREE.Vector3(rs.wrapper.position.x, rs.wrapper.position.y + rigHalfH + 0.6, rs.wrapper.position.z),
            damage
          );

          // Knockback slightly away from player while alive
          if (!result.died && distHoriz > 0.05) {
            const kb = 1.4;
            rs.wrapper.position.x += (dx / distHoriz) * kb;
            rs.wrapper.position.z += (dz / distHoriz) * kb;
          }
        }
      });
      if (hitAny) {
        sounds.playSwordHit();
      }
    };

    // Auto-run Luau scripts when playing or testing
    const runAllScripts = () => {
      luauEngine.stopAll();
      const gameScripts: LuauScriptInstance[] = [];
      if (scriptsRef.current && scriptsRef.current.length > 0) {
        gameScripts.push(...scriptsRef.current);
      }
      partsRef.current.forEach(p => {
        if (p.luauScripts && p.luauScripts.length > 0) {
          gameScripts.push(...p.luauScripts);
        }
        if (p.script && (!p.luauScripts || p.luauScripts.length === 0)) {
          let source = '';
          if (p.script.action === 'rotate') {
            const rotSpeed = typeof p.script.parameter === 'number' ? p.script.parameter : 2;
            source = `while true do\n  task.wait(0.03)\n  script.Parent.Rotation = Vector3.new(script.Parent.Rotation.X, script.Parent.Rotation.Y + ${rotSpeed}, script.Parent.Rotation.Z)\nend`;
          } else if (p.script.action === 'damage') {
            const dmg = typeof p.script.parameter === 'number' ? p.script.parameter : 100;
            source = `script.Parent.Touched:Connect(function(hit)\n  local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")\n  if humanoid then humanoid:TakeDamage(${dmg}) end\nend)`;
          } else if (p.script.action === 'heal') {
            const healAmt = typeof p.script.parameter === 'number' ? p.script.parameter : 25;
            source = `script.Parent.Touched:Connect(function(hit)\n  local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")\n  if humanoid then humanoid.Health = math.min(100, humanoid.Health + ${healAmt}) end\nend)`;
          } else if (p.script.action === 'bounce') {
            source = `script.Parent.Touched:Connect(function(hit)\n  local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")\n  if humanoid then humanoid.JumpPower = 35 end\nend)`;
          } else if (p.script.action === 'speedBoost') {
            source = `script.Parent.Touched:Connect(function(hit)\n  local humanoid = hit.Parent and hit.Parent:FindFirstChild("Humanoid")\n  if humanoid then humanoid.WalkSpeed = 32 end\nend)`;
          }
          if (source) {
            gameScripts.push({
              id: `script-auto-${p.id}`,
              name: `${p.name}Script`,
              className: 'Script',
              source,
              enabled: true,
              parentPartId: p.id
            });
          }
        }
      });

      if (customTools && customTools.length > 0) {
        customTools.forEach(tool => {
          if (tool.scriptSource && tool.scriptSource.trim()) {
            gameScripts.push({
              id: `tool-script-${tool.id}`,
              name: `${tool.name}Script`,
              className: 'Script',
              source: tool.scriptSource,
              enabled: true
            });
          }
        });
      }

      console.log(`[Basehub Engine] Executando todos os ${gameScripts.length} scripts Luau quando o jogo começar...`);
      gameScripts.forEach(script => {
        if (script.enabled !== false) {
          const targetParent = partsRef.current.find(p => p.id === script.parentPartId) || partsRef.current[0];
          luauEngine.executeScript(script, {
            scriptId: script.id,
            scriptName: script.name,
            parentPart: targetParent,
            parts: partsRef.current,
            onUpdatePart: applyPartUpdateInEngine,
            onAddPart: (newPart) => {
              partsRef.current.push(newPart);
              if (newPart.type === 'rig' || newPart.type === 'npc') {
                if (syncPartsRef.current) syncPartsRef.current();
              } else {
                mountSingleNonRigPart(newPart);
              }
            },
            onRemovePart: (partId) => {
              const idx = partsRef.current.findIndex(p => p.id === partId);
              if (idx !== -1) partsRef.current.splice(idx, 1);
              unmountPartMesh(partId);
            },
            onLog: (entry) => {
              console.log(`[Luau: ${entry.scriptName}]`, entry.message);
            },
            onRigMoveTo: (rigPartId, targetPos, walkSpeed) => {
              const rs = rigStates.get(rigPartId);
              if (!rs || rs.isDead) return;
              if (!rs.moveTarget) {
                rs.moveTarget = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
              } else {
                rs.moveTarget.set(targetPos.x, targetPos.y, targetPos.z);
              }
              if (typeof walkSpeed === 'number' && Number.isFinite(walkSpeed)) {
                rs.moveSpeed = Math.max(0, walkSpeed);
              }
            },
            onRigAttack: (rigPartId) => {
              const rs = rigStates.get(rigPartId);
              if (rs && !rs.isDead) {
                rs.attackTimer = 0.36;
              }
            },
            onRigDied: handleRigDiedInEngine,
            getPlayer: () => ({
              isActive: !isStudioModeRef.current || isStudioTestingRef.current,
              position: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
              health: healthRef.current,
              maxHealth: maxHealthRef.current,
              walkSpeed: customWalkSpeedRef.current ?? (starterRigRef.current ? Number(starterRigRef.current.attributes?.WalkSpeed ?? 16) : 16),
              jumpPower: customJumpPowerRef.current ?? (starterRigRef.current ? Number(starterRigRef.current.attributes?.JumpPower ?? 50) : 50),
              takeDamage: (dmg) => {
                if (invulnerabilityTimer > 0) return;
                const amount = Math.max(0, Number(dmg) || 0);
                if (amount <= 0) return;
                const next = Math.max(0, healthRef.current - amount);
                healthRef.current = next;
                setHealth(next);
                if (onHealthChangeRef.current) onHealthChangeRef.current(next);
                if (next <= 0) {
                  respawn();
                } else {
                  setShowDamageFlash(true);
                  sounds.playOof();
                  setTimeout(() => setShowDamageFlash(false), 260);
                }
              },
              heal: (amt) => {
                const amount = Math.max(0, Number(amt) || 0);
                const next = Math.min(maxHealthRef.current, healthRef.current + amount);
                healthRef.current = next;
                setHealth(next);
                if (onHealthChangeRef.current) onHealthChangeRef.current(next);
              },
              setSpeed: (spd?: number) => {
                const n = Number(spd);
                if (Number.isFinite(n) && n >= 0) customWalkSpeedRef.current = n;
                else speedBoostTimer = 4.0;
              },
              setJumpPower: (jp) => {
                const n = Number(jp);
                if (Number.isFinite(n) && n >= 0) customJumpPowerRef.current = n;
                velocityY = Math.max(20, ((n || 50) / 50) * 34);
                isGrounded = false;
              },
              teleport: (pos) => playerPos.set(pos.x, pos.y, pos.z),
              addCoins: (amt) => { if (onCoinCollectedRef.current) onCoinCollectedRef.current(amt); }
            }),
            onAddGui: (gui: any) => {
              setScreenGuis(prev => {
                const filtered = prev.filter(g => g.id !== gui.id);
                return gui.visible !== false ? [...filtered, gui] : filtered;
              });
            },
            onAddTool: (tool: any) => {
              setAvailableTools(prev => {
                const filtered = prev.filter(t => t.id !== tool.id);
                return [...filtered, {
                  id: tool.id,
                  name: tool.name,
                  icon: tool.icon || '⚔️',
                  slot: filtered.length + 1,
                  type: 'custom',
                  description: tool.toolTip || 'Custom Tool'
                }];
              });
            }
          });
        }
      });
    };

    runAllScriptsRef.current = runAllScripts;

    // Always auto-run Luau scripts continuously (game mode, studio edit mode, and playtesting)
    runAllScripts();

    // Main animation loop with Sub-stepped Precision Kinematic Collision
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Check external reset trigger
      if (resetTriggerRef.current && resetTriggerRef.current > 0 && resetTriggerRef.current !== lastResetRef.current) {
        lastResetRef.current = resetTriggerRef.current;
        respawn();
        runAllScripts();
      }

      if (wasTesting !== isStudioTestingRef.current) {
        wasTesting = isStudioTestingRef.current;
        collectedCoinsRef.current.clear();
        partsRef.current = clonePartsList(latestPropsPartsRef.current);
        if (syncPartsRef.current) {
          syncPartsRef.current();
        }
        if (isStudioTestingRef.current) {
          invulnerabilityTimer = 0;
          playerPos.set(spawnPointRef.current.x, spawnPointRef.current.y, spawnPointRef.current.z);
          velocityX = 0;
          velocityZ = 0;
          velocityY = 0;
          characterController.root.position.copy(playerPos);
        } else {
          studioCamPos.set(playerPos.x, playerPos.y + 6, playerPos.z + 12);
          persistentCameraState.current.studioCamPos.copy(studioCamPos);
        }
        // Keep scripts always executing continuously
        runAllScripts();
      }

      const frameDelta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      // Update equipped tool model if tool state changed
      updateHandToolMesh(equippedToolRef.current);

      // Update floating damage popups
      for (let i = damagePopups.length - 1; i >= 0; i--) {
        const pop = damagePopups[i];
        pop.life -= frameDelta;
        pop.sprite.position.y += frameDelta * 2.4;
        pop.mat.opacity = Math.max(0, pop.life / pop.maxLife);
        if (pop.life <= 0) {
          scene.remove(pop.sprite);
          pop.tex.dispose();
          pop.mat.dispose();
          damagePopups.splice(i, 1);
        }
      }

      // Update Speech Bubble
      const bubbleText = chatBubbleTextRef.current;
      if (bubbleText) {
        bubbleSprite.visible = true;
        const bCtx = bubbleCanvas.getContext('2d')!;
        bCtx.clearRect(0, 0, 512, 128);
        bCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        bCtx.strokeStyle = '#0284c7';
        bCtx.lineWidth = 4;
        bCtx.roundRect(10, 10, 492, 90, 20);
        bCtx.fill();
        bCtx.stroke();
        bCtx.fillStyle = '#0f172a';
        bCtx.font = 'bold 28px sans-serif';
        bCtx.textAlign = 'center';
        bCtx.textBaseline = 'middle';
        bCtx.fillText(bubbleText.slice(0, 34), 256, 55);
        bubbleTex.needsUpdate = true;
      } else {
        bubbleSprite.visible = false;
      }

      // Selection box
      const selId = selectedPartIdRef.current;
      if (selId && partMeshes.has(selId)) {
        const mesh = partMeshes.get(selId)!;
        selectionBox.setFromObject(mesh);
        selectionBox.visible = true;
      } else {
        selectionBox.visible = false;
      }

      // Rotate coins
      partMeshes.forEach((mesh, id) => {
        const part = partsRef.current.find(p => p.id === id);
        if (part?.type === 'coin') {
          mesh.rotation.z += frameDelta * 2.5;
          mesh.position.y = part.position.y + Math.sin(time * 3 + mesh.position.x) * 0.2;
        }
      });

      // Mobile camera rotation
      if (cameraDeltaRef.current.yaw !== 0 || cameraDeltaRef.current.pitch !== 0) {
        cameraYaw += cameraDeltaRef.current.yaw;
        cameraPitch = Math.max(-0.25, Math.min(1.4, cameraPitch + cameraDeltaRef.current.pitch));
        cameraDeltaRef.current.yaw = 0;
        cameraDeltaRef.current.pitch = 0;
      }

      // Sync persistent camera state
      persistentCameraState.current.yaw = cameraYaw;
      persistentCameraState.current.pitch = cameraPitch;
      persistentCameraState.current.distance = cameraDistance;
      persistentCameraState.current.studioCamPos.copy(studioCamPos);
      if (characterController.root.visible) {
        if (!persistentCameraState.current.playerPos) {
          persistentCameraState.current.playerPos = new THREE.Vector3();
        }
        persistentCameraState.current.playerPos.copy(playerPos);
        persistentCameraState.current.currentVelX = velocityX;
        persistentCameraState.current.currentVelZ = velocityZ;
      }

      // ========================================================
      // ROBLOX STUDIO 2022 MODE: WASD CAMERA FLIGHT & AXIS GIZMO
      // ========================================================
      if (isStudioMode && !isStudioTestingRef.current) {
        characterController.root.visible = false;

        // WASD Flight Movement (Roblox Studio)
        const keys = keysPressed.current;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        const flySpeed = keys['shift'] ? 65.0 : 25.0; // Fast Sprint Fly with Shift

        const moveVec = new THREE.Vector3();
        if (keys['w'] || keys['arrowup']) moveVec.add(forward);
        if (keys['s'] || keys['arrowdown']) moveVec.sub(forward);
        if (keys['d'] || keys['arrowright']) moveVec.add(right);
        if (keys['a'] || keys['arrowleft']) moveVec.sub(right);
        if (keys['e'] || keys[' ']) moveVec.y += 1.0;
        if (keys['q']) moveVec.y -= 1.0;

        if (moveVec.lengthSq() > 0.001) {
          moveVec.normalize().multiplyScalar(flySpeed * frameDelta);
          studioCamPos.add(moveVec);
          persistentCameraState.current.studioCamPos.copy(studioCamPos);
        }

        // Studio 'F' shortcut: Focus camera smoothly onto selected part (or Spawn)
        if (focusRequestedRef.current) {
          focusRequestedRef.current = false;
          const selFocusId = selectedPartIdRef.current;
          const focusPart = selFocusId ? partsRef.current.find(p => p.id === selFocusId) : null;
          const focusMesh = selFocusId ? partMeshes.get(selFocusId) : null;
          const targetCenter = focusMesh
            ? focusMesh.position.clone()
            : (focusPart
              ? new THREE.Vector3(focusPart.position.x, focusPart.position.y, focusPart.position.z)
              : new THREE.Vector3(spawnPointRef.current.x, spawnPointRef.current.y, spawnPointRef.current.z));
          const focusDist = focusPart
            ? Math.max(8, Math.max(focusPart.size.x, focusPart.size.y, focusPart.size.z) * 2.1)
            : 14;
          studioCamPos.set(
            targetCenter.x + focusDist * 0.65,
            targetCenter.y + focusDist * 0.45,
            targetCenter.z + focusDist * 0.85
          );
          const lookDir = targetCenter.clone().sub(studioCamPos).normalize();
          studioCamYaw = Math.atan2(-lookDir.x, -lookDir.z);
          studioCamPitch = Math.asin(Math.max(-0.98, Math.min(0.98, lookDir.y)));
          persistentCameraState.current.studioCamPos.copy(studioCamPos);
          persistentCameraState.current.studioCamYaw = studioCamYaw;
          persistentCameraState.current.studioCamPitch = studioCamPitch;
        }

        camera.position.copy(studioCamPos);
        camera.rotation.set(studioCamPitch, studioCamYaw, 0, 'YXZ');

        // Update Axis Transform Gizmo & Selection Box
        const selId = selectedPartIdRef.current;
        const selPart = selId ? partsRef.current.find(p => p.id === selId) : null;
        if (selPart && gizmoGroup) {
          gizmoGroup.visible = true;
          const currentMesh = partMeshes.get(selPart.id);
          const currentPos = currentMesh ? currentMesh.position : selPart.position;
          if (!isDraggingGizmo) {
            gizmoGroup.position.set(currentPos.x, currentPos.y, currentPos.z);
          }

          // Dynamic scale compensation based on camera distance (Roblox Studio style)
          const distToCam = camera.position.distanceTo(gizmoGroup.position);
          const gizmoScale = Math.max(0.4, Math.min(6.0, distToCam * 0.05));
          gizmoGroup.scale.set(gizmoScale, gizmoScale, gizmoScale);

          // Update blue selection bounding box
          if (selectionBox && currentMesh) {
            selectionBox.visible = true;
            selectionBox.setFromObject(currentMesh);
          }
        } else {
          if (gizmoGroup) gizmoGroup.visible = false;
          if (selectionBox) selectionBox.visible = false;
        }

        if (isPhysicsRunningRef.current) {
          simulatePhysicsStep(frameDelta, 0, 0, 0, -80.0);
          solveWeldConstraints();
        }

        renderer.render(scene, camera);
        return;
      }

      characterController.root.visible = true;

      // PLAY / STUDIO TESTING: Input Calculation
      const keys = keysPressed.current;
      const touch = touchControlState.current;

      let moveForward = 0;
      let moveRight = 0;

      if (keys['w'] || keys['arrowup']) moveForward += 1;
      if (keys['s'] || keys['arrowdown']) moveForward -= 1;
      if (keys['d'] || keys['arrowright']) moveRight += 1;
      if (keys['a'] || keys['arrowleft']) moveRight -= 1;

      if (touch.forward !== 0) moveForward += touch.forward;
      if (touch.turn !== 0) moveRight += touch.turn;

      const inputLen = Math.hypot(moveForward, moveRight);
      if (inputLen > 1) {
        moveForward /= inputLen;
        moveRight /= inputLen;
      }
      const hasInput = inputLen > 0.05;

      // Base WalkSpeed from active StarterCharacter Rig (or Luau Humanoid override, default 16)
      const rigBaseWalkSpeed = customWalkSpeedRef.current !== null
        ? customWalkSpeedRef.current
        : (starterRigRef.current ? Math.max(0, Number(starterRigRef.current.attributes?.WalkSpeed ?? 16)) : 16);

      // Tool Speed Bonus or Pass Speed Bonus
      let targetSpeed = rigBaseWalkSpeed;
      if (touch.sprint || keys['shift']) targetSpeed = Math.max(rigBaseWalkSpeed * 1.5, rigBaseWalkSpeed + 8);
      if (activePassesRef.current.includes('speed_coil') || equippedToolRef.current?.type === 'speed_coil') {
        targetSpeed = Math.max(32, rigBaseWalkSpeed * 2);
      }
      if (speedBoostTimer > 0) {
        speedBoostTimer -= frameDelta;
        targetSpeed = Math.max(36, rigBaseWalkSpeed * 2.2);
      }

      const forwardDirX = -Math.sin(cameraYaw);
      const forwardDirZ = -Math.cos(cameraYaw);
      const rightDirX = Math.cos(cameraYaw);
      const rightDirZ = -Math.sin(cameraYaw);

      const targetDirX = forwardDirX * moveForward + rightDirX * moveRight;
      const targetDirZ = forwardDirZ * moveForward + rightDirZ * moveRight;

      const targetVelX = targetDirX * targetSpeed;
      const targetVelZ = targetDirZ * targetSpeed;

      // Authentic Roblox Humanoid responsiveness: snappy ground acceleration and instant braking
      const accel = isGrounded ? 75 : 28;
      velocityX = THREE.MathUtils.lerp(velocityX, targetVelX, Math.min(1, frameDelta * accel));
      velocityZ = THREE.MathUtils.lerp(velocityZ, targetVelZ, Math.min(1, frameDelta * accel));

      if (!hasInput && isGrounded) {
        // Roblox ground friction stops player immediately on key release
        velocityX = THREE.MathUtils.lerp(velocityX, 0, Math.min(1, frameDelta * 80));
        velocityZ = THREE.MathUtils.lerp(velocityZ, 0, Math.min(1, frameDelta * 80));
        if (Math.hypot(velocityX, velocityZ) < 0.1) {
          velocityX = 0;
          velocityZ = 0;
        }
      }

      const horizontalSpeed = Math.hypot(velocityX, velocityZ);
      const isMoving = horizontalSpeed > 0.3;

      if (isMoving) {
        const targetRot = Math.atan2(velocityX, velocityZ);
        let diff = targetRot - characterController.root.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        characterController.root.rotation.y += diff * Math.min(1, frameDelta * 18);
      }

      // Jump Logic (Roblox JumpPower default 50 => 34.0 jumpForce at gravity -80.0)
      const rigBaseJumpPower = customJumpPowerRef.current !== null
        ? customJumpPowerRef.current
        : (starterRigRef.current ? Math.max(0, Number(starterRigRef.current.attributes?.JumpPower ?? 50)) : 50);
      const scaledJumpForce = (rigBaseJumpPower / 50) * 34.0;
      const isLowGravity = activePassesRef.current.includes('gravity_coil') || equippedToolRef.current?.type === 'gravity_coil';
      const gravity = isLowGravity ? -26.0 : -80.0;
      let jumpForce = isLowGravity ? Math.max(26.0, scaledJumpForce * 0.85) : scaledJumpForce;

      const wantJump = keys[' '] || touch.jump;

      if (wantJump && isGrounded && jumpForce > 0) {
        velocityY = jumpForce;
        isGrounded = false;
        canDoubleJump = activePassesRef.current.includes('double_jump');
        hasDoubleJumped = false;
        sounds.playJump();
      } else if (wantJump && !isGrounded && canDoubleJump && !hasDoubleJumped && velocityY < 8 && jumpForce > 0) {
        velocityY = jumpForce * 0.95;
        hasDoubleJumped = true;
        sounds.playBoost();
      }

      if (invulnerabilityTimer > 0) {
        invulnerabilityTimer -= frameDelta;
      }

      // -------------------------------------------------------------
      // 4-SUBSTEP ROBLOX SHAPE-ACCURATE KINEMATIC COLLISION ENGINE
      // -------------------------------------------------------------
      const rigScaleX = starterRigRef.current ? Math.max(0.25, (starterRigRef.current.size?.x || 4) / 4) : 1;
      const rigScaleY = starterRigRef.current ? Math.max(0.25, (starterRigRef.current.size?.y || 5.5) / 5.5) : 1;
      const subSteps = 4;
      const subDt = frameDelta / subSteps;
      const playerRadius = 0.85 * rigScaleX;
      const playerHeight = 5.0 * rigScaleY;
      const maxStepHeight = 1.25 * rigScaleY;
      const minSlopeNormalY = 0.45; // Walkable slopes up to ~63 deg (Roblox wedge & ramp feel)

      // Build shape-accurate colliders for all parts
      const allPartColliders: { part: BloxPart; collider: ShapeCollider }[] = [];
      for (const p of partsRef.current) {
        const dyn = dynamicPartsPhysics.get(p.id);
        const col = dyn
          ? partToCollider(p, dyn.pos, dyn.quat)
          : partToCollider(p);
        allPartColliders.push({ part: p, collider: col });
      }
      const solidEntries = allPartColliders.filter(e => e.collider.canCollide && e.part.type !== 'coin');

      // Moving / Rotating Platform Carry (Roblox Humanoid floor locking)
      if (isGrounded && lastGroundPartId) {
        const gEntry = allPartColliders.find(e => e.part.id === lastGroundPartId);
        if (gEntry) {
          const currPos = gEntry.collider.pos;
          const currQuat = gEntry.collider.quat;
          const moveDistSq = currPos.distanceToSquared(lastGroundPartPos);
          if (moveDistSq < 16) {
            const invLast = lastGroundPartQuat.clone().invert();
            const deltaQ = currQuat.clone().multiply(invLast);
            const relPos = playerPos.clone().sub(lastGroundPartPos).applyQuaternion(deltaQ);
            playerPos.copy(currPos).add(relPos);

            // Rotate player facing gently with spinning platform around Y
            const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(deltaQ);
            const yawDelta = Math.atan2(fwd.x, fwd.z);
            characterController.root.rotation.y += yawDelta;
          }
        }
      }

      const contactNormal = new THREE.Vector3();
      const contactPoint = new THREE.Vector3();
      const probeFeet = new THREE.Vector3();
      let activeGroundPartId: string | null = null;
      let touchingTruss = false;

      for (let step = 0; step < subSteps; step++) {
        const wasGroundedThisStep = isGrounded;

        // Check Truss climbing proximity (Roblox ladder physics)
        touchingTruss = false;
        for (const entry of solidEntries) {
          if (!entry.collider.isTruss) continue;
          if (doesCapsuleOverlapCollider(playerPos, playerRadius + 0.35, playerHeight, entry.collider)) {
            touchingTruss = true;
            break;
          }
        }

        if (touchingTruss && (hasInput || wantJump)) {
          isClimbing = true;
          velocityY = wantJump ? Math.max(18, jumpForce * 0.55) : 14 * rigScaleY;
          isGrounded = false;
        } else {
          if (touchingTruss && isClimbing && !hasInput && !wantJump) {
            velocityY = 0; // Hold position on truss ladder
          } else {
            isClimbing = false;
            velocityY += gravity * subDt;
            if (velocityY < -130) velocityY = -130;
          }
        }

        // Integrate candidate position
        const prevStepY = playerPos.y;
        playerPos.x += velocityX * subDt;
        playerPos.y += velocityY * subDt;
        playerPos.z += velocityZ * subDt;

        // Dynamic physics step (parts move/rotate & exchange player momentum)
        simulatePhysicsStep(subDt, velocityX, velocityZ, horizontalSpeed, gravity);
        solveWeldConstraints();

        // Refresh dynamic collider positions after dynamic step
        for (const entry of allPartColliders) {
          const dyn = dynamicPartsPhysics.get(entry.part.id);
          if (dyn) {
            entry.collider.pos.copy(dyn.pos);
            entry.collider.quat.copy(dyn.quat);
          }
        }

        let groundedThisSubstep = false;
        activeGroundPartId = null;

        // Solid Baseplate at Y = 0 (500 x 500 studs)
        if (Math.abs(playerPos.x) <= 250 && Math.abs(playerPos.z) <= 250 && playerPos.y <= 0 && velocityY <= 0) {
          if (velocityY < -25) sounds.playLand(Math.abs(velocityY));
          playerPos.y = 0;
          velocityY = 0;
          groundedThisSubstep = true;
        }

        // 2-Pass Shape-Accurate Capsule Solver against all solid parts (Block, Sphere, Cylinder, Wedge, Rig, Truss)
        for (let iter = 0; iter < 2; iter++) {
          for (let i = 0; i < solidEntries.length; i++) {
            const { part, collider } = solidEntries[i];

            // Fast broadphase sphere distance check
            const midY = playerPos.y + playerHeight * 0.5;
            const dx = playerPos.x - collider.pos.x;
            const dy = midY - collider.pos.y;
            const dz = playerPos.z - collider.pos.z;
            const maxR = getBoundingRadius(collider) + playerHeight * 0.5 + playerRadius + 0.5;
            if (dx * dx + dy * dy + dz * dz > maxR * maxR) continue;

            const pen = intersectCapsuleWithCollider(
              playerPos,
              playerRadius,
              playerHeight,
              collider,
              contactNormal,
              contactPoint
            );

            if (pen <= 0) continue;

            // 1) Walkable Floor / Wedge Ramp / Rounded Top
            if (contactNormal.y >= minSlopeNormalY) {
              if (velocityY <= 2.5) {
                playerPos.addScaledVector(contactNormal, pen);
                const vDotN = velocityX * contactNormal.x + velocityY * contactNormal.y + velocityZ * contactNormal.z;
                if (vDotN < 0) {
                  if (velocityY < -25) sounds.playLand(Math.abs(velocityY));
                  velocityX -= contactNormal.x * vDotN * 0.25;
                  velocityZ -= contactNormal.z * vDotN * 0.25;
                  velocityY = 0;
                }
                groundedThisSubstep = true;
                activeGroundPartId = part.id;
              } else {
                // Moving upward rapidly (jumping off/past surface)
                playerPos.addScaledVector(contactNormal, pen);
              }
              continue;
            }

            // 2) Step-Up Check for low stairs / curbs / spawn pads (<= maxStepHeight)
            if (contactNormal.y > -0.25 && contactPoint.y - playerPos.y <= maxStepHeight) {
              probeFeet.set(playerPos.x, contactPoint.y + 0.05, playerPos.z);
              const surface = sampleWalkableSurfaceOnCollider(probeFeet, playerRadius, collider, minSlopeNormalY);
              const stepDelta = surface.surfaceY - playerPos.y;
              if (surface.hit && stepDelta > 0 && stepDelta <= maxStepHeight) {
                // Verify headroom above stepped position
                probeFeet.set(playerPos.x, surface.surfaceY + 0.05, playerPos.z);
                const headClearCheck = intersectCapsuleWithCollider(probeFeet, playerRadius * 0.9, playerHeight, collider);
                if (headClearCheck <= 0.08) {
                  playerPos.y = surface.surfaceY;
                  if (velocityY < 0) velocityY = 0;
                  groundedThisSubstep = true;
                  activeGroundPartId = part.id;
                  continue;
                }
              }
            }

            // 3) Ceiling / Underside Collision (skip if falling from above a thin floor -> snap up instead)
            if (contactNormal.y < -0.5) {
              if (velocityY < 0 && prevStepY >= collider.pos.y) {
                probeFeet.set(playerPos.x, collider.pos.y + collider.size.y * 0.5 + 0.05, playerPos.z);
                const topSurface = sampleWalkableSurfaceOnCollider(probeFeet, playerRadius, collider, minSlopeNormalY);
                if (topSurface.hit) {
                  if (velocityY < -25) sounds.playLand(Math.abs(velocityY));
                  playerPos.y = topSurface.surfaceY;
                  velocityY = 0;
                  groundedThisSubstep = true;
                  activeGroundPartId = part.id;
                  continue;
                }
              }
              playerPos.addScaledVector(contactNormal, pen);
              if (velocityY > 0) {
                if (velocityY > 8) sounds.playHeadBump();
                const vDotN = velocityX * contactNormal.x + velocityY * contactNormal.y + velocityZ * contactNormal.z;
                if (vDotN < 0) {
                  velocityX -= contactNormal.x * vDotN;
                  velocityZ -= contactNormal.z * vDotN;
                  velocityY = Math.min(0, -1.8);
                }
              }
              continue;
            }

            // 4) Wall / Curved Pillar / Steep Slope Sliding
            if (contactNormal.y >= -0.35 && contactNormal.y < minSlopeNormalY && wasGroundedThisStep && contactNormal.y > 0.05) {
              // Steep slope > 63°: push out in 3D so player slides down instead of floating
              playerPos.addScaledVector(contactNormal, pen);
              const vDotN = velocityX * contactNormal.x + velocityY * contactNormal.y + velocityZ * contactNormal.z;
              if (vDotN < 0) {
                velocityX -= contactNormal.x * vDotN;
                velocityY -= contactNormal.y * vDotN;
                velocityZ -= contactNormal.z * vDotN;
              }
            } else {
              // Smooth horizontal wall sliding along true 2D wall normal
              const hLen = Math.hypot(contactNormal.x, contactNormal.z);
              if (hLen > 1e-4) {
                const hnx = contactNormal.x / hLen;
                const hnz = contactNormal.z / hLen;
                const pushDist = pen / Math.max(0.5, hLen);
                playerPos.x += hnx * Math.min(pen * 1.25, pushDist);
                playerPos.z += hnz * Math.min(pen * 1.25, pushDist);

                const vDotH = velocityX * hnx + velocityZ * hnz;
                if (vDotH < 0) {
                  velocityX -= hnx * vDotH;
                  velocityZ -= hnz * vDotH;
                }
              } else {
                playerPos.addScaledVector(contactNormal, pen);
              }
            }
          }
        }

        // Downhill slope-sticking probe (prevents hopping when walking down Wedge ramps)
        if (!groundedThisSubstep && wasGroundedThisStep && velocityY <= 0 && !isClimbing) {
          probeFeet.set(playerPos.x, playerPos.y - 0.32, playerPos.z);
          if (Math.abs(playerPos.x) <= 250 && Math.abs(playerPos.z) <= 250 && probeFeet.y <= 0 && playerPos.y <= 0.4) {
            playerPos.y = 0;
            velocityY = 0;
            groundedThisSubstep = true;
          } else {
            let bestStickY = -Infinity;
            let bestStickId: string | null = null;
            for (let i = 0; i < solidEntries.length; i++) {
              const { part, collider } = solidEntries[i];
              const hit = sampleWalkableSurfaceOnCollider(probeFeet, playerRadius, collider, minSlopeNormalY);
              if (hit.hit && hit.surfaceY <= playerPos.y + 0.05 && hit.surfaceY >= playerPos.y - 0.42 && hit.surfaceY > bestStickY) {
                bestStickY = hit.surfaceY;
                bestStickId = part.id;
              }
            }
            if (bestStickY > -Infinity) {
              playerPos.y = bestStickY;
              velocityY = 0;
              groundedThisSubstep = true;
              activeGroundPartId = bestStickId;
            }
          }
        }

        isGrounded = groundedThisSubstep;
      }

      // Record floor transform for next frame's moving/rotating platform carry
      if (isGrounded && activeGroundPartId) {
        const gEntry = allPartColliders.find(e => e.part.id === activeGroundPartId);
        if (gEntry) {
          lastGroundPartId = activeGroundPartId;
          lastGroundPartPos.copy(gEntry.collider.pos);
          lastGroundPartQuat.copy(gEntry.collider.quat);
        } else {
          lastGroundPartId = null;
        }
      } else {
        lastGroundPartId = null;
      }

      // Void death
      if (playerPos.y < -45) {
        respawn();
      }

      // 3. Interactive Parts & Gameplay Mechanics (Shape-accurate Touched detection)
      for (const { part, collider } of allPartColliders) {
        const touchRadius = part.type === 'coin' ? playerRadius + 0.35 : playerRadius + 0.14;
        if (!doesCapsuleOverlapCollider(playerPos, touchRadius, playerHeight, collider)) continue;

        const partPos = collider.pos;
        const partTop = partPos.y + part.size.y / 2;
        const parentProxy = getCharacterProxy();

        // Trigger Touched in Luau
        luauEngine.triggerTouch(part.id, {
          Name: 'HumanoidRootPart',
          name: 'HumanoidRootPart',
          Parent: parentProxy,
          parent: parentProxy,
          Position: playerPos,
          position: playerPos,
          CFrame: { Position: playerPos, p: playerPos },
          FindFirstChild: (c: string) => (String(c).toLowerCase() === 'parent' ? parentProxy : null),
          findFirstChild: (c: string) => (String(c).toLowerCase() === 'parent' ? parentProxy : null)
        });

        // Touching coin
        if (part.type === 'coin' && !collectedCoinsRef.current.has(part.id)) {
          sounds.playCoin();
          collectedCoinsRef.current.add(part.id);
          setCollectedCoinIds(prev => new Set(prev).add(part.id));
          const coinMesh = partMeshes.get(part.id);
          if (coinMesh) coinMesh.visible = false;
          if (onCoinCollectedRef.current) onCoinCollectedRef.current(part.coinValue || 20);
        }

        // Touching killbrick / lava
        if (part.type === 'killbrick' && invulnerabilityTimer <= 0) {
          respawn();
          break;
        }

        // Bounce pad
        if (part.type === 'bouncepad' && velocityY <= 0) {
          velocityY = 48;
          isGrounded = false;
          sounds.playBoost();
        }

        // Speed pad
        if (part.type === 'speedpad') {
          speedBoostTimer = 4.0;
          sounds.playBoost();
        }

        // Checkpoint
        if (part.type === 'checkpoint' || part.label?.includes('CHECKPOINT')) {
          if (checkpointRef.current.x !== partPos.x || checkpointRef.current.z !== partPos.z) {
            const newCp = { x: partPos.x, y: partTop + 0.1, z: partPos.z };
            checkpointRef.current = newCp;
            setCurrentCheckpoint(newCp);
          }
        }

        // Teleporter / Winner portal
        if (part.type === 'teleporter' || part.label?.includes('WINNER')) {
          sounds.playVictory();
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
          if (onVictoryRef.current) onVictoryRef.current();
        }
      }

      // Update R6 character animation
      characterController.root.position.copy(playerPos);
      characterController.updateAnimation(
        frameDelta,
        time,
        isMoving,
        !isGrounded,
        velocityY,
        showDamageFlash,
        horizontalSpeed / 16
      );

      // Sword / Tool slash animation overlay (applied after updateAnimation so it's never overwritten)
      if (swordSwingTimerRef.current > 0) {
        swordSwingTimerRef.current = Math.max(0, swordSwingTimerRef.current - frameDelta);
        const progress = 1 - swordSwingTimerRef.current / 0.28;
        characterController.rightArm.rotation.x = -2.35 + progress * 2.25;
        characterController.rightArm.rotation.z = -0.35 + progress * 0.45;
      }

      // Update NPC / World Rigs AI locomotion, ground snapping, obstacle avoidance & animations
      rigStates.forEach((rs, rigId) => {
        const rigPart = partsRef.current.find(p => p.id === rigId);
        if (!rigPart) return;

        const wasDamaged = rs.damagedTimer > 0;
        if (rs.damagedTimer > 0) {
          rs.damagedTimer = Math.max(0, rs.damagedTimer - frameDelta);
        }
        const isDamagedNow = rs.damagedTimer > 0;
        if (wasDamaged !== isDamagedNow) {
          rs.controller.root.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && 'emissive' in m) {
                if (isDamagedNow) {
                  m.emissive.setHex(0xef4444);
                  m.emissiveIntensity = 0.55;
                } else {
                  m.emissive.setHex(0x000000);
                  m.emissiveIntensity = 0;
                }
              }
            }
          });
        }

        updateRigHealthBar(rigId);

        if (rs.isDead) {
          rs.controller.updateAnimation(frameDelta, time, false, false, 0, rs.damagedTimer > 0, 1.0);
          return;
        }

        const pos = rs.wrapper.position;
        let movingNow = false;
        let speedScale = 1.0;
        const rigHalfH = (rigPart.size?.y || 5.5) * 0.5;
        const rigRadius = 1.25;

        if (rs.moveTarget) {
          const dx = rs.moveTarget.x - pos.x;
          const dz = rs.moveTarget.z - pos.z;
          const horizDist = Math.hypot(dx, dz);
          const speed = Math.max(0, Number(rigPart.attributes?.WalkSpeed ?? rs.moveSpeed ?? 12));

          if (horizDist > 0.35 && speed > 0) {
            const step = Math.min(horizDist - 0.2, speed * frameDelta);
            const dirX = dx / horizDist;
            const dirZ = dz / horizDist;
            let nextX = pos.x + dirX * step;
            let nextZ = pos.z + dirZ * step;

            // Horizontal obstacle push-out against solid walls taller than Rig step height
            const rigFeetY = pos.y - rigHalfH;
            for (const { part: obsPart, collider: obsCol } of solidEntries) {
              if (obsPart.id === rigId) continue;
              const obsHalfY = obsCol.size.y * 0.5;
              const obsTopY = obsCol.pos.y + obsHalfY;
              const obsBotY = obsCol.pos.y - obsHalfY;
              if (obsTopY <= rigFeetY + 1.35 || obsBotY >= rigFeetY + (rigPart.size?.y || 5.5)) continue;
              const wallProbe = new THREE.Vector3(nextX, rigFeetY + 1.35, nextZ);
              const hitNormal = new THREE.Vector3();
              const hitPt = new THREE.Vector3();
              const pen = intersectCapsuleWithCollider(wallProbe, rigRadius, 3.8, obsCol, hitNormal, hitPt);
              if (pen > 0.001 && Math.abs(hitNormal.y) < 0.65) {
                nextX += hitNormal.x * pen;
                nextZ += hitNormal.z * pen;
              }
            }

            // Stop walking once within strike range (~3.6 studs) when chasing the active player, and prevent clipping inside (< 2.1 studs)
            const minPlayerSep = 2.1;
            const strikeStopDist = 3.6;
            let blockedByPlayer = false;
            if (!isStudioMode || isStudioTesting) {
              const targetIsPlayer = Math.hypot(rs.moveTarget.x - playerPos.x, rs.moveTarget.z - playerPos.z) < 2.2;
              const curPDist = Math.hypot(pos.x - playerPos.x, pos.z - playerPos.z);
              const yOverlap = Math.abs(playerPos.y - pos.y) < 5.0;

              if (yOverlap && targetIsPlayer && curPDist <= strikeStopDist) {
                nextX = pos.x;
                nextZ = pos.z;
                blockedByPlayer = true;
              } else if (yOverlap) {
                const pDx = nextX - playerPos.x;
                const pDz = nextZ - playerPos.z;
                const pDist = Math.hypot(pDx, pDz);
                if (pDist < minPlayerSep) {
                  if (pDist > 0.001) {
                    nextX = playerPos.x + (pDx / pDist) * minPlayerSep;
                    nextZ = playerPos.z + (pDz / pDist) * minPlayerSep;
                  } else {
                    nextX = pos.x;
                    nextZ = pos.z;
                  }
                  if (Math.hypot(nextX - pos.x, nextZ - pos.z) < 0.015) {
                    blockedByPlayer = true;
                  }
                }
              }
            }

            // Ground snapping onto baseplate (y = 0) or walkable platform tops
            let floorY = 0;
            const rigProbePos = new THREE.Vector3(nextX, rigFeetY, nextZ);
            for (const { part: surfPart, collider: surfCol } of solidEntries) {
              if (surfPart.id === rigId) continue;
              const surfHit = sampleWalkableSurfaceOnCollider(rigProbePos, rigRadius * 0.7, surfCol, 0.45);
              if (surfHit.hit && surfHit.surfaceY <= rigFeetY + 1.5 && surfHit.surfaceY > floorY) {
                floorY = surfHit.surfaceY;
              }
            }

            pos.x = nextX;
            pos.z = nextZ;
            pos.y = THREE.MathUtils.lerp(pos.y, floorY + rigHalfH, Math.min(1, frameDelta * 18));

            const targetYaw = Math.atan2(dirX, dirZ);
            let yDiff = targetYaw - rs.wrapper.rotation.y;
            while (yDiff > Math.PI) yDiff -= Math.PI * 2;
            while (yDiff < -Math.PI) yDiff += Math.PI * 2;
            rs.wrapper.rotation.y += yDiff * Math.min(1, frameDelta * 14);

            rigPart.position.x = pos.x;
            rigPart.position.y = pos.y;
            rigPart.position.z = pos.z;
            rigPart.rotation.y = THREE.MathUtils.radToDeg(rs.wrapper.rotation.y);

            movingNow = !blockedByPlayer && Math.hypot(pos.x - rs.lastPos.x, pos.z - rs.lastPos.z) > 0.002;
            speedScale = Math.max(0.5, speed / 16);
          } else {
            rs.moveTarget = null;
          }
        }

        if (!movingNow) {
          const ddx = pos.x - rs.lastPos.x;
          const ddz = pos.z - rs.lastPos.z;
          if (Math.hypot(ddx, ddz) > 0.004) {
            movingNow = true;
            const targetYaw = Math.atan2(ddx, ddz);
            let yDiff = targetYaw - rs.wrapper.rotation.y;
            while (yDiff > Math.PI) yDiff -= Math.PI * 2;
            while (yDiff < -Math.PI) yDiff += Math.PI * 2;
            rs.wrapper.rotation.y += yDiff * Math.min(1, frameDelta * 14);
          } else if (rs.attackTimer > 0 && (!isStudioMode || isStudioTesting)) {
            // Keep stationary enemy facing the player while swinging in attack range
            const fdx = playerPos.x - pos.x;
            const fdz = playerPos.z - pos.z;
            if (Math.hypot(fdx, fdz) > 0.1) {
              const targetYaw = Math.atan2(fdx, fdz);
              let yDiff = targetYaw - rs.wrapper.rotation.y;
              while (yDiff > Math.PI) yDiff -= Math.PI * 2;
              while (yDiff < -Math.PI) yDiff += Math.PI * 2;
              rs.wrapper.rotation.y += yDiff * Math.min(1, frameDelta * 14);
              rigPart.rotation.y = THREE.MathUtils.radToDeg(rs.wrapper.rotation.y);
            }
          }
        }

        rs.lastPos.copy(pos);
        rs.isMoving = movingNow;
        rs.speedScale = speedScale;
        rs.controller.updateAnimation(frameDelta, time, movingNow, false, 0, rs.damagedTimer > 0, speedScale);

        if (rs.attackTimer > 0) {
          rs.attackTimer = Math.max(0, rs.attackTimer - frameDelta);
          const swing = Math.sin((rs.attackTimer / 0.36) * Math.PI);
          rs.controller.rightArm.rotation.x = -2.1 * swing;
          rs.controller.torso.rotation.y += 0.35 * swing;
        }
      });

      // ==========================================
      // MULTIPLAYER ANIMATION & SYNC LOOP
      // ==========================================
      const nowTs = Date.now();
      otherPlayers.forEach((other, key) => {
        if (!other.isSimulated) {
          // Real cross-window player interpolation
          other.controller.root.position.lerp(other.targetPos, 0.22);
          let diffRot = other.targetRotY - other.controller.root.rotation.y;
          while (diffRot > Math.PI) diffRot -= Math.PI * 2;
          while (diffRot < -Math.PI) diffRot += Math.PI * 2;
          other.controller.root.rotation.y += diffRot * 0.25;

          other.controller.updateAnimation(
            frameDelta,
            time,
            other.isMoving,
            !other.isGrounded,
            other.velocityY,
            false,
            other.speedMultiplier
          );

          if (nowTs - other.lastSeen > 12000) {
            scene.remove(other.controller.root);
            otherPlayers.delete(key);
          }
        } else {
          // Simulated co-players wandering, jumping & exploring the experience
          other.simTimer = (other.simTimer || 0) + frameDelta;
          if (other.simTimer > 4.2 || other.controller.root.position.distanceTo(other.simTarget!) < 1.0) {
            other.simTimer = 0;
            const nearbyParts = partsRef.current.slice(0, 12);
            const chosen = nearbyParts.length ? nearbyParts[Math.floor(Math.random() * nearbyParts.length)] : null;
            if (chosen && Math.random() > 0.35) {
              other.simTarget!.set(chosen.position.x, Math.max(spawnPointRef.current.y, chosen.position.y), chosen.position.z);
            } else {
              const angle = Math.random() * Math.PI * 2;
              const dist = 3.5 + Math.random() * 9;
              other.simTarget!.set(
                spawnPointRef.current.x + Math.cos(angle) * dist,
                spawnPointRef.current.y,
                spawnPointRef.current.z + Math.sin(angle) * dist
              );
            }
          }

          const dir = new THREE.Vector3().subVectors(other.simTarget!, other.controller.root.position);
          dir.y = 0;
          const dist = dir.length();
          if (dist > 0.6) {
            dir.normalize();
            const moveSpeed = 4.2;
            other.controller.root.position.addScaledVector(dir, moveSpeed * frameDelta);
            const targetYaw = Math.atan2(dir.x, dir.z);
            let yDiff = targetYaw - other.controller.root.rotation.y;
            while (yDiff > Math.PI) yDiff -= Math.PI * 2;
            while (yDiff < -Math.PI) yDiff += Math.PI * 2;
            other.controller.root.rotation.y += yDiff * 0.18;
            other.controller.updateAnimation(frameDelta, time, true, false, 0, false, 1.0);
          } else {
            other.controller.updateAnimation(frameDelta, time, false, false, 0, false, 1.0);
          }
        }
      });

      // Broadcast local player movement to peers in real time
      if (broadcastChannel && characterController.root.visible && (!isStudioMode || isStudioTestingRef.current)) {
        if (nowTs - lastBroadcastTime > 60) {
          lastBroadcastTime = nowTs;
          broadcastChannel.postMessage({
            type: 'sync',
            senderId: localPlayerId,
            username: usernameRef.current,
            avatar: avatarRef.current,
            pos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
            rotY: characterController.root.rotation.y,
            isMoving,
            isGrounded,
            velocityY,
            speedMultiplier: horizontalSpeed / 16,
            chatBubble: chatBubbleTextRef.current
          });
        }
      }

      // ==========================================
      // CONTINUOUS SCRIPT EXECUTION WATCHDOG
      // ==========================================
      scriptWatchdogCounter++;
      if (scriptWatchdogCounter % 40 === 0) {
        if (runAllScriptsRef.current) {
          if (luauEngine.getRunningCount() === 0 && (scriptsRef.current?.length > 0 || partsRef.current?.some(p => p.luauScripts?.length || p.script))) {
            runAllScriptsRef.current();
          }
        }
      }

      // Camera Occlusion & Tracking
      const lookTarget = new THREE.Vector3(playerPos.x, playerPos.y + 2.8, playerPos.z);
      const cosPitch = Math.cos(cameraPitch);
      const sinPitch = Math.sin(cameraPitch);
      const camOffsetX = Math.sin(cameraYaw) * cosPitch * cameraDistance;
      const camOffsetY = sinPitch * cameraDistance;
      const camOffsetZ = Math.cos(cameraYaw) * cosPitch * cameraDistance;

      let targetCamPos = new THREE.Vector3(
        lookTarget.x + camOffsetX,
        lookTarget.y + camOffsetY,
        lookTarget.z + camOffsetZ
      );

      const camDir = targetCamPos.clone().sub(lookTarget);
      const maxDist = camDir.length();
      camDir.normalize();

      const camRay = new THREE.Raycaster(lookTarget, camDir, 0.4, maxDist);
      camRay.camera = camera;
      const camIntersects = camRay.intersectObjects(partMeshesList, true).filter(hit => !(hit.object instanceof THREE.Sprite));
      if (camIntersects.length > 0 && camIntersects[0].distance < maxDist - 0.4) {
        targetCamPos = lookTarget.clone().addScaledVector(camDir, Math.max(1.8, camIntersects[0].distance - 0.3));
      }

      camera.position.lerp(targetCamPos, Math.min(1, frameDelta * 14));
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      syncPartsRef.current = null;
      characterControllerRef.current = null;
      activeToolMeshRef.current = null;
      flashlightLightRef.current = null;
      onSwordAttackRef.current = null;
      runAllScriptsRef.current = null;
      luauEngine.stopAll();

      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({ type: 'leave', senderId: localPlayerId });
          broadcastChannel.close();
        } catch (_) {}
      }
      otherPlayers.forEach(p => {
        if (p.bubbleTimeout) clearTimeout(p.bubbleTimeout);
        scene.remove(p.controller.root);
      });
      otherPlayers.clear();
      onOtherChatMessageRef.current = null;
    };
  }, [isStudioMode]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Red damage vignette flash */}
      {showDamageFlash && (
        <div className="absolute inset-0 bg-red-600/35 pointer-events-none transition-opacity duration-150 animate-pulse" />
      )}

      {/* ScreenGui 1: Authentic Roblox Health Bar HUD (Top Right) */}
      {(!isStudioMode || isStudioTesting) && (() => {
        const hpPercent = maxHealth > 0 ? Math.max(0, Math.min(100, (health / maxHealth) * 100)) : 0;
        return (
          <div className="absolute top-16 right-4 z-40 bg-[#111318]/85 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 flex items-center gap-3 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Heart className={`w-4 h-4 ${hpPercent <= 25 ? 'text-red-500 fill-red-500 animate-bounce' : 'text-emerald-400 fill-emerald-400'}`} />
              <span className="font-mono">{Math.round(health)}</span>
              <span className="text-slate-400 font-mono text-[10px]">/ {Math.round(maxHealth)}</span>
            </div>

            <div className="w-28 sm:w-36 h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  hpPercent > 50 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : hpPercent > 25 ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-red-600 to-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-white/10 text-xs font-black text-amber-300 font-mono">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>B$ {userBloxbux}</span>
            </div>
          </div>
        );
      })()}

      {/* ScreenGui: Dynamic In-Game Custom GUIs (ScreenGui, TextLabel, TextButton, Frame) */}
      {(!isStudioMode || isStudioTesting) && screenGuis.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {screenGuis.filter(g => g.visible !== false && ['ScreenGui', 'Frame', 'TextLabel', 'TextButton'].includes(g.className)).map(gui => {
            const isButton = gui.className === 'TextButton';
            return (
              <div
                key={gui.id}
                style={{
                  position: 'absolute',
                  left: gui.position?.x !== undefined ? `${gui.position.x}px` : '24px',
                  top: gui.position?.y !== undefined ? `${gui.position.y}px` : '80px',
                  backgroundColor: gui.backgroundColor || 'rgba(15, 23, 42, 0.88)',
                  color: gui.textColor || '#ffffff',
                  pointerEvents: isButton ? 'auto' : 'none',
                }}
                className={`backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-2 shadow-2xl transition-all ${
                  isButton ? 'cursor-pointer hover:scale-105 active:scale-95 hover:border-[#00a2ff] hover:bg-[#1a2234]' : ''
                }`}
                onClick={isButton ? () => {
                  sounds.playClick();
                  luauEngine.triggerGuiClick(gui.id);
                  if (gui.onClickAction === 'heal') {
                    setHealth(h => Math.min(maxHealthRef.current, h + 30));
                  } else if (gui.onClickAction === 'damage') {
                    setHealth(h => Math.max(0, h - 20));
                  } else if (gui.onClickAction === 'speed') {
                    // speed boost
                  }
                } : undefined}
              >
                <div className="flex items-center gap-2 text-xs">
                  {gui.name && gui.name !== gui.className && (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{gui.name}:</span>
                  )}
                  <span className="font-bold text-white tracking-wide">{gui.text || 'GUI Element'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ScreenGui 2: Authentic Roblox Hotbar / Backpack [1] [2] [3] [4] [5] ... */}
      {(!isStudioMode || isStudioTesting) && (
        <div className="absolute bottom-4 inset-x-0 z-40 flex flex-col items-center gap-1.5 pointer-events-none">
          {equippedTool && (equippedTool.type === 'sword' || (equippedTool.type === 'custom' && /espada|sword|blade|katana/i.test(equippedTool.name))) && (
            <div className="px-2.5 py-0.5 rounded-md bg-rose-950/85 border border-rose-500/40 text-[10px] font-bold text-rose-200 shadow-lg backdrop-blur-sm">
              ⚔️ Clique no inimigo para atacar (-{equippedTool.type === 'sword' ? 25 : 20} HP)
            </div>
          )}
          <div className="bg-[#111318]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-1.5 sm:p-2 shadow-2xl flex items-center gap-1.5 sm:gap-2 pointer-events-auto max-w-[95vw] overflow-x-auto">
            {availableTools.map((tool) => {
              const isEquipped = equippedTool?.id === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    sounds.playClick();
                    setEquippedTool(isEquipped ? null : tool);
                  }}
                  className={`relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isEquipped
                      ? 'bg-gradient-to-b from-blue-600/40 to-blue-900/60 border-blue-400 shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-[#181a24] hover:bg-[#202330] border-white/10 hover:border-white/30 text-white'
                  }`}
                  title={`${tool.name} (Pressione ${tool.slot}) - ${tool.description}`}
                >
                  {/* Slot Number Badge */}
                  <span className="absolute top-1 left-1.5 text-[9px] font-black text-slate-400 font-mono">
                    {tool.slot}
                  </span>

                  {/* Icon */}
                  <span className="text-xl sm:text-2xl transform transition-transform group-hover:scale-110">
                    {tool.icon}
                  </span>

                  {/* Equipped Ring Indicator */}
                  {isEquipped && (
                    <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-[#00a2ff] shadow-sm animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Touch Controls Overlay */}
      {(!isStudioMode || isStudioTesting) && showMobileControls && (
        <MobileControls
          onControlChange={handleMobileControlChange}
          onCameraRotate={handleMobileCameraRotate}
          onUseTool={triggerToolAction}
          equippedToolLabel={equippedTool ? equippedTool.name : null}
        />
      )}

      {/* Roblox Studio 2022 Viewport Overlay: Flight Controls & Gizmo Indicator */}
      {isStudioMode && !isStudioTesting && (
        <>
          {/* Top-Left: Studio Camera Navigation Legend */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none select-none">
            <div className="bg-[#111318]/90 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 shadow-xl max-w-xs space-y-1.5 text-xs text-white">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                <Navigation className="w-3.5 h-3.5" />
                <span>Roblox Studio Viewport</span>
              </div>
              <div className="text-[10px] text-slate-300 space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1c202c] px-1.5 py-0.5 rounded border border-white/10 text-white font-bold">WASD</span>
                  <span>Voar pelo cenário</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#1c202c] px-1.5 py-0.5 rounded border border-white/10 text-white font-bold">Q / E</span>
                  <span>Descer / Subir</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#1c202c] px-1.5 py-0.5 rounded border border-white/10 text-white font-bold">Shift</span>
                  <span>Voo acelerado (65 sps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#1c202c] px-1.5 py-0.5 rounded border border-white/10 text-white font-bold">Botão Direito</span>
                  <span>Girar visão livre</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#1c202c] px-1.5 py-0.5 rounded border border-white/10 text-white font-bold">Clique Esquerdo</span>
                  <span>Selecionar & arrastar setas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Center: Selected Part Axis Transform Badge */}
          {selectedPartCoords && (
            <div className="absolute bottom-4 inset-x-0 z-30 flex justify-center pointer-events-none select-none">
              <div className="bg-[#111318]/95 backdrop-blur-xl border border-[#00a2ff]/50 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center gap-2 text-white pointer-events-auto">
                <div className="flex items-center gap-2 text-xs">
                  <span className="p-1 rounded-md bg-[#00a2ff]/20 text-[#00a2ff] border border-[#00a2ff]/30">
                    <Move className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-bold text-white tracking-wide">{selectedPartCoords.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    Snap: 0.5 studs
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1 bg-[#1a1318] border border-red-500/40 px-2 py-0.5 rounded-lg text-red-300">
                    <span className="font-black text-red-400">X:</span>
                    <span>{selectedPartCoords.x.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#111c16] border border-emerald-500/40 px-2 py-0.5 rounded-lg text-emerald-300">
                    <span className="font-black text-emerald-400">Y:</span>
                    <span>{selectedPartCoords.y.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#111728] border border-blue-500/40 px-2 py-0.5 rounded-lg text-blue-300">
                    <span className="font-black text-blue-400">Z:</span>
                    <span>{selectedPartCoords.z.toFixed(1)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <span>X (Vermelho)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1" />
                  <span>Y (Verde)</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-1" />
                  <span>Z (Azul)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-1" />
                  <span>XZ (Centro)</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
