/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GameMetadata, 
  UserProfile, 
  Friend, 
  Group, 
  ShopItem, 
  AvatarAppearance, 
  GamePass 
} from './types';
import { 
  loadUser, 
  saveUser, 
  loadGames, 
  saveGames, 
  loadFriends, 
  saveFriends, 
  loadGroups, 
  saveGroups, 
  loadShopItems, 
  saveShopItems,
  hasCompletedAuth,
  setAuthStatus,
  clearAuthStatus,
  createGuestUser,
  createUserFromEmail
} from './services/storage';
import { sounds } from './services/soundEffects';
import { Navbar } from './components/navbar/Navbar';
import { GameCatalog } from './components/games/GameCatalog';
import { ActiveGameModal } from './components/games/ActiveGameModal';
import { BloxStudio } from './components/studio/BloxStudio';
import { AvatarShop } from './components/shop/AvatarShop';
import { AvatarCustomizer } from './components/avatar/AvatarCustomizer';
import { SocialHub } from './components/social/SocialHub';
import { EconomyModal } from './components/economy/EconomyModal';
import { AuthModal } from './components/auth/AuthModal';
import { GuestRestrictionModal, GuestRestrictionType } from './components/auth/GuestRestrictionModal';
import { LeftSidebar } from './components/navbar/LeftSidebar';

