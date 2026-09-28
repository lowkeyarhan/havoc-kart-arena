import * as T from "three";

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.cursor = 0;
    this.capacity = 1800;
    this.life = new Float32Array(this.capacity);
    this.duration = new Float32Array(this.capacity);
    this.velocity = new Float32Array(this.capacity * 3);
    this.gravity = new Float32Array(this.capacity);
    this.baseSize = new Float32Array(this.capacity);
    this.geometry = new T.BufferGeometry();
    for (const [name, count] of [
      ["position", 3],
      ["color", 3],
      ["size", 1],
      ["alpha", 1],
    ])
      this.geometry.setAttribute(
        name,
        new T.BufferAttribute(
          new Float32Array(this.capacity * count),
          count,
        ).setUsage(T.DynamicDrawUsage),
      );
    this.material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: { pixelRatio: { value: Math.min(devicePixelRatio, 1.5) } },
      vertexShader:
        "attribute float size; attribute float alpha; varying vec3 vColor; varying float vAlpha; uniform float pixelRatio; void main(){vColor=color;vAlpha=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*pixelRatio*300./max(1.,-mv.z),0.,100.);}",
      fragmentShader:
        "varying vec3 vColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,vAlpha*(1.-smoothstep(.15,1.,d)));\n#include <tonemapping_fragment>\n #include <colorspace_fragment>\n}",
    });
    this.points = new T.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.skids = new T.InstancedMesh(
      new T.PlaneGeometry(0.3, 0.8).rotateX(-Math.PI / 2),
      new T.MeshBasicMaterial({
        color: "#141815",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      768,
    );
    this.skids.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.skids.frustumCulled = false;
    this.skids.count = 0;
    this.skidIndex = 0;
    scene.add(this.skids);
    this.matrix = new T.Object3D();
  }
  emit(x, y, z, count = 1, type = "dust", spread = 1) {
    const attr = this.geometry.attributes,
      p = attr.position.array,
      c = attr.color.array;
    const colors = {
      dust: [0.52, 0.43, 0.3],
      snow: [0.8, 0.88, 0.94],
      smoke: [0.22, 0.24, 0.25],
      spark: [1, 0.55, 0.12],
      flame: [1, 0.3, 0.04],
      boost: [0.2, 0.65, 1],
      purple: [0.58, 0.36, 1],
    };
    for (let k = 0; k < count; k++) {
      const i = this.cursor++ % this.capacity,
        j = i * 3,
        hot = ["spark", "flame", "boost", "purple"].includes(type),
        shade = colors[type] || colors.dust;
      this.life[i] = this.duration[i] = hot
        ? 0.25 + Math.random() * 0.4
        : 0.6 + Math.random() * 0.8;
      p[j] = x + (Math.random() - 0.5) * spread;
      p[j + 1] = y + Math.random() * 0.3;
      p[j + 2] = z + (Math.random() - 0.5) * spread;
      this.velocity[j] = (Math.random() - 0.5) * spread * 4;
      this.velocity[j + 1] = hot ? Math.random() * 5 : 1.5 + Math.random();
      this.velocity[j + 2] = (Math.random() - 0.5) * spread * 4;
      this.gravity[i] = type === "spark" ? 10 : hot ? 1 : -0.2;
      this.baseSize[i] = type === "spark" ? 0.12 : hot ? 0.5 : 0.65;
      for (let n = 0; n < 3; n++)
        c[j + n] = shade[n] * (0.8 + Math.random() * 0.4);
    }
    attr.color.needsUpdate = true;
  }
  skid(x, y, z, angle) {
    const i = this.skidIndex++ % 768;
    this.matrix.position.set(x, y + 0.025, z);
    this.matrix.rotation.set(0, angle, 0);
    this.matrix.updateMatrix();
    this.skids.setMatrixAt(i, this.matrix.matrix);
    this.skids.count = Math.min(768, this.skidIndex);
    this.skids.instanceMatrix.needsUpdate = true;
  }
  clear() {
    this.life.fill(0);
    this.geometry.attributes.alpha.array.fill(0);
    this.geometry.attributes.alpha.needsUpdate = true;
    this.skids.count = 0;
    this.skidIndex = 0;
  }
  update(dt) {
    const a = this.geometry.attributes,
      p = a.position.array;
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) {
        a.alpha.array[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const j = i * 3,
        t = Math.max(0, this.life[i] / this.duration[i]);
      this.velocity[j + 1] -= this.gravity[i] * dt;
      p[j] += this.velocity[j] * dt;
      p[j + 1] += this.velocity[j + 1] * dt;
      p[j + 2] += this.velocity[j + 2] * dt;
      a.alpha.array[i] = t * 0.7;
      a.size.array[i] = this.baseSize[i] * (2 - t);
    }
    a.position.needsUpdate = a.alpha.needsUpdate = a.size.needsUpdate = true;
  }
}
