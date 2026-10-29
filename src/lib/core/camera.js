import { Transform } from './transform.js';
import { Mat4 } from '../math/mat4.js';
import { Vec3 } from '../math/vec3.js';

export class Camera extends Transform {
    constructor(gl, { near = 0.1, far = 100, fov = 45, aspect = 1 } = {}) {
        super();
        this.projectionMatrix = new Mat4();
        this.viewMatrix = new Mat4();
        this.projectionViewMatrix = new Mat4();
        this.worldPosition = new Vec3();
        this.target = null;

        this.near = near; this.far = far; this.fov = fov; this.aspect = aspect;
        this.perspective();
    }

    perspective({ fov = this.fov, aspect = this.aspect, near = this.near, far = this.far } = {}) {
        Object.assign(this, { fov, aspect, near, far });
        this.projectionMatrix.fromPerspective({ fov: fov * Math.PI / 180, aspect, near, far });
        return this;
    }

    lookAt(target) {
        this.target = target instanceof Vec3 ? target : new Vec3(target[0], target[1], target[2]);
        return this;
    }

    updateMatrixWorld(force) {
        if (this.target) {
            this.viewMatrix.lookAt(this.position, this.target, this.up);
            this.worldMatrix.inverse(this.viewMatrix);
            this.worldPosition.copy(this.position);
            for (const c of this.children) c.updateMatrixWorld(true);
        } else {
            super.updateMatrixWorld(force);
            this.worldMatrix.getTranslation(this.worldPosition);
            this.viewMatrix.inverse(this.worldMatrix);
        }
        this.projectionViewMatrix.multiply(this.projectionMatrix, this.viewMatrix);
    }
}