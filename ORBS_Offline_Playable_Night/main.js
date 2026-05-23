"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const TABLE_W = 800;
const TABLE_X = (W - TABLE_W) / 2;
const WORLD_H = 4800;
const BALL_R = 15;
const SAVE_LEVELS = new Set([2, 4, 6]);

const ASSETS = {
  backgrounds: [
    "assets/agora-hall.jpeg",
    "assets/agora-pillars.jpeg",
    "assets/agora-arch.jpeg",
    "assets/agora-stars.jpeg",
    "assets/agora-pillars.jpeg",
    "assets/agora-hall.jpeg",
  ],
  orb: "assets/orb-sheet.webp",
  ballSprite: "assets/bulga-sphere-pedestal-raw.jpeg",
  boss: "assets/boss-sheet.webp",
  statue: "assets/statue-bg.webp",
  monsters: "assets/patrol-monsters-v2.png",
  pinballMap: "assets/pinball-wolf-map.jpeg",
  ledgeBg: "assets/wolf-pinball-table-map.jpeg",
  werewolfBoss: "assets/werewolf-boss.png",
  neonWerewolf: "assets/neon-werewolf-raw.png",
  menuMusic: "assets/blue-hill-zone-act-2.wav",
  gameMusic: "assets/emerald-world-zone.wav",
  gameMusicAlt: "assets/emerald-world-zone-alt.mp3",
};

const IMAGES = {};
Object.entries(ASSETS).forEach(([key, value]) => {
  if (Array.isArray(value)) {
    IMAGES[key] = value.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  } else {
    IMAGES[key] = new Image();
    IMAGES[key].src = value;
  }
});

const LEVELS = [
  {
    name: "Bulga Rise",
    age: "Moonlit Wolf Ruins",
    palette: { bg: "#15101a", stone: "#b99057", glow: "#ffd671", accent: "#63d6c7", danger: "#d64639" },
    boss: "The Azure Fenrir",
    quote: "Every rebound is a promise to climb again.",
  },
  { name: "The Catacombs", age: "Medieval Dark Ages", boss: "The Plague Bishop" },
  { name: "The Alchemist's Tower", age: "Renaissance", boss: "The Alchemist" },
  { name: "The Steam Engine", age: "Industrial Revolution", boss: "The Iron Foreman" },
  { name: "The Switchboard", age: "Early 20th Century", boss: "The Signal Ghost" },
  { name: "The Colosseum", age: "Cold War / Space Race", boss: "Cosmonaut Zero" },
  { name: "The Grid", age: "Digital Age", boss: "The Corrupted AI" },
  { name: "The Void", age: "Post-Human / Cosmic", boss: "The Architect" },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => min + Math.random() * (max - min);
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
const pointSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return { x: x1 + dx * t, y: y1 + dy * t, t };
};
const drawCover = (ctx, img, dx, dy, dw, dh, alpha = 1) => {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
  return true;
};

const CUTOUTS = {};
const getCutoutSprite = (key, img, threshold = 18) => {
  if (!img || !img.complete || !img.naturalWidth) return null;
  if (CUTOUTS[key]) return CUTOUTS[key];
  try {
    const source = document.createElement("canvas");
    source.width = img.naturalWidth;
    source.height = img.naturalHeight;
    const s = source.getContext("2d", { willReadFrequently: true });
    s.drawImage(img, 0, 0);
    const data = s.getImageData(0, 0, source.width, source.height);
    const w = source.width;
    const h = source.height;
    const pixels = data.data;
    const seen = new Uint8Array(w * h);
    const queue = [];
    const isBg = (idx) => pixels[idx] < threshold && pixels[idx + 1] < threshold && pixels[idx + 2] < threshold;
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (seen[p] || !isBg(p * 4)) return;
      seen[p] = 1;
      queue.push(p);
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    while (queue.length) {
      const p = queue.pop();
      const x = p % w;
      const y = Math.floor(p / w);
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < seen.length; i++) {
      if (seen[i]) pixels[i * 4 + 3] = 0;
      if (pixels[i * 4 + 3] > 0) {
        const x = i % w;
        const y = Math.floor(i / w);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    s.putImageData(data, 0, 0);
    const pad = 10;
    minX = clamp(minX - pad, 0, w - 1);
    minY = clamp(minY - pad, 0, h - 1);
    maxX = clamp(maxX + pad, 0, w - 1);
    maxY = clamp(maxY + pad, 0, h - 1);
    const out = document.createElement("canvas");
    out.width = Math.max(1, maxX - minX + 1);
    out.height = Math.max(1, maxY - minY + 1);
    out.getContext("2d").drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    CUTOUTS[key] = out;
    return out;
  } catch (error) {
    CUTOUTS[key] = img;
    return img;
  }
};

const getMonsterFrame = (sprite, img) => {
  const key = `monster-${sprite}`;
  if (!img || !img.complete || !img.naturalWidth) return null;
  if (CUTOUTS[key]) return CUTOUTS[key];
  try {
    const sx = sprite % 3 === 0 ? 0 : sprite % 3 === 1 ? 341 : 682;
    const sy = sprite < 3 ? 0 : sprite < 6 ? 341 : 682;
    const sw = Math.min(342, img.naturalWidth - sx);
    const sh = Math.min(342, img.naturalHeight - sy);
    const source = document.createElement("canvas");
    source.width = sw;
    source.height = sh;
    const s = source.getContext("2d", { willReadFrequently: true });
    s.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const data = s.getImageData(0, 0, sw, sh);
    const p = data.data;
    const bg = { r: p[0], g: p[1], b: p[2] };
    let minX = sw;
    let minY = sh;
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < p.length; i += 4) {
      const dr = Math.abs(p[i] - bg.r);
      const dg = Math.abs(p[i + 1] - bg.g);
      const db = Math.abs(p[i + 2] - bg.b);
      if (dr + dg + db < 58 || p[i + 3] < 12) {
        p[i + 3] = 0;
      } else {
        const n = i / 4;
        const x = n % sw;
        const y = Math.floor(n / sw);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    s.putImageData(data, 0, 0);
    const pad = 4;
    minX = clamp(minX - pad, 0, sw - 1);
    minY = clamp(minY - pad, 0, sh - 1);
    maxX = clamp(maxX + pad, 0, sw - 1);
    maxY = clamp(maxY + pad, 0, sh - 1);
    const out = document.createElement("canvas");
    out.width = Math.max(1, maxX - minX + 1);
    out.height = Math.max(1, maxY - minY + 1);
    out.getContext("2d").drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    CUTOUTS[key] = out;
    return out;
  } catch (error) {
    return null;
  }
};

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.46;
    this.sfxBoost = 1.65;
    this.master = null;
    this.tracks = {
      menu: new Audio(ASSETS.menuMusic),
      gameA: new Audio(ASSETS.gameMusic),
      gameB: new Audio(ASSETS.gameMusicAlt),
    };
    Object.values(this.tracks).forEach((track) => {
      track.loop = true;
      track.preload = "auto";
      track.volume = this.volume * 0.46;
    });
    this.currentTrack = "menu";
    this.stageTrack = "gameA";
    this.stageTrackToggle = 0;
    this.started = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.startMusic();
  }

  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.value = value;
    Object.values(this.tracks).forEach((track) => {
      track.volume = value * 0.46;
    });
  }

  startMusic() {
    if (this.started || this.volume <= 0) return;
    this.started = true;
    this.tracks[this.currentTrack].play().catch(() => {
      this.started = false;
    });
  }

  chooseStageTrack() {
    this.stageTrackToggle = (this.stageTrackToggle + 1) % 2;
    this.stageTrack = this.stageTrackToggle === 0 ? "gameA" : "gameB";
    if (this.currentTrack !== "menu") this.setMusic(this.stageTrack);
  }

  setMusic(trackName) {
    if (trackName === "game") trackName = this.stageTrack;
    if (!this.tracks[trackName] || this.currentTrack === trackName) return;
    const oldTrack = this.tracks[this.currentTrack];
    const newTrack = this.tracks[trackName];
    oldTrack.pause();
    oldTrack.currentTime = 0;
    this.currentTrack = trackName;
    newTrack.volume = this.volume * 0.5;
    if (this.started && this.volume > 0) newTrack.play().catch(() => {});
  }

  tone(freq, duration = 0.08, type = "square", gain = 0.5) {
    if (!this.ctx || this.volume <= 0) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(Math.min(0.95, gain * this.sfxBoost), this.ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(amp).connect(this.master || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  noise(duration = 0.06, gain = 0.08, filterFreq = 900) {
    if (!this.ctx || this.volume <= 0) return;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 2.8;
    amp.gain.setValueAtTime(Math.min(0.75, gain * this.sfxBoost), this.ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(filter).connect(amp).connect(this.master || this.ctx.destination);
    source.start();
  }

  sfx(name) {
    if (name === "menu") {
      this.tone(330, 0.035, "square", 0.26);
      setTimeout(() => this.tone(660, 0.04, "square", 0.18), 18);
      this.noise(0.018, 0.035, 2100);
      return;
    }
    if (name === "select") {
      this.tone(392, 0.055, "square", 0.3);
      setTimeout(() => this.tone(784, 0.06, "square", 0.24), 30);
      setTimeout(() => this.tone(1175, 0.07, "square", 0.18), 62);
      this.noise(0.035, 0.06, 2600);
      return;
    }
    if (name === "launch") {
      this.tone(196, 0.055, "square", 0.22);
      setTimeout(() => this.tone(392, 0.07, "square", 0.16), 22);
      this.noise(0.035, 0.04, 1200);
      return;
    }
    if (name === "charge") {
      this.tone(96, 0.06, "square", 0.09);
      return;
    }
    if (name === "plunger") {
      this.tone(120, 0.05, "square", 0.22);
      setTimeout(() => this.tone(420, 0.08, "square", 0.24), 28);
      this.noise(0.045, 0.055, 1400);
      return;
    }
    if (name === "destroy") {
      [196, 392, 784, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 0.075, "square", 0.28), i * 32));
      this.noise(0.14, 0.16, 2200);
      this.noise(0.08, 0.1, 520);
      return;
    }
    if (name === "shoot") {
      this.tone(620, 0.04, "square", 0.18);
      setTimeout(() => this.tone(930, 0.05, "square", 0.12), 18);
      return;
    }
    if (name === "jump") {
      this.tone(392, 0.045, "square", 0.2);
      setTimeout(() => this.tone(784, 0.07, "square", 0.16), 24);
      this.noise(0.035, 0.035, 1800);
      return;
    }
    if (name === "heal") {
      [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.055, "square", 0.15), i * 36));
      return;
    }
    if (name === "wall") {
      this.tone(150, 0.04, "square", 0.12);
      this.noise(0.025, 0.035, 720);
      return;
    }
    if (name === "bumper") {
      this.tone(262, 0.045, "square", 0.18);
      setTimeout(() => this.tone(524, 0.055, "square", 0.13), 35);
      return;
    }
    if (name === "hurt") {
      this.tone(82, 0.16, "square", 0.25);
      this.noise(0.12, 0.1, 260);
      return;
    }
    if (name === "drain") {
      [196, 147, 98].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, "square", 0.2), i * 90));
      return;
    }
    const map = {
      boss: [330, 0.12, "square", 0.2],
      save: [520, 0.25, "square", 0.22],
      exit: [760, 0.22, "square", 0.24],
      flipper: [286, 0.045, "square", 0.18],
    };
    this.tone(...(map[name] || map.wall));
  }

  update(dt, mode = "menu") {
    this.setMusic(mode);
    const track = this.tracks[this.currentTrack];
    if (this.started && track.paused && this.volume > 0) track.play().catch(() => {});
  }
}

class Particle {
  constructor(x, y, color, count = 1) {
    this.bits = [];
    for (let i = 0; i < count; i++) {
      this.bits.push({ x, y, vx: rand(-160, 160), vy: rand(-180, 80), life: rand(0.25, 0.65), color, size: rand(2, 5) });
    }
  }

