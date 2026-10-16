import React from 'react';
import { 
  Gamepad2, 
  Wrench, 
  Pencil,
  ShoppingBag, 
  User, 
  Users, 
  Coins, 
  Gift, 
  Volume2, 
  VolumeX, 
  Search, 
  Plus,
  Sparkles,
  Mail,
  LogOut,
  Lock,
  ChevronDown,
  Settings,
  Bell
} from 'lucide-react';
import { UserProfile } from '../../types';
import { sounds } from '../../services/soundEffects';

interface NavbarProps {
  activeTab: 'discover' | 'studio' | 'shop' | 'avatar' | 'social';
  onSelectTab: (tab: 'discover' | 'studio' | 'shop' | 'avatar' | 'social') => void;
  user: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenEconomy: () => void;
  canClaimDaily: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasCreatedGames?: boolean;
  onEditGame?: () => void;
  onOpenAuthModal?: () => void;
  onGuestActionBlocked?: (type: 'studio' | 'avatar' | 'chat') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  soundEnabled,
  onToggleSound,
  onOpenEconomy,
  canClaimDaily,
  searchQuery,
  onSearchChange,
  hasCreatedGames = false,
  onEditGame,
  onOpenAuthModal,
  onGuestActionBlocked,
  onLogout
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  const handleStudioClick = () => {
    sounds.playClick();
    if (user.isGuest) {
      if (onGuestActionBlocked) {
        onGuestActionBlocked('studio');
      } else if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    if (hasCreatedGames && onEditGame) {
      onEditGame();
    } else {
      onSelectTab('studio');
    }
  };
  return (
    <>
      <header className="h-16 bg-[#181a20] border-b border-[#242733] px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 sticky top-0 z-40 select-none shadow-md">
      {/* Brand: BASEHUB */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            sounds.playClick();
            onSelectTab('discover');
          }}
          className="flex items-center gap-2 group focus:outline-none cursor-pointer"
        >
          {/* Basehub iconic black logo */}
          <div className="w-8 h-8 bg-black border border-white/30 rounded-lg flex items-center justify-center transform -rotate-12 shadow-lg group-hover:rotate-0 transition-transform">
            <div className="w-2.5 h-2.5 bg-[#181a20] rounded-[2px] transform rotate-12" />
          </div>
          <div className="flex items-center gap-1.5 font-sans">
            <span className="font-black text-xl tracking-wider text-white">BASEHUB</span>
          </div>
        </button>
      </div>

      {/* Centered Search Bar: "Buscar" (Exact Match of Screenshot 1) */}
      <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-xl mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar"
            className="w-full bg-[#111216] border border-white/10 hover:border-white/25 text-xs sm:text-sm rounded-full pl-9 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#00a2ff] transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Right Controls: User Profile, Settings, Notifications, Wallet (Screenshot 1) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* BloxBux Wallet Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenEconomy();
          }}
          className="flex items-center gap-1.5 bg-[#121318] hover:bg-[#1a1d26] border border-[#2b2f3c] hover:border-[#00a2ff]/60 px-2.5 py-1.5 rounded-xl transition-all shadow-sm group cursor-pointer"
        >
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[10px] border border-emerald-500/40 group-hover:scale-105 transition-transform">
            B$
          </div>
          <span className="font-extrabold text-xs text-emerald-400 tracking-wide font-mono">
            {user.bloxbux.toLocaleString()}
          </span>
        </button>

        {/* Daily Reward Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenEconomy();
          }}
          className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
            canClaimDaily
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              : 'bg-[#20232e] text-slate-400 border-[#2b2f3c] hover:text-white'
          }`}
          title="Recompensa Diária"
        >
          <Gift className="w-4 h-4" />
          {canClaimDaily && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* Audio Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-[#20232e] hover:bg-[#272b38] border border-[#2b2f3c] text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
          title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Efeitos'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Notification Bell with Badge "2" (Screenshot 1) */}
        <button
          onClick={() => {
            sounds.playClick();
            onSelectTab('social');
          }}
          className="relative p-2 rounded-xl bg-[#20232e] hover:bg-[#272b38] border border-[#2b2f3c] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#00a2ff] text-white font-black text-[9px] flex items-center justify-center shadow-md">
            2
          </span>
        </button>

        {/* Settings Gear Icon (Screenshot 1) */}
        <button
          onClick={() => {
            sounds.playClick();
            setProfileDropdownOpen(prev => !prev);
          }}
          className="p-2 rounded-xl bg-[#20232e] hover:bg-[#272b38] border border-[#2b2f3c] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Configurações da Conta"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Quick Studio / Create or Edit Button (Always visible on all screens) */}
        <button
          onClick={handleStudioClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-[#00a2ff] text-white shadow-[#00a2ff]/30 ring-2 ring-[#00a2ff]/50'
              : user.isGuest
              ? 'bg-[#252836] hover:bg-[#2e3344] text-slate-300 hover:text-white border border-white/10'
              : hasCreatedGames
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-[1.02] ring-1 ring-amber-300 font-black'
              : 'bg-gradient-to-r from-[#00a2ff] to-[#0070f3] hover:from-[#38bdf8] hover:to-[#00a2ff] text-white shadow-cyan-500/20 hover:shadow-cyan-500/40 transform hover:scale-[1.02]'
          }`}
          title={user.isGuest ? "Criação de jogos bloqueada para Visitantes" : hasCreatedGames ? "Editar suas experiências no Blox Studio" : "Abrir Studio / Criar Jogos (Create)"}
        >
          {user.isGuest ? (
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          ) : hasCreatedGames ? (
            <Pencil className="w-3.5 h-3.5 text-black" />
          ) : (
            <Wrench className="w-3.5 h-3.5" />
          )}
          <span>{user.isGuest ? 'Criar 🔒' : hasCreatedGames ? 'Editar' : 'Criar'}</span>
        </button>

        {/* Guest "Entrar com Email" Upgrade Prompt in Navbar */}
        {user.isGuest && (
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenAuthModal) onOpenAuthModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black shadow-md shadow-amber-500/20 transition-all transform hover:scale-[1.02] cursor-pointer"
            title="Cadastrar email para desbloquear avatar, chat e studio!"
          >
            <Mail className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">Entrar com Email</span>
            <span className="sm:hidden">Entrar</span>
          </button>
        )}

        {/* Audio Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-[#20232e] hover:bg-[#272b38] border border-[#2b2f3c] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* User Mini Card with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              sounds.playClick();
              setProfileDropdownOpen(prev => !prev);
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-[#20232e] hover:bg-[#262a37] border border-[#2b2f3c] transition-all cursor-pointer"
          >
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/20 text-xs font-bold text-slate-900 shadow-inner"
              style={{ backgroundColor: user.avatar.bodyColors.head }}
            >
              {user.isGuest ? '🟡' : '😄'}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-xs text-slate-200 hidden md:block max-w-[90px] truncate leading-tight">
                {user.displayName}
              </span>
              {user.isGuest ? (
                <span className="text-[9px] font-black text-amber-400 hidden md:block leading-none uppercase">
                  Visitante
                </span>
              ) : null}
            </div>
            {user.isGuest ? (
              <span className="bg-amber-500/20 border border-amber-500/40 text-[9px] font-black text-amber-300 px-1 py-0.2 rounded font-mono md:hidden">
                GUEST
              </span>
            ) : user.isPremium ? (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black text-black px-1.5 py-0.2 rounded font-mono">
                PRO
              </span>
            ) : null}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Popover Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-12 w-64 bg-[#181a24] border border-[#2b2f3f] rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/20 text-sm shadow-inner"
                  style={{ backgroundColor: user.avatar.bodyColors.head }}
                >
                  {user.isGuest ? '🟡' : '😄'}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-xs text-white truncate">{user.displayName}</h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.isGuest ? 'Visitante (Modo Noob)' : user.email || `@${user.username}`}
                  </p>
                </div>
              </div>

              {user.isGuest ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 space-y-2 text-xs">
                  <p className="text-[11px] text-amber-300 leading-tight">
                    Visitantes não podem personalizar o avatar, usar o chat ou criar experiências.
                  </p>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="w-full bg-[#00a2ff] hover:bg-[#0090e0] text-white py-1.5 rounded-lg font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Entrar com Email</span>
                  </button>
                </div>
              ) : null}

              <div className="space-y-1">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setProfileDropdownOpen(false);
                    onSelectTab('avatar');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#00a2ff]" />
                  <span>Ver Avatar</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setProfileDropdownOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sair / Alternar Conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile & Tablet Bottom Navigation Bar (Visible on < lg screens when not in Studio) */}
    {activeTab !== 'studio' && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161820]/95 backdrop-blur-md border-t border-[#262934] px-2 py-1.5 flex items-center justify-around shadow-2xl select-none">
        <button
          onClick={() => { sounds.playClick(); onSelectTab('discover'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'discover'
              ? 'text-[#00a2ff]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px]">Descobrir</span>
        </button>

        <button
          onClick={handleStudioClick}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl text-xs font-black transition-all -translate-y-0.5 active:scale-95 ${
            user.isGuest
              ? 'bg-[#222533] text-amber-400 border border-amber-500/40'
              : hasCreatedGames
              ? 'bg-[#2b2416] text-amber-300 border border-amber-500/50 hover:bg-[#382f1d]'
              : 'bg-[#222533] text-[#00a2ff] border border-[#00a2ff]/40 hover:bg-[#2b2f42]'
          }`}
        >
          {user.isGuest ? (
            <Lock className="w-5 h-5 text-amber-400" />
          ) : hasCreatedGames ? (
            <Pencil className="w-5 h-5 text-amber-400" />
          ) : (
            <Wrench className="w-5 h-5" />
          )}
          <span className="text-[11px] tracking-wide">{user.isGuest ? 'CRIAR 🔒' : hasCreatedGames ? 'EDITAR' : 'CRIAR'}</span>
        </button>

        <button
          onClick={() => { sounds.playClick(); onSelectTab('shop'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'shop'
              ? 'text-[#00a2ff]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Loja</span>
        </button>

        <button
          onClick={() => { sounds.playClick(); onSelectTab('avatar'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'avatar'
              ? 'text-[#00a2ff]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Avatar</span>
        </button>

        <button
          onClick={() => { sounds.playClick(); onSelectTab('social'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'social'
              ? 'text-[#00a2ff]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Amigos</span>
        </button>
      </nav>
    )}
  </>
  );
};
