import React from 'react';
import { 
  Home, 
  User, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Layers, 
  Repeat, 
  ShieldCheck, 
  Wrench, 
  Settings, 
  Lock,
  Pencil
} from 'lucide-react';
import { UserProfile } from '../../types';
import { sounds } from '../../services/soundEffects';
import { RobloxPremiumIcon, RobloxStudioLogo } from '../common/RobloxIcons';
import { AvatarHeadshot } from '../common/AvatarHeadshot';

interface LeftSidebarProps {
  activeTab: 'discover' | 'studio' | 'shop' | 'avatar' | 'social';
  onSelectTab: (tab: 'discover' | 'studio' | 'shop' | 'avatar' | 'social') => void;
  user: UserProfile;
  hasCreatedGames?: boolean;
  onEditGame?: () => void;
  onGuestActionBlocked?: (type: 'studio' | 'avatar' | 'chat') => void;
  onOpenAuthModal?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenEconomy?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  hasCreatedGames = false,
  onEditGame,
  onGuestActionBlocked,
  onOpenAuthModal,
  isOpen = false,
  onClose,
  onOpenEconomy
}) => {
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

  const menuItems = [
    {
      id: 'home',
      label: 'Início',
      icon: <Home className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('discover'); },
      isActive: activeTab === 'discover'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('avatar'); },
      isActive: activeTab === 'avatar'
    },
    {
      id: 'messages',
      label: 'Mensagens',
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('social'); },
      isActive: activeTab === 'social'
    },
    {
      id: 'friends',
      label: 'Amigos',
      icon: <Users className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('social'); },
      isActive: false
    },
    {
      id: 'avatar',
      label: 'Avatar',
      icon: <Sparkles className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('avatar'); },
      isActive: false
    },
    {
      id: 'inventory',
      label: 'Inventário',
      icon: <Layers className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('shop'); },
      isActive: activeTab === 'shop'
    },
    {
      id: 'trade',
      label: 'Trocas',
      icon: <Repeat className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('shop'); },
      isActive: false
    },
    {
      id: 'groups',
      label: 'Grupos',
      icon: <ShieldCheck className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('social'); },
      isActive: false
    },
    {
      id: 'studio',
      label: 'Criar',
      icon: user.isGuest ? (
        <Lock className="w-5 h-5 text-amber-400" />
      ) : hasCreatedGames ? (
        <Pencil className="w-5 h-5 text-amber-400" />
      ) : (
        <RobloxStudioLogo size={20} />
      ),
      onClick: handleStudioClick,
      isActive: activeTab === 'studio'
    }
  ];

  return (
    <>
      {/* Expanded Left Drawer Overlay on Mobile or when toggled */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Drawer Container */}
      <aside 
        className={`fixed md:sticky top-[60px] h-[calc(100vh-60px)] z-40 select-none bg-[#191b1d] border-r border-[#2b2d31] transition-all duration-200 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 ${
          isOpen ? 'w-64 left-0 shadow-2xl' : 'hidden md:flex md:w-16 -left-64 md:left-0'
        }`}
      >
        <div className="py-3 px-2 space-y-1">
          {/* User mini badge when expanded */}
          {isOpen && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-[#111216] rounded-xl border border-white/5">
              <AvatarHeadshot
                avatar={user.avatar}
                alt={user.displayName}
                className="w-10 h-10 rounded-full border-2 border-white/20 shadow"
              />
              <div className="overflow-hidden">
                <p className="font-extrabold text-sm text-white truncate">{user.displayName}</p>
                <p className="text-xs text-slate-400 truncate">@{user.username}</p>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer group ${
                item.isActive
                  ? 'bg-white/10 text-white font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              } ${!isOpen ? 'justify-center px-0' : ''}`}
              title={item.label}
            >
              <div className={`transition-transform duration-150 group-hover:scale-110 ${
                item.isActive ? 'text-[#00a2ff]' : 'text-slate-400 group-hover:text-white'
              }`}>
                {item.icon}
              </div>
              {isOpen && (
                <span className="truncate tracking-wide">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Premium Card (Authentic Roblox 2022) */}
        <div className="p-3 border-t border-white/10">
          {isOpen ? (
            <div 
              onClick={() => {
                sounds.playClick();
                if (onOpenEconomy) onOpenEconomy();
              }}
              className="bg-gradient-to-br from-[#232733] to-[#161820] border border-amber-500/30 hover:border-amber-400/60 p-3 rounded-2xl transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <RobloxPremiumIcon size={18} />
                <span className="font-black text-xs text-white">Roblox Premium</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Ganhe Robux mensais e itens exclusivos!
              </p>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                if (onOpenEconomy) onOpenEconomy();
              }}
              className="w-10 h-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto transition-transform hover:scale-105 cursor-pointer"
              title="Roblox Premium"
            >
              <RobloxPremiumIcon size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
