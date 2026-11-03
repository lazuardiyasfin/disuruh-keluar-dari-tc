import { Transform } from "../lib/core/transform.js";
import { createChair } from "./teacherChair.js";

export async function createScene(gl, program) {
    const root = new Transform();
    const chair = await createChair(gl, program, './assets/models/teacherChair.glb');
    root.addChild(chair.root);

    return {
        root,
        update(dt) {
            for (const wheel of chair.wheels) {
                wheel.rotation[0] += 5 * dt;
            }
            
            if (chair.upper) {
                chair.upper.rotation[2] += 1.0 * dt; 
            }
        }
    };
}
