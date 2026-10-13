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
  Mail
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

const CLASSIC_BLOX_COLORS = [
  { name: 'Bright Yellow', hex: '#facc15' },
  { name: 'Bright Blue', hex: '#2563eb' },
  { name: 'Dark Green', hex: '#16a34a' },
  { name: 'Bright Red', hex: '#dc2626' },
  { name: 'Deep Black', hex: '#111827' },
  { name: 'Pure White', hex: '#f8fafc' },
  { name: 'Medium Stone Grey', hex: '#64748b' },
  { name: 'Cyan Neon', hex: '#06b6d4' },
  { name: 'Royal Purple', hex: '#9333ea' },
  { name: 'Pastel Orange', hex: '#fb923c' },
  { name: 'Sand Tan', hex: '#d97706' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
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
  const [activeTab, setActiveTab] = useState<'colors' | 'clothing' | 'gears' | 'scale' | 'animations'>('colors');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CharacterMeshController | null>(null);

  // 3D Avatar Preview Viewport setup
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181a24);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio stage lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00a2ff, 0.8);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Circular pedestal platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x242838, roughness: 0.4, metalness: 0.2 })
    );
    platform.position.y = -0.2;
    platform.receiveShadow = true;
    scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.05, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0x00a2ff })
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#00a2ff]" />
            Avatar Customizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {isGuest 
              ? 'Visitantes usam o visual clássico do Noob (amarelo, azul e verde). Entre com seu email para personalizar!'
              : 'Design your unique blocky avatar. Color body parts, equip items, adjust proportions, and choose animations.'}
          </p>
        </div>

        {isGuest ? (
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenAuthModal) onOpenAuthModal();
            }}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Visitantes não podem alterar o avatar Noob"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Avatar Bloqueado (Visitante)</span>
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Outfit Saved!' : 'Save Avatar'}
          </button>
        )}
      </div>

      {/* Guest Lock Banner */}
      {isGuest && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-300">
                Modo Visitante: Avatar Bloqueado no Estilo Noob
              </h3>
              <p className="text-xs text-slate-300">
                Jogadores visitantes utilizam o clássico avatar Noob (amarelo, azul e verde). Para personalizar todas as cores e roupas, cadastre seu email!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenAuthModal) onOpenAuthModal();
            }}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#00a2ff] hover:bg-[#0090e0] text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Mail className="w-4 h-4" />
            <span>Entrar com Email</span>
          </button>
        </div>
      )}

      {/* Main Grid: 3D Viewport on Left, Customizer Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Avatar Preview (5 cols) */}
        <div className="lg:col-span-5 bg-[#181a24] border border-[#2b2f3f] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[460px] sm:h-[520px] relative">
          <div ref={previewContainerRef} className="w-full h-full cursor-ew-resize" />

          {/* Overlay info */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-[11px] text-slate-300 pointer-events-none flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-[#00a2ff] animate-spin" />
            Click and drag to spin 360°
          </div>

          {/* Quick Animation Poses Bar */}
          <div className="absolute bottom-4 inset-x-4 bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center justify-around">
            {(['idle', 'dance', 'wave'] as const).map(anim => (
              <button
                key={anim}
                onClick={() => {
                  sounds.playClick();
                  setCurrentAvatar(prev => ({ ...prev, animation: anim }));
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                  currentAvatar.animation === anim
                    ? 'bg-[#00a2ff] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {anim}
              </button>
            ))}
          </div>
        </div>

        {/* Customization Tabs & Palette (7 cols) */}
        <div className="lg:col-span-7 bg-[#181a24] border border-[#2b2f3f] rounded-3xl p-6 shadow-2xl flex flex-col space-y-6">
          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-2 border-b border-[#2b2f3f] pb-4 overflow-x-auto">
            <button
              onClick={() => { sounds.playClick(); setActiveTab('colors'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'colors' ? 'bg-[#00a2ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              <Palette className="w-4 h-4" />
              Body Colors
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('clothing'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'clothing' ? 'bg-[#00a2ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              <Crown className="w-4 h-4" />
              Hats & Faces
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('gears'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gears' ? 'bg-[#00a2ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              <Sword className="w-4 h-4" />
              Gears & Items
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('scale'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scale' ? 'bg-[#00a2ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Proportions
            </button>
          </div>

          {/* TAB 1: BODY COLORS */}
          {activeTab === 'colors' && (
            <div className="space-y-5">
              {/* Body Part Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Select Body Part to Paint
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'head', label: 'Head' },
                    { id: 'torso', label: 'Torso' },
                    { id: 'leftArm', label: 'L. Arm' },
                    { id: 'rightArm', label: 'R. Arm' },
                    { id: 'leftLeg', label: 'L. Leg' },
                    { id: 'rightLeg', label: 'R. Leg' }
                  ].map(limb => (
                    <button
                      key={limb.id}
                      onClick={() => { sounds.playClick(); setSelectedLimb(limb.id as any); }}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                        selectedLimb === limb.id
                          ? 'bg-[#00a2ff] text-white shadow-md'
                          : 'bg-[#20232e] text-slate-400 hover:text-white hover:bg-[#272b38] border border-[#2b2f3f]'
                      }`}
                    >
                      {limb.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Swatches Grid */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Classic Blox Palette
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {CLASSIC_BLOX_COLORS.map(c => {
                    const activeColor = selectedLimb === 'all' 
                      ? currentAvatar.bodyColors.torso 
                      : (currentAvatar.bodyColors as any)[selectedLimb];
                    const isSelected = activeColor === c.hex;

                    return (
                      <button
                        key={c.hex}
                        onClick={() => handleColorChange(c.hex)}
                        className={`h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected ? 'scale-105 border-white ring-4 ring-[#00a2ff]/60 shadow-lg' : 'border-white/10 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {isSelected && <Check className="w-5 h-5 text-slate-900 drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HATS & FACES */}
          {activeTab === 'clothing' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Equip Hats
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedHat: undefined })); }}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      !currentAvatar.equippedHat ? 'bg-[#00a2ff]/20 border-[#00a2ff] text-[#00a2ff]' : 'bg-[#20232e] border-[#2b2f3f] text-slate-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚫</div>
                    <span className="text-xs font-bold block">No Hat</span>
                  </button>

                  {inventoryItems.filter(i => i.category === 'hat').map(item => {
                    const isEquipped = currentAvatar.equippedHat === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedHat: item.id })); }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isEquipped ? 'bg-[#00a2ff]/20 border-[#00a2ff] text-white shadow-md' : 'bg-[#20232e] border-[#2b2f3f] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-2xl mb-1">{item.thumbnail}</div>
                        <span className="text-xs font-bold block truncate">{item.name}</span>
                        {isEquipped && <span className="text-[10px] text-[#00a2ff] font-extrabold uppercase">Equipped</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Equip Face
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {inventoryItems.filter(i => i.category === 'face').map(face => {
                    const isEquipped = currentAvatar.equippedFace === face.id;
                    return (
                      <button
                        key={face.id}
                        onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedFace: face.id })); }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isEquipped ? 'bg-[#00a2ff]/20 border-[#00a2ff] text-white' : 'bg-[#20232e] border-[#2b2f3f] text-slate-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{face.thumbnail}</div>
                        <span className="text-xs font-bold block truncate">{face.name}</span>
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
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Equip Hand Gear
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedGear: undefined })); }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    !currentAvatar.equippedGear ? 'bg-[#00a2ff]/20 border-[#00a2ff] text-[#00a2ff]' : 'bg-[#20232e] border-[#2b2f3f] text-slate-400'
                  }`}
                >
                  <div className="text-2xl mb-1">🚫</div>
                  <span className="text-xs font-bold block">No Gear</span>
                </button>

                {inventoryItems.filter(i => i.category === 'gear').map(gear => {
                  const isEquipped = currentAvatar.equippedGear === gear.id;
                  return (
                    <button
                      key={gear.id}
                      onClick={() => { sounds.playClick(); setCurrentAvatar(prev => ({ ...prev, equippedGear: gear.id })); }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isEquipped ? 'bg-[#00a2ff]/20 border-[#00a2ff] text-white' : 'bg-[#20232e] border-[#2b2f3f] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{gear.thumbnail}</div>
                      <span className="text-xs font-bold block truncate">{gear.name}</span>
                      {isEquipped && <span className="text-[10px] text-[#00a2ff] font-extrabold uppercase">Equipped</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PROPORTIONS */}
          {activeTab === 'scale' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                  <span>Avatar Height</span>
                  <span>{currentAvatar.scale.height.toFixed(1)}x</span>
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
                  className="w-full accent-[#00a2ff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                  <span>Avatar Width</span>
                  <span>{currentAvatar.scale.width.toFixed(1)}x</span>
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
                  className="w-full accent-[#00a2ff]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
