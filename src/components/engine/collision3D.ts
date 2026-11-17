import * as THREE from 'three';
import { BloxPart, PartType } from '../../types';

export type ColliderShapeType = 'box' | 'sphere' | 'cylinder' | 'wedge' | 'rig';

export interface ShapeCollider {
  id: string;
  shape: ColliderShapeType;
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  size: THREE.Vector3;
  canCollide: boolean;
  anchored: boolean;
  isTruss?: boolean;
  partType?: PartType;
}

export interface ClosestPointResult {
  inside: boolean;
  /** Positive if inside (penetration depth), negative if outside (-distance). */
  penetration: number;
  /** Closest point on the shape's surface in world space. */
  closestWorld: THREE.Vector3;
  /** Outward unit surface normal in world space. */
  normalWorld: THREE.Vector3;
}

export interface ShapeContact {
  collided: boolean;
  penetration: number;
  /** Normal pointing from shape B toward shape A (direction to push A out of B). */
  normalOnBToA: THREE.Vector3;
  contactWorld: THREE.Vector3;
}

// Reusable scratch vectors & quaternions to avoid allocations inside 240Hz physics substeps
const _invQuat = new THREE.Quaternion();
const _localPt = new THREE.Vector3();
const _localClosest = new THREE.Vector3();
const _localNormal = new THREE.Vector3();
const _diff = new THREE.Vector3();
const _segPt = new THREE.Vector3();
const _probeClosest = new THREE.Vector3();
const _probeNormal = new THREE.Vector3();
const _bestClosest = new THREE.Vector3();
const _bestNormal = new THREE.Vector3();
const _worldPt = new THREE.Vector3();
const _tmpVec = new THREE.Vector3();
const _tmpNormal = new THREE.Vector3();
const _tmpClosest = new THREE.Vector3();
const _axisVec = new THREE.Vector3();
const _perpVec = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'XYZ');

export function getPartColliderShape(type: PartType): ColliderShapeType {
  switch (type) {
    case 'sphere':
      return 'sphere';
    case 'cylinder':
      return 'cylinder';
    case 'wedge':
      return 'wedge';
    case 'rig':
    case 'npc':
      return 'rig';
    default:
      return 'box';
  }
}

export function eulerDegToQuaternion(rot: { x: number; y: number; z: number }, out = new THREE.Quaternion()): THREE.Quaternion {
  _euler.set(
    THREE.MathUtils.degToRad(rot.x || 0),
    THREE.MathUtils.degToRad(rot.y || 0),
    THREE.MathUtils.degToRad(rot.z || 0),
    'XYZ'
  );
  return out.setFromEuler(_euler);
}

export function partToCollider(
  part: BloxPart,
  overridePos?: THREE.Vector3,
  overrideQuat?: THREE.Quaternion,
  outPos?: THREE.Vector3,
  outQuat?: THREE.Quaternion,
  outSize?: THREE.Vector3
): ShapeCollider {
  const pos = outPos || new THREE.Vector3();
  const quat = outQuat || new THREE.Quaternion();
  const size = outSize || new THREE.Vector3();

  if (overridePos) {
    pos.copy(overridePos);
  } else {
    pos.set(part.position.x, part.position.y, part.position.z);
  }

  if (overrideQuat) {
    quat.copy(overrideQuat);
  } else {
    eulerDegToQuaternion(part.rotation || { x: 0, y: 0, z: 0 }, quat);
  }

  size.set(
    Math.max(0.05, part.size.x),
    Math.max(0.05, part.size.y),
    Math.max(0.05, part.size.z)
  );

  // Coin meshes are rotated +90 deg on X so their cylinder cap faces Z
  if (part.type === 'coin' && !overrideQuat) {
    const coinQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    quat.copy(coinQuat);
    size.set(Math.max(0.1, part.size.x), Math.max(0.1, part.size.z), Math.max(0.1, part.size.x));
  }

  return {
    id: part.id,
    shape: part.type === 'coin' ? 'cylinder' : getPartColliderShape(part.type),
    pos,
    quat,
    size,
    canCollide: part.canCollide !== false,
    anchored: (part.anchored ?? part.isAnchored) ?? true,
    isTruss: part.type === 'truss',
    partType: part.type
  };
}

