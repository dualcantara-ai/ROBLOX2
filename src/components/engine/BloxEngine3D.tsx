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
import { Sword, Zap, Compass, Moon, Flashlight, Heart, Coins } from 'lucide-react';

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
  const [health, setHealth] = useState<number>(100);
  const [maxHealth] = useState<number>(100);
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

  // Update avatar textures & clothing in-place without resetting camera or player
  useEffect(() => {
    if (characterControllerRef.current) {
      characterControllerRef.current.updateAppearance(avatar);
    }
  }, [avatar]);

  // References to keep inside render loop without re-triggering effects
  const partsRef = useRef<BloxPart[]>(parts);
  partsRef.current = parts;

  const selectedPartIdRef = useRef<string | null | undefined>(selectedPartId);
  selectedPartIdRef.current = selectedPartId;

  const onSelectPartRef = useRef(onSelectPart);
  onSelectPartRef.current = onSelectPart;

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
    studioTarget: THREE.Vector3;
    playerPos: THREE.Vector3 | null;
    currentVelX: number;
    currentVelZ: number;
    hasSpawned: boolean;
  }>({
    yaw: 0,
    pitch: 0.35,
    distance: 14,
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
    if (syncPartsRef.current) {
      syncPartsRef.current();
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' && !isStudioMode) {
        e.preventDefault();
      }

      // Hotbar Number Keys 1-9 to equip/unequip tools
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const slotNum = parseInt(e.key, 10);
        const targetTool = availableToolsRef.current.find(t => t.slot === slotNum);
        if (targetTool) {
          sounds.playClick();
          setEquippedTool(prev => (prev?.id === targetTool.id ? null : targetTool));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isStudioMode]);

  // Tool activation action (sword swing, cola drink, coil boost, flashlight toggle)
  const triggerToolAction = useCallback(() => {
    const tool = equippedToolRef.current;
    if (!tool) return;

    if (tool.type === 'sword' || tool.type === 'custom') {
      sounds.playJump();
      // Arm slash swing
      if (characterControllerRef.current) {
        const arm = characterControllerRef.current.rightArm;
        arm.rotation.x = -Math.PI / 1.6;
        setTimeout(() => {
          if (characterControllerRef.current) characterControllerRef.current.rightArm.rotation.x = 0;
        }, 180);
      }
    } else if (tool.type === 'cola') {
      sounds.playCoin();
      setHealth(h => Math.min(100, h + 25));
      if (onHealthChangeRef.current) onHealthChangeRef.current(Math.min(100, health + 25));
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
  }, [health]);

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
    const partMeshesList: THREE.Mesh[] = [];

    // Dynamic Physics simulation state for unanchored parts (Anchored = false)
    interface PartPhysicsItem {
      id: string;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      rot: THREE.Vector3;
      size: THREE.Vector3;
      originalPos: THREE.Vector3;
      originalRot: THREE.Vector3;
      isGrounded: boolean;
      anchored: boolean;
      canCollide: boolean;
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
      parentMesh.add(sprite);
    };

    // Build parts in scene
    const syncParts = () => {
      partMeshes.forEach(mesh => scene.remove(mesh));
      partMeshes.clear();
      partMeshesList.length = 0;

      partsRef.current.forEach(part => {
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

        // Attach Textures & Decals if present
        if (part.textures && part.textures.length > 0) {
          part.textures.forEach(tex => {
            attachFaceTexture(mesh, tex, part.size);
          });
        }

        // Attach BillboardGui if present
        if (part.guis && part.guis.length > 0) {
          part.guis.forEach(g => {
            if (g.className === 'BillboardGui') {
              attachBillboardGui(mesh, g, part.size);
            }
          });
        }

        // Add 3D text/sign label if defined
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
      });

      // Initialize dynamic physics state for unanchored parts
      dynamicPartsPhysics.clear();
      partsRef.current.forEach(part => {
        const isAnchored = (part.anchored ?? part.isAnchored) ?? true;
        if (!isAnchored) {
          dynamicPartsPhysics.set(part.id, {
            id: part.id,
            pos: new THREE.Vector3(part.position.x, part.position.y, part.position.z),
            vel: new THREE.Vector3(0, 0, 0),
            rot: new THREE.Vector3(part.rotation.x, part.rotation.y, part.rotation.z),
            size: new THREE.Vector3(part.size.x, part.size.y, part.size.z),
            originalPos: new THREE.Vector3(part.position.x, part.position.y, part.position.z),
            originalRot: new THREE.Vector3(part.rotation.x, part.rotation.y, part.rotation.z),
            isGrounded: false,
            anchored: false,
            canCollide: part.canCollide ?? true
          });
        }
      });
    };

    syncParts();
    syncPartsRef.current = syncParts;

    // Selection Outline Box
    const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x00ffff);
    selectionBox.visible = false;
    scene.add(selectionBox);

    // Player Avatar Character
    const characterController: CharacterMeshController = createBlockyCharacter(avatar);
    scene.add(characterController.root);
    characterControllerRef.current = characterController;

    // Authentic Floating Roblox Name Billboard & Mini Health Bar above Player Head
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 300;
    nameCanvas.height = 80;
    const nCtx = nameCanvas.getContext('2d')!;

    const renderNameTag = (currentHp: number = 100) => {
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

      const hpRatio = Math.max(0, Math.min(1, currentHp / 100));
      nCtx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
      nCtx.beginPath();
      nCtx.roundRect(barX + 1, barY + 1, Math.max(4, (barW - 2) * hpRatio), barH - 2, 4);
      nCtx.fill();
    };

    renderNameTag(health);
    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSpriteMat = new THREE.SpriteMaterial({ map: nameTex, transparent: true });
    const nameSprite = new THREE.Sprite(nameSpriteMat);
    nameSprite.scale.set(3.4, 0.9, 1);
    nameSprite.position.set(0, 6.2, 0);
    characterController.root.add(nameSprite);

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
    characterController.root.add(bubbleSprite);

    // Dynamic Tool Hand Attachment
    const updateHandToolMesh = (tool: RuntimeTool | null) => {
      if (activeToolMeshRef.current) {
        characterController.rightArm.remove(activeToolMeshRef.current);
        activeToolMeshRef.current = null;
        flashlightLightRef.current = null;
      }

      if (!tool) return;

      const toolGroup = new THREE.Group();

      if (tool.type === 'sword') {
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
    let canDoubleJump = false;
    let hasDoubleJumped = false;
    let speedBoostTimer = 0;
    let invulnerabilityTimer = 0;

    let cameraYaw = persistentCameraState.current.yaw;
    let cameraPitch = persistentCameraState.current.pitch;
    let cameraDistance = persistentCameraState.current.distance;
    const studioCamTarget = persistentCameraState.current.studioTarget.clone();

    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let wasTesting = isStudioTestingRef.current;

    // Mouse Controls
    const onMouseDown = (e: MouseEvent) => {
      // If right click or middle click or in studio: camera drag
      if (e.button === 2 || e.button === 1 || isStudioMode) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // If left click: trigger tool action & click detectors
      if (e.button === 0) {
        triggerToolAction();

        // Raycast for ClickDetectors & ProximityPrompts
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(partMeshesList);
        if (hits.length > 0) {
          const hitPart = hits[0].object;
          const pid = hitPart.userData?.partId;
          if (pid) {
            luauEngine.triggerClick(pid, { Name: usernameRef.current, Position: playerPos });
          }
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraYaw -= dx * 0.006;
      cameraPitch = Math.max(-0.2, Math.min(1.4, cameraPitch + dy * 0.006));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      cameraDistance = Math.max(2, Math.min(120, cameraDistance + e.deltaY * 0.02));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel);

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

      if (onHealthChangeRef.current) {
        onHealthChangeRef.current(0);
        setTimeout(() => {
          if (onHealthChangeRef.current) onHealthChangeRef.current(100);
        }, 400);
      }

      playerPos.set(
        checkpointRef.current.x,
        checkpointRef.current.y + 0.1,
        checkpointRef.current.z
      );
      velocityX = 0;
      velocityZ = 0;
      velocityY = 0;
      isGrounded = true;
      characterController.root.position.copy(playerPos);
      invulnerabilityTimer = 1.2;

      dynamicPartsPhysics.forEach(item => {
        item.pos.copy(item.originalPos);
        item.rot.copy(item.originalRot);
        item.vel.set(0, 0, 0);
      });
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
            }
          }
        });
      });
    };

    // Sub-stepped Physics Step function for unanchored parts
    const simulatePhysicsStep = (subDt: number, moveDirX = 0, moveDirZ = 0, playerWalkingSpeed = 0) => {
      if (dynamicPartsPhysics.size === 0) return;

      dynamicPartsPhysics.forEach((item) => {
        item.vel.y -= 32 * subDt;
        item.vel.x *= Math.pow(0.95, subDt * 60);
        item.vel.z *= Math.pow(0.95, subDt * 60);

        item.pos.x += item.vel.x * subDt;
        item.pos.y += item.vel.y * subDt;
        item.pos.z += item.vel.z * subDt;

        item.rot.x += item.vel.z * subDt * 20;
        item.rot.z -= item.vel.x * subDt * 20;

        // Solid parts collision for dynamic unanchored parts
        if (item.canCollide) {
          const halfY = item.size.y / 2;
          const halfX = item.size.x / 2;
          const halfZ = item.size.z / 2;

          // Baseplate collision at Y = 0
          if (item.pos.y - halfY <= 0) {
            item.pos.y = halfY;
            if (item.vel.y < 0) {
              item.vel.y = -item.vel.y * 0.15;
              if (Math.abs(item.vel.y) < 0.3) item.vel.y = 0;
            }
            item.vel.x *= 0.85;
            item.vel.z *= 0.85;
            item.isGrounded = true;
          }

          // Static platforms and solid objects collision
          for (const sp of partsRef.current) {
            if (sp.id === item.id) continue;
            const isSpAnchored = (sp.anchored ?? sp.isAnchored) ?? true;
            if (!isSpAnchored || sp.canCollide === false || sp.type === 'coin') continue;

            const spHalfX = sp.size.x / 2;
            const spHalfY = sp.size.y / 2;
            const spHalfZ = sp.size.z / 2;

            const dx = item.pos.x - sp.position.x;
            const dy = item.pos.y - sp.position.y;
            const dz = item.pos.z - sp.position.z;

            const overlapX = (halfX + spHalfX) - Math.abs(dx);
            const overlapY = (halfY + spHalfY) - Math.abs(dy);
            const overlapZ = (halfZ + spHalfZ) - Math.abs(dz);

            if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
              if (overlapY <= overlapX && overlapY <= overlapZ) {
                if (dy > 0) {
                  item.pos.y = sp.position.y + spHalfY + halfY;
                  if (item.vel.y < 0) item.vel.y = 0;
                  item.vel.x *= 0.88;
                  item.vel.z *= 0.88;
                  item.isGrounded = true;
                } else {
                  item.pos.y = sp.position.y - spHalfY - halfY;
                  if (item.vel.y > 0) item.vel.y = 0;
                }
              } else if (overlapX <= overlapZ) {
                item.pos.x = sp.position.x + (dx > 0 ? spHalfX + halfX : -spHalfX - halfX);
                item.vel.x = 0;
              } else {
                item.pos.z = sp.position.z + (dz > 0 ? spHalfZ + halfZ : -spHalfZ - halfZ);
                item.vel.z = 0;
              }
            }
          }
        }

        // Void recovery
        if (item.pos.y < -35) {
          item.pos.copy(item.originalPos);
          item.rot.copy(item.originalRot);
          item.vel.set(0, 0, 0);
        }
      });

      // Player push physics parts
      if (characterController.root.visible) {
        const playerColliders = characterController.getPlayerColliderBoxes();
        dynamicPartsPhysics.forEach((item) => {
          if (!item.canCollide) return;

          playerColliders.forEach((pBox) => {
            const dx = item.pos.x - pBox.center.x;
            const px = (item.size.x + pBox.size.x) / 2 - Math.abs(dx);
            if (px <= 0) return;

            const dy = item.pos.y - pBox.center.y;
            const py = (item.size.y + pBox.size.y) / 2 - Math.abs(dy);
            if (py <= 0) return;

            const dz = item.pos.z - pBox.center.z;
            const pz = (item.size.z + pBox.size.z) / 2 - Math.abs(dz);
            if (pz <= 0) return;

            const partTop = item.pos.y + item.size.y / 2;
            if (playerPos.y >= partTop - 0.4 && playerPos.y <= partTop + 1.2 && velocityY <= 0) {
              playerPos.y = partTop;
              velocityY = 0;
              isGrounded = true;
              item.vel.y -= 2 * subDt;
            } else {
              const pushMag = playerWalkingSpeed > 0 ? playerWalkingSpeed : 8;
              const signX = dx >= 0 ? 1 : -1;
              const signZ = dz >= 0 ? 1 : -1;
              const dirX = Math.abs(moveDirX) > 0.1 ? moveDirX : signX;
              const dirZ = Math.abs(moveDirZ) > 0.1 ? moveDirZ : signZ;

              item.vel.x += dirX * pushMag * 0.7;
              item.vel.z += dirZ * pushMag * 0.7;
              item.pos.x += dirX * 0.06;
              item.pos.z += dirZ * 0.06;
            }
          });
        });
      }

      dynamicPartsPhysics.forEach((item, id) => {
        const mesh = partMeshes.get(id);
        if (mesh) {
          mesh.position.copy(item.pos);
          mesh.rotation.x = THREE.MathUtils.degToRad(item.rot.x);
          mesh.rotation.y = THREE.MathUtils.degToRad(item.rot.y);
          mesh.rotation.z = THREE.MathUtils.degToRad(item.rot.z);
        }
      });
    };

    // Auto-run Luau scripts when playing or testing
    const runAllScripts = () => {
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
            onUpdatePart: (partId, partial) => {
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
              if (onUpdatePartRef.current) {
                onUpdatePartRef.current(partId, partial);
              }
            },
            onAddPart: (newPart) => {
              partsRef.current = [...partsRef.current, newPart];
              if (syncPartsRef.current) syncPartsRef.current();
            },
            onRemovePart: (partId) => {
              partsRef.current = partsRef.current.filter(p => p.id !== partId);
              if (syncPartsRef.current) syncPartsRef.current();
            },
            onLog: (entry) => {
              console.log(`[Luau: ${entry.scriptName}]`, entry.message);
            },
            getPlayer: () => ({
              position: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
              takeDamage: (dmg) => {
                setHealth(h => {
                  const next = Math.max(0, h - dmg);
                  if (next <= 0) respawn();
                  return next;
                });
                setShowDamageFlash(true);
                sounds.playOof();
                setTimeout(() => setShowDamageFlash(false), 300);
              },
              heal: (amt) => setHealth(h => Math.min(100, h + amt)),
              setSpeed: () => { speedBoostTimer = 4.0; },
              setJumpPower: (jp) => { velocityY = jp; isGrounded = false; },
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
        if (isStudioTestingRef.current) {
          playerPos.set(spawnPointRef.current.x, spawnPointRef.current.y, spawnPointRef.current.z);
          velocityX = 0;
          velocityZ = 0;
          velocityY = 0;
          characterController.root.position.copy(playerPos);
        } else {
          studioCamTarget.set(playerPos.x, playerPos.y + 1, playerPos.z);
        }
        // Keep scripts always executing continuously
        runAllScripts();
      }

      const frameDelta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      // Update equipped tool model if tool state changed
      updateHandToolMesh(equippedToolRef.current);

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
      persistentCameraState.current.studioTarget.copy(studioCamTarget);
      if (characterController.root.visible) {
        if (!persistentCameraState.current.playerPos) {
          persistentCameraState.current.playerPos = new THREE.Vector3();
        }
        persistentCameraState.current.playerPos.copy(playerPos);
        persistentCameraState.current.currentVelX = velocityX;
        persistentCameraState.current.currentVelZ = velocityZ;
      }

      // Studio non-testing mode: Orbit Camera only
      if (isStudioMode && !isStudioTestingRef.current) {
        camera.position.x = studioCamTarget.x + Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance;
        camera.position.y = studioCamTarget.y + Math.sin(cameraPitch) * cameraDistance;
        camera.position.z = studioCamTarget.z + Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance;
        camera.lookAt(studioCamTarget);
        characterController.root.visible = false;

        if (isPhysicsRunningRef.current) {
          simulatePhysicsStep(frameDelta);
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

      // Tool Speed Bonus or Pass Speed Bonus
      let targetSpeed = 16;
      if (touch.sprint || keys['shift']) targetSpeed = 24;
      if (activePassesRef.current.includes('speed_coil') || equippedToolRef.current?.type === 'speed_coil') {
        targetSpeed = 32;
      }
      if (speedBoostTimer > 0) {
        speedBoostTimer -= frameDelta;
        targetSpeed = 36;
      }

      const forwardDirX = -Math.sin(cameraYaw);
      const forwardDirZ = -Math.cos(cameraYaw);
      const rightDirX = Math.cos(cameraYaw);
      const rightDirZ = -Math.sin(cameraYaw);

      const targetDirX = forwardDirX * moveForward + rightDirX * moveRight;
      const targetDirZ = forwardDirZ * moveForward + rightDirZ * moveRight;

      const targetVelX = targetDirX * targetSpeed;
      const targetVelZ = targetDirZ * targetSpeed;

      const accel = isGrounded ? 50 : 20;
      velocityX = THREE.MathUtils.lerp(velocityX, targetVelX, Math.min(1, frameDelta * accel));
      velocityZ = THREE.MathUtils.lerp(velocityZ, targetVelZ, Math.min(1, frameDelta * accel));

      if (!hasInput && Math.hypot(velocityX, velocityZ) < 0.2 && isGrounded) {
        velocityX = 0;
        velocityZ = 0;
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

      // Jump Logic (supports Gravity Coil tool & Gravity pass)
      const wantJump = keys[' '] || touch.jump;
      let jumpForce = 16.5;
      if (activePassesRef.current.includes('gravity_coil') || equippedToolRef.current?.type === 'gravity_coil') {
        jumpForce = 25;
      }

      if (wantJump && isGrounded) {
        velocityY = jumpForce;
        isGrounded = false;
        canDoubleJump = activePassesRef.current.includes('double_jump');
        hasDoubleJumped = false;
        sounds.playJump();
      } else if (wantJump && !isGrounded && canDoubleJump && !hasDoubleJumped && velocityY < 8) {
        velocityY = jumpForce * 0.95;
        hasDoubleJumped = true;
        sounds.playBoost();
      }

      const isLowGravity = activePassesRef.current.includes('gravity_coil') || equippedToolRef.current?.type === 'gravity_coil';
      const gravity = isLowGravity ? -22 : -48;

      if (invulnerabilityTimer > 0) {
        invulnerabilityTimer -= frameDelta;
      }

      // -------------------------------------------------------------
      // 4-SUBSTEP HIGH-PRECISION CONTINUOUS KINEMATIC COLLISION ENGINE
      // -------------------------------------------------------------
      const subSteps = 4;
      const subDt = frameDelta / subSteps;
      const playerRadius = 0.75;
      const playerHeight = 5.2;
      const maxStepHeight = 1.2;

      const solidParts = partsRef.current.filter(p => {
        if (p.canCollide === false) return false;
        if (p.type === 'coin') return false;
        return true;
      });

      for (let step = 0; step < subSteps; step++) {
        velocityY += gravity * subDt;
        if (velocityY < -70) velocityY = -70;

        // 1. Horizontal swept cylinder-box collision with smooth wall sliding
        let stepX = playerPos.x + velocityX * subDt;
        let stepZ = playerPos.z + velocityZ * subDt;

        for (const part of solidParts) {
          if (part.type === 'killbrick') continue;
          const partPos = dynamicPartsPhysics.get(part.id)?.pos || part.position;
          const halfX = part.size.x / 2 + playerRadius;
          const halfZ = part.size.z / 2 + playerRadius;
          const partTop = partPos.y + part.size.y / 2;
          const partBottom = partPos.y - part.size.y / 2;

          const isWall = (playerPos.y + maxStepHeight < partTop) && (playerPos.y + playerHeight > partBottom);
          if (!isWall) continue;

          const dx = stepX - partPos.x;
          const dz = stepZ - partPos.z;
          const overlapX = halfX - Math.abs(dx);
          const overlapZ = halfZ - Math.abs(dz);

          if (overlapX > 0 && overlapZ > 0) {
            if (overlapX < overlapZ) {
              stepX = partPos.x + (dx > 0 ? halfX : -halfX);
              velocityX = 0;
            } else {
              stepZ = partPos.z + (dz > 0 ? halfZ : -halfZ);
              velocityZ = 0;
            }
          }
        }

        playerPos.x = stepX;
        playerPos.z = stepZ;

        // 2. Vertical continuous ground landing with swept-interval detection
        const prevY = playerPos.y;
        const candY = prevY + velocityY * subDt;
        let highestGroundY = -Infinity;

        // Solid Baseplate at Y = 0
        if (prevY >= -0.1 && candY <= 0) {
          highestGroundY = 0;
        }

        // Check platforms beneath player footprint
        for (const part of solidParts) {
          if (part.type === 'killbrick') continue;
          const partPos = dynamicPartsPhysics.get(part.id)?.pos || part.position;
          const partHalfX = part.size.x / 2 + 0.65;
          const partHalfZ = part.size.z / 2 + 0.65;
          const partTop = partPos.y + part.size.y / 2;

          const isOverFootprint = (
            playerPos.x >= partPos.x - partHalfX &&
            playerPos.x <= partPos.x + partHalfX &&
            playerPos.z >= partPos.z - partHalfZ &&
            playerPos.z <= partPos.z + partHalfZ
          );

          if (isOverFootprint) {
            let effectiveTop = partTop;
            if (part.type === 'wedge') {
              const relZ = (playerPos.z - (partPos.z - part.size.z / 2)) / part.size.z;
              effectiveTop = (partPos.y - part.size.y / 2) + Math.max(0, Math.min(1, relZ)) * part.size.y;
            }

            // Continuous interval check prevents tunneling even at terminal fall speeds
            const crossedSurface = (prevY >= effectiveTop - maxStepHeight - 0.1) && (candY <= effectiveTop || (isGrounded && Math.abs(prevY - effectiveTop) <= maxStepHeight));
            if (crossedSurface && effectiveTop > highestGroundY) {
              highestGroundY = effectiveTop;
            }
          }
        }

        // Check ceiling collision above player head when jumping / moving up
        let cappedCandY = candY;
        if (velocityY > 0) {
          for (const part of solidParts) {
            if (part.type === 'killbrick') continue;
            const partPos = dynamicPartsPhysics.get(part.id)?.pos || part.position;
            const partHalfX = part.size.x / 2 + 0.5;
            const partHalfZ = part.size.z / 2 + 0.5;
            const partBottom = partPos.y - part.size.y / 2;

            const isUnderCeiling = (
              playerPos.x >= partPos.x - partHalfX &&
              playerPos.x <= partPos.x + partHalfX &&
              playerPos.z >= partPos.z - partHalfZ &&
              playerPos.z <= partPos.z + partHalfZ
            );

            if (isUnderCeiling) {
              const headY = candY + playerHeight;
              const prevHeadY = prevY + playerHeight;
              if (prevHeadY <= partBottom + 0.25 && headY >= partBottom) {
                cappedCandY = Math.min(cappedCandY, partBottom - playerHeight);
                velocityY = 0;
                break;
              }
            }
          }
        }

        if (highestGroundY > -Infinity) {
          playerPos.y = highestGroundY;
          velocityY = 0;
          isGrounded = true;
        } else {
          playerPos.y = cappedCandY;
          isGrounded = false;
        }

        // Physics step for dynamic unanchored parts
        simulatePhysicsStep(subDt, velocityX, velocityZ, horizontalSpeed);
        solveWeldConstraints();
      }

      // Void death
      if (playerPos.y < -45) {
        respawn();
      }

      // 3. Interactive Parts & Gameplay Mechanics
      partsRef.current.forEach(part => {
        const partPos = dynamicPartsPhysics.get(part.id)?.pos || part.position;
        const partTop = partPos.y + part.size.y / 2;
        const partBottom = partPos.y - part.size.y / 2;
        const halfX = part.size.x / 2 + 0.4;
        const halfZ = part.size.z / 2 + 0.4;

        const inX = playerPos.x >= partPos.x - halfX && playerPos.x <= partPos.x + halfX;
        const inZ = playerPos.z >= partPos.z - halfZ && playerPos.z <= partPos.z + halfZ;
        const inY = (playerPos.y + 4.8 >= partBottom) && (playerPos.y <= partTop + 0.4);

        if (inX && inZ && inY) {
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
            Heal: (amt: number) => {
              setHealth(h => Math.min(100, h + amt));
            },
            get Health() { return health; },
            set Health(v: number) {
              setHealth(Math.max(0, Math.min(100, v)));
              if (v <= 0) respawn();
            },
            MaxHealth: 100,
            get WalkSpeed() { return targetSpeed; },
            set WalkSpeed(_spd: number) { speedBoostTimer = 4.0; },
            get JumpPower() { return jumpForce; },
            set JumpPower(jp: number) {
              if (velocityY <= 0) {
                velocityY = Math.max(20, Number(jp));
                isGrounded = false;
                sounds.playBoost();
              }
            },
            AddCoins: (amt: number) => {
              if (onCoinCollectedRef.current) onCoinCollectedRef.current(amt);
              sounds.playCoin();
            }
          };

          const parentProxy = {
            Name: usernameRef.current,
            Humanoid: humanoidObj,
            HumanoidRootPart: { Position: playerPos },
            FindFirstChild: (childName: string) => {
              const lower = String(childName).toLowerCase();
              if (lower === 'humanoid') return humanoidObj;
              if (lower === 'humanoidrootpart') return { Position: playerPos };
              return null;
            },
            FindFirstChildWhichIsA: (cName: string) => {
              if (String(cName).toLowerCase() === 'humanoid') return humanoidObj;
              return null;
            },
            FindFirstChildOfClass: (cName: string) => {
              if (String(cName).toLowerCase() === 'humanoid') return humanoidObj;
              return null;
            }
          };

          // Trigger Touched in Luau
          luauEngine.triggerTouch(part.id, {
            Name: 'HumanoidRootPart',
            Parent: parentProxy,
            Position: playerPos
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
            return;
          }

          // Bounce pad
          if (part.type === 'bouncepad' && velocityY <= 0) {
            velocityY = 28;
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
      });

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
      const camIntersects = camRay.intersectObjects(partMeshesList, false);
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
      runAllScriptsRef.current = null;
      luauEngine.stopAll();
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
      {(!isStudioMode || isStudioTesting) && (
        <div className="absolute top-16 right-4 z-40 bg-[#111318]/85 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 flex items-center gap-3 shadow-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Heart className={`w-4 h-4 ${health <= 25 ? 'text-red-500 fill-red-500 animate-bounce' : 'text-emerald-400 fill-emerald-400'}`} />
            <span className="font-mono">{Math.round(health)}</span>
            <span className="text-slate-400 font-mono text-[10px]">/ 100</span>
          </div>

          <div className="w-28 sm:w-36 h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-200 ${
                health > 50 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : health > 25 ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-red-600 to-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
            />
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-white/10 text-xs font-black text-amber-300 font-mono">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>B$ {userBloxbux}</span>
          </div>
        </div>
      )}

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
                    setHealth(h => Math.min(100, h + 30));
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
        <div className="absolute bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none">
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
        />
      )}
    </div>
  );
};
