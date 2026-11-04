import { Transform } from "../lib/core/transform.js";
import { createGlassBoard } from "./glassBoard.js";
import { createStudentChair } from "./studentChair.js";
import { createStudentTable } from "./studentTable.js";
import { createTeacherTable } from "./teacherTable.js";
import { createWindows } from "./windows.js";
import { createChair } from "./teacherChair.js";
import { createDoor } from "./door.js";
import { createScreenProjector } from "./screenProjector.js";
import { createRollerBlind } from "./rollerBlind.js";

export async function createScene(gl, program) {
  const root = new Transform();
  const rollerBlinds = [];

  const teacherTableAsset = await createTeacherTable(gl, program, "./assets/models/teacherTable.glb");
  const windowsAsset = await createWindows(gl, program, "./assets/models/windows.glb");
  const teacherChair = await createChair(gl, program, "./assets/models/teacherChair.glb");
  const door = await createDoor(gl, program, "./assets/models/door.glb");
  const screenProjector = await createScreenProjector(gl, program, "./assets/models/screenProjector.glb");

  windowsAsset.root.position.set(-5, 1, -1);
  windowsAsset.root.rotation[1] = Math.PI;
  root.addChild(windowsAsset.root);

  for (let i = 0; i < 2; i++) {
    const board = await createGlassBoard(gl, program, "./assets/models/glassBoard.glb");
    board.root.position.set(i === 0 ? -1.075 : 1.075, 2, -2);
    root.addChild(board.root);
  }

  teacherTableAsset.root.position.set(-3, 0.8, 0);
  root.addChild(teacherTableAsset.root);

  const cols = 5;
  const rows = 2;
  const colSpacing = 1.5;
  const rowSpacing = 1.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * colSpacing;
      const z = 1 + r * rowSpacing;

      const table = await createStudentTable(gl, program, "./assets/models/studentTable.glb");
      table.root.position.set(x, 0, z);
      root.addChild(table.root);

      const chair = await createStudentChair(gl, program, "./assets/models/studentChair.glb");
      chair.root.position.set(x, 0, z + 0.6);
      root.addChild(chair.root);
    }
  }

  teacherChair.root.position.set(-3, 0, -1.5);
  root.addChild(teacherChair.root);

  door.root.position.set(7, 1, 0);
  door.root.rotation[1] = -Math.PI;
  root.addChild(door.root);

  screenProjector.root.position.set(-0.25, 1, -1.8);
  root.addChild(screenProjector.root);

  const blindZPositions = [-1.725, -1, -0.275];
  for (const z of blindZPositions) {
    const blind = await createRollerBlind( gl, program, "./assets/models/rollerBlind.glb" );
    blind.root.position.set(-4.92, 1.85, z);
    blind.root.rotation[1] = Math.PI / 2;
    root.addChild(blind.root);
    rollerBlinds.push(blind);
  }

  return {
    root,
    update(dt) {
      teacherChair.update(dt);
      door.update(dt);
      screenProjector.update(dt);
      for (const blind of rollerBlinds) {
        blind.update(dt);
      }
    },
  };
}