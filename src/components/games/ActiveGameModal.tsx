import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  MessageSquare, 
  Users, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Send, 
  Trophy, 
  Smile, 
  LogOut, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Pencil, 
  Lock, 
  Mail,
  Camera,
  Video,
  HelpCircle,
  Shield,
  Sliders,
  Check,
  ChevronRight,
  UserCheck,
  UserX,
  Flag
} from 'lucide-react';
import { GameMetadata, AvatarAppearance, ChatMessage } from '../../types';
import { BloxEngine3D } from '../engine/BloxEngine3D';
import { sounds } from '../../services/soundEffects';
import { RobloxLogo, RobuxIcon, RobloxVerifiedBadge } from '../common/RobloxIcons';
import { AvatarHeadshot } from '../common/AvatarHeadshot';

interface ActiveGameModalProps {
  game: GameMetadata;
  userAvatar: AvatarAppearance;
  username: string;
  userBloxbux: number;
  onClose: () => void;
  onRewardCoins: (amount: number) => void;
  onEditGame?: (game: GameMetadata) => void;
  activePasses?: string[];
  isGuest?: boolean;
  onOpenAuthModal?: () => void;
}

export const ActiveGameModal: React.FC<ActiveGameModalProps> = ({
  game,
  userAvatar,
  username,
  userBloxbux,
  onClose,
  onRewardCoins,
  onEditGame,
  activePasses = [],
  isGuest = false,
  onOpenAuthModal
}) => {
  const [chatOpen, setChatOpen] = useState<boolean>(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(true);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(true);
  const [escMenuOpen, setEscMenuOpen] = useState<boolean>(false);
  const [escTab, setEscTab] = useState<'players' | 'settings' | 'help' | 'record'>('players');
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState<boolean>(false);
  const [emotesOpen, setEmotesOpen] = useState<boolean>(false);
  
  // Settings in ESC Menu
  const [masterVolume, setMasterVolume] = useState<number>(100);
  const [cameraSensitivity, setCameraSensitivity] = useState<number>(50);
  const [shiftLockEnabled, setShiftLockEnabled] = useState<boolean>(true);
  const [graphicsQuality, setGraphicsQuality] = useState<number>(8); // 1 to 10
  const [graphicsAuto, setGraphicsAuto] = useState<boolean>(true);

  const starterRig = game.parts?.find(p => (p.type === 'rig' || p.type === 'npc') && p.attributes?.StarterCharacter === true);
  const starterMaxHealth = starterRig ? Math.max(1, Number(starterRig.attributes?.MaxHealth ?? 100) || 100) : 100;
  const [health, setHealth] = useState<number>(starterMaxHealth);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [chatInput, setChatInput] = useState<string>('');
  const [activeChatBubble, setActiveChatBubble] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm-1', sender: 'System', text: `Bem-vindo a ${game.title}! Pressione / para conversar ou ESC para o menu.`, timestamp: 'Agora', isSystem: true },
    { id: 'm-2', sender: 'gabriel2025', text: 'E aí pessoal! Física do Roblox tá surreal!', timestamp: 'Agora' },
    { id: 'm-3', sender: 'larry', text: 'Bora explorar o mapa!', timestamp: 'Agora' }
  ]);
  const [sessionCoins, setSessionCoins] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut listeners (Esc for menu, / for chat, Tab for leaderboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (resetConfirmOpen) {
          setResetConfirmOpen(false);
          return;
        }
        if (leaveConfirmOpen) {
          setLeaveConfirmOpen(false);
          return;
        }
        setEscMenuOpen(prev => !prev);
      } else if (e.key === '/' && !escMenuOpen) {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        setChatOpen(true);
        setTimeout(() => {
          chatInputRef.current?.focus();
        }, 50);
      } else if (e.key === 'Tab') {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        setLeaderboardOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'r' && escMenuOpen) {
        setResetConfirmOpen(true);
      } else if (e.key.toLowerCase() === 'l' && escMenuOpen) {
        setLeaveConfirmOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [escMenuOpen, resetConfirmOpen, leaveConfirmOpen]);

  // Periodic simulated player chats for alive multiplayer atmosphere
  useEffect(() => {
    const timer = setInterval(() => {
      const simulatedChats = [
        { sender: 'gabriel2025', text: 'Chutei a bola de física, foi longe!' },
        { sender: 'larry', text: 'Os blocos tombam certinho agora.' },
        { sender: 'WEY', text: 'Peguei mais moedas aqui na frente!' },
        { sender: 'Sammsson', text: 'Roblox 2022 vibes totais haha' }
      ];
      const randomMsg = simulatedChats[Math.floor(Math.random() * simulatedChats.length)];
      setChatMessages(prev => [...prev.slice(-15), {
        id: `m-${Date.now()}`,
        sender: randomMsg.sender,
        text: randomMsg.text,
        timestamp: 'Agora'
      }]);
    }, 18000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    if (!chatInput.trim()) return;

    sounds.playClick();
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: username,
      text: chatInput.trim(),
      timestamp: 'Agora'
    };

    setChatMessages(prev => [...prev, newMsg]);
    setActiveChatBubble(chatInput.trim());
    setChatInput('');

    setTimeout(() => {
      setActiveChatBubble(null);
    }, 5000);
  };

  const handleCoinCollected = useCallback((amount: number) => {
    setSessionCoins(prev => prev + amount);
    onRewardCoins(amount);
  }, [onRewardCoins]);

  const handleVictory = useCallback(() => {
    setHasWon(prevHasWon => {
      if (!prevHasWon) {
        onRewardCoins(150);
        setChatMessages(prev => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            sender: 'System',
            text: `🎉 ${username} alcançou o Altar Dourado e venceu a experiência! (+150 Robux concedidos)`,
            timestamp: 'Agora',
            isSystem: true
          }
        ]);
        return true;
      }
      return prevHasWon;
    });
  }, [onRewardCoins, username]);

  // Server players list for Leaderboard & ESC menu
  const serverPlayers = [
    { id: 'p-self', username, displayName: username, ping: '24ms', isSelf: true, avatarColor: userAvatar.bodyColors.head, robux: userBloxbux + sessionCoins },
    { id: 'p-1', username: 'gabriel2025', displayName: 'Gabriel', ping: '32ms', isSelf: false, avatarColor: '#38bdf8', robux: 2450 },
    { id: 'p-2', username: 'larry', displayName: 'Larry', ping: '45ms', isSelf: false, avatarColor: '#ec4899', robux: 1100 },
    { id: 'p-3', username: 'WEY', displayName: 'WEY', ping: '58ms', isSelf: false, avatarColor: '#22c55e', robux: 850 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden font-sans">
      {/* 3D Render Engine Viewport */}
      <div className="flex-1 w-full h-full relative">
        <BloxEngine3D
          gameId={game.id}
          experienceTitle={game.title}
          parts={game.parts}
          spawnPoint={game.spawnPoint}
          avatar={userAvatar}
          username={username}
          isStudioMode={false}
          onCoinCollected={handleCoinCollected}
          onVictory={handleVictory}
          activePasses={activePasses}
          chatBubbleText={activeChatBubble}
          incomingChatMessage={chatMessages[chatMessages.length - 1] || null}
          showMobileControls={showMobileControls}
          resetTrigger={resetTrigger}
          onHealthChange={setHealth}
          scripts={game.scripts}
          tools={game.tools}
          guis={game.guis}
          className="w-full h-full"
        />

        {/* ======================================================== */}
        {/* OFFICIAL 2022 ROBLOX TOPBAR (Clean, Integrated 36px bar) */}
        {/* ======================================================== */}
        <header className="absolute top-0 inset-x-0 h-10 bg-[#111216]/85 backdrop-blur-md border-b border-white/10 px-3 flex items-center justify-between pointer-events-auto z-30 select-none text-white">
          {/* LEFT: Roblox Tilted Logo Button, Chat Toggle, Emotes */}
          <div className="flex items-center gap-2">
            {/* Official Roblox Logo Button (Toggles ESC CoreGui Menu) */}
            <button
              onClick={() => {
                sounds.playClick();
                setEscMenuOpen(!escMenuOpen);
              }}
              className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 transition-all cursor-pointer group shadow-sm"
              title="Menu Roblox (ESC)"
            >
              <RobloxLogo size={20} color="#ffffff" className="group-hover:rotate-12 transition-transform" />
            </button>

            {/* In-Game Chat Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                setChatOpen(!chatOpen);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chatOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Alternar Chat (/)"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Emotes Wheel Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(!emotesOpen);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                emotesOpen
                  ? 'bg-[#00a2ff]/30 text-[#00a2ff] border border-[#00a2ff]/50'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Emotes (/e dance)"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Experience Title */}
            <span className="text-xs font-bold text-slate-300 hidden md:inline truncate max-w-[240px] ml-2">
              {game.title}
            </span>
          </div>

          {/* RIGHT: Leaderboard Toggle, Authentic Health Bar, Robux, Fullscreen */}
          <div className="flex items-center gap-2.5">
            {/* Authentic 2022 Roblox Health Bar */}
            {(() => {
              const hpPct = starterMaxHealth > 0 ? Math.max(0, Math.min(100, (health / starterMaxHealth) * 100)) : 0;
              return (
                <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md border border-white/15 shadow-inner">
                  <div className="w-20 sm:w-28 h-2 bg-black/80 rounded-[2px] overflow-hidden p-[1px] border border-white/10">
                    <div
                      className={`h-full rounded-[1px] transition-all duration-300 ${
                        hpPct > 50 ? 'bg-[#00e676]' : hpPct > 20 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                      }`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* In-Game Session Robux Indicator */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 px-2 py-0.5 rounded-md text-xs font-bold text-emerald-400">
              <RobuxIcon size={13} color="#00e676" />
              <span>+{sessionCoins}</span>
            </div>

            {/* Leaderboard Player List Toggle (Tab) */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardOpen(!leaderboardOpen);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                leaderboardOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Lista de Jogadores (Tab)"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Mobile Controls Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowMobileControls(!showMobileControls);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                showMobileControls
                  ? 'bg-[#00a2ff]/20 text-[#00a2ff]'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
              title="Controles Móveis (Touch)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                sounds.setSoundEnabled(!soundOn);
                setSoundOn(!soundOn);
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
              title="Áudio"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
              title="Tela Cheia (F11)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* EMOTES MENU POPUP (Classic Roblox 2022 Emotes Wheel/List) */}
        {emotesOpen && (
          <div className="absolute top-12 left-16 bg-[#191b1d]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2 z-40 shadow-2xl flex flex-col gap-1 w-48 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
            <span className="text-[10px] uppercase font-black text-slate-400 px-2 py-1">Emotes Roblox</span>
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(false);
                setActiveChatBubble('/e dance 💃');
                if (!isGuest) {
                  setChatMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: username, text: '*dança no ritmo*', timestamp: 'Agora' }]);
                }
                setTimeout(() => setActiveChatBubble(null), 4000);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
            >
              <span>💃</span>
              <span>Dança (/e dance)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(false);
                setActiveChatBubble('/e wave 👋');
                if (!isGuest) {
                  setChatMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: username, text: '*acenando para todos*', timestamp: 'Agora' }]);
                }
                setTimeout(() => setActiveChatBubble(null), 4000);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
            >
              <span>👋</span>
              <span>Acenar (/e wave)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(false);
                setActiveChatBubble('/e cheer 🎉');
                if (!isGuest) {
                  setChatMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: username, text: '*comemora com alegria!*', timestamp: 'Agora' }]);
                }
                setTimeout(() => setActiveChatBubble(null), 4000);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
            >
              <span>🎉</span>
              <span>Animar (/e cheer)</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* OFFICIAL 2022 ROBLOX ESC MENU ("CoreGui" in-game menu)   */}
        {/* ======================================================== */}
        {escMenuOpen && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
            <div className="bg-[#191b1d] border border-white/20 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Top Header with 2022 Tabs: Pessoas | Configurações | Ajuda | Gravar */}
              <div className="bg-[#111216] px-6 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RobloxLogo size={24} color="#ffffff" />
                  <div className="flex items-center gap-1 font-bold text-xs sm:text-sm">
                    <button
                      onClick={() => setEscTab('players')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        escTab === 'players' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pessoas
                    </button>
                    <button
                      onClick={() => setEscTab('settings')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        escTab === 'settings' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Configurações
                    </button>
                    <button
                      onClick={() => setEscTab('help')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        escTab === 'help' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ajuda
                    </button>
                    <button
                      onClick={() => setEscTab('record')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        escTab === 'record' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Gravar
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setEscMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* 1. PESSOAS (Players List) */}
                {escTab === 'players' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-2">
                      <span>Jogadores no Servidor ({serverPlayers.length})</span>
                      <span>Ações</span>
                    </div>

                    <div className="space-y-1.5">
                      {serverPlayers.map(p => (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <AvatarHeadshot
                              avatar={
                                p.isSelf
                                  ? userAvatar
                                  : {
                                      bodyColors: {
                                        head: p.avatarColor,
                                        torso: p.avatarColor,
                                        leftArm: p.avatarColor,
                                        rightArm: p.avatarColor,
                                        leftLeg: '#1e293b',
                                        rightLeg: '#1e293b'
                                      },
                                      equippedFace: 'face-epic',
                                      scale: { width: 1, height: 1, head: 1 },
                                      animation: 'idle'
                                    }
                              }
                              alt={p.displayName}
                              className="w-9 h-9 rounded-full border border-white/20"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-white">{p.displayName}</span>
                                {p.isSelf && (
                                  <span className="text-[10px] bg-[#00a2ff]/20 text-[#00a2ff] px-1.5 py-0.5 rounded font-black">
                                    VOCÊ
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">@{p.username} • {p.ping}</span>
                            </div>
                          </div>

                          {!p.isSelf && (
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => sounds.playClick()}
                                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 cursor-pointer"
                              >
                                Amigo
                              </button>
                              <button 
                                onClick={() => sounds.playClick()}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                title="Denunciar"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. CONFIGURAÇÕES (In-game settings) */}
                {escTab === 'settings' && (
                  <div className="space-y-4 text-xs font-semibold text-slate-300">
                    {/* Shift Lock */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div>
                        <span className="font-bold text-white block">Trava do Shift (Shift Lock Switch)</span>
                        <span className="text-[11px] text-slate-400">Alterne para travar a rotação da câmera com o mouse</span>
                      </div>
                      <button
                        onClick={() => setShiftLockEnabled(!shiftLockEnabled)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          shiftLockEnabled ? 'bg-[#00a2ff] text-white' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {shiftLockEnabled ? 'Ativado' : 'Desativado'}
                      </button>
                    </div>

                    {/* Camera Sensitivity Slider */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Sensibilidade da Câmera</span>
                        <span className="font-mono text-cyan-400 font-bold">{cameraSensitivity}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={cameraSensitivity}
                        onChange={(e) => setCameraSensitivity(Number(e.target.value))}
                        className="w-full accent-[#00a2ff] cursor-pointer"
                      />
                    </div>

                    {/* Master Volume Slider */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Volume Principal</span>
                        <span className="font-mono text-emerald-400 font-bold">{masterVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={masterVolume}
                        onChange={(e) => setMasterVolume(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Graphics Quality */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Nível dos Gráficos</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setGraphicsAuto(!graphicsAuto)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                              graphicsAuto ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            Automático
                          </button>
                          <span className="font-mono text-white">{graphicsQuality}/10</span>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        disabled={graphicsAuto}
                        value={graphicsQuality}
                        onChange={(e) => setGraphicsQuality(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                  </div>
                )}

                {/* 3. AJUDA (Keybinds) */}
                {escTab === 'help' && (
                  <div className="space-y-3 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block">Atalhos do Teclado e Mouse</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Andar / Movimento</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">W A S D / Setas</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Pular</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">Espaço</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Equipar Ferramentas</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">1 - 9</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Girar Câmera</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">Botão Direito</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Abrir Chat</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">/</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Lista de Jogadores</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">Tab</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Menu Principal</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">ESC</kbd>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300">Zoom In / Zoom Out</span>
                        <kbd className="bg-black/60 px-2 py-1 rounded text-white font-mono font-bold">Scroll do Mouse</kbd>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. GRAVAR (Record) */}
                {escTab === 'record' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-[#00a2ff]" />
                        <div>
                          <strong className="text-white block">Capturar Tela (Screenshot)</strong>
                          <span className="text-slate-400">Salva uma imagem do momento no seu dispositivo</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => sounds.playClick()}
                        className="px-4 py-2 bg-[#00a2ff] hover:bg-[#0090e0] text-white font-black rounded-xl cursor-pointer"
                      >
                        Capturar
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-rose-400" />
                        <div>
                          <strong className="text-white block">Gravar Vídeo</strong>
                          <span className="text-slate-400">Inicia gravação de gameplay</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => sounds.playClick()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl cursor-pointer"
                      >
                        Gravar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Retomar Jogo | Reiniciar Personagem | Sair do Jogo */}
              <div className="p-5 bg-[#111216] border-t border-white/10 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={() => setEscMenuOpen(false)}
                  className="w-full sm:flex-1 bg-[#00a2ff] hover:bg-[#0090e0] text-white py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-500/25 cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Retomar Jogo</span>
                  <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">ESC</span>
                </button>

                {/* Edit in Studio if user created this game */}
                {(game.creator.id === 'user-self' || game.creator.username.toLowerCase() === username.toLowerCase()) && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      if (onEditGame) onEditGame(game);
                    }}
                    className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Editar no Studio</span>
                  </button>
                )}

                <button
                  onClick={() => setResetConfirmOpen(true)}
                  className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                  <span className="text-[10px] bg-black/40 px-1 py-0.5 rounded font-mono text-slate-400">R</span>
                </button>

                <button
                  onClick={() => setLeaveConfirmOpen(true)}
                  className="w-full sm:w-auto px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                  <span className="text-[10px] bg-black/40 px-1 py-0.5 rounded font-mono text-rose-300">L</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO: REINICIAR PERSONAGEM */}
        {resetConfirmOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-60 pointer-events-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-[#191b1d] border border-white/20 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-lg text-white">Reiniciar Personagem?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tem certeza que deseja reiniciar o seu personagem? Você voltará para o ponto de spawn.
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setResetTrigger(prev => prev + 1);
                    setResetConfirmOpen(false);
                    setEscMenuOpen(false);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO: SAIR DO JOGO */}
        {leaveConfirmOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-60 pointer-events-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-[#191b1d] border border-white/20 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-lg text-white">Sair do Jogo?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tem certeza que deseja sair de <strong>{game.title}</strong>? Seu progresso recente pode não ser salvo.
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={() => setLeaveConfirmOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Não Sair
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Sair do Jogo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* IN-GAME CHAT BOX (Roblox 2022 Classic TextChatService)    */}
        {/* ======================================================== */}
        {chatOpen && (
          <div className="absolute top-12 left-3 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] pointer-events-auto z-40 transition-all animate-in fade-in duration-150">
            <div className="bg-[#111216]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00a2ff]" />
                  <span>Chat da Experiência</span>
                  {isGuest && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-black">
                      Visitante
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-0.5 rounded hover:bg-white/10 cursor-pointer"
                  title="Fechar Chat"
                >
                  ✕
                </button>
              </div>

              <div className="h-32 sm:h-36 overflow-y-auto p-2.5 space-y-1 text-xs">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="leading-tight">
                    {msg.isSystem ? (
                      <span className="text-amber-400 font-semibold">{msg.text}</span>
                    ) : (
                      <span>
                        <strong className={msg.sender === username ? 'text-[#00a2ff]' : 'text-slate-200'}>
                          [{msg.sender}]:{' '}
                        </strong>
                        <span className="text-white">{msg.text}</span>
                      </span>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              {isGuest ? (
                <div className="p-2 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-300">
                    Chat restrito para Visitantes.
                  </span>
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onOpenAuthModal();
                      }}
                      className="bg-[#00a2ff] hover:bg-[#0090e0] text-white px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 transition-colors cursor-pointer"
                    >
                      Cadastrar
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-1.5 bg-black/40 border-t border-white/10 flex items-center gap-1.5">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Para conversar, clique aqui ou pressione /"
                    className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00a2ff]"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-[#00a2ff] hover:bg-[#0090e0] text-white rounded-xl cursor-pointer"
                    title="Enviar Mensagem"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* LEADERBOARD (Top-Right, 2022 Roblox Playerlist)          */}
        {/* ======================================================== */}
        {leaderboardOpen && (
          <div className="absolute top-12 right-3 w-64 bg-[#111216]/85 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-2xl pointer-events-auto text-xs hidden sm:block z-30">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Jogador</span>
              <span>Robux</span>
            </div>
            <div className="mt-2 space-y-1 font-medium">
              {serverPlayers.map(p => (
                <div 
                  key={p.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                    p.isSelf ? 'bg-[#00a2ff]/20 border border-[#00a2ff]/40 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{p.displayName}</span>
                    {p.isSelf && <span className="text-[9px] text-[#00a2ff]">(Você)</span>}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold shrink-0">{p.robux}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VICTORY CELEBRATION MODAL                                */}
        {/* ======================================================== */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-40">
            <div className="bg-[#191b1d] border border-white/20 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Trophy className="w-10 h-10 text-slate-900" />
              </div>

              <h2 className="text-2xl font-black text-white">VITÓRIA CONQUISTADA!</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Você superou todos os obstáculos e completou a experiência <strong>{game.title}</strong>!
              </p>

              <div className="bg-[#111216] border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-center gap-3">
                <RobuxIcon size={24} color="#00e676" />
                <span className="text-lg font-black text-emerald-400 font-mono">
                  +150 Robux Concedidos
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setHasWon(false)}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Continuar Jogando
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="flex-1 bg-[#00a2ff] hover:bg-[#0090e0] text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-blue-500/30 cursor-pointer"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