  update(dt) {
    this.bits.forEach((b) => {
      b.life -= dt;
      b.vy += 420 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    this.bits = this.bits.filter((b) => b.life > 0);
  }

  draw(ctx, cameraY) {
    this.bits.forEach((b) => {
      ctx.globalAlpha = clamp(b.life * 2, 0, 1);
      ctx.fillStyle = b.color;
      ctx.fillRect(Math.round(b.x), Math.round(b.y - cameraY), b.size, b.size);
    });
    ctx.globalAlpha = 1;
  }
}

class Ball {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset(y = WORLD_H - 132) {
    this.x = TABLE_X + TABLE_W - 70;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.launched = false;
    this.spin = 0;
    this.hp = 5;
    this.invuln = 1;
    this.combo = 1;
    this.wallBounces = 0;
    this.wallBounceTimer = 0;
    this.shots = 2;
    this.jumpCharges = 2;
    this.jumpBuffer = 0;
    this.coyote = 0.12;
    this.attackTimer = 0;
    this.floatTimer = 0;
    this.jumpLock = 0;
  }

  nudge() {
    this.vx += rand(-28, 28);
    this.game.addParticles(this.x, this.y, "#bffff4", 8);
  }

  launch(power) {
    const p = clamp(power, 0.12, 1);
    this.launched = true;
    this.vx += rand(-32, 32) - 62 * p;
    this.vy = -820 - p * 880;
    this.spin += rand(-3, 3);
    this.shots = 2;
    this.game.addParticles(this.x, this.y + BALL_R, "#ffd078", Math.floor(14 + p * 24));
  }

  refillShots() {
    this.shots = 2;
    this.jumpCharges = 2;
    this.coyote = 0.16;
    this.floatTimer = Math.max(this.floatTimer, 0.12);
  }

  bufferJump() {
    this.jumpBuffer = 0.16;
  }

  tryJump(mode = "pulse") {
    if (this.jumpLock > 0 || (this.jumpCharges <= 0 && this.coyote <= 0)) return false;
    const groundedJump = this.coyote > 0;
    const airUse = groundedJump ? 0 : 1;
    this.jumpCharges = Math.max(0, this.jumpCharges - airUse);
    this.attackTimer = 0.26;
    this.floatTimer = groundedJump ? 0.34 : 0.18;
    this.jumpLock = 0.14;
    if (mode === "slam") {
      this.vy = 760;
      this.vx *= 0.9;
      this.game.addParticles(this.x, this.y, "#ffd078", 18);
    } else if (mode === "side") {
      const dir = this.game.aim.x || Math.sign(this.vx) || 1;
      this.vx += dir * (groundedJump ? 430 : 240);
      this.vy = Math.min(this.vy, groundedJump ? -420 : -285);
      this.game.addParticles(this.x, this.y, "#9ff7ff", 16);
    } else {
      this.vy = Math.min(this.vy, groundedJump ? -620 : -340);
      this.vx += this.game.aim.x * (groundedJump ? 150 : 85);
      this.game.addParticles(this.x, this.y, "#c77dff", 16);
    }
    this.game.audio.sfx("jump");
    return true;
  }

  heal(amount = 1) {
    const before = this.hp;
    this.hp = clamp(this.hp + amount, 0, 5);
    if (this.hp > before) {
      this.game.audio.sfx("heal");
      this.game.addParticles(this.x, this.y, "#c77dff", 22);
      this.game.addParticles(this.x, this.y, "#72fff0", 10);
    }
  }

  damage(amount) {
    if (this.invuln > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 1.1;
    this.combo = 1;
    this.game.audio.sfx("hurt");
    this.game.shake = 14;
    this.game.addParticles(this.x, this.y, "#ff4747", 18);
    if (this.hp <= 0) this.game.restartLevel("The orb breaks.");
  }

  update(dt, level) {
    if (!this.launched && this.game.state === "playing") {
      this.x = TABLE_X + TABLE_W - 70;
      this.y = WORLD_H - 132;
      this.vx = 0;
      this.vy = 0;
      this.invuln = Math.max(0, this.invuln - dt);
      return;
    }
    const climb = 1 - this.y / WORLD_H;
    const speedMod = (this.game.settings.speed === "slow" ? 0.9 : this.game.settings.speed === "fast" ? 1.16 : 1) + climb * 0.18 + this.game.newGamePlus * 0.12;
    this.invuln = Math.max(0, this.invuln - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.floatTimer = Math.max(0, this.floatTimer - dt);
    this.jumpLock = Math.max(0, this.jumpLock - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.wallBounceTimer = Math.max(0, this.wallBounceTimer - dt);
    if (this.wallBounceTimer <= 0) this.wallBounces = 0;
    const floating = this.floatTimer > 0 && this.vy > -80 && this.vy < 420;
    this.vy += (floating ? 135 : 320) * speedMod * dt;
    const steer = (this.game.rightPressed ? 1 : 0) - (this.game.leftPressed ? 1 : 0);
    if (steer) {
      this.vx += steer * 170 * dt;
      this.aim.x = steer * 0.65;
      this.aim.y = -0.76;
    }
    this.vx += this.spin * 10 * dt;
    this.vx *= 0.998;
    this.vy *= floating ? 0.992 : 0.999;
    if (floating && this.vy > 235) this.vy = 235;
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = 1380;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
    this.spin *= 0.995;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < TABLE_X + BALL_R) {
      this.x = TABLE_X + BALL_R;
      this.wallRebound(1, 0);
      this.refillShots();
      this.spin += 2.5;
      this.game.audio.sfx("wall");
    }
    if (this.x > TABLE_X + TABLE_W - BALL_R) {
      this.x = TABLE_X + TABLE_W - BALL_R;
      this.wallRebound(-1, 0);
      this.refillShots();
      this.spin -= 2.5;
      this.game.audio.sfx("wall");
    }
    if (this.y < BALL_R + 50) {
      this.y = BALL_R + 50;
      this.vy = Math.abs(this.vy) * 0.84;
    }
    if (this.y > WORLD_H + 40) this.game.loseLife();

    level.resolveGeometry(this);
    if (Math.hypot(this.vx, this.vy) < 16) {
      this.vx += rand(-24, 24);
      this.vy -= 18;
    }
    if (this.jumpBuffer > 0 && this.tryJump("pulse")) this.jumpBuffer = 0;
  }

  wallRebound(nx, ny) {
    const incoming = Math.max(180, Math.abs(this.vx * nx + this.vy * ny));
    const allowed = this.wallBounces < 4;
    const boost = allowed ? clamp(incoming / 520, 0.55, 1.35) : 0.42;
    if (nx) {
      this.vx = Math.sign(nx) * incoming * (0.82 + boost * 0.2);
      this.vy -= 145 * boost;
    } else {
      const dot = this.vx * nx + this.vy * ny;
      this.vx -= 1.72 * dot * nx;
      this.vy -= 1.72 * dot * ny;
      this.vx *= 0.985;
      this.vy *= 0.985;
    }
    if (allowed) {
      this.wallBounces += 1;
      this.wallBounceTimer = 0.85;
      this.game.addParticles(this.x, this.y, "#9ff7ff", Math.floor(5 + boost * 6));
    }
  }

  draw(ctx, cameraY) {
    const sy = Math.round(this.y - cameraY);
    ctx.save();
    ctx.translate(Math.round(this.x), sy);
    if (this.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0) ctx.globalAlpha = 0.55;
    const sprite = IMAGES.ballSprite;
    if (sprite.complete && sprite.naturalWidth) {
      const drawR = BALL_R + 5;
      const crop = {
        x: sprite.naturalWidth * 0.23,
        y: sprite.naturalHeight * 0.08,
        w: sprite.naturalWidth * 0.54,
        h: sprite.naturalHeight * 0.54,
      };
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, drawR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(sprite, crop.x, crop.y, crop.w, crop.h, -drawR, -drawR, drawR * 2, drawR * 2);
      ctx.restore();
      ctx.globalAlpha *= 0.34;
      ctx.strokeStyle = "#05070d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, drawR - 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = this.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0 ? 0.55 : 1;
      if (this.floatTimer > 0) {
        ctx.globalAlpha = 0.48;
        ctx.fillStyle = "#9ff7ff";
        ctx.fillRect(-BALL_R, BALL_R + 4, BALL_R * 2, 3);
        ctx.fillStyle = "#c77dff";
        ctx.fillRect(-BALL_R + 5, BALL_R + 9, BALL_R * 2 - 10, 3);
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.fillStyle = "#b9c1c6";
      ctx.beginPath();
      ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd153";
      ctx.fillRect(-5, -8, 5, 5);
    }
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#fff1a6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_R + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class Bumper {
  constructor(x, y, r, label, color = "#d4a45f") {
    this.x = x;
    this.y = y;
    this.r = r;
    this.label = label;
    this.color = color;
    this.cooldown = 0;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  collide(ball, game) {
    const d = dist(ball.x, ball.y, this.x, this.y);
    if (d > this.r + BALL_R) return;
    const nx = (ball.x - this.x) / (d || 1);
    const ny = (ball.y - this.y) / (d || 1);
    const overlap = this.r + BALL_R - d;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    const power = 520 + game.newGamePlus * 80;
    ball.vx = nx * power + ball.vx * 0.28;
    ball.vy = ny * power + ball.vy * 0.28;
    ball.spin += nx * 7;
    if (this.cooldown <= 0) {
      this.cooldown = 0.12;
      ball.combo = Math.min(9, ball.combo + 0.2);
      game.score += Math.floor(100 * ball.combo);
      game.audio.sfx("bumper");
      game.addParticles(this.x, this.y, "#ffe082", 14);
      game.shake = Math.max(game.shake, 5);
    }
  }

  draw(ctx, cameraY) {
    const pulse = this.cooldown > 0 ? 1.18 : 1;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y - cameraY));
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "#44251f";
    ctx.fillRect(-this.r, -this.r, this.r * 2, this.r * 2);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2e1d18";
    ctx.fillRect(-this.r * 0.45, -2, this.r * 0.9, 4);
    ctx.fillRect(-4, -this.r * 0.42, 8, 5);
    ctx.restore();
  }
}

class FlipperArt {
  static get() {
    if (!this.sprite) this.sprite = this.buildSprite();
    return this.sprite;
  }

  static buildSprite() {
    const sprite = document.createElement("canvas");
    sprite.width = 176;
    sprite.height = 28;
    const s = sprite.getContext("2d");
    s.imageSmoothingEnabled = false;
    const body = new Path2D();
    body.moveTo(8, 7);
    body.quadraticCurveTo(34, 0, 152, 3);
    body.quadraticCurveTo(174, 5, 174, 14);
    body.quadraticCurveTo(174, 24, 152, 25);
    body.quadraticCurveTo(34, 28, 8, 21);
    body.quadraticCurveTo(0, 14, 8, 7);
    body.closePath();
    const metal = s.createLinearGradient(0, 0, 0, sprite.height);
    metal.addColorStop(0, "#f0fbff");
    metal.addColorStop(0.38, "#58646d");
    metal.addColorStop(0.62, "#d5e3df");
    metal.addColorStop(1, "#12171c");
    s.fillStyle = metal;
    s.fill(body);
    s.lineWidth = 4;
    s.strokeStyle = "#c9964e";
    s.stroke(body);
    s.lineWidth = 2;
    s.strokeStyle = "#05080a";
    s.stroke(body);
    s.fillStyle = "#73fff0";
    s.fillRect(44, 11, 22, 3);
    s.fillRect(86, 13, 28, 3);
    s.fillStyle = "#fff4b8";
    s.fillRect(26, 5, 22, 3);
    s.fillRect(126, 7, 18, 3);
    return sprite;
  }
}

class Flipper {
  constructor(side, x, y, length = 96) {
    this.side = side;
    this.x = x;
    this.y = y;
    this.length = length;
    this.rest = side === "left" ? 0.32 : Math.PI - 0.32;
    this.up = side === "left" ? -0.74 : Math.PI + 0.74;
    this.angle = this.rest;
    this.prevAngle = this.angle;
    this.active = false;
    this.cooldown = 0;
    this.angularVelocity = 0;
    this.flash = 0;
    this.strikeReady = false;
    this.hitLock = 0;
  }

  setActive(active) {
    if (active && !this.active) {
      this.cooldown = 0.1;
      this.flash = 0.18;
      this.strikeReady = true;
    }
    if (!active) this.strikeReady = false;
    this.active = active;
  }

  tip() {
    return {
      x: this.x + Math.cos(this.angle) * this.length,
      y: this.y + Math.sin(this.angle) * this.length,
    };
  }

  update(dt) {
    this.prevAngle = this.angle;
    const target = this.active ? this.up : this.rest;
    const speed = this.active ? 18 : 10;
    this.angle += (target - this.angle) * clamp(speed * dt, 0, 1);
    this.angularVelocity = (this.angle - this.prevAngle) / Math.max(dt, 0.001);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.hitLock = Math.max(0, this.hitLock - dt);
    this.flash = Math.max(0, this.flash - dt);
  }

  collide(ball, game) {
    const tip = this.tip();
    const p = pointSegment(ball.x, ball.y, this.x, this.y, tip.x, tip.y);
    const d = dist(ball.x, ball.y, p.x, p.y);
    if (d > BALL_R + 9) return;
    const nx = (ball.x - p.x) / (d || 1);
    const ny = (ball.y - p.y) / (d || 1);
    ball.x += nx * (BALL_R + 9 - d);
    ball.y += ny * (BALL_R + 9 - d);
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      ball.vx -= 1.65 * dot * nx;
      ball.vy -= 1.65 * dot * ny;
    }
    if (this.strikeReady && this.hitLock <= 0) {
      const lift = this.side === "left" ? 1 : -1;
      const strength = 760 + (1 - p.t) * 190 + game.newGamePlus * 45;
      ball.vx += lift * (210 + p.t * 190);
      ball.vy -= strength;
      ball.spin += lift * 9;
      ball.refillShots();
      this.cooldown = 0;
      this.hitLock = 0.2;
      this.strikeReady = false;
      this.flash = 0.16;
      game.audio.sfx("flipper");
      game.shake = Math.max(game.shake, 5);
      game.addParticles(p.x, p.y, "#ffd078", 10);
      game.addParticles(p.x, p.y, "#72fff0", 5);
    }
  }

  draw(ctx, cameraY) {
    const sprite = FlipperArt.get();
    const drawW = this.length + 24;
    const drawH = 23;
    const speed = Math.abs(this.angularVelocity);
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y - cameraY));
    ctx.rotate(this.angle);
    ctx.imageSmoothingEnabled = false;
    if (speed > 3) {
      const smear = Math.min(3, Math.floor(speed / 4));
      for (let i = smear; i > 0; i--) {
        ctx.globalAlpha = 0.12 / i;
        ctx.drawImage(sprite, -3 - i * 4, -drawH / 2 - i, drawW, drawH + i * 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.shadowColor = this.active ? "#72fff0" : "rgba(0,0,0,0)";
    ctx.shadowBlur = this.active ? 8 : 0;
    ctx.drawImage(sprite, -8, -drawH / 2, drawW, drawH);
    if (this.flash > 0) {
      ctx.globalAlpha = clamp(this.flash * 5, 0, 0.7);
      const shineX = 18 + (1 - this.flash / 0.18) * drawW * 0.7;
      ctx.fillStyle = "#f9ffff";
      ctx.fillRect(shineX, -drawH / 2 + 2, 16, 4);
      ctx.fillStyle = "#72fff0";
      ctx.fillRect(shineX + 7, -2, 34, 3);
      ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#11161b";
    ctx.fillRect(-13, -13, 25, 25);
    ctx.fillStyle = "#c79755";
    ctx.fillRect(-9, -9, 17, 17);
    ctx.fillStyle = "#ecf8f7";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }
}

class Hazard {
  constructor(type, x, y, w, h, opts = {}) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.opts = opts;
    this.t = Math.random() * 10;
    this.hitCooldown = 0;
  }

  update(dt) {
    this.t += dt;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
  }

  bounds() {
    if (this.type === "boulder") {
      const lane = this.opts.lane || 120;
      const sx = this.x + Math.sin(this.t * 1.35) * lane;
      return { x: sx - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    }
    if (this.type === "disc") {
      return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    }
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  collide(ball, game) {
    const b = this.bounds();
    const cx = clamp(ball.x, b.x, b.x + b.w);
    const cy = clamp(ball.y, b.y, b.y + b.h);
    if (dist(ball.x, ball.y, cx, cy) > BALL_R) return;
    if (this.type === "ledge") {
      if (ball.vy > 0 && ball.y < b.y + 8) {
        ball.y = b.y - BALL_R;
        ball.vy = -Math.abs(ball.vy) * 0.72;
        ball.vx += Math.sin(this.t * 6) * 40;
        game.audio.sfx("wall");
      } else if (this.hitCooldown <= 0) {
        this.hitCooldown = 0.6;
        ball.damage(1);
      }
      return;
    }
    if (this.hitCooldown <= 0) {
      this.hitCooldown = 0.75;
      ball.damage(this.type === "disc" ? 1 : 1);
      const nx = ball.x < b.x + b.w / 2 ? -1 : 1;
      ball.vx += nx * 260;
      ball.vy -= 90;
    }
  }

  draw(ctx, cameraY) {
    const b = this.bounds();
    const y = b.y - cameraY;
    if (this.type === "ledge") {
      ctx.fillStyle = this.hitCooldown > 0 ? "#734541" : "#8d744f";
      ctx.fillRect(Math.round(b.x), Math.round(y), b.w, b.h);
      ctx.fillStyle = "#d3b16c";
      for (let x = b.x; x < b.x + b.w; x += 18) ctx.fillRect(Math.round(x), Math.round(y), 10, 4);
    } else if (this.type === "boulder") {
      ctx.fillStyle = "#55483e";
      ctx.beginPath();
      ctx.arc(Math.round(b.x + b.w / 2), Math.round(y + b.h / 2), b.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#988263";
      ctx.fillRect(Math.round(b.x + 10), Math.round(y + 7), 10, 7);
    } else {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - cameraY));
      ctx.rotate(this.t * 4);
      ctx.fillStyle = "#a93e39";
      ctx.fillRect(-this.w / 2, -4, this.w, 8);
      ctx.fillRect(-4, -this.h / 2, 8, this.h);
      ctx.fillStyle = "#ffcc5c";
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }
  }
}

class Platform {
  constructor(x1, y1, x2, y2, width = 18, kind = "stone") {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width = width;
    this.kind = kind;
  }

  collide(ball, level) {
    level.collideSegment(ball, this.x1, this.y1, this.x2, this.y2, this.width);
  }

  draw(ctx, cameraY) {
    ctx.save();
    ctx.lineCap = "square";
    ctx.lineWidth = this.width;
    ctx.strokeStyle = this.kind === "ramp" ? "#88c8cc" : this.kind === "curve" ? "#4b5360" : "#4c5865";
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1 - cameraY);
    ctx.lineTo(this.x2, this.y2 - cameraY);
    ctx.stroke();
    ctx.lineWidth = Math.max(4, this.width * 0.28);
    ctx.strokeStyle = this.kind === "ramp" ? "#d9faff" : this.kind === "curve" ? "#c4b69c" : "#c6a979";
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1 - cameraY - this.width * 0.18);
    ctx.lineTo(this.x2, this.y2 - cameraY - this.width * 0.18);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,.45)";
    for (let t = 0.12; t < 1; t += 0.16) {
      const x = this.x1 + (this.x2 - this.x1) * t;
      const y = this.y1 + (this.y2 - this.y1) * t - cameraY;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - this.width * 0.25);
      ctx.lineTo(x + 6, y + this.width * 0.25);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class PurpleShot {
  constructor(x, y, dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    this.x = x;
    this.y = y;
    this.vx = (dx / len) * 640;
    this.vy = (dy / len) * 640;
    this.life = 1.15;
    this.alive = true;
  }

  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < TABLE_X || this.x > TABLE_X + TABLE_W || this.y < 0 || this.y > WORLD_H) this.alive = false;
    game.addParticles(this.x, this.y, "#b86cff", 1);
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y - cameraY));
    ctx.fillStyle = "#3b145f";
    ctx.fillRect(-6, -3, 12, 6);
    ctx.fillStyle = "#c77dff";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = "#f2d7ff";
    ctx.fillRect(-1, -1, 3, 3);
    ctx.restore();
  }
}

class PurpleLifePickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.t = Math.random() * 10;
    this.alive = true;
  }

  update(dt, ball, game) {
    if (!this.alive) return;
    this.t += dt;
    if (dist(ball.x, ball.y, this.x, this.y + Math.sin(this.t * 3) * 6) < BALL_R + 22) {
      this.alive = false;
      ball.heal(1);
      ball.refillShots();
      game.score += 150;
    }
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const bob = Math.sin(this.t * 3) * 6;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y + bob - cameraY));
    ctx.shadowColor = "#c77dff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#c77dff";
    ctx.font = "24px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👾", 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#72fff0";
    ctx.fillRect(-3, -17, 6, 3);
    ctx.restore();
  }
}