/**
 * Exact bounding radius of a ShapeCollider for fast broadphase rejection.
 */
export function getBoundingRadius(collider: ShapeCollider): number {
  const { shape, size } = collider;
  if (shape === 'sphere') {
    return Math.max(0.05, size.x / 2);
  }
  if (shape === 'cylinder') {
    const r = Math.max(0.05, size.x / 2);
    const hy = Math.max(0.05, size.y / 2);
    return Math.hypot(r, hy);
  }
  return Math.hypot(size.x * 0.5, size.y * 0.5, size.z * 0.5);
}

/**
 * Computes the exact closest surface point and outward normal on a local-space shape
 * relative to `localPt`.
 * Matches the exact Three.js geometries rendered in BloxEngine3D.tsx:
 * - box: [-sx/2..sx/2, -sy/2..sy/2, -sz/2..sz/2]
 * - sphere: SphereGeometry(sx / 2)
 * - cylinder: CylinderGeometry(sx / 2, sx / 2, sy) along local Y
 * - wedge: Right-triangular prism with slope from (-sx/2, -sy/2) to (+sx/2, +sy/2), extruded along Z
 * - rig: Upright rounded body cylinder matching R6 character silhouette
 */
function closestPointLocal(
  shape: ColliderShapeType,
  size: THREE.Vector3,
  localPt: THREE.Vector3,
  outClosest: THREE.Vector3,
  outNormal: THREE.Vector3
): { inside: boolean; penetration: number } {
  const px = localPt.x;
  const py = localPt.y;
  const pz = localPt.z;

  if (shape === 'sphere') {
    const r = Math.max(0.05, size.x * 0.5);
    const len = Math.hypot(px, py, pz);
    if (len < 1e-6) {
      outNormal.set(0, 1, 0);
      outClosest.set(0, r, 0);
      return { inside: true, penetration: r };
    }
    const inv = 1 / len;
    outNormal.set(px * inv, py * inv, pz * inv);
    outClosest.set(outNormal.x * r, outNormal.y * r, outNormal.z * r);
    return { inside: len <= r, penetration: r - len };
  }

  if (shape === 'cylinder' || shape === 'rig') {
    const r = shape === 'rig'
      ? Math.max(0.55, Math.min(size.x * 0.36, size.z * 0.65))
      : Math.max(0.05, size.x * 0.5);
    const hy = Math.max(0.05, size.y * 0.5);
    const radial = Math.hypot(px, pz);
    const absY = Math.abs(py);

    if (radial <= r && absY <= hy) {
      const dWall = r - radial;
      const dCap = hy - absY;
      if (dWall < dCap) {
        if (radial < 1e-6) {
          outNormal.set(1, 0, 0);
          outClosest.set(r, py, 0);
        } else {
          const nx = px / radial;
          const nz = pz / radial;
          outNormal.set(nx, 0, nz);
          outClosest.set(nx * r, py, nz * r);
        }
        return { inside: true, penetration: dWall };
      } else {
        const ny = py >= 0 ? 1 : -1;
        outNormal.set(0, ny, 0);
        outClosest.set(px, ny * hy, pz);
        return { inside: true, penetration: dCap };
      }
    }

    const cy = Math.max(-hy, Math.min(hy, py));
    let cx = px;
    let cz = pz;
    if (radial > r) {
      const scale = r / radial;
      cx = px * scale;
      cz = pz * scale;
    }
    outClosest.set(cx, cy, cz);
    const dx = px - cx;
    const dy = py - cy;
    const dz = pz - cz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 1e-6) {
      outNormal.set(dx / dist, dy / dist, dz / dist);
    } else {
      outNormal.set(0, 1, 0);
    }
    return { inside: false, penetration: -dist };
  }

  if (shape === 'wedge') {
    const hx = Math.max(0.05, size.x * 0.5);
    const hy = Math.max(0.05, size.y * 0.5);
    const hz = Math.max(0.05, size.z * 0.5);

    const sx = hx * 2;
    const sy = hy * 2;
    const slopeLen = Math.hypot(sx, sy) || 1;
    // Outward normal of the diagonal face from (-hx, -hy) to (+hx, +hy)
    const snx = -sy / slopeLen;
    const sny = sx / slopeLen;

    // Signed distance to the slope line (<= 0 means below/inside the wedge slope)
    const sSlope = (px + hx) * snx + (py + hy) * sny;
    const sBottom = -hy - py;
    const sBack = px - hx;

    const insideXY = sBottom <= 0 && sBack <= 0 && sSlope <= 0;

    if (insideXY && Math.abs(pz) <= hz) {
      const penBottom = py + hy;
      const penBack = hx - px;
      const penSlope = -sSlope;
      const penZ = hz - Math.abs(pz);

      let minPen = penSlope;
      outNormal.set(snx, sny, 0);

      if (penBottom < minPen) {
        minPen = penBottom;
        outNormal.set(0, -1, 0);
      }
      if (penBack < minPen) {
        minPen = penBack;
        outNormal.set(1, 0, 0);
      }
      if (penZ < minPen) {
        minPen = penZ;
        outNormal.set(0, 0, pz >= 0 ? 1 : -1);
      }

      outClosest.set(
        px + outNormal.x * minPen,
        py + outNormal.y * minPen,
        pz + outNormal.z * minPen
      );
      return { inside: true, penetration: minPen };
    }

    const cz = Math.max(-hz, Math.min(hz, pz));
    let cx = px;
    let cy = py;

    if (!insideXY) {
      // Closest point on the 3 triangle edges:
      // 1) Bottom: (-hx, -hy) -> (+hx, -hy)
      const abX = Math.max(-hx, Math.min(hx, px));
      const abY = -hy;
      const d2AB = (px - abX) * (px - abX) + (py - abY) * (py - abY);

      // 2) Back: (+hx, -hy) -> (+hx, +hy)
      const bcX = hx;
      const bcY = Math.max(-hy, Math.min(hy, py));
      const d2BC = (px - bcX) * (px - bcX) + (py - bcY) * (py - bcY);

      // 3) Slope: (-hx, -hy) -> (+hx, +hy)
      const denom = sx * sx + sy * sy || 1;
      const t = Math.max(0, Math.min(1, ((px + hx) * sx + (py + hy) * sy) / denom));
      const caX = -hx + t * sx;
      const caY = -hy + t * sy;
      const d2CA = (px - caX) * (px - caX) + (py - caY) * (py - caY);

      if (d2CA <= d2AB && d2CA <= d2BC) {
        cx = caX;
        cy = caY;
      } else if (d2AB <= d2BC) {
        cx = abX;
        cy = abY;
      } else {
        cx = bcX;
        cy = bcY;
      }
    }

    outClosest.set(cx, cy, cz);
    const dx = px - cx;
    const dy = py - cy;
    const dz = pz - cz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 1e-6) {
      outNormal.set(dx / dist, dy / dist, dz / dist);
    } else {
      outNormal.set(snx, sny, 0);
    }
    return { inside: false, penetration: -dist };
  }

  // Default: Box (OBB)
  const hx = Math.max(0.05, size.x * 0.5);
  const hy = Math.max(0.05, size.y * 0.5);
  const hz = Math.max(0.05, size.z * 0.5);

  if (Math.abs(px) <= hx && Math.abs(py) <= hy && Math.abs(pz) <= hz) {
    const dx = hx - Math.abs(px);
    const dy = hy - Math.abs(py);
    const dz = hz - Math.abs(pz);

    if (dy <= dx && dy <= dz) {
      const ny = py >= 0 ? 1 : -1;
      outNormal.set(0, ny, 0);
      outClosest.set(px, ny * hy, pz);
      return { inside: true, penetration: dy };
    } else if (dx <= dz) {
      const nx = px >= 0 ? 1 : -1;
      outNormal.set(nx, 0, 0);
      outClosest.set(nx * hx, py, pz);
      return { inside: true, penetration: dx };
    } else {
      const nz = pz >= 0 ? 1 : -1;
      outNormal.set(0, 0, nz);
      outClosest.set(px, py, nz * hz);
      return { inside: true, penetration: dz };
    }
  }

  const cx = Math.max(-hx, Math.min(hx, px));
  const cy = Math.max(-hy, Math.min(hy, py));
  const cz = Math.max(-hz, Math.min(hz, pz));
  outClosest.set(cx, cy, cz);

  const dx = px - cx;
  const dy = py - cy;
  const dz = pz - cz;
  const dist = Math.hypot(dx, dy, dz);
  if (dist > 1e-6) {
    outNormal.set(dx / dist, dy / dist, dz / dist);
  } else {
    outNormal.set(0, 1, 0);
  }
  return { inside: false, penetration: -dist };
}

