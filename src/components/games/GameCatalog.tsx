import React, { useState } from 'react';
import { 
  Play, 
  ThumbsUp, 
  Users, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Pencil, 
  Wrench,
  Search,
  CheckCircle2,
  Flame,
  Star,
  Gamepad2,
  Clock,
  Share2
} from 'lucide-react';
import { GameMetadata, GamePass, UserProfile, Friend } from '../../types';
import { sounds } from '../../services/soundEffects';
import { RobloxLogo, RobuxIcon, RobloxVerifiedBadge } from '../common/RobloxIcons';
import { AvatarHeadshot } from '../common/AvatarHeadshot';

interface GameCatalogProps {
  games: GameMetadata[];
  friends?: Friend[];
  currentUser: UserProfile;
  onPlayGame: (game: GameMetadata) => void;
  onEditGame?: (game: GameMetadata) => void;
  onBuyGamePass?: (game: GameMetadata, pass: GamePass) => void;
  onOpenStudio?: () => void;
  userBloxbux: number;
  onGuestActionBlocked?: (type: 'studio' | 'avatar' | 'chat') => void;
  onOpenAuthModal?: () => void;
}

export const GameCatalog: React.FC<GameCatalogProps> = ({
  games,
  friends = [],
  currentUser,
  onPlayGame,
  onEditGame,
  onBuyGamePass,
  onOpenStudio,
  userBloxbux,
  onGuestActionBlocked,
  onOpenAuthModal
}) => {
  const [selectedGameDetails, setSelectedGameDetails] = useState<GameMetadata | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'about' | 'store' | 'servers'>('about');

  // Check if current user is the creator of a given game
  const isGameCreator = (game: GameMetadata | null): boolean => {
    if (!game || !currentUser) return false;
    return (
      game.creator.id === currentUser.id ||
      game.creator.id === 'user-self' ||
      game.creator.username.toLowerCase() === currentUser.username.toLowerCase()
    );
  };

  // Sections
  const featuredGames = games;
  const popularGames = [...games].reverse();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-9 select-none font-sans text-slate-100">
      
      {/* ======================================================== */}
      {/* 2022 ROBLOX HOME GREETING BANNER                          */}
      {/* ======================================================== */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#191b1d] via-[#1e2025] to-[#191b1d] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <AvatarHeadshot
              avatar={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-white/20 shadow-lg"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#191b1d] shadow-sm" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Olá, {currentUser.displayName}!
              </h1>
              <RobloxVerifiedBadge size={18} />
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              @{currentUser.username} • Saldo: <strong className="text-emerald-400 font-bold">{userBloxbux.toLocaleString()} Robux</strong>
            </p>
          </div>
        </div>

        {/* Quick Studio Create CTA */}
        {onOpenStudio && !currentUser.isGuest && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenStudio();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#00a2ff] hover:bg-[#0090e0] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Pencil className="w-4 h-4" />
            <span>Criar no Roblox Studio</span>
          </button>
        )}
      </section>

      {/* ======================================================== */}
      {/* 1. SEÇÃO DE AMIZADES (2022 Friends Carousel)             */}
      {/* ======================================================== */}
      {friends.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 cursor-pointer group w-fit">
            <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#00a2ff] transition-colors">
              Amigos ({friends.length})
            </h2>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <div className="flex items-start gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
            {/* Add Friend Circle */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer w-18">
              <div className="w-16 h-16 rounded-full bg-[#1e2029] border-2 border-dashed border-white/25 group-hover:border-white/60 flex items-center justify-center transition-all group-hover:scale-105 shadow-md">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-white truncate w-full text-center">
                Adicionar...
              </span>
            </div>

            {/* Friends List */}
            {friends.map((friend) => {
              const isOnline = friend.status !== 'offline';
              const isPlaying = friend.status === 'playing';

              return (
                <div 
                  key={friend.id}
                  onClick={() => {
                    sounds.playClick();
                    if (friend.currentGame) {
                      const matchedGame = games.find(g => friend.currentGame?.includes(g.title.slice(0, 8)));
                      if (matchedGame) onPlayGame(matchedGame);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer w-18"
                  title={`${friend.displayName} ${friend.currentGame ? `(Jogando: ${friend.currentGame})` : isOnline ? '(Online)' : '(Offline)'}`}
                >
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/20 group-hover:border-white shadow-md group-hover:scale-105 transition-all text-xl"
                      style={{ backgroundColor: friend.avatarColors.head || '#facc15' }}
                    >
                      <span>{friend.avatarHat || '😄'}</span>
                    </div>

                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#191b1d] shadow-sm animate-pulse" />
                    )}
                  </div>

                  <div className="w-full text-center leading-tight">
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate block">
                      {friend.displayName}
                    </span>
                    {isPlaying && friend.currentGame ? (
                      <span className="text-[9px] text-[#00a2ff] font-semibold truncate block max-w-18">
                        {friend.currentGame}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 2. EXPERIÊNCIAS (2022 Roblox Experience Cards)            */}
      {/* ======================================================== */}
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-[#191b1d] border border-white/10 rounded-3xl space-y-5 shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 bg-black border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
            <RobloxLogo size={44} color="#ffffff" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-white tracking-wide">Nenhuma experiência no momento</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Crie mundos no Roblox Studio 2022 com blocos físicos e scripts Luau para jogá-los com outros jogadores!
            </p>
          </div>
          {onOpenStudio && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenStudio();
              }}
              className="px-6 py-3 rounded-2xl bg-[#00a2ff] hover:bg-[#0090e0] text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-all cursor-pointer"
            >
              Abrir Roblox Studio
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESTAQUES / RECOMENDADOS */}
          <section className="space-y-3.5">
            <div className="flex items-center gap-1.5 cursor-pointer group w-fit">
              <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#00a2ff] transition-colors">
                Destaques
              </h2>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {featuredGames.map((game) => {
                const likePercent = Math.round((game.likes / (game.likes + (game.dislikes || 200))) * 100);
                const activePlayers = game.playingCount >= 1000 
                  ? `${(game.playingCount / 1000).toFixed(1)} mil` 
                  : `${game.playingCount}`;

                return (
                  <div
                    key={`feat-${game.id}`}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedGameDetails(game);
                    }}
                    className="group flex flex-col space-y-2 cursor-pointer transition-transform duration-150 hover:-translate-y-1"
                  >
                    {/* 16:9 Thumbnail */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-[#111216] border border-white/10 group-hover:border-white/30 shadow-md">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            onPlayGame(game);
                          }}
                          className="w-11 h-11 rounded-full bg-[#00b06f] hover:bg-[#00945e] text-white flex items-center justify-center shadow-2xl transform scale-95 group-hover:scale-100 transition-transform cursor-pointer"
                          title="Jogar Agora"
                        >
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-0.5 px-0.5">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#00a2ff] transition-colors leading-tight">
                        {game.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 fill-slate-400/20" />
                          {likePercent}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {activePlayers}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 truncate">
                        Por @{game.creator.username}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* MAIS POPULARES */}
          <section className="space-y-3.5 pt-4">
            <div className="flex items-center gap-1.5 cursor-pointer group w-fit">
              <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#00a2ff] transition-colors">
                Mais Populares
              </h2>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {popularGames.map((game, idx) => {
                const likePercent = Math.round((game.likes / (game.likes + (game.dislikes || 200))) * 100);
                const activePlayers = game.playingCount >= 1000 
                  ? `${(game.playingCount / 1000).toFixed(1)} mil` 
                  : `${game.playingCount}`;

                return (
                  <div
                    key={`pop-${game.id}-${idx}`}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedGameDetails(game);
                    }}
                    className="group flex flex-col space-y-2 cursor-pointer transition-transform duration-150 hover:-translate-y-1"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-[#111216] border border-white/10 group-hover:border-white/30 shadow-md">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 fill-white text-white drop-shadow-md" />
                      </div>
                    </div>

                    <div className="space-y-0.5 px-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#00a2ff] transition-colors leading-tight">
                        {game.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 fill-slate-400/20" />
                          {likePercent}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {activePlayers}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        Por @{game.creator.username}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ======================================================== */}
      {/* 2022 ROBLOX EXPERIENCE DETAIL PAGE MODAL                 */}
      {/* ======================================================== */}
      {selectedGameDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="relative w-full max-w-2xl bg-[#191b1d] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Header Banner */}
            <div className="relative h-60 sm:h-72 w-full bg-[#111216]">
              <img
                src={selectedGameDetails.thumbnail}
                alt={selectedGameDetails.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#191b1d] via-black/40 to-transparent" />
              
              <button
                onClick={() => setSelectedGameDetails(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-colors"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-6 right-6 space-y-1">
                <span className="bg-[#00a2ff] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  {selectedGameDetails.genre}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md leading-tight">
                  {selectedGameDetails.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Por <strong className="text-white">@{selectedGameDetails.creator.username}</strong></span>
                  <RobloxVerifiedBadge size={14} />
                </div>
              </div>
            </div>

            {/* Modal Body & Tabs */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Play & Edit Row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    sounds.playClick();
                    const target = selectedGameDetails;
                    setSelectedGameDetails(null);
                    onPlayGame(target);
                  }}
                  className="flex-1 bg-[#00b06f] hover:bg-[#00945e] text-white py-4 rounded-2xl font-black text-base tracking-wide shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span>JOGAR</span>
                </button>

                {isGameCreator(selectedGameDetails) && !currentUser.isGuest && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      const target = selectedGameDetails;
                      setSelectedGameDetails(null);
                      if (onEditGame) onEditGame(target);
                    }}
                    className="px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
                    title="Editar no Roblox Studio"
                  >
                    <Pencil className="w-4 h-4 text-black" />
                    <span>Editar no Studio</span>
                  </button>
                )}
              </div>

              {/* Detail Tabs: Sobre | Loja | Servidores */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-bold">
                <button
                  onClick={() => setActiveDetailTab('about')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeDetailTab === 'about' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sobre
                </button>
                <button
                  onClick={() => setActiveDetailTab('store')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeDetailTab === 'store' ? 'bg-white/15 text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Loja (Passes)
                </button>
              </div>

              {/* Tab 1: Sobre */}
              {activeDetailTab === 'about' && (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedGameDetails.description}
                  </p>

                  {/* 2022 Experience Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#111216] rounded-2xl border border-white/10 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Ativos</span>
                      <strong className="text-white font-mono text-sm">
                        {selectedGameDetails.playingCount.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Visitas</span>
                      <strong className="text-white font-mono text-sm">
                        {selectedGameDetails.visits.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Avaliação</span>
                      <strong className="text-emerald-400 font-mono text-sm">
                        {Math.round((selectedGameDetails.likes / (selectedGameDetails.likes + (selectedGameDetails.dislikes || 200))) * 100)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Gênero</span>
                      <strong className="text-cyan-400 font-mono text-xs">
                        {selectedGameDetails.genre}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Loja (Game Passes in Robux) */}
              {activeDetailTab === 'store' && (
                <div className="space-y-3">
                  {selectedGameDetails.gamePasses && selectedGameDetails.gamePasses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedGameDetails.gamePasses.map(pass => (
                        <div 
                          key={pass.id}
                          className="p-3 bg-[#111216] border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{pass.icon}</span>
                            <div>
                              <span className="text-xs font-bold text-white block">{pass.title}</span>
                              <span className="text-[10px] text-slate-400">{pass.description}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (onBuyGamePass) onBuyGamePass(selectedGameDetails, pass);
                            }}
                            className="bg-[#00b06f] hover:bg-[#00945e] text-white px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                          >
                            <RobuxIcon size={12} color="#ffffff" />
                            <span>{pass.price}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhum passe cadastrado para esta experiência.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
