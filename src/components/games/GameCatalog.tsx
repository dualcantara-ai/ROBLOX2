import React, { useState } from 'react';
import { 
  Play, 
  ThumbsUp, 
  Users, 
  ChevronRight, 
  Plus, 
  Volume2, 
  Clock, 
  Sparkles, 
  Lock, 
  Pencil, 
  Wrench,
  Search,
  CheckCircle2
} from 'lucide-react';
import { GameMetadata, GamePass, UserProfile, Friend } from '../../types';
import { sounds } from '../../services/soundEffects';

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

  // Check if current user is the creator of a given game
  const isGameCreator = (game: GameMetadata | null): boolean => {
    if (!game || !currentUser) return false;
    return (
      game.creator.id === currentUser.id ||
      game.creator.id === 'user-self' ||
      game.creator.username.toLowerCase() === currentUser.username.toLowerCase()
    );
  };

  // Recomendações: Wide banner rectangular cards (Images 1 - Section 2)
  const recommendedGames = games.slice(0, 12);

  // Continuar: Square game cards (Images 1 - Section 3)
  const continueGames = games.slice(2);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-8 select-none font-sans text-slate-100">
      
      {/* 1. SEÇÃO DE AMIZADES (Exact Match of Screenshot 1 Top Row) */}
      <section className="space-y-3">
        <div className="flex items-center gap-1.5 cursor-pointer group w-fit">
          <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#00a2ff] transition-colors">
            Amizades ({friends.length > 0 ? friends.length : 68})
          </h2>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </div>

        {/* Horizontal Friend Avatars Scroll */}
        <div className="flex items-start gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {/* Add Friend Circle (Screenshot 1: "+ Adicionar...") */}
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
                  {/* Avatar Head Circle with customized colors */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/20 group-hover:border-white shadow-md group-hover:scale-105 transition-all text-xl"
                    style={{ backgroundColor: friend.avatarColors.head || '#facc15' }}
                  >
                    <span>{friend.avatarHat || '😄'}</span>
                  </div>

                  {/* Green Online Dot Indicator (Screenshot 1) */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#111216] shadow-sm animate-pulse" />
                  )}
                </div>

                <div className="w-full text-center leading-tight">
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate block">
                    {friend.displayName}
                  </span>
                  {isPlaying && friend.currentGame ? (
                    <span className="text-[9px] text-amber-400 font-semibold truncate block max-w-18">
                      {friend.currentGame}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. RECOMENDAÇÕES PARA VOCÊ (Exact Match of Screenshot 1 Wide Cards Grid) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer group">
            <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#00a2ff] transition-colors">
              Recomendações para você
            </h2>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* 6 Columns Grid matching Screenshot 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {recommendedGames.map((game, idx) => {
            // Authentic like percentage from data
            const likePercent = Math.round((game.likes / (game.likes + (game.dislikes || 500))) * 100);

            return (
              <div
                key={game.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedGameDetails(game);
                }}
                className="group flex flex-col space-y-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              >
                {/* 16:9 Banner Image (Screenshot 1) */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#181a24] border border-white/10 group-hover:border-white/40 shadow-lg">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Quick Play Hover Overlay Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        onPlayGame(game);
                      }}
                      className="w-11 h-11 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-all cursor-pointer"
                      title="Jogar Agora"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Info Text (Screenshot 1: Title and "👍 Avaliação XX%") */}
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-[#00a2ff] transition-colors leading-tight">
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                    <ThumbsUp className="w-3.5 h-3.5 fill-slate-400/20" />
                    <span>Avaliação {likePercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CONTINUAR (Exact Match of Screenshot 1 Square Cards Row) */}
      <section className="space-y-3.5 pt-2">
        <div className="flex items-center gap-1.5 cursor-pointer group w-fit">
          <h2 className="text-base sm:text-lg font-black text-white group-hover:text-[#00a2ff] transition-colors">
            Continuar
          </h2>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </div>

        {/* Square 1:1 Aspect Ratio Carousel/Grid matching Screenshot 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
          {continueGames.map((game, idx) => {
            const likePercent = Math.round((game.likes / (game.likes + (game.dislikes || 500))) * 100);
            const activePlayers = game.playingCount >= 1000 
              ? `${(game.playingCount / 1000).toFixed(1)} mil` 
              : `${game.playingCount}`;

            return (
              <div
                key={`cont-${game.id}-${idx}`}
                onClick={() => {
                  sounds.playClick();
                  onPlayGame(game);
                }}
                className="group flex flex-col space-y-1.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              >
                {/* Square 1:1 Thumbnail (Screenshot 1 bottom row) */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#181a24] border border-white/10 group-hover:border-white/40 shadow-lg">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 fill-white text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Title & Stats (Screenshot 1: "👍 86%  👥 1,6 mil") */}
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00a2ff] transition-colors leading-tight">
                    {game.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 fill-slate-400/20" />
                      {likePercent}%
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3 h-3" />
                      {activePlayers}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* GAME DETAILS MODAL (When clicking a card to view passes/badges and play) */}
      {selectedGameDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="relative w-full max-w-xl bg-[#181b24] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header Image */}
            <div className="relative h-56 sm:h-64 w-full bg-[#111318]">
              <img
                src={selectedGameDetails.thumbnail}
                alt={selectedGameDetails.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181b24] via-black/30 to-transparent" />
              
              <button
                onClick={() => setSelectedGameDetails(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-colors"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-5 right-5 space-y-1">
                <span className="bg-[#00a2ff] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  {selectedGameDetails.genre}
                </span>
                <h2 className="text-2xl font-black text-white drop-shadow-md leading-tight">
                  {selectedGameDetails.title}
                </h2>
                <p className="text-xs text-slate-300">
                  Por <strong className="text-white">@{selectedGameDetails.creator.username}</strong>
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedGameDetails.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#111318] rounded-2xl border border-white/10 text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Jogando</span>
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
                    {Math.round((selectedGameDetails.likes / (selectedGameDetails.likes + (selectedGameDetails.dislikes || 500))) * 100)}%
                  </strong>
                </div>
              </div>

              {/* Game passes if any */}
              {selectedGameDetails.gamePasses && selectedGameDetails.gamePasses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Game Passes da Experiência
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedGameDetails.gamePasses.map(pass => (
                      <div 
                        key={pass.id}
                        className="p-3 bg-[#111318] border border-white/10 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{pass.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">{pass.title}</span>
                            <span className="text-[10px] text-slate-400">{pass.description}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (onBuyGamePass) onBuyGamePass(selectedGameDetails, pass);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-black shrink-0 transition-colors cursor-pointer"
                        >
                          B$ {pass.price}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest reminder banner if user is a guest */}
              {currentUser.isGuest && (
                <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">😄</span>
                    <div className="leading-tight">
                      <strong className="text-amber-300 block">Jogando como Visitante</strong>
                      <span className="text-[11px] text-amber-200/80">Avatar Noob padrão. Chat e Blox Studio desativados.</span>
                    </div>
                  </div>
                  {onOpenAuthModal && (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setSelectedGameDetails(null);
                        onOpenAuthModal();
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-900 font-black px-3 py-1.5 rounded-xl shrink-0 cursor-pointer text-xs shadow-md transition-all"
                    >
                      Criar Conta
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    const target = selectedGameDetails;
                    setSelectedGameDetails(null);
                    onPlayGame(target);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-2xl font-black text-sm tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>JOGAR AGORA</span>
                </button>

                {isGameCreator(selectedGameDetails) && !currentUser.isGuest && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      const target = selectedGameDetails;
                      setSelectedGameDetails(null);
                      if (onEditGame) onEditGame(target);
                    }}
                    className="px-5 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
                    title="Editar experiência no Blox Studio"
                  >
                    <Pencil className="w-4 h-4 text-black" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