/**
 * Closest point on a rotated 3D ShapeCollider to `worldPt`.
 */
export function closestPointOnCollider(
  collider: ShapeCollider,
  worldPt: THREE.Vector3,
  outClosestWorld = new THREE.Vector3(),
  outNormalWorld = new THREE.Vector3()
): ClosestPointResult {
  _invQuat.copy(collider.quat).invert();
  _localPt.copy(worldPt).sub(collider.pos).applyQuaternion(_invQuat);

  const res = closestPointLocal(collider.shape, collider.size, _localPt, _localClosest, _localNormal);

  outClosestWorld.copy(_localClosest).applyQuaternion(collider.quat).add(collider.pos);
  outNormalWorld.copy(_localNormal).applyQuaternion(collider.quat).normalize();

  return {
    inside: res.inside,
    penetration: res.penetration,
    closestWorld: outClosestWorld,
    normalWorld: outNormalWorld
  };
}

/**
 * Computes the deepest contact between an upright player capsule
 * (from `feetPos.y + radius` to `feetPos.y + height - radius`)
 * and any rotated 3D ShapeCollider.
 */
export function intersectCapsuleWithCollider(
  feetPos: THREE.Vector3,
  radius: number,
  height: number,
  collider: ShapeCollider,
  outNormal = new THREE.Vector3(),
  outContact = new THREE.Vector3()
): number {
  const minY = feetPos.y + radius;
  const maxY = Math.max(minY, feetPos.y + height - radius);

  // Iterative closest segment point (converges quickly for any convex shape)
  let segY = Math.max(minY, Math.min(maxY, collider.pos.y));
  for (let i = 0; i < 3; i++) {
    _segPt.set(feetPos.x, segY, feetPos.z);
    const res = closestPointOnCollider(collider, _segPt, _probeClosest, _probeNormal);
    const nextY = Math.max(minY, Math.min(maxY, res.closestWorld.y));
    if (Math.abs(nextY - segY) < 1e-4) break;
    segY = nextY;
  }

  let bestPen = -Infinity;

  // Test converged segment point, feet sphere, torso mid, and head sphere
  const samples = [segY, minY, (minY + maxY) * 0.5, maxY];
  for (let i = 0; i < samples.length; i++) {
    _segPt.set(feetPos.x, samples[i], feetPos.z);
    const res = closestPointOnCollider(collider, _segPt, _probeClosest, _probeNormal);
    const pen = radius + res.penetration;
    if (pen > bestPen) {
      bestPen = pen;
      _bestNormal.copy(res.normalWorld);
      _bestClosest.copy(res.closestWorld);
    }
  }

  if (bestPen > 0) {
    outNormal.copy(_bestNormal);
    outContact.copy(_bestClosest);
  }
  return bestPen;
}

