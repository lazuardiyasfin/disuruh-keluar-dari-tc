import { Transform } from "../lib/core/transform.js";
import { createChair } from "./teacherChair.js";
import { createDoor } from "./door.js";

export async function createScene(gl, program) {
  const root = new Transform();

  const chair = await createChair(
    gl,
    program,
    "./assets/models/teacherChair.glb",
  );
  root.addChild(chair.root);

  const door = await createDoor(gl, program, "./assets/models/door.glb");
  door.root.position.set(2, 0, 0);
  door.root.rotation[1] = Math.PI;
  root.addChild(door.root);

  return {
    root,
    update(dt) {
      chair.update(dt);
      door.update(dt);
    },
  };
}
