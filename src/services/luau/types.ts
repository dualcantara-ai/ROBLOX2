import { BloxPart, BloxVector3 } from '../../types';

export interface LuauScriptInstance {
  id: string;
  name: string;
  className: 'Script' | 'LocalScript';
  source: string;
  enabled: boolean;
  parentPartId?: string; // ID of the parent Part or 'Workspace'
  runMode?: 'onPlay' | 'always';
  lastLog?: string;
  createdAt?: string;
}

export interface LuauLogEntry {
  id: string;
  timestamp: string;
  type: 'print' | 'warn' | 'error' | 'info';
  message: string;
  scriptId?: string;
  scriptName?: string;
}

export interface LuauExecutionContext {
  scriptId: string;
  scriptName: string;
  parentPart?: BloxPart;
  parts: BloxPart[];
  onUpdatePart: (partId: string, partial: Partial<BloxPart>) => void;
  onAddPart: (part: BloxPart) => void;
  onRemovePart: (partId: string) => void;
  onLog: (entry: LuauLogEntry) => void;
  getPlayer?: () => {
    isActive?: boolean;
    position: BloxVector3;
    health?: number;
    maxHealth?: number;
    walkSpeed?: number;
    jumpPower?: number;
    takeDamage: (amount: number) => void;
    heal: (amount: number) => void;
    setSpeed: (speed: number) => void;
    setJumpPower: (jumpPower: number) => void;
    teleport: (pos: BloxVector3) => void;
    addCoins: (amount: number) => void;
  };
  onRigMoveTo?: (rigPartId: string, targetPos: BloxVector3, walkSpeed?: number) => void;
  onRigAttack?: (rigPartId: string) => void;
  onRigDied?: (rigPartId: string) => void;
  onTouchEvent?: (partId: string, callback: (hit: any) => void) => () => void;
  onAddGui?: (gui: any) => void;
  onAddTool?: (tool: any) => void;
}
