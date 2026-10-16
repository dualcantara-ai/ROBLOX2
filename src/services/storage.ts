import { GameMetadata, ShopItem, UserProfile, Friend, Group, BloxPart } from '../types';

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hat-valkyrie',
    name: 'Valkyrie Helm of Glory',
    category: 'hat',
    price: 50000,
    thumbnail: '👑',
    description: 'Forged from mythical valkyrie feathers and celestial gold. The hallmark of true Blox royalty.',
    rarity: 'Legendary',
    isLimited: true,
    originalStock: 500,
    remainingStock: 42,
    color: '#f6c344'
  },
  {
    id: 'hat-dominus',
    name: 'Dominus Aureus',
    category: 'hat',
    price: 75000,
    thumbnail: '🥷',
    description: 'The ancient dark hooded shroud with burning golden buckles. Extremely rare and coveted.',
    rarity: 'Legendary',
    isLimited: true,
    originalStock: 250,
    remainingStock: 18,
    color: '#1a1a24'
  },
  {
    id: 'hat-fedora',
    name: 'Sparkle Time Fedora',
    category: 'hat',
    price: 15000,
    thumbnail: '🎩',
    description: 'A stylish fedora with shimmering particle sparkles. Turns heads everywhere you walk.',
    rarity: 'Epic',
    color: '#00a2ff'
  },
  {
    id: 'hat-noob',
    name: 'Noob Companion Cap',
    category: 'hat',
    price: 150,
    thumbnail: '🧢',
    description: 'A cute little blocky noob sitting atop a blue baseball cap.',
    rarity: 'Common',
    color: '#ffcc00'
  },
  {
    id: 'hat-viking',
    name: 'Iron Horned Viking Helm',
    category: 'hat',
    price: 750,
    thumbnail: '🪖',
    description: 'Sturdy iron helmet with polished bull horns. Ready for battle!',
    rarity: 'Rare',
    color: '#8b9bb4'
  },
  {
    id: 'face-epic',
    name: 'Epic Smile Face',
    category: 'face',
    price: 300,
    thumbnail: '😄',
    description: 'The iconic energetic grin that tells everyone you are having the best time in BloxVerse.',
    rarity: 'Rare'
  },
  {
    id: 'face-chill',
    name: 'Super Chill Expression',
    category: 'face',
    price: 100,
    thumbnail: '😎',
    description: 'Unbothered, moisturized, in my lane, thriving with cool shades.',
    rarity: 'Common'
  },
  {
    id: 'face-beast',
    name: 'Beast Mode Red Eyes',
    category: 'face',
    price: 1200,
    thumbnail: '😈',
    description: 'Fierce glowing eyes and jagged grin. Intimidate opponents in PvP arenas.',
    rarity: 'Epic'
  },
  {
    id: 'gear-speedcoil',
    name: 'Speed Coil of Velocity',
    category: 'gear',
    price: 500,
    thumbnail: '🌀',
    description: 'Equip in-game for a permanent 2x movement speed burst!',
    rarity: 'Rare',
    color: '#ff2a5f'
  },
  {
    id: 'gear-gravitycoil',
    name: 'Gravity Coil of Levitation',
    category: 'gear',
    price: 750,
    thumbnail: '🚀',
    description: 'Defy gravity! Grants a floaty, ultra-high moon jump.',
    rarity: 'Epic',
    color: '#00e5ff'
  },
  {
    id: 'gear-bloxycola',
    name: 'Bloxy Cola Classic',
    category: 'gear',
    price: 120,
    thumbnail: '🥤',
    description: 'Chug down an ice-cold fizzy Bloxy Cola to regenerate health instantly.',
    rarity: 'Common'
  },
  {
    id: 'gear-rainbowsword',
    name: 'Rainbow Katana of Stars',
    category: 'gear',
    price: 2500,
    thumbnail: '⚔️',
    description: 'Prismatic blade that slices through obstacles and leaves trail of rainbow glitter.',
    rarity: 'Epic'
  },
  {
    id: 'shirt-tuxedo',
    name: 'Classic Black Bowtie Tux',
    category: 'shirt',
    price: 50,
    thumbnail: '👔',
    description: 'Sharp, elegant attire for high-class blox galas and award ceremonies.',
    rarity: 'Common',
    color: '#1a1c23'
  },
  {
    id: 'shirt-galaxy',
    name: 'Cosmic Galaxy Hoodie',
    category: 'shirt',
    price: 120,
    thumbnail: '🌌',
    description: 'Deep nebula patterns printed on ultra-comfortable cotton.',
    rarity: 'Rare',
    color: '#6b21a8'
  },
  {
    id: 'pants-jeans',
    name: 'Designer Ripped Street Jeans',
    category: 'pants',
    price: 50,
    thumbnail: '👖',
    description: 'Standard trendy denim with sneaker combo.',
    rarity: 'Common',
    color: '#2563eb'
  },
  {
    id: 'pants-cyber',
    name: 'Cybernetic Mech Greaves',
    category: 'pants',
    price: 280,
    thumbnail: '🦿',
    description: 'High-tech armor plating with glowing neon joints.',
    rarity: 'Rare',
    color: '#10b981'
  }
];

