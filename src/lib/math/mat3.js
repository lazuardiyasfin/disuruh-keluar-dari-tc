export function normalFromMat4(m) {
    const a00 = m[0], a01 = m[1], a02 = m[2];
    const a10 = m[4], a11 = m[5], a12 = m[6];
    const a20 = m[8], a21 = m[9], a22 = m[10];

    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;

    if (Math.abs(det) < 0.000001) {
        return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }

    det = 1.0 / det;

    const inv00 = b01 * det;
    const inv01 = (-a22 * a01 + a02 * a21) * det;
    const inv02 = (a12 * a01 - a02 * a11) * det;
    const inv10 = b11 * det;
    const inv11 = (a22 * a00 - a02 * a20) * det;
    const inv12 = (-a12 * a00 + a02 * a10) * det;
    const inv20 = b21 * det;
    const inv21 = (-a21 * a00 + a01 * a20) * det;
    const inv22 = (a11 * a00 - a01 * a10) * det;

    // transpose(inverse)
    return new Float32Array([
        inv00, inv10, inv20,
        inv01, inv11, inv21,
        inv02, inv12, inv22
    ]);
}