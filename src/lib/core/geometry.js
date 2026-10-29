export class Geometry {
    constructor(gl, attributes = {}) {
        this.gl = gl;
        this.attributes = {};
        this.VAOs = {};
        this.drawRange = { start: 0, count: 0 };

        for (const key in attributes) this.addAttribute(key, attributes[key]);
    }

    addAttribute(key, attr) {
        const gl = this.gl;
        this.attributes[key] = attr;

        attr.size = attr.size || 1;
        attr.type = attr.type || (
            attr.data instanceof Uint16Array ? gl.UNSIGNED_SHORT :
            attr.data instanceof Uint32Array ? gl.UNSIGNED_INT :
            gl.FLOAT
        );
        attr.target = key === 'index' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
        attr.normalized = attr.normalized || false;
        attr.stride = attr.stride || 0;
        attr.offset = attr.offset || 0;
        attr.count = attr.count || (attr.stride ? attr.data.byteLength / attr.stride : attr.data.length / attr.size);
        attr.usage = attr.usage || gl.STATIC_DRAW;

        if (!attr.buffer) this.updateAttribute(attr);

        if (key === 'index') this.drawRange.count = attr.count;
        else if (!this.attributes.index) this.drawRange.count = Math.max(this.drawRange.count, attr.count);
    }

    updateAttribute(attr) {
        const gl = this.gl;
        const isNew = !attr.buffer;
        if (isNew) attr.buffer = gl.createBuffer();
        gl.bindBuffer(attr.target, attr.buffer);
        if (isNew) gl.bufferData(attr.target, attr.data, attr.usage);
        else gl.bufferSubData(attr.target, 0, attr.data);
    }

    createVAO(program) {
        const gl = this.gl;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        program.attributeLocations.forEach((loc, attr) => {
            const a = this.attributes[attr.name];
            if (!a) return;
            gl.bindBuffer(a.target, a.buffer);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, a.size, a.type, a.normalized, a.stride, a.offset);
        });
        if (this.attributes.index)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);
        gl.bindVertexArray(null);
        return vao;
    }

    draw({ program, mode = this.gl.TRIANGLES }) {
        const gl = this.gl;
        if (!this.VAOs[program.id]) this.VAOs[program.id] = this.createVAO(program);
        gl.bindVertexArray(this.VAOs[program.id]);
        if (this.attributes.index)
            gl.drawElements(mode, this.drawRange.count, this.attributes.index.type, 0);
        else
            gl.drawArrays(mode, 0, this.drawRange.count);
    }
}