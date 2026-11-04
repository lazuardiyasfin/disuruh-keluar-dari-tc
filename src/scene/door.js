import { Transform } from "../lib/core/transform.js";
import { GLTFLoader } from "../lib/extra/gltfLoader.js";
import { reparentKeepWorld } from "./sceneUtils.js";

export async function createDoor(gl, program, glbUrl) {
  const root = new Transform();
  const gltf = await GLTFLoader.load(gl, glbUrl, program);
  root.addChild(gltf.root);

  const byName = {};
  gltf.nodes.forEach((n) => {
    if (n.name) byName[n.name.toLowerCase()] = n;
  });

  const doorMain = byName["door-main"];
  const doorSec = byName["door-sec"];
  const doorFrame = byName["doorframe"];
  const spindle = byName["spindle"];

  reparentKeepWorld(byName["glass-main"], doorMain);
  reparentKeepWorld(byName["keyframe"], doorMain);
  reparentKeepWorld(byName["keyhole"], byName["keyframe"]);
  reparentKeepWorld(byName["spindle-hole"], doorMain);
  reparentKeepWorld(byName["spindle"], byName["spindle-hole"]);
  reparentKeepWorld(byName["knob"], spindle);
  reparentKeepWorld(byName["glass-sec"], doorSec);
  reparentKeepWorld(byName["framewindow-1"], doorFrame);
  reparentKeepWorld(byName["framewindow-2"], doorFrame);

  let angle = 0,
    dir = 1,
    pause = 0,
    spindleAngle = 0;
  const SPEED = 1.8,
    MAX = Math.PI / 2,
    PAUSE = 0.8;
  const SPINDLE_MAX = Math.PI / 2,
    SPINDLE_LERP = 10;

  return {
    root,
    doorMain,
    doorSec,
    doorFrame,
    spindle,
    update(dt) {
      if (!doorMain) return;

      if (pause > 0) pause -= dt;
      else {
        angle += dir * SPEED * dt;
        if (angle >= MAX) {
          angle = MAX;
          dir = -1;
          pause = PAUSE;
        }
        if (angle <= 0) {
          angle = 0;
          dir = 1;
          pause = PAUSE;
        }
      }
      doorMain.rotation[1] = angle;

      if (spindle) {
        const target = pause <= 0 ? SPINDLE_MAX : 0;
        spindleAngle +=
          (target - spindleAngle) * Math.min(1, dt * SPINDLE_LERP);
        spindle.rotation[1] = -spindleAngle;
      }
    },
  };
}
