import { Transform } from "../lib/core/transform.js";
import { GLTFLoader } from "../lib/extra/gltfLoader.js";
import { reparentKeepWorld } from "./sceneUtils.js";

export async function createRollerBlind(gl, program, glbUrl) {
  const root = new Transform();
  const gltf = await GLTFLoader.load(gl, glbUrl, program);
  root.addChild(gltf.root);

  const byName = {};
  gltf.nodes.forEach((n) => {
    if (n.name) byName[n.name.toLowerCase()] = n;
  });

  const pullBar = byName["pullbar"];
  const roller = byName["roller"];
  const blind = byName["blind"];

  if (roller) reparentKeepWorld(roller, gltf.root);
  if (blind) reparentKeepWorld(blind, gltf.root);
  if (pullBar) reparentKeepWorld(pullBar, gltf.root);

  gltf.root.updateMatrixWorld(true);

  function getWorldBounds(node) {
    if (!node) return null;
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;
    node.traverse((child) => {
      if (!child.geometry) return;
      const pos = child.geometry.attributes.position.data;
      const m = child.worldMatrix;
      for (let i = 0; i < pos.length; i += 3) {
        const x = pos[i],
          y = pos[i + 1],
          z = pos[i + 2];
        const tx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const ty = m[1] * x + m[5] * y + m[9] * z + m[13];
        const tz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (tx < minX) minX = tx;
        if (tx > maxX) maxX = tx;
        if (ty < minY) minY = ty;
        if (ty > maxY) maxY = ty;
        if (tz < minZ) minZ = tz;
        if (tz > maxZ) maxZ = tz;
      }
    });
    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    };
  }

  const blindB = getWorldBounds(blind);
  const rollerB = roller ? getWorldBounds(roller) : null;
  const pullBarB = pullBar ? getWorldBounds(pullBar) : null;

  const H = blindB.max[1] - blindB.min[1];
  const blindTopY = blindB.max[1];
  const blindBottomY = blindB.min[1];

  const blindPivot = new Transform();
  blindPivot.position.set(blind.position[0], blindTopY, blind.position[2]);
  gltf.root.addChild(blindPivot);

  const offsetY = blind.position[1] - blindTopY;
  blindPivot.addChild(blind);
  blind.position[0] = 0;
  blind.position[1] = offsetY;
  blind.position[2] = 0;
  blind.updateMatrixWorld(true);

  if (roller) {
    roller.position[0] += blindB.center[0] - rollerB.center[0];
    roller.position[1] += blindTopY - rollerB.min[1];
    roller.position[2] += blindB.center[2] - rollerB.center[2];
    roller.updateMatrixWorld(true);
  }

  let pullBarBaseY = 0;
  if (pullBar) {
    pullBar.position[0] += blindB.center[0] - pullBarB.center[0];
    pullBar.position[1] += blindBottomY - pullBarB.max[1];
    pullBar.position[2] += blindB.center[2] - pullBarB.center[2];
    pullBarBaseY = pullBar.position[1];
    pullBar.updateMatrixWorld(true);
  }

  console.log("RollerBlind:", { H, blindTopY, blindBottomY, pullBarBaseY });

  let t = 1,
    dir = -1,
    pause = 0;
  const SPEED = 0.6,
    MIN_T = 0.1,
    PAUSE = 0.5;

  return {
    root,
    pullBar,
    roller,
    blind,
    blindPivot,
    update(dt) {
      if (!blind) return;

      if (pause > 0) {
        pause -= dt;
      } else {
        t += dir * SPEED * dt;
        if (t <= MIN_T) {
          t = MIN_T;
          dir = 1;
          pause = PAUSE;
        }
        if (t >= 1.0) {
          t = 1.0;
          dir = -1;
          pause = PAUSE;
        }
      }

      blindPivot.scale[1] = t;

      if (pullBar) {
        pullBar.position[1] = pullBarBaseY + H * (1 - t);
      }
    },
  };
}