class WalkerMonster {
  constructor(x, y, minX, maxX, sprite = 2) {
    this.x = x;
    this.y = y;
    this.minX = minX;
    this.maxX = maxX;
    this.vx = 46 * (Math.random() > 0.5 ? 1 : -1);
    this.hp = 2;
    this.alive = true;
    this.t = Math.random() * 10;
    this.hitCooldown = 0;
    this.sprite = sprite;
    this.vy = 0;
    this.grounded = true;
  }

  hurt(game, damage = 1) {
    this.hp -= damage;
    game.addParticles(this.x, this.y - 18, "#b86cff", 16);
    if (this.hp <= 0) {
      this.alive = false;
      game.audio.sfx("destroy");
      game.score += 350;
      game.addParticles(this.x, this.y - 18, "#7b5ea8", 36);
    }
  }

  update(dt, ball, game) {
    if (!this.alive) return;
    this.t += dt;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    const oldY = this.y;
    this.x += this.vx * dt;
    this.vy += 620 * dt;
    this.y += this.vy * dt;
    if (this.x < this.minX || this.x > this.maxX) {
      this.vx *= -1;
      this.x = clamp(this.x, this.minX, this.maxX);
    }
    this.grounded = false;
    const platforms = game.level?.platforms || [];
    for (const platform of platforms) {
      const p = pointSegment(this.x, this.y, platform.x1, platform.y1, platform.x2, platform.y2);
      const onSpan = p.t > 0.02 && p.t < 0.98;
      const mostlyFlat = Math.abs(platform.y2 - platform.y1) < 95;
      if (onSpan && mostlyFlat && this.vy >= 0 && oldY <= p.y + 22 && this.y >= p.y - 4) {
        this.y = p.y;
        this.vy = 0;
        this.grounded = true;
        break;
      }
    }
    if (!this.grounded && this.y > WORLD_H + 120) {
      this.alive = false;
      return;
    }
    const d = dist(ball.x, ball.y, this.x, this.y - 18);
    if (d > BALL_R + 28 || this.hitCooldown > 0) return;
    const impact = Math.hypot(ball.vx, ball.vy);
    if (impact > 260 || ball.attackTimer > 0) {
      this.hitCooldown = 0.25;
      this.hurt(game, impact > 520 || ball.attackTimer > 0 ? 2 : 1);
      const dir = Math.sign(ball.x - this.x || ball.vx || 1);
      ball.vx = dir * Math.max(360, Math.abs(ball.vx) * 0.92);
      ball.vy = -Math.abs(ball.vy) * 0.62 - 220;
      ball.refillShots();
      game.addParticles(ball.x, ball.y, ["#c77dff", "#72fff0", "#ffd078"][Math.floor(Math.random() * 3)], 22);
      this.vy = 220;
    } else {
      this.hitCooldown = 0.7;
      ball.damage(1);
      ball.vx += Math.sign(ball.x - this.x || 1) * 360;
      ball.vy += 520;
      this.vy = 360;
      game.shake = Math.max(game.shake, 10);
      game.audio.sfx("hurt");
    }
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const sy = this.y - cameraY;
    const step = Math.sin(this.t * 7) * 2;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(sy + step));
    ctx.scale(Math.sign(this.vx) || 1, 1);
    const sheet = IMAGES.monsters;
    const frame = getMonsterFrame(this.sprite, sheet);
    if (frame) {
      ctx.drawImage(frame, -35, -62, 70, 70);
    } else {
      ctx.fillStyle = "#6f5f8f";
      ctx.fillRect(-19, -34, 38, 28);
      ctx.fillStyle = "#c77dff";
      ctx.fillRect(-9, -33, 5, 5);
      ctx.fillRect(5, -33, 5, 5);
    }
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.fillRect(-28, -1, 56, 7);
    ctx.restore();
  }
}

class EnemyWolf {
  constructor(x, y, minX, maxX) {
    this.x = x;
    this.y = y;
    this.minX = minX;
    this.maxX = maxX;
    this.vx = 64;
    this.hp = 2;
    this.alive = true;
    this.biteCooldown = 0;
    this.t = Math.random() * 10;
  }

  hurt(game, damage = 1) {
    this.hp -= damage;
    game.addParticles(this.x, this.y - 18, "#cde4f0", 16);
    if (this.hp <= 0) {
      this.alive = false;
      game.audio.sfx("destroy");
      game.score += 300;
      game.addParticles(this.x, this.y - 16, "#8da4ad", 34);
    }
  }

  update(dt, ball, game) {
    if (!this.alive) return;
    this.t += dt;
    this.biteCooldown = Math.max(0, this.biteCooldown - dt);
    this.x += this.vx * dt;
    if (this.x < this.minX || this.x > this.maxX) {
      this.vx *= -1;
      this.x = clamp(this.x, this.minX, this.maxX);
    }
    if (Math.abs(ball.x - this.x) < 115 && Math.abs(ball.y - this.y) < 90) {
      this.vx += Math.sign(ball.x - this.x || this.vx || 1) * 185 * dt;
      this.vx = clamp(this.vx, -155, 155);
    }
    const d = dist(ball.x, ball.y, this.x, this.y - 17);
    if (d > BALL_R + 30) return;
    const impact = Math.hypot(ball.vx, ball.vy);
    if (impact > 260) {
      this.hurt(game, impact > 520 ? 2 : 1);
      ball.vy = -Math.abs(ball.vy) * 0.62 - 210;
      ball.vx += Math.sign(ball.x - this.x || 1) * 230;
      ball.refillShots();
      game.score += 250;
      game.audio.sfx("bumper");
    } else if (this.biteCooldown <= 0) {
      this.biteCooldown = 1.0;
      ball.damage(1);
      ball.vx += Math.sign(ball.x - this.x || 1) * 380;
      ball.vy -= 160;
      game.addParticles(ball.x, ball.y, "#ff7474", 12);
    }
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const sy = this.y - cameraY;
    const dir = Math.sign(this.vx) || 1;
    const bob = Math.round(Math.sin(this.t * 8) * 2);
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(sy + bob));
    ctx.scale(dir, 1);
    ctx.fillStyle = "#171b20";
    ctx.fillRect(-25, -27, 42, 18);
    ctx.fillStyle = "#7f8b92";
    ctx.fillRect(-22, -30, 38, 17);
    ctx.fillRect(8, -39, 19, 16);
    ctx.fillStyle = "#aeb9bf";
    ctx.fillRect(18, -36, 10, 8);
    ctx.fillStyle = "#394047";
    ctx.fillRect(-18, -12, 7, 17);
    ctx.fillRect(6, -12, 7, 17);
    ctx.fillRect(-31, -24, 12, 7);
    ctx.fillStyle = "#d9faff";
    ctx.fillRect(22, -35, 4, 4);
    ctx.fillStyle = "#f3d29a";
    ctx.fillRect(26, -28, 5, 3);
    ctx.restore();
  }
}

class FlyingRedBat {
  constructor(x, y, minX, maxX) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.minX = minX;
    this.maxX = maxX;
    this.vx = rand(70, 105) * (Math.random() > 0.5 ? 1 : -1);
    this.alive = true;
    this.t = Math.random() * 10;
    this.attackCooldown = rand(0.6, 1.8);
  }

  hurt(game, damage = 1) {
    this.alive = false;
    game.score += 300 * damage;
    game.audio.sfx("destroy");
    game.addParticles(this.x, this.y, "#ff4b4b", 38);
    game.addParticles(this.x, this.y, "#ffd078", 16);
  }

  update(dt, ball, game) {
    if (!this.alive) return;
    this.t += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.x += this.vx * dt;
    this.y = this.baseY + Math.sin(this.t * 3.1) * 28;
    if (this.x < this.minX || this.x > this.maxX) {
      this.vx *= -1;
      this.x = clamp(this.x, this.minX, this.maxX);
    }
    const near = dist(ball.x, ball.y, this.x, this.y) < 180;
    if (near && this.attackCooldown <= 0) {
      this.attackCooldown = rand(1.2, 2.0);
      const dx = ball.x - this.x;
      const dy = ball.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.x += (dx / len) * 95 * dt;
      this.baseY += (dy / len) * 80 * dt;
    }
    const d = dist(ball.x, ball.y, this.x, this.y);
    if (d > BALL_R + 22) return;
    const impact = Math.hypot(ball.vx, ball.vy);
    if (impact > 390) {
      this.hurt(game, 1);
      ball.vx *= 0.92;
      ball.vy = -Math.abs(ball.vy) * 0.72 - 90;
    } else {
      ball.damage(1);
      ball.vx += Math.sign(ball.x - this.x || 1) * 240;
      ball.vy += 260;
      game.addParticles(ball.x, ball.y, "#ff7474", 10);
    }
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const flap = Math.sin(this.t * 12);
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y - cameraY));
    ctx.fillStyle = "#1b090d";
    ctx.fillRect(-8, -8, 16, 14);
    ctx.fillStyle = "#b51d2c";
    ctx.fillRect(-28, -5 + flap * 4, 22, 8);
    ctx.fillRect(6, -5 - flap * 4, 22, 8);
    ctx.fillStyle = "#ff3c4c";
    ctx.fillRect(-21, -2 + flap * 4, 9, 4);
    ctx.fillRect(12, -2 - flap * 4, 9, 4);
    ctx.fillStyle = "#ffd4a3";
    ctx.fillRect(-4, -4, 3, 3);
    ctx.fillRect(3, -4, 3, 3);
    ctx.restore();
  }
}

class ClawPendulum {
  constructor(side, pivotX, pivotY, armLength, phase = 0) {
    this.side = side;
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.armLength = armLength;
    this.phase = phase;
    this.speed = 1.5;
    this.t = 0;
    this.cooldown = 0;
  }

  tip() {
    const base = this.side === "left" ? 0.45 : Math.PI - 0.45;
    const angle = base + Math.sin(this.t * this.speed + this.phase) * 0.92;
    return {
      angle,
      x: this.pivotX + Math.cos(angle) * this.armLength,
      y: this.pivotY + Math.sin(angle) * this.armLength,
    };
  }

  update(dt, ball, game) {
    this.t += dt;
    this.speed = ball.y < 1600 ? 2.5 : 1.5;
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  collide(ball, game) {
    const tip = this.tip();
    const p = pointSegment(ball.x, ball.y, this.pivotX, this.pivotY, tip.x, tip.y);
    if (dist(ball.x, ball.y, p.x, p.y) > BALL_R + 18 || this.cooldown > 0) return;
    this.cooldown = 0.55;
    ball.damage(2);
    ball.vx += (this.side === "left" ? 1 : -1) * 380;
    ball.vy += 520;
    game.shake = Math.max(game.shake, 8);
    game.addParticles(ball.x, ball.y, "#ff3030", 28);
    game.audio.sfx("hurt");
  }

  draw(ctx, cameraY) {
    const tip = this.tip();
    ctx.save();
    ctx.lineWidth = 18;
    ctx.strokeStyle = "#2c1a0e";
    ctx.beginPath();
    ctx.moveTo(this.pivotX, this.pivotY - cameraY);
    ctx.lineTo(tip.x, tip.y - cameraY);
    ctx.stroke();
    ctx.fillStyle = "#4a4a5a";
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(tip.x, tip.y - cameraY);
      ctx.rotate(tip.angle + i * 0.28);
      ctx.fillRect(-8, -4, 56, 8);
      ctx.fillStyle = "#e8dcc8";
      ctx.fillRect(42, -7, 22, 14);
      ctx.restore();
    }
    ctx.restore();
  }
}

class WerewolfBoss {
  constructor(level) {
    this.level = level;
    this.active = false;
    this.defeated = false;
    this.leftEye = { x: TABLE_X + 315, y: 600, hits: 0, cooldown: 0 };
    this.rightEye = { x: TABLE_X + 485, y: 600, hits: 0, cooldown: 0 };
    this.brain = { x: TABLE_X + 400, y: 425, hits: 0, cooldown: 0 };
    this.t = 0;
    this.jawCooldown = 0;
  }

