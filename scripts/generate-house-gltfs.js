const fs = require('fs');
const path = require('path');

function createBoxGLTF(name, width, height, depth, colorHex) {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  // 24 vertices for a cube (6 faces * 4 vertices)
  const positions = new Float32Array([
    // Front face
    -hw, -hh,  hd,   hw, -hh,  hd,   hw,  hh,  hd,  -hw,  hh,  hd,
    // Back face
    -hw, -hh, -hd,  -hw,  hh, -hd,   hw,  hh, -hd,   hw, -hh, -hd,
    // Top face
    -hw,  hh, -hd,  -hw,  hh,  hd,   hw,  hh,  hd,   hw,  hh, -hd,
    // Bottom face
    -hw, -hh, -hd,   hw, -hh, -hd,   hw, -hh,  hd,  -hw, -hh,  hd,
    // Right face
     hw, -hh, -hd,   hw,  hh, -hd,   hw,  hh,  hd,   hw, -hh,  hd,
    // Left face
    -hw, -hh, -hd,  -hw, -hh,  hd,  -hw,  hh,  hd,  -hw,  hh, -hd,
  ]);

  const normals = new Float32Array([
    // Front
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Back
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    // Top
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Bottom
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
    // Right
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Left
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
  ]);

  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,       // Front
    4, 5, 6,  4, 6, 7,       // Back
    8, 9, 10,  8, 10, 11,    // Top
    12, 13, 14,  12, 14, 15, // Bottom
    16, 17, 18,  16, 18, 19, // Right
    20, 21, 22,  20, 22, 23  // Left
  ]);

  // Combine into single buffer
  const posBytes = Buffer.from(positions.buffer);
  const normBytes = Buffer.from(normals.buffer);
  const indBytes = Buffer.from(indices.buffer);

  const totalBuffer = Buffer.concat([posBytes, normBytes, indBytes]);
  const base64Uri = `data:application/octet-stream;base64,${totalBuffer.toString('base64')}`;

  const r = ((colorHex >> 16) & 255) / 255;
  const g = ((colorHex >> 8) & 255) / 255;
  const b = (colorHex & 255) / 255;

  const gltf = {
    asset: {
      version: "2.0",
      generator: "SovereignLands-GLTF-Builder"
    },
    scene: 0,
    scenes: [
      {
        name: name,
        nodes: [0]
      }
    ],
    nodes: [
      {
        name: `${name}_node`,
        mesh: 0
      }
    ],
    meshes: [
      {
        name: `${name}_mesh`,
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1
            },
            indices: 2,
            material: 0
          }
        ]
      }
    ],
    materials: [
      {
        name: `${name}_mat`,
        pbrMetallicRoughness: {
          baseColorFactor: [r, g, b, 1.0],
          metallicFactor: 0.1,
          roughnessFactor: 0.8
        }
      }
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        max: [hw, hh, hd],
        min: [-hw, -hh, -hd]
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: 24,
        type: "VEC3",
        max: [1, 1, 1],
        min: [-1, -1, -1]
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5123,
        count: 36,
        type: "SCALAR",
        max: [23],
        min: [0]
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: posBytes.length,
        target: 34962
      },
      {
        buffer: 0,
        byteOffset: posBytes.length,
        byteLength: normBytes.length,
        target: 34962
      },
      {
        buffer: 0,
        byteOffset: posBytes.length + normBytes.length,
        byteLength: indBytes.length,
        target: 34963
      }
    ],
    buffers: [
      {
        byteLength: totalBuffer.length,
        uri: base64Uri
      }
    ]
  };

  return gltf;
}

const modelsDir = path.join(__dirname, '..', 'frontend', 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const assets = [
  { name: 'HouseThatched', file: 'house_thatched.gltf', w: 8, h: 5.5, d: 8, color: 0xd4a373 },
  { name: 'HouseTimber', file: 'house_timber.gltf', w: 9, h: 8, d: 9, color: 0xb45309 },
  { name: 'HouseStone', file: 'house_stone.gltf', w: 12, h: 9, d: 11, color: 0x64748b },
  { name: 'HouseWizard', file: 'house_wizard.gltf', w: 8, h: 14, d: 8, color: 0x4338ca },
  { name: 'HouseCabin', file: 'house_cabin.gltf', w: 7, h: 4.8, d: 7, color: 0x78350f },
  { name: 'Fountain', file: 'fountain.gltf', w: 6, h: 3.8, d: 6, color: 0x38bdf8 },
  { name: 'ParkBench', file: 'park_bench.gltf', w: 2.2, h: 1.2, d: 1.0, color: 0x5d4037 },
];

for (const a of assets) {
  const gltf = createBoxGLTF(a.name, a.w, a.h, a.d, a.color);
  const outPath = path.join(modelsDir, a.file);
  fs.writeFileSync(outPath, JSON.stringify(gltf, null, 2));
  console.log(`Generated GLTF model: ${a.file}`);
}
console.log('All GLTF assets generated successfully.');
