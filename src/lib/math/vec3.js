export class Vec3 extends Array {
    constructor(x = 0, y = x, z = x) { super(x, y, z); }

    set(x, y, z) { this[0] = x; this[1] = y; this[2] = z; return this; }
    copy(v) { this[0] = v[0]; this[1] = v[1]; this[2] = v[2]; return this; }

    applyMatrix4(m) {
        const x = this[0], y = this[1], z = this[2];
        const w = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);
        this[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) * w;
        this[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) * w;
        this[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) * w;
        return this;
    }

    dot(v) { return this[0] * v[0] + this[1] * v[1] + this[2] * v[2]; }
    distance() { return Math.hypot(this[0], this[1], this[2]); }
    multiply(s) { this[0] *= s; this[1] *= s; this[2] *= s; return this; }
    fromArray(a, o = 0) { this[0] = a[o]; this[1] = a[o + 1]; this[2] = a[o + 2]; return this; }
    squaredDistance(v) { const dx = this[0] - v[0], dy = this[1] - v[1], dz = this[2] - v[2]; return dx * dx + dy * dy + dz * dz; }
}