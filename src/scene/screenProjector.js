import { Transform } from "../lib/core/transform.js";
import { GLTFLoader } from "../lib/extra/gltfLoader.js";
import { reparentKeepWorld } from "./sceneUtils.js";

export async function createScreenProjector(gl, program, glbUrl) {
  const root = new Transform();
  const gltf = await GLTFLoader.load(gl, glbUrl, program);
  root.addChild(gltf.root);

  const byName = {};
  gltf.nodes.forEach((n) => {
    if (n.name) byName[n.name.toLowerCase()] = n;
  });

  const casing = byName["casing"];
  const light = byName["light"];
  const mainScreen = byName["mainscreen"];
  const sideScreen = byName["sidescreen"];
  const bottomScreen = byName["bottomscreen"];
  const pullBar = byName["pullbar"];

  if (casing) {
    if (light) reparentKeepWorld(light, casing);
    if (mainScreen) reparentKeepWorld(mainScreen, casing);
    if (sideScreen) reparentKeepWorld(sideScreen, casing);
    if (bottomScreen) reparentKeepWorld(bottomScreen, casing);
    if (pullBar) reparentKeepWorld(pullBar, casing);
  }

  const H = originToTop(mainScreen);
  if (sideScreen) originToTop(sideScreen);

  const pullBarBaseY = pullBar ? pullBar.position[1] : 0;
  const bottomScreenBaseY = bottomScreen ? bottomScreen.position[1] : 0;

  let t = 1;
  let dir = -1;
  let pause = 0;
  const SPEED = 0.6;
  const MIN_T = 0.1;
  const PAUSE = 0.5;

  return {
    root,
    casing,
    light,
    mainScreen,
    sideScreen,
    bottomScreen,
    pullBar,
    update(dt) {
      if (!mainScreen) return;

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

      mainScreen.scale[1] = t;
      if (sideScreen) sideScreen.scale[1] = t;
      if (bottomScreen)
        bottomScreen.position[1] = bottomScreenBaseY + H * (1 - t);

      if (pullBar) {
        pullBar.position[1] = pullBarBaseY + H * (1 - t);
      }
    },
  };
}

function originToTop(node) {
  if (!node) return 0;
  let maxY = -Infinity,
    minY = Infinity;
  node.traverse((child) => {
    const pos = child.geometry?.attributes?.position?.data;
    if (!pos) return;
    for (let i = 1; i < pos.length; i += 3) {
      if (pos[i] > maxY) maxY = pos[i];
      if (pos[i] < minY) minY = pos[i];
    }
  });
  if (maxY === -Infinity) return 0;

  const H = maxY - minY;

  node.traverse((child) => {
    const pos = child.geometry?.attributes?.position?.data;
    if (!pos) return;
    for (let i = 1; i < pos.length; i += 3) pos[i] -= maxY;
    child.geometry.updateAttribute(child.geometry.attributes.position);
  });

  node.position[1] += maxY;
  node.worldMatrixNeedsUpdate = true;
  return H;
}
