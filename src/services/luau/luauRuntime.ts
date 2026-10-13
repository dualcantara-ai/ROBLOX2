import { BloxPart, BloxVector3, BloxTexture, BloxWeldConstraint, BloxTool, BloxGuiElement, NormalId } from '../../types';
import { LuauExecutionContext, LuauLogEntry, LuauScriptInstance } from './types';
import { sounds } from '../soundEffects';

export interface RunningScriptHandle {
  id: string;
  cancel: () => void;
  isRunning: boolean;
}

export class LuauEngine {
  private runningScripts: Map<string, { cancel: () => void; isRunning: boolean }> = new Map();
  private touchListeners: Map<string, Set<(hit: any) => void>> = new Map();
  private clickListeners: Map<string, Set<(player: any) => void>> = new Map();
  private toolActivatedListeners: Map<string, Set<() => void>> = new Map();

  /**
   * Helper to format values into hex colors
   */
  public static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const clamped = Math.max(0, Math.min(255, Math.round(n)));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Helper to parse color into {r, g, b, hex}
   */
  public static parseColor(val: any): { r: number; g: number; b: number; hex: string } {
    if (typeof val === 'string') {
      const hex = val.startsWith('#') ? val : `#${val}`;
      const r = parseInt(hex.slice(1, 3), 16) || 255;
      const g = parseInt(hex.slice(3, 5), 16) || 255;
      const b = parseInt(hex.slice(5, 7), 16) || 255;
      return { r, g, b, hex };
    }
    if (val && val.hex) {
      return { r: val.r ?? 255, g: val.g ?? 255, b: val.b ?? 255, hex: val.hex };
    }
    if (val && typeof val.r === 'number') {
      return { r: val.r, g: val.g, b: val.b, hex: LuauEngine.rgbToHex(val.r, val.g, val.b) };
    }
    return { r: 255, g: 255, b: 255, hex: '#ffffff' };
  }