/**
 * Checks whether a capsule overlaps a ShapeCollider (used for Touched, Killbricks, Coins, Pads).
 */
export function doesCapsuleOverlapCollider(
  feetPos: THREE.Vector3,
  radius: number,
  height: number,
  collider: ShapeCollider
): boolean {
  // Fast broadphase check
  const capsuleMidY = feetPos.y + height * 0.5;
  const dx = feetPos.x - collider.pos.x;
  const dy = capsuleMidY - collider.pos.y;
  const dz = feetPos.z - collider.pos.z;
  const maxDist = getBoundingRadius(collider) + height * 0.5 + radius;
  if (dx * dx + dy * dy + dz * dz > maxDist * maxDist) {
    return false;
  }

  const pen = intersectCapsuleWithCollider(feetPos, radius, height, collider, _tmpNormal, _tmpClosest);
  return pen > 0;
}

/**
 * Probes for the highest walkable ground surface directly under `feetPos`
 * within [minProbeY, maxProbeY], respecting part shape and rotation.
 */
export function sampleWalkableSurfaceOnCollider(
  feetPos: THREE.Vector3,
  radius: number,
  collider: ShapeCollider,
  minSlopeNormalY: number = 0.45
): { hit: boolean; surfaceY: number; normal: THREE.Vector3; contactPoint: THREE.Vector3 } {
  const probePt = _segPt.set(feetPos.x, feetPos.y + radius * 0.85, feetPos.z);
  const res = closestPointOnCollider(collider, probePt, _probeClosest, _probeNormal);

  // Must be within capsule horizontal footprint and pointing upward enough to walk
  const horizDist = Math.hypot(feetPos.x - res.closestWorld.x, feetPos.z - res.closestWorld.z);
  if (res.normalWorld.y >= minSlopeNormalY && horizDist <= radius + 0.12) {
    return {
      hit: true,
      surfaceY: res.closestWorld.y,
      normal: res.normalWorld.clone(),
      contactPoint: res.closestWorld.clone()
    };
  }
  return {
    hit: false,
    surfaceY: -Infinity,
    normal: new THREE.Vector3(0, 1, 0),
    contactPoint: new THREE.Vector3()
  };
}

