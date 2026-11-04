import { Transform } from "../lib/core/transform.js";
import { createChair } from "./teacherChair.js";
import { createDoor } from "./door.js";
import { createScreenProjector } from "./screenProjector.js";
import { createRollerBlind } from "./rollerBlind.js";

export async function createScene(gl, program) {
  const root = new Transform();

  const chair = await createChair( gl, program, "./assets/models/teacherChair.glb", );
  root.addChild(chair.root);

  const door = await createDoor(gl, program, "./assets/models/door.glb");
  door.root.position.set(4, 0, 2);
  door.root.rotation[1] = Math.PI;
  root.addChild(door.root);

  const screenProjector = await createScreenProjector( gl, program, "./assets/models/screenProjector.glb", );
  screenProjector.root.position.set(-3, 0, -1.5);
  root.addChild(screenProjector.root);

  const rollerBlind = await createRollerBlind(gl, program, "./assets/models/rollerBlind.glb");
  rollerBlind.root.position.set(-2, -1, 0.5);
  rollerBlind.root.rotation[1] = Math.PI/2;
  root.addChild(rollerBlind.root);

  return {
    root,
    update(dt) {
      chair.update(dt);
      door.update(dt);
      screenProjector.update(dt);
      rollerBlind.update(dt);
    },
  };
}
