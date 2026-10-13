import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Shield, 
  Send, 
  ExternalLink, 
  Check, 
  Gamepad2, 
  Circle, 
  Clock, 
  Award,
  Sparkles,
  Pencil
} from 'lucide-react';
import { Friend, Group, UserProfile, GameMetadata } from '../../types';
import { sounds } from '../../services/soundEffects';

interface SocialHubProps {
  user: UserProfile;
  friends: Friend[];
  groups: Group[];
  games: GameMetadata[];
  onJoinFriendGame: (gameTitle: string) => void;
  onAddFriend: (username: string) => void;
  onPostGroupWall: (groupId: string, text: string) => void;
  onJoinGroup: (groupId: string) => void;
  onEditGame?: (game: GameMetadata) => void;
}

export const SocialHub: React.FC<SocialHubProps> = ({
  user,
  friends,
  groups,
  games,
  onJoinFriendGame,
  onAddFriend,
  onPostGroupWall,
  onJoinGroup,
  onEditGame
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'chat' | 'groups' | 'profile'>('friends');
  const [selectedFriendChat, setSelectedFriendChat] = useState<Friend | null>(friends[0] || null);
  const [chatMessages, setChatMessages] = useState<{ [friendId: string]: { sender: string; text: string; time: string }[] }>({
    'friend-1': [
      { sender: 'PixelNinja_X', text: 'Yo BloxMaster! Did you try that new bounce pad jump?', time: '10:45 AM' },
      { sender: 'BloxMaster_99', text: 'Yeah it sends you 25 studs high into the sky haha!', time: '10:46 AM' },
      { sender: 'PixelNinja_X', text: 'Let me know if you want to collaborate on an obby level.', time: '10:48 AM' }
    ]
  });
  const [chatInput, setChatInput] = useState<string>('');
  const [newFriendInput, setNewFriendInput] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group>(groups[0]);
  const [groupWallInput, setGroupWallInput] = useState<string>('');

  const handleSendDM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedFriendChat) return;

    sounds.playClick();
    const newMsg = {
      sender: user.username,
      text: chatInput.trim(),
      time: 'Just now'
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedFriendChat.id]: [...(prev[selectedFriendChat.id] || []), newMsg]
    }));
    setChatInput('');
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendInput.trim()) return;
    sounds.playPurchase();
    onAddFriend(newFriendInput.trim());
    setNewFriendInput('');
  };

  const handleWallPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupWallInput.trim()) return;
    sounds.playClick();
    onPostGroupWall(selectedGroup.id, groupWallInput.trim());
    setGroupWallInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
      {/* Top Header & Section Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292c3a] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00a2ff]" />
            BloxVerse Social & Community
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Connect with friends, chat in real-time, join developer clans, and check your player profile.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#181a24] p-1.5 rounded-2xl border border-[#2b2f3f] self-start sm:self-auto">
          {[
            { id: 'friends', label: 'Friends' },
            { id: 'chat', label: 'Messages' },
            { id: 'groups', label: 'Groups & Clans' },
            { id: 'profile', label: 'My Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.playClick(); setActiveTab(tab.id as any); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#00a2ff] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#20232e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: FRIENDS LIST & ADD FRIEND */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Add Friend Input Bar */}
          <form onSubmit={handleAddFriendSubmit} className="bg-[#181a24] border border-[#2b2f3f] rounded-2xl p-4 flex items-center gap-3 shadow-lg">
            <UserPlus className="w-5 h-5 text-[#00a2ff] shrink-0" />
            <input
              type="text"
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              placeholder="Enter Bloxian username to send friend request..."
              className="flex-1 bg-[#121319] border border-[#272a38] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2ff]"
            />
            <button
              type="submit"
              className="bg-[#00a2ff] hover:bg-[#0090e0] text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Add Friend
            </button>
          </form>

          {/* Friends Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map(friend => {
              const isPlaying = friend.status === 'playing';
              const isStudio = friend.status === 'studio';
              const isOnline = friend.status === 'online';

              return (
                <div
                  key={friend.id}
                  className="bg-[#181a24] border border-[#282b3a] hover:border-[#00a2ff]/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    {/* Blocky Avatar Head */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10 shrink-0 relative"
                      style={{ backgroundColor: friend.avatarColors.head }}
                    >
                      <span>{friend.avatarHat || '😄'}</span>
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#181a24] ${
                        isPlaying || isStudio || isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`} />
                    </div>

                    <div className="truncate">
                      <h4 className="font-extrabold text-sm text-white truncate">{friend.displayName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">@{friend.username}</p>
                      <div className="text-[11px] mt-0.5 truncate font-medium">
                        {isPlaying ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Gamepad2 className="w-3 h-3" />
                            Playing {friend.currentGame}
                          </span>
                        ) : isStudio ? (
                          <span className="text-amber-400">🔨 In Blox Studio</span>
                        ) : isOnline ? (
                          <span className="text-blue-400">Online</span>
                        ) : (
                          <span className="text-slate-500">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {isPlaying && (
                      <button
                        onClick={() => onJoinFriendGame(friend.currentGame || '')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                      >
                        Join
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedFriendChat(friend);
                        setActiveTab('chat');
                      }}
                      className="bg-[#242735] hover:bg-[#2e3243] text-slate-300 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT MESSAGING / CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-[#181a24] border border-[#2b2f3f] rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 h-[520px]">
          {/* Friends Conversations Column (4 cols) */}
          <div className="md:col-span-4 border-r border-[#2b2f3f] flex flex-col">
            <div className="p-3.5 border-b border-[#2b2f3f] bg-[#1a1c27]">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Direct Conversations
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {friends.map(friend => {
                const isSelected = selectedFriendChat?.id === friend.id;
                return (
                  <button
                    key={friend.id}
                    onClick={() => { sounds.playClick(); setSelectedFriendChat(friend); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-[#00a2ff] text-white shadow-md' : 'hover:bg-[#222533] text-slate-300'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base border border-white/10 shrink-0"
                      style={{ backgroundColor: friend.avatarColors.head }}
                    >
                      {friend.avatarHat || '😄'}
                    </div>
                    <div className="truncate">
                      <div className="font-extrabold text-xs truncate">{friend.displayName}</div>
                      <div className="text-[10px] opacity-75 truncate">{friend.status}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Window Column (8 cols) */}
          <div className="md:col-span-8 flex flex-col bg-[#14151e]">
            {selectedFriendChat ? (
              <>
                <div className="p-3.5 border-b border-[#2b2f3f] bg-[#1a1c27] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-sm text-white">{selectedFriendChat.displayName}</span>
                    <span className="text-xs text-slate-400 font-mono">@{selectedFriendChat.username}</span>
                  </div>
                  {selectedFriendChat.status === 'playing' && (
                    <button
                      onClick={() => onJoinFriendGame(selectedFriendChat.currentGame || '')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg"
                    >
                      Join Game
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(chatMessages[selectedFriendChat.id] || []).map((msg, idx) => {
                    const isMe = msg.sender === user.username;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-3.5 py-2 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-[#00a2ff] text-white rounded-br-sm'
                              : 'bg-[#222533] text-slate-200 rounded-bl-sm border border-[#2b2f3f]'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1">{msg.time}</span>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendDM} className="p-3 border-t border-[#2b2f3f] bg-[#181a24] flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Message ${selectedFriendChat.displayName}...`}
                    className="flex-1 bg-[#121319] border border-[#272a38] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2ff]"
                  />
                  <button
                    type="submit"
                    className="bg-[#00a2ff] hover:bg-[#0090e0] text-white p-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a friend to begin conversation
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GROUPS & CLANS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Groups Directory (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Community Groups & Guilds
            </h3>
            {groups.map(grp => (
              <div
                key={grp.id}
                onClick={() => { sounds.playClick(); setSelectedGroup(grp); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedGroup.id === grp.id
                    ? 'bg-[#1e2230] border-[#00a2ff] shadow-lg'
                    : 'bg-[#181a24] border-[#282b3a] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 bg-[#252837] rounded-xl border border-white/5">
                    {grp.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{grp.name}</h4>
                    <span className="text-[11px] text-slate-400">
                      {grp.memberCount.toLocaleString()} Members • Owned by {grp.owner}
                    </span>
                  </div>
                </div>

                {grp.joined ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase">
                    JOINED
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onJoinGroup(grp.id);
                    }}
                    className="bg-[#00a2ff] hover:bg-[#0090e0] text-white text-xs font-bold px-3 py-1 rounded-lg"
                  >
                    Join
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Group Wall & Details (7 cols) */}
          <div className="lg:col-span-7 bg-[#181a24] border border-[#2b2f3f] rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#2b2f3f]">
              <div className="text-4xl">{selectedGroup.icon}</div>
              <div>
                <h3 className="font-black text-lg text-white">{selectedGroup.name}</h3>
                <p className="text-xs text-slate-400">{selectedGroup.description}</p>
                <div className="text-[11px] text-emerald-400 font-mono mt-1 font-bold">
                  Group Treasury: {selectedGroup.funds.toLocaleString()} BloxBux
                </div>
              </div>
            </div>

            {/* Post on Wall Form */}
            <form onSubmit={handleWallPostSubmit} className="flex gap-2">
              <input
                type="text"
                value={groupWallInput}
                onChange={(e) => setGroupWallInput(e.target.value)}
                placeholder="Post an announcement or discussion on group wall..."
                className="flex-1 bg-[#121319] border border-[#272a38] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2ff]"
              />
              <button
                type="submit"
                className="bg-[#00a2ff] hover:bg-[#0090e0] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Post
              </button>
            </form>

            {/* Group Wall Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[280px]">
              {selectedGroup.wallPosts.map(post => (
                <div key={post.id} className="bg-[#121319] border border-[#242736] rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#00a2ff]">
                      {post.author}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">({post.rank})</span>
                    </span>
                    <span className="text-slate-500">{post.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PLAYER PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#181a24] border border-[#2b2f3f] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-[#2b2f3f] pb-6">
            <div
              className="w-24 h-24 rounded-3xl border-2 border-white/20 flex items-center justify-center text-5xl shadow-xl shrink-0"
              style={{ backgroundColor: user.avatar.bodyColors.head }}
            >
              😄
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl font-black text-white">{user.displayName}</h2>
                <span className="text-sm text-slate-400 font-mono">@{user.username}</span>
                {user.isPremium && (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-xs font-black px-2 py-0.5 rounded shadow">
                    BLOX PREMIUM
                  </span>
                )}
              </div>

              <p className="text-xs text-emerald-400 font-medium">"{user.status}"</p>
              <p className="text-xs text-slate-300 max-w-xl">{user.bio}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 pt-2 text-xs text-slate-400">
                <div>Joined: <strong className="text-white">{user.joinDate}</strong></div>
                <div>Friends: <strong className="text-white">{friends.length}</strong></div>
                <div>Followers: <strong className="text-white">{user.followersCount}</strong></div>
                <div>Net Worth: <strong className="text-emerald-400 font-mono">{user.bloxbux.toLocaleString()} B$</strong></div>
              </div>
            </div>
          </div>

          {/* Creations Showcase */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Creations Showcase
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {games.filter(g => g.creator.id === 'user-self' || g.creator.username === user.username).map(g => (
                <div key={g.id} className="bg-[#121319] border border-[#252837] rounded-xl p-3 space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                    <img src={g.thumbnail} alt={g.title} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-extrabold text-xs text-white truncate">{g.title}</h4>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>{g.visits} visits</span>
                    <span className="text-emerald-400 font-bold">{g.playingCount} playing</span>
                  </div>
                  {onEditGame && (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onEditGame(g);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-black" />
                      <span>Editar no Studio</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
