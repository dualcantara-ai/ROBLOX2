import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AvatarAppearance } from '../../types';
import { createBlockyCharacter } from '../engine/character3D';

const headshotCache = new Map<string, string>();

let sharedScene: THREE.Scene | null = null;
let sharedCamera: THREE.PerspectiveCamera | null = null;
let sharedRenderer: THREE.WebGLRenderer | null = null;

function getSharedHeadshotRig() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    sharedRenderer.setSize(192, 192);
    sharedRenderer.setPixelRatio(1);
    sharedRenderer.setClearColor(0x000000, 0);
  }
  if (!sharedScene) {
    sharedScene = new THREE.Scene();

    const ambient = new THREE.AmbientLight(0xffffff, 1.05);
    sharedScene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.25);
    keyLight.position.set(3.5, 7.5, 4.5);
    sharedScene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.55);
    fillLight.position.set(-4, 5, 3);
    sharedScene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-3, 6, -4);
    sharedScene.add(rimLight);
  }
  if (!sharedCamera) {
    sharedCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    // Classic 3/4 Roblox headshot framing focusing on head, face, hat, and upper shoulders
    sharedCamera.position.set(0.95, 5.1, 3.05);
    sharedCamera.lookAt(0, 4.82, 0);
  }
  return { scene: sharedScene, camera: sharedCamera, renderer: sharedRenderer };
}

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const stdMat = m as THREE.MeshStandardMaterial;
        if (stdMat.map) stdMat.map.dispose();
        m.dispose();
      });
    }
  });
}

function renderFallback2DHeadshot(avatar: AvatarAppearance): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const headColor = avatar.bodyColors?.head || '#facc15';
    const torsoColor = avatar.bodyColors?.torso || '#0284c7';

    // Shoulders hint
    ctx.fillStyle = torsoColor;
    ctx.beginPath();
    ctx.roundRect(22, 92, 84, 42, 16);
    ctx.fill();

    // Head block
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.roundRect(30, 24, 68, 74, 18);
    ctx.fill();

    // Eyes & Smile
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(50, 52, 5, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(78, 52, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(64, 65, 18, 0.25, Math.PI - 0.25);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function renderAvatarHeadshotDataUrl(avatar: AvatarAppearance): string {
  const key = JSON.stringify({
    h: avatar.bodyColors?.head || '#facc15',
    t: avatar.bodyColors?.torso || '#0284c7',
    la: avatar.bodyColors?.leftArm || '#facc15',
    ra: avatar.bodyColors?.rightArm || '#facc15',
    hat: avatar.equippedHat || '',
    face: avatar.equippedFace || '',
    shirt: avatar.equippedShirt || '',
    hs: avatar.scale?.head || 1
  });

  const cached = headshotCache.get(key);
  if (cached) return cached;

  try {
    const { scene, camera, renderer } = getSharedHeadshotRig();
    const normalizedAvatar: AvatarAppearance = {
      ...avatar,
      equippedGear: undefined,
      scale: {
        width: 1,
        height: 1,
        head: avatar.scale?.head || 1
      },
      animation: 'idle'
    };

    const controller = createBlockyCharacter(normalizedAvatar);
    // Slight subtle rotation for authentic Roblox portrait pose
    controller.root.rotation.y = 0.08;
    scene.add(controller.root);
    controller.root.updateMatrixWorld(true);

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    scene.remove(controller.root);
    disposeObject3D(controller.root);

    if (headshotCache.size > 60) {
      const firstKey = headshotCache.keys().next().value;
      if (firstKey) headshotCache.delete(firstKey);
    }
    headshotCache.set(key, dataUrl);
    return dataUrl;
  } catch {
    const fallback = renderFallback2DHeadshot(avatar);
    if (fallback) headshotCache.set(key, fallback);
    return fallback;
  }
}

interface AvatarHeadshotProps {
  avatar: AvatarAppearance;
  alt?: string;
  className?: string;
}

export const AvatarHeadshot: React.FC<AvatarHeadshotProps> = ({
  avatar,
  alt = 'Avatar do jogador',
  className = 'w-10 h-10 rounded-full'
}) => {
  const src = useMemo(() => renderAvatarHeadshotDataUrl(avatar), [
    avatar.bodyColors?.head,
    avatar.bodyColors?.torso,
    avatar.bodyColors?.leftArm,
    avatar.bodyColors?.rightArm,
    avatar.equippedHat,
    avatar.equippedFace,
    avatar.equippedShirt,
    avatar.scale?.head
  ]);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-[#2b303b] to-[#171920] flex items-center justify-center shrink-0 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full"
          style={{ backgroundColor: avatar.bodyColors?.head || '#facc15' }}
        />
      )}
    </div>
  );
};
