export class Renderer {
    constructor({ canvas, width = 800, height = 600, antialias = true } = {}) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
        }
        this.gl = canvas.getContext('webgl2', { antialias });
        if (!this.gl) throw new Error('WebGL2 unavailable');
        this.gl.renderer = this;
        this.gl.enable(this.gl.DEPTH_TEST);

        this.state = { currentProgram: null };
        this.width = 0;
        this.height = 0;
        this.setSize(width, height);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        const gl = this.gl;
        gl.canvas.width = width;
        gl.canvas.height = height;
    }

    render({ scene, camera }) {
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.025, 0.04, 0.08, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        scene.updateMatrixWorld();
        if (camera) camera.updateMatrixWorld();

        scene.traverse((node) => {
            if (node.visible && node.draw) node.draw({ camera });
        });
    }
}