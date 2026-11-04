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
  
  const wheels = gltf.nodes.filter(
    (n) => n.name && n.name.toLowerCase().includes("wheel")
  );

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
          } else if (upperAngle <= 0) {
            upperAngle = 0;
            upperDir = 1;
            upperPause = UPPER_PAUSE;
          }
        }
        
        upper.rotation[1] = upperAngle;
      }
    },
  };
}