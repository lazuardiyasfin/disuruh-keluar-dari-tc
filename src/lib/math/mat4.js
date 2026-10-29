export class Mat4 extends Array {
    static get [Symbol.species]() { return Array; }

    constructor(m) { super(); if (m) this.copy(m); else this.identity(); }

    identity() {
        this[0]=1; this[1]=0; this[2]=0; this[3]=0;
        this[4]=0; this[5]=1; this[6]=0; this[7]=0;
        this[8]=0; this[9]=0; this[10]=1; this[11]=0;
        this[12]=0; this[13]=0; this[14]=0; this[15]=1;
        return this;
    }

    copy(m) { for (let i = 0; i < 16; i++) this[i] = m[i]; return this; }

    multiply(a, b) {
        const a00=a[0],a01=a[1],a02=a[2],a03=a[3];
        const a10=a[4],a11=a[5],a12=a[6],a13=a[7];
        const a20=a[8],a21=a[9],a22=a[10],a23=a[11];
        const a30=a[12],a31=a[13],a32=a[14],a33=a[15];

        for (let i = 0; i < 4; i++) {
            const b0 = b[i*4], b1 = b[i*4+1], b2 = b[i*4+2], b3 = b[i*4+3];
            this[i*4]   = a00*b0 + a10*b1 + a20*b2 + a30*b3;
            this[i*4+1] = a01*b0 + a11*b1 + a21*b2 + a31*b3;
            this[i*4+2] = a02*b0 + a12*b1 + a22*b2 + a32*b3;
            this[i*4+3] = a03*b0 + a13*b1 + a23*b2 + a33*b3;
        }
        return this;
    }

    // gl-matrix invert
    inverse(a) {
        const a00=a[0],a01=a[1],a02=a[2],a03=a[3];
        const a10=a[4],a11=a[5],a12=a[6],a13=a[7];
        const a20=a[8],a21=a[9],a22=a[10],a23=a[11];
        const a30=a[12],a31=a[13],a32=a[14],a33=a[15];

        const b00 = a00*a11 - a01*a10;
        const b01 = a00*a12 - a02*a10;
        const b02 = a00*a13 - a03*a10;
        const b03 = a01*a12 - a02*a11;
        const b04 = a01*a13 - a03*a11;
        const b05 = a02*a13 - a03*a12;
        const b06 = a20*a31 - a21*a30;
        const b07 = a20*a32 - a22*a30;
        const b08 = a20*a33 - a23*a30;
        const b09 = a21*a32 - a22*a31;
        const b10 = a21*a33 - a23*a31;
        const b11 = a22*a33 - a23*a32;

        let det = b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06;
        if (!det) return this.identity();
        det = 1 / det;

        this[0]  = (a11*b11 - a12*b10 + a13*b09) * det;
        this[1]  = (a02*b10 - a01*b11 - a03*b09) * det;
        this[2]  = (a31*b05 - a32*b04 + a33*b03) * det;
        this[3]  = (a22*b04 - a21*b05 - a23*b03) * det;
        this[4]  = (a12*b08 - a10*b11 - a13*b07) * det;
        this[5]  = (a00*b11 - a02*b08 + a03*b07) * det;
        this[6]  = (a32*b02 - a30*b05 - a33*b01) * det;
        this[7]  = (a20*b05 - a22*b02 + a23*b01) * det;
        this[8]  = (a10*b10 - a11*b08 + a13*b06) * det;
        this[9]  = (a01*b08 - a00*b10 - a03*b06) * det;
        this[10] = (a30*b04 - a31*b02 + a33*b00) * det;
        this[11] = (a21*b02 - a20*b04 - a23*b00) * det;
        this[12] = (a11*b07 - a10*b09 - a12*b06) * det;
        this[13] = (a00*b09 - a01*b07 + a02*b06) * det;
        this[14] = (a31*b01 - a30*b03 - a32*b00) * det;
        this[15] = (a20*b03 - a21*b01 + a22*b00) * det;
        return this;
    }

    lookAt(eye, target, up) {
        let zx = eye[0]-target[0], zy = eye[1]-target[1], zz = eye[2]-target[2];
        let len = Math.hypot(zx, zy, zz); zx/=len; zy/=len; zz/=len;

        let xx = up[1]*zz - up[2]*zy;
        let xy = up[2]*zx - up[0]*zz;
        let xz = up[0]*zy - up[1]*zx;
        len = Math.hypot(xx, xy, xz); xx/=len; xy/=len; xz/=len;

        const yx = zy*xz - zz*xy;
        const yy = zz*xx - zx*xz;
        const yz = zx*xy - zy*xx;

        this[0]=xx; this[1]=yx; this[2]=zx; this[3]=0;
        this[4]=xy; this[5]=yy; this[6]=zy; this[7]=0;
        this[8]=xz; this[9]=yz; this[10]=zz; this[11]=0;
        this[12] = -(xx*eye[0] + xy*eye[1] + xz*eye[2]);
        this[13] = -(yx*eye[0] + yy*eye[1] + yz*eye[2]);
        this[14] = -(zx*eye[0] + zy*eye[1] + zz*eye[2]);
        this[15] = 1;
        return this;
    }

    fromPerspective({ fov, aspect, near, far } = {}) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        this[0]  = f / aspect; this[1]  = 0;  this[2]  = 0;                   this[3]  = 0;
        this[4]  = 0;          this[5]  = f;  this[6]  = 0;                   this[7]  = 0;
        this[8]  = 0;          this[9]  = 0;  this[10] = (far + near) * nf;   this[11] = -1;
        this[12] = 0;          this[13] = 0;  this[14] = 2 * far * near * nf; this[15] = 0;
        return this;
    }

    // T * R * S with R = Rx * Ry * Rz
    compose(euler, position, scale) {
        const cx = Math.cos(euler[0]), sx = Math.sin(euler[0]);
        const cy = Math.cos(euler[1]), sy = Math.sin(euler[1]);
        const cz = Math.cos(euler[2]), sz = Math.sin(euler[2]);

        // R = Rx * Ry * Rz
        const r00 = cy*cz,               r01 = -cy*sz,              r02 = sy;
        const r10 = sx*sy*cz + cx*sz,    r11 = -sx*sy*sz + cx*cz,   r12 = -sx*cy;
        const r20 = -cx*sy*cz + sx*sz,   r21 = cx*sy*sz + sx*cz,    r22 = cx*cy;

        const sx_ = scale[0], sy_ = scale[1], sz_ = scale[2];
        this[0]  = r00*sx_; this[1]  = r10*sx_; this[2]  = r20*sx_; this[3]  = 0;
        this[4]  = r01*sy_; this[5]  = r11*sy_; this[6]  = r21*sy_; this[7]  = 0;
        this[8]  = r02*sz_; this[9]  = r12*sz_; this[10] = r22*sz_; this[11] = 0;
        this[12] = position[0]; this[13] = position[1]; this[14] = position[2]; this[15] = 1;
        return this;
    }

    getTranslation(v) {
        v[0] = this[12]; v[1] = this[13]; v[2] = this[14];
        return v;
    }

    fromRotationX(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        this[0]=1; this[1]=0;  this[2]=0;  this[3]=0;
        this[4]=0; this[5]=c;  this[6]=s;  this[7]=0;
        this[8]=0; this[9]=-s; this[10]=c; this[11]=0;
        this[12]=0; this[13]=0; this[14]=0; this[15]=1;
        return this;
    }
}