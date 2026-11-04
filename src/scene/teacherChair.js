import { Transform } from "../lib/core/transform.js";
import { GLTFLoader } from "../lib/extra/gltfLoader.js";
import { reparentKeepWorld } from "./sceneUtils.js";

export async function createChair(gl, program, glbUrl) {
  const root = new Transform();
  const gltf = await GLTFLoader.load(gl, glbUrl, program);
  root.addChild(gltf.root);

  const byName = {};
  gltf.nodes.forEach((n) => {
    if (n.name) byName[n.name.toLowerCase()] = n;
  });

  const upper = byName["upper"];
  const bottom = byName["bottom"];
  const wheels = [];
  for (let i = 1; i <= 5; i++) {
    const w =
      byName[`wheel-${i}`] || byName[`wheel${i}`] || byName[`wheel_${i}`];
    if (w) wheels.push(w);
  }
  if (wheels.length === 0) {
    gltf.nodes.forEach((n) => {
      if (n.name && n.name.toLowerCase().includes("wheel")) wheels.push(n);
    });
  }

  console.log("Chair nodes:", {
    upper: upper?.name,
    bottom: bottom?.name,
    wheels: wheels.map((w) => w.name),
  });

  if (bottom) {
    if (upper) reparentKeepWorld(upper, bottom);
    for (const w of wheels) reparentKeepWorld(w, bottom);
  }

  let upperAngle = 0;
  let upperDir = 1;
  let upperPause = 0;

  const UPPER_SPEED = 6;
  const UPPER_MAX = Math.PI * 2;
  const UPPER_PAUSE = 0.6;
  const WHEEL_SPEED = 5.0;

  return {
    root,
    wheels,
    upper,
    bottom,
    update(dt) {
      if (upper) {
        if (upperPause > 0) {
          upperPause -= dt;
        } else {
          upperAngle += upperDir * UPPER_SPEED * dt;
          if (upperAngle >= UPPER_MAX) {
            upperAngle = UPPER_MAX;
            upperDir = -1;
            upperPause = UPPER_PAUSE;
          }
          if (upperAngle <= 0) {
            upperAngle = 0;
            upperDir = 1;
            upperPause = UPPER_PAUSE;
          }
        }
        upper.rotation[2] = upperAngle;
      }

      for (const w of wheels) {
        w.rotation[0] += WHEEL_SPEED * dt;
      }
    },
  };
}
