import { Mesh } from "./lib/core/mesh.js";
import { Renderer } from "./lib/core/renderer.js";
import { Texture } from "./lib/core/texture.js";
import { Transform } from "./lib/core/transform.js";
import { Camera } from "./lib/core/camera.js";
import { Program } from "./lib/core/program.js";
import { Box } from "./lib/extra/box.js";
import { Vec3 } from "./lib/math/vec3.js";

const degToRad = (deg) => (deg * Math.PI) / 180;

const renderer = new Renderer({
  canvas: document.getElementById("glCanvas"),
  width: innerWidth,
  height: innerHeight
});

function createCheckerImage(size = 64, cells = 8) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const cellSize = size / cells;

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const even = (x + y) % 2 === 0;
      ctx.fillStyle = even ? "#f8fafc" : "#0ea5e9";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  return canvas;
}

const texture = new Texture(renderer.gl, {
  image: createCheckerImage(),
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  minFilter: renderer.gl.LINEAR,
  magFilter: renderer.gl.LINEAR,
  generateMipmaps: true,
});
texture.update();

const vertexShaderSource = `#version 300 es

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform mat3 normalMatrix;
uniform float uvScale;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_texCoord;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  v_worldPosition = worldPosition.xyz;
  v_normal = normalMatrix * normal;
  v_texCoord = uv * uvScale;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_texCoord;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 cameraPosition;

uniform float ambientStrength;
uniform float shininess;

uniform sampler2D uTexture;

out vec4 outColor;

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(lightPosition - v_worldPosition);
  vec3 V = normalize(cameraPosition - v_worldPosition);

  float diff = max(dot(N, L), 0.0);

  vec3 R = reflect(-L, N);
  float spec = 0.0;
  if (diff > 0.0) {
    spec = pow(max(dot(R, V), 0.0), shininess);
  }

  vec3 texColor = texture(uTexture, v_texCoord).rgb;

  vec3 ambient  = ambientStrength * texColor;
  vec3 diffuse  = diff * lightColor * texColor;
  vec3 specular = spec * lightColor;

  outColor = vec4(ambient + diffuse + specular, 1.0);
}
`;

const program = new Program(renderer.gl, {
  vertex: vertexShaderSource,
  fragment: fragmentShaderSource,
  uniforms: {
    lightPosition: { value: new Vec3(2, 2, 2) },
    lightColor: { value: new Vec3(1, 1, 1) },
    ambientStrength: { value: 0.18 },
    shininess: { value: 32.0 },
    uvScale: { value: 1.0 },
    uTexture: { value: texture },
  },
});

const scene = new Transform();
const cube = new Mesh(renderer.gl, { geometry: new Box(renderer.gl), program });
cube.rotation.set(degToRad(20), degToRad(30), 0);
scene.addChild(cube);

const camera = new Camera(renderer.gl, {
  fov: 60, aspect: innerWidth / innerHeight, near: 0.1, far: 100,
});
camera.position.set(0, 1.4, 4);
camera.lookAt(new Vec3(0, 0, 0));

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = renderer.gl.canvas;
    const displayW = canvas.clientWidth; 
    const displayH = canvas.clientHeight;

    renderer.setSize(Math.round(displayW * dpr), Math.round(displayH * dpr));
    camera.perspective({ aspect: displayW / displayH });
}

window.addEventListener('resize', resize);
resize();

let last = 0;
function frame(t) {
  const dt = Math.min((t - last) * 0.001, 0.05);
  last = t;

  cube.rotation[0] += degToRad(20) * dt;
  cube.rotation[1] += degToRad(35) * dt;

  renderer.render({ scene, camera });

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);