  update(dt, ball, game) {
    this.t += dt;
    this.active = ball.y < 900 && !this.defeated;
    if (!this.active) return;
    this.jawCooldown = Math.max(0, this.jawCooldown - dt);
    this.leftEye.cooldown = Math.max(0, this.leftEye.cooldown - dt);
    this.rightEye.cooldown = Math.max(0, this.rightEye.cooldown - dt);
    this.brain.cooldown = Math.max(0, this.brain.cooldown - dt);
    const jawY = 770 + Math.sin(this.t * 1.2) * 70;
    if (ball.y > jawY - 18 && ball.y < jawY + 18 && ball.x > TABLE_X + 230 && ball.x < TABLE_X + 570 && this.jawCooldown <= 0) {
      this.jawCooldown = 1;
      game.restartLevel("Caught by the jaws.");
      return;
    }
    [this.leftEye, this.rightEye].forEach((eye) => {
      if (eye.hits < 4 && eye.cooldown <= 0 && dist(ball.x, ball.y, eye.x, eye.y) < BALL_R + 28) {
        eye.cooldown = 0.45;
        eye.hits += 1;
        ball.vy = Math.abs(ball.vy) * 0.4 + 260;
        ball.vx += Math.sign(ball.x - eye.x || 1) * 160;
        game.score += 600;
        game.audio.sfx("boss");
        game.addParticles(eye.x, eye.y, "#ff2020", 28);
      }
    });
    if (this.exposed() && this.brain.cooldown <= 0 && dist(ball.x, ball.y, this.brain.x, this.brain.y) < BALL_R + 34) {
      this.brain.cooldown = 0.55;
      this.brain.hits += 1;
      ball.vy = 480;
      game.audio.sfx("boss");
      game.addParticles(this.brain.x, this.brain.y, "#c77dff", 38);
      if (this.brain.hits >= 3) {
        this.defeated = true;
        game.audio.sfx("exit");
        game.addParticles(this.brain.x, this.brain.y, "#e8dcc8", 120);
      }
    }
  }

  exposed() {
    return this.leftEye.hits >= 4 && this.rightEye.hits >= 4;
  }

