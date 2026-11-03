import { Transform } from "../lib/core/transform.js";
import { GLTFLoader } from "../lib/extra/gltfLoader.js";

export async function createDoor(gl, program, glbUrl) {
  const root = new Transform();
  const gltf = await GLTFLoader.load(gl, glbUrl, program);
  root.addChild(gltf.root);

  let doorMain = null;
  let doorSec = null;
  let doorFrame = null;
  let spindle = null;

  gltf.nodes.forEach((node) => {
    if (!node.name) return;
    const name = node.name.toLowerCase();
    if (name === "door-main") doorMain = node;
    if (name === "door-sec") doorSec = node;
    if (name === "doorframe") doorFrame = node;
    if (name === "spindle") spindle = node;
  });

  if (!spindle) console.warn('Door: no node named "spindle" found');

  console.log("Door nodes:", {
    main: doorMain?.name,
    sec: doorSec?.name,
    frame: doorFrame?.name,
    spindle: spindle?.name,
  });

  let angle = 0;
  let dir = 1;
  let pause = 0;
  let spindleAngle = 0;

  const SPEED = 1.8;
  const MAX = Math.PI / 2;
  const PAUSE = 0.8;
  const SPINDLE_MAX = Math.PI / 2;
  const SPINDLE_LERP = 10;

  return {
    root,
    doorMain,
    doorSec,
    doorFrame,
    spindle,
    update(dt) {
      if (!doorMain) return;

      if (pause > 0) {
        pause -= dt;
      } else {
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
        const isMoving = pause <= 0;
        const target = isMoving ? SPINDLE_MAX : 0;
        const t = Math.min(1, dt * SPINDLE_LERP);
        spindleAngle += (target - spindleAngle) * t;
        spindle.rotation[1] = -spindleAngle;
      }
    },
  };
}
