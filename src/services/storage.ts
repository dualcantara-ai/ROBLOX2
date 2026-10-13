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

export const INITIAL_GAMES: GameMetadata[] = [
  {
    id: 'game-neon-obby',
    title: '⚡ Mega Neon Obby [50+ Stages]',
    description: 'Jump through glowing neon laser fields, spinning killbricks, bouncy trampolines, and collect BloxBux coins! Can you reach the Golden Altar in the sky?',
    creator: {
      id: 'dev-1',
      username: 'BloxMaster_99',
      isVerified: true
    },
    thumbnail: '/src/assets/images/neon_obby_game_1791893718114.jpg',
    genre: 'Obby / Parkour',
    playingCount: 4210,
    visits: 890450,
    likes: 38200,
    dislikes: 1200,
    price: 0,
    parts: createObbyParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-03-01',
    updatedAt: '2026-10-06',
    gamePasses: [
      { id: 'gp-1', title: 'Speed Coil [2x Speed]', description: 'Run twice as fast across all stages', price: 250, icon: '🌀', benefit: 'speed_coil' },
      { id: 'gp-2', title: 'Gravity Coil [Moon Jump]', description: 'Super floaty jumps to bypass difficult gaps', price: 350, icon: '🚀', benefit: 'gravity_coil' },
      { id: 'gp-3', title: 'Skip Stage Pass', description: 'Instantly bypass whatever stage is frustrating you', price: 99, icon: '⏭️', benefit: 'skip_stage' }
    ],
    badges: [
      { id: 'b-1', title: 'First Steps', description: 'Survive the first stepping stones', icon: '🥉', earnedCount: 65000 },
      { id: 'b-2', title: 'Lava Surfer', description: 'Cleared the red beam gauntlet', icon: '🥈', earnedCount: 22000 },
      { id: 'b-3', title: 'Obby Champion', description: 'Touched the Golden Altar!', icon: '🏆', earnedCount: 8400 }
    ]
  },
  {
    id: 'game-lava-survival',
    title: '🔥 The Floor Is Lava Survival',
    description: 'The volcanic ground is rising with boiling magma! Leap across collapsing pillars, grab high-altitude stars, and be the last player standing!',
    creator: {
      id: 'dev-2',
      username: 'VolcanoKing',
      isVerified: true
    },
    thumbnail: '/src/assets/images/lava_survival_game_1791893717389.jpg',
    genre: 'Survival',
    playingCount: 2850,
    visits: 540100,
    likes: 24100,
    dislikes: 950,
    price: 0,
    parts: createLavaFloorParts(),
    spawnPoint: { x: 0, y: 3, z: 0 },
    createdAt: '2026-04-12',
    updatedAt: '2026-10-05',
    gamePasses: [
      { id: 'gp-doublejump', title: 'Double Jump Jetpack', description: 'Tap space in midair for a secondary vertical boost', price: 400, icon: '🪂', benefit: 'double_jump' }
    ]
  },
  {
    id: 'game-blox-tycoon',
    title: '🏭 Ultimate Cyber Tycoon',
    description: 'Build your multi-million BloxBux factory! Upgrade droppers, power up neon generators, unlock laser security and show off your industrial empire.',
    creator: {
      id: 'dev-3',
      username: 'TycoonTycoon_YT',
      isVerified: false
    },
    thumbnail: '/src/assets/images/cyber_tycoon_game_1791893717796.jpg',
    genre: 'Tycoon',
    playingCount: 3120,
    visits: 620000,
    likes: 29800,
    dislikes: 1400,
    price: 0,
    parts: createTycoonParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-05-20',
    updatedAt: '2026-10-04'
  },
  {
    id: 'game-vida-de-asilo',
    title: 'Vida de Asilo 🔊',
    description: 'Explore a cidade misteriosa, descubra salas secretas, converse com os internos e encontre a chave dourada para fugir do asilo!',
    creator: { id: 'dev-asilo', username: 'AsylumDev', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    genre: 'Adventure',
    playingCount: 5100,
    visits: 1240000,
    likes: 83000,
    dislikes: 17000,
    price: 0,
    parts: createObbyParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-06-10',
    updatedAt: '2026-10-10'
  },
  {
    id: 'game-caes',
    title: 'cães 🐾',
    description: 'Adote cachorrinhos fofos em blocos, monte casinhas e explore a vila dos pets com seus amigos!',
    creator: { id: 'dev-pets', username: 'DoggoMaster', isVerified: false },
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    genre: 'Sandbox',
    playingCount: 1850,
    visits: 420000,
    likes: 90000,
    dislikes: 10000,
    price: 0,
    parts: createTycoonParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-07-01',
    updatedAt: '2026-10-11'
  },
  {
    id: 'game-retroslop',
    title: 'Tycoon de Retroslop',
    description: 'Construa o clássico QG em studs com geradores de moedas nostálgicos e esteiras rolantes velozes!',
    creator: { id: 'dev-retro', username: 'OldBloxDev', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    genre: 'Tycoon',
    playingCount: 2200,
    visits: 390000,
    likes: 86000,
    dislikes: 14000,
    price: 0,
    parts: createTycoonParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-08-15',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-destrua-cidade',
    title: '[☢️UPD] Destrua a Cidade',
    description: 'Use física em tempo real, canhões e bolas de demolição para derrubar arranha-céus inteiros em blocos 3D!',
    creator: { id: 'dev-boom', username: 'CityDestroyer', isVerified: true },
    thumbnail: '/src/assets/images/city_destruction_game_1791893717870.jpg',
    genre: 'Survival',
    playingCount: 4890,
    visits: 980000,
    likes: 90000,
    dislikes: 10000,
    price: 0,
    parts: createLavaFloorParts(),
    spawnPoint: { x: 0, y: 3, z: 0 },
    createdAt: '2026-09-02',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-ceus-de-ferro',
    title: '[NOVO] Céus de Ferro - Beta',
    description: 'Pilote aviões velozes e biplanos, faça manobras aéreas e participe de batalhas nas nuvens.',
    creator: { id: 'dev-sky', username: 'AcePilot_99', isVerified: false },
    thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    genre: 'Adventure',
    playingCount: 1650,
    visits: 310000,
    likes: 72000,
    dislikes: 28000,
    price: 0,
    parts: createObbyParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-09-18',
    updatedAt: '2026-10-10'
  },
  {
    id: 'game-caos-porto',
    title: '🎃 Caos no Porto',
    description: 'Batalha intensa em porta-aviões e docas com canhões d’água, foguetes e trampolins gigantes!',
    creator: { id: 'dev-harbor', username: 'PortAdmiral', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&auto=format&fit=crop&q=80',
    genre: 'Survival',
    playingCount: 3400,
    visits: 710000,
    likes: 88000,
    dislikes: 12000,
    price: 0,
    parts: createLavaFloorParts(),
    spawnPoint: { x: 0, y: 3, z: 0 },
    createdAt: '2026-10-01',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-destrua-cubo',
    title: '[ASMR] Destrua o Cubo!',
    description: 'Quebre cubos satisfatórios camada por camada para encontrar gemas raras e BloxBux escondidos.',
    creator: { id: 'dev-cube', username: 'CubeMaster', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
    genre: 'Sandbox',
    playingCount: 2900,
    visits: 540000,
    likes: 75000,
    dislikes: 25000,
    price: 0,
    parts: createTycoonParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-10-02',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-forca-aerea-zumbi',
    title: '✈️ Força Aérea Zumbi',
    description: 'Sobreviva a hordas infinitas de zumbis atacando sua base em uma ilha isolada no inverno.',
    creator: { id: 'dev-zombie', username: 'ZombieHunter', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    genre: 'Survival',
    playingCount: 3950,
    visits: 890000,
    likes: 88000,
    dislikes: 12000,
    price: 0,
    parts: createLavaFloorParts(),
    spawnPoint: { x: 0, y: 3, z: 0 },
    createdAt: '2026-10-03',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-correr-na-lua',
    title: 'Correr na Lua 🌕',
    description: 'Gravidade reduzida na lua! Pule 10 metros de altura em crateras e colete cristais espaciais.',
    creator: { id: 'dev-moon', username: 'AstroNoob', isVerified: false },
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    genre: 'Obby / Parkour',
    playingCount: 1200,
    visits: 230000,
    likes: 86000,
    dislikes: 14000,
    price: 0,
    parts: createObbyParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-10-04',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-tanques',
    title: 'TANQUES! [Batalha Épica]',
    description: 'Controle tanques blindados, mire os projéteis e domine os pontos de controle na arena desértica.',
    creator: { id: 'dev-tank', username: 'GeneralBlox', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    genre: 'Survival',
    playingCount: 2380,
    visits: 490000,
    likes: 93000,
    dislikes: 7000,
    price: 0,
    parts: createLavaFloorParts(),
    spawnPoint: { x: 0, y: 3, z: 0 },
    createdAt: '2026-10-05',
    updatedAt: '2026-10-12'
  },
  {
    id: 'game-ragdoll-factory',
    title: 'Fábrica de Ragdoll 🎪',
    description: 'Física maluca de ragdoll! Seja arremessado por canhões, escorregue em tobogãs gigantes e dê risada.',
    creator: { id: 'dev-ragdoll', username: 'PhysicsFun', isVerified: true },
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    genre: 'Sandbox',
    playingCount: 4100,
    visits: 890000,
    likes: 82000,
    dislikes: 18000,
    price: 0,
    parts: createObbyParts(),
    spawnPoint: { x: 0, y: 2, z: 0 },
    createdAt: '2026-10-06',
    updatedAt: '2026-10-12'
  }
];

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
  friends: ['friend-1', 'friend-2', 'friend-3', 'friend-4'],
  followersCount: 320,
  followingCount: 45,
  isPremium: true
};

export const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'friend-1',
    username: 'PixelNinja_X',
    displayName: 'PixelNinja',
    status: 'playing',
    currentGame: '⚡ Mega Neon Obby [50+ Stages]',
    avatarColors: {
      head: '#f59e0b',
      torso: '#ef4444',
      leftArm: '#f59e0b',
      rightArm: '#f59e0b',
      leftLeg: '#1e293b',
      rightLeg: '#1e293b'
    },
    lastSeen: 'Now',
    avatarHat: '🥷'
  },
  {
    id: 'friend-2',
    username: 'Luna_Blox',
    displayName: 'Luna',
    status: 'studio',
    avatarColors: {
      head: '#fcd34d',
      torso: '#ec4899',
      leftArm: '#fcd34d',
      rightArm: '#fcd34d',
      leftLeg: '#8b5cf6',
      rightLeg: '#8b5cf6'
    },
    lastSeen: '10m ago',
    avatarHat: '👑'
  },
  {
    id: 'friend-3',
    username: 'CyberKnight99',
    displayName: 'Sir Cyber',
    status: 'online',
    avatarColors: {
      head: '#64748b',
      torso: '#0284c7',
      leftArm: '#64748b',
      rightArm: '#64748b',
      leftLeg: '#0f172a',
      rightLeg: '#0f172a'
    },
    lastSeen: '2h ago',
    avatarHat: '🪖'
  },
  {
    id: 'friend-4',
    username: 'gabriel2025',
    displayName: 'gabriel2025',
    status: 'playing',
    currentGame: '🎃 Mundo dos Monstros',
    avatarColors: {
      head: '#fde047',
      torso: '#3b82f6',
      leftArm: '#fde047',
      rightArm: '#fde047',
      leftLeg: '#22c55e',
      rightLeg: '#22c55e'
    },
    lastSeen: 'Now',
    avatarHat: '🎃'
  },
  {
    id: 'friend-5',
    username: 'larry',
    displayName: 'larry',
    status: 'playing',
    currentGame: 'Piggy [Floresta Sombria]',
    avatarColors: {
      head: '#f97316',
      torso: '#ea580c',
      leftArm: '#f97316',
      rightArm: '#f97316',
      leftLeg: '#1e293b',
      rightLeg: '#1e293b'
    },
    lastSeen: 'Now',
    avatarHat: '🎃'
  },
  {
    id: 'friend-6',
    username: 'WEY',
    displayName: 'WEY',
    status: 'playing',
    currentGame: 'Faça Ramen & Coma!',
    avatarColors: {
      head: '#64748b',
      torso: '#10b981',
      leftArm: '#64748b',
      rightArm: '#64748b',
      leftLeg: '#0f172a',
      rightLeg: '#0f172a'
    },
    lastSeen: 'Now',
    avatarHat: '💻'
  },
  {
    id: 'friend-7',
    username: 'Sammsson',
    displayName: 'Sammsson',
    status: 'online',
    avatarColors: {
      head: '#facc15',
      torso: '#1e293b',
      leftArm: '#facc15',
      rightArm: '#facc15',
      leftLeg: '#1e293b',
      rightLeg: '#1e293b'
    },
    lastSeen: '5m atrás',
    avatarHat: '🧢'
  },
  {
    id: 'friend-8',
    username: 'astro_hs50',
    displayName: 'astro_hs50',
    status: 'playing',
    currentGame: 'Correr na Lua 🌕',
    avatarColors: {
      head: '#f59e0b',
      torso: '#ef4444',
      leftArm: '#f59e0b',
      rightArm: '#f59e0b',
      leftLeg: '#1e293b',
      rightLeg: '#1e293b'
    },
    lastSeen: 'Now',
    avatarHat: '🥷'
  },
  {
    id: 'friend-9',
    username: 'XxfelipexX',
    displayName: 'XxfelipexX',
    status: 'online',
    avatarColors: {
      head: '#fcd34d',
      torso: '#06b6d4',
      leftArm: '#fcd34d',
      rightArm: '#fcd34d',
      leftLeg: '#0891b2',
      rightLeg: '#0891b2'
    },
    lastSeen: '12m atrás',
    avatarHat: '👑'
  },
  {
    id: 'friend-10',
    username: 'bro',
    displayName: 'bro',
    status: 'playing',
    currentGame: '[☢️UPD] Destrua a Cidade',
    avatarColors: {
      head: '#e2e8f0',
      torso: '#ec4899',
      leftArm: '#e2e8f0',
      rightArm: '#e2e8f0',
      leftLeg: '#be185d',
      rightLeg: '#be185d'
    },
    lastSeen: 'Now',
    avatarHat: '🧢'
  },
  {
    id: 'friend-11',
    username: 'atumalaka',
    displayName: 'atumalaka',
    status: 'online',
    avatarColors: {
      head: '#facc15',
      torso: '#3b82f6',
      leftArm: '#facc15',
      rightArm: '#facc15',
      leftLeg: '#22c55e',
      rightLeg: '#22c55e'
    },
    lastSeen: '25m atrás',
    avatarHat: '😄'
  },
  {
    id: 'friend-12',
    username: 'ultramogger',
    displayName: 'ultramogger',
    status: 'online',
    avatarColors: {
      head: '#475569',
      torso: '#1e293b',
      leftArm: '#475569',
      rightArm: '#475569',
      leftLeg: '#0f172a',
      rightLeg: '#0f172a'
    },
    lastSeen: '1h atrás',
    avatarHat: '🕶️'
  },
  {
    id: 'friend-13',
    username: 'contas_testes88',
    displayName: 'contas_testes',
    status: 'online',
    avatarColors: {
      head: '#facc15',
      torso: '#2563eb',
      leftArm: '#facc15',
      rightArm: '#facc15',
      leftLeg: '#16a34a',
      rightLeg: '#16a34a'
    },
    lastSeen: '2h atrás',
    avatarHat: '🧢'
  },
  {
    id: 'friend-14',
    username: 'EpicAnima',
    displayName: 'EpicAnima',
    status: 'online',
    avatarColors: {
      head: '#fef08a',
      torso: '#f59e0b',
      leftArm: '#fef08a',
      rightArm: '#fef08a',
      leftLeg: '#b45309',
      rightLeg: '#b45309'
    },
    lastSeen: '3h atrás',
    avatarHat: '✨'
  },
  {
    id: 'friend-15',
    username: 'Hollow_Knight',
    displayName: 'Hollow_Knight',
    status: 'playing',
    currentGame: '⚡ Mega Neon Obby',
    avatarColors: {
      head: '#1e293b',
      torso: '#475569',
      leftArm: '#1e293b',
      rightArm: '#1e293b',
      leftLeg: '#0f172a',
      rightLeg: '#0f172a'
    },
    lastSeen: 'Now',
    avatarHat: '🥷'
  }
];

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
      { id: 'wp-2', author: 'PixelNinja_X', content: 'Working on a new speed obby, who wants to test play?', timestamp: '4h ago', rank: 'Scripter' }
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
    friends: ['friend-1', 'friend-2'],
    followersCount: 15,
    followingCount: 5,
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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) return JSON.parse(raw);
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
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_GAMES;
}

export function saveGames(games: GameMetadata[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  } catch {}
}

export function loadFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_FRIENDS;
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
