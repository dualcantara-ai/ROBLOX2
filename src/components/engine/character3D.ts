import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AvatarAppearance, PlayerBodyPart } from '../../types';

export interface CharacterMeshController {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  updateAnimation: (
    deltaOrTime: number,
    timeOrIsMoving?: number | boolean,
    isMovingOrIsJumping?: boolean,
    isJumpingOrVertVel?: boolean | number,
    verticalVelocity?: number,
    isDamaged?: boolean,
    speedScale?: number
  ) => void;
  updateAppearance: (appearance: AvatarAppearance) => void;
  getPlayerColliderBoxes: () => { name: string; center: THREE.Vector3; size: THREE.Vector3; canCollide: boolean; isAnchored: boolean }[];
  hatGroup: THREE.Group;
  gearGroup: THREE.Group;
}

export function getPlayerPartsList(appearance?: AvatarAppearance): PlayerBodyPart[] {
  return [
    {
      id: 'player-root',
      name: 'HumanoidRootPart',
      className: 'Part',
      size: { x: 2, y: 2, z: 1 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 1,
      attributes: {
        Health: 100,
        WalkSpeed: 16,
        JumpPower: 50,
        MaxHealth: 100,
        RigType: 'R6'
      }
    },
    {
      id: 'player-head',
      name: 'Head',
      className: 'Part',
      size: { x: 1.25, y: 1.25, z: 1.25 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      color: appearance?.bodyColors.head || '#facc15',
      attributes: {
        PartType: 'Head',
        DamageMultiplier: 1.5
      }
    },
    {
      id: 'player-torso',
      name: 'Torso',
      className: 'Part',
      size: { x: 2, y: 2, z: 1 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      color: appearance?.bodyColors.torso || '#0284c7',
      attributes: {
        PartType: 'Torso',
        Armor: 0
      }
    },
    {
      id: 'player-left-arm',
      name: 'LeftArm',
      className: 'Part',
      size: { x: 1, y: 2, z: 1 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      color: appearance?.bodyColors.leftArm || '#facc15',
      attributes: {
        Limb: 'LeftArm'
      }
    },
    {
      id: 'player-right-arm',
      name: 'RightArm',
      className: 'Part',
      size: { x: 1, y: 2, z: 1 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      color: appearance?.bodyColors.rightArm || '#facc15',
      attributes: {
        Limb: 'RightArm'
      }
    },
    {
      id: 'player-left-leg',
      name: 'LeftLeg',
      className: 'Part',
      size: { x: 1, y: 2, z: 1 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      color: appearance?.bodyColors.leftLeg || '#1e293b',
      attributes: {
        Limb: 'LeftLeg'
      }
    },
    {
      id: 'player-right-leg',
      name: 'RightLeg',
      className: 'Part',
      size: { x: 1, y: 2, z: 1 },
      anchored: false,
      isAnchored: false,
      canCollide: true,
      transparency: 0,
      color: appearance?.bodyColors.rightLeg || '#1e293b',
      attributes: {
        Limb: 'RightLeg'
      }
    }
  ];
}

// Procedural texture for iconic Roblox Head Stud
function createHeadStudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, 128, 128);

  // Outer bevel ring
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.stroke();

  // "ROBLOX" text debossed in center
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.font = '900 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BLOX', 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Procedural classic Roblox Face Texture
function createRobloxFaceTexture(faceId?: string, isDamaged: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  if (isDamaged) {
    // Classic Roblox "OOF" / Damaged Face (X eyes & open mouth)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    // Left X eye
    ctx.beginPath();
    ctx.moveTo(60, 65); ctx.lineTo(95, 100);
    ctx.moveTo(95, 65); ctx.lineTo(60, 100);
    ctx.stroke();

    // Right X eye
    ctx.beginPath();
    ctx.moveTo(160, 65); ctx.lineTo(195, 100);
    ctx.moveTo(195, 65); ctx.lineTo(160, 100);
    ctx.stroke();

    // Shocked open O mouth
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(128, 175, 26, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  if (faceId === 'face-chill') {
    // Iconic "Chill" Sunglasses & Smug Smirk
    // Sunglasses frame
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(35, 65, 80, 52, 10);
    ctx.roundRect(141, 65, 80, 52, 10);
    ctx.fill();

    // Sunglasses bridge
    ctx.fillRect(110, 80, 36, 12);

    // Cyan lens reflection
    const grad = ctx.createLinearGradient(35, 65, 115, 117);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1, '#0369a1');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(42, 72, 66, 38, 6);
    ctx.roundRect(148, 72, 66, 38, 6);
    ctx.fill();

    // Specular glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(60, 84, 12, 4, -0.6, 0, Math.PI * 2);
    ctx.ellipse(166, 84, 12, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Confident curved smirk
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(135, 165, 42, 0.2, Math.PI * 0.75);
    ctx.stroke();
  } else if (faceId === 'face-beast') {
    // Beast / Angry Face
    ctx.fillStyle = '#dc2626';
    // Angled predator eyes
    ctx.beginPath();
    ctx.moveTo(50, 95); ctx.lineTo(105, 75); ctx.lineTo(75, 110);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(206, 95); ctx.lineTo(151, 75); ctx.lineTo(181, 110);
    ctx.fill();

    // Angry brows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(40, 80); ctx.lineTo(115, 100);
    ctx.moveTo(216, 80); ctx.lineTo(141, 100);
    ctx.stroke();

    // Fang grin
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(128, 160, 48, 0, Math.PI);
    ctx.fill();

    // White fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(100, 160); ctx.lineTo(110, 185); ctx.lineTo(120, 160);
    ctx.moveTo(136, 160); ctx.lineTo(146, 185); ctx.lineTo(156, 160);
    ctx.fill();
  } else {
    // Classic Iconic Roblox Smile (The Legendary Default Face)
    ctx.fillStyle = '#0f172a';

    // Left Eye: Oval pill with white glint
    ctx.beginPath();
    ctx.ellipse(82, 92, 13, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right Eye: Oval pill with white glint
    ctx.beginPath();
    ctx.ellipse(174, 92, 13, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights (specular shine)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(78, 84, 5, 0, Math.PI * 2);
    ctx.arc(170, 84, 5, 0, Math.PI * 2);
    ctx.fill();

    // Authentic curved black smile
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 140, 52, 0.22, Math.PI - 0.22);
    ctx.stroke();

    // Subtle dimple corners
    ctx.beginPath();
    ctx.moveTo(76, 154); ctx.lineTo(72, 147);
    ctx.moveTo(180, 154); ctx.lineTo(184, 147);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Procedural Roblox Shirt texture for Torso and Arms
function createRobloxShirtTexture(baseHex: string, shirtId?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  if (shirtId === 'shirt-tuxedo') {
    // Classic Formal Tuxedo
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 256, 256);

    // White shirt triangle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(80, 0); ctx.lineTo(176, 0); ctx.lineTo(128, 140);
    ctx.fill();

    // Black bow tie
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(110, 25); ctx.lineTo(146, 45); ctx.lineTo(146, 25); ctx.lineTo(110, 45);
    ctx.fill();
    ctx.fillRect(124, 30, 8, 10);

    // Buttons
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(128, 70, 4, 0, Math.PI * 2);
    ctx.arc(128, 95, 4, 0, Math.PI * 2);
    ctx.arc(128, 120, 4, 0, Math.PI * 2);
    ctx.fill();

    // Lapels
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 0); ctx.lineTo(128, 145); ctx.lineTo(128, 256);
    ctx.moveTo(176, 0); ctx.lineTo(128, 145);
    ctx.stroke();
  } else if (shirtId === 'shirt-galaxy') {
    // Cosmic Nebula Hoodie
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 140);
    grad.addColorStop(0, '#a855f7');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const rx = (i * 37) % 256;
      const ry = (i * 53) % 256;
      ctx.fillRect(rx, ry, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
    // Hoodie zipper
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 40); ctx.lineTo(128, 256);
    ctx.stroke();
  } else {
    // Classic Crew Neck T-Shirt / BloxVerse Tee
    // Collar ribbing
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 10, 48, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 10, 44, 0, Math.PI);
    ctx.stroke();

    // Iconic Front Logo / Blox Chest Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(108, 90, 40, 40, 8);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(118, 100, 20, 20, 4);
    ctx.fill();

    // Side seam stitches
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(20, 256);
    ctx.moveTo(236, 0); ctx.lineTo(236, 256);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Procedural Roblox Pants texture for Legs
function createRobloxPantsTexture(baseHex: string, pantsId?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Top Belt
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 32);

  // Golden / silver buckle
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(112, 4, 32, 24);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(120, 10, 16, 12);

  // Denim Stitch lines
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  // Pockets
  ctx.beginPath();
  ctx.arc(50, 40, 30, 0, Math.PI * 0.5);
  ctx.arc(206, 40, 30, Math.PI * 0.5, Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  // Knee crease shading
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(20, 130, 216, 6);
  ctx.fillRect(35, 145, 186, 4);

  // Shoes at bottom (Sneaker soles)
  ctx.fillStyle = '#f8fafc'; // White rubber sole
  ctx.fillRect(0, 230, 256, 26);
  ctx.fillStyle = '#0f172a'; // Bottom tread line
  ctx.fillRect(0, 250, 256, 6);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createBlockyCharacter(appearance: AvatarAppearance): CharacterMeshController {
  const root = new THREE.Group();

  // Helper for beveled standard materials
  const createPlasticMat = (colorHex: string, map?: THREE.CanvasTexture) => {
    return new THREE.MeshStandardMaterial({
      color: map ? 0xffffff : new THREE.Color(colorHex),
      map: map || null,
      roughness: 0.38,
      metalness: 0.08,
    });
  };

  // TORSO (2 x 2 x 1 studs) - Curved beveled edges
  const torsoTex = createRobloxShirtTexture(appearance.bodyColors.torso, appearance.equippedShirt);
  const torsoMat = createPlasticMat(appearance.bodyColors.torso, torsoTex);
  const torsoGeo = new RoundedBoxGeometry(2, 2, 1, 3, 0.08);
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torso.position.y = 3.0; // Y center at 3.0, so legs touch floor at Y = 0.0 exactly
  root.add(torso);

  // NECK CYLINDER (Authentic joint between torso and head)
  const neckGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 20);
  const neckMat = createPlasticMat(appearance.bodyColors.head);
  const neckMesh = new THREE.Mesh(neckGeo, neckMat);
  neckMesh.position.y = 1.05;
  neckMesh.castShadow = true;
  torso.add(neckMesh);

  // HEAD (Classic Roblox Cylinder Head - 1.25 height, 0.63 radius)
  const headGeo = new THREE.CylinderGeometry(0.63, 0.63, 1.25, 32);
  const headMat = createPlasticMat(appearance.bodyColors.head);
  const head = new THREE.Mesh(headGeo, headMat);
  head.castShadow = true;
  head.receiveShadow = true;
  head.position.y = 1.7; // Head center at Y = 1.7 relative to torso
  torso.add(head);

  // Classic Roblox Top Head Stud
  const headStudGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.18, 24);
  const headStudMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(appearance.bodyColors.head),
    map: createHeadStudTexture(),
    roughness: 0.35,
    metalness: 0.08
  });
  const headStud = new THREE.Mesh(headStudGeo, headStudMat);
  headStud.position.y = 0.71;
  headStud.castShadow = true;
  head.add(headStud);

  // FRONT FACE DECAL (Cylindrical decal seamlessly curved around the front of the cylinder head)
  let faceTex = createRobloxFaceTexture(appearance.equippedFace, false);
  const faceMat = new THREE.MeshBasicMaterial({
    map: faceTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: THREE.FrontSide
  });
  const faceArc = Math.PI * 0.54; // ~97 degrees arc covering the front face region
  const faceGeo = new THREE.CylinderGeometry(0.635, 0.635, 1.15, 24, 1, true, -faceArc / 2, faceArc);
  const facePlane = new THREE.Mesh(faceGeo, faceMat);
  head.add(facePlane);

  // HAT ACCESSORIES GROUP
  const hatGroup = new THREE.Group();
  head.add(hatGroup);

  const buildHat = (hatId?: string) => {
    while (hatGroup.children.length > 0) {
      hatGroup.remove(hatGroup.children[0]);
    }
    if (!hatId) return;

    if (hatId === 'hat-valkyrie') {
      // Golden Valkyrie Helm with Angel Wings
      const crownBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.15 })
      );
      crownBand.position.y = 0.65;
      crownBand.castShadow = true;
      hatGroup.add(crownBand);

      // Ruby center gem
      const ruby = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.18),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.3 })
      );
      ruby.position.set(0, 0.68, 0.72);
      hatGroup.add(ruby);

      // Left & Right Feather Wings
      const createWing = (isRight: boolean) => {
        const wing = new THREE.Group();
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
        const goldTrim = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });

        for (let i = 0; i < 4; i++) {
          const feather = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8 + i * 0.25, 0.28), wingMat);
          feather.position.set(i * 0.12, i * 0.25, -i * 0.08);
          feather.rotation.z = (isRight ? -0.3 : 0.3) - i * 0.08;
          feather.castShadow = true;
          wing.add(feather);
        }
        const trimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), goldTrim);
        trimMesh.position.set(0.15, 0.5, 0);
        trimMesh.rotation.z = isRight ? -0.4 : 0.4;
        wing.add(trimMesh);

        wing.position.set(isRight ? 0.75 : -0.75, 0.8, 0);
        return wing;
      };

      hatGroup.add(createWing(false));
      hatGroup.add(createWing(true));
    } else if (hatId === 'hat-dominus') {
      // Dominus Aureus: Dark Shroud with Gold Rings - Curved beveled edges
      const hoodGeo = new RoundedBoxGeometry(1.48, 1.48, 1.48, 2, 0.08);
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
      const hood = new THREE.Mesh(hoodGeo, hoodMat);
      hood.position.y = 0.12;
      hood.castShadow = true;
      hatGroup.add(hood);

      // Golden double buckle rings
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 });
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), ringMat);
      ring1.position.set(-0.25, -0.22, 0.76);
      hatGroup.add(ring1);

      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), ringMat);
      ring2.position.set(0.25, -0.22, 0.76);
      hatGroup.add(ring2);

      // Glowing eyes from the void
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const glowEyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), eyeMat);
      glowEyeL.position.set(-0.25, 0.1, 0.75);
      hatGroup.add(glowEyeL);
      const glowEyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), eyeMat);
      glowEyeR.position.set(0.25, 0.1, 0.75);
      hatGroup.add(glowEyeR);
    } else if (hatId === 'hat-fedora') {
      // Sparkle Time Fedora
      const fedoraGroup = new THREE.Group();
      fedoraGroup.rotation.z = -0.06; // stylish tilt

      // Wide brim
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.25, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 })
      );
      brim.position.y = 0.64;
      brim.castShadow = true;
      fedoraGroup.add(brim);

      // Creased crown
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.6, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 })
      );
      crown.position.y = 0.94;
      crown.castShadow = true;
      fedoraGroup.add(crown);

      // Black silk ribbon band
      const ribbon = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.15, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
      );
      ribbon.position.y = 0.72;
      fedoraGroup.add(ribbon);

      hatGroup.add(fedoraGroup);
    } else if (hatId === 'hat-viking') {
      // Viking Horned Helm
      const helmMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const helmDome = new THREE.Mesh(new THREE.SphereGeometry(0.74, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), helmMat);
      helmDome.position.y = 0.62;
      helmDome.castShadow = true;
      hatGroup.add(helmDome);

      // Center nose guard
      const noseGuard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.08), helmMat);
      noseGuard.position.set(0, 0.45, 0.72);
      hatGroup.add(noseGuard);

      // Horns
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
      const createHorn = (isRight: boolean) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 8), hornMat);
        horn.position.set(isRight ? 0.78 : -0.78, 0.95, 0);
        horn.rotation.z = isRight ? -0.85 : 0.85;
        horn.rotation.x = -0.2;
        horn.castShadow = true;
        return horn;
      };
      hatGroup.add(createHorn(false));
      hatGroup.add(createHorn(true));
    } else {
      // Classic Blox Baseball Cap with visor
      const capMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
      const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), capMat);
      capDome.position.y = 0.62;
      capDome.castShadow = true;
      hatGroup.add(capDome);

      // Visor bill
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.65), capMat);
      visor.position.set(0, 0.62, 0.68);
      visor.rotation.x = 0.15;
      visor.castShadow = true;
      hatGroup.add(visor);
    }
  };
  buildHat(appearance.equippedHat);

  // LEFT ARM (1 x 2 x 1 studs, pivot at shoulder) - Curved beveled edges
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-1.5, 0.8, 0); // Shoulder joint
  torso.add(leftArmGroup);

  const leftArmMat = createPlasticMat(appearance.bodyColors.leftArm);
  const armGeo = new RoundedBoxGeometry(1, 2, 1, 3, 0.08);
  const leftArmMesh = new THREE.Mesh(armGeo, leftArmMat);
  leftArmMesh.position.y = -0.8;
  leftArmMesh.castShadow = true;
  leftArmMesh.receiveShadow = true;
  leftArmGroup.add(leftArmMesh);

  // RIGHT ARM (1 x 2 x 1 studs, pivot at shoulder) - Curved beveled edges
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(1.5, 0.8, 0); // Shoulder joint
  torso.add(rightArmGroup);

  const rightArmMat = createPlasticMat(appearance.bodyColors.rightArm);
  const rightArmMesh = new THREE.Mesh(armGeo, rightArmMat);
  rightArmMesh.position.y = -0.8;
  rightArmMesh.castShadow = true;
  rightArmMesh.receiveShadow = true;
  rightArmGroup.add(rightArmMesh);

  // GEAR / HELD ITEM IN RIGHT HAND
  const gearGroup = new THREE.Group();
  gearGroup.position.set(0, -1.8, 0.5);
  rightArmGroup.add(gearGroup);

  const buildGear = (gearId?: string) => {
    while (gearGroup.children.length > 0) {
      gearGroup.remove(gearGroup.children[0]);
    }
    if (!gearId) return;

    if (gearId === 'gear-speedcoil') {
      // Red speed coil
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.1, 10, 24),
        new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.18 })
      );
      coil.rotation.x = Math.PI / 2;
      gearGroup.add(coil);
    } else if (gearId === 'gear-gravitycoil') {
      // Cyan floaty moon coil
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.1, 10, 24),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.4,
          metalness: 0.8,
          roughness: 0.1
        })
      );
      coil.rotation.x = Math.PI / 2;
      gearGroup.add(coil);
    } else if (gearId === 'gear-bloxycola') {
      // Bloxy Cola can
      const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.65, 16),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.3 })
      );
      gearGroup.add(can);
    } else if (gearId === 'gear-rainbowsword') {
      // Rainbow Katana Sword
      const hilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
      );
      hilt.rotation.x = Math.PI / 2;
      gearGroup.add(hilt);

      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.2, 0.05),
        new THREE.MeshStandardMaterial({
          color: 0xec4899,
          emissive: 0x8b5cf6,
          emissiveIntensity: 0.6,
          roughness: 0.1,
          metalness: 0.8
        })
      );
      blade.position.set(0, 1.1, 0.2);
      blade.rotation.x = 0.25;
      gearGroup.add(blade);
    }
  };
  buildGear(appearance.equippedGear);

  // LEFT LEG (1 x 2 x 1 studs, pivot at hip) - Curved beveled edges
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.5, -1.0, 0); // Hip joint
  torso.add(leftLegGroup);

  const pantsTex = createRobloxPantsTexture(appearance.bodyColors.leftLeg, appearance.equippedPants);
  const legMat = createPlasticMat(appearance.bodyColors.leftLeg, pantsTex);
  const legGeo = new RoundedBoxGeometry(1, 2, 1, 3, 0.08);

  const leftLegMesh = new THREE.Mesh(legGeo, legMat);
  leftLegMesh.position.y = -1.0;
  leftLegMesh.castShadow = true;
  leftLegMesh.receiveShadow = true;
  leftLegGroup.add(leftLegMesh);

  // RIGHT LEG (1 x 2 x 1 studs, pivot at hip) - Curved beveled edges
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.5, -1.0, 0); // Hip joint
  torso.add(rightLegGroup);

  const rightLegMesh = new THREE.Mesh(legGeo, legMat);
  rightLegMesh.position.y = -1.0;
  rightLegMesh.castShadow = true;
  rightLegMesh.receiveShadow = true;
  rightLegGroup.add(rightLegMesh);

  // Overall scale adjustment from avatar profile
  root.scale.set(
    appearance.scale?.width || 1,
    appearance.scale?.height || 1,
    appearance.scale?.width || 1
  );

  // HIGH-FIDELITY, STUTTER-FREE ROBLOX R6 ANIMATION CONTROLLER
  // Uses continuous integrated phases and smooth exponential lerp damping so animations NEVER snap, freeze, or stutter
  let lastWasDamaged = false;
  let walkPhase = 0;
  let idlePhase = 0;
  let dancePhase = 0;
  let moveBlend = 0;
  let jumpBlend = 0;
  let prevTime = 0;

  const updateAnimation = (
    deltaOrTime: number,
    timeOrIsMoving?: number | boolean,
    isMovingOrIsJumping?: boolean,
    isJumpingOrVertVel?: boolean | number,
    verticalVelocity: number = 0,
    isDamaged: boolean = false,
    speedScale: number = 1.0
  ) => {
    let dt = 0.016;
    let t = 0;
    let moving = false;
    let jumping = false;
    let vVel = 0;
    let damaged = false;
    let sScale = 1.0;

    if (typeof timeOrIsMoving === 'boolean') {
      // Signature: (time, isMoving, isJumping, verticalVelocity, isDamaged, speedScale)
      t = deltaOrTime;
      dt = (prevTime > 0 && t > prevTime) ? Math.min(0.05, t - prevTime) : 0.016;
      moving = timeOrIsMoving;
      jumping = Boolean(isMovingOrIsJumping);
      vVel = typeof isJumpingOrVertVel === 'number' ? isJumpingOrVertVel : 0;
      damaged = Boolean(verticalVelocity);
      sScale = typeof isDamaged === 'number' ? isDamaged : 1.0;
    } else {
      // Signature: (delta, time, isMoving, isJumping, verticalVelocity, isDamaged, speedScale)
      dt = Math.min(0.05, Math.max(0.001, deltaOrTime));
      t = typeof timeOrIsMoving === 'number' ? timeOrIsMoving : dt;
      moving = Boolean(isMovingOrIsJumping);
      jumping = Boolean(isJumpingOrVertVel);
      vVel = typeof verticalVelocity === 'number' ? verticalVelocity : 0;
      damaged = Boolean(isDamaged);
      sScale = typeof speedScale === 'number' ? speedScale : 1.0;
    }
    prevTime = t;

    // Face swap on damage
    if (damaged !== lastWasDamaged) {
      lastWasDamaged = damaged;
      faceTex.dispose();
      faceTex = createRobloxFaceTexture(appearance.equippedFace, damaged);
      faceMat.map = faceTex;
      faceMat.needsUpdate = true;
    }

    // Continuously accumulate phase (guarantees C1 mathematical continuity so changing speed never causes phase jumping or stuttering!)
    const swingSpeed = 12 * Math.min(1.6, Math.max(0.8, sScale));
    walkPhase += dt * swingSpeed;
    idlePhase += dt * 2.2;
    dancePhase += dt * 7.0;

    // Smooth movement blend weight to eliminate abrupt start/stop pops
    moveBlend = THREE.MathUtils.lerp(moveBlend, moving ? 1.0 : 0.0, Math.min(1, dt * 14));

    // Smooth airborne / jump blend weight
    const isAirborne = jumping || Math.abs(vVel) > 2.5;
    jumpBlend = THREE.MathUtils.lerp(jumpBlend, isAirborne ? 1.0 : 0.0, Math.min(1, dt * 16));

    // Target rotations and positions
    let targetLeftArmX = 0;
    let targetLeftArmY = 0;
    let targetLeftArmZ = 0;

    let targetRightArmX = 0;
    let targetRightArmY = 0;
    let targetRightArmZ = 0;

    let targetLeftLegX = 0;
    let targetLeftLegY = 0;
    let targetLeftLegZ = 0;

    let targetRightLegX = 0;
    let targetRightLegY = 0;
    let targetRightLegZ = 0;

    let targetTorsoX = 0;
    let targetTorsoY = 0;
    let targetTorsoZ = 0;
    let targetTorsoPosY = 3.0;

    let targetHeadX = 0;
    let targetHeadY = 0;
    let targetHeadZ = 0;

    // Idle base pose
    const breathe = Math.sin(idlePhase) * 0.04;
    targetLeftArmX = breathe;
    targetLeftArmZ = 0.08;
    targetRightArmX = -breathe;
    targetRightArmZ = -0.08;
    targetTorsoPosY = 3.0 + breathe * 0.5;

    // Walk / Run layer
    if (moveBlend > 0.005) {
      const swingAngle = Math.sin(walkPhase) * 0.85 * moveBlend;
      targetLeftArmX = THREE.MathUtils.lerp(targetLeftArmX, swingAngle, moveBlend);
      targetRightArmX = THREE.MathUtils.lerp(targetRightArmX, -swingAngle, moveBlend);
      targetLeftLegX = THREE.MathUtils.lerp(targetLeftLegX, -swingAngle * 0.95, moveBlend);
      targetRightLegX = THREE.MathUtils.lerp(targetRightLegX, swingAngle * 0.95, moveBlend);

      const stepBob = Math.abs(Math.sin(walkPhase)) * 0.14 * moveBlend;
      targetTorsoPosY = 3.0 + stepBob;
      targetTorsoX = 0.06 * moveBlend;
      targetHeadX = -0.04 * moveBlend;
    }

    // Dance / Wave Emote layer (only if not moving or jumping)
    if (moveBlend < 0.3 && jumpBlend < 0.2) {
      if (appearance.animation === 'dance') {
        const sway = Math.sin(dancePhase);
        targetLeftArmX = Math.sin(dancePhase * 0.8) * 1.3;
        targetLeftArmZ = 0.3 + Math.abs(sway) * 0.4;
        targetRightArmX = Math.cos(dancePhase * 0.8) * 1.3;
        targetRightArmZ = -0.3 - Math.abs(sway) * 0.4;

        targetTorsoY = sway * 0.4;
        targetTorsoZ = sway * 0.1;
        targetLeftLegZ = sway * 0.25;
        targetRightLegZ = -sway * 0.25;
        targetTorsoPosY = 3.0 + Math.abs(Math.sin(dancePhase * 2)) * 0.18;
      } else if (appearance.animation === 'wave') {
        targetLeftArmX = 0.05;
        targetLeftArmZ = 0.08;
        targetRightArmX = -2.5;
        targetRightArmZ = -0.4 + Math.sin(t * 12) * 0.35;
        targetHeadZ = -0.15;
        targetTorsoPosY = 3.0;
      }
    }

    // Airborne / Jump / Fall layer
    if (jumpBlend > 0.005) {
      if (vVel > 0) {
        // Classic Roblox "Arms Raised" Jump Pose!
        targetLeftArmX = THREE.MathUtils.lerp(targetLeftArmX, -2.3, jumpBlend);
        targetLeftArmZ = THREE.MathUtils.lerp(targetLeftArmZ, 0.18, jumpBlend);
        targetRightArmX = THREE.MathUtils.lerp(targetRightArmX, -2.3, jumpBlend);
        targetRightArmZ = THREE.MathUtils.lerp(targetRightArmZ, -0.18, jumpBlend);

        targetLeftLegX = THREE.MathUtils.lerp(targetLeftLegX, 0.45, jumpBlend);
        targetRightLegX = THREE.MathUtils.lerp(targetRightLegX, -0.3, jumpBlend);
        targetHeadX = THREE.MathUtils.lerp(targetHeadX, -0.15, jumpBlend);
        targetTorsoPosY = THREE.MathUtils.lerp(targetTorsoPosY, 3.15, jumpBlend);
      } else {
        // Classic Roblox Freefall / Falling Pose with subtle flailing
        const flail = Math.sin(t * 14) * 0.15;
        targetLeftArmX = THREE.MathUtils.lerp(targetLeftArmX, -1.7 + flail, jumpBlend);
        targetLeftArmZ = THREE.MathUtils.lerp(targetLeftArmZ, 0.35, jumpBlend);
        targetRightArmX = THREE.MathUtils.lerp(targetRightArmX, -1.7 - flail, jumpBlend);
        targetRightArmZ = THREE.MathUtils.lerp(targetRightArmZ, -0.35, jumpBlend);

        targetLeftLegX = THREE.MathUtils.lerp(targetLeftLegX, 0.3 + flail * 0.5, jumpBlend);
        targetRightLegX = THREE.MathUtils.lerp(targetRightLegX, 0.3 - flail * 0.5, jumpBlend);
        targetLeftLegZ = THREE.MathUtils.lerp(targetLeftLegZ, -0.1, jumpBlend);
        targetRightLegZ = THREE.MathUtils.lerp(targetRightLegZ, 0.1, jumpBlend);

        targetHeadX = THREE.MathUtils.lerp(targetHeadX, 0.1, jumpBlend);
        targetTorsoPosY = THREE.MathUtils.lerp(targetTorsoPosY, 3.1, jumpBlend);
      }
    }

    // SMOOTH DAMPING INTERPOLATION (Zero snapping, buttery-smooth transition between all poses)
    const blendRate = Math.min(1, dt * 22);

    leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, targetLeftArmX, blendRate);
    leftArmGroup.rotation.y = THREE.MathUtils.lerp(leftArmGroup.rotation.y, targetLeftArmY, blendRate);
    leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, targetLeftArmZ, blendRate);

    rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, targetRightArmX, blendRate);
    rightArmGroup.rotation.y = THREE.MathUtils.lerp(rightArmGroup.rotation.y, targetRightArmY, blendRate);
    rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, targetRightArmZ, blendRate);

    leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, targetLeftLegX, blendRate);
    leftLegGroup.rotation.y = THREE.MathUtils.lerp(leftLegGroup.rotation.y, targetLeftLegY, blendRate);
    leftLegGroup.rotation.z = THREE.MathUtils.lerp(leftLegGroup.rotation.z, targetLeftLegZ, blendRate);

    rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, targetRightLegX, blendRate);
    rightLegGroup.rotation.y = THREE.MathUtils.lerp(rightLegGroup.rotation.y, targetRightLegY, blendRate);
    rightLegGroup.rotation.z = THREE.MathUtils.lerp(rightLegGroup.rotation.z, targetRightLegZ, blendRate);

    torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, targetTorsoX, blendRate);
    torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, targetTorsoY, blendRate);
    torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, targetTorsoZ, blendRate);
    torso.position.y = THREE.MathUtils.lerp(torso.position.y, targetTorsoPosY, blendRate);

    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetHeadX, blendRate);
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadY, blendRate);
    head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, targetHeadZ, blendRate);
  };

  const updateAppearance = (newApp: AvatarAppearance) => {
    torsoTex.dispose();
    const newTorsoTex = createRobloxShirtTexture(newApp.bodyColors.torso, newApp.equippedShirt);
    (torsoMat as THREE.MeshStandardMaterial).map = newTorsoTex;
    (torsoMat as THREE.MeshStandardMaterial).needsUpdate = true;

    pantsTex.dispose();
    const newPantsTex = createRobloxPantsTexture(newApp.bodyColors.leftLeg, newApp.equippedPants);
    (legMat as THREE.MeshStandardMaterial).map = newPantsTex;
    (legMat as THREE.MeshStandardMaterial).needsUpdate = true;

    (headMat as THREE.MeshStandardMaterial).color.set(newApp.bodyColors.head);
    (headStudMat as THREE.MeshStandardMaterial).color.set(newApp.bodyColors.head);
    (neckMat as THREE.MeshStandardMaterial).color.set(newApp.bodyColors.head);
    (leftArmMat as THREE.MeshStandardMaterial).color.set(newApp.bodyColors.leftArm);
    (rightArmMat as THREE.MeshStandardMaterial).color.set(newApp.bodyColors.rightArm);

    faceTex.dispose();
    faceTex = createRobloxFaceTexture(newApp.equippedFace, false);
    faceMat.map = faceTex;
    faceMat.needsUpdate = true;

    buildHat(newApp.equippedHat);
    buildGear(newApp.equippedGear);
  };

  const getPlayerColliderBoxes = () => {
    const pos = root.position;
    return [
      {
        name: 'HumanoidRootPart',
        center: new THREE.Vector3(pos.x, pos.y + 3.0, pos.z),
        size: new THREE.Vector3(2, 2, 1),
        canCollide: true,
        isAnchored: false,
      },
      {
        name: 'Head',
        center: new THREE.Vector3(pos.x, pos.y + 4.7, pos.z),
        size: new THREE.Vector3(1.25, 1.25, 1.25),
        canCollide: true,
        isAnchored: false,
      },
      {
        name: 'Torso',
        center: new THREE.Vector3(pos.x, pos.y + 3.0, pos.z),
        size: new THREE.Vector3(2, 2, 1),
        canCollide: true,
        isAnchored: false,
      },
      {
        name: 'LeftArm',
        center: new THREE.Vector3(pos.x - 1.5, pos.y + 3.0, pos.z),
        size: new THREE.Vector3(1, 2, 1),
        canCollide: true,
        isAnchored: false,
      },
      {
        name: 'RightArm',
        center: new THREE.Vector3(pos.x + 1.5, pos.y + 3.0, pos.z),
        size: new THREE.Vector3(1, 2, 1),
        canCollide: true,
        isAnchored: false,
      },
      {
        name: 'LeftLeg',
        center: new THREE.Vector3(pos.x - 0.5, pos.y + 1.0, pos.z),
        size: new THREE.Vector3(1, 2, 1),
        canCollide: true,
        isAnchored: false,
      },
      {
        name: 'RightLeg',
        center: new THREE.Vector3(pos.x + 0.5, pos.y + 1.0, pos.z),
        size: new THREE.Vector3(1, 2, 1),
        canCollide: true,
        isAnchored: false,
      }
    ];
  };

  return {
    root,
    head,
    torso,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    hatGroup,
    gearGroup,
    updateAnimation,
    updateAppearance,
    getPlayerColliderBoxes
  };
}

