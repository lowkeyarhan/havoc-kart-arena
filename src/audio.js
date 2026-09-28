import { clamp } from "../shared/game.js";

// Native Web Audio keeps engine pitch, tire slip and distance tied to the simulation.
export class GameAudio {
  constructor() {
    this.enabled = true;
    this.volume = 0.65;
    this.position = { x: 0, z: 0, angle: 0 };
    this.active = 0;
  }
  async start() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const c = (this.ctx = new AudioContext());
        this.master = c.createGain();
        this.master.gain.value = this.volume;
        const limiter = c.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.ratio.value = 5;
        this.master.connect(limiter);
        limiter.connect(c.destination);
        this.engineBus = c.createGain();
        this.engineBus.gain.value = 0;
        this.engineBus.connect(this.master);
        const real = new Float32Array(24),
          imag = new Float32Array(24);
        for (let i = 1; i < 24; i++) imag[i] = (i % 2 ? 1 : 0.35) / i;
        const wave = c.createPeriodicWave(real, imag);
        this.engine = [];
        for (const detune of [-8, 7]) {
          const o = c.createOscillator(),
            f = c.createBiquadFilter(),
            g = c.createGain();
          o.setPeriodicWave(wave);
          o.detune.value = detune;
          f.type = "lowpass";
          f.frequency.value = 600;
          g.gain.value = 0.12;
          o.connect(f);
          f.connect(g);
          g.connect(this.engineBus);
          o.start();
          this.engine.push({ o, f });
        }
        this.noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        let brown = 0;
        for (let i = 0; i < data.length; i++) {
          brown = (brown + (Math.random() * 2 - 1) * 0.07) / 1.03;
          data[i] = brown * 3;
        }
        this.tires = this.loopNoise("bandpass", 950, 0.6);
        this.wind = this.loopNoise("lowpass", 500, 0.3);
        this.ambience = this.loopNoise("lowpass", 900, 0.4);
      }
      await this.ctx.resume();
      this.setVolume(this.volume);
    } catch {
      /* Audio remains optional if the device cannot open an audio context. */
    }
  }
  loopNoise(type, freq, q) {
    const c = this.ctx,
      source = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    gain.gain.value = 0;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    return { source, filter, gain };
  }
  setVolume(value) {
    this.volume = clamp(Number(value) || 0, 0, 1);
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume : 0,
        this.ctx.currentTime,
        0.05,
      );
  }
  setEnabled(on) {
    this.enabled = on;
    this.setVolume(this.volume);
    if (on) this.start();
  }
  update(p, input, playing, map) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime,
      active = playing && p && p.dead <= 0 && this.enabled;
    if (p) this.position = p;
    const speed = active ? p.speed : 0,
      gear = 1 + Math.min(4, Math.floor(speed / 8)),
      rpm = active
        ? 45 + (speed % 8) * 8 + gear * 8 + Math.max(0, input.throttle) * 18
        : 40;
    this.engineBus.gain.setTargetAtTime(active ? 0.48 : 0, t, 0.08);
    for (const { o, f } of this.engine) {
      o.frequency.setTargetAtTime(rpm, t, 0.065);
      f.frequency.setTargetAtTime(
        280 + speed * 23 + (p?.boosting ? 500 : 0),
        t,
        0.09,
      );
    }
    this.tires.gain.gain.setTargetAtTime(
      active && p.grounded ? clamp((p.slip - 1) * 0.022, 0, 0.23) : 0,
      t,
      0.07,
    );
    this.tires.filter.frequency.setTargetAtTime(
      map === "alpine" ? 1600 : 850 + speed * 10,
      t,
      0.15,
    );
    this.wind.gain.gain.setTargetAtTime(
      active ? (speed / 44) * 0.08 : 0,
      t,
      0.2,
    );
    this.ambience.gain.gain.setTargetAtTime(
      playing ? (map === "harbor" ? 0.1 : 0.025) : 0,
      t,
      0.5,
    );
  }
  event(e, localId) {
    if (!this.ctx || !this.enabled || this.active > 48) return;
    const c = this.ctx,
      t = c.currentTime,
      dx = (e.x ?? this.position.x) - this.position.x,
      dz = (e.z ?? this.position.z) - this.position.z,
      d = Math.hypot(dx, dz);
    if (d > 90) return;
    const local = e.id === localId,
      attenuation = local ? 1 : 1 / (1 + (d * d) / 250);
    const bus = c.createGain(),
      pan = c.createStereoPanner();
    bus.gain.value = attenuation;
    pan.pan.value =
      clamp(
        (-dx * Math.cos(this.position.angle) +
          dz * Math.sin(this.position.angle)) /
          Math.max(d, 1),
        -1,
        1,
      ) * 0.8;
    bus.connect(pan);
    pan.connect(this.master);
    const tone = (freq, end, duration, volume, type = "sine", delay = 0) => {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t + delay);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(15, end),
        t + delay + duration,
      );
      g.gain.setValueAtTime(volume, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
      o.connect(g);
      g.connect(bus);
      o.start(t + delay);
      o.stop(t + delay + duration + 0.02);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    };
    const noise = (duration, volume, frequency = 1000) => {
      const s = c.createBufferSource(),
        f = c.createBiquadFilter(),
        g = c.createGain();
      s.buffer = this.noiseBuffer;
      f.type = "lowpass";
      f.frequency.setValueAtTime(frequency, t);
      f.frequency.exponentialRampToValueAtTime(80, t + duration);
      g.gain.setValueAtTime(volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      s.connect(f);
      f.connect(g);
      g.connect(bus);
      s.start(t, Math.random());
      s.stop(t + duration);
      s.onended = () => {
        s.disconnect();
        f.disconnect();
        g.disconnect();
      };
    };
    if (e.type === "fire") {
      if (e.weapon === "railgun") {
        tone(2100, 70, 0.35, 0.15, "sawtooth");
        noise(0.12, 0.2, 6000);
      } else if (e.weapon === "blaster") {
        noise(0.09, 0.5, 4800);
        tone(170, 45, 0.075, 0.2, "triangle");
      } else if (e.weapon === "shotgun") {
        noise(0.25, 0.85, 3500);
        tone(100, 25, 0.22, 0.4);
      } else if (e.weapon === "rocket" || e.weapon === "homing") {
        noise(0.42, 0.35, 2000);
        tone(180, 35, 0.3, 0.2, "sawtooth");
      } else if (e.weapon === "emp" || e.weapon === "shield") {
        tone(140, 1100, 0.5, 0.14);
        tone(280, 1800, 0.4, 0.07, "triangle");
      } else {
        noise(0.1, 0.25, 900);
        tone(350, 180, 0.12, 0.16, "triangle");
      }
    } else if (e.type === "explosion" && e.size > 0.5) {
      noise(0.9, 0.85, 1800);
      tone(65, 18, 0.65, 0.45);
    } else if (e.type === "hit") {
      noise(0.11, 0.22, 2000);
      tone(260, 70, 0.09, 0.12, "square");
    } else if (e.type === "pickup" || e.type === "repair") {
      for (let i = 0; i < 3; i++)
        tone(500 + i * 220, 620 + i * 220, 0.15, 0.1, "sine", i * 0.065);
    } else if (e.type === "collision" || e.type === "land") {
      noise(0.18, clamp((e.strength || 8) / 30, 0.08, 0.5), 700);
      tone(85, 30, 0.14, 0.12);
    } else if (e.type === "boost") {
      noise(0.4, 0.3, 3000);
      tone(100, 500, 0.3, 0.08, "sawtooth");
    } else if (e.type === "block") {
      tone(1200, 360, 0.16, 0.09, "triangle");
    } else if (e.type === "countdown") {
      tone(e.value === 0 ? 900 : 500, e.value === 0 ? 1000 : 500, 0.18, 0.14);
    }
    this.active++;
    setTimeout(() => {
      bus.disconnect();
      pan.disconnect();
      this.active--;
    }, 1300);
  }
}