/**
 * Returns the lowest world-space Y point and contact offset for Baseplate (Y = 0) collision.
 */
export function getLowestPointOnShape(
  collider: ShapeCollider,
  outLowestWorld = new THREE.Vector3()
): number {
  const { shape, pos, quat, size } = collider;

  if (shape === 'sphere') {
    const r = Math.max(0.05, size.x * 0.5);
    outLowestWorld.set(pos.x, pos.y - r, pos.z);
    return pos.y - r;
  }

  if (shape === 'cylinder' || shape === 'rig') {
    const r = shape === 'rig'
      ? Math.max(0.55, Math.min(size.x * 0.36, size.z * 0.65))
      : Math.max(0.05, size.x * 0.5);
    const hy = Math.max(0.05, size.y * 0.5);
    _axisVec.set(0, 1, 0).applyQuaternion(quat).normalize();
    const sinTheta = Math.sqrt(Math.max(0, 1 - _axisVec.y * _axisVec.y));
    const lowestY = pos.y - (hy * Math.abs(_axisVec.y) + r * sinTheta);

    // Contact offset vector in world space
    const endSign = _axisVec.y >= 0 ? -1 : 1;
    outLowestWorld.copy(pos).addScaledVector(_axisVec, endSign * hy);
    if (sinTheta > 1e-4) {
      // Direction perpendicular to axis pointing as downward as possible: (0, -1, 0) projected orthogonal to _axisVec
      _perpVec.set(0, -1, 0).addScaledVector(_axisVec, _axisVec.y).normalize();
      outLowestWorld.addScaledVector(_perpVec, r);
    }
    return lowestY;
  }

  const hx = size.x * 0.5;
  const hy = size.y * 0.5;
  const hz = size.z * 0.5;

  let minY = Infinity;
  let sumX = 0;
  let sumZ = 0;
  let count = 0;

  if (shape === 'wedge') {
    const corners: [number, number, number][] = [
      [-hx, -hy, -hz], [-hx, -hy, hz],
      [hx, -hy, -hz], [hx, -hy, hz],
      [hx, hy, -hz], [hx, hy, hz]
    ];
    for (const [cx, cy, cz] of corners) {
      _worldPt.set(cx, cy, cz).applyQuaternion(quat).add(pos);
      if (_worldPt.y < minY - 0.02) {
        minY = _worldPt.y;
        sumX = _worldPt.x;
        sumZ = _worldPt.z;
        count = 1;
      } else if (Math.abs(_worldPt.y - minY) <= 0.02) {
        if (_worldPt.y < minY) minY = _worldPt.y;
        sumX += _worldPt.x;
        sumZ += _worldPt.z;
        count++;
      }
    }
  } else {
    for (const sx of [-hx, hx]) {
      for (const sy of [-hy, hy]) {
        for (const sz of [-hz, hz]) {
          _worldPt.set(sx, sy, sz).applyQuaternion(quat).add(pos);
          if (_worldPt.y < minY - 0.02) {
            minY = _worldPt.y;
            sumX = _worldPt.x;
            sumZ = _worldPt.z;
            count = 1;
          } else if (Math.abs(_worldPt.y - minY) <= 0.02) {
            if (_worldPt.y < minY) minY = _worldPt.y;
            sumX += _worldPt.x;
            sumZ += _worldPt.z;
            count++;
          }
        }
      }
    }
  }

  if (count > 0) {
    outLowestWorld.set(sumX / count, minY, sumZ / count);
  } else {
    outLowestWorld.copy(pos);
  }
  return minY;
}