  draw(ctx, cameraY) {
    if (!this.active && !this.defeated) return;
    const jawY = 770 + Math.sin(this.t * 1.2) * 70 - cameraY;
    ctx.save();
    [this.leftEye, this.rightEye].forEach((eye) => {
      const glow = 0.35 + eye.hits * 0.16;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#ff2020";
      ctx.beginPath();
      ctx.arc(eye.x, eye.y - cameraY, 20 + eye.hits * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = glow;
      ctx.fillRect(eye.x - 28, eye.y - cameraY - 4, 56, 8);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e8dcc8";
    for (let x = TABLE_X + 230; x <= TABLE_X + 570; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, 820 - cameraY);
      ctx.lineTo(x + 14, 858 - cameraY);
      ctx.lineTo(x + 28, 820 - cameraY);
      ctx.fill();
    }
    ctx.fillStyle = "#2c1a0e";
    ctx.fillRect(TABLE_X + 220, jawY, 360, 18);
    if (this.exposed() && !this.defeated) {
      ctx.fillStyle = "#c77dff";
      ctx.beginPath();
      ctx.arc(this.brain.x, this.brain.y - cameraY, 30 + Math.sin(this.t * 8) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class BossWolf {
  constructor(level) {
    this.level = level;
    this.active = false;
    this.defeated = false;
    this.hp = 12;
    this.x = TABLE_X + TABLE_W / 2;
    this.y = 255;
    this.t = 0;
    this.lungeTimer = 1.6;
    this.howlTimer = 3.2;
    this.breathTimer = 0;
    this.hitCooldown = 0;
  }

  update(dt, ball, game) {
    if (this.defeated) return;
    this.active = ball.y < 760;
    if (!this.active) return;
    this.t += dt;
    this.lungeTimer -= dt;
    this.howlTimer -= dt;
    this.breathTimer = Math.max(0, this.breathTimer - dt);
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    if (this.lungeTimer <= 0) {
      this.lungeTimer = rand(1.4, 2.4);
      this.breathTimer = 0.5;
      game.addParticles(this.x + rand(-80, 80), this.y + 25, "#8ff7ff", 20);
    }
    if (this.howlTimer <= 0) {
      this.howlTimer = rand(4.2, 6.5);
      const sx = ball.x < this.x ? TABLE_X + 90 : TABLE_X + TABLE_W - 90;
      this.level.enemies.push(new EnemyWolf(sx, 650, sx - 90, sx + 90));
      this.level.bats.push(new FlyingRedBat(TABLE_X + TABLE_W / 2 + rand(-180, 180), 560, TABLE_X + 120, TABLE_X + TABLE_W - 120));
      game.addParticles(this.x, this.y - 78, "#b9f5ff", 26);
      game.audio.sfx("boss");
    }
    const headX = this.x + Math.sin(this.t * 1.6) * 22;
    const headY = this.y - 18 + Math.sin(this.t * 2.4) * 6;
    if (this.breathTimer > 0 && Math.abs(ball.x - headX) < 145 && ball.y > headY && ball.y < headY + 150) {
      ball.vx += Math.sign(ball.x - headX || 1) * 12;
      ball.vy += 8;
      if (ball.invuln <= 0) ball.damage(1);
    }
    if (dist(ball.x, ball.y, headX, headY) < BALL_R + 64 && this.hitCooldown <= 0) {
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 360) {
        this.hitCooldown = 0.38;
        this.hp -= 1;
        ball.vy = -Math.abs(ball.vy) * 0.82 - 180;
        ball.vx += Math.sign(ball.x - headX || 1) * 220;
        game.score += 900;
        game.audio.sfx("boss");
        game.shake = 12;
        game.addParticles(headX, headY, "#93edff", 34);
        if (this.hp <= 0) {
          this.defeated = true;
          game.audio.sfx("exit");
          game.addParticles(this.x, this.y, "#e8fbff", 90);
        }
      } else if (ball.invuln <= 0) {
        this.hitCooldown = 0.45;
        ball.damage(1);
        ball.vx += Math.sign(ball.x - headX || 1) * 420;
        ball.vy += 120;
      }
    }
  }

  draw(ctx, cameraY) {
    const sy = this.y - cameraY;
    if (this.defeated) {
      ctx.fillStyle = "rgba(185,245,255,.65)";
      ctx.fillRect(this.x - 70, sy - 12, 140, 24);
      ctx.fillStyle = "#e8fbff";
      for (let i = 0; i < 8; i++) ctx.fillRect(this.x - 55 + i * 16, sy - 5 + Math.sin(this.t + i) * 4, 6, 6);
      return;
    }
    if (!this.active) return;
    const breathe = Math.sin(this.t * 3) * 3;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(sy + breathe));
    const sprite = getCutoutSprite("neonWerewolf", IMAGES.neonWerewolf);
    if (sprite) {
      ctx.fillStyle = "rgba(0, 0, 0, .36)";
      ctx.fillRect(-134, 74, 268, 24);
      ctx.shadowColor = "#ff40b7";
      ctx.shadowBlur = this.hitCooldown > 0 ? 18 : 8;
      ctx.drawImage(sprite, -118, -122, 236, 236);
      ctx.shadowBlur = 0;
      if (this.breathTimer > 0) {
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = "#93edff";
        for (let i = 0; i < 7; i++) ctx.fillRect(105 + i * 22, -18 + i * 6, 18, 5);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      return;
    }
    ctx.fillStyle = "rgba(0, 0, 0, .36)";
    ctx.fillRect(-138, 58, 280, 28);
    ctx.fillStyle = "#0c1824";
    ctx.fillRect(-150, -16, 230, 78);
    ctx.fillStyle = "#1f5f8f";
    ctx.fillRect(-138, -48, 210, 76);
    ctx.fillStyle = "#348fca";
    ctx.fillRect(-115, -65, 150, 38);
    ctx.fillStyle = "#94e8ff";
    ctx.fillRect(-65, -54, 72, 8);
    ctx.fillStyle = "#17405e";
    ctx.fillRect(14, -78, 28, 28);
    ctx.fillRect(-92, -82, 28, 31);
    ctx.fillStyle = "#07111a";
    ctx.fillRect(40, -45, 74, 45);
    ctx.fillStyle = "#2e78a8";
    ctx.fillRect(76, -31, 44, 24);
    ctx.fillStyle = "#baffff";
    ctx.fillRect(83, -23, 8, 8);
    ctx.fillRect(105, -23, 8, 8);
    ctx.fillStyle = "#e8fbff";
    ctx.fillRect(110, -5, 11, 4);
    ctx.fillRect(96, -4, 9, 4);
    ctx.fillStyle = "#12304a";
    ctx.fillRect(-117, 25, 28, 60);
    ctx.fillRect(-22, 22, 30, 62);
    ctx.fillRect(46, 18, 28, 58);
    ctx.fillStyle = "#8ff7ff";
    ctx.globalAlpha = 0.65 + Math.sin(this.t * 6) * 0.25;
    ctx.fillRect(83, -22, 8, 8);
    ctx.fillRect(105, -22, 8, 8);
    if (this.breathTimer > 0) {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = "#93edff";
      for (let i = 0; i < 7; i++) ctx.fillRect(122 + i * 22, -18 + i * 6, 18, 5);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class Level {
  constructor(index, game) {
    this.index = index;
    this.meta = {
      palette: { bg: "#15101a", stone: "#b99057", glow: "#ffd671", accent: "#63d6c7", danger: "#d64639" },
      quote: "The ascent continues beyond this demo.",
      ...LEVELS[index],
    };
    this.game = game;
    this.boss = new BossWolf(this);
    this.bumpers = [];
    this.flippers = [];
    this.hazards = [];
    this.platforms = [];
    this.enemies = [];
    this.bats = [];
    this.walkers = [];
    this.gates = [];
    this.buildBulgaRise();
  }

  buildBulgaRise() {
    const xs = [TABLE_X + 155, TABLE_X + 380, TABLE_X + 605];
    const rows = [3420, 2950, 2470, 2010, 1540, 1040];
    rows.forEach((y, row) => {
      this.bumpers.push(new Bumper(xs[row % 3], y, 28, row % 2 ? "MOON" : "RUNE"));
      this.bumpers.push(new Bumper(xs[(row + 2) % 3], y - 155, 24, row % 2 ? "FANG" : "EYE", "#c5a16a"));
    });
    [3810, 3540, 3270, 3000, 2730, 2460, 2190, 1920, 1650, 1380, 1110, 840, 570].forEach((baseY, i) => {
      const offset = i % 2 ? 34 : 0;
      const wide = i === 0 ? 210 : i === 1 ? 170 : i % 3 === 0 ? 142 : 122;
      this.flippers.push(new Flipper("left", TABLE_X + 64 + offset, baseY, wide));
      this.flippers.push(new Flipper("right", TABLE_X + TABLE_W - 64 - offset, baseY, wide));
      this.flippers.push(new Flipper("left", TABLE_X + 122 - offset, baseY - 112, 88));
      this.flippers.push(new Flipper("right", TABLE_X + TABLE_W - 122 + offset, baseY - 112, 88));
    });
    [3160, 2600, 2110, 1660, 1230].forEach((y, i) => {
      this.hazards.push(new Hazard("boulder", TABLE_X + TABLE_W / 2, y, 46, 46, { lane: i % 2 ? 175 : 140 }));
    });
    [2500, 1530, 720].forEach((y, i) => {
      this.hazards.push(new Hazard("disc", TABLE_X + (i % 2 ? 565 : 185), y, 72, 72));
    });
    [
      [TABLE_X + 42, 3710, TABLE_X + 252, 3595, 20, "stone"],
      [TABLE_X + TABLE_W - 42, 3710, TABLE_X + TABLE_W - 252, 3595, 20, "stone"],
      [TABLE_X + 54, 3230, TABLE_X + 245, 3150, 18, "stone"],
      [TABLE_X + TABLE_W - 65, 2960, TABLE_X + TABLE_W - 260, 2860, 18, "ramp"],
      [TABLE_X + 62, 2605, TABLE_X + 255, 2520, 18, "ramp"],
      [TABLE_X + TABLE_W - 270, 2260, TABLE_X + TABLE_W - 60, 2175, 18, "stone"],
      [TABLE_X + 65, 1905, TABLE_X + 255, 1810, 18, "stone"],
      [TABLE_X + TABLE_W - 260, 1600, TABLE_X + TABLE_W - 60, 1510, 18, "ramp"],
      [TABLE_X + 62, 1265, TABLE_X + 245, 1175, 18, "stone"],
      [TABLE_X + TABLE_W - 265, 990, TABLE_X + TABLE_W - 60, 905, 18, "ramp"],
      [TABLE_X + 66, 660, TABLE_X + 278, 610, 20, "stone"],
      [TABLE_X + TABLE_W - 280, 430, TABLE_X + TABLE_W - 80, 430, 22, "stone"],
      [TABLE_X + 70, 3425, TABLE_X + 275, 3425, 18, "stone"],
      [TABLE_X + TABLE_W - 300, 3055, TABLE_X + TABLE_W - 90, 3015, 18, "stone"],
      [TABLE_X + 70, 2668, TABLE_X + 275, 2668, 18, "stone"],
      [TABLE_X + TABLE_W - 310, 2038, TABLE_X + TABLE_W - 84, 2038, 18, "stone"],
      [TABLE_X + 70, 1438, TABLE_X + 285, 1438, 18, "stone"],
      [TABLE_X + TABLE_W - 300, 805, TABLE_X + TABLE_W - 90, 805, 18, "stone"],
    ].forEach((p) => this.platforms.push(new Platform(...p)));
    [
      [TABLE_X + 300, 3160, TABLE_X + 190, TABLE_X + 390],
      [TABLE_X + 570, 2870, TABLE_X + 485, TABLE_X + 660],
      [TABLE_X + 230, 2535, TABLE_X + 130, TABLE_X + 330],
      [TABLE_X + 570, 2188, TABLE_X + 475, TABLE_X + 675],
      [TABLE_X + 250, 1188, TABLE_X + 140, TABLE_X + 350],
      [TABLE_X + 565, 918, TABLE_X + 465, TABLE_X + 670],
    ].forEach(([x, y, minX, maxX]) => this.enemies.push(new EnemyWolf(x, y, minX, maxX)));
    [
      [TABLE_X + 180, 3428, TABLE_X + 90, TABLE_X + 265, 0],
      [TABLE_X + TABLE_W - 195, 3020, TABLE_X + TABLE_W - 292, TABLE_X + TABLE_W - 95, 1],
      [TABLE_X + 180, 2672, TABLE_X + 90, TABLE_X + 265, 2],
      [TABLE_X + TABLE_W - 205, 2042, TABLE_X + TABLE_W - 300, TABLE_X + TABLE_W - 95, 3],
      [TABLE_X + 185, 1442, TABLE_X + 90, TABLE_X + 275, 0],
      [TABLE_X + TABLE_W - 195, 809, TABLE_X + TABLE_W - 292, TABLE_X + TABLE_W - 95, 2],
    ].forEach(([x, y, minX, maxX, sprite]) => this.walkers.push(new WalkerMonster(x, y, minX, maxX, sprite)));
    [
      [TABLE_X + 225, 3350, TABLE_X + 120, TABLE_X + 510],
      [TABLE_X + 580, 2780, TABLE_X + 310, TABLE_X + 690],
      [TABLE_X + 250, 2310, TABLE_X + 110, TABLE_X + 470],
      [TABLE_X + 590, 1715, TABLE_X + 330, TABLE_X + 705],
      [TABLE_X + 250, 1370, TABLE_X + 100, TABLE_X + 455],
      [TABLE_X + 580, 760, TABLE_X + 325, TABLE_X + 705],
    ].forEach(([x, y, minX, maxX]) => this.bats.push(new FlyingRedBat(x, y, minX, maxX)));
  }

  update(dt, ball) {
    this.flippers.forEach((f) => {
      f.setActive(f.side === "left" ? this.game.leftPressed : this.game.rightPressed);
      f.update(dt);
      try {
        f.collide(ball, this.game);
      } catch (error) {
        f.active = false;
        f.cooldown = 0;
      }
    });
    this.bumpers.forEach((b) => {
      b.update(dt);
      b.collide(ball, this.game);
    });
    this.hazards.forEach((h) => {
      h.update(dt);
      h.collide(ball, this.game);
    });
    this.enemies.forEach((e) => e.update(dt, ball, this.game));
    this.enemies = this.enemies.filter((e) => e.alive);
    this.walkers.forEach((w) => w.update(dt, ball, this.game));
    this.walkers = this.walkers.filter((w) => w.alive);
    this.bats.forEach((b) => b.update(dt, ball, this.game));
    this.bats = this.bats.filter((b) => b.alive);
    this.resolveShots(this.game);
    this.boss.update(dt, ball, this.game);
  }

  resolveShots(game) {
    game.shots.forEach((shot) => {
      if (!shot.alive) return;
      const hitEnemy = [...this.enemies, ...this.walkers].find((enemy) => enemy.alive && dist(shot.x, shot.y, enemy.x, enemy.y - 20) < 28);
      if (hitEnemy) {
        hitEnemy.hurt(game, 1);
        shot.alive = false;
        game.addParticles(shot.x, shot.y, "#c77dff", 18);
        return;
      }
      const hitBat = this.bats.find((bat) => bat.alive && dist(shot.x, shot.y, bat.x, bat.y) < 24);
      if (hitBat) {
        hitBat.hurt(game, 1);
        shot.alive = false;
        game.addParticles(shot.x, shot.y, "#c77dff", 18);
        return;
      }
      if (this.boss.active && !this.boss.defeated && dist(shot.x, shot.y, this.boss.x + 80, this.boss.y - 18) < 78) {
        this.boss.hp -= 1;
        shot.alive = false;
        game.audio.sfx("boss");
        game.addParticles(shot.x, shot.y, "#c77dff", 24);
        if (this.boss.hp <= 0) {
          this.boss.defeated = true;
          game.audio.sfx("exit");
          game.addParticles(this.boss.x, this.boss.y, "#e8fbff", 90);
        }
      }
    });
  }

  resolveGeometry(ball) {
    const rails = [
      { x1: TABLE_X + 34, y1: WORLD_H - 250, x2: TABLE_X + 160, y2: WORLD_H - 390 },
      { x1: TABLE_X + TABLE_W - 34, y1: WORLD_H - 250, x2: TABLE_X + TABLE_W - 160, y2: WORLD_H - 390 },
      { x1: TABLE_X + 50, y1: 680, x2: TABLE_X + 150, y2: 835 },
      { x1: TABLE_X + TABLE_W - 50, y1: 680, x2: TABLE_X + TABLE_W - 150, y2: 835 },
      { x1: TABLE_X + 52, y1: 1140, x2: TABLE_X + 152, y2: 1275 },
      { x1: TABLE_X + TABLE_W - 52, y1: 2060, x2: TABLE_X + TABLE_W - 152, y2: 2195 },
      { x1: TABLE_X + 55, y1: 2730, x2: TABLE_X + 165, y2: 2865 },
    ];
    rails.forEach((r) => this.collideSegment(ball, r.x1, r.y1, r.x2, r.y2));
    this.platforms.forEach((p) => p.collide(ball, this));
    if (!this.boss.defeated) {
      this.gates.forEach((g) => {
        const cx = clamp(ball.x, g.x, g.x + g.w);
        const cy = clamp(ball.y, g.y, g.y + g.h);
        if (dist(ball.x, ball.y, cx, cy) < BALL_R) {
          ball.y = g.y + g.h + BALL_R;
          ball.vy = Math.abs(ball.vy) * 0.82;
          this.game.audio.sfx("wall");
        }
      });
    } else if (ball.y < 220) {
      this.game.completeLevel();
    }
  }

  collideSegment(ball, x1, y1, x2, y2, width = 10) {
    const p = pointSegment(ball.x, ball.y, x1, y1, x2, y2);
    const px = p.x;
    const py = p.y;
    const d = dist(ball.x, ball.y, px, py);
    if (d >= BALL_R + width / 2) return;
    const nx = (ball.x - px) / (d || 1);
    const ny = (ball.y - py) / (d || 1);
    ball.x += nx * (BALL_R + width / 2 - d);
    ball.y += ny * (BALL_R + width / 2 - d);
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      const impact = Math.abs(dot);
      const bounceBoost = ball.wallBounces < 4 ? clamp(impact / 620, 0.72, 1.25) : 0.48;
      ball.vx = (ball.vx - (1.66 + bounceBoost * 0.24) * dot * nx) * 0.985;
      ball.vy = (ball.vy - (1.66 + bounceBoost * 0.24) * dot * ny) * 0.985;
      if (impact > 260 && ball.wallBounces < 4) {
      ball.wallBounces += 1;
      ball.wallBounceTimer = 0.8;
      ball.refillShots();
      ball.coyote = 0.16;
      this.game.addParticles(px, py, "#9ff7ff", Math.floor(clamp(impact / 70, 3, 12)));
      }
      ball.spin += nx * 4;
    }
  }

  draw(ctx, cameraY) {
    this.drawBackdrop(ctx, cameraY);
    this.drawRails(ctx, cameraY);
    this.platforms.forEach((p) => p.draw(ctx, cameraY));
    this.hazards.forEach((h) => h.draw(ctx, cameraY));
    this.bumpers.forEach((b) => b.draw(ctx, cameraY));
    this.enemies.forEach((e) => e.draw(ctx, cameraY));
    this.walkers.forEach((w) => w.draw(ctx, cameraY));
    this.bats.forEach((b) => b.draw(ctx, cameraY));
    if (!this.boss.defeated) {
      this.gates.forEach((g) => {
        ctx.fillStyle = "#3c2632";
        ctx.fillRect(g.x, g.y - cameraY, g.w, g.h);
        ctx.fillStyle = "#d8ab4c";
        for (let x = g.x; x < g.x + g.w; x += 18) ctx.fillRect(x, g.y - cameraY, 8, g.h);
      });
    }
    this.boss.draw(ctx, cameraY);
  }

  drawBackdrop(ctx, cameraY) {
    ctx.fillStyle = "#03040a";
    ctx.fillRect(TABLE_X, 0, TABLE_W, H);
    const tileH = 760;
    for (let y = WORLD_H - tileH; y > -tileH; y -= tileH) {
      const sy = y - cameraY;
      if (sy > H || sy + tileH < 0) continue;
      if (!drawCover(ctx, IMAGES.pinballMap, TABLE_X, sy, TABLE_W, tileH, 0.9)) {
        ctx.fillStyle = "#24140e";
        ctx.fillRect(TABLE_X, sy, TABLE_W, tileH);
      }
      ctx.fillStyle = "rgba(3, 4, 10, .16)";
      ctx.fillRect(TABLE_X, sy, TABLE_W, tileH);
    }
    const bossY = 0 - cameraY;
    if (bossY < H && bossY + 680 > 0) {
      drawCover(ctx, IMAGES.pinballMap, TABLE_X, bossY, TABLE_W, 680, 1);
      ctx.fillStyle = "rgba(20, 3, 0, .24)";
      ctx.fillRect(TABLE_X, bossY, TABLE_W, 680);
    }
    ctx.fillStyle = "rgba(0, 0, 0, .26)";
    ctx.fillRect(TABLE_X, 0, 32, H);
    ctx.fillRect(TABLE_X + TABLE_W - 32, 0, 32, H);
    ctx.strokeStyle = "#1aa5b7";
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 2;
    for (let x = TABLE_X + 82; x < TABLE_X + TABLE_W - 60; x += 118) {
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x + Math.sin((cameraY + x) * 0.004) * 12, H + 20);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#6b4a35";
    ctx.lineWidth = 8;
    ctx.strokeRect(TABLE_X + 5, -cameraY + 20, TABLE_W - 10, WORLD_H - 30);
    this.drawAgoraSetDressing(ctx, cameraY);
    ctx.fillStyle = "#251720";
    ctx.fillRect(TABLE_X + 16, WORLD_H - 90 - cameraY, TABLE_W - 32, 58);
    ctx.fillStyle = "#d4a45f";
    ctx.font = "15px Courier New";
    ctx.textAlign = "center";
    ctx.textAlign = "left";
  }

  drawAgoraSetDressing(ctx, cameraY) {
    const bands = [
      { y: 3540, title: "THE LOWER FANGS", color: "rgba(97, 71, 54, .72)" },
      { y: 2890, title: "THE HOWLING LEDGES", color: "rgba(120, 82, 58, .72)" },
      { y: 2250, title: "THE MOON-RUIN RAMPS", color: "rgba(87, 66, 101, .72)" },
      { y: 1610, title: "THE WOLF ROAD", color: "rgba(114, 81, 46, .72)" },
      { y: 960, title: "THE FROST GATE", color: "rgba(68, 48, 79, .72)" },
      { y: 420, title: "THE SUMMIT DEN", color: "rgba(111, 52, 45, .72)" },
    ];
    bands.forEach((band) => {
      const sy = band.y - cameraY;
      if (sy < -130 || sy > H + 30) return;
      ctx.fillStyle = band.color;
      ctx.fillRect(TABLE_X + 22, sy, TABLE_W - 44, 12);
      ctx.fillStyle = "rgba(114,255,240,.3)";
      ctx.fillRect(TABLE_X + 42, sy + 4, TABLE_W - 84, 3);
    });
    if (IMAGES.statue.complete && IMAGES.statue.naturalWidth) {
      for (let y = 700; y < WORLD_H; y += 950) {
        const sy = y - cameraY;
        if (sy < -180 || sy > H + 80) continue;
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.drawImage(IMAGES.statue, TABLE_X + 26, sy, 138, 138);
        ctx.scale(-1, 1);
        ctx.drawImage(IMAGES.statue, -(TABLE_X + TABLE_W - 164), sy + 90, 138, 138);
        ctx.restore();
      }
    }
    for (let y = 260; y < WORLD_H; y += 310) {
      const sy = y - cameraY;
      if (sy < -80 || sy > H + 80) continue;
      [TABLE_X + 36, TABLE_X + TABLE_W - 64].forEach((x, i) => {
        ctx.fillStyle = i ? "#6d533d" : "#8d6745";
        ctx.fillRect(x, sy, 28, 86);
        ctx.fillStyle = "#c99a5d";
        ctx.fillRect(x - 7, sy - 10, 42, 12);
        ctx.fillRect(x - 7, sy + 86, 42, 12);
        ctx.fillStyle = "#2b1c1c";
        ctx.fillRect(x + 6, sy + 18, 16, 34);
      });
    }
    for (let y = 520; y < WORLD_H; y += 470) {
      const sy = y - cameraY;
      if (sy < -60 || sy > H + 60) continue;
      ctx.fillStyle = "rgba(255, 214, 113, .18)";
      ctx.fillRect(TABLE_X + 55, sy, 150, 5);
      ctx.fillRect(TABLE_X + TABLE_W - 205, sy + 18, 150, 4);
      ctx.fillStyle = "#ffd671";
      ctx.fillRect(TABLE_X + 104, sy - 5, 9, 18);
      ctx.fillRect(TABLE_X + TABLE_W - 113, sy - 5, 9, 18);
    }
  }

  drawRails(ctx, cameraY) {
    const rails = [
      [TABLE_X + 34, WORLD_H - 250, TABLE_X + 160, WORLD_H - 390],
      [TABLE_X + TABLE_W - 34, WORLD_H - 250, TABLE_X + TABLE_W - 160, WORLD_H - 390],
      [TABLE_X + 50, 680, TABLE_X + 150, 835],
      [TABLE_X + TABLE_W - 50, 680, TABLE_X + TABLE_W - 150, 835],
      [TABLE_X + 52, 1140, TABLE_X + 152, 1275],
      [TABLE_X + TABLE_W - 52, 2060, TABLE_X + TABLE_W - 152, 2195],
      [TABLE_X + 55, 2730, TABLE_X + 165, 2865],
    ];
    ctx.strokeStyle = "#b99057";
    ctx.lineWidth = 12;
    ctx.lineCap = "square";
    rails.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1 - cameraY);
      ctx.lineTo(x2, y2 - cameraY);
      ctx.stroke();
    });
    this.flippers.forEach((f) => f.draw(ctx, cameraY));
  }
}

class WerewolfLevel extends Level {
  constructor(index, game) {
    super(index, game);
    this.meta = {
      name: "Werewolf Anatomy",
      age: "Living Pinball Beast",
      palette: { bg: "#0d0d2b", stone: "#e8dcc8", glow: "#ff2020", accent: "#4a4a5a", danger: "#ff2020" },
      boss: "Werewolf Head",
    };
    this.boss = new WerewolfBoss(this);
    this.bumpers = [];
    this.flippers = [];
    this.hazards = [];
    this.platforms = [];
    this.enemies = [];
    this.bats = [];
    this.walkers = [];
    this.gates = [];
    this.claws = [];
    this.slowZones = [];
    this.acidZones = [];
    this.vocalBars = [];
    this.howlTimer = 0;
    this.buildWerewolfBody();
  }

  buildWerewolfBody() {
    const cx = TABLE_X + TABLE_W / 2;
    [TABLE_X + 110, TABLE_X + 210, TABLE_X + 305, TABLE_X + 495, TABLE_X + 590, TABLE_X + 690].forEach((x, i) => {
      this.bumpers.push(new Bumper(x, 4380 + (i % 2) * 70, 26, "", "#2c1a0e"));
    });
    [
      [TABLE_X + 70, 4720, TABLE_X + 240, 4590, 22, "claw"],
      [TABLE_X + TABLE_W - 70, 4720, TABLE_X + TABLE_W - 240, 4590, 22, "claw"],
      [TABLE_X + 120, 4460, TABLE_X + 305, 4325, 20, "stone"],
      [TABLE_X + TABLE_W - 120, 4460, TABLE_X + TABLE_W - 305, 4325, 20, "stone"],
      [cx - 85, 4170, cx - 42, 3420, 18, "fur"],
      [cx + 85, 4170, cx + 42, 3420, 18, "fur"],
      [cx - 105, 3370, cx - 220, 2480, 18, "rib"],
      [cx + 105, 3370, cx + 220, 2480, 18, "rib"],
      [cx - 96, 1550, cx - 105, 920, 20, "fur"],
      [cx + 96, 1550, cx + 105, 920, 20, "fur"],
      [TABLE_X + 220, 820, TABLE_X + TABLE_W - 220, 820, 18, "fang"],
    ].forEach((p) => this.platforms.push(new Platform(...p)));
    [4070, 3850].forEach((y, i) => {
      this.bumpers.push(new Bumper(cx - 130, y, 50, "", "#e8dcc8"));
      this.bumpers.push(new Bumper(cx + 130, y, 50, "", "#e8dcc8"));
    });
    for (let i = 0; i < 5; i++) {
      const y = 3220 - i * 140;
      this.platforms.push(new Platform(cx - 70, y, cx - 255, y - 80, 18, "rib"));
      this.platforms.push(new Platform(cx + 70, y, cx + 255, y - 80, 18, "rib"));
    }
    this.bumpers.push(new Bumper(cx, 2875, 44, "", "#ff2020"));
    this.acidZones.push({ x: cx - 185, y: 2630, w: 370, h: 170, tick: 0 });
    this.slowZones.push({ x: cx - 270, y: 3460, w: 120, h: 690, factor: 0.8 });
    this.slowZones.push({ x: cx + 150, y: 3460, w: 120, h: 690, factor: 0.8 });
    this.slowZones.push({ x: TABLE_X + 75, y: 1710, w: 190, h: 570, factor: 0.85 });
    this.slowZones.push({ x: TABLE_X + TABLE_W - 265, y: 1710, w: 190, h: 570, factor: 0.85 });
    this.claws.push(new ClawPendulum("left", TABLE_X + 50, 2160, 460, 0));
    this.claws.push(new ClawPendulum("right", TABLE_X + TABLE_W - 50, 2000, 460, 1.5));
    this.bumpers.push(new Bumper(TABLE_X + 135, 1680, 52, "", "#4a4a5a"));
    this.bumpers.push(new Bumper(TABLE_X + TABLE_W - 135, 1680, 52, "", "#4a4a5a"));
    for (let i = 0; i < 4; i++) this.vocalBars.push({ x: cx - 130, y: 1450 - i * 95, w: 260, h: 14, phase: i * 0.6 });
    [[cx - 70, 1010], [cx, 980], [cx + 70, 1010], [cx - 105, 1120], [cx + 105, 1120], [cx - 40, 1205], [cx + 40, 1205], [cx, 1300]].forEach(([x, y]) => {
      this.bumpers.push(new Bumper(x, y, 20, "", "#2c1a0e"));
    });
    this.flippers.push(new Flipper("left", TABLE_X + 115, 4625, 230));
    this.flippers.push(new Flipper("right", TABLE_X + TABLE_W - 115, 4625, 230));
    this.flippers.push(new Flipper("left", TABLE_X + 175, 3530, 150));
    this.flippers.push(new Flipper("right", TABLE_X + TABLE_W - 175, 3530, 150));
    this.flippers.push(new Flipper("left", TABLE_X + 160, 1180, 140));
    this.flippers.push(new Flipper("right", TABLE_X + TABLE_W - 160, 1180, 140));
  }

  update(dt, ball) {
    this.claws.forEach((claw) => {
      claw.update(dt, ball, this.game);
      claw.collide(ball, this.game);
    });
    this.applyZones(dt, ball);
    this.vocalBars.forEach((bar) => {
      const y = bar.y + Math.sin(performance.now() * 0.01 + bar.phase) * 10;
      this.collideSegment(ball, bar.x, y, bar.x + bar.w, y, bar.h);
    });
    this.howlTimer += dt;
    if (this.howlTimer >= 8) {
      this.howlTimer = 0;
      const dir = Math.sign(ball.x - (TABLE_X + TABLE_W / 2)) || 1;
      ball.vx += dir * 360;
      this.game.addParticles(TABLE_X + TABLE_W / 2, 1260, "#e8dcc8", 40);
      this.game.audio.sfx("boss");
    }
    super.update(dt, ball);
  }

  applyZones(dt, ball) {
    this.slowZones.forEach((z) => {
      if (ball.x > z.x && ball.x < z.x + z.w && ball.y > z.y && ball.y < z.y + z.h) {
        ball.vx *= 1 - (1 - z.factor) * 0.18;
        ball.vy *= 1 - (1 - z.factor) * 0.18;
      }
    });
    this.acidZones.forEach((z) => {
      if (ball.x > z.x && ball.x < z.x + z.w && ball.y > z.y && ball.y < z.y + z.h) {
        z.tick += dt;
        if (z.tick > 1) {
          z.tick = 0;
          ball.damage(1);
        }
      } else {
        z.tick = 0;
      }
    });
  }

  resolveGeometry(ball) {
    ball.x = clamp(ball.x, TABLE_X + BALL_R, TABLE_X + TABLE_W - BALL_R);
    this.platforms.forEach((p) => p.collide(ball, this));
    if (this.boss.defeated && ball.y < 120) this.game.completeLevel();
  }

  draw(ctx, cameraY) {
    this.drawWerewolfBody(ctx, cameraY);
    this.platforms.forEach((p) => p.draw(ctx, cameraY));
    this.acidZones.forEach((z) => {
      ctx.fillStyle = "rgba(120, 255, 80, .38)";
      ctx.fillRect(z.x, z.y - cameraY, z.w, z.h);
    });
    this.claws.forEach((c) => c.draw(ctx, cameraY));
    this.vocalBars.forEach((bar) => {
      const y = bar.y + Math.sin(performance.now() * 0.01 + bar.phase) * 10;
      ctx.fillStyle = "#e8dcc8";
      ctx.fillRect(bar.x, y - cameraY, bar.w, bar.h);
    });
    this.bumpers.forEach((b) => b.draw(ctx, cameraY));
    this.flippers.forEach((f) => {
      f.setActive(f.side === "left" ? this.game.leftPressed : this.game.rightPressed);
      f.draw(ctx, cameraY);
    });
    this.boss.draw(ctx, cameraY);
  }

  drawWerewolfBody(ctx, cameraY) {
    ctx.fillStyle = "#0d0d2b";
    ctx.fillRect(TABLE_X, 0, TABLE_W, H);
    const parallaxY = cameraY * 0.95;
    const headY = 0 - parallaxY;
    if (headY < H && headY + 950 > 0) drawCover(ctx, IMAGES.werewolfBoss, TABLE_X, headY, TABLE_W, 950, 0.86);
    const cx = TABLE_X + TABLE_W / 2;
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = "#2c1a0e";
    ctx.fillRect(cx - 160, 2400 - parallaxY, 320, 1000);
    ctx.fillRect(cx - 250, 3400 - parallaxY, 185, 800);
    ctx.fillRect(cx + 65, 3400 - parallaxY, 185, 800);
    ctx.fillRect(TABLE_X + 70, 1600 - parallaxY, 210, 780);
    ctx.fillRect(TABLE_X + TABLE_W - 280, 1600 - parallaxY, 210, 780);
    ctx.fillRect(TABLE_X + 55, 4200 - parallaxY, 285, 520);
    ctx.fillRect(TABLE_X + TABLE_W - 340, 4200 - parallaxY, 285, 520);
    ctx.fillStyle = "#e8dcc8";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(cx - 230, 3220 - i * 140 - parallaxY, 180, 12);
      ctx.fillRect(cx + 50, 3220 - i * 140 - parallaxY, 180, 12);
    }
    ctx.fillStyle = "#4a4a5a";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(TABLE_X + 80 + i * 88, 4685 - parallaxY + (i % 2) * 18, 58, 18);
    }
    ctx.restore();
  }
}

class LedgeRuinsLevel extends Level {
  constructor(index, game) {
    super(index, game);
    this.meta = {
      name: "Bulga Sky Ruins",
      age: "Playable Ledge Table",
      palette: { bg: "#08111d", stone: "#b99057", glow: "#ffd671", accent: "#63d6c7", danger: "#d64639" },
      boss: "The Upper Gate",
    };
    this.boss = new BossWolf(this);
    this.bumpers = [];
    this.flippers = [];
    this.hazards = [];
    this.platforms = [];
    this.enemies = [];
    this.bats = [];
    this.walkers = [];
    this.pickups = [];
    this.werewolfSet = [];
    this.gates = [];
    this.buildLedgeRuins();
  }

  buildLedgeRuins() {
    const L = TABLE_X;
    const R = TABLE_X + TABLE_W;
    const C = TABLE_X + TABLE_W / 2;
    this.flippers.push(new Flipper("left", L + 120, WORLD_H - 126, 275));
    this.flippers.push(new Flipper("right", R - 120, WORLD_H - 126, 275));
    this.flippers.push(new Flipper("left", L + 130, WORLD_H - 510, 170));
    this.flippers.push(new Flipper("right", R - 130, WORLD_H - 510, 170));
    this.flippers.push(new Flipper("left", L + 155, WORLD_H - 1330, 150));
    this.flippers.push(new Flipper("right", R - 155, WORLD_H - 2090, 150));

    for (let base = WORLD_H - 760; base >= 0; base -= 760) {
      this.platforms.push(new Platform(L + 28, base + 710, R - 28, base + 710, 22, "stone"));
      this.platforms.push(new Platform(L + 45, base + 420, L + 275, base + 420, 20, "stone"));
      this.platforms.push(new Platform(C - 95, base + 315, C + 95, base + 315, 18, "stone"));
      this.platforms.push(new Platform(R - 305, base + 260, R - 72, base + 260, 20, "stone"));
      this.platforms.push(new Platform(L + 90, base + 615, L + 235, base + 520, 18, "ramp"));
      this.platforms.push(new Platform(R - 90, base + 610, R - 245, base + 510, 18, "ramp"));
      this.bumpers.push(new Bumper(C + Math.sin(base) * 120, base + 490, 26, "", "#d4a45f"));
      this.bumpers.push(new Bumper(R - 170, base + 380, 20, "", "#63d6c7"));
      this.pickups.push(new PurpleLifePickup(C + (base % 2 ? -150 : 150), base + 185));
    }
    this.addCurvedRamp(C - 210, WORLD_H - 1125, 175, 350, -1.45, 1.2, 18);
    this.addCurvedRamp(C + 175, WORLD_H - 1885, 190, 300, 1.75, 4.45, 18);
    this.addCurvedRamp(C - 185, WORLD_H - 2620, 205, 340, -1.35, 1.45, 18);
    this.addCurvedRamp(C + 210, WORLD_H - 3345, 180, 360, 1.85, 4.6, 18);
    this.addCurvedRamp(C - 70, WORLD_H - 4160, 245, 260, -0.25, 2.85, 20);

    [
      [L + 210, WORLD_H - 50, L + 70, L + 340, 0],
      [C + 20, WORLD_H - 445, C - 125, C + 125, 2],
      [L + 175, WORLD_H - 725, L + 70, L + 315, 4],
      [L + 180, WORLD_H - 2050, L + 75, L + 305, 2],
      [C + 10, WORLD_H - 4040, C - 115, C + 145, 1],
    ].forEach(([x, y, minX, maxX, sprite]) => this.walkers.push(new WalkerMonster(x, y, minX, maxX, sprite)));

    [
      [C, WORLD_H - 960, L + 110, R - 110],
      [R - 185, WORLD_H - 1780, C - 80, R - 95],
      [L + 230, WORLD_H - 2490, L + 95, C + 80],
      [C + 135, WORLD_H - 3260, C - 50, R - 105],
    ].forEach(([x, y, minX, maxX]) => this.bats.push(new FlyingRedBat(x, y, minX, maxX)));

    this.gates.push({ x: L + 248, y: 310, w: 304, h: 26 });
    this.werewolfSet.push({ x: R - 155, y: WORLD_H - 1540, s: 0.56, flip: true, bob: 0 });
    this.werewolfSet.push({ x: L + 155, y: WORLD_H - 3120, s: 0.52, flip: false, bob: 1.4 });
  }

  addCurvedRamp(cx, cy, rx, ry, start, end, width) {
    const steps = 11;
    let px = cx + Math.cos(start) * rx;
    let py = cy + Math.sin(start) * ry;
    for (let i = 1; i <= steps; i++) {
      const a = start + ((end - start) * i) / steps;
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      this.platforms.push(new Platform(px, py, x, y, width, "curve"));
      px = x;
      py = y;
    }
  }

  update(dt, ball) {
    super.update(dt, ball);
    this.pickups.forEach((pickup) => pickup.update(dt, ball, this.game));
    this.pickups = this.pickups.filter((pickup) => pickup.alive);
  }

  resolveGeometry(ball) {
    this.collideSegment(ball, TABLE_X + 36, WORLD_H - 92, TABLE_X + TABLE_W - 36, WORLD_H - 92, 26);
    this.collideSegment(ball, TABLE_X + TABLE_W - 108, WORLD_H - 360, TABLE_X + TABLE_W - 108, WORLD_H - 64, 16);
    this.platforms.forEach((p) => p.collide(ball, this));
    if (!this.boss.defeated) {
      this.gates.forEach((g) => {
        const cx = clamp(ball.x, g.x, g.x + g.w);
        const cy = clamp(ball.y, g.y, g.y + g.h);
        if (dist(ball.x, ball.y, cx, cy) < BALL_R) {
          ball.y = g.y + g.h + BALL_R;
          ball.vy = Math.abs(ball.vy) * 0.82;
          this.game.audio.sfx("wall");
        }
      });
    } else if (ball.y < 220) {
      this.game.completeLevel();
    }
  }

  draw(ctx, cameraY) {
    this.drawLedgeBackground(ctx, cameraY);
    this.drawWerewolfSet(ctx, cameraY);
    this.platforms.forEach((p) => p.draw(ctx, cameraY));
    this.pickups.forEach((pickup) => pickup.draw(ctx, cameraY));
    this.bumpers.forEach((b) => b.draw(ctx, cameraY));
    this.walkers.forEach((w) => w.draw(ctx, cameraY));
    this.bats.forEach((b) => b.draw(ctx, cameraY));
    this.gates.forEach((g) => {
      if (this.boss.defeated) return;
      ctx.fillStyle = "rgba(20, 16, 24, .72)";
      ctx.fillRect(g.x, g.y - cameraY, g.w, g.h);
      ctx.fillStyle = "#ffd671";
      for (let x = g.x; x < g.x + g.w; x += 22) ctx.fillRect(x, g.y - cameraY, 10, g.h);
    });
    this.boss.draw(ctx, cameraY);
    this.flippers.forEach((f) => {
      f.setActive(f.side === "left" ? this.game.leftPressed : this.game.rightPressed);
      f.draw(ctx, cameraY);
    });
  }

  drawLedgeBackground(ctx, cameraY) {
    ctx.fillStyle = "#02050a";
    ctx.fillRect(TABLE_X, 0, TABLE_W, H);
    const tileH = 760;
    for (let y = WORLD_H - tileH; y >= -tileH; y -= tileH) {
      const sy = y - cameraY * 0.98;
      if (sy > H || sy + tileH < -120) continue;
      if (!drawCover(ctx, IMAGES.ledgeBg, TABLE_X, sy, TABLE_W, tileH, 1)) {
        ctx.fillStyle = "#08111d";
        ctx.fillRect(TABLE_X, sy, TABLE_W, tileH);
      }
    }
    this.drawDarkArchitecture(ctx, cameraY);
    ctx.fillStyle = "rgba(2, 5, 10, .08)";
    ctx.fillRect(TABLE_X, 0, TABLE_W, H);
    ctx.strokeStyle = "rgba(255, 214, 113, .42)";
    ctx.lineWidth = 8;
    ctx.strokeRect(TABLE_X + 7, -cameraY + 12, TABLE_W - 14, WORLD_H - 24);
  }

  drawWerewolfSet(ctx, cameraY) {
    const sprite = getCutoutSprite("neonWerewolf", IMAGES.neonWerewolf);
    if (!sprite) return;
    this.werewolfSet.forEach((wolf) => {
      const y = wolf.y - cameraY + Math.sin(performance.now() * 0.0025 + wolf.bob) * 5;
      if (y < -180 || y > H + 180) return;
      const w = 250 * wolf.s;
      const h = 250 * wolf.s;
      ctx.save();
      ctx.translate(Math.round(wolf.x), Math.round(y));
      if (wolf.flip) ctx.scale(-1, 1);
      ctx.globalAlpha = 0.92;
      ctx.shadowColor = "#ff40b7";
      ctx.shadowBlur = 10;
      ctx.drawImage(sprite, -w / 2, -h, w, h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,0,0,.36)";
      ctx.fillRect(-w * 0.4, -10, w * 0.8, 12);
      ctx.restore();
    });
  }

  drawDarkArchitecture(ctx, cameraY) {
    for (let y = 260; y < WORLD_H; y += 620) {
      const sy = y - cameraY * 0.92;
      if (sy < -220 || sy > H + 80) continue;
      ctx.fillStyle = "rgba(11, 10, 18, .42)";
      ctx.fillRect(TABLE_X + 90, sy + 120, 230, 260);
      ctx.fillRect(TABLE_X + TABLE_W - 320, sy + 18, 230, 290);
      ctx.fillStyle = "rgba(88, 78, 92, .36)";
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(TABLE_X + 105 + i * 25, sy + 140, 12, 210);
        ctx.fillRect(TABLE_X + TABLE_W - 300 + i * 25, sy + 45, 12, 225);
      }
      ctx.fillStyle = "rgba(115, 108, 92, .28)";
      ctx.fillRect(TABLE_X + 48, sy, 80, 460);
      ctx.fillRect(TABLE_X + TABLE_W - 128, sy + 65, 80, 420);
      ctx.fillStyle = "rgba(183, 155, 100, .2)";
      ctx.fillRect(TABLE_X + 54, sy + 24, 68, 12);
      ctx.fillRect(TABLE_X + TABLE_W - 122, sy + 90, 68, 12);
    }
  }
}

class Game {
  constructor() {
    this.audio = new AudioSystem();
    this.keys = new Set();
    this.state = "title";
    this.menuIndex = 0;
    this.settingsIndex = 0;
    this.settings = { volume: 0.28, speed: "normal", crt: true, mobileMode: false, steamMode: false };
    this.mode = "game";
    this.currentLevel = 0;
    this.savedLevel = 0;
    this.score = 0;
    this.newGamePlus = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.spacePressed = false;
    this.plungerCharging = false;
    this.plungerPower = 0;
    this.chargeBeep = 0;
    this.aim = { x: -0.35, y: -0.94 };
    this.shots = [];
    this.level = new LedgeRuinsLevel(0, this);
    this.ball = new Ball(this);
    this.cameraY = WORLD_H - H;
    this.particles = [];
    this.shake = 0;
    this.message = "";
    this.messageTime = 0;
    this.saveAnim = 0;
    this.last = performance.now();
    this.bind();
    this.initDomMenu();
    requestAnimationFrame((t) => this.loop(t));
  }