// Helper to generate seed parts for the Obby
function createObbyParts(): BloxPart[] {
  const parts: BloxPart[] = [
    // Base Spawn Platform
    {
      id: 'part-spawn',
      name: 'Spawn Platform',
      className: 'SpawnLocation',
      type: 'spawn',
      position: { x: 0, y: 0.5, z: 0 },
      size: { x: 14, y: 1, z: 14 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#10b981',
      material: 'plastic',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 0,
      label: 'START SPAWN'
    },
    // Dynamic Physics Crates right next to spawn (Anchored = false, CanCollide = true)
    {
      id: 'part-phys-crate-1',
      name: 'Pushable Physics Crate',
      className: 'Part',
      type: 'block',
      position: { x: 3.5, y: 3, z: -2 },
      size: { x: 2, y: 2, z: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#d97706',
      material: 'wood',
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      attributes: {
        Mass: 10,
        Pushable: true,
        Bounciness: 0.2
      }
    },
    {
      id: 'part-phys-boulder-1',
      name: 'Dynamic Rolling Boulder',
      className: 'Part',
      type: 'sphere',
      position: { x: -3.5, y: 3, z: -2 },
      size: { x: 2.5, y: 2.5, z: 2.5 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#0284c7',
      material: 'plastic',
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      attributes: {
        Mass: 8,
        Pushable: true,
        Friction: 0.1
      }
    },
    // Invisible Barrier Wall (Transparency = 1.0, CanCollide = true)
    {
      id: 'part-invis-barrier-1',
      name: 'Invisible Safety Wall',
      className: 'Part',
      type: 'block',
      position: { x: 0, y: 3, z: 6.5 },
      size: { x: 14, y: 5, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#64748b',
      material: 'forcefield',
      anchored: true,
      isAnchored: true,
      canCollide: true,
      transparency: 1.0,
      attributes: {
        Barrier: true,
        Solid: true
      }
    },
    // Stage 1: Stepping stones
    {
      id: 'part-step-1',
      name: 'Stepping Stone 1',
      type: 'block',
      position: { x: 0, y: 1.5, z: -12 },
      size: { x: 4, y: 1, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#3b82f6',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'part-coin-1',
      name: 'Coin 1',
      type: 'coin',
      position: { x: 0, y: 3.5, z: -12 },
      size: { x: 1.2, y: 1.2, z: 0.3 },
      rotation: { x: 0, y: 45, z: 0 },
      color: '#fbbf24',
      material: 'neon',
      anchored: true,
      canCollide: false,
      transparency: 0,
      coinValue: 15
    },
    {
      id: 'part-step-2',
      name: 'Stepping Stone 2',
      type: 'block',
      position: { x: -4, y: 3, z: -20 },
      size: { x: 4, y: 1, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#8b5cf6',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'part-step-3',
      name: 'Stepping Stone 3',
      type: 'block',
      position: { x: 4, y: 4.5, z: -28 },
      size: { x: 4, y: 1, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#ec4899',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    // Stage 2: Lava jumps (Killbricks)
    {
      id: 'part-bridge-1',
      name: 'Safe Bridge 1',
      type: 'block',
      position: { x: 0, y: 5.5, z: -38 },
      size: { x: 10, y: 1, z: 6 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#475569',
      material: 'brick',
      anchored: true,
      canCollide: true,
      transparency: 0,
      label: 'CHECKPOINT 1'
    },
    {
      id: 'part-lava-strip-1',
      name: 'Lava Beam 1',
      type: 'killbrick',
      position: { x: 0, y: 6.2, z: -38 },
      size: { x: 10, y: 0.5, z: 0.8 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#ef4444',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0,
      script: { trigger: 'onTouch', action: 'damage', parameter: 100 }
    },
    // Stage 3: Bounce pad up to high tower
    {
      id: 'part-bounce-1',
      name: 'Super Jump Spring',
      type: 'bouncepad',
      position: { x: 0, y: 5.8, z: -44 },
      size: { x: 3.5, y: 0.8, z: 3.5 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#06b6d4',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0,
      script: { trigger: 'onTouch', action: 'bounce', parameter: 28 }
    },
    // High sky platform
    {
      id: 'part-sky-plat',
      name: 'Sky Haven Island',
      type: 'block',
      position: { x: 0, y: 20, z: -62 },
      size: { x: 12, y: 1, z: 12 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#6366f1',
      material: 'forcefield',
      anchored: true,
      canCollide: true,
      transparency: 0.1
    },
    {
      id: 'part-coin-2',
      name: 'Big Treasure Coin',
      type: 'coin',
      position: { x: 0, y: 22.5, z: -62 },
      size: { x: 2, y: 2, z: 0.4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#f59e0b',
      material: 'neon',
      anchored: true,
      canCollide: false,
      transparency: 0,
      coinValue: 50
    },
    // Speed runway
    {
      id: 'part-speed-strip',
      name: 'Nitro Boost Pad',
      type: 'speedpad',
      position: { x: 0, y: 20.6, z: -70 },
      size: { x: 4, y: 0.4, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#10b981',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0,
      script: { trigger: 'onTouch', action: 'speedBoost', parameter: 2.2 }
    },
    // Finish Trophy / Victory Portal
    {
      id: 'part-victory-portal',
      name: 'Winners Golden Altar',
      type: 'teleporter',
      position: { x: 0, y: 21, z: -88 },
      size: { x: 8, y: 2, z: 8 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#fbbf24',
      material: 'metal',
      anchored: true,
      canCollide: true,
      transparency: 0,
      label: '🏆 WINNER ZONE 🏆',
      script: { trigger: 'onTouch', action: 'giveCoins', parameter: 100 }
    }
  ];
  return parts;
}

function createTycoonParts(): BloxPart[] {
  return [
    {
      id: 'tyc-base',
      name: 'Tycoon Factory Floor',
      type: 'block',
      position: { x: 0, y: 0.5, z: 0 },
      size: { x: 30, y: 1, z: 30 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#1e293b',
      material: 'metal',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'tyc-dropper',
      name: 'Gold Ingot Dropper #1',
      type: 'block',
      position: { x: -8, y: 8, z: -8 },
      size: { x: 4, y: 4, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#f59e0b',
      material: 'metal',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'tyc-conveyor',
      name: 'Conveyor Belt',
      type: 'speedpad',
      position: { x: -8, y: 1, z: 0 },
      size: { x: 4, y: 0.5, z: 20 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#334155',
      material: 'plastic',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'tyc-collector',
      name: 'Cash Collector Basin',
      type: 'coin',
      position: { x: -8, y: 1.8, z: 8 },
      size: { x: 3, y: 1, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#10b981',
      material: 'neon',
      anchored: true,
      canCollide: false,
      transparency: 0,
      coinValue: 25
    },
    {
      id: 'tyc-btn-1',
      name: 'Buy Walls ($50)',
      type: 'bouncepad',
      position: { x: 4, y: 1, z: -5 },
      size: { x: 3, y: 0.6, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#3b82f6',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0,
      label: 'BUY UPGRADE'
    }
  ];
}

function createLavaFloorParts(): BloxPart[] {
  return [
    {
      id: 'lava-lake',
      name: 'The Molten Abyss',
      type: 'killbrick',
      position: { x: 0, y: -2, z: 0 },
      size: { x: 80, y: 2, z: 80 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#dc2626',
      material: 'neon',
      anchored: true,
      canCollide: true,
      transparency: 0,
      script: { trigger: 'onTouch', action: 'damage', parameter: 100 }
    },
    {
      id: 'lava-spawn',
      name: 'Safe Rock Outpost',
      type: 'spawn',
      position: { x: 0, y: 1, z: 0 },
      size: { x: 8, y: 2, z: 8 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#374151',
      material: 'brick',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'lava-pillar-1',
      name: 'Basalt Pillar 1',
      type: 'cylinder',
      position: { x: 7, y: 3, z: 8 },
      size: { x: 4, y: 6, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#1f2937',
      material: 'brick',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'lava-pillar-2',
      name: 'Basalt Pillar 2',
      type: 'cylinder',
      position: { x: 14, y: 6, z: 0 },
      size: { x: 4, y: 12, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#1f2937',
      material: 'brick',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'lava-pillar-3',
      name: 'High Peak Pillar',
      type: 'block',
      position: { x: 10, y: 11, z: -10 },
      size: { x: 5, y: 20, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#111827',
      material: 'brick',
      anchored: true,
      canCollide: true,
      transparency: 0
    },
    {
      id: 'lava-coin',
      name: 'Survivor Star',
      type: 'coin',
      position: { x: 10, y: 22, z: -10 },
      size: { x: 2, y: 2, z: 0.4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#fbbf24',
      material: 'neon',
      anchored: true,
      canCollide: false,
      transparency: 0,
      coinValue: 75
    }
  ];
}

export const INITIAL_GAMES: GameMetadata[] = [];

export const INITIAL_USER: UserProfile = {
  id: 'user-self',
  username: 'BloxMaster_99',
  displayName: 'BloxMaster',
  status: '🔨 Building games in BloxVerse Studio!',
  bio: 'Game creator, obby runner, and limited collector. Welcome to my Blox profile! Trade with me anytime.',
  bloxbux: 1450,
  joinDate: 'Jan 2024',
  avatar: {
    bodyColors: {
      head: '#facc15', // Yellow head
      torso: '#2563eb', // Blue torso
      leftArm: '#facc15', // Yellow
      rightArm: '#facc15', // Yellow
      leftLeg: '#16a34a', // Green legs
      rightLeg: '#16a34a'
    },
    equippedHat: 'hat-noob',
    equippedFace: 'face-epic',
    equippedShirt: 'shirt-tuxedo',
    equippedPants: 'pants-jeans',
    equippedGear: 'gear-speedcoil',
    scale: {
      height: 1,
      width: 1,
      head: 1
    },
    animation: 'idle'
  },
  inventory: ['hat-noob', 'face-epic', 'shirt-tuxedo', 'pants-jeans', 'gear-speedcoil'],
  badges: ['b-1'],
  friends: [],
  followersCount: 0,
  followingCount: 0,
  isPremium: true
};

export const INITIAL_FRIENDS: Friend[] = [];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp-devs',
    name: 'BloxVerse Developer Society',
    description: 'Official gathering of creators, 3D worldbuilders, scripters, and game designers. Weekly payouts and game jams!',
    icon: '🛠️',
    owner: 'BloxMaster_99',
    memberCount: 14200,
    funds: 125000,
    joined: true,
    wallPosts: [
      { id: 'wp-1', author: 'BloxMaster_99', content: 'Studio 2.0 update is out! Try the new bounce pads & killbricks.', timestamp: '1h ago', rank: 'Owner' },
      { id: 'wp-2', author: 'gabriel2025', content: 'Basehub is awesome, loving the physics and Luau scripts!', timestamp: '4h ago', rank: 'Scripter' }
    ]
  },
  {
    id: 'grp-obby',
    name: 'Obby Speedrun Masters',
    description: 'For parkour legends and speedrunners. Share your fastest times and stage skips.',
    icon: '🏃',
    owner: 'ParkourGod',
    memberCount: 8900,
    funds: 48000,
    joined: true,
    wallPosts: [
      { id: 'wp-3', author: 'ParkourGod', content: 'World record on Mega Neon Obby just broken! 42.8 seconds.', timestamp: 'Yesterday', rank: 'Leader' }
    ]
  },
  {
    id: 'grp-trading',
    name: 'Limited Item Traders & Collectors',
    description: 'Buy, sell, flip and discuss the rarest items in the Avatar Shop.',
    icon: '💎',
    owner: 'ValK_Collector',
    memberCount: 26400,
    funds: 890000,
    joined: false,
    wallPosts: [
      { id: 'wp-4', author: 'ValK_Collector', content: 'Buying Valkyrie Helm! Message me offers in BloxBux.', timestamp: '3h ago', rank: 'Leader' }
    ]
  }
];

// LocalStorage helpers
const STORAGE_KEYS = {
  USER: 'bloxverse_user_v1',
  AUTH_STATUS: 'bloxverse_auth_status_v1',
  GAMES: 'bloxverse_games_v1',
  FRIENDS: 'bloxverse_friends_v1',
  GROUPS: 'bloxverse_groups_v1',
  SHOP: 'bloxverse_shop_v1',
  DAILY_REWARD: 'bloxverse_daily_reward_v1'
};

export const NOOB_AVATAR: UserProfile['avatar'] = {
  bodyColors: {
    head: '#facc15', // Bright Yellow
    torso: '#0055bf', // Classic Royal Blue
    leftArm: '#facc15', // Bright Yellow
    rightArm: '#facc15', // Bright Yellow
    leftLeg: '#16a34a', // Classic Green
    rightLeg: '#16a34a'  // Classic Green
  },
  equippedHat: undefined,
  equippedFace: 'face-epic',
  equippedShirt: undefined,
  equippedPants: undefined,
  equippedGear: undefined,
  scale: {
    height: 1,
    width: 1,
    head: 1
  },
  animation: 'idle'
};

export function createGuestUser(): UserProfile {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `guest-${guestNumber}`,
    username: `Guest_${guestNumber}`,
    displayName: `Visitante #${guestNumber}`,
    isGuest: true,
    email: undefined,
    status: 'Visitante (Modo Noob)',
    bio: 'Sou um visitante explorando o BloxVerse! Minha conta é somente leitura e sem criação de jogos.',
    bloxbux: 100,
    joinDate: 'Hoje',
    avatar: { ...NOOB_AVATAR },
    inventory: ['face-epic'],
    badges: [],
    friends: [],
    followersCount: 0,
    followingCount: 0,
    isPremium: false
  };
}

export function createUserFromEmail(email: string, customUsername?: string): UserProfile {
  const baseName = customUsername?.trim() || email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'BloxPlayer';
  return {
    id: `user-${Date.now()}`,
    username: baseName,
    displayName: baseName,
    email: email.trim().toLowerCase(),
    isGuest: false,
    status: 'Criador & Jogador BloxVerse',
    bio: `Jogador verificado via ${email}. Pronto para construir no Studio, conversar e explorar!`,
    bloxbux: 1500,
    joinDate: 'Hoje',
    avatar: {
      bodyColors: {
        head: '#facc15',
        torso: '#2563eb',
        leftArm: '#facc15',
        rightArm: '#facc15',
        leftLeg: '#16a34a',
        rightLeg: '#16a34a'
      },
      equippedHat: 'hat-noob',
      equippedFace: 'face-epic',
      equippedShirt: 'shirt-tuxedo',
      equippedPants: 'pants-jeans',
      equippedGear: 'gear-speedcoil',
      scale: { height: 1, width: 1, head: 1 },
      animation: 'idle'
    },
    inventory: ['hat-noob', 'face-epic', 'shirt-tuxedo', 'pants-jeans', 'gear-speedcoil'],
    badges: ['b-1'],
    friends: [],
    followersCount: 0,
    followingCount: 0,
    isPremium: true
  };
}

export function hasCompletedAuth(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.AUTH_STATUS));
  } catch {
    return false;
  }
}

export function setAuthStatus(status: 'guest' | 'email'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, status);
  } catch {}
}

export function clearAuthStatus(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {}
}

export function loadUser(): UserProfile {
  const REMOVED_FRIEND_IDS = new Set(['friend-1', 'friend-2', 'friend-3']);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      if (parsed) {
        parsed.friends = [];
      }
      return parsed;
    }
  } catch {}
  return INITIAL_USER;
}

export function saveUser(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {}
}

export function loadGames(): GameMetadata[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (raw) {
      const parsed: GameMetadata[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out all pre-made/system/default games
        const customPlayerGames = parsed.filter(g => 
          g && g.creator?.id === 'user-self' && 
          !g.id.startsWith('game-starter') && 
          !g.id.startsWith('game-neon') && 
          !g.id.startsWith('game-lava') && 
          !g.id.startsWith('game-blox') &&
          !g.id.startsWith('game-vida') &&
          !g.id.startsWith('game-caes') &&
          !g.id.startsWith('game-retroslop') &&
          !g.id.startsWith('game-destrua') &&
          !g.id.startsWith('game-ceus') &&
          !g.id.startsWith('game-caos')
        );
        return customPlayerGames;
      }
    }
  } catch {}
  return [];
}

export function saveGames(games: GameMetadata[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  } catch {}
}

export function loadFriends(): Friend[] {
  try {
    localStorage.removeItem(STORAGE_KEYS.FRIENDS);
  } catch {}
  return [];
}

export function saveFriends(friends: Friend[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
  } catch {}
}

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_GROUPS;
}

export function saveGroups(groups: Group[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  } catch {}
}

export function loadShopItems(): ShopItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOP);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_SHOP_ITEMS;
}

export function saveShopItems(items: ShopItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(items));
  } catch {}
}