export default function App() {
  const [user, setUser] = useState<UserProfile>(loadUser);
  const [games, setGames] = useState<GameMetadata[]>(loadGames);
  const [friends, setFriends] = useState<Friend[]>(loadFriends);
  const [groups, setGroups] = useState<Group[]>(loadGroups);
  const [shopItems, setShopItems] = useState<ShopItem[]>(loadShopItems);

  // Authentication State: On first-time entry, show login/guest selection
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !hasCompletedAuth());
  const [authModalMode, setAuthModalMode] = useState<'select' | 'email' | 'guest'>('select');
  const [guestRestriction, setGuestRestriction] = useState<GuestRestrictionType | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<'discover' | 'studio' | 'shop' | 'avatar' | 'social'>('discover');
  
  // Game Play & Edit State
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);
  const [editingGame, setEditingGame] = useState<GameMetadata | null>(null);
  const [activePasses, setActivePasses] = useState<string[]>([]);

  // Search & Economy
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEconomyOpen, setIsEconomyOpen] = useState<boolean>(false);
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync state to LocalStorage
  useEffect(() => {
    saveUser(user);
  }, [user]);

  useEffect(() => {
    saveGames(games);
  }, [games]);

  useEffect(() => {
    saveFriends(friends);
  }, [friends]);

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  // Audio mute/unmute
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sounds.setSoundEnabled(newState);
  };

  // Auth Handlers
  const handleLoginWithEmail = (email: string, username?: string) => {
    const newUser = createUserFromEmail(email, username);
    setUser(newUser);
    setAuthStatus('email');
    setIsAuthModalOpen(false);
    setGuestRestriction(null);
  };

  const handleContinueAsGuest = () => {
    const guestUser = createGuestUser();
    setUser(guestUser);
    setAuthStatus('guest');
    setIsAuthModalOpen(false);
    setGuestRestriction(null);
    if (activeTab === 'studio') {
      setActiveTab('discover');
    }
  };

  const handleLogout = () => {
    clearAuthStatus();
    setAuthModalMode('select');
    setIsAuthModalOpen(true);
  };

  const handleOpenEmailAuth = () => {
    setAuthModalMode('email');
    setIsAuthModalOpen(true);
  };

  const handleGuestActionBlocked = (type: GuestRestrictionType) => {
    setGuestRestriction(type);
  };

  // Launch Game
  const handlePlayGame = (game: GameMetadata) => {
    setActiveGame(game);
  };

  // Buy Gamepass
  const handleBuyGamePass = (game: GameMetadata, pass: GamePass) => {
    if (user.bloxbux < pass.price) {
      setIsEconomyOpen(true);
      return;
    }
    sounds.playPurchase();
    setUser(prev => ({ ...prev, bloxbux: prev.bloxbux - pass.price }));
    setActivePasses(prev => [...prev, pass.benefit]);
  };

  // Rewards inside game
  const handleRewardCoins = (amount: number) => {
    setUser(prev => ({ ...prev, bloxbux: prev.bloxbux + amount }));
  };

  // Edit Game in Studio
  const handleEditGame = (gameToEdit: GameMetadata) => {
    if (user.isGuest) {
      handleGuestActionBlocked('studio');
      return;
    }
    setEditingGame(gameToEdit);
    setActiveTab('studio');
  };

  // Publish / Save Game in Studio
  const handlePublishGame = (savedGame: GameMetadata) => {
    setGames(prev => {
      const idx = prev.findIndex(g => g.id === savedGame.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = savedGame;
        return copy;
      }
      return [savedGame, ...prev];
    });
    setEditingGame(null);
    setActiveTab('discover');
  };

  // Avatar Shop Purchase
  const handlePurchaseShopItem = (item: ShopItem) => {
    if (user.bloxbux < item.price) return;
    setUser(prev => ({
      ...prev,
      bloxbux: prev.bloxbux - item.price,
      inventory: [...prev.inventory, item.id]
    }));
  };

  // Avatar Outfit Update
  const handleSaveAvatar = (newAvatar: AvatarAppearance) => {
    if (user.isGuest) {
      handleGuestActionBlocked('avatar');
      return;
    }
    setUser(prev => ({
      ...prev,
      avatar: newAvatar
    }));
  };

  // Social: Add Friend
  const handleAddFriend = (friendUsername: string) => {
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      username: friendUsername,
      displayName: friendUsername,
      status: 'online',
      avatarColors: {
        head: '#facc15',
        torso: '#3b82f6',
        leftArm: '#facc15',
        rightArm: '#facc15',
        leftLeg: '#16a34a',
        rightLeg: '#16a34a'
      },
      lastSeen: 'Just now'
    };
    setFriends(prev => [newFriend, ...prev]);
  };

  // Social: Join Friend Game
  const handleJoinFriendGame = (gameTitle: string) => {
    const targetGame = games.find(g => g.title === gameTitle) || games[0];
    if (targetGame) {
      setActiveGame(targetGame);
    }
  };

  // Social: Post on Group Wall
  const handlePostGroupWall = (groupId: string, text: string) => {
    setGroups(prev => prev.map(grp => {
      if (grp.id === groupId) {
        return {
          ...grp,
          wallPosts: [
            {
              id: `wp-${Date.now()}`,
              author: user.username,
              content: text,
              timestamp: 'Just now',
              rank: 'Member'
            },
            ...grp.wallPosts
          ]
        };
      }
      return grp;
    }));
  };

  // Social: Join Group
  const handleJoinGroup = (groupId: string) => {
    setGroups(prev => prev.map(grp => {
      if (grp.id === groupId) {
        return { ...grp, joined: true, memberCount: grp.memberCount + 1 };
      }
      return grp;
    }));
  };

  // Economy: Add BloxBux
  const handleAddBloxbux = (amount: number) => {
    setUser(prev => ({ ...prev, bloxbux: prev.bloxbux + amount }));
  };

  // Economy: Claim Daily Reward
  const handleClaimDaily = (amount: number) => {
    setUser(prev => ({ ...prev, bloxbux: prev.bloxbux + amount }));
    setCanClaimDaily(false);
  };

  // Search filtered games
  const displayGames = searchQuery.trim()
    ? games.filter(g => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.creator.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : games;

  // Games created by current player
  const userCreatedGames = games.filter(
    g => g.creator.id === 'user-self' || 
         g.creator.id === user.id || 
         g.creator.username.toLowerCase() === user.username.toLowerCase()
  );
  const hasCreatedGames = userCreatedGames.length > 0;

  return (
    <div className="min-h-screen bg-[#111216] text-[#e3e5e8] flex flex-col font-sans">
      {/* Top Universal Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'studio' && user.isGuest) {
            handleGuestActionBlocked('studio');
            return;
          }
          if (tab === 'studio' && userCreatedGames.length > 0) {
            setEditingGame(userCreatedGames[0]);
          }
          setActiveTab(tab);
        }}
        user={user}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenEconomy={() => setIsEconomyOpen(true)}
        canClaimDaily={canClaimDaily}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasCreatedGames={hasCreatedGames}
        onEditGame={() => {
          if (user.isGuest) {
            handleGuestActionBlocked('studio');
            return;
          }
          if (userCreatedGames.length > 0) {
            handleEditGame(userCreatedGames[0]);
          } else {
            setEditingGame(null);
            setActiveTab('studio');
          }
        }}
        onOpenAuthModal={handleOpenEmailAuth}
        onGuestActionBlocked={handleGuestActionBlocked}
        onLogout={handleLogout}
      />

      {/* Main Content Area with Left Sidebar (Screenshot 1 Layout) */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab !== 'studio' && (
          <LeftSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (tab === 'studio' && user.isGuest) {
                handleGuestActionBlocked('studio');
                return;
              }
              if (tab === 'studio' && userCreatedGames.length > 0) {
                setEditingGame(userCreatedGames[0]);
              }
              setActiveTab(tab);
            }}
            user={user}
            hasCreatedGames={hasCreatedGames}
            onEditGame={() => {
              if (userCreatedGames.length > 0) {
                handleEditGame(userCreatedGames[0]);
              } else {
                setEditingGame(null);
                setActiveTab('studio');
              }
            }}
            onGuestActionBlocked={handleGuestActionBlocked}
            onOpenAuthModal={handleOpenEmailAuth}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${activeTab !== 'studio' ? 'pb-16 lg:pb-0' : ''}`}>
          {activeTab === 'discover' && (
            <GameCatalog
              games={displayGames}
              friends={friends}
              currentUser={user}
              onPlayGame={handlePlayGame}
              onEditGame={handleEditGame}
              onBuyGamePass={handleBuyGamePass}
              onOpenStudio={() => {
                if (user.isGuest) {
                  handleGuestActionBlocked('studio');
                  return;
                }
                if (userCreatedGames.length > 0) {
                  handleEditGame(userCreatedGames[0]);
                } else {
                  setEditingGame(null);
                  setActiveTab('studio');
                }
              }}
              userBloxbux={user.bloxbux}
              onGuestActionBlocked={handleGuestActionBlocked}
              onOpenAuthModal={handleOpenEmailAuth}
            />
          )}

          {activeTab === 'studio' && !user.isGuest && (
            <BloxStudio
              onPublishGame={handlePublishGame}
              userAvatar={user.avatar}
              username={user.username}
              onExitStudio={() => {
                setEditingGame(null);
                setActiveTab('discover');
              }}
              initialGame={editingGame}
            />
          )}

          {activeTab === 'shop' && (
            <AvatarShop
              items={shopItems}
              userBloxbux={user.bloxbux}
              userInventory={user.inventory}
              onPurchaseItem={handlePurchaseShopItem}
              onOpenEconomy={() => setIsEconomyOpen(true)}
            />
          )}

          {activeTab === 'avatar' && (
            <AvatarCustomizer
              avatar={user.avatar}
              inventoryItems={shopItems.filter(i => user.inventory.includes(i.id))}
              onSaveAvatar={handleSaveAvatar}
              isGuest={user.isGuest}
              onOpenAuthModal={handleOpenEmailAuth}
            />
          )}

          {activeTab === 'social' && (
            <SocialHub
              user={user}
              friends={friends}
              groups={groups}
              games={games}
              onJoinFriendGame={handleJoinFriendGame}
              onAddFriend={handleAddFriend}
              onPostGroupWall={handlePostGroupWall}
              onJoinGroup={handleJoinGroup}
              onEditGame={handleEditGame}
            />
          )}
        </main>
      </div>

      {/* Active 3D Game Play Modal */}
      {activeGame && (
        <ActiveGameModal
          game={activeGame}
          userAvatar={user.avatar}
          username={user.username}
          userBloxbux={user.bloxbux}
          onClose={() => setActiveGame(null)}
          onRewardCoins={handleRewardCoins}
          onEditGame={(gameToEdit) => {
            setActiveGame(null);
            handleEditGame(gameToEdit);
          }}
          activePasses={activePasses}
          isGuest={user.isGuest}
          onOpenAuthModal={handleOpenEmailAuth}
        />
      )}

      {/* Virtual Currency & Economy Modal */}
      <EconomyModal
        user={user}
        userGames={games.filter(g => g.creator.id === 'user-self' || g.creator.username === user.username)}
        isOpen={isEconomyOpen}
        onClose={() => setIsEconomyOpen(false)}
        onAddBloxbux={handleAddBloxbux}
        onClaimDaily={handleClaimDaily}
        canClaimDaily={canClaimDaily}
      />

      {/* Authentication & Onboarding Modal (First time entry & switch account) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={hasCompletedAuth()}
        onLoginWithEmail={handleLoginWithEmail}
        onContinueAsGuest={handleContinueAsGuest}
        onPlayGame={handlePlayGame}
        games={games}
        initialMode={authModalMode}
      />

      {/* Guest Restriction Alert Modal */}
      <GuestRestrictionModal
        isOpen={guestRestriction !== null}
        type={guestRestriction || 'studio'}
        onClose={() => setGuestRestriction(null)}
        onOpenEmailAuth={handleOpenEmailAuth}
      />
    </div>
  );
}