/**
 * Generates sample support/surface points in world space for polyhedral & cylindrical shapes
 * so Shape-vs-Shape collisions detect vertex, edge, and cap contacts accurately.
 */
function collectSamplePointsWorld(collider: ShapeCollider, outPts: THREE.Vector3[]): void {
  const { shape, pos, quat, size } = collider;
  const hx = size.x * 0.5;
  const hy = size.y * 0.5;
  const hz = size.z * 0.5;

  outPts.length = 0;

  if (shape === 'wedge') {
    const locals: [number, number, number][] = [
      // 6 vertices
      [-hx, -hy, -hz], [-hx, -hy, hz],
      [hx, -hy, -hz], [hx, -hy, hz],
      [hx, hy, -hz], [hx, hy, hz],
      // Edge midpoints on slope & base
      [0, 0, -hz], [0, 0, hz], [0, 0, 0],
      [0, -hy, 0], [hx, 0, 0], [0, -hy, -hz], [0, -hy, hz],
      [hx, 0, -hz], [hx, 0, hz]
    ];
    for (const [lx, ly, lz] of locals) {
      outPts.push(new THREE.Vector3(lx, ly, lz).applyQuaternion(quat).add(pos));
    }
    return;
  }

  if (shape === 'cylinder' || shape === 'rig') {
    const r = shape === 'rig'
      ? Math.max(0.55, Math.min(size.x * 0.36, size.z * 0.65))
      : Math.max(0.05, size.x * 0.5);
    // Cap centers + mid spine
    outPts.push(new THREE.Vector3(0, hy, 0).applyQuaternion(quat).add(pos));
    outPts.push(new THREE.Vector3(0, -hy, 0).applyQuaternion(quat).add(pos));
    outPts.push(pos.clone());
    // 8 points around top and bottom rims + 4 around middle belt
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rx = Math.cos(a) * r;
      const rz = Math.sin(a) * r;
      outPts.push(new THREE.Vector3(rx, hy, rz).applyQuaternion(quat).add(pos));
      outPts.push(new THREE.Vector3(rx, -hy, rz).applyQuaternion(quat).add(pos));
      if (i % 2 === 0) {
        outPts.push(new THREE.Vector3(rx, 0, rz).applyQuaternion(quat).add(pos));
      }
    }
    return;
  }

  // Box: 8 corners + 6 face centers + 12 edge midpoints
  for (const sx of [-hx, hx]) {
    for (const sy of [-hy, hy]) {
      for (const sz of [-hz, hz]) {
        outPts.push(new THREE.Vector3(sx, sy, sz).applyQuaternion(quat).add(pos));
      }
    }
  }
  const extra: [number, number, number][] = [
    [hx, 0, 0], [-hx, 0, 0], [0, hy, 0], [0, -hy, 0], [0, 0, hz], [0, 0, -hz],
    [0, hy, hz], [0, hy, -hz], [0, -hy, hz], [0, -hy, -hz],
    [hx, hy, 0], [-hx, hy, 0], [hx, -hy, 0], [-hx, -hy, 0],
    [hx, 0, hz], [-hx, 0, hz], [hx, 0, -hz], [-hx, 0, -hz]
  ];
  for (const [lx, ly, lz] of extra) {
    outPts.push(new THREE.Vector3(lx, ly, lz).applyQuaternion(quat).add(pos));
  }
}

