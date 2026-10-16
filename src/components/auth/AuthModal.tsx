import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Calendar, 
  User, 
  Mail, 
  Lock, 
  Gamepad2, 
  ShieldAlert,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  Play,
  ThumbsUp,
  Users,
  Flame,
  CheckCircle2,
  Info
} from 'lucide-react';
import { INITIAL_GAMES } from '../../services/storage';
import { GameMetadata } from '../../types';
import { sounds } from '../../services/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onLoginWithEmail: (email: string, username?: string) => void;
  onContinueAsGuest: () => void;
  onPlayGame?: (game: GameMetadata) => void;
  games?: GameMetadata[];
  initialMode?: 'select' | 'email' | 'guest' | 'jogar' | 'cadastrar' | 'entrar';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
  onLoginWithEmail,
  onContinueAsGuest,
  onPlayGame,
  games = INITIAL_GAMES,
  initialMode = 'jogar'
}) => {
  // 3 Primary Screens: 'jogar' (Play screen), 'cadastrar' (Register screen), 'entrar' (Login screen)
  const [view, setView] = useState<'jogar' | 'cadastrar' | 'entrar'>(() => {
    if (initialMode === 'email' || initialMode === 'entrar') return 'entrar';
    if (initialMode === 'cadastrar') return 'cadastrar';
    return 'jogar';
  });

  // Selected game for quick inspection on 'jogar' screen
  const [selectedPreviewGame, setSelectedPreviewGame] = useState<GameMetadata | null>(null);

  // Register Form Fields
  const [regDay, setRegDay] = useState('15');
  const [regMonth, setRegMonth] = useState('06');
  const [regYear, setRegYear] = useState('2010');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState<'female' | 'male' | null>(null);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Error messaging
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regUsername.trim()) {
      setErrorMsg('Por favor, informe um nome de usuário.');
      return;
    }

    const emailToUse = regEmail.trim() || `${regUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@bloxverse.com`;
    if (!emailToUse.includes('@')) {
      setErrorMsg('Por favor, insira um e-mail válido.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    sounds.playPurchase();
    onLoginWithEmail(emailToUse, regUsername.trim());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Informe seu usuário ou e-mail.');
      return;
    }

    const emailToUse = loginIdentifier.includes('@') 
      ? loginIdentifier.trim() 
      : `${loginIdentifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@bloxverse.com`;

    const userToUse = loginIdentifier.includes('@')
      ? loginIdentifier.split('@')[0]
      : loginIdentifier.trim();

    sounds.playPurchase();
    onLoginWithEmail(emailToUse, userToUse);
  };

  const handleDirectPlay = (game?: GameMetadata) => {
    sounds.playClick();
    onContinueAsGuest();
    if (game && onPlayGame) {
      onPlayGame(game);
    }
  };

  const catalogGames = games && games.length > 0 ? games : INITIAL_GAMES;
  const featuredGame = catalogGames[0];
  const otherGames = catalogGames.slice(1, 9);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#07080b] flex flex-col items-center justify-between select-none font-sans min-h-screen">
      
      {/* 3D SCATTERED BACKGROUND GAME POSTERS (Substituted with real BloxVerse games) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-radial from-transparent via-[#07080b]/80 to-[#07080b] z-10" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4 transform scale-110 -translate-y-6">
          {catalogGames.map((game, idx) => {
            const rotations = [
              '-rotate-12 translate-y-2',
              'rotate-6 -translate-y-4',
              '-rotate-6 translate-y-6',
              'rotate-12 translate-y-1',
              '-rotate-3 -translate-y-2',
              'rotate-8 translate-y-4',
              '-rotate-8 translate-y-8',
              'rotate-4 -translate-y-6',
              '-rotate-12 translate-y-3',
              'rotate-6 -translate-y-5'
            ];
            const borderColors = [
              'border-cyan-500/40 shadow-cyan-500/20',
              'border-purple-500/40 shadow-purple-500/20',
              'border-amber-500/40 shadow-amber-500/20',
              'border-rose-500/40 shadow-rose-500/20',
              'border-blue-500/40 shadow-blue-500/20',
              'border-emerald-500/40 shadow-emerald-500/20'
            ];
            const rotClass = rotations[idx % rotations.length];
            const borderClass = borderColors[idx % borderColors.length];

            return (
              <div 
                key={`bg-${game.id}-${idx}`}
                className={`relative rounded-2xl overflow-hidden border-2 ${borderClass} shadow-xl transform ${rotClass} aspect-[4/3] bg-[#14161f]`}
              >
                <img 
                  src={game.thumbnail} 
                  alt={game.title} 
                  className="w-full h-full object-cover filter brightness-70"
                  onError={(e) => {
                    // Safe SVG fallback container if external url fails
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/neon_obby_game_1791893718114.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-2.5">
                  <span className="text-[11px] font-black text-white drop-shadow truncate tracking-wide">
                    {game.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP HEADER: ROBLOX LOGO + 3 SCREEN TABS (Entrar, Cadastrar, Jogar) */}
      <header className="relative z-30 w-full max-w-5xl px-4 pt-6 pb-2 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-black border border-white/30 rounded-xl flex items-center justify-center transform -rotate-12 shadow-xl shrink-0">
            <div className="w-3.5 h-3.5 bg-[#111216] rounded-[3px] transform rotate-12" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-wider font-sans leading-none drop-shadow-md">
              BASEHUB
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
              Universe Edition
            </span>
          </div>
        </div>

        {/* The 3 Primary Screens Selector: [Jogar] [Cadastrar] [Entrar] */}
        <div className="flex items-center p-1 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
          <button
            onClick={() => { sounds.playClick(); setErrorMsg(''); setView('jogar'); }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'jogar'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Jogar</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setErrorMsg(''); setView('cadastrar'); }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'cadastrar'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setErrorMsg(''); setView('entrar'); }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'entrar'
                ? 'bg-white text-slate-900 shadow-lg scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </button>
        </div>

        {/* Optional Close button if dismissed by already logged in user */}
        <div>
          {canDismiss && onClose ? (
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-slate-300 hover:text-white backdrop-blur-md cursor-pointer transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      {/* MAIN CONTAINER: SWITCH BETWEEN THE 3 SCREENS */}
      <main className="relative z-20 w-full max-w-4xl px-4 py-4 flex flex-col items-center justify-center my-auto">
        
        {/* =====================================================================
            SCREEN 1: TELA DE JOGAR (PLAY SCREEN WITH REAL BLOXVERSE GAMES)
            ===================================================================== */}
        {view === 'jogar' && (
          <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Guest Rules Banner Notice */}
            <div className="bg-gradient-to-r from-amber-500/15 via-black/60 to-amber-500/15 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                  😄
                </div>
                <div>
                  <h4 className="font-black text-amber-300 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                    <span>Modo Visitante Habilitado</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                      Sem Cadastro
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Você entrará com o clássico <strong>Avatar Noob</strong>. Jogue todas as experiências à vontade!
                    (Chat e Blox Studio são bloqueados para visitantes).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { sounds.playClick(); setView('cadastrar'); }}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  Criar Conta Grátis
                </button>
              </div>
            </div>

            {/* FEATURED GAME HERO CARD (Roblox Mobile Experience Style) */}
            {featuredGame && (
              <div className="relative overflow-hidden rounded-3xl bg-[#141620]/95 backdrop-blur-xl border border-white/15 shadow-2xl group">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  {/* Big Game Artwork */}
                  <div className="relative md:col-span-7 h-56 sm:h-72 md:h-auto overflow-hidden bg-black">
                    <img 
                      src={featuredGame.thumbnail} 
                      alt={featuredGame.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/src/assets/images/neon_obby_game_1791893718114.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-[#141620]/40 to-[#141620]" />
                    
                    <div className="absolute top-3 left-3 bg-[#00a2ff] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Em Destaque</span>
                    </div>
                  </div>

                  {/* Details and Big Play Button */}
                  <div className="md:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-[#00a2ff]">{featuredGame.genre}</span>
                        <span>•</span>
                        <span>Por @{featuredGame.creator.username}</span>
                        {featuredGame.creator.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00a2ff]" />
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {featuredGame.title}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {featuredGame.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-300">
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono font-bold text-white">
                            {featuredGame.playingCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">jogando</span>
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono font-bold text-white">
                            {Math.round((featuredGame.likes / (featuredGame.likes + (featuredGame.dislikes || 500))) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Massive Green Play Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleDirectPlay(featuredGame)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.99]"
                      >
                        <Play className="w-6 h-6 fill-white" />
                        <span>JOGAR AGORA (VISITANTE)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REAL BLOXVERSE GAMES GRID (Substitute background/empty cards with games) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-[#00a2ff]" />
                  <span>Escolha uma Experiência para Jogar</span>
                </h4>
                <span className="text-xs text-slate-400 font-semibold">
                  {catalogGames.length} experiências disponíveis
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {otherGames.map((game) => {
                  const likePercent = Math.round((game.likes / (game.likes + (game.dislikes || 500))) * 100);
                  const activePlayers = game.playingCount >= 1000 
                    ? `${(game.playingCount / 1000).toFixed(1)}k` 
                    : `${game.playingCount}`;

                  return (
                    <div
                      key={`card-${game.id}`}
                      onClick={() => handleDirectPlay(game)}
                      className="group bg-[#141620]/90 backdrop-blur-md border border-white/10 hover:border-emerald-500/60 rounded-2xl p-2.5 flex flex-col space-y-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/60">
                        <img 
                          src={game.thumbnail} 
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/src/assets/images/lava_survival_game_1791893717389.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>

                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {game.genre}
                        </div>
                      </div>

                      {/* Game Title & Stats */}
                      <div className="space-y-1">
                        <h5 className="text-xs font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                          {game.title}
                        </h5>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-0.5">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-slate-400" />
                            {likePercent}%
                          </span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Users className="w-3 h-3 text-emerald-400" />
                            {activePlayers}
                          </span>
                        </div>
                      </div>

                      {/* Quick Play button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectPlay(game);
                        }}
                        className="w-full bg-[#1e222f] hover:bg-emerald-600 text-slate-200 hover:text-white py-1.5 rounded-lg text-[11px] font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Jogar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick footer switcher */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Deseja salvar seu avatar personalizado, ter bate-papo e criar mundos no Blox Studio?{' '}
                <button
                  onClick={() => { sounds.playClick(); setView('cadastrar'); }}
                  className="text-[#00a2ff] hover:underline font-bold cursor-pointer"
                >
                  Cadastre-se com seu e-mail
                </button>
                {' '}ou{' '}
                <button
                  onClick={() => { sounds.playClick(); setView('entrar'); }}
                  className="text-[#00a2ff] hover:underline font-bold cursor-pointer"
                >
                  Entre na sua conta
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 2: TELA DE CADASTRAR (AUTHENTIC ROBLOX SIGN UP SCREEN)
            ===================================================================== */}
        {view === 'cadastrar' && (
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#181b24]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
              
              {/* Card Header with Logo */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => { sounds.playClick(); setView('jogar'); }}
                  className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Voltar aos Jogos</span>
                </button>
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  Criar conta
                </h2>
                <div className="w-12" />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {/* Data de nascimento */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block text-[11px]">
                    Data de nascimento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={regDay}
                      onChange={(e) => setRegDay(e.target.value)}
                      className="bg-[#111318] border border-white/15 rounded-xl px-2 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#00a2ff]"
                    >
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={regMonth}
                      onChange={(e) => setRegMonth(e.target.value)}
                      className="bg-[#111318] border border-white/15 rounded-xl px-2 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#00a2ff]"
                    >
                      <option value="01">Jan</option>
                      <option value="02">Fev</option>
                      <option value="03">Mar</option>
                      <option value="04">Abr</option>
                      <option value="05">Mai</option>
                      <option value="06">Jun</option>
                      <option value="07">Jul</option>
                      <option value="08">Ago</option>
                      <option value="09">Set</option>
                      <option value="10">Out</option>
                      <option value="11">Nov</option>
                      <option value="12">Dez</option>
                    </select>

                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="bg-[#111318] border border-white/15 rounded-xl px-2 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#00a2ff]"
                    >
                      {Array.from({ length: 40 }, (_, i) => String(2024 - i)).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nome de usuário */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block text-[11px]">
                    Nome de usuário
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Não use o seu nome real"
                    maxLength={20}
                    required
                    className="w-full bg-[#111318] border border-white/15 rounded-xl px-3 py-2.5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-[#00a2ff] transition-colors"
                  />
                </div>

                {/* E-mail (Exigência do usuário para salvar avatar e criar jogos) */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block text-[11px]">
                    E-mail do jogador
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    required
                    className="w-full bg-[#111318] border border-white/15 rounded-xl px-3 py-2.5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-[#00a2ff] transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Garante acesso ao Chat, personalização de Avatar e criação no Blox Studio.
                  </span>
                </div>

                {/* Senha */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block text-[11px]">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      required
                      className="w-full bg-[#111318] border border-white/15 rounded-xl pl-3 pr-10 py-2.5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-[#00a2ff] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Gênero (opcional) */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block text-[11px]">
                    Gênero (opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegGender(regGender === 'female' ? null : 'female')}
                      className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        regGender === 'female'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-[#111318] border-white/15 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">🚺</span>
                      <span className="text-xs font-bold">Feminino</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegGender(regGender === 'male' ? null : 'male')}
                      className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        regGender === 'male'
                          ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                          : 'bg-[#111318] border-white/15 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">🚹</span>
                      <span className="text-xs font-bold">Masculino</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button (Vibrant Blue - Roblox Mobile Style) */}
                <button
                  type="submit"
                  className="w-full bg-[#3552be] hover:bg-[#2b44a4] text-white py-3 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg shadow-blue-900/30 cursor-pointer pt-2"
                >
                  Criar conta
                </button>

                {/* Direct alternative: Play as Guest */}
                <button
                  type="button"
                  onClick={() => handleDirectPlay()}
                  className="w-full bg-black/40 hover:bg-white/10 text-amber-300 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all border border-amber-500/40 backdrop-blur-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <span>Ou jogue agora mesmo como Visitante</span>
                </button>

                {/* Legal terms disclaimer */}
                <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
                  Ao clicar em Criar conta, você concorda com os{' '}
                  <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#00a2ff] underline">Termos</a>{' '}
                  e entende a{' '}
                  <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#00a2ff] underline">Política de Privacidade</a>.
                </p>
              </form>

              <div className="pt-2 border-t border-white/10 text-center">
                <span className="text-xs text-slate-400">
                  Já possui uma conta?{' '}
                  <button
                    onClick={() => { sounds.playClick(); setView('entrar'); }}
                    className="text-[#00a2ff] font-bold hover:underline cursor-pointer"
                  >
                    Entrar
                  </button>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 3: TELA DE ENTRAR (AUTHENTIC ROBLOX LOGIN SCREEN)
            ===================================================================== */}
        {view === 'entrar' && (
          <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#181b24]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
              
              {/* Back to games header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => { sounds.playClick(); setView('jogar'); }}
                  className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Voltar</span>
                </button>
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  Entrar
                </h2>
                <div className="w-12" />
              </div>

              {errorMsg && (
                <div className="w-full p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Usuário / e-mail / telefone"
                    required
                    className="w-full bg-[#111318]/90 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2ff] transition-colors backdrop-blur-md"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Senha"
                    required
                    className="w-full bg-[#111318]/90 border border-white/20 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2ff] transition-colors backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Entrar Button (Dark slate authentic Roblox style) */}
                <button
                  type="submit"
                  className="w-full bg-[#394254] hover:bg-[#4a556d] text-white py-3 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg cursor-pointer mt-2"
                >
                  Entrar
                </button>

                {/* Acesso rápido (Visitante / Guest) */}
                <button
                  type="button"
                  onClick={() => handleDirectPlay()}
                  className="w-full bg-black/40 hover:bg-white/10 text-white py-3 rounded-xl font-black text-sm tracking-wide transition-all border border-white/50 backdrop-blur-md cursor-pointer"
                >
                  Acesso rápido (Jogar como Visitante)
                </button>

                {/* Links */}
                <div className="flex flex-col items-center gap-2 pt-2 text-xs">
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); setErrorMsg('Digite qualquer nome ou e-mail para conectar.'); }}
                    className="text-slate-400 hover:text-white hover:underline text-[11px]"
                  >
                    Esqueceu a senha ou nome de usuário?
                  </a>

                  <div className="flex items-center gap-4 text-xs font-semibold text-[#00a2ff] pt-1">
                    <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:underline">
                      Termos
                    </a>
                    <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:underline">
                      Privacidade
                    </a>
                  </div>
                </div>
              </form>

              <div className="pt-2 border-t border-white/10 text-center">
                <span className="text-xs text-slate-400">
                  Não possui uma conta?{' '}
                  <button
                    onClick={() => { sounds.playClick(); setView('cadastrar'); }}
                    className="text-[#00a2ff] font-bold hover:underline cursor-pointer"
                  >
                    Cadastre-se
                  </button>
                </span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER: INDICATIVE CLASSIFICATION BADGE (Exact match of Roblox Mobile screen) */}
      <footer className="relative z-30 w-full max-w-sm px-4 pb-6 pt-2 flex flex-col items-center">
        <div className="w-full bg-black/75 backdrop-blur-md border border-white/15 rounded-xl p-2.5 flex flex-col items-center text-center space-y-1 shadow-2xl">
          <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
            CLASSIFICAÇÃO INDICATIVA: 16 ANOS
          </span>
          <div className="w-full bg-white rounded-lg p-1.5 flex items-center justify-center gap-2">
            <span className="w-5 h-5 bg-[#dc2626] text-white font-black text-xs rounded flex items-center justify-center">
              16
            </span>
            <span className="text-xs font-black text-slate-900">
              Violência
            </span>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">
            Interação entre usuários • Compras no jogo (Inclui itens aleatórios)
          </p>
        </div>
      </footer>
    </div>
  );
};
