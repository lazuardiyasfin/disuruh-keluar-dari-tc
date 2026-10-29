import { Vec3 } from '../math/vec3.js';
import { Euler } from '../math/euler.js'
import { Mat4 } from '../math/mat4.js';

export class Transform {
    constructor() {
        this.parent = null;
        this.children = [];
        this.visible = true;

        this.matrix = new Mat4();
        this.worldMatrix = new Mat4();
        this.matrixAutoUpdate = true;
        this.worldMatrixNeedsUpdate = false;

        this.position = new Vec3();
        this.rotation = new Euler();
        this.scale = new Vec3(1);
        this.up = new Vec3(0, 1, 0);
    }

    setParent(parent, notifyParent = true) {
        if (this.parent && parent !== this.parent) this.parent.removeChild(this, false);
        this.parent = parent;
        if (notifyParent && parent) parent.addChild(this, false);
    }

    addChild(child, notifyChild = true) {
        if (!~this.children.indexOf(child)) this.children.push(child);
        if (notifyChild) child.setParent(this, false);
    }

    removeChild(child, notifyChild = true) {
        const i = this.children.indexOf(child);
        if (~i) this.children.splice(i, 1);
        if (notifyChild) child.setParent(null, false);
    }

    updateMatrix() {
        this.matrix.compose(this.rotation, this.position, this.scale);
        this.worldMatrixNeedsUpdate = true;
    }

    updateMatrixWorld(force) {
        if (this.matrixAutoUpdate) this.updateMatrix();
        if (this.worldMatrixNeedsUpdate || force) {
            if (this.parent === null) this.worldMatrix.copy(this.matrix);
            else this.worldMatrix.multiply(this.parent.worldMatrix, this.matrix);
            this.worldMatrixNeedsUpdate = false;
            force = true;
        }
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].updateMatrixWorld(force);
        }
    }

    traverse(callback) {
        if (callback(this)) return;
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].traverse(callback);
        }
    }
}