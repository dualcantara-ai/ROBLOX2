import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowUp, Flame, Zap } from 'lucide-react';

export interface MobileControlState {
  forward: number; // -1 to 1 (1 = forward, -1 = backward)
  turn: number;    // -1 to 1 (1 = right, -1 = left)
  jump: boolean;
  sprint: boolean;
}

interface MobileControlsProps {
  onControlChange: (controls: MobileControlState) => void;
  onCameraRotate?: (deltaYaw: number, deltaPitch: number) => void;
  className?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onControlChange,
  onCameraRotate,
  className = ''
}) => {
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const controlsStateRef = useRef<MobileControlState>({
    forward: 0,
    turn: 0,
    jump: false,
    sprint: false
  });

  const MAX_RADIUS = 46; // Maximum joystick drag radius in px

  const updateControls = useCallback((partial: Partial<MobileControlState>) => {
    controlsStateRef.current = {
      ...controlsStateRef.current,
      ...partial
    };
    onControlChange(controlsStateRef.current);
  }, [onControlChange]);

  // Pointer / Touch handling for Analog Joystick
  const handleJoystickPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    touchIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingJoystick(true);
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let clampedX = dx;
    let clampedY = dy;

    if (dist > MAX_RADIUS) {
      clampedX = (dx / dist) * MAX_RADIUS;
      clampedY = (dy / dist) * MAX_RADIUS;
    }

    setKnobPos({ x: clampedX, y: clampedY });

    // Normalized inputs: forward (up is negative dy -> positive forward), turn (right is positive dx)
    const normalizedTurn = clampedX / MAX_RADIUS;
    const normalizedForward = -(clampedY / MAX_RADIUS);

    updateControls({
      turn: Number(normalizedTurn.toFixed(2)),
      forward: Number(normalizedForward.toFixed(2))
    });
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingJoystick || touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    handleJoystickMove(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
    if (touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    touchIdRef.current = null;
    setIsDraggingJoystick(false);
    setKnobPos({ x: 0, y: 0 });
    updateControls({ forward: 0, turn: 0 });
  };

  // Right Side Touch Zone for Camera Rotation
  const cameraTouchRef = useRef<{ id: number | null; startX: number; startY: number }>({
    id: null,
    startX: 0,
    startY: 0
  });

  const handleCameraPointerDown = (e: React.PointerEvent) => {
    // Only capture if not clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;
    cameraTouchRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleCameraPointerMove = (e: React.PointerEvent) => {
    if (cameraTouchRef.current.id !== e.pointerId) return;
    const dx = e.clientX - cameraTouchRef.current.startX;
    const dy = e.clientY - cameraTouchRef.current.startY;

    cameraTouchRef.current.startX = e.clientX;
    cameraTouchRef.current.startY = e.clientY;

    if (onCameraRotate) {
      onCameraRotate(-dx * 0.007, dy * 0.007);
    }
  };

  const handleCameraPointerUp = (e: React.PointerEvent) => {
    if (cameraTouchRef.current.id === e.pointerId) {
      cameraTouchRef.current.id = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Jump trigger
  const handleJumpDown = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsJumping(true);
    updateControls({ jump: true });
  };

  const handleJumpUp = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsJumping(false);
    updateControls({ jump: false });
  };

  // Sprint toggle
  const toggleSprint = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const next = !isSprinting;
    setIsSprinting(next);
    updateControls({ sprint: next });
  };

  return (
    <div className={`absolute inset-0 pointer-events-none select-none touch-none ${className}`}>
      {/* Right-side camera swipe area */}
      <div
        className="absolute top-24 bottom-24 right-0 w-1/2 pointer-events-auto touch-none"
        onPointerDown={handleCameraPointerDown}
        onPointerMove={handleCameraPointerMove}
        onPointerUp={handleCameraPointerUp}
        onPointerCancel={handleCameraPointerUp}
      />

      {/* Bottom Control Bar */}
      <div className="absolute bottom-6 inset-x-6 flex items-end justify-between pointer-events-none">
        {/* LEFT: Virtual Analog Thumbstick */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div
            ref={joystickBaseRef}
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            className="w-32 h-32 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-white/20 shadow-2xl relative flex items-center justify-center touch-none cursor-pointer active:border-[#00a2ff]/60"
          >
            {/* Directional Guides */}
            <div className={`absolute top-2 text-[10px] font-black transition-opacity ${
              knobPos.y < -15 ? 'text-[#00a2ff] opacity-100' : 'text-white/30'
            }`}>
              ▲
            </div>
            <div className={`absolute bottom-2 text-[10px] font-black transition-opacity ${
              knobPos.y > 15 ? 'text-[#00a2ff] opacity-100' : 'text-white/30'
            }`}>
              ▼
            </div>
            <div className={`absolute left-2 text-[10px] font-black transition-opacity ${
              knobPos.x < -15 ? 'text-[#00a2ff] opacity-100' : 'text-white/30'
            }`}>
              ◀
            </div>
            <div className={`absolute right-2 text-[10px] font-black transition-opacity ${
              knobPos.x > 15 ? 'text-[#00a2ff] opacity-100' : 'text-white/30'
            }`}>
              ▶
            </div>

            {/* Inner Ring Boundary */}
            <div className="w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

            {/* Draggable Analog Stick Knob */}
            <div
              style={{
                transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`
              }}
              className={`w-14 h-14 rounded-full bg-gradient-to-b from-[#2a3042] to-[#161a26] border-2 shadow-lg flex items-center justify-center transition-shadow pointer-events-none ${
                isDraggingJoystick
                  ? 'border-[#00a2ff] shadow-[#00a2ff]/40 ring-4 ring-[#00a2ff]/20'
                  : 'border-white/30 shadow-black/50'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#00a2ff]/80 shadow-inner" />
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 mt-1.5 drop-shadow">
            Move
          </span>
        </div>

        {/* RIGHT: Action Buttons (Jump + Sprint) */}
        <div className="pointer-events-auto flex items-end gap-3.5">
          {/* Sprint / Nitro Boost Button */}
          <div className="flex flex-col items-center">
            <button
              onPointerDown={toggleSprint}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl border-2 transition-transform active:scale-90 cursor-pointer ${
                isSprinting
                  ? 'bg-amber-500 text-slate-950 border-white shadow-amber-500/40 animate-pulse'
                  : 'bg-slate-900/60 backdrop-blur-md text-amber-400 border-white/20 hover:border-amber-400/50'
              }`}
              title="Sprint Mode"
            >
              <Flame className="w-6 h-6 fill-current" />
            </button>
            <span className="text-[9px] font-black uppercase text-amber-400/80 mt-1">
              {isSprinting ? 'Fast' : 'Sprint'}
            </span>
          </div>

          {/* Large Jump Button */}
          <div className="flex flex-col items-center">
            <button
              onPointerDown={handleJumpDown}
              onPointerUp={handleJumpUp}
              onPointerCancel={handleJumpUp}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl border-2 transition-all active:scale-90 cursor-pointer ${
                isJumping
                  ? 'bg-emerald-400 text-slate-950 border-white shadow-emerald-400/50 scale-95'
                  : 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-white/30 shadow-emerald-600/40 hover:from-emerald-400 hover:to-emerald-500'
              }`}
              title="Jump (Space)"
            >
              <ArrowUp className="w-7 h-7 stroke-[3]" />
              <span className="text-[10px] font-black tracking-wider uppercase -mt-0.5">
                JUMP
              </span>
            </button>
            <span className="text-[9px] font-black uppercase text-emerald-400/80 mt-1">
              Action
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
