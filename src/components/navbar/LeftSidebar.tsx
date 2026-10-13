import React from 'react';
import { 
  Home, 
  Sparkles, 
  MessageSquare, 
  User, 
  Wrench, 
  MoreHorizontal,
  Lock,
  Pencil
} from 'lucide-react';
import { UserProfile } from '../../types';
import { sounds } from '../../services/soundEffects';

interface LeftSidebarProps {
  activeTab: 'discover' | 'studio' | 'shop' | 'avatar' | 'social';
  onSelectTab: (tab: 'discover' | 'studio' | 'shop' | 'avatar' | 'social') => void;
  user: UserProfile;
  hasCreatedGames?: boolean;
  onEditGame?: () => void;
  onGuestActionBlocked?: (type: 'studio' | 'avatar' | 'chat') => void;
  onOpenAuthModal?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  hasCreatedGames = false,
  onEditGame,
  onGuestActionBlocked,
  onOpenAuthModal
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

  const navItems = [
    {
      id: 'discover' as const,
      label: 'Início',
      icon: <Home className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('discover'); },
      isActive: activeTab === 'discover'
    },
    {
      id: 'shop' as const,
      label: 'Destaques',
      icon: <Sparkles className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('shop'); },
      isActive: activeTab === 'shop'
    },
    {
      id: 'social' as const,
      label: 'Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('social'); },
      isActive: activeTab === 'social'
    },
    {
      id: 'avatar' as const,
      label: 'Eu',
      icon: <User className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('avatar'); },
      isActive: activeTab === 'avatar'
    },
    {
      id: 'studio' as const,
      label: 'Studio',
      icon: user.isGuest ? (
        <Lock className="w-5 h-5 text-amber-400" />
      ) : hasCreatedGames ? (
        <Pencil className="w-5 h-5 text-amber-400" />
      ) : (
        <Wrench className="w-5 h-5" />
      ),
      onClick: handleStudioClick,
      isActive: activeTab === 'studio'
    },
    {
      id: 'more' as const,
      label: 'Mais',
      icon: <MoreHorizontal className="w-5 h-5" />,
      onClick: () => { sounds.playClick(); onSelectTab('social'); },
      isActive: false
    }
  ];

  return (
    <aside className="hidden md:flex flex-col items-center py-4 px-2 w-18 shrink-0 border-r border-[#222533] bg-[#111216] select-none sticky top-16 h-[calc(100vh-4rem)] z-30">
      <nav className="flex flex-col items-center gap-4 w-full">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-2.5 rounded-2xl transition-all cursor-pointer group ${
              item.isActive
                ? 'bg-[#222533] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={item.label}
          >
            <div className={`transition-transform duration-200 group-hover:scale-110 ${
              item.isActive ? 'text-[#00a2ff]' : 'text-slate-300 group-hover:text-white'
            }`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold tracking-tight">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
