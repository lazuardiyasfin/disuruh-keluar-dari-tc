export class Euler extends Array {
    static get [Symbol.species]() { return Array; }

    constructor(x = 0, y = x, z = x) { super(x, y, z); }

    set(x, y, z) { this[0] = x; this[1] = y; this[2] = z; return this; }

    copy(e) { this[0] = e[0]; this[1] = e[1]; this[2] = e[2]; return this; }
}