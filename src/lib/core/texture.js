let ID = 0;

export class Texture {
    constructor(gl, {
        image = null,
        target = gl.TEXTURE_2D,
        type = gl.UNSIGNED_BYTE,
        format = gl.RGBA,
        internalFormat = format,
        wrapS = gl.CLAMP_TO_EDGE,
        wrapT = gl.CLAMP_TO_EDGE,
        minFilter = gl.LINEAR,
        magFilter = gl.LINEAR,
        generateMipmaps = false,
        flipY = false,
    } = {}) {
        this.gl = gl;
        this.id = ID++;
        this.image = image;
        this.target = target;
        this.type = type;
        this.format = format;
        this.internalFormat = internalFormat;
        this.wrapS = wrapS;
        this.wrapT = wrapT;
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.generateMipmaps = generateMipmaps;
        this.flipY = flipY;
        this.texture = gl.createTexture();
    }

    update() {
        const gl = this.gl;
        gl.bindTexture(this.target, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        gl.texImage2D(this.target, 0, this.internalFormat, this.format, this.type, this.image);
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, this.magFilter);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, this.wrapT);
        if (this.generateMipmaps) gl.generateMipmap(this.target);
    }
}