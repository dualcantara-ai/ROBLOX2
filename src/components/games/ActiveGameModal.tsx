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
  Coins, 
  Zap, 
  Sparkles, 
  ShieldAlert,
  Smartphone,
  Smile,
  LogOut,
  Settings,
  Maximize2,
  Minimize2,
  Pencil,
  Lock,
  Mail
} from 'lucide-react';
import { GameMetadata, AvatarAppearance, ChatMessage } from '../../types';
import { BloxEngine3D } from '../engine/BloxEngine3D';
import { sounds } from '../../services/soundEffects';

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
  const [emotesOpen, setEmotesOpen] = useState<boolean>(false);
  const [health, setHealth] = useState<number>(100);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [chatInput, setChatInput] = useState<string>('');
  const [activeChatBubble, setActiveChatBubble] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm-1', sender: 'System', text: `Bem-vindo ao ${game.title}! Use WASD para andar, Espaço para pular e [1-5] para equipar ferramentas.`, timestamp: 'Agora', isSystem: true },
    { id: 'm-2', sender: 'gabriel2025', text: 'E aí pessoal! Todos os scripts estão rodando perfeitamente!', timestamp: 'Agora' },
    { id: 'm-3', sender: 'larry', text: 'Boa sorte no jogo!', timestamp: 'Agora' }
  ]);
  const [sessionCoins, setSessionCoins] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Escape key listener for Roblox in-game menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEscMenuOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Periodic simulated player chats for alive multiplayer atmosphere
  useEffect(() => {
    const timer = setInterval(() => {
      const simulatedChats = [
        { sender: 'gabriel2025', text: 'Belo pulo!' },
        { sender: 'larry', text: 'Os blocos com física respondem super rápido.' },
        { sender: 'WEY', text: 'Peguei as moedas!' },
        { sender: 'Sammsson', text: 'GG galera! Excelente jogo.' }
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
      timestamp: 'Now'
    };

    setChatMessages(prev => [...prev, newMsg]);
    setActiveChatBubble(chatInput.trim());
    setChatInput('');

    // Clear speech bubble after 5 seconds
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
        onRewardCoins(150); // Winner bonus
        setChatMessages(prev => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            sender: 'System',
            text: `🎉 ${username} touched the Golden Altar and conquered the stage! (+150 BloxBux bonus awarded)`,
            timestamp: 'Now',
            isSystem: true
          }
        ]);
        return true;
      }
      return prevHasWon;
    });
  }, [onRewardCoins, username]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden font-sans">
      {/* 3D Render Engine Viewport */}
      <div className="flex-1 w-full h-full relative">
        <BloxEngine3D
          parts={game.parts}
          spawnPoint={game.spawnPoint}
          avatar={userAvatar}
          username={username}
          isStudioMode={false}
          onCoinCollected={handleCoinCollected}
          onVictory={handleVictory}
          activePasses={activePasses}
          chatBubbleText={activeChatBubble}
          showMobileControls={showMobileControls}
          resetTrigger={resetTrigger}
          onHealthChange={setHealth}
          scripts={game.scripts}
          tools={game.tools}
          guis={game.guis}
          className="w-full h-full"
        />

        {/* AUTHENTIC ROBLOX TOP BAR */}
        <div className="absolute top-2 inset-x-2 sm:inset-x-4 h-12 bg-[#191b1d]/90 backdrop-blur-md rounded-2xl border border-white/10 px-2 sm:px-3 flex items-center justify-between pointer-events-auto z-30 shadow-xl select-none">
          {/* LEFT: Roblox Tilted Logo / Menu Button, Chat, Leaderboard, Emotes */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* The Classic Roblox Logo Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setEscMenuOpen(!escMenuOpen);
              }}
              className="flex items-center gap-1.5 bg-[#2b2d31] hover:bg-[#35373c] active:scale-95 px-2.5 py-1.5 rounded-xl border border-white/15 transition-all cursor-pointer group shadow-sm"
              title="Roblox Menu (ESC)"
            >
              <div className="w-5 h-5 bg-black border border-white/30 rounded-[4px] flex items-center justify-center transform -rotate-15 group-hover:rotate-0 transition-transform shadow">
                <div className="w-1.5 h-1.5 bg-[#2b2d31] rounded-[1px] transform rotate-15" />
              </div>
              <span className="text-[11px] font-black text-white hidden sm:inline font-mono">ESC</span>
            </button>

            {/* Chat Toggle Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setChatOpen(!chatOpen);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                chatOpen
                  ? 'bg-[#3b82f6]/30 text-[#60a5fa] border border-[#3b82f6]/50'
                  : 'bg-[#2b2d31] text-slate-300 hover:text-white border border-white/10'
              }`}
              title="Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardOpen(!leaderboardOpen);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                leaderboardOpen
                  ? 'bg-[#3b82f6]/30 text-[#60a5fa] border border-[#3b82f6]/50'
                  : 'bg-[#2b2d31] text-slate-300 hover:text-white border border-white/10'
              }`}
              title="Leaderboard (Tab)"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Emotes Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(!emotesOpen);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                emotesOpen
                  ? 'bg-[#3b82f6]/30 text-[#60a5fa] border border-[#3b82f6]/50'
                  : 'bg-[#2b2d31] text-slate-300 hover:text-white border border-white/10'
              }`}
              title="Emotes (/e dance)"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Experience Title */}
            <span className="text-xs font-black text-white/90 hidden lg:inline truncate max-w-[220px] ml-1">
              {game.title}
            </span>
          </div>

          {/* RIGHT: Health Bar, BloxBux Pill, Mobile Controls Toggle, Audio */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Classic Roblox Health Bar */}
            <div className="flex items-center gap-1.5 bg-[#121316] px-2.5 py-1 rounded-xl border border-white/10 shadow-inner">
              <span className="text-[10px] font-black text-slate-400">HP</span>
              <div className="w-18 sm:w-26 h-2.5 bg-black/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    health > 40 ? 'bg-[#00e676]' : health > 20 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>

            {/* Currency Pill */}
            <div className="bg-[#121316] border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono text-xs font-black text-amber-300 shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{sessionCoins}</span>
            </div>

            {/* Mobile Controls Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowMobileControls(!showMobileControls);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showMobileControls
                  ? 'bg-[#3b82f6]/30 text-[#60a5fa] border-[#3b82f6]/50'
                  : 'bg-[#2b2d31] text-slate-400 border-white/10'
              }`}
              title="Toggle Mobile Controls Overlay"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                sounds.setSoundEnabled(!soundOn);
                setSoundOn(!soundOn);
              }}
              className="p-2 rounded-xl bg-[#2b2d31] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              title="Toggle Audio"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Fullscreen Viewport Toggle */}
            <button
              onClick={() => {
                sounds.playClick();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFullscreen
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#2b2d31] border-white/10 text-slate-300 hover:text-white'
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewport (F11)"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EMOTES MENU POPUP */}
        {emotesOpen && (
          <div className="absolute top-16 left-24 sm:left-32 bg-[#191b1d]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2 z-40 shadow-2xl flex flex-col gap-1 w-44 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-auto">
            <span className="text-[10px] uppercase font-black text-slate-400 px-2 py-1">Emotes</span>
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(false);
                setActiveChatBubble('/e dance 💃');
                if (!isGuest) {
                  setChatMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: username, text: '*dances rhythmically*', timestamp: 'Now' }]);
                }
                setTimeout(() => setActiveChatBubble(null), 4000);
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
            >
              <span>💃</span>
              <span>Dance (/e dance)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(false);
                setActiveChatBubble('/e wave 👋');
                if (!isGuest) {
                  setChatMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: username, text: '*waves happily*', timestamp: 'Now' }]);
                }
                setTimeout(() => setActiveChatBubble(null), 4000);
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
            >
              <span>👋</span>
              <span>Wave (/e wave)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setEmotesOpen(false);
                setActiveChatBubble('/e cheer 🎉');
                if (!isGuest) {
                  setChatMessages(prev => [...prev, { id: `m-${Date.now()}`, sender: username, text: '*cheers for everyone!*', timestamp: 'Now' }]);
                }
                setTimeout(() => setActiveChatBubble(null), 4000);
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 text-left cursor-pointer"
            >
              <span>🎉</span>
              <span>Cheer (/e cheer)</span>
            </button>
          </div>
        )}

        {/* CLASSIC ROBLOX ESCAPE MENU MODAL */}
        {escMenuOpen && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
            <div className="bg-[#191b1d] border-2 border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-black border border-white/25 rounded-[5px] flex items-center justify-center transform -rotate-12 shadow">
                    <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Basehub Menu</h3>
                    <p className="text-[11px] text-slate-400">{game.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEscMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white font-black hover:bg-white/20 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => setEscMenuOpen(false)}
                  className="w-full bg-[#00a2ff] hover:bg-[#0090e0] text-white py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  ▶ Resume Experience
                </button>

                {/* If the current player made this game, show Edit in Studio */}
                {(game.creator.id === 'user-self' || game.creator.username.toLowerCase() === username.toLowerCase()) && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      if (onEditGame) onEditGame(game);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2 ring-1 ring-amber-300"
                    title="Editar esta experiência no Blox Studio"
                  >
                    <Pencil className="w-4 h-4 text-black" />
                    Editar Experiência no Studio
                  </button>
                )}

                <button
                  onClick={() => {
                    sounds.playClick();
                    setResetTrigger(prev => prev + 1);
                    setEscMenuOpen(false);
                  }}
                  className="w-full bg-[#2a2c31] hover:bg-rose-950/60 hover:border-rose-500/50 text-rose-300 py-3 rounded-2xl font-black text-sm transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Character (Respawn with OOF)
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="w-full bg-[#2a2c31] hover:bg-white/10 text-slate-300 hover:text-white py-3 rounded-2xl font-black text-sm transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Experience
                </button>
              </div>

              {/* Sound & Controls Info */}
              <div className="pt-2 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
                <span>Player: <strong className="text-white">{username}</strong></span>
                <span>Press <kbd className="bg-black/50 px-1.5 py-0.5 rounded text-white font-mono">ESC</kbd> to toggle</span>
              </div>
            </div>
          </div>
        )}

        {/* IN-GAME CHAT BOX (TOP OF THE SCREEN) */}
        {chatOpen && (
          <div className="absolute top-18 left-4 w-72 sm:w-88 max-w-[calc(100vw-2rem)] pointer-events-auto z-40 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-[#12141c]/90 backdrop-blur-md border border-[#2b2f3f] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-[#181a24]/95 border-b border-[#2b2f3f] flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00a2ff]" />
                  <span>In-Game Chat</span>
                  {isGuest ? (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Visitante (Apenas Leitura)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#222533] text-slate-400 px-1.5 py-0.2 rounded font-mono">
                      {chatMessages.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 hidden sm:inline">Speech Bubble Sync</span>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold p-0.5 rounded hover:bg-white/10"
                    title="Minimize Chat"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="h-32 sm:h-36 overflow-y-auto p-3 space-y-1.5 text-xs">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="leading-tight">
                    {msg.isSystem ? (
                      <span className="text-amber-400 font-semibold">{msg.text}</span>
                    ) : (
                      <span>
                        <strong className={msg.sender === username ? 'text-[#00a2ff]' : 'text-slate-300'}>
                          [{msg.sender}]:{' '}
                        </strong>
                        <span className="text-slate-200">{msg.text}</span>
                      </span>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar or Guest Notice */}
              {isGuest ? (
                <div className="p-2.5 bg-[#181a24]/95 border-t border-[#2b2f3f] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">
                      Chat desativado para <strong className="text-amber-400">Visitantes</strong>.
                    </span>
                  </div>
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onOpenAuthModal();
                      }}
                      className="bg-[#00a2ff] hover:bg-[#0090e0] text-white px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Entrar</span>
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-2 bg-[#181a24]/95 border-t border-[#2b2f3f] flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Chat here (shows above head)..."
                    className="flex-1 bg-[#12141c] border border-[#2b2f3f] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2ff]"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-[#00a2ff] hover:bg-[#0090e0] text-white rounded-xl cursor-pointer"
                    title="Send Chat"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* LEADERBOARD OVERLAY (Top-Right) */}
        {leaderboardOpen && (
          <div className="absolute top-18 right-4 w-60 bg-[#12141c]/90 backdrop-blur-md border border-[#2b2f3f] rounded-2xl p-3 shadow-2xl pointer-events-auto text-xs hidden sm:block z-30">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b2f3f] text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <span>Players</span>
              <span>Coins</span>
            </div>
            <div className="mt-2 space-y-1.5 font-medium">
              <div className="flex items-center justify-between bg-[#00a2ff]/15 px-2.5 py-1.5 rounded-xl border border-[#00a2ff]/30 text-white">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {username} (You)
                </span>
                <span className="font-mono text-amber-300 font-bold">{sessionCoins}</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  gabriel2025
                </span>
                <span className="font-mono text-slate-400">120</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  larry
                </span>
                <span className="font-mono text-slate-400">85</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  WEY
                </span>
                <span className="font-mono text-slate-400">40</span>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY CELEBRATION MODAL */}
        {hasWon && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40">
            <div className="bg-[#181a24] border border-[#2e3243] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="w-10 h-10 text-slate-900" />
              </div>

              <h2 className="text-2xl font-black text-white">VICTORY ACHIEVED!</h2>
              <p className="text-sm text-slate-300">
                You reached the Golden Altar and conquered {game.title}!
              </p>

              <div className="bg-[#12141c] border border-amber-500/30 p-4 rounded-2xl flex items-center justify-center gap-3">
                <Coins className="w-6 h-6 text-amber-400" />
                <span className="text-lg font-black text-amber-300 font-mono">
                  +150 BloxBux Reward
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setHasWon(false)}
                  className="flex-1 bg-[#252836] hover:bg-[#2c3040] text-white py-3 rounded-xl font-bold text-xs"
                >
                  Continue Free Roam
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="flex-1 bg-[#00a2ff] hover:bg-[#0090e0] text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/25"
                >
                  Return to Discover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
