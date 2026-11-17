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
  Pencil,
  Search,
  Medal,
  Calendar,
  Share2
} from 'lucide-react';
import { Friend, Group, UserProfile, GameMetadata } from '../../types';
import { sounds } from '../../services/soundEffects';
import { RobuxIcon, RobloxPremiumIcon, RobloxVerifiedBadge } from '../common/RobloxIcons';
import { AvatarHeadshot } from '../common/AvatarHeadshot';

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

// Authentic 2022 Official Roblox Badges
const OFFICIAL_ROBLOX_BADGES = [
  { id: 'badge-vet', name: 'Veterano', icon: '🎖️', desc: 'Membro da comunidade Roblox há mais de 1 ano.' },
  { id: 'badge-builder', name: 'Bricksmith', icon: '🧱', desc: 'Criador com mais de 1.000 visitas em sua experiência.' },
  { id: 'badge-home', name: 'Homestead', icon: '🏡', desc: 'Criou e publicou uma experiência explorável no Roblox.' },
  { id: 'badge-friend', name: 'Amizade', icon: '🤝', desc: 'Conectou-se com múltiplos amigos na comunidade Roblox.' },
];

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
    'friend-4': [
      { sender: 'gabriel2025', text: 'E aí! Bora testar as novidades no Roblox Studio 2022?', time: '10:45 AM' },
      { sender: user.username, text: 'Bora! Todos os scripts Luau e físicas PGS estão idênticos aos do Roblox de 2022.', time: '10:46 AM' }
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
      time: 'Agora'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none bg-[#111216] min-h-screen text-white">
      {/* 2022 Roblox Social Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232527] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00a2ff]" />
            Amigos & Comunidade Roblox
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-0.5">
            Conecte-se com outros jogadores, converse em mensagens diretas, participe de grupos e confira seu perfil oficial.
          </p>
        </div>

        {/* Tab Buttons (2022 Roblox pills) */}
        <div className="flex items-center gap-1.5 bg-[#191b1d] p-1 rounded-xl border border-[#232527] self-start sm:self-auto">
          {[
            { id: 'friends', label: 'Amigos' },
            { id: 'chat', label: 'Bate-papo' },
            { id: 'groups', label: 'Grupos' },
            { id: 'profile', label: 'Meu Perfil' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.playClick(); setActiveTab(tab.id as any); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-black font-black shadow-md'
                  : 'text-[#888888] hover:text-white hover:bg-[#232527]'
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
          <form onSubmit={handleAddFriendSubmit} className="bg-[#191b1d] border border-[#232527] rounded-xl p-3 sm:p-4 flex items-center gap-3 shadow-md">
            <UserPlus className="w-5 h-5 text-[#00a2ff] shrink-0" />
            <input
              type="text"
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              placeholder="Digite o nome de usuário Roblox para enviar pedido de amizade..."
              className="flex-1 bg-[#111216] border border-[#232527] rounded-lg px-3.5 py-2 text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#00a2ff]"
            />
            <button
              type="submit"
              className="bg-[#00a2ff] hover:bg-[#0090e0] text-white text-xs font-black px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer shrink-0"
            >
              Adicionar Amigo
            </button>
          </form>

          {/* Friends Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-[#191b1d] rounded-xl border border-[#232527] space-y-2">
                <p className="text-white text-sm font-semibold">Nenhuma amizade adicionada no momento.</p>
                <p className="text-[#888888] text-xs">Adicione novos amigos pelo nome de usuário acima!</p>
              </div>
            ) : (
              friends.map(friend => {
                const isPlaying = friend.status === 'playing';
                const isStudio = friend.status === 'studio';
                const isOnline = friend.status === 'online';

                return (
                  <div
                    key={friend.id}
                    className="bg-[#191b1d] border border-[#232527] hover:border-white/20 rounded-xl p-4 flex items-center justify-between gap-3 shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {/* Blocky Avatar Head */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10 shrink-0 relative"
                        style={{ backgroundColor: friend.avatarColors.head }}
                      >
                        <span>{friend.avatarHat || '😄'}</span>
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#191b1d] ${
                          isPlaying || isStudio || isOnline ? 'bg-[#00e676]' : 'bg-[#555555]'
                        }`} />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <h4 className="font-extrabold text-sm text-white truncate">{friend.displayName}</h4>
                        </div>
                        <p className="text-[11px] text-[#888888] font-mono">@{friend.username}</p>
                        <div className="text-[11px] mt-0.5 truncate font-medium">
                          {isPlaying ? (
                            <span className="text-[#00e676] flex items-center gap-1">
                              <Gamepad2 className="w-3 h-3" />
                              Jogando {friend.currentGame}
                            </span>
                          ) : isStudio ? (
                            <span className="text-[#00a2ff]">🔨 No Roblox Studio</span>
                          ) : isOnline ? (
                            <span className="text-[#00e676]">Online</span>
                          ) : (
                            <span className="text-[#777777]">Offline</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      {isPlaying && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onJoinFriendGame(friend.currentGame || '');
                          }}
                          className="bg-[#00b06f] hover:bg-[#00c87d] text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <Gamepad2 className="w-3 h-3" />
                          <span>Entrar</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setSelectedFriendChat(friend);
                          setActiveTab('chat');
                        }}
                        className="bg-[#232527] hover:bg-[#2d3035] text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Mensagem
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CHAT & DIRECT MESSAGES */}
      {activeTab === 'chat' && (
        <div className="bg-[#191b1d] border border-[#232527] rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          {/* Friends Sidebar (4 cols) */}
          <div className="md:col-span-4 border-r border-[#232527] p-3 space-y-2 bg-[#141518]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] px-2 block">
              Mensagens Diretas
            </span>
            {friends.map(fr => (
              <div
                key={fr.id}
                onClick={() => { sounds.playClick(); setSelectedFriendChat(fr); }}
                className={`p-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer transition-all ${
                  selectedFriendChat?.id === fr.id
                    ? 'bg-[#232527] text-white'
                    : 'text-[#888888] hover:bg-[#1a1b20] hover:text-white'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border border-white/10"
                  style={{ backgroundColor: fr.avatarColors.head }}
                >
                  {fr.avatarHat || '😄'}
                </div>
                <div className="truncate flex-1">
                  <h4 className="text-xs font-bold truncate text-white">{fr.displayName}</h4>
                  <p className="text-[10px] text-[#777777] font-mono truncate">@{fr.username}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Active Chat Conversation (8 cols) */}
          <div className="md:col-span-8 flex flex-col justify-between bg-[#191b1d]">
            {selectedFriendChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#232527] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border border-white/10"
                      style={{ backgroundColor: selectedFriendChat.avatarColors.head }}
                    >
                      {selectedFriendChat.avatarHat || '😄'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">{selectedFriendChat.displayName}</h3>
                      <span className="text-[11px] text-[#00e676]">Online no Roblox</span>
                    </div>
                  </div>
                  {selectedFriendChat.status === 'playing' && (
                    <button
                      onClick={() => onJoinFriendGame(selectedFriendChat.currentGame || '')}
                      className="bg-[#00b06f] hover:bg-[#00c87d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    >
                      Entrar na Sessão
                    </button>
                  )}
                </div>

                {/* Message Logs */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[360px]">
                  {(chatMessages[selectedFriendChat.id] || [
                    { sender: selectedFriendChat.username, text: 'Oi! Pronto para jogar?', time: 'Hoje' }
                  ]).map((msg, idx) => {
                    const isMe = msg.sender === user.username;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-2 text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#00a2ff] text-white rounded-br-none'
                              : 'bg-[#232527] text-white rounded-bl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-[#666666] mt-1 px-1">{msg.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendDM} className="p-3 border-t border-[#232527] flex gap-2 bg-[#141518]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Enviar mensagem para @${selectedFriendChat.username}...`}
                    className="flex-1 bg-[#191b1d] border border-[#232527] rounded-lg px-3 py-2 text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#00a2ff]"
                  />
                  <button
                    type="submit"
                    className="bg-[#00a2ff] hover:bg-[#0090e0] text-white p-2 rounded-lg transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#777777] text-xs">
                Selecione um amigo para iniciar uma conversa
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ROBLOX GROUPS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Groups Directory (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#888888]">
              Grupos do Roblox
            </h3>
            {groups.map(grp => (
              <div
                key={grp.id}
                onClick={() => { sounds.playClick(); setSelectedGroup(grp); }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedGroup.id === grp.id
                    ? 'bg-[#232527] border-[#00a2ff] shadow-md'
                    : 'bg-[#191b1d] border-[#232527] hover:border-[#444]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 bg-[#111216] rounded-lg border border-white/5">
                    {grp.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{grp.name}</h4>
                    <span className="text-[11px] text-[#888888]">
                      {grp.memberCount.toLocaleString()} Membros • Por {grp.owner}
                    </span>
                  </div>
                </div>

                {grp.joined ? (
                  <span className="text-[10px] bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30 px-2 py-0.5 rounded font-black uppercase">
                    PARTICIPANDO
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
                    Entrar
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Group Wall & Details (7 cols) */}
          <div className="lg:col-span-7 bg-[#191b1d] border border-[#232527] rounded-xl p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#232527]">
              <div className="text-4xl">{selectedGroup.icon}</div>
              <div>
                <h3 className="font-black text-lg text-white">{selectedGroup.name}</h3>
                <p className="text-xs text-[#aaaaaa]">{selectedGroup.description}</p>
                <div className="text-[11px] text-[#00e676] font-mono mt-1 font-bold flex items-center gap-1.5">
                  <RobuxIcon className="w-3.5 h-3.5 text-[#00e676]" color="#00e676" />
                  <span>Fundos do Grupo: R$ {selectedGroup.funds.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Post on Wall Form */}
            <form onSubmit={handleWallPostSubmit} className="flex gap-2">
              <input
                type="text"
                value={groupWallInput}
                onChange={(e) => setGroupWallInput(e.target.value)}
                placeholder="Publicar mensagem no mural do grupo..."
                className="flex-1 bg-[#111216] border border-[#232527] rounded-lg px-3.5 py-2 text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#00a2ff]"
              />
              <button
                type="submit"
                className="bg-[#00a2ff] hover:bg-[#0090e0] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
              >
                Publicar
              </button>
            </form>

            {/* Group Wall Feed */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[280px]">
              {selectedGroup.wallPosts.map(post => (
                <div key={post.id} className="bg-[#111216] border border-[#232527] rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#00a2ff]">
                      {post.author}{' '}
                      <span className="text-[10px] text-[#888888] font-normal">({post.rank})</span>
                    </span>
                    <span className="text-[#666666]">{post.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#cccccc] leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL 2022 ROBLOX PLAYER PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#191b1d] border border-[#232527] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-[#232527] pb-6">
            <AvatarHeadshot
              avatar={user.avatar}
              alt={user.displayName}
              className="w-24 h-24 rounded-2xl border-2 border-white/20 shadow-xl"
            />

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl font-black text-white">{user.displayName}</h2>
                <RobloxVerifiedBadge size={16} />
                <span className="text-sm text-[#888888] font-mono">@{user.username}</span>
                {user.isPremium && (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded shadow flex items-center gap-1">
                    <RobloxPremiumIcon size={12} />
                    PREMIUM
                  </span>
                )}
              </div>

              <p className="text-xs text-[#00e676] font-medium">"{user.status}"</p>
              <p className="text-xs text-[#bbbbbb] max-w-xl">{user.bio}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 pt-2 text-xs text-[#888888]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Entrou em: <strong className="text-white">{user.joinDate}</strong></span>
                </div>
                <div>Amigos: <strong className="text-white">{friends.length}</strong></div>
                <div>Seguidores: <strong className="text-white">{user.followersCount}</strong></div>
                <div className="flex items-center gap-1">
                  <RobuxIcon className="w-3.5 h-3.5 text-[#00e676]" color="#00e676" />
                  <span>Saldo: <strong className="text-white font-mono">{user.bloxbux.toLocaleString()} R$</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Roblox Badges Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-400" />
              Emblemas Oficiais do Roblox
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {OFFICIAL_ROBLOX_BADGES.map(badge => (
                <div
                  key={badge.id}
                  className="bg-[#111216] border border-[#232527] rounded-xl p-3 flex items-center gap-3 shadow-sm hover:border-[#444] transition-colors"
                >
                  <div className="text-2xl p-2 bg-[#191b1d] rounded-lg border border-white/5 shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{badge.name}</h4>
                    <p className="text-[10px] text-[#777777] line-clamp-2 mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Creations Showcase */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#888888]">
              Criações do Jogador
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {games.filter(g => g.creator.id === 'user-self' || g.creator.username === user.username).map(g => (
                <div key={g.id} className="bg-[#111216] border border-[#232527] rounded-xl p-3 space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                    <img src={g.thumbnail} alt={g.title} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-extrabold text-xs text-white truncate">{g.title}</h4>
                  <div className="flex justify-between items-center text-[11px] text-[#888888]">
                    <span>{g.visits.toLocaleString()} visitas</span>
                    <span className="text-[#00e676] font-bold">{g.playingCount} jogando</span>
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
