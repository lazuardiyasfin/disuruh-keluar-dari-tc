import { Transform } from "../lib/core/transform.js";
import { GLTFLoader } from "../lib/extra/gltfLoader.js";

export async function createChair(gl, program, glbUrl) {
    const root = new Transform();
    const gltf = await GLTFLoader.load(gl, glbUrl, program);
    root.addChild(gltf.root);

    let upperNode = null;
    let bottomNode = null;
    const wheels = [];

    gltf.nodes.forEach(node => {
        if (!node.name) return;
        const name = node.name.toLowerCase();
        
        if (name.includes('upper')) upperNode = node;
        if (name.includes('bottom')) bottomNode = node;
        if (name.includes('wheel')) wheels.push(node);
    });

    console.log("Found nodes:", { upper: upperNode?.name, bottom: bottomNode?.name, wheels: wheels.length });

    if (upperNode && bottomNode && bottomNode.parent === upperNode) {
        upperNode.removeChild(bottomNode);
        gltf.root.addChild(bottomNode);
    }

    return { root, wheels, upper: upperNode, bottom: bottomNode };
}
