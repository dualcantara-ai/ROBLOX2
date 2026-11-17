import React, { useState } from 'react';
import { 
  Menu,
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Sparkles,
  ExternalLink,
  HelpCircle,
  Shield,
  Pencil,
  Lock,
  Volume2,
  VolumeX,
  Gift
} from 'lucide-react';
import { UserProfile } from '../../types';
import { sounds } from '../../services/soundEffects';
import { RobloxLogo, RobloxWordmark, RobuxIcon } from '../common/RobloxIcons';
import { AvatarHeadshot } from '../common/AvatarHeadshot';

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
  onToggleSidebar?: () => void;
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
  onLogout,
  onToggleSidebar
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

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
      <header className="h-[60px] bg-[#191b1d] border-b border-[#2b2d31] px-3 sm:px-5 flex items-center justify-between gap-3 sticky top-0 z-40 select-none shadow-md text-white font-sans">
        
        {/* LEFT: Hamburger Menu & Official 2022 Roblox Logo & Primary Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {/* Hamburger Sidebar Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onToggleSidebar) onToggleSidebar();
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Official 2022 Roblox Logo */}
          <button
            onClick={() => {
              sounds.playClick();
              onSelectTab('discover');
            }}
            className="flex items-center gap-2 group focus:outline-none cursor-pointer"
          >
            <RobloxWordmark height={26} />
          </button>

          {/* Desktop Navigation Tabs: Descobrir | Loja do Avatar | Criar | Robux */}
          <nav className="hidden lg:flex items-center gap-1 font-semibold text-sm">
            <button
              onClick={() => {
                sounds.playClick();
                onSelectTab('discover');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'discover'
                  ? 'text-white font-black border-b-2 border-white rounded-b-none'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Descobrir
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onSelectTab('shop');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'shop'
                  ? 'text-white font-black border-b-2 border-white rounded-b-none'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Loja do Avatar
            </button>

            <button
              onClick={handleStudioClick}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'studio'
                  ? 'text-white font-black border-b-2 border-white rounded-b-none'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Criar
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onOpenEconomy();
              }}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Robux</span>
            </button>
          </nav>
        </div>

        {/* CENTER: Search Bar with 2022 Roblox rounded-full style and keyboard shortcut */}
        <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2 sm:mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar"
              className="w-full bg-[#111216] border border-white/10 hover:border-white/20 text-xs sm:text-sm rounded-full pl-9 pr-8 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#00a2ff] transition-all shadow-inner"
            />
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
              /
            </span>
          </div>
        </div>

        {/* RIGHT: Notifications, Robux Pill, Settings, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Robux Balance & Buy Button (2022 Hexagonal Coin) */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenEconomy();
            }}
            className="flex items-center gap-1.5 bg-[#121316] hover:bg-[#202229] border border-white/10 hover:border-white/25 px-2.5 sm:px-3 py-1.5 rounded-full transition-all group cursor-pointer shadow-sm"
            title="Comprar Robux"
          >
            <RobuxIcon size={18} color="#00e676" className="group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
              {user.bloxbux.toLocaleString()}
            </span>
          </button>

          {/* Daily Reward Gift Box */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenEconomy();
            }}
            className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
              canClaimDaily
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
            }`}
            title="Recompensa Diária de Robux"
          >
            <Gift className="w-4 h-4" />
            {canClaimDaily && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            )}
          </button>

          {/* Audio FX Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:block"
            title={soundEnabled ? 'Silenciar Efeitos Sonoros' : 'Ativar Efeitos Sonoros'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Notifications Bell (2022 Style) */}
          <button
            onClick={() => {
              sounds.playClick();
              onSelectTab('social');
            }}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-[#00a2ff]" />
          </button>

          {/* Settings Gear Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                sounds.playClick();
                setSettingsDropdownOpen(prev => !prev);
                setProfileDropdownOpen(false);
              }}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>

            {settingsDropdownOpen && (
              <div className="absolute right-0 top-12 w-52 bg-[#191b1d] border border-white/15 rounded-xl py-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSettingsDropdownOpen(false);
                    onSelectTab('avatar');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#00a2ff]" />
                  <span>Configurações</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSettingsDropdownOpen(false);
                    onOpenEconomy();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 text-left cursor-pointer"
                >
                  <RobuxIcon size={14} color="#00e676" />
                  <span>Comprar Robux</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSettingsDropdownOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Desconectar-se</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Thumbnail & Quick Menu */}
          <div className="relative">
            <button
              onClick={() => {
                sounds.playClick();
                setProfileDropdownOpen(prev => !prev);
                setSettingsDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
              title={user.displayName}
            >
              <div className="relative">
                <AvatarHeadshot
                  avatar={user.avatar}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border-2 border-white/20 shadow-md"
                />
                {/* Green Online Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-[#191b1d]" />
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#191b1d] border border-white/15 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <AvatarHeadshot
                    avatar={user.avatar}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full border-2 border-white/20 shadow-inner"
                  />
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-sm text-white truncate">{user.displayName}</h4>
                    <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setProfileDropdownOpen(false);
                      onSelectTab('avatar');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#00a2ff]" />
                    <span>Personalizar Avatar</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setProfileDropdownOpen(false);
                      onSelectTab('social');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Amigos & Grupos</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setProfileDropdownOpen(false);
                      onOpenEconomy();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 text-left cursor-pointer"
                  >
                    <RobuxIcon size={16} color="#00e676" />
                    <span>Saldo: {user.bloxbux.toLocaleString()} Robux</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setProfileDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Bottom Navigation Bar (Roblox Mobile App style) */}
      {activeTab !== 'studio' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#191b1d]/98 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl select-none">
          <button
            onClick={() => { sounds.playClick(); onSelectTab('discover'); }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'discover' ? 'text-[#00a2ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RobloxLogo size={20} color={activeTab === 'discover' ? '#00a2ff' : '#94a3b8'} />
            <span className="text-[10px]">Descobrir</span>
          </button>

          <button
            onClick={handleStudioClick}
            className="flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl text-xs font-black transition-all text-[#888888] hover:text-white"
          >
            <Pencil className="w-5 h-5" />
            <span className="text-[10px]">Criar</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); onSelectTab('shop'); }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shop' ? 'text-[#00a2ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">Loja</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); onSelectTab('avatar'); }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'avatar' ? 'text-[#00a2ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Avatar</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); onOpenEconomy(); }}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold text-emerald-400"
          >
            <RobuxIcon size={18} color="#00e676" />
            <span className="text-[10px]">Robux</span>
          </button>
        </nav>
      )}
    </>
  );
};
