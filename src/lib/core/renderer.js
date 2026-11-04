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

        const opaque = [];
        const transparent = [];

        scene.traverse((node) => {
            if (!node.visible || !node.draw) return;
            if (node.program.transparent) {
                transparent.push(node);
            } else {
                opaque.push(node);
            }
        });

        const camPos = camera.worldPosition;
        const tempVec = { x:0, y:0, z:0 }; 
        
        transparent.sort((a, b) => {
            a.worldMatrix.getTranslation(tempVec);
            const distA = (tempVec[0]-camPos[0])**2 + (tempVec[1]-camPos[1])**2 + (tempVec[2]-camPos[2])**2;
            
            b.worldMatrix.getTranslation(tempVec);
            const distB = (tempVec[0]-camPos[0])**2 + (tempVec[1]-camPos[1])**2 + (tempVec[2]-camPos[2])**2;
            
            return distB - distA;
        });

        gl.disable(gl.BLEND);
        gl.depthMask(true);
        for (const node of opaque) {
            node.draw({ camera });
        }

        if (transparent.length > 0) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);

            for (const node of transparent) {
                node.draw({ camera });
            }

            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }
    }
}