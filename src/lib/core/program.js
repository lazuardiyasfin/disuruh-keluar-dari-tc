import { Texture } from './texture.js';

let ID = 0;

export class Program {
    constructor(gl, { vertex, fragment, uniforms = {} } = {}) {
        this.gl = gl;
        this.id = ID++;
        this.uniforms = uniforms;

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertex);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
            throw new Error('Vertex shader:\n' + gl.getShaderInfoLog(vs));

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragment);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
            throw new Error('Fragment shader:\n' + gl.getShaderInfoLog(fs));

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
            throw new Error('Link:\n' + gl.getProgramInfoLog(this.program));

        this.attributeLocations = new Map();
        const numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; i++) {
            const attr = gl.getActiveAttrib(this.program, i);
            this.attributeLocations.set(attr, gl.getAttribLocation(this.program, attr.name));
        }

        this.uniformLocations = new Map();
        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const u = gl.getActiveUniform(this.program, i);
            this.uniformLocations.set(u.name, {
                location: gl.getUniformLocation(this.program, u.name),
                type: u.type,
            });
        }
    }

    use() {
        const gl = this.gl;
        if (gl.renderer.state.currentProgram !== this) {
            gl.useProgram(this.program);
            gl.renderer.state.currentProgram = this;
        }

        let texUnit = 0;
        this.uniformLocations.forEach((u, name) => {
            const val = this.uniforms[name];
            if (!val) return;
            this.setUniform(u.location, u.type, val.value, texUnit);
            if (val.value instanceof Texture) texUnit++;
        });
    }

    setUniform(loc, type, v, texUnit = 0) {
        const gl = this.gl;

        if (v instanceof Texture) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(v.target, v.texture);
            gl.uniform1i(loc, texUnit);
            return;
        }

        if (typeof v === 'number') { gl.uniform1f(loc, v); return; }

        const n = v.length;
        if (n === 2) gl.uniform2fv(loc, v);
        else if (n === 3) gl.uniform3fv(loc, v);
        else if (n === 4) gl.uniform4fv(loc, v);
        else if (n === 9) gl.uniformMatrix3fv(loc, false, v);
        else if (n === 16) gl.uniformMatrix4fv(loc, false, v);
    }
}