  /**
   * Transpile Luau code into asynchronous Javascript
   */
  public transpileLuau(source: string): string {
    let code = source;

    // 1. Remove multiline comments --[[ ... ]]
    code = code.replace(/--\[\[[\s\S]*?\]\]/g, '');

    // 2. Normalize line by line
    const lines = code.split('\n');
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Remove single line comments
      const commentIdx = line.indexOf('--');
      if (commentIdx !== -1) {
        const before = line.substring(0, commentIdx);
        const quoteCount = (before.match(/"/g) || []).length + (before.match(/'/g) || []).length;
        if (quoteCount % 2 === 0) {
          line = before;
        }
      }

      // Trim Luau type annotations like `: number`, `: Part`, `: boolean`, `:: any`
      line = line.replace(/:\s*([A-Za-z0-9_<>]+)(\s*=|\s*,|\s*\))/g, '$2');
      line = line.replace(/::\s*[A-Za-z0-9_]+/g, '');

      // Replace operators
      line = line.replace(/~=/g, '!==');
      line = line.replace(/\s*\.\.\s*/g, ' + ');

      // Logical operators: and -> &&, or -> ||, not -> !
      line = line.replace(/\band\b/g, '&&');
      line = line.replace(/\bor\b/g, '||');
      line = line.replace(/\bnot\s+/g, '!');

      // Replace Luau table length #var with var.length
      line = line.replace(/#([A-Za-z0-9_.]+)/g, '($1.length || 0)');

      // Loops and control flow
      // while <cond> do -> while (<cond>) { await __yieldCheck();
      const whileMatch = line.match(/^(\s*)while\s+(.+)\s+do\s*$/);
      if (whileMatch) {
        line = `${whileMatch[1]}while (${whileMatch[2]}) { await __yieldCheck();`;
        processedLines.push(line);
        continue;
      }

      // repeat -> do { await __yieldCheck();
      const repeatMatch = line.match(/^(\s*)repeat\s*$/);
      if (repeatMatch) {
        line = `${repeatMatch[1]}do { await __yieldCheck();`;
        processedLines.push(line);
        continue;
      }

      // until <cond> -> } while (!<cond>);
      const untilMatch = line.match(/^(\s*)until\s+(.+)\s*$/);
      if (untilMatch) {
        line = `${untilMatch[1]}} while (!(${untilMatch[2]}));`;
        processedLines.push(line);
        continue;
      }

      // for i = start, finish[, step] do
      const forNumMatch = line.match(/^(\s*)for\s+([A-Za-z0-9_]+)\s*=\s*([^,]+)\s*,\s*([^,]+)(?:\s*,\s*([^,]+))?\s+do\s*$/);
      if (forNumMatch) {
        const indent = forNumMatch[1];
        const v = forNumMatch[2];
        const start = forNumMatch[3].trim();
        const finish = forNumMatch[4].trim();
        const step = forNumMatch[5] ? forNumMatch[5].trim() : '1';
        line = `${indent}for (let ${v} = ${start}; (${step}) >= 0 ? ${v} <= (${finish}) : ${v} >= (${finish}); ${v} += (${step})) { await __yieldCheck();`;
        processedLines.push(line);
        continue;
      }

      // for k, v in pairs(tbl) do
      const forPairsMatch = line.match(/^(\s*)for\s+([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s+in\s+(?:pairs|ipairs)\((.+)\)\s+do\s*$/);
      if (forPairsMatch) {
        const indent = forPairsMatch[1];
        const k = forPairsMatch[2];
        const v = forPairsMatch[3];
        const tbl = forPairsMatch[4];
        line = `${indent}for (const [${k}, ${v}] of Object.entries(${tbl})) { await __yieldCheck();`;
        processedLines.push(line);
        continue;
      }

      // if <cond> then
      const ifMatch = line.match(/^(\s*)if\s+(.+)\s+then\s*$/);
      if (ifMatch) {
        line = `${ifMatch[1]}if (${ifMatch[2]}) {`;
        processedLines.push(line);
        continue;
      }

      // elseif <cond> then
      const elseifMatch = line.match(/^(\s*)elseif\s+(.+)\s+then\s*$/);
      if (elseifMatch) {
        line = `${elseifMatch[1]}} else if (${elseifMatch[2]}) {`;
        processedLines.push(line);
        continue;
      }

      // else
      const elseMatch = line.match(/^(\s*)else\s*$/);
      if (elseMatch) {
        line = `${elseMatch[1]}} else {`;
        processedLines.push(line);
        continue;
      }

      // function name(args)
      const funcMatch = line.match(/^(\s*)(?:local\s+)?function\s+([A-Za-z0-9_.:]+)\s*\((.*?)\)\s*$/);
      if (funcMatch) {
        const indent = funcMatch[1];
        const fname = funcMatch[2];
        const fargs = funcMatch[3];
        if (fname.includes(':') || fname.includes('.')) {
          const parts = fname.split(/[:.]/);
          const obj = parts[0];
          const meth = parts[1];
          line = `${indent}${obj}.${meth} = async function(${fargs}) {`;
        } else {
          line = `${indent}async function ${fname}(${fargs}) {`;
        }
        processedLines.push(line);
        continue;
      }

      // end) -> });
      if (/^\s*end\s*\)\s*;?$/.test(line)) {
        line = line.replace(/end\s*\)/, '})');
        processedLines.push(line);
        continue;
      }

      // end -> }
      if (/^\s*end\s*;?$/.test(line)) {
        line = line.replace(/end/, '}');
        processedLines.push(line);
        continue;
      }

      // local var = val -> let var = val
      line = line.replace(/^(\s*)local\s+/g, '$1let ');

      // task.wait(x) or wait(x) -> await task.wait(x)
      line = line.replace(/(^|[^A-Za-z0-9_.])(task\.wait|wait)\s*\(/g, '$1await task.wait(');

      // :Connect(function(x) ... )
      line = line.replace(/:Connect\s*\(\s*function\s*\((.*?)\)/g, '.Connect(async function($1)');

      // Replace Luau method invocations :Method( -> .Method(
      line = line.replace(/:([A-Za-z0-9_]+)\s*\(/g, '.$1(');

      // Compound assignment operators: += and -= on Vector3 / CFrame properties
      line = line.replace(/([A-Za-z0-9_.]+\.(?:Position|CFrame|Rotation|Orientation|Size))\s*\+=\s*(.+)$/, '$1 = __vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.(?:Position|CFrame|Rotation|Orientation|Size))\s*-=\s*(.+)$/, '$1 = __vecSub($1, $2)');

      // Full assignment self-math: a.Position = a.Position + expr
      line = line.replace(/([A-Za-z0-9_.]+\.Position)\s*=\s*\1\s*\+\s*(.+)$/, '$1 = __vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Position)\s*=\s*\1\s*-\s*(.+)$/, '$1 = __vecSub($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Rotation)\s*=\s*\1\s*\+\s*(.+)$/, '$1 = __vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Rotation)\s*=\s*\1\s*-\s*(.+)$/, '$1 = __vecSub($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Orientation)\s*=\s*\1\s*\+\s*(.+)$/, '$1 = __vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Orientation)\s*=\s*\1\s*-\s*(.+)$/, '$1 = __vecSub($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Size)\s*=\s*\1\s*\+\s*(.+)$/, '$1 = __vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Size)\s*=\s*\1\s*-\s*(.+)$/, '$1 = __vecSub($1, $2)');

      // General Vector3.new addition/subtraction:
      line = line.replace(/([A-Za-z0-9_.]+\.Position)\s*\+\s*(Vector3\.new\([^)]*\))/g, '__vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Position)\s*-\s*(Vector3\.new\([^)]*\))/g, '__vecSub($1, $2)');
      line = line.replace(/(Vector3\.new\([^)]*\))\s*\+\s*([A-Za-z0-9_.]+\.Position)/g, '__vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Rotation)\s*\+\s*(Vector3\.new\([^)]*\))/g, '__vecAdd($1, $2)');
      line = line.replace(/([A-Za-z0-9_.]+\.Rotation)\s*-\s*(Vector3\.new\([^)]*\))/g, '__vecSub($1, $2)');

      // Math constants: math.huge -> Infinity, math.pi -> Math.PI
      line = line.replace(/\bmath\.huge\b/g, 'Infinity');
      line = line.replace(/\bmath\.pi\b/g, 'Math.PI');

      processedLines.push(line);
    }

    return processedLines.join('\n');
  }

  /**
   * Creates proxy object for a BloxPart to replicate Roblox Lua properties & methods
   */
  public createPartProxy(
    part: BloxPart,
    context: LuauExecutionContext
  ): any {
    const self = this;
    const partId = part.id;

    const proxy: any = {
      id: part.id,
      className: part.className || 'Part',
      get Name(): string {
        const current = context.parts.find(p => p.id === partId);
        return current ? current.name : part.name;
      },
      set Name(val: string) {
        context.onUpdatePart(partId, { name: String(val) });
      },

      get Position(): any {
        const current = context.parts.find(p => p.id === partId);
        const pos = current ? current.position : part.position;
        return {
          x: pos.x,
          y: pos.y,
          z: pos.z,
          X: pos.x,
          Y: pos.y,
          Z: pos.z,
          add: (other: any) => ({
            x: pos.x + (other?.x ?? other?.X ?? 0),
            y: pos.y + (other?.y ?? other?.Y ?? 0),
            z: pos.z + (other?.z ?? other?.Z ?? 0),
            X: pos.x + (other?.x ?? other?.X ?? 0),
            Y: pos.y + (other?.y ?? other?.Y ?? 0),
            Z: pos.z + (other?.z ?? other?.Z ?? 0)
          }),
          sub: (other: any) => ({
            x: pos.x - (other?.x ?? other?.X ?? 0),
            y: pos.y - (other?.y ?? other?.Y ?? 0),
            z: pos.z - (other?.z ?? other?.Z ?? 0),
            X: pos.x - (other?.x ?? other?.X ?? 0),
            Y: pos.y - (other?.y ?? other?.Y ?? 0),
            Z: pos.z - (other?.z ?? other?.Z ?? 0)
          })
        };
      },
      set Position(val: any) {
        if (!val) return;
        const x = Number(val.x ?? val.X ?? 0);
        const y = Number(val.y ?? val.Y ?? 0);
        const z = Number(val.z ?? val.Z ?? 0);
        if (isNaN(x) || isNaN(y) || isNaN(z)) return;
        context.onUpdatePart(partId, { position: { x, y, z } });
      },

      get CFrame(): any {
        const current = context.parts.find(p => p.id === partId);
        const pos = current ? current.position : part.position;
        return {
          Position: this.Position,
          p: this.Position,
          X: pos.x,
          Y: pos.y,
          Z: pos.z
        };
      },
      set CFrame(val: any) {
        if (!val) return;
        if (val.Position) {
          this.Position = val.Position;
        } else if (val.p) {
          this.Position = val.p;
        } else if (val.x !== undefined) {
          this.Position = val;
        }
      },

      get Size(): any {
        const current = context.parts.find(p => p.id === partId);
        const sz = current ? current.size : part.size;
        return {
          x: sz.x,
          y: sz.y,
          z: sz.z,
          X: sz.x,
          Y: sz.y,
          Z: sz.z
        };
      },
      set Size(val: any) {
        if (!val) return;
        const x = Math.max(0.1, Number(val.x ?? val.X ?? 1));
        const y = Math.max(0.1, Number(val.y ?? val.Y ?? 1));
        const z = Math.max(0.1, Number(val.z ?? val.Z ?? 1));
        context.onUpdatePart(partId, { size: { x, y, z } });
      },

      get Rotation(): any {
        const current = context.parts.find(p => p.id === partId);
        const rot = current ? current.rotation : part.rotation;
        return {
          x: rot.x,
          y: rot.y,
          z: rot.z,
          X: rot.x,
          Y: rot.y,
          Z: rot.z
        };
      },
      set Rotation(val: any) {
        if (!val) return;
        const x = Number(val.x ?? val.X ?? 0);
        const y = Number(val.y ?? val.Y ?? 0);
        const z = Number(val.z ?? val.Z ?? 0);
        context.onUpdatePart(partId, { rotation: { x, y, z } });
      },

      get Orientation(): any {
        return this.Rotation;
      },
      set Orientation(val: any) {
        this.Rotation = val;
      },

      get Color(): any {
        const current = context.parts.find(p => p.id === partId);
        const color = current ? current.color : part.color;
        const parsed = LuauEngine.parseColor(color);
        return {
          r: parsed.r,
          g: parsed.g,
          b: parsed.b,
          hex: parsed.hex,
          R: parsed.r / 255,
          G: parsed.g / 255,
          B: parsed.b / 255
        };
      },
      set Color(val: any) {
        const parsed = LuauEngine.parseColor(val);
        context.onUpdatePart(partId, { color: parsed.hex });
      },

      get BrickColor(): any {
        return this.Color;
      },
      set BrickColor(val: any) {
        this.Color = val;
      },

      get Transparency(): number {
        const current = context.parts.find(p => p.id === partId);
        return current ? current.transparency : part.transparency;
      },
      set Transparency(val: number) {
        const num = Math.max(0, Math.min(1, Number(val) || 0));
        context.onUpdatePart(partId, { transparency: num });
      },

      get CanCollide(): boolean {
        const current = context.parts.find(p => p.id === partId);
        return current ? current.canCollide : part.canCollide;
      },
      set CanCollide(val: boolean) {
        context.onUpdatePart(partId, { canCollide: Boolean(val) });
      },

      get Anchored(): boolean {
        const current = context.parts.find(p => p.id === partId);
        return current ? current.anchored : part.anchored;
      },
      set Anchored(val: boolean) {
        context.onUpdatePart(partId, { anchored: Boolean(val), isAnchored: Boolean(val) });
      },

      get Material(): string {
        const current = context.parts.find(p => p.id === partId);
        return current ? current.material : part.material;
      },
      set Material(val: string) {
        const valid = ['plastic', 'neon', 'metal', 'glass', 'wood', 'brick', 'forcefield'];
        const str = String(val).toLowerCase();
        if (valid.includes(str)) {
          context.onUpdatePart(partId, { material: str as any });
        }
      },

      // Touched Event
      Touched: {
        Connect: (callback: (hit: any) => void) => {
          if (!self.touchListeners.has(partId)) {
            self.touchListeners.set(partId, new Set());
          }
          self.touchListeners.get(partId)!.add(callback);
          return {
            Disconnect: () => {
              self.touchListeners.get(partId)?.delete(callback);
            }
          };
        }
      },

      // TouchEnded Event
      TouchEnded: {
        Connect: (callback: (hit: any) => void) => {
          return {
            Disconnect: () => {}
          };
        }
      },

      // ClickDetector on part
      ClickDetector: {
        MouseClick: {
          Connect: (callback: (player: any) => void) => {
            if (!self.clickListeners.has(partId)) {
              self.clickListeners.set(partId, new Set());
            }
            self.clickListeners.get(partId)!.add(callback);
            return {
              Disconnect: () => {
                self.clickListeners.get(partId)?.delete(callback);
              }
            };
          }
        }
      },

      // ProximityPrompt on part
      ProximityPrompt: {
        Triggered: {
          Connect: (callback: (player: any) => void) => {
            if (!self.clickListeners.has(partId)) {
              self.clickListeners.set(partId, new Set());
            }
            self.clickListeners.get(partId)!.add(callback);
            return {
              Disconnect: () => {
                self.clickListeners.get(partId)?.delete(callback);
              }
            };
          }
        }
      },

      FindFirstChild: (childName: string) => {
        const lower = childName.toLowerCase();
        if (lower === 'clickdetector') return proxy.ClickDetector;
        if (lower === 'proximityprompt') return proxy.ProximityPrompt;
        const current = context.parts.find(p => p.id === partId);
        if (current?.textures) {
          const foundTex = current.textures.find(t => t.name.toLowerCase() === lower);
          if (foundTex) return foundTex;
        }
        if (current?.weldConstraints) {
          const foundWeld = current.weldConstraints.find(w => w.name.toLowerCase() === lower);
          if (foundWeld) return foundWeld;
        }
        return null;
      },

      WaitForChild: async (childName: string) => {
        return proxy.FindFirstChild(childName);
      },

      GetChildren: () => {
        const children: any[] = [];
        const current = context.parts.find(p => p.id === partId);
        if (current?.textures) children.push(...current.textures);
        if (current?.weldConstraints) children.push(...current.weldConstraints);
        if (current?.guis) children.push(...current.guis);
        return children;
      },

      Destroy: () => {
        context.onRemovePart(partId);
      },

      Clone: () => {
        const current = context.parts.find(p => p.id === partId) || part;
        const newId = `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const clonePart: BloxPart = {
          ...current,
          id: newId,
          name: `${current.name} (Clone)`,
          position: { ...current.position, x: current.position.x + 2 }
        };
        context.onAddPart(clonePart);
        return self.createPartProxy(clonePart, context);
      },

      get Parent(): any {
        return {
          Name: 'Workspace',
          FindFirstChild: (childName: string) => {
            const found = context.parts.find(p => p.name.toLowerCase() === childName.toLowerCase());
            return found ? self.createPartProxy(found, context) : null;
          },
          GetChildren: () => {
            return context.parts.map(p => self.createPartProxy(p, context));
          }
        };
      },

      IsA: (cName: string) => {
        const lower = String(cName).toLowerCase();
        return lower === 'instance' || lower === 'basepart' || lower === 'part' || (proxy.className?.toLowerCase() === lower);
      },

      GetAttribute: (attrName: string) => {
        const current = context.parts.find(p => p.id === partId);
        return current?.attributes?.[attrName];
      },

      SetAttribute: (attrName: string, value: any) => {
        const current = context.parts.find(p => p.id === partId);
        const attrs = { ...(current?.attributes || {}), [attrName]: value };
        context.onUpdatePart(partId, { attributes: attrs });
      }
    };

    return proxy;
  }

  /**
   * Fires touched event for a given part id
   */
  public triggerTouch(partId: string, hitInfo: any) {
    const listeners = this.touchListeners.get(partId);
    if (listeners && listeners.size > 0) {
      listeners.forEach(cb => {
        try {
          cb(hitInfo);
        } catch (err: any) {
          console.error('Error in Luau Touched listener:', err);
        }
      });
    }
  }

  /**
   * Fires click / interact event for a given part id
   */
  public triggerClick(partId: string, playerInfo: any) {
    const listeners = this.clickListeners.get(partId);
    if (listeners && listeners.size > 0) {
      listeners.forEach(cb => {
        try {
          cb(playerInfo);
        } catch (err: any) {
          console.error('Error in Luau Click listener:', err);
        }
      });
    }
  }

  /**
   * Fires tool activation event
   */
  public triggerToolActivated(toolName: string) {
    const listeners = this.toolActivatedListeners.get(toolName);
    if (listeners && listeners.size > 0) {
      listeners.forEach(cb => {
        try {
          cb();
        } catch (err: any) {
          console.error('Error in Luau Tool Activated listener:', err);
        }
      });
    }
  }

  /**
   * Executes a Luau Script instance
   */
  public async executeScript(
    script: LuauScriptInstance,
    context: LuauExecutionContext
  ): Promise<RunningScriptHandle> {
    this.stopScript(script.id);

    const engine = this;
    let isCancelled = false;
    let iterationCount = 0;
    const maxIterationsWithoutWait = 10000;

    const cancel = () => {
      isCancelled = true;
      this.touchListeners.delete(script.parentPartId || '');
      this.clickListeners.delete(script.parentPartId || '');
      this.runningScripts.delete(script.id);
    };

    const handle: RunningScriptHandle = {
      id: script.id,
      cancel,
      isRunning: true
    };

    this.runningScripts.set(script.id, handle);

    const yieldCheck = async () => {
      iterationCount++;
      if (iterationCount > maxIterationsWithoutWait) {
        iterationCount = 0;
        await new Promise(r => setTimeout(r, 4));
      }
      if (isCancelled) {
        throw new Error('__SCRIPT_CANCELLED__');
      }
    };

    const task = {
      wait: async (seconds = 0.03) => {
        iterationCount = 0;
        if (isCancelled) throw new Error('__SCRIPT_CANCELLED__');
        const ms = Math.max(16, Number(seconds) * 1000);
        await new Promise(resolve => setTimeout(resolve, ms));
        if (isCancelled) throw new Error('__SCRIPT_CANCELLED__');
        return seconds;
      },
      spawn: (fn: Function) => {
        setTimeout(async () => {
          if (!isCancelled) {
            try {
              await fn();
            } catch (e: any) {
              if (e?.message !== '__SCRIPT_CANCELLED__') {
                context.onLog({
                  id: `err-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  type: 'error',
                  message: `[Task Error] ${e?.message || String(e)}`,
                  scriptId: script.id,
                  scriptName: script.name
                });
              }
            }
          }
        }, 0);
      },
      delay: (sec: number, fn: Function) => {
        setTimeout(async () => {
          if (!isCancelled) {
            try {
              await fn();
            } catch (e: any) {
              if (e?.message !== '__SCRIPT_CANCELLED__') {
                context.onLog({
                  id: `err-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  type: 'error',
                  message: `[Task Delay Error] ${e?.message || String(e)}`,
                  scriptId: script.id,
                  scriptName: script.name
                });
              }
            }
          }
        }, Math.max(16, sec * 1000));
      }
    };

    // Vector3
    const Vector3 = {
      new: (x = 0, y = 0, z = 0) => ({
        x: Number(x) || 0,
        y: Number(y) || 0,
        z: Number(z) || 0,
        X: Number(x) || 0,
        Y: Number(y) || 0,
        Z: Number(z) || 0,
        add: function(other: any) {
          return Vector3.new(this.x + (other?.x ?? other?.X ?? 0), this.y + (other?.y ?? other?.Y ?? 0), this.z + (other?.z ?? other?.Z ?? 0));
        },
        sub: function(other: any) {
          return Vector3.new(this.x - (other?.x ?? other?.X ?? 0), this.y - (other?.y ?? other?.Y ?? 0), this.z - (other?.z ?? other?.Z ?? 0));
        },
        mul: function(n: number) {
          return Vector3.new(this.x * n, this.y * n, this.z * n);
        },
        get magnitude() {
          return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
      }),
      zero: { x: 0, y: 0, z: 0, X: 0, Y: 0, Z: 0 },
      one: { x: 1, y: 1, z: 1, X: 1, Y: 1, Z: 1 },
      xAxis: { x: 1, y: 0, z: 0, X: 1, Y: 0, Z: 0 },
      yAxis: { x: 0, y: 1, z: 0, X: 0, Y: 1, Z: 0 },
      zAxis: { x: 0, y: 0, z: 1, X: 0, Y: 0, Z: 1 }
    };

    const __vecAdd = (a: any, b: any) => {
      const ax = Number(a?.x ?? a?.X ?? (typeof a === 'number' ? a : 0));
      const ay = Number(a?.y ?? a?.Y ?? 0);
      const az = Number(a?.z ?? a?.Z ?? 0);
      const bx = Number(b?.x ?? b?.X ?? (typeof b === 'number' ? b : 0));
      const by = Number(b?.y ?? b?.Y ?? 0);
      const bz = Number(b?.z ?? b?.Z ?? 0);
      return Vector3.new(ax + bx, ay + by, az + bz);
    };

    const __vecSub = (a: any, b: any) => {
      const ax = Number(a?.x ?? a?.X ?? 0);
      const ay = Number(a?.y ?? a?.Y ?? 0);
      const az = Number(a?.z ?? a?.Z ?? 0);
      const bx = Number(b?.x ?? b?.X ?? 0);
      const by = Number(b?.y ?? b?.Y ?? 0);
      const bz = Number(b?.z ?? b?.Z ?? 0);
      return Vector3.new(ax - bx, ay - by, az - bz);
    };

    // Color3
    const Color3 = {
      fromRGB: (r = 255, g = 255, b = 255) => ({
        r: Number(r),
        g: Number(g),
        b: Number(b),
        hex: LuauEngine.rgbToHex(r, g, b),
        R: Number(r) / 255,
        G: Number(g) / 255,
        B: Number(b) / 255
      }),
      new: (r = 1, g = 1, b = 1) => ({
        r: Math.round(Number(r) * 255),
        g: Math.round(Number(g) * 255),
        b: Math.round(Number(b) * 255),
        hex: LuauEngine.rgbToHex(r * 255, g * 255, b * 255),
        R: Number(r),
        G: Number(g),
        B: Number(b)
      }),
      fromHex: (hex = '#ffffff') => LuauEngine.parseColor(hex)
    };

    // CFrame
    const CFrame = {
      new: (x: any = 0, y = 0, z = 0) => {
        if (typeof x === 'object' && x !== null) {
          return { Position: x, p: x, X: x.x ?? 0, Y: x.y ?? 0, Z: x.z ?? 0 };
        }
        const pos = Vector3.new(x, y, z);
        return { Position: pos, p: pos, X: pos.x, Y: pos.y, Z: pos.z };
      },
      Angles: (rx = 0, ry = 0, rz = 0) => ({
        Rotation: { x: (rx * 180) / Math.PI, y: (ry * 180) / Math.PI, z: (rz * 180) / Math.PI }
      })
    };

    // Math extended
    const customMath = {
      ...Math,
      clamp: (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)),
      rad: (deg: number) => (deg * Math.PI) / 180,
      deg: (rad: number) => (rad * 180) / Math.PI,
      random: (min?: number, max?: number) => {
        if (min === undefined && max === undefined) return Math.random();
        if (max === undefined) return Math.floor(Math.random() * (min || 1)) + 1;
        return Math.floor(Math.random() * (max - (min || 0) + 1)) + (min || 0);
      }
    };

    // Script object
    const parentPart = context.parentPart || (script.parentPartId ? context.parts.find(p => p.id === script.parentPartId) : undefined);
    const parentProxy = parentPart ? this.createPartProxy(parentPart, context) : null;

    const scriptObj = {
      Name: script.name,
      Parent: parentProxy,
      Enabled: script.enabled,
      Destroy: () => {
        cancel();
      }
    };

    // TweenService
    const TweenInfo = {
      new: (time = 1, style?: any, dir?: any, repeatCount = 0) => ({
        time: Number(time) || 1,
        repeatCount
      })
    };

    const TweenService = {
      Create: (target: any, tweenInfo: any, goals: any) => ({
        Play: () => {
          if (!target || !goals) return;
          const duration = (tweenInfo?.time || 1) * 1000;
          const startTime = performance.now();
          const startVals: any = {};

          Object.keys(goals).forEach(key => {
            if (key === 'Position' && target.Position) {
              startVals.Position = { x: target.Position.x, y: target.Position.y, z: target.Position.z };
            } else if (key === 'Rotation' && target.Rotation) {
              startVals.Rotation = { x: target.Rotation.x, y: target.Rotation.y, z: target.Rotation.z };
            } else if (key === 'Color' && target.Color) {
              startVals.Color = target.Color;
            } else if (key === 'Transparency') {
              startVals.Transparency = target.Transparency;
            }
          });

          const stepTween = () => {
            if (isCancelled) return;
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            Object.entries(goals).forEach(([key, goalVal]: [string, any]) => {
              if (key === 'Position' && startVals.Position && goalVal) {
                target.Position = {
                  x: startVals.Position.x + (goalVal.x - startVals.Position.x) * progress,
                  y: startVals.Position.y + (goalVal.y - startVals.Position.y) * progress,
                  z: startVals.Position.z + (goalVal.z - startVals.Position.z) * progress
                };
              } else if (key === 'Rotation' && startVals.Rotation && goalVal) {
                target.Rotation = {
                  x: startVals.Rotation.x + (goalVal.x - startVals.Rotation.x) * progress,
                  y: startVals.Rotation.y + (goalVal.y - startVals.Rotation.y) * progress,
                  z: startVals.Rotation.z + (goalVal.z - startVals.Rotation.z) * progress
                };
              } else if (key === 'Transparency' && typeof startVals.Transparency === 'number') {
                target.Transparency = startVals.Transparency + (Number(goalVal) - startVals.Transparency) * progress;
              }
            });

            if (progress < 1) {
              requestAnimationFrame(stepTween);
            }
          };
          requestAnimationFrame(stepTween);
        },
        Cancel: () => {}
      })
    };

    // Workspace & Game
    const workspaceObj = new Proxy({
      FindFirstChild: (name: string) => {
        const found = context.parts.find(p => p.name.toLowerCase() === name.toLowerCase());
        return found ? this.createPartProxy(found, context) : null;
      },
      WaitForChild: async (name: string) => {
        const found = context.parts.find(p => p.name.toLowerCase() === name.toLowerCase());
        return found ? this.createPartProxy(found, context) : null;
      },
      GetChildren: () => {
        return context.parts.map(p => this.createPartProxy(p, context));
      }
    }, {
      get: (target: any, prop: string) => {
        if (prop in target) return target[prop];
        const found = context.parts.find(p => p.name.toLowerCase() === prop.toLowerCase());
        return found ? this.createPartProxy(found, context) : undefined;
      }
    });

    const gameObj: any = {
      Workspace: workspaceObj,
      workspace: workspaceObj,
      Lighting: {
        ClockTime: 14,
        Ambient: '#ffffff'
      },
      Players: {
        LocalPlayer: {
          Name: 'LocalPlayer',
          Character: {
            Humanoid: {
              Health: 100,
              WalkSpeed: 16,
              JumpPower: 32,
              TakeDamage: (dmg: number) => {
                if (context.getPlayer) context.getPlayer().takeDamage(dmg);
              }
            }
          }
        }
      },
      GetService: (serviceName: string) => {
        const lower = serviceName.toLowerCase();
        if (lower === 'workspace') return workspaceObj;
        if (lower === 'players') return gameObj.Players;
        if (lower === 'tweenservice') return TweenService;
        if (lower === 'lighting') return gameObj.Lighting;
        if (lower === 'debris') {
          return {
            AddItem: (item: any, lifetime = 5) => {
              setTimeout(() => {
                if (item?.Destroy) item.Destroy();
              }, lifetime * 1000);
            }
          };
        }
        return {};
      }
    };

    // Instance.new supporting Roblox Instances (Part, Texture, Decal, WeldConstraint, Tool, ScreenGui, TextLabel, TextButton, etc.)
    const Instance = {
      new: (className: string, parent?: any) => {
        const lower = className.toLowerCase();

        // 1. Part
        if (lower === 'part') {
          const newPartId = `part-dyn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newPart: BloxPart = {
            id: newPartId,
            name: 'NewPart',
            className: 'Part',
            type: 'block',
            position: { x: 0, y: 5, z: 0 },
            size: { x: 2, y: 2, z: 2 },
            rotation: { x: 0, y: 0, z: 0 },
            color: '#3b82f6',
            material: 'plastic',
            anchored: true,
            isAnchored: true,
            canCollide: true,
            transparency: 0
          };
          context.onAddPart(newPart);
          const proxy = this.createPartProxy(newPart, context);
          if (parent) proxy.Parent = parent;
          return proxy;
        }

        // 2. Texture or Decal
        if (lower === 'texture' || lower === 'decal') {
          const isDecal = lower === 'decal';
          const textureObj: BloxTexture = {
            id: `tex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: isDecal ? 'Decal' : 'Texture',
            className: isDecal ? 'Decal' : 'Texture',
            texture: 'studs',
            face: 'Top',
            studsPerTileU: 2,
            studsPerTileV: 2,
            transparency: 0
          };

          const texProxy: any = {
            id: textureObj.id,
            className: textureObj.className,
            get Texture() { return textureObj.texture; },
            set Texture(val: string) {
              textureObj.texture = val;
              if (texProxy.Parent?.id) {
                const target = context.parts.find(p => p.id === texProxy.Parent.id);
                if (target) {
                  const existing = target.textures?.filter(t => t.id !== textureObj.id) || [];
                  context.onUpdatePart(target.id, { textures: [...existing, textureObj] });
                }
              }
            },
            get Face() { return textureObj.face; },
            set Face(val: NormalId) {
              textureObj.face = val;
              if (texProxy.Parent?.id) {
                const target = context.parts.find(p => p.id === texProxy.Parent.id);
                if (target) {
                  const existing = target.textures?.filter(t => t.id !== textureObj.id) || [];
                  context.onUpdatePart(target.id, { textures: [...existing, textureObj] });
                }
              }
            },
            get Transparency() { return textureObj.transparency || 0; },
            set Transparency(val: number) {
              textureObj.transparency = Number(val) || 0;
            },
            Parent: parent || null,
            Destroy: () => {
              if (texProxy.Parent?.id) {
                const target = context.parts.find(p => p.id === texProxy.Parent.id);
                if (target && target.textures) {
                  context.onUpdatePart(target.id, {
                    textures: target.textures.filter(t => t.id !== textureObj.id)
                  });
                }
              }
            }
          };

          if (parent && parent.id) {
            const target = context.parts.find(p => p.id === parent.id);
            if (target) {
              const existing = target.textures || [];
              context.onUpdatePart(target.id, { textures: [...existing, textureObj] });
            }
          }
          return texProxy;
        }

        // 3. WeldConstraint
        if (lower === 'weldconstraint' || lower === 'weld') {
          const weldObj: BloxWeldConstraint = {
            id: `weld-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: 'WeldConstraint',
            className: 'WeldConstraint',
            part0Id: '',
            part1Id: '',
            enabled: true
          };

          const weldProxy: any = {
            id: weldObj.id,
            className: 'WeldConstraint',
            Part0: null,
            Part1: null,
            Enabled: true,
            set Part0_set(p: any) {
              weldProxy.Part0 = p;
              weldObj.part0Id = p?.id || '';
            },
            set Part1_set(p: any) {
              weldProxy.Part1 = p;
              weldObj.part1Id = p?.id || '';
              if (weldProxy.Part0?.id) {
                const p0 = context.parts.find(p => p.id === weldProxy.Part0.id);
                if (p0) {
                  const existing = p0.weldConstraints || [];
                  context.onUpdatePart(p0.id, { weldConstraints: [...existing, weldObj] });
                }
              }
            },
            Parent: parent || null,
            Destroy: () => {
              weldProxy.Enabled = false;
            }
          };
          return weldProxy;
        }

        // 4. Tool
        if (lower === 'tool') {
          const toolId = `tool-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          let toolName = 'CustomTool';
          let toolIcon = '⚔️';
          let toolTip = 'Roblox Tool';

          const toolProxy: any = {
            id: toolId,
            className: 'Tool',
            get Name() { return toolName; },
            set Name(v: string) {
              toolName = String(v);
              if (context.onAddTool) context.onAddTool({ id: toolId, name: toolName, className: 'Tool', icon: toolIcon, toolTip });
            },
            get ToolTip() { return toolTip; },
            set ToolTip(v: string) { toolTip = String(v); },
            get Icon() { return toolIcon; },
            set Icon(v: string) {
              toolIcon = String(v);
              if (context.onAddTool) context.onAddTool({ id: toolId, name: toolName, className: 'Tool', icon: toolIcon, toolTip });
            },
            RequiresHandle: true,
            Activated: {
              Connect: (cb: () => void) => {
                if (!engine.toolActivatedListeners.has(toolName)) {
                  engine.toolActivatedListeners.set(toolName, new Set());
                }
                engine.toolActivatedListeners.get(toolName)!.add(cb);
                return { Disconnect: () => engine.toolActivatedListeners.get(toolName)?.delete(cb) };
              }
            },
            Equipped: { Connect: (_cb: () => void) => ({ Disconnect: () => {} }) },
            Unequipped: { Connect: (_cb: () => void) => ({ Disconnect: () => {} }) },
            Parent: parent || null
          };

          if (context.onAddTool) {
            context.onAddTool({ id: toolId, name: toolName, className: 'Tool', icon: toolIcon, toolTip });
          }

          return toolProxy;
        }

        // 5. GUI Instances (ScreenGui, TextLabel, TextButton, BillboardGui, Frame)
        if (['screengui', 'billboardgui', 'surfacegui', 'textlabel', 'textbutton', 'frame'].includes(lower)) {
          const guiClass = lower === 'screengui' ? 'ScreenGui'
            : lower === 'billboardgui' ? 'BillboardGui'
            : lower === 'surfacegui' ? 'SurfaceGui'
            : lower === 'textbutton' ? 'TextButton'
            : lower === 'frame' ? 'Frame' : 'TextLabel';

          const guiObj: BloxGuiElement = {
            id: `gui-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            className: guiClass as any,
            name: guiClass,
            text: guiClass === 'TextButton' ? 'Button' : guiClass === 'TextLabel' ? 'Label' : '',
            textColor: '#ffffff',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backgroundTransparency: 0,
            visible: true
          };

          const clickListeners = new Set<() => void>();

          const guiProxy: any = {
            id: guiObj.id,
            className: guiClass,
            get Name() { return guiObj.name; },
            set Name(v: string) {
              guiObj.name = String(v);
              if (context.onAddGui) context.onAddGui({ ...guiObj });
            },
            get Text() { return guiObj.text || ''; },
            set Text(v: string) {
              guiObj.text = String(v);
              if (context.onAddGui) context.onAddGui({ ...guiObj });
            },
            get TextColor3() { return Color3.fromHex(guiObj.textColor || '#ffffff'); },
            set TextColor3(v: any) {
              guiObj.textColor = v?.hex || '#ffffff';
              if (context.onAddGui) context.onAddGui({ ...guiObj });
            },
            get BackgroundColor3() { return Color3.fromHex(guiObj.backgroundColor || '#0f172a'); },
            set BackgroundColor3(v: any) {
              guiObj.backgroundColor = v?.hex || '#0f172a';
              if (context.onAddGui) context.onAddGui({ ...guiObj });
            },
            get Visible() { return guiObj.visible !== false; },
            set Visible(v: boolean) {
              guiObj.visible = Boolean(v);
              if (context.onAddGui) context.onAddGui({ ...guiObj });
            },
            MouseButton1Click: {
              Connect: (cb: () => void) => {
                clickListeners.add(cb);
                return { Disconnect: () => clickListeners.delete(cb) };
              }
            },
            triggerClick: () => {
              clickListeners.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
            },
            Parent: parent || null,
            Destroy: () => {
              guiObj.visible = false;
              if (context.onAddGui) context.onAddGui({ ...guiObj, visible: false });
            }
          };

          if (context.onAddGui) {
            context.onAddGui(guiObj);
          }

          return guiProxy;
        }

        // 6. Sound
        if (lower === 'sound') {
          return {
            SoundId: 'rbxassetid://sound',
            Volume: 1,
            Play: () => { sounds.playCoin(); },
            Stop: () => {}
          };
        }

        // 7. Light Instances (PointLight, SpotLight, SurfaceLight)
        if (['pointlight', 'spotlight', 'surfacelight'].includes(lower)) {
          return {
            id: `light-${Date.now()}`,
            className: lower === 'pointlight' ? 'PointLight' : 'SpotLight',
            Brightness: 1,
            Range: 16,
            Color: Color3.new(1, 1, 1),
            Enabled: true,
            Parent: parent || null,
            Destroy: () => {}
          };
        }

        // 8. Value Objects (IntValue, NumberValue, StringValue, BoolValue)
        if (['intvalue', 'numbervalue', 'stringvalue', 'boolvalue'].includes(lower)) {
          let currentVal: any = lower === 'stringvalue' ? '' : lower === 'boolvalue' ? false : 0;
          const changedListeners = new Set<(newVal: any) => void>();
          return {
            className: lower === 'intvalue' ? 'IntValue' : lower === 'numbervalue' ? 'NumberValue' : lower === 'stringvalue' ? 'StringValue' : 'BoolValue',
            get Value() { return currentVal; },
            set Value(v: any) {
              currentVal = lower === 'intvalue' ? Math.round(Number(v) || 0) : lower === 'numbervalue' ? (Number(v) || 0) : lower === 'boolvalue' ? Boolean(v) : String(v);
              changedListeners.forEach(cb => { try { cb(currentVal); } catch (e) { console.error(e); } });
            },
            Changed: {
              Connect: (cb: (v: any) => void) => {
                changedListeners.add(cb);
                return { Disconnect: () => changedListeners.delete(cb) };
              }
            },
            Parent: parent || null,
            Destroy: () => {}
          };
        }

        // 9. Folder / Model
        if (['folder', 'model'].includes(lower)) {
          const children: any[] = [];
          return {
            Name: lower === 'folder' ? 'Folder' : 'Model',
            className: lower === 'folder' ? 'Folder' : 'Model',
            Parent: parent || null,
            GetChildren: () => children,
            FindFirstChild: (name: string) => children.find(c => c.Name?.toLowerCase() === name.toLowerCase()) || null,
            Destroy: () => {}
          };
        }

        return {
          Name: className,
          Parent: parent || null,
          Destroy: () => {}
        };
      }
    };

    // Output Logger
    const logOutput = (type: 'print' | 'warn' | 'error', ...args: any[]) => {
      const msg = args.map(a => {
        if (typeof a === 'object' && a !== null) {
          if (a.x !== undefined && a.y !== undefined && a.z !== undefined) {
            return `Vector3(${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)})`;
          }
          if (a.hex !== undefined) {
            return `Color3(${a.hex})`;
          }
          if (a.Name !== undefined) {
            return `[Instance: ${a.Name}]`;
          }
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');

      context.onLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message: msg,
        scriptId: script.id,
        scriptName: script.name
      });
    };

    // Transpile source code
    let transpiled = '';
    try {
      transpiled = this.transpileLuau(script.source);
    } catch (parseErr: any) {
      logOutput('error', `Erro de sintaxe Luau: ${parseErr?.message || String(parseErr)}`);
      return handle;
    }

    // Global Roblox Enum & Helper libraries
    const Enum = {
      Material: {
        Plastic: 'plastic',
        SmoothPlastic: 'plastic',
        Neon: 'neon',
        Metal: 'metal',
        Glass: 'glass',
        Brick: 'brick',
        ForceField: 'forcefield'
      },
      NormalId: {
        Top: 'Top',
        Bottom: 'Bottom',
        Front: 'Front',
        Back: 'Back',
        Left: 'Left',
        Right: 'Right'
      },
      PartType: {
        Block: 'block',
        Ball: 'sphere',
        Cylinder: 'cylinder',
        Wedge: 'wedge'
      }
    };

    const customTable = {
      insert: (tbl: any[], val: any) => {
        if (Array.isArray(tbl)) tbl.push(val);
        return tbl;
      },
      remove: (tbl: any[], index?: number) => {
        if (Array.isArray(tbl)) {
          const idx = (index ?? tbl.length) - 1;
          return tbl.splice(idx, 1)[0];
        }
        return null;
      },
      clear: (tbl: any) => {
        if (Array.isArray(tbl)) tbl.length = 0;
        else if (tbl && typeof tbl === 'object') {
          Object.keys(tbl).forEach(k => delete tbl[k]);
        }
      },
      find: (tbl: any[], val: any) => {
        if (Array.isArray(tbl)) {
          const idx = tbl.indexOf(val);
          return idx >= 0 ? idx + 1 : null;
        }
        return null;
      }
    };

    const customString = {
      format: (fmt: string, ...args: any[]) => {
        let i = 0;
        return String(fmt).replace(/%[sdif]/g, () => String(args[i++] ?? ''));
      },
      sub: (str: string, start: number, end?: number) => {
        const s = Math.max(0, start - 1);
        return end !== undefined ? String(str).slice(s, end) : String(str).slice(s);
      },
      len: (str: string) => String(str).length,
      lower: (str: string) => String(str).toLowerCase(),
      upper: (str: string) => String(str).toUpperCase()
    };

    // Wrap inside async execution function with sandbox parameters
    const sandboxFunctionBody = `
      return (async function(
        script,
        workspace,
        game,
        Instance,
        Vector3,
        Color3,
        CFrame,
        TweenInfo,
        task,
        wait,
        math,
        print,
        warn,
        error,
        __vecAdd,
        __vecSub,
        __yieldCheck,
        Enum,
        table,
        string,
        tonumber,
        tostring
      ) {
        try {
          ${transpiled}
        } catch(err) {
          if (err && err.message === '__SCRIPT_CANCELLED__') return;
          throw err;
        }
      });
    `;

    try {
      const runner = new Function(sandboxFunctionBody)();
      runner(
        scriptObj,
        workspaceObj,
        gameObj,
        Instance,
        Vector3,
        Color3,
        CFrame,
        TweenInfo,
        task,
        task.wait,
        customMath,
        (...args: any[]) => logOutput('print', ...args),
        (...args: any[]) => logOutput('warn', ...args),
        (...args: any[]) => logOutput('error', ...args),
        __vecAdd,
        __vecSub,
        yieldCheck,
        Enum,
        customTable,
        customString,
        (val: any) => (isNaN(Number(val)) ? null : Number(val)),
        (val: any) => String(val)
      ).catch((runtimeErr: any) => {
        if (runtimeErr?.message !== '__SCRIPT_CANCELLED__') {
          logOutput('error', `Erro em tempo de execução: ${runtimeErr?.message || String(runtimeErr)}`);
        }
      });
    } catch (compileErr: any) {
      logOutput('error', `Erro ao compilar script: ${compileErr?.message || String(compileErr)}`);
    }

    return handle;
  }

  /**
   * Stop a running script
   */
  public stopScript(scriptId: string) {
    const existing = this.runningScripts.get(scriptId);
    if (existing) {
      existing.cancel();
      this.runningScripts.delete(scriptId);
    }
  }

  /**
   * Stop all running scripts
   */
  public stopAll() {
    this.runningScripts.forEach(handle => handle.cancel());
    this.runningScripts.clear();
    this.touchListeners.clear();
    this.clickListeners.clear();
    this.toolActivatedListeners.clear();
  }
}

export const luauEngine = new LuauEngine();
