import { Geometry } from '../core/geometry.js';
import { Transform } from '../core/transform.js';
import { Texture } from '../core/texture.js';
import { Mesh } from '../core/mesh.js';
import { Vec3 } from '../math/vec3.js';
import { quatToEuler } from '../math/vec3.js';

const TYPE_ARRAY = {
    5120: Int8Array, 5121: Uint8Array, 5122: Int16Array,
    5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array,
};
const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const ATTRIBUTES = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv' };

export class GLTFLoader {
    static async load(gl, src, program) {
        const dir = src.split('/').slice(0, -1).join('/') + '/';
        const desc = await this.parseDesc(src);
        return this.parse(gl, desc, dir, program);
    }

    static async parseDesc(src) {
        const res = await fetch(src);
        const data = await res.arrayBuffer();
        const textDecoder = new TextDecoder();
        if (textDecoder.decode(new Uint8Array(data, 0, 4)) === 'glTF') {
            return this.unpackGLB(data);
        }
        return JSON.parse(textDecoder.decode(data));
    }

    static unpackGLB(glb) {
        const header = new Uint32Array(glb, 0, 3);
        if (header[0] !== 0x46546c67) throw new Error('Invalid GLB');
        const jsonChunkHeader = new Uint32Array(glb, 12, 2);
        const jsonByteOffset = 20;
        const jsonText = new TextDecoder().decode(glb.slice(jsonByteOffset, jsonByteOffset + jsonChunkHeader[0]));
        const json = JSON.parse(jsonText);

        const binaryChunkHeader = new Uint32Array(glb, jsonByteOffset + jsonChunkHeader[0], 2);
        const binaryByteOffset = jsonByteOffset + jsonChunkHeader[0] + 8;
        const binary = glb.slice(binaryByteOffset, binaryByteOffset + binaryChunkHeader[0]);
        json.buffers[0].binary = binary;
        return json;
    }

    static async parse(gl, desc, dir, program) {
        const buffers = await this.loadBuffers(desc, dir);
        const bufferViews = this.parseBufferViews(gl, desc, buffers);
        const images = await this.parseImages(desc, dir, bufferViews);
        const textures = this.parseTextures(gl, desc, images);
        const materials = desc.materials || [];
        const meshes = this.parseMeshes(gl, desc, bufferViews, materials, program, textures);
        const nodes = this.parseNodes(desc, meshes);
        const scenes = desc.scenes || [];
        const sceneIndex = desc.scene !== undefined ? desc.scene : 0;
        const rootNodes = scenes[sceneIndex] ? scenes[sceneIndex].nodes.map(i => nodes[i]) : [];
        
        const root = new Transform();
        rootNodes.forEach(node => { if (node) root.addChild(node); });
        
        return { root, nodes, meshes, materials };
    }

    static loadBuffers(desc, dir) {
        return Promise.all((desc.buffers || []).map(buffer => {
            if (buffer.binary) return buffer.binary;
            const uri = dir + buffer.uri;
            return fetch(uri).then(res => res.arrayBuffer());
        }));
    }

    static parseBufferViews(gl, desc, buffers) {
        if (!desc.bufferViews) return null;
        return desc.bufferViews.map(({ buffer, byteOffset = 0, byteLength }) => {
            return buffers[buffer].slice(byteOffset, byteOffset + byteLength);
        });
    }

    static async parseImages(desc, dir, bufferViews) {
        if (!desc.images) return [];
        return Promise.all(desc.images.map(async ({ uri, bufferView: bv, mimeType }) => {
            const image = new Image();
            if (uri) {
                image.src = dir + uri;
            } else if (bv !== undefined) {
                const blob = new Blob([bufferViews[bv]], { type: mimeType });
                image.src = URL.createObjectURL(blob);
            }
            await new Promise(res => { image.onload = res; });
            return image;
        }));
    }

