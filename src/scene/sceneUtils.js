import { Mat4 } from "../lib/math/mat4.js";

export function reparentKeepWorld(child, newParent) {
  if (!child || !newParent || child === newParent) return;

  newParent.updateMatrixWorld(true);
  child.updateMatrixWorld(true);

  const childWorld = new Mat4();
  for (let i = 0; i < 16; i++) childWorld[i] = child.worldMatrix[i];

  const invParent = new Mat4().inverse(newParent.worldMatrix);
  const localMatrix = new Mat4().multiply(invParent, childWorld);

  localMatrix.decompose(child.position, child.rotation, child.scale);
  newParent.addChild(child);
  child.worldMatrixNeedsUpdate = true;
}