  bind() {
    addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      if (e.code === "KeyA" || e.code === "ArrowLeft") this.leftPressed = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") this.rightPressed = true;
      if (this.state === "playing" && e.code === "Space" && !this.ball.launched) {
        this.spacePressed = true;
        this.plungerCharging = true;
      }
      if (!e.repeat) this.handlePress(e);
      this.keys.add(e.code);
    });
    addEventListener("keyup", (e) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") this.leftPressed = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") this.rightPressed = false;
      if (e.code === "Space") {
        this.spacePressed = false;
        if (this.state === "playing" && this.plungerCharging) this.releasePlunger();
      }
      this.keys.delete(e.code);
    });
    canvas.addEventListener("pointerdown", (e) => {
      this.audio.init();
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      if (this.state === "title" || this.state === "settings" || this.state === "credits" || this.state === "teaser") {
        this.clickMenu(x, y);
      } else {
        if (this.handleGameTouch(x, y)) return;
        this.updateAimFromScreen(x, y);
        this.fireShot();
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      if (this.state === "playing") this.updateAimFromScreen(x, y);
    });
    addEventListener("pointerup", () => {
      this.leftPressed = false;
      this.rightPressed = false;
    });
  }

  initDomMenu() {
    this.menuScreen = document.getElementById("menu-screen");
    this.domMenuItems = Array.from(document.querySelectorAll("[data-menu-index]"));
    this.hiscoreEl = document.getElementById("hiscore");
    const starsEl = document.getElementById("menu-stars");
    if (starsEl && !starsEl.children.length) {
      for (let i = 0; i < 60; i++) {
        const star = document.createElement("span");
        const size = Math.random() < 0.7 ? 1 : Math.random() < 0.85 ? 2 : 3;
        star.className = "star";
        star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 70}%;--d:${1.5 + Math.random() * 3}s;--a1:${0.1 + Math.random() * 0.3};--a2:${0.6 + Math.random() * 0.4};--delay:${Math.random() * 3}s`;
        starsEl.appendChild(star);
      }
    }
    this.domMenuItems.forEach((item) => {
      const index = Number(item.dataset.menuIndex);
      item.addEventListener("pointerenter", () => {
        if (this.state !== "title") return;
        this.audio.init();
        if (this.menuIndex !== index) this.audio.sfx("menu");
        this.menuIndex = index;
        this.syncDomMenu();
      });
      item.addEventListener("focus", () => {
        if (this.state === "title") {
          this.menuIndex = index;
          this.syncDomMenu();
        }
      });
      item.addEventListener("click", () => {
        if (this.state !== "title") return;
        this.audio.init();
        this.menuIndex = index;
        this.navTitle("Enter");
        this.syncDomMenu();
      });
    });
    this.syncDomMenu();
  }

  syncDomMenu() {
    if (!this.menuScreen) return;
    this.menuScreen.classList.toggle("hidden", this.state !== "title");
    this.domMenuItems.forEach((item) => {
      item.classList.toggle("active", Number(item.dataset.menuIndex) === this.menuIndex);
    });
    if (this.hiscoreEl) this.hiscoreEl.textContent = String(Math.max(this.score, 0)).padStart(6, "0").slice(-6);
  }

  gameTouchButtons() {
    return [
      { label: "◀", action: "left", x: 26, y: H - 82, w: 74, h: 56 },
      { label: "▶", action: "right", x: 112, y: H - 82, w: 74, h: 56 },
      { label: "⤒", action: "jump", x: W - 188, y: H - 82, w: 74, h: 56 },
      { label: "✦", action: "shot", x: W - 100, y: H - 82, w: 74, h: 56 },
    ];
  }

  handleGameTouch(x, y) {
    if (!this.settings.mobileMode) return false;
    const button = this.gameTouchButtons().find((b) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h);
    if (!button) return false;
    if (button.action === "left") this.leftPressed = true;
    if (button.action === "right") this.rightPressed = true;
    if (button.action === "jump") {
      if (!this.ball.launched) {
        this.plungerPower = 0.9;
        this.releasePlunger();
      } else {
        this.setAim((this.rightPressed ? 1 : 0) - (this.leftPressed ? 1 : 0), -1);
        this.ball.tryJump("pulse");
      }
    }
    if (button.action === "shot") this.fireShot();
    this.audio.sfx(button.action === "shot" ? "shoot" : "menu");
    return true;
  }

  handlePress(e) {
    this.audio.init();
    const code = e.code === "KeyW" ? "ArrowUp" : e.code === "KeyS" ? "ArrowDown" : e.code;
    if (e.code === "Escape") {
      this.state = "title";
      return;
    }
    if (this.state === "title") return this.navTitle(code);
    if (this.state === "settings") return this.navSettings(code);
    if (this.state === "credits" || this.state === "teaser" || this.state === "levelComplete") {
      if (e.code === "Enter" || e.code === "Space") this.state = "title";
      return;
    }
    if (this.state !== "playing") return;
    if (e.code === "Space" && this.ball.launched) {
      this.setAim((this.rightPressed ? 1 : 0) - (this.leftPressed ? 1 : 0), -1);
      this.ball.tryJump("pulse");
    }
    if (e.code === "KeyR") this.ball.nudge();
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.ball.nudge();
    if (e.code === "KeyF") this.fireShot();
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      this.setAim(0, -1);
      this.ball.bufferJump();
    }
    if (e.code === "KeyS" || e.code === "ArrowDown") {
      this.setAim(0, 1);
      this.ball.tryJump("slam");
    }
    if (e.code === "KeyQ") {
      this.setAim(-0.75, -0.66);
      this.ball.tryJump("side");
    }
    if (e.code === "KeyE") {
      this.setAim(0.75, -0.66);
      this.ball.tryJump("side");
    }
  }

  navTitle(code) {
    const count = 5;
    const before = this.menuIndex;
    if (code === "ArrowUp") this.menuIndex = (this.menuIndex + count - 1) % count;
    if (code === "ArrowDown") this.menuIndex = (this.menuIndex + 1) % count;
    if (before !== this.menuIndex) this.audio.sfx("menu");
    if (code === "Enter" || code === "Space") {
      this.audio.sfx("select");
      if (this.menuIndex === 0) this.start(false);
      if (this.menuIndex === 1) this.start(true);
      if (this.menuIndex === 2) this.state = "settings";
      if (this.menuIndex === 3) this.state = "credits";
      if (this.menuIndex === 4) this.flash("Levels 9-12 are locked for future expeditions.");
    }
  }

  navSettings(code) {
    const count = 5;
    const before = this.settingsIndex;
    if (code === "ArrowUp") this.settingsIndex = (this.settingsIndex + count - 1) % count;
    if (code === "ArrowDown") this.settingsIndex = (this.settingsIndex + 1) % count;
    if (before !== this.settingsIndex) this.audio.sfx("menu");
    if (code === "ArrowLeft" || code === "ArrowRight" || code === "Enter" || code === "Space") {
      this.audio.sfx("select");
      if (this.settingsIndex === 0) {
        this.settings.volume = clamp(this.settings.volume + (code === "ArrowLeft" ? -0.07 : 0.07), 0, 0.7);
        this.audio.setVolume(this.settings.volume);
      }
      if (this.settingsIndex === 1) {
        const speeds = ["slow", "normal", "fast"];
        const i = speeds.indexOf(this.settings.speed);
        this.settings.speed = speeds[(i + (code === "ArrowLeft" ? 2 : 1)) % speeds.length];
      }
      if (this.settingsIndex === 2) this.settings.crt = !this.settings.crt;
      if (this.settingsIndex === 3) this.settings.mobileMode = !this.settings.mobileMode;
      if (this.settingsIndex === 4) this.settings.steamMode = !this.settings.steamMode;
    }
    if (code === "Escape") this.state = "title";
  }

  clickMenu(x, y) {
    const nav = this.menuNavButtons();
    for (const button of nav) {
      if (x > button.x && x < button.x + button.w && y > button.y && y < button.y + button.h) {
        this.audio.sfx(button.action === "select" ? "select" : "menu");
        if (this.state === "title") this.navTitle(button.action === "up" ? "ArrowUp" : button.action === "down" ? "ArrowDown" : "Enter");
        else if (this.state === "settings") this.navSettings(button.action === "up" ? "ArrowUp" : button.action === "down" ? "ArrowDown" : "Enter");
        else this.state = "title";
        return;
      }
    }
    if (this.state === "title") {
      const buttons = this.titleButtons();
      buttons.forEach((b, i) => {
        if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
          if (this.menuIndex !== i) this.audio.sfx("menu");
          this.menuIndex = i;
          this.navTitle("Enter");
        }
      });
    } else if (this.state === "settings") {
      const rows = this.settingsRows();
      rows.forEach((row, i) => {
        if (x > row.x && x < row.x + row.w && y > row.y && y < row.y + row.h) {
          if (this.settingsIndex !== i) this.audio.sfx("menu");
          this.settingsIndex = i;
          this.navSettings("Enter");
        }
      });
    } else {
      this.state = "title";
    }
  }

  start(demo) {
    this.mode = demo ? "demo" : "game";
    this.currentLevel = this.savedLevel;
    this.score = 0;
    this.audio.chooseStageTrack();
    this.loadLevel(this.currentLevel);
    this.state = "playing";
    this.message = "";
    this.messageTime = 0;
  }

  loadLevel(index) {
    this.level = new LedgeRuinsLevel(index, this);
    this.ball = new Ball(this);
    this.leftPressed = false;
    this.rightPressed = false;
    this.spacePressed = false;
    this.plungerCharging = false;
    this.plungerPower = 0;
    this.shots = [];
    this.cameraY = WORLD_H - H;
    this.saveAnim = 0;
  }

  loseLife() {
    this.audio.sfx("drain");
    this.currentLevel = this.savedLevel;
    this.flash(`Fell back to Level ${this.currentLevel + 1}. Begin again.`);
    this.loadLevel(this.currentLevel);
  }

  restartLevel(reason) {
    this.flash(reason);
    this.loadLevel(this.currentLevel);
  }

  completeLevel() {
    if (this.state !== "playing") return;
    if (this.mode === "demo" || this.currentLevel === 0) {
      this.state = "teaser";
      return;
    }
    this.currentLevel += 1;
    if (SAVE_LEVELS.has(this.currentLevel)) {
      this.savedLevel = this.currentLevel;
      this.saveAnim = 3;
      this.audio.sfx("save");
    }
    if (this.currentLevel >= 8) {
      this.newGamePlus += 1;
      this.currentLevel = 0;
      this.savedLevel = 0;
      this.flash(`New Game+ ${this.newGamePlus}: the wolves quicken.`);
    }
    this.audio.chooseStageTrack();
    this.loadLevel(this.currentLevel);
  }

  addParticles(x, y, color, count) {
    this.particles.push(new Particle(x, y, color, count));
  }

  flash(text) {
    this.message = text;
    this.messageTime = 2.6;
  }

  setAim(x, y) {
    const len = Math.hypot(x, y) || 1;
    this.aim.x = x / len;
    this.aim.y = y / len;
  }

  updateAimFromScreen(screenX, screenY) {
    const dx = screenX - this.ball.x;
    const dy = screenY + this.cameraY - this.ball.y;
    this.setAim(dx, dy);
  }

  fireShot() {
    if (this.state !== "playing" || this.ball.shots <= 0) return;
    this.ball.shots -= 1;
    this.shots.push(new PurpleShot(this.ball.x + this.aim.x * 18, this.ball.y + this.aim.y * 18, this.aim.x, this.aim.y));
    this.ball.vx -= this.aim.x * 40;
    this.ball.vy -= this.aim.y * 40;
    this.audio.sfx("shoot");
    ["#c77dff", "#72fff0", "#ffd078", "#ff7474"].forEach((color) => this.addParticles(this.ball.x, this.ball.y, color, 3));
  }

  releasePlunger() {
    const power = clamp(this.plungerPower, 0.14, 1);
    this.plungerCharging = false;
    this.plungerPower = 0;
    const inLane = this.ball.y > WORLD_H - 340 && this.ball.x > TABLE_X + TABLE_W - 135;
    if (inLane) {
      this.ball.launch(power);
      this.audio.sfx("plunger");
      this.shake = Math.max(this.shake, 5 + power * 8);
    } else {
      this.audio.sfx("wall");
    }
  }

  update(dt) {
    this.audio.update(dt, this.state === "playing" ? "game" : "menu");
    this.syncDomMenu();
    if (this.messageTime > 0) this.messageTime -= dt;
    if (this.saveAnim > 0) this.saveAnim -= dt;
    if (this.state !== "playing") return;
    if (this.plungerCharging) {
      this.plungerPower = (this.plungerPower + dt * 0.82) % 1.08;
      if (this.plungerPower > 1) this.plungerPower = 1 - (this.plungerPower - 1) * 0.45;
      this.chargeBeep -= dt;
      if (this.chargeBeep <= 0) {
        this.chargeBeep = 0.22;
        this.audio.sfx("charge");
      }
    }
    this.ball.update(dt, this.level);
    this.level.update(dt, this.ball);
    this.shots.forEach((shot) => shot.update(dt, this));
    this.shots = this.shots.filter((shot) => shot.alive);
    this.cameraY = clamp(this.ball.y - H * 0.62, 0, WORLD_H - H);
    this.particles.forEach((p) => p.update(dt));
    this.particles = this.particles.filter((p) => p.bits.length);
    this.shake = Math.max(0, this.shake - 30 * dt);
  }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.draw();
    requestAnimationFrame((n) => this.loop(n));
  }

  draw() {
    ctx.save();
    const sx = this.shake ? rand(-this.shake, this.shake) : 0;
    const sy = this.shake ? rand(-this.shake, this.shake) : 0;
    ctx.translate(Math.round(sx), Math.round(sy));
    ctx.clearRect(-20, -20, W + 40, H + 40);
    if (this.state === "playing") this.drawGame();
    else if (this.state === "settings") this.drawSettings();
    else if (this.state === "credits") this.drawCredits();
    else if (this.state === "teaser") this.drawTeaser();
    else this.drawTitle();
    ctx.restore();
    if (this.settings.crt) this.drawCrt();
  }

  drawGame() {
    try {
      this.level.draw(ctx, this.cameraY);
    } catch (error) {
      this.drawEmergencyPlayfield();
    }
    this.drawSpotlight();
    this.shots.forEach((shot) => shot.draw(ctx, this.cameraY));
    this.particles.forEach((p) => p.draw(ctx, this.cameraY));
    this.ball.draw(ctx, this.cameraY);
    this.drawPlunger();
    this.drawHud();
    if (this.settings.mobileMode) this.drawGameTouchButtons();
    if (this.saveAnim > 0) this.drawSavePoint();
  }

  drawEmergencyPlayfield() {
    ctx.fillStyle = "#08111d";
    ctx.fillRect(TABLE_X, 0, TABLE_W, H);
    ctx.strokeStyle = "#c6a979";
    ctx.lineWidth = 14;
    for (let y = H - 80; y > -80; y -= 120) {
      ctx.beginPath();
      ctx.moveTo(TABLE_X + 60, y);
      ctx.lineTo(TABLE_X + TABLE_W - 60, y - 52);
      ctx.stroke();
    }
  }

  drawSpotlight() {
    const bx = this.ball.x;
    const by = this.ball.y - this.cameraY;
    ctx.save();
    const g = ctx.createRadialGradient(bx, by, 8, bx, by, 170);
    g.addColorStop(0, "rgba(145, 235, 255, .22)");
    g.addColorStop(0.45, "rgba(112, 92, 185, .08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(TABLE_X, 0, TABLE_W, H);
    ctx.restore();
  }

  drawGameTouchButtons() {
    this.gameTouchButtons().forEach((button) => {
      const active = (button.action === "left" && this.leftPressed) || (button.action === "right" && this.rightPressed);
      ctx.fillStyle = active ? "rgba(212, 164, 95, .82)" : "rgba(5, 8, 13, .68)";
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.strokeStyle = active ? "#fff1a6" : "#72fff0";
      ctx.strokeRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = active ? "#0b0610" : "#ffd671";
      ctx.font = "28px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    });
    ctx.textBaseline = "alphabetic";
  }

  drawHud() {
    ctx.fillStyle = "rgba(3, 4, 9, 0.58)";
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = "#f7e6a1";
    ctx.font = "16px Courier New";
    ctx.textAlign = "center";
    const progress = 1 - this.ball.y / WORLD_H;
    ctx.fillStyle = "#33212b";
    ctx.fillRect(W / 2 - 120, 20, 240, 8);
    ctx.fillStyle = "#63d6c7";
    ctx.fillRect(W / 2 - 120, 20, 240 * progress, 8);
    ctx.textAlign = "left";
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.globalAlpha = i < this.ball.hp ? 1 : 0.22;
      ctx.shadowColor = this.ball.hp <= 2 ? "#ff4747" : "#c77dff";
      ctx.shadowBlur = i < this.ball.hp ? 8 : 0;
      ctx.font = "21px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👾", 27 + i * 27, 31);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(255, 230, 130, .66)";
    ctx.font = "12px Courier New";
    ctx.fillText("A / D", TABLE_X + 20, 31);
    ctx.textAlign = "right";
    ctx.fillText("NO SAFETY NET", TABLE_X + TABLE_W - 20, 31);
  }

  drawPlunger() {
    const x = TABLE_X + TABLE_W - 52;
    const y = WORLD_H - 268 - this.cameraY;
    const power = clamp(this.plungerPower, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(5, 8, 13, .72)";
    ctx.fillRect(x - 22, y, 44, 210);
    ctx.strokeStyle = "#8aa6ad";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 22, y, 44, 210);
    ctx.fillStyle = "#111820";
    ctx.fillRect(x - 13, y + 18, 26, 155);
    ctx.fillStyle = "#c79755";
    for (let yy = y + 28; yy < y + 166; yy += 22) ctx.fillRect(x - 11, yy, 22, 5);
    const pull = 22 + power * 84;
    ctx.fillStyle = "#e9f7f7";
    ctx.fillRect(x - 17, y + 154 + pull * 0.22, 34, 15);
    ctx.fillStyle = "#72fff0";
    ctx.fillRect(x - 30, y + 194 - power * 170, 8, power * 170);
    ctx.strokeStyle = "#ffd078";
    ctx.strokeRect(x - 31, y + 24, 10, 170);
    ctx.fillStyle = "#ffe082";
    ctx.font = "10px Courier New";
    ctx.textAlign = "center";
    if (this.plungerCharging) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#72fff0";
      ctx.fillRect(x - 18, y + 176, 36, 6);
    }
    ctx.restore();
  }

  drawMiniMap(progress) {
    const x = W - 38;
    const y = 82;
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.fillRect(x, y, 12, 300);
    ctx.strokeStyle = "#77533f";
    ctx.strokeRect(x, y, 12, 300);
    ctx.fillStyle = "#72fff0";
    ctx.fillRect(x - 4, y + 300 - progress * 300 - 2, 20, 4);
    ctx.fillStyle = "#d64639";
    ctx.fillRect(x - 2, y + 28, 16, 4);
  }

  drawToast(text) {
    ctx.fillStyle = "rgba(12, 7, 14, 0.82)";
    ctx.fillRect(W / 2 - 250, H - 86, 500, 40);
    ctx.strokeStyle = "#d4a45f";
    ctx.strokeRect(W / 2 - 250, H - 86, 500, 40);
    ctx.fillStyle = "#ffe082";
    ctx.font = "15px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, H - 61);
  }

  drawSavePoint() {
    const a = clamp(this.saveAnim / 3, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#72fff0";
    ctx.fillRect(W / 2 - 80, H / 2 - 45, 160, 90);
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(W / 2 - 70, H / 2 - 35, 140, 70);
    ctx.fillStyle = "#ffe082";
    ctx.font = "18px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("SAVE POINT", W / 2, H / 2 - 4);
    ctx.fillText("TABLET AWAKES", W / 2, H / 2 + 21);
    ctx.restore();
  }

  titleButtons() {
    return ["Play Game", "Play Demo", "Settings", "Credits", "DLC 9-12 Locked"].map((label, i) => ({
      label,
      x: W / 2 - 150,
      y: 262 + i * 42,
      w: 300,
      h: 32,
    }));
  }

  menuNavButtons() {
    return [
      { label: "▲", action: "up", x: W - 88, y: H - 172, w: 58, h: 46 },
      { label: "OK", action: "select", x: W - 96, y: H - 120, w: 74, h: 42 },
      { label: "▼", action: "down", x: W - 88, y: H - 72, w: 58, h: 46 },
    ];
  }

  drawMenuNavButtons() {
    this.menuNavButtons().forEach((button) => {
      ctx.fillStyle = "rgba(13, 12, 24, .82)";
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.strokeStyle = "#72fff0";
      ctx.strokeRect(button.x, button.y, button.w, button.h);
      ctx.fillStyle = "#ffd671";
      ctx.font = button.label === "OK" ? "16px Courier New" : "24px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    });
    ctx.textBaseline = "alphabetic";
  }

  settingsRows() {
    return this.settingsLines().map((label, i) => ({
      label,
      x: W / 2 - 205,
      y: 192 + i * 48,
      w: 410,
      h: 34,
    }));
  }

  settingsLines() {
    return [
      `Volume ${Math.round(this.settings.volume * 100)}%`,
      `Ball Speed ${this.settings.speed.toUpperCase()}`,
      `CRT Effect ${this.settings.crt ? "ON" : "OFF"}`,
      `Mobile Controls ${this.settings.mobileMode ? "ON" : "OFF"}`,
      `Steam Deck Mode ${this.settings.steamMode ? "ON" : "OFF"}`,
    ];
  }

  drawTitle() {
    ctx.fillStyle = "#08050e";
    ctx.fillRect(0, 0, W, H);
    drawCover(ctx, IMAGES.backgrounds[3], 0, 0, W, H, 0.62);
    drawCover(ctx, IMAGES.backgrounds[1], 0, 0, W, H, 0.28);
    ctx.fillStyle = "rgba(3, 4, 10, .46)";
    ctx.fillRect(0, 0, W, H);
    this.drawMenuBack();
    const t = performance.now() / 1000;
    ctx.textAlign = "center";
    ctx.font = "42px Courier New";
    ctx.fillStyle = "#140b17";
    ctx.fillText("BULGA SPHERE", W / 2 + 4, 146 + 4);
    ctx.fillStyle = "#ffd671";
    ctx.fillText("BULGA SPHERE", W / 2, 146);
    const bx = W / 2 - 300 + ((t * 150) % 600);
    const by = 102 + Math.abs(Math.sin(t * 3.6)) * 55;
    ctx.fillStyle = "#72fff0";
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d0b96f";
    ctx.font = "15px Courier New";
    ctx.fillText("two buttons. one vertical world. fall, then climb back up.", W / 2, 188);
    this.titleButtons().forEach((b, i) => {
      ctx.fillStyle = i === this.menuIndex ? "#d4a45f" : "#241826";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = i === this.menuIndex ? "#72fff0" : "#6f4e36";
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = i === this.menuIndex ? "#0b0610" : "#ffe082";
      ctx.font = "16px Courier New";
      ctx.fillText(b.label, W / 2, b.y + 22);
    });
    this.drawMenuNavButtons();
    if (this.messageTime > 0) this.drawToast(this.message);
  }

  drawMenuBack() {
    for (let i = 0; i < 70; i++) {
      const x = (i * 79 + Math.sin(i) * 30) % W;
      const y = (i * 43 + performance.now() * 0.018) % H;
      ctx.fillStyle = i % 3 ? "rgba(34, 22, 42, .45)" : "rgba(99, 214, 199, .28)";
      ctx.fillRect(x, y, i % 3 ? 14 : 5, i % 3 ? 14 : 5);
    }
  }

  drawSettings() {
    ctx.fillStyle = "#09050d";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd671";
    ctx.font = "34px Courier New";
    ctx.fillText("SETTINGS", W / 2, 130);
    this.settingsRows().forEach((row, i) => {
      ctx.fillStyle = i === this.settingsIndex ? "#d4a45f" : "#241826";
      ctx.fillRect(row.x, row.y, row.w, row.h);
      ctx.fillStyle = i === this.settingsIndex ? "#0b0610" : "#ffe082";
      ctx.font = "17px Courier New";
      ctx.fillText(row.label, W / 2, row.y + 23);
    });
    ctx.fillStyle = "#d0b96f";
    ctx.font = "13px Courier New";
    ctx.fillText("Use arrows, W/S, Enter, or touch buttons. Esc returns.", W / 2, 460);
    this.drawMenuNavButtons();
  }

  drawCredits() {
    ctx.fillStyle = "#09050d";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd671";
    ctx.font = "32px Courier New";
    ctx.fillText("CREDITS", W / 2, 120);
    ctx.fillStyle = "#f7e6a1";
    ctx.font = "17px Courier New";
    ["Bulga Sphere", "HTML5 Canvas and JavaScript", "Wall-bounce pinball traversal, wolf enemies,", "and a giant blue summit boss.", "Click or press Enter to return."].forEach((line, i) => {
      ctx.fillText(line, W / 2, 190 + i * 34);
    });
  }

  drawTeaser() {
    ctx.fillStyle = "#06030a";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#72fff0";
    ctx.font = "34px Courier New";
    ctx.fillText("DEMO COMPLETE", W / 2, 125);
    ctx.fillStyle = "#ffd671";
    ctx.font = "18px Courier New";
    const copy = [
      "The Azure Fenrir shatters into moonlit frost.",
      "Full journey: connected ruins, unlockable traversal routes,",
      "purple shot upgrades, speed routes, and future stage packs.",
      "Press Enter or click to return to the title.",
    ];
    copy.forEach((line, i) => ctx.fillText(line, W / 2, 202 + i * 38));
  }

  drawCrt() {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = "#000";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 560);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

window.__pinballGame = new Game();