const _ptsA: THREE.Vector3[] = [];
const _ptsB: THREE.Vector3[] = [];

/**
 * Exact shape-to-shape collision check between two arbitrary 3D ShapeColliders.
 * Returns penetration depth, push normal (from B toward A), and world contact point.
 */
export function collideShapePair(a: ShapeCollider, b: ShapeCollider): ShapeContact {
  const noHit: ShapeContact = {
    collided: false,
    penetration: 0,
    normalOnBToA: new THREE.Vector3(0, 1, 0),
    contactWorld: new THREE.Vector3()
  };

  if (!a.canCollide || !b.canCollide) return noHit;

  // Fast broadphase sphere check
  const maxDist = getBoundingRadius(a) + getBoundingRadius(b);
  if (a.pos.distanceToSquared(b.pos) > maxDist * maxDist) {
    return noHit;
  }

  // Exact analytical Sphere vs Sphere
  if (a.shape === 'sphere' && b.shape === 'sphere') {
    const rA = Math.max(0.05, a.size.x * 0.5);
    const rB = Math.max(0.05, b.size.x * 0.5);
    _diff.copy(a.pos).sub(b.pos);
    const dist = _diff.length();
    const pen = rA + rB - dist;
    if (pen <= 0) return noHit;
    const normal = dist > 1e-6 ? _diff.divideScalar(dist).clone() : new THREE.Vector3(0, 1, 0);
    const contact = b.pos.clone().addScaledVector(normal, rB);
    return { collided: true, penetration: pen, normalOnBToA: normal, contactWorld: contact };
  }

  // Exact Sphere A vs any Shape B
  if (a.shape === 'sphere') {
    const rA = Math.max(0.05, a.size.x * 0.5);
    const res = closestPointOnCollider(b, a.pos, _tmpClosest, _tmpNormal);
    const pen = rA + res.penetration;
    if (pen <= 0) return noHit;
    return {
      collided: true,
      penetration: pen,
      normalOnBToA: res.normalWorld.clone(),
      contactWorld: res.closestWorld.clone()
    };
  }

  // Exact any Shape A vs Sphere B
  if (b.shape === 'sphere') {
    const rB = Math.max(0.05, b.size.x * 0.5);
    const res = closestPointOnCollider(a, b.pos, _tmpClosest, _tmpNormal);
    const pen = rB + res.penetration;
    if (pen <= 0) return noHit;
    return {
      collided: true,
      penetration: pen,
      normalOnBToA: res.normalWorld.clone().negate(),
      contactWorld: res.closestWorld.clone()
    };
  }

  // General convex polyhedra / cylinder support sampling (A points in B, B points in A)
  let bestPen = 0;
  const bestNormal = new THREE.Vector3(0, 1, 0);
  const bestContact = new THREE.Vector3();
  let found = false;

  collectSamplePointsWorld(a, _ptsA);
  for (let i = 0; i < _ptsA.length; i++) {
    const res = closestPointOnCollider(b, _ptsA[i], _tmpClosest, _tmpNormal);
    if (res.inside && res.penetration > bestPen) {
      bestPen = res.penetration;
      bestNormal.copy(res.normalWorld);
      bestContact.copy(_ptsA[i]);
      found = true;
    }
  }

  collectSamplePointsWorld(b, _ptsB);
  for (let i = 0; i < _ptsB.length; i++) {
    const res = closestPointOnCollider(a, _ptsB[i], _tmpClosest, _tmpNormal);
    if (res.inside && res.penetration > bestPen) {
      bestPen = res.penetration;
      // Normal from A outward must be negated so it pushes A away from B
      bestNormal.copy(res.normalWorld).negate();
      bestContact.copy(_ptsB[i]);
      found = true;
    }
  }

  if (!found || bestPen <= 0) return noHit;

  return {
    collided: true,
    penetration: bestPen,
    normalOnBToA: bestNormal,
    contactWorld: bestContact
  };
}
