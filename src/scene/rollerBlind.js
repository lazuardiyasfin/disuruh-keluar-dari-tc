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
  if (blind) reparentKeepWorld(blind, roller); 
  if (pullBar) reparentKeepWorld(pullBar, blind);

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

      blind.scale[1] = t;

      if (pullBar) {
        pullBar.scale[1] = 1 / t;
      }
    },
  };
}