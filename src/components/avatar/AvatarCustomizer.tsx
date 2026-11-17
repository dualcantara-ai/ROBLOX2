import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Sparkles, 
  RotateCw, 
  Palette, 
  Shirt, 
  Sliders, 
  Save, 
  Check, 
  Smile, 
  Crown,
  Sword,
  Wand2,
  Lock,
  Mail,
  RotateCcw,
  User,
  Layers,
  ChevronRight
} from 'lucide-react';
import { AvatarAppearance, ShopItem } from '../../types';
import { createBlockyCharacter, CharacterMeshController } from '../engine/character3D';
import { sounds } from '../../services/soundEffects';

interface AvatarCustomizerProps {
  avatar: AvatarAppearance;
  inventoryItems: ShopItem[];
  onSaveAvatar: (newAvatar: AvatarAppearance) => void;
  isGuest?: boolean;
  onOpenAuthModal?: () => void;
}

// Authentic 2022 Roblox BrickColors
const ROBLOX_BRICK_COLORS = [
  { name: 'Bright Yellow', hex: '#f5cd30' },
  { name: 'Bright Blue', hex: '#0d69ac' },
  { name: 'Dark Green', hex: '#287f46' },
  { name: 'Bright Red', hex: '#c4281c' },
  { name: 'Black', hex: '#1b2a35' },
  { name: 'White', hex: '#f2f3f3' },
  { name: 'Medium Stone Grey', hex: '#a1a5a2' },
  { name: 'Dark Stone Grey', hex: '#635f62' },
  { name: 'Nougat', hex: '#d7c59a' },
  { name: 'Light Orange', hex: '#eab175' },
  { name: 'Bright Orange', hex: '#da8541' },
  { name: 'Brick Yellow', hex: '#d7c599' },
  { name: 'Sand Red', hex: '#957977' },
  { name: 'Pastel Blue', hex: '#80bbdb' },
  { name: 'Pastel Light Blue', hex: '#afddfe' },
  { name: 'Bright Violet', hex: '#6b327c' },
  { name: 'Royal Purple', hex: '#441d6a' },
  { name: 'Br. Yellowish Green', hex: '#a4bd47' },
  { name: 'Earth Green', hex: '#27462d' },
  { name: 'Olive', hex: '#69744b' },
  { name: 'Cyan / Teal', hex: '#00a2ff' },
  { name: 'Deep Blue', hex: '#2032b0' },
  { name: 'Bright Bluish Green', hex: '#008f9c' },
  { name: 'Cool Yellow', hex: '#fdf38c' },
  { name: 'Pastel Yellow', hex: '#fffaa5' },
  { name: 'Crimson', hex: '#970000' },
  { name: 'Hot Pink', hex: '#ff66cc' },
  { name: 'Baby Pink', hex: '#f3c9dd' },
  { name: 'Brown', hex: '#694027' },
  { name: 'Dark Orange', hex: '#a05f35' },
  { name: 'Khaki', hex: '#8a764e' },
  { name: 'Flame Yellowish Orange', hex: '#f3a927' },
];

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  avatar,
  inventoryItems,
  onSaveAvatar,
  isGuest = false,
  onOpenAuthModal
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<AvatarAppearance>(avatar);
  const [selectedLimb, setSelectedLimb] = useState<'all' | 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg'>('all');
  const [activeTab, setActiveTab] = useState<'skin' | 'clothing' | 'gears' | 'scale' | 'animations'>('skin');
  const [avatarType, setAvatarType] = useState<'R6' | 'R15'>('R6');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CharacterMeshController | null>(null);

  // 3D Avatar Preview Viewport setup
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x191b1d);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2022 Roblox Studio stage lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.3);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00a2ff, 0.7);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // 2022 Circular pedestal platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.5, metalness: 0.1 })
    );
    platform.position.y = -0.15;
    platform.receiveShadow = true;
    scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.04, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0x393b3d })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Character Mesh
    const controller = createBlockyCharacter(currentAvatar);
    controllerRef.current = controller;
    scene.add(controller.root);

    let isDragging = false;
    let prevMouseX = 0;
    let avatarAngle = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      avatarAngle += dx * 0.01;
      controller.root.rotation.y = avatarAngle;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => { isDragging = false; };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      controller.updateAnimation(delta, time, false, false);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update appearance in real-time when currentAvatar changes
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateAppearance(currentAvatar);
    }
  }, [currentAvatar]);

  const handleColorChange = (hex: string) => {
    if (isGuest) {
      sounds.playClick();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    sounds.playClick();
    if (selectedLimb === 'all') {
      setCurrentAvatar(prev => ({
        ...prev,
        bodyColors: {
          head: hex,
          torso: hex,
          leftArm: hex,
          rightArm: hex,
          leftLeg: hex,
          rightLeg: hex
        }
      }));
    } else {
      setCurrentAvatar(prev => ({
        ...prev,
        bodyColors: {
          ...prev.bodyColors,
          [selectedLimb]: hex
        }
      }));
    }
  };

  const handleResetToClassicNoob = () => {
    sounds.playClick();
    setCurrentAvatar({
      bodyColors: {
        head: '#f5cd30',
        torso: '#0d69ac',
        leftArm: '#f5cd30',
        rightArm: '#f5cd30',
        leftLeg: '#287f46',
        rightLeg: '#287f46'
      },
      equippedHat: undefined,
      equippedFace: undefined,
      equippedGear: undefined,
      scale: { width: 1.0, height: 1.0, head: 1.0 },
      animation: 'idle'
    });
  };

  const handleSave = () => {
    if (isGuest) {
      sounds.playClick();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    sounds.playPurchase();
    onSaveAvatar(currentAvatar);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 select-none space-y-6 bg-[#111216] min-h-screen text-white">
      {/* 2022 Roblox Avatar Editor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#232527] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Editor de Avatar
            </h1>
            <span className="bg-[#232527] text-[#999999] text-[11px] font-bold px-2 py-0.5 rounded border border-[#333537]">
              Roblox 2022
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#888888] mt-0.5">
            {isGuest 
              ? 'Visitantes usam o visual clássico do Noob (amarelo, azul e verde). Entre com seu email para personalizar!'
              : 'Personalize o visual do seu personagem no Roblox. Escolha cores, itens, tipos de avatar (R6/R15) e animações.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleResetToClassicNoob}
            className="flex items-center justify-center gap-1.5 bg-[#191b1d] hover:bg-[#232527] text-[#aaaaaa] hover:text-white px-3.5 py-2.5 rounded-lg text-xs font-bold border border-[#232527] transition-all cursor-pointer"
            title="Redefinir para o clássico Noob"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redefinir</span>
          </button>

          {isGuest ? (
            <button
              onClick={() => {
                sounds.playClick();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Bloqueado (Visitante)</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00b06f] hover:bg-[#00c87d] text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? 'Avatar Salvo!' : 'Salvar Alterações'}
            </button>
          )}
        </div>
      </div>

      {/* Guest Warning Banner */}
      {isGuest && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-amber-300">
                Modo Visitante Ativo
              </h3>
              <p className="text-xs text-[#cccccc]">
                Visitantes utilizam o avatar Noob clássico. Para salvar customizações permanentes no servidor, faça login com seu email.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenAuthModal) onOpenAuthModal();
            }}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#00a2ff] hover:bg-[#0090e0] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>Fazer Login</span>
          </button>
        </div>
      )}

      {/* Main Grid: 3D Viewport on Left, 2022 Customizer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Avatar Preview (5 cols) */}
        <div className="lg:col-span-5 bg-[#191b1d] border border-[#232527] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[460px] sm:h-[540px] relative">
          <div ref={previewContainerRef} className="w-full h-full cursor-ew-resize" />

          {/* 2022 Top overlay: 360 notice and R6 / R15 Switch */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-[#aaaaaa] flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 text-[#00a2ff]" />
              Arraste para girar 360°
            </div>

            {/* Authentic 2022 R6 / R15 Toggle Switch */}
            <div className="pointer-events-auto bg-[#111216]/90 backdrop-blur-md p-1 rounded-lg border border-[#232527] flex items-center gap-1 shadow-lg">
              <span className="text-[10px] font-bold text-[#888888] px-1 hidden sm:inline">Tipo:</span>
              <button
                onClick={() => { sounds.playClick(); setAvatarType('R6'); }}
                className={`px-2.5 py-1 rounded text-[11px] font-black transition-all cursor-pointer ${
                  avatarType === 'R6'
                    ? 'bg-white text-black shadow'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                R6
              </button>
              <button
                onClick={() => { sounds.playClick(); setAvatarType('R15'); }}
                className={`px-2.5 py-1 rounded text-[11px] font-black transition-all cursor-pointer ${
                  avatarType === 'R15'
                    ? 'bg-white text-black shadow'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                R15
              </button>
            </div>
          </div>

          {/* Quick Animation Emotes Bar */}
          <div className="absolute bottom-3 inset-x-3 bg-[#111216]/85 backdrop-blur-md p-1.5 rounded-lg border border-[#232527] flex items-center justify-around">
            {[
              { id: 'idle', label: 'Padrão' },
              { id: 'dance', label: '/e dance' },
              { id: 'wave', label: '/e wave' }
            ].map(anim => (
              <button
                key={anim.id}
                onClick={() => {
                  sounds.playClick();
                  setCurrentAvatar(prev => ({ ...prev, animation: anim.id as any }));
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currentAvatar.animation === anim.id
                    ? 'bg-[#00a2ff] text-white shadow'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customization Tabs & Controls (7 cols) */}
        <div className="lg:col-span-7 bg-[#191b1d] border border-[#232527] rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-6">
          {/* 2022 Roblox Avatar Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#232527] pb-3 overflow-x-auto scrollbar-none">
            {[
              { id: 'skin', label: 'Tom de Pele', icon: Palette },
              { id: 'clothing', label: 'Roupas & Rostos', icon: Shirt },
              { id: 'gears', label: 'Equipamentos', icon: Sword },
              { id: 'scale', label: 'Proporções & Escala', icon: Sliders }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { sounds.playClick(); setActiveTab(tab.id as any); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-black shadow-md'
                      : 'text-[#888888] hover:text-white hover:bg-[#232527]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: SKIN TONE & LIMBS */}
          {activeTab === 'skin' && (
            <div className="space-y-5">
              {/* Authentic Limb Selector (Pintura de Membros) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#aaaaaa] uppercase tracking-wider">
                    Membro para Colorir
                  </label>
                  <span className="text-[11px] text-[#777777]">Paleta Clássica BrickColors</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                  {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'head', label: 'Cabeça' },
                    { id: 'torso', label: 'Tronco' },
                    { id: 'leftArm', label: 'Braço E.' },
                    { id: 'rightArm', label: 'Braço D.' },
                    { id: 'leftLeg', label: 'Perna E.' },
                    { id: 'rightLeg', label: 'Perna D.' }
                  ].map(limb => (
                    <button
                      key={limb.id}
                      onClick={() => { sounds.playClick(); setSelectedLimb(limb.id as any); }}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedLimb === limb.id
                          ? 'bg-[#00a2ff] text-white shadow'
                          : 'bg-[#111216] text-[#888888] hover:text-white hover:bg-[#232527] border border-[#232527]'
                      }`}
                    >
                      {limb.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 32 Official Roblox BrickColors Grid */}
              <div>
                <label className="text-xs font-bold text-[#aaaaaa] uppercase tracking-wider block mb-2.5">
                  Cores Oficiais Roblox
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-1 pr-2">
                  {ROBLOX_BRICK_COLORS.map(c => {
                    const activeColor = selectedLimb === 'all' 
                      ? currentAvatar.bodyColors.torso 
                      : (currentAvatar.bodyColors as any)[selectedLimb];
                    const isSelected = activeColor === c.hex;

                    return (
                      <button
                        key={c.hex}
                        onClick={() => handleColorChange(c.hex)}
                        className={`h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                          isSelected 
                            ? 'scale-105 border-white ring-2 ring-[#00a2ff] shadow-md' 
                            : 'border-white/10 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name} (${c.hex})`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-black drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLOTHING & FACES */}
          {activeTab === 'clothing' && (
            <div className="space-y-5">
              {/* Hats */}
              <div>
                <span className="text-xs font-bold text-[#aaaaaa] uppercase tracking-wider block mb-2">
                  Chapéus Equipados
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedHat: undefined })); }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      !currentAvatar.equippedHat 
                        ? 'bg-[#00a2ff]/15 border-[#00a2ff] text-white' 
                        : 'bg-[#111216] border-[#232527] text-[#888888] hover:text-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚫</div>
                    <span className="text-xs font-bold block">Nenhum Chapéu</span>
                  </button>

                  {inventoryItems.filter(i => i.category === 'hat').map(item => {
                    const isEquipped = currentAvatar.equippedHat === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedHat: item.id })); }}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isEquipped 
                            ? 'bg-[#00a2ff]/15 border-[#00a2ff] text-white shadow-md' 
                            : 'bg-[#111216] border-[#232527] text-[#cccccc] hover:border-[#444]'
                        }`}
                      >
                        <div className="text-2xl mb-1">{item.thumbnail}</div>
                        <span className="text-xs font-bold block truncate">{item.name}</span>
                        {isEquipped && <span className="text-[10px] text-[#00a2ff] font-black uppercase">Equipado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Faces */}
              <div>
                <span className="text-xs font-bold text-[#aaaaaa] uppercase tracking-wider block mb-2">
                  Expressões & Rostos
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {inventoryItems.filter(i => i.category === 'face').map(face => {
                    const isEquipped = currentAvatar.equippedFace === face.id;
                    return (
                      <button
                        key={face.id}
                        onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedFace: face.id })); }}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isEquipped 
                            ? 'bg-[#00a2ff]/15 border-[#00a2ff] text-white' 
                            : 'bg-[#111216] border-[#232527] text-[#cccccc] hover:border-[#444]'
                        }`}
                      >
                        <div className="text-2xl mb-1">{face.thumbnail}</div>
                        <span className="text-xs font-bold block truncate">{face.name}</span>
                        {isEquipped && <span className="text-[10px] text-[#00a2ff] font-black uppercase">Equipado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GEARS & ITEMS */}
          {activeTab === 'gears' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#aaaaaa] uppercase tracking-wider block mb-2">
                Equipamentos de Mão (Gears)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedGear: undefined })); }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    !currentAvatar.equippedGear 
                      ? 'bg-[#00a2ff]/15 border-[#00a2ff] text-white' 
                      : 'bg-[#111216] border-[#232527] text-[#888888] hover:text-white'
                  }`}
                >
                  <div className="text-2xl mb-1">🚫</div>
                  <span className="text-xs font-bold block">Nenhum Item</span>
                </button>

                {inventoryItems.filter(i => i.category === 'gear').map(gear => {
                  const isEquipped = currentAvatar.equippedGear === gear.id;
                  return (
                    <button
                      key={gear.id}
                      onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedGear: gear.id })); }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isEquipped 
                          ? 'bg-[#00a2ff]/15 border-[#00a2ff] text-white' 
                          : 'bg-[#111216] border-[#232527] text-[#cccccc] hover:border-[#444]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{gear.thumbnail}</div>
                      <span className="text-xs font-bold block truncate">{gear.name}</span>
                      {isEquipped && <span className="text-[10px] text-[#00a2ff] font-black uppercase">Equipado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PROPORTIONS & SCALE */}
          {activeTab === 'scale' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-[#cccccc] mb-1 font-bold">
                  <span>Altura do Avatar (Height)</span>
                  <span>{(currentAvatar.scale.height * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={currentAvatar.scale.height}
                  onChange={(e) => setCurrentAvatar(prev => ({
                    ...prev,
                    scale: { ...prev.scale, height: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-[#00a2ff] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#cccccc] mb-1 font-bold">
                  <span>Largura do Avatar (Width)</span>
                  <span>{(currentAvatar.scale.width * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={currentAvatar.scale.width}
                  onChange={(e) => setCurrentAvatar(prev => ({
                    ...prev,
                    scale: { ...prev.scale, width: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-[#00a2ff] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