    static parseTextures(gl, desc, images) {
        if (!desc.textures) return [];
        return desc.textures.map(({ source }) => {
            if (source === undefined) return null;
            const tex = new Texture(gl, {
                image: images[source],
                wrapS: gl.REPEAT,
                wrapT: gl.REPEAT,
                minFilter: gl.LINEAR,
                magFilter: gl.LINEAR
            });
            tex.update();
            return tex;
        });
    }

    static parseAccessor(index, desc, bufferViews) {
        const accessor = desc.accessors[index];
        const bufferView = desc.bufferViews[accessor.bufferView];
        const bv = bufferViews[accessor.bufferView];
        const size = TYPE_SIZE[accessor.type];
        const TypeArray = TYPE_ARRAY[accessor.componentType];
        const byteOffset = accessor.byteOffset || 0;
        const count = accessor.count;
        const byteStride = bufferView.byteStride || 0;
        const elementBytes = TypeArray.BYTES_PER_ELEMENT;
        const componentStride = byteStride / elementBytes;
        const isInterleaved = !!byteStride && componentStride !== size;
    
        let data;
    
        if (isInterleaved) {
            const typedData = new TypeArray(bv, byteOffset);
            data = new TypeArray(count * size);
            for (let i = 0; i < count; i++) {
                const start = componentStride * i;
                const end = start + size;
                data.set(typedData.slice(start, end), i * size);
            }
        } else {
            data = new TypeArray(bv, byteOffset, count * size);
        }
    
        return { data, size, type: accessor.componentType, normalized: accessor.normalized || false, count: accessor.count };
    }
  
    static parseMeshes(gl, desc, bufferViews, materials, program, textures) {
        if (!desc.meshes) return [];
        return desc.meshes.map(mesh => {
            return mesh.primitives.map(prim => {
                const geometry = new Geometry(gl);
                
                for (const attr in prim.attributes) {
                    if (ATTRIBUTES[attr]) {
                        geometry.addAttribute(ATTRIBUTES[attr], this.parseAccessor(prim.attributes[attr], desc, bufferViews));
                    }
                }
                if (prim.indices !== undefined) {
                    geometry.addAttribute('index', this.parseAccessor(prim.indices, desc, bufferViews));
                }

                const meshObj = new Mesh(gl, { geometry, program });
                
                if (prim.material !== undefined) {
                    const mat = materials[prim.material];
                    if (mat && mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture) {
                        const texIndex = mat.pbrMetallicRoughness.baseColorTexture.index;
                        if (textures[texIndex]) {
                            // The engine currently uses a global texture. 
                            // If we want per-mesh textures, we'll need to pass this to the shader.
                            meshObj.texture = textures[texIndex]; 
                        }
                    }
                }
                return meshObj;
            });
        });
    }

    static parseNodes(desc, meshes) {
        if (!desc.nodes) return [];
        const nodes = desc.nodes.map(nodeDesc => {
            const node = new Transform();
            
            if (nodeDesc.name) node.name = nodeDesc.name;

            if (nodeDesc.matrix) {
                node.matrix.copy(nodeDesc.matrix);
                node.matrix.decompose(node.position, node.rotation, node.scale);
            } else {
                if (nodeDesc.translation) node.position.set(...nodeDesc.translation);
                if (nodeDesc.scale) node.scale.set(...nodeDesc.scale);
                if (nodeDesc.rotation) {
                    quatToEuler(nodeDesc.rotation, node.rotation);
                }
            }

            if (nodeDesc.mesh !== undefined) {
                meshes[nodeDesc.mesh].forEach(mesh => {
                    node.addChild(mesh);
                });
            }
            return node;
        });

        desc.nodes.forEach((nodeDesc, i) => {
            if (nodeDesc.children) {
                nodeDesc.children.forEach(childIndex => {
                    nodes[i].addChild(nodes[childIndex]);
                });
            }
        });

        return nodes;
    }
}
