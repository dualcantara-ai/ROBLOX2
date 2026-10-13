export type PartType = 
  | 'block' 
  | 'sphere' 
  | 'cylinder' 
  | 'wedge' 
  | 'truss' 
  | 'killbrick' 
  | 'bouncepad' 
  | 'speedpad' 
  | 'coin' 
  | 'spawn' 
  | 'checkpoint'
  | 'teleporter'
  | 'npc'
  | 'spotlight';

export type MaterialType = 'plastic' | 'neon' | 'metal' | 'glass' | 'wood' | 'brick' | 'forcefield';

export interface BloxVector3 {
  x: number;
  y: number;
  z: number;
}

export interface BloxColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export interface BloxScript {
  trigger: 'onTouch' | 'constant' | 'interact';
  action: 'damage' | 'heal' | 'bounce' | 'speedBoost' | 'giveCoins' | 'teleport' | 'rotate' | 'openDoor' | 'playAudio';
  parameter: number | string;
}

export interface BloxAttribute {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  value: string | number | boolean;
}

export type NormalId = 'Top' | 'Bottom' | 'Front' | 'Back' | 'Left' | 'Right';

export interface BloxTexture {
  id: string;
  name: string;
  className: 'Texture' | 'Decal';
  texture: string; // URL, preset identifier ('studs', 'welds', 'hazard', 'lava', 'cyber', 'smile', 'brick', 'metal') or custom image
  face: NormalId;
  studsPerTileU?: number;
  studsPerTileV?: number;
  transparency?: number;
  color?: string;
}

export interface BloxWeldConstraint {
  id: string;
  name: string;
  className: 'WeldConstraint';
  part0Id: string;
  part1Id: string;
  enabled: boolean;
  offset?: BloxVector3;
}

export interface BloxTool {
  id: string;
  name: string;
  className: 'Tool';
  toolTip?: string;
  icon?: string;
  requiresHandle?: boolean;
  actionType?: 'sword' | 'cola' | 'speed_coil' | 'gravity_coil' | 'flashlight' | 'custom';
  damage?: number;
  handleColor?: string;
  handleSize?: BloxVector3;
  scriptSource?: string;
}

export interface BloxGuiElement {
  id: string;
  name: string;
  className: 'ScreenGui' | 'BillboardGui' | 'SurfaceGui' | 'Frame' | 'TextLabel' | 'TextButton' | 'ImageLabel';
  parentPartId?: string; // For BillboardGui and SurfaceGui
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  backgroundTransparency?: number;
  size?: { x: number; y: number };
  position?: { x: number; y: number };
  visible?: boolean;
  studsOffset?: BloxVector3;
  face?: NormalId;
  onClickAction?: string; // e.g. 'heal', 'damage', 'speed', 'custom'
}

export interface BloxPart {
  id: string;
  name: string;
  className?: string; // e.g. 'Part', 'SpawnLocation', 'MeshPart'
  type: PartType;
  position: BloxVector3; // Vector3 Position (X, Y, Z studs)
  size: BloxVector3; // Vector3 Size (X, Y, Z studs)
  rotation: BloxVector3;
  color: string;
  material: MaterialType;
  anchored: boolean; // isAnchored: true = locked in place, false = dynamic physics & reacts with gravity/pushing
  isAnchored?: boolean; // alias for anchored
  canCollide: boolean; // canCollide: true = solid collision with parts & players, false = non-solid pass-through
  transparency: number; // 0 (opaque) to 1 (completely invisible)
  reflectance?: number;
  mass?: number;
  velocity?: BloxVector3; // Current physical velocity
  attributes?: { [key: string]: string | number | boolean }; // Custom Instance Attributes
  script?: BloxScript;
  label?: string;
  coinValue?: number;
  textures?: BloxTexture[];
  weldConstraints?: BloxWeldConstraint[];
  guis?: BloxGuiElement[];
  luauScripts?: Array<{
    id: string;
    name: string;
    className: 'Script' | 'LocalScript';
    source: string;
    enabled: boolean;
    parentPartId?: string;
    createdAt?: string;
  }>;
}

export interface PlayerBodyPart {
  id: string;
  name: 'HumanoidRootPart' | 'Head' | 'Torso' | 'LeftArm' | 'RightArm' | 'LeftLeg' | 'RightLeg';
  className: 'Part';
  size: BloxVector3;
  anchored: boolean; // Always false
  isAnchored: boolean; // Always false
  canCollide: boolean; // Always true
  transparency: number;
  color?: string;
  attributes: { [key: string]: string | number | boolean };
}

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  thumbnail: string;
  genre: 'Obby / Parkour' | 'Adventure' | 'Tycoon' | 'Survival' | 'Horror' | 'Sandbox' | 'Action';
  playingCount: number;
  visits: number;
  likes: number;
  dislikes: number;
  price: number; // 0 for free
  gamePasses?: GamePass[];
  badges?: GameBadge[];
  parts: BloxPart[];
  scripts?: Array<{
    id: string;
    name: string;
    className: 'Script' | 'LocalScript';
    source: string;
    enabled: boolean;
    parentPartId?: string;
    createdAt?: string;
  }>;
  tools?: BloxTool[];
  guis?: BloxGuiElement[];
  spawnPoint: BloxVector3;
  createdAt: string;
  updatedAt: string;
}

export interface GamePass {
  id: string;
  title: string;
  description: string;
  price: number;
  icon: string;
  benefit: 'double_jump' | 'speed_coil' | 'gravity_coil' | 'vip_chat' | 'skip_stage';
}

export interface GameBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedCount: number;
}

export interface AvatarAppearance {
  bodyColors: {
    head: string;
    torso: string;
    leftArm: string;
    rightArm: string;
    leftLeg: string;
    rightLeg: string;
  };
  equippedHat?: string;
  equippedFace?: string;
  equippedShirt?: string;
  equippedPants?: string;
  equippedGear?: string;
  scale: {
    height: number;
    width: number;
    head: number;
  };
  animation: 'idle' | 'walk' | 'jump' | 'dance' | 'wave';
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'hat' | 'face' | 'shirt' | 'pants' | 'gear' | 'animation';
  price: number;
  thumbnail: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Limited';
  isLimited?: boolean;
  originalStock?: number;
  remainingStock?: number;
  color?: string;
  assetType?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  isGuest?: boolean;
  status: string;
  bio: string;
  bloxbux: number;
  joinDate: string;
  avatar: AvatarAppearance;
  inventory: string[]; // item IDs
  badges: string[]; // badge IDs
  friends: string[]; // user IDs
  followersCount: number;
  followingCount: number;
  isPremium: boolean;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  status: 'playing' | 'studio' | 'online' | 'offline';
  currentGame?: string;
  avatarColors: {
    head: string;
    torso: string;
    leftArm: string;
    rightArm: string;
    leftLeg: string;
    rightLeg: string;
  };
  lastSeen: string;
  avatarHat?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  owner: string;
  memberCount: number;
  funds: number;
  wallPosts: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
    rank: string;
  }[];
  joined: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  isVIP?: boolean;
}
