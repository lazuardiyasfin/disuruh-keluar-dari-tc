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

  const doorMain = byName["right-door"];
  const doorSec = byName["left-door"];
  const doorFrame = byName["door-frame"];
  const spindle = byName["inner-door-handle"];

  reparentKeepWorld(byName["right-door-glass"], doorMain);
  reparentKeepWorld(byName["keyframe"], doorMain);
  reparentKeepWorld(byName["keyhole"], byName["keyframe"]);
  reparentKeepWorld(byName["door-handle"], doorMain);
  reparentKeepWorld(byName["inner-door-handle"], byName["door-handle"]);
  reparentKeepWorld(byName["knob"], spindle);
  reparentKeepWorld(byName["left-door-glass"], doorSec);
  reparentKeepWorld(byName["right-door-frame-window"], doorFrame);
  reparentKeepWorld(byName["left-door-frame-window"], doorFrame);

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
