import { Transform } from './transform.js';
import { normalFromMat4 } from '../math/mat3.js';

export class Mesh extends Transform {
    constructor(gl, { geometry, program, mode } = {}) {
        super();
        this.gl = gl;
        this.geometry = geometry;
        this.program = program;
        this.mode = mode !== undefined ? mode : gl.TRIANGLES;
    }

    draw({ camera } = {}) {
        if (camera) {
            const u = this.program.uniforms;
            u.modelMatrix = u.modelMatrix || { value: null };
            u.viewMatrix = u.viewMatrix || { value: null };
            u.projectionMatrix = u.projectionMatrix || { value: null };
            u.normalMatrix = u.normalMatrix || { value: null };
            u.cameraPosition = u.cameraPosition || { value: null };

            u.modelMatrix.value = this.worldMatrix;
            u.viewMatrix.value = camera.viewMatrix;
            u.projectionMatrix.value = camera.projectionMatrix;
            u.normalMatrix.value = normalFromMat4(this.worldMatrix);
            u.cameraPosition.value = camera.worldPosition;
        }
        this.program.use();
        this.geometry.draw({ program: this.program, mode: this.mode });
    }
}