"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 960;
const WORLD_H = 3200;
const GRAVITY = 1800;
const TOTAL_ORBS = 8;
const CUTOUT_MAX_SIZE = 560;
const MAX_PARTICLES = 120;
const PERFORMANCE_MODE = true;
const GameBalance = {
  difficulty: 1,
  playerDamage: 1,
  enemyDamage: 1,
  enemyHealth: 3,
  enemySpeed: 1.2,
  invincibleTime: 0.9,
};

const GlitcherMovementPolishConfig = {
  acceleration: 5600,
  deceleration: 7600,
  airAcceleration: 3350,
  airDeceleration: 1450,
  maxRunSpeed: 292,
  maxSprintSpeed: 376,
  turnSkidThreshold: 155,
  landingSquashAmount: 0.1,
  landingSquashDuration: 0.13,
  jumpStretchAmount: 0.07,
  capeSpringStrength: 58,
  capeDamping: 12,
  capeWindStrength: 5,
  capeJumpLift: 15,
  capeFallDrag: 18,
  armSwingAmount: 5,
  legStrideAmount: 6,
  bodyLeanAmount: 0.16,
  animationBlendSpeed: 14,
  footPlantBlendSpeed: 18,
};

const GlitcherMotionPlusConfig = {
  runAcceleration: GlitcherMovementPolishConfig.acceleration,
  runDeceleration: GlitcherMovementPolishConfig.deceleration,
  topSpeedVisualThreshold: 300,
  strideLength: 18,
  strideSpeedMin: 10,
  strideSpeedMax: 22,
  kneeBendAmount: 9,
  footPlantLockStrength: 0.82,
  bodyLeanAmount: 0.2,
  shoulderCounterRotateAmount: 0.08,
  armSwingAmount: 7,
  swordRunAngle: 0.42,
  crouchEnterSpeed: 18,
  crouchExitSpeed: 20,
  crouchVisualHeight: 18,
  crouchHitboxEnabled: false,
  crouchHitboxHeight: 64,
  jumpLegTuckAmount: 10,
  airSlashBodyLean: 0.08,
  coatSpeedStretch: 13,
  coatJumpLift: 18,
  coatFallDrag: 20,
  skidDustEnabled: true,
  animationBlendSpeed: 16,
};

const GlitcherVisualCombatMotionConfig = {
  enabled: true,
  baseHeight: 148,
  runHeight: 150,
  crouchHeight: 120,
  jumpHeight: 136,
  attackHeight: 154,
  chargeHeight: 164,
  maxSpriteWidth: 232,
  spriteYOffset: 2,
  attackSpriteYOffset: 4,
  runSpriteYOffset: 3,
  footAnchorX: 0.5,
  auraAlpha: 0.58,
  whiteCutoutPadding: 3,
};

const GlitcherSpriteCombatMotionConfig = {
  animationBlendSpeed: GlitcherMotionPlusConfig.animationBlendSpeed,
  runAcceleration: GlitcherMotionPlusConfig.runAcceleration,
  runDeceleration: GlitcherMotionPlusConfig.runDeceleration,
  topSpeedThreshold: GlitcherMotionPlusConfig.topSpeedVisualThreshold,
  strideLength: GlitcherMotionPlusConfig.strideLength,
  strideSpeed: GlitcherMotionPlusConfig.strideSpeedMax,
  kneeFlex: GlitcherMotionPlusConfig.kneeBendAmount,
  coatPhysicsStrength: GlitcherMovementPolishConfig.capeSpringStrength,
  coatDamping: GlitcherMovementPolishConfig.capeDamping,
  jumpLift: GlitcherMotionPlusConfig.coatJumpLift,
  fallDrag: GlitcherMotionPlusConfig.coatFallDrag,
  crouchTransitionSpeed: GlitcherMotionPlusConfig.crouchEnterSpeed,
  attackBlendWeight: 0.82,
  swordAnchorOffsets: {},
  hitReactionRecovery: 0.28,
  spriteAlignmentOffsets: {},
  transparentCutoutThreshold: 212,
};
const ASSETS = {
  map: "assets/glitcher-ruins-map.jpeg",
  bgArch: "assets/orbs-bg-arch.png",
  bgColumns: "assets/orbs-bg-columns.png",
  bgPinballRuins: "assets/orbs-bg-pinball-ruins.png",
  bgVoidHall: "assets/orbs-bg-void-hall.png",
  openingMap: "assets/orbs-opening-red-moon-stage.png",
  startScreen: "assets/orbs-start-screen-ufo.png",
  endScreen: "assets/orbs-end-screen-a.avif",
  wolfArena: "assets/orbs-wolfgod-arena.png",
  sheet: "assets/orbs-glitcher-patrol-sheet.jpeg",
  glitcher: "assets/orbs-glitcher-main-cut.png",
  glitcherNewIdle: "assets/glitcher_new_idle_clean.png?v=cutout2",
  glitcherNewIdleDance: "assets/glitcher_new_idle_clean_b.png?v=cutout3",
  glitcherNewIdleAlt: "assets/glitcher_new_idle_front.png?v=cutout2",
  glitcherNewRun: "assets/glitcher_new_run_clean.png?v=cutout2",
  glitcherNewRunSword: "assets/glitcher_new_run_sword.png?v=cutout2",
  glitcherNewJump: "assets/glitcher_new_jump.png?v=cutout2",
  glitcherNewFall: "assets/glitcher_new_fall_sword.png?v=cutout2",
  glitcherNewCrouch: "assets/glitcher_new_ready_low.png?v=cutout2",
  glitcherNewCrouchThrust: "assets/glitcher_new_crouch_thrust.png?v=cutout2",
  glitcherNewHurt: "assets/glitcher_new_hurt.png?v=cutout2",
  glitcherNewGuardKneel: "assets/glitcher_new_guard_kneel.png?v=cutout2",
  glitcherNewAttack01: "assets/glitcher_new_thrust.png?v=cutout2",
  glitcherNewAttack02: "assets/glitcher_new_spin_slash.png?v=cutout2",
  glitcherNewAttack03: "assets/glitcher_new_overhead_charge.png?v=cutout2",
  glitcherNewAirAttack: "assets/glitcher_new_ready_wide.png?v=cutout2",
  glitcherNewUpSlash: "assets/glitcher_new_up_slash.png?v=cutout2",
  glitcherNewDownSlash: "assets/glitcher_new_kneel_sword.png?v=cutout2",
  glitcherNewDashSlash: "assets/glitcher_new_run_sword.png?v=cutout2",
  glitcherNewChargeAttack: "assets/glitcher_new_overhead.png?v=cutout2",
  glitcherNewSwordOnly: "assets/glitcher_new_sword_only.png?v=cutout2",
  glitcherIdleSword: "assets/glitcher_idle_sword.png",
  glitcherRunSword: "assets/glitcher_run_sword.png",
  glitcherJumpSword: "assets/glitcher_jump_sword.png",
  glitcherFallSword: "assets/glitcher_fall_sword.png",
  glitcherWallSlide: "assets/glitcher_wall_slide.png",
  glitcherDash: "assets/glitcher_dash.png",
  glitcherAttack01: "assets/glitcher_attack_01.png",
  glitcherAttack02: "assets/glitcher_attack_02.png",
  glitcherAttack03: "assets/glitcher_attack_03.png",
  glitcherAirAttack: "assets/glitcher_air_attack.png",
  glitcherUpSlash: "assets/glitcher_up_slash.png",
  glitcherDownSlash: "assets/glitcher_down_slash.png",
  glitcherDashSlash: "assets/glitcher_dash_slash.png",
  glitcherChargeAttack: "assets/glitcher_charge_attack.png",
  glitcherHurt: "assets/glitcher_hurt.png",
  glitcherDeath: "assets/glitcher_death.png",
  patrol: "assets/orbs-patrol-werewolf-cut.png",
  patrolDog: "assets/orbs-patrol-dog-cut.png",
  boss: "assets/orbs-boss-planitia-gargoyle.png",
  bossVideo: "assets/orbs-blue-wolf-boss-video.mp4",
  endVideo: "assets/orbs-ending-video.mp4",
  menuMusic: "assets/blue-hill-zone-act-2.wav",
  stageMusicA: "assets/emerald-world-zone-orbs.mp3",
  stageMusicB: "assets/emerald-world-zone-alt.mp3",
  stageMusicC: "assets/galaxy-zone-3.mp3",
  endMusic: "assets/encounters-end-theme.mp3",
  swordSound: "assets/sword-slash.mp3",
  orbPickupSfx: "assets/sfx-orb-pickup.mp3",
  orbCoinSfx: "assets/sfx-orb-coin-2.mp3",
  healthSfx: "assets/sfx-health-pickup.mp3",
  swordSliceSfx: "assets/sfx-sword-slice.mp3",
  wolfGrowlSfx: "assets/sfx-wolf-growl.mp3",
  wolfHitSfx: "assets/sfx-wolf-hit.mp3",
  wolfIntroSfx: "assets/sfx-wolf-intro-howl.mp3",
  bossArriveRoarA: "assets/sfx-boss-arrive-roar-a.mp3",
  bossArriveRoarB: "assets/sfx-boss-arrive-roar-b.mp3",
  bossArriveDrone: "assets/sfx-boss-arrive-drone.mp3",
  jumpSfx: "assets/sfx-jump.mp3",
  jumpSpringSfx: "assets/sfx-jump-spring.mp3",
  jump8BitSfx: "assets/sfx-jump-8bit.mp3",
  footstepSfx: "assets/sfx-footstep.mp3",
  monsterBiteSfx: "assets/sfx-monster-bite.mp3",
  glitcherHurtSfx: "assets/sfx-glitcher-hurt.mp3",
  glitcherDeathSfx: "assets/sfx-glitcher-death.mp3",
};

const images = {};
for (const [key, src] of Object.entries(ASSETS)) {
  if (key.endsWith("Music") || key.startsWith("stageMusic") || key.endsWith("Sound") || key.endsWith("Sfx") || key.endsWith("Video")) continue;
  images[key] = new Image();
  images[key].src = src;
}

const videos = {
  boss: document.createElement("video"),
  end: document.createElement("video"),
};
videos.boss.src = ASSETS.bossVideo;
videos.boss.loop = true;
videos.boss.muted = true;
videos.boss.playsInline = true;
videos.boss.preload = "auto";
videos.end.src = ASSETS.endVideo;
videos.end.loop = false;
videos.end.muted = false;
videos.end.playsInline = true;
videos.end.preload = "auto";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.42;
    this.current = null;
    this.tracks = {
      menu: new Audio(ASSETS.menuMusic),
      gameA: new Audio(ASSETS.stageMusicA),
      gameB: new Audio(ASSETS.stageMusicB),
      end: new Audio(ASSETS.endMusic),
    };
    this.swordPool = [
      ...Array.from({ length: 2 }, () => new Audio(ASSETS.swordSound)),
      ...Array.from({ length: 2 }, () => new Audio(ASSETS.swordSliceSfx)),
    ];
    this.swordIndex = 0;
    this.sampleIndex = {};
    this.samples = {
      orb: this.makePool(ASSETS.orbPickupSfx, 3, 0.78),
      orbAlt: this.makePool(ASSETS.orbCoinSfx, 2, 0.7),
      heal: this.makePool(ASSETS.healthSfx, 2, 0.82),
      hurt: this.makePool(ASSETS.glitcherHurtSfx, 3, 0.72),
      death: this.makePool(ASSETS.glitcherDeathSfx, 1, 0.86),
      dogHit: this.makePool(ASSETS.monsterBiteSfx, 3, 0.58),
      dogBark: this.makePool(ASSETS.monsterBiteSfx, 1, 0.1),
      monsterHit: this.makePool(ASSETS.monsterBiteSfx, 2, 0.5),
      wolfHit: this.makePool(ASSETS.wolfHitSfx, 2, 0.68),
      wolfGrowl: this.makePool(ASSETS.wolfGrowlSfx, 1, 0.68),
      wolfIntro: this.makePool(ASSETS.wolfIntroSfx, 1, 0.86),
      bossArriveA: this.makePool(ASSETS.bossArriveRoarA, 1, 0.72, 0.02),
      bossArriveB: this.makePool(ASSETS.bossArriveRoarB, 1, 0.7, 0.02),
      bossDrone: this.makePool(ASSETS.bossArriveDrone, 1, 0.5, 0.04),
      jump: this.makePool(ASSETS.jumpSfx, 2, 0.5, 0.02),
      jumpSpring: this.makePool(ASSETS.jumpSpringSfx, 2, 0.5, 0.03),
      jump8: this.makePool(ASSETS.jump8BitSfx, 3, 0.54, 0.015),
      footstep: this.makePool(ASSETS.footstepSfx, 3, 0.26, 0.01),
      kill: this.makePool(ASSETS.monsterBiteSfx, 2, 0.72),
    };
    Object.values(this.tracks).forEach((track) => {
      track.loop = true;
      track.preload = "auto";
      track.volume = this.volume * 0.42;
    });
    this.swordPool.forEach((sample) => {
      sample.preload = "auto";
      sample.volume = this.volume * 0.48;
      sample._startOffset = 0.015;
      sample.load();
    });
    this.nextStage = false;
  }

  makePool(src, count, volume, startOffset = 0) {
    return Array.from({ length: count }, () => {
      const sample = new Audio(src);
      sample.preload = "auto";
      sample.volume = this.volume * volume;
      sample._startOffset = startOffset;
      sample.load();
      return sample;
    });
  }

  init() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!this.ctx) this.ctx = new AudioCtor();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  music(name) {
    const key = name === "game" ? (this.nextStage ? "gameB" : "gameA") : name;
    const track = this.tracks[key] || this.tracks.menu;
    if (this.current === track) return;
    Object.values(this.tracks).forEach((t) => {
      if (t !== track) t.pause();
    });
    this.current = track;
    if (key === "end") track.currentTime = 0;
    track.volume = this.volume * (key.startsWith("game") ? 0.52 : key === "end" ? 0.58 : 0.38);
    track.play().catch(() => {});
  }

  tone(freq, time, type = "square", gain = 0.12) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = Math.min(0.9, gain * this.volume * 3.4);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + time);
    osc.stop(this.ctx.currentTime + time);
  }

  noise(time, gain = 0.18, filterFreq = 900, type = "bandpass") {
    if (!this.ctx) return;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * time));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    filter.type = type;
    filter.frequency.value = filterFreq;
    filter.Q.value = 3.5;
    amp.gain.value = Math.min(0.9, gain * this.volume * 3.5);
    source.buffer = buffer;
    source.connect(filter).connect(amp).connect(this.ctx.destination);
    source.start();
    amp.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + time);
  }

  sample(name, volume = 1) {
    const pool = this.samples[name];
    if (!pool || !pool.length) return false;
    const index = this.sampleIndex[name] || 0;
    this.sampleIndex[name] = index + 1;
    const sample = pool[index % pool.length];
    sample.pause();
    sample.currentTime = sample._startOffset || 0;
    sample.volume = Math.min(1, this.volume * volume);
    sample.play().catch(() => {});
    return true;
  }

  sfx(name) {
    this.init();
    if (name === "menu" || name === "select") return;
    if (name === "step") return;
    if (name === "monsterStep") return;
    if (name === "sword") {
      const sample = this.swordPool[this.swordIndex++ % this.swordPool.length];
      sample.pause();
      sample.currentTime = sample._startOffset || 0.015;
      sample.volume = Math.min(1, this.volume * 1.15);
      sample.play().catch(() => {});
    }
    if (name === "orb") this.sample(Math.random() > 0.35 ? "orb" : "orbAlt", 0.86);
    if (name === "hurt") this.sample("hurt", 0.82);
    if (name === "death") this.sample("death", 0.9);
    if (name === "dogHit") {
      this.sample("dogHit", 0.62);
    }
    if (name === "dogBark") {
      this.sample("dogBark", 0.12);
    }
    if (name === "monsterHit") {
      this.sample("monsterHit", 0.48);
    }
    if (name === "wolfHit") {
      this.noise(0.11, 0.18, 420, "lowpass");
    }
    if (name === "wolfGrowl") {
      return;
    }
    if (name === "wolfIntro") {
      this.sample("wolfIntro", 0.92);
    }
    if (name === "bossArrive") {
      this.sample("bossDrone", 0.42);
      setTimeout(() => this.sample(Math.random() > 0.5 ? "bossArriveA" : "bossArriveB", 0.76), 160);
    }
    if (name === "jump" || name === "double") {
      const pick = name === "double" ? "jumpSpring" : (Math.random() > 0.45 ? "jump8" : "jump");
      this.sample(pick, name === "double" ? 0.52 : 0.58);
    }
    if (name === "footstep") {
      this.sample("footstep", 0.3);
    }
    if (name === "kill") {
      this.sample("kill", 0.78);
    }
    if (name === "heal") {
      this.sample("heal", 0.86);
    }
    if (name === "boss") {
      this.tone(95, 0.22, "sawtooth", 0.32);
      setTimeout(() => this.tone(180, 0.18, "square", 0.24), 80);
    }
    if (name === "unlock") {
      this.tone(420, 0.08, "square", 0.2);
      setTimeout(() => this.tone(640, 0.08, "square", 0.2), 85);
      setTimeout(() => this.tone(980, 0.14, "triangle", 0.18), 170);
    }
  }
}

const cutoutCache = new Map();
function makeCutout(key, img, sx, sy, sw, sh, fuzz = 42) {
  if (cutoutCache.has(key)) return cutoutCache.get(key);
  if (!img.complete || !img.naturalWidth) return null;
  try {
    const scale = Math.min(1, CUTOUT_MAX_SIZE / Math.max(sw, sh));
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));
    const out = document.createElement("canvas");
    out.width = dw;
    out.height = dh;
    const c = out.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    const data = c.getImageData(0, 0, dw, dh);
    const px = data.data;
    const bg = [px[0], px[1], px[2]];
    for (let i = 0; i < px.length; i += 4) {
      const d = Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
      const darkPaper = px[i] < 13 && px[i + 1] < 13 && px[i + 2] < 13;
      const whitePaper = px[i] > 238 && px[i + 1] > 238 && px[i + 2] > 238;
      const tanPaper = Math.abs(px[i] - 97) + Math.abs(px[i + 1] - 87) + Math.abs(px[i + 2] - 73) < 82;
      if (d < fuzz || darkPaper || whitePaper || tanPaper) px[i + 3] = 0;
    }
    c.putImageData(data, 0, 0);
    cutoutCache.set(key, out);
    return out;
  } catch (error) {
    cutoutCache.set(key, null);
    return null;
  }
}

const lightCutoutCache = new Map();
function makeLightCutout(key, img, sx, sy, sw, sh) {
  if (lightCutoutCache.has(key)) return lightCutoutCache.get(key);
  if (!img.complete || !img.naturalWidth) return null;
  try {
    const scale = Math.min(1, CUTOUT_MAX_SIZE / Math.max(sw, sh));
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));
    const out = document.createElement("canvas");
    out.width = dw;
    out.height = dh;
    const c = out.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    const data = c.getImageData(0, 0, dw, dh);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      const avg = (px[i] + px[i + 1] + px[i + 2]) / 3;
      const lowSaturationBrightPaper = avg > 172 && max - min < 62;
      const whitePaper = px[i] > 218 && px[i + 1] > 218 && px[i + 2] > 218;
      if (whitePaper || lowSaturationBrightPaper) px[i + 3] = 0;
    }
    c.putImageData(data, 0, 0);
    lightCutoutCache.set(key, out);
    return out;
  } catch (error) {
    lightCutoutCache.set(key, null);
    return null;
  }
}

const videoCutoutCanvas = document.createElement("canvas");
videoCutoutCanvas.width = 320;
videoCutoutCanvas.height = 320;
function makeVideoLightCutout(video) {
  if (!video || video.readyState < 2) return null;
  try {
    const c = videoCutoutCanvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, videoCutoutCanvas.width, videoCutoutCanvas.height);
    c.drawImage(video, 0, 0, videoCutoutCanvas.width, videoCutoutCanvas.height);
    const data = c.getImageData(0, 0, videoCutoutCanvas.width, videoCutoutCanvas.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      const avg = (px[i] + px[i + 1] + px[i + 2]) / 3;
      const lowSaturationBrightPaper = avg > 170 && max - min < 66;
      const whitePaper = px[i] > 216 && px[i + 1] > 216 && px[i + 2] > 216;
      if (whitePaper || lowSaturationBrightPaper) px[i + 3] = 0;
    }
    c.putImageData(data, 0, 0);
    return videoCutoutCanvas;
  } catch (error) {
    return null;
  }
}

const floodCutoutCache = new Map();
function makeFloodCutout(key, img, sx, sy, sw, sh) {
  if (floodCutoutCache.has(key)) return floodCutoutCache.get(key);
  if (!img.complete || !img.naturalWidth) return null;
  try {
    const scale = Math.min(1, CUTOUT_MAX_SIZE / Math.max(sw, sh));
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));
    const out = document.createElement("canvas");
    out.width = dw;
    out.height = dh;
    const c = out.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    const data = c.getImageData(0, 0, dw, dh);
    const px = data.data;
    const total = dw * dh;
    const seen = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;
    const isBackground = (p) => {
      const i = p * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const avg = (r + g + b) / 3;
      return (avg < 28 && max < 55) || (avg > 218 && max - min < 70);
    };
    const push = (p) => {
      if (p < 0 || p >= total || seen[p] || !isBackground(p)) return;
      seen[p] = 1;
      queue[tail++] = p;
    };
    for (let x = 0; x < dw; x++) {
      push(x);
      push((dh - 1) * dw + x);
    }
    for (let y = 0; y < dh; y++) {
      push(y * dw);
      push(y * dw + dw - 1);
    }
    while (head < tail) {
      const p = queue[head++];
      const x = p % dw;
      if (x > 0) push(p - 1);
      if (x < dw - 1) push(p + 1);
      if (p >= dw) push(p - dw);
      if (p < total - dw) push(p + dw);
    }
    for (let p = 0; p < total; p++) {
      if (seen[p]) px[p * 4 + 3] = 0;
    }
    c.putImageData(data, 0, 0);
    floodCutoutCache.set(key, out);
    return out;
  } catch (error) {
    floodCutoutCache.set(key, null);
    return null;
  }
}

const trimmedCutoutCache = new Map();
function makeTrimmedCutout(key, img) {
  if (trimmedCutoutCache.has(key)) return trimmedCutoutCache.get(key);
  if (!img || !img.complete || !img.naturalWidth) return null;
  const source = makeFloodCutout(`${key}-flood`, img, 0, 0, img.naturalWidth, img.naturalHeight)
    || makeLightCutout(`${key}-light`, img, 0, 0, img.naturalWidth, img.naturalHeight)
    || makeCutout(`${key}-paper`, img, 0, 0, img.naturalWidth, img.naturalHeight, 54);
  if (!source) return null;
  try {
    const c = source.getContext("2d");
    const data = c.getImageData(0, 0, source.width, source.height);
    const px = data.data;
    const threshold = GlitcherSpriteCombatMotionConfig.transparentCutoutThreshold;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const avg = (r + g + b) / 3;
      const paperWhite = avg > threshold && max - min < 78;
      const paleFringe = avg > 188 && max - min < 34;
      if (paperWhite || paleFringe) px[i + 3] = 0;
    }
    c.putImageData(data, 0, 0);
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        if (px[(y * source.width + x) * 4 + 3] <= 8) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) {
      trimmedCutoutCache.set(key, source);
      return source;
    }
    const pad = GlitcherVisualCombatMotionConfig.whiteCutoutPadding;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(source.width - 1, maxX + pad);
    maxY = Math.min(source.height - 1, maxY + pad);
    const out = document.createElement("canvas");
    out.width = maxX - minX + 1;
    out.height = maxY - minY + 1;
    const oc = out.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    trimmedCutoutCache.set(key, out);
    return out;
  } catch (error) {
    trimmedCutoutCache.set(key, source);
    return source;
  }
}

class Platform {
  constructor(x, y, w, h, kind = "brick") {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.kind = kind;
  }

  isOneWay() {
    return this.h <= 44 && this.kind !== "wall";
  }

  draw(ctx, cam) {
    const y = Math.round(this.y - cam);
    if (y > H + 80 || y + this.h < -80) return;
    const top = this.kind === "stone" ? "#7c9aa0" : this.kind === "bridge" ? "#b27a45" : this.kind === "danger" ? "#d0614e" : "#7a4e54";
    const side = this.kind === "stone" ? "#243c45" : this.kind === "bridge" ? "#3a2430" : this.kind === "danger" ? "#351622" : "#302236";
    ctx.fillStyle = side;
    ctx.fillRect(this.x, y, this.w, this.h);
    ctx.fillStyle = top;
    ctx.fillRect(this.x, y, this.w, Math.min(8, this.h));
    ctx.fillStyle = "rgba(255, 220, 150, .3)";
    for (let x = this.x + 8; x < this.x + this.w - 8; x += 32) ctx.fillRect(x, y + 3, 18, 2);
    if (this.kind === "bridge") {
      ctx.fillStyle = "rgba(0,0,0,.42)";
      for (let x = this.x + 18; x < this.x + this.w; x += 42) ctx.fillRect(x, y + 8, 4, this.h - 8);
    }
    if (this.kind === "danger") {
      ctx.fillStyle = "rgba(255, 80, 120, .58)";
      for (let x = this.x + 12; x < this.x + this.w - 12; x += 46) ctx.fillRect(x, y + 9, 22, 5);
    }
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.strokeRect(this.x, y, this.w, this.h);
  }
}

class BulgaSphere {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.r = 17;
    this.index = index;
    this.collected = false;
    this.phase = Math.random() * 10;
  }

  isGold() {
    return this.index === TOTAL_ORBS - 1;
  }

  rect() {
    return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 };
  }

  update(player, game) {
    if (this.collected || !overlap(this.rect(), player.rect())) return;
    if (this.isGold() && game.boss && !game.boss.dead) {
      game.message = "The final orb is sealed behind the boss lock.";
      game.messageTime = Math.max(game.messageTime, 0.75);
      return;
    }
    this.collected = true;
    game.collected += 1;
    game.score += this.isGold() ? 1500 : 500;
    game.audio.sfx("orb");
    game.burst(this.x, this.y, this.isGold() ? "#ffd671" : "#d8dde6", 18);
  }

  draw(ctx, cam) {
    if (this.collected) return;
    const y = this.y - cam + Math.sin(performance.now() * 0.004 + this.phase) * 6;
    ctx.save();
    ctx.translate(this.x, y);
    ctx.shadowColor = this.isGold() ? "#ffd671" : "#e5edf7";
    ctx.shadowBlur = this.isGold() ? 20 : 12;
    const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, this.r);
    if (this.isGold()) {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.28, "#ffe98f");
      g.addColorStop(0.68, "#d58a20");
      g.addColorStop(1, "#5c2f08");
    } else {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.32, "#d8dde6");
      g.addColorStop(0.7, "#8d96a4");
      g.addColorStop(1, "#3d424c");
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#f0f4fa";
    ctx.stroke();
    if (this.isGold()) {
      ctx.strokeStyle = "rgba(255, 68, 255, .82)";
      ctx.lineWidth = 3;
      ctx.strokeRect(-this.r - 10, -this.r - 10, (this.r + 10) * 2, (this.r + 10) * 2);
      ctx.fillStyle = "#ffd671";
      ctx.font = "10px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("LOCK", 0, this.r + 22);
    }
    ctx.restore();
  }
}

class HealthPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 14;
    this.collected = false;
    this.phase = Math.random() * 8;
  }

  rect() {
    return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 };
  }

  update(player, game) {
    if (this.collected || !overlap(this.rect(), player.rect())) return;
    this.collected = true;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    game.audio.sfx("heal");
    game.burst(this.x, this.y, "#72fff0", 16);
  }

  draw(ctx, cam) {
    if (this.collected) return;
    const y = this.y - cam + Math.sin(performance.now() * 0.005 + this.phase) * 5;
    ctx.save();
    ctx.translate(this.x, y);
    ctx.shadowColor = "#d93cff";
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(22, 6, 38, .92)";
    ctx.beginPath();
    ctx.arc(0, 0, this.r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d93cff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "30px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👾", 0, 0);
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, left, right, type = "wolf") {
    this.x = x;
    this.y = y;
    this.w = type === "dog" ? 66 : 70;
    this.h = type === "dog" ? 56 : 82;
    this.left = left;
    this.right = right;
    this.type = type;
    this.homeY = y;
    this.topDog = type === "dog" && y < 560;
    this.vx = (type === "dog" ? 115 : type === "brute" ? 42 : type === "shade" ? 78 : 62) * GameBalance.enemySpeed * (this.topDog ? 2.6 : 1);
    this.hp = type === "dog" ? (this.topDog ? 4 : 2) : GameBalance.enemyHealth;
    this.damage = this.topDog ? 2 : 1;
    this.dead = false;
    this.hitFlash = 0;
    this.walkPhase = Math.random() * Math.PI * 2;
    this.drawX = x;
    this.drawY = y;
    this.stepBlend = 0;
    this.stepTimer = 0.25 + Math.random() * 0.2;
    this.barkCooldown = 0.9 + Math.random() * 1.1;
  }

  rect() {
    const h = this.type === "shade" ? 58 : this.h;
    const w = this.type === "brute" ? 88 : this.w;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  update(dt, platforms, player, game) {
    if (this.dead) return;
    if (this.topDog) this.y = this.homeY;
    if (this.topDog && Math.abs(this.vx) < 260) this.vx = (this.vx < 0 ? -1 : 1) * 300;
    this.x += this.vx * dt;
    if (this.x < this.left) {
      this.x = this.left;
      this.vx = Math.abs(this.vx);
    }
    if (this.x > this.right) {
      this.x = this.right;
      this.vx = -Math.abs(this.vx);
    }
    this.walkPhase += dt * (6.4 + Math.min(6, Math.abs(this.vx) / 58));
    const visualEase = 1 - Math.pow(0.0001, dt);
    this.drawX += (this.x - this.drawX) * visualEase;
    this.drawY += (this.y - this.drawY) * visualEase;
    this.stepBlend += (1 - this.stepBlend) * (1 - Math.pow(0.0006, dt));
    this.stepTimer = Math.max(0, this.stepTimer - dt);
    this.barkCooldown = Math.max(0, this.barkCooldown - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.type === "dog" && this.barkCooldown <= 0) {
      const screenY = this.y - game.cameraY;
      const close = Math.abs(player.x - this.x) < 92 && Math.abs(player.y - this.y) < 72 && screenY > -60 && screenY < H + 60;
      if (close && game.dogBarkCooldown <= 0) {
        game.audio.sfx("dogBark");
        game.dogBarkCooldown = 5.2;
        this.barkCooldown = 4.5 + Math.random() * 1.5;
      }
    }
    if (overlap(this.rect(), player.rect()) && player.invuln <= 0) {
      player.hurt(Math.sign(player.x - this.x) || 1, game, this.damage);
    }
  }

  hit(game, dir = 0, damage = 1, heavy = false) {
    if (this.hitFlash > 0.04) return;
    this.hp -= damage;
    this.hitFlash = 0.12;
    if (dir) this.vx = Math.sign(dir) * Math.max(Math.abs(this.vx), heavy ? 190 : 135);
    if (this.hp <= 0) {
      this.dead = true;
      game.audio.sfx(this.type === "dog" ? "dogHit" : "kill");
      setTimeout(() => game.audio.sfx("kill"), 55);
      game.shake = Math.max(game.shake, heavy ? 9 : 6);
      game.burst(this.x, this.y - 24, "#ff4fd8", 26);
      game.burst(this.x, this.y - 46, "#ffd671", 14);
    } else {
      game.audio.sfx(this.type === "dog" ? "dogHit" : "monsterHit");
    }
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const y = this.y - cam;
    ctx.save();
    ctx.translate(this.drawX, this.drawY - cam);
    if (this.vx < 0) ctx.scale(-1, 1);
    if (this.hitFlash > 0) ctx.globalAlpha = 0.55;
    const sprite = this.type === "dog" && images.patrolDog.complete && images.patrolDog.naturalWidth ? images.patrolDog : images.patrol;
    if (sprite.complete && sprite.naturalWidth) {
      const step = Math.sin(this.walkPhase);
      const bob = Math.abs(step) * (this.type === "dog" ? 2 : this.type === "brute" ? 3 : 4) * this.stepBlend;
      const lean = step * (this.type === "shade" ? 0.07 : 0.035);
      ctx.rotate(lean);
      if (this.type === "dog") {
        ctx.drawImage(sprite, -45, -70 + bob, 90, 70);
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = "#ff315c";
        ctx.fillRect(step > 0 ? -30 : 16, -6, 20, 4);
        ctx.fillRect(step > 0 ? 10 : -26, -3, 18, 3);
      } else if (this.type === "brute") {
        ctx.globalAlpha *= 0.86;
        ctx.drawImage(sprite, -60, -112 + bob, 120, 126);
      } else if (this.type === "shade") {
        ctx.globalAlpha *= 0.78;
        ctx.shadowColor = "#72fff0";
        ctx.shadowBlur = 12;
        ctx.drawImage(sprite, -38, -76 + bob, 76, 80);
      } else {
        ctx.drawImage(sprite, -47, -98 + bob, 94, 99);
      }
      ctx.shadowBlur = 0;
      if (this.type !== "dog") {
        ctx.globalAlpha = 0.48;
        ctx.fillStyle = this.type === "shade" ? "#72fff0" : "#ff4fd8";
        ctx.fillRect(step > 0 ? -34 : 20, -6, 18, 4);
      }
      ctx.globalAlpha = this.hitFlash > 0 ? 0.55 : 1;
    } else {
      ctx.fillStyle = "#7e1947";
      ctx.fillRect(-42, -42, 84, 34);
      ctx.fillStyle = "#ff6a3d";
      ctx.fillRect(18, -52, 30, 24);
      ctx.fillStyle = "#08060b";
      ctx.fillRect(32, -45, 8, 6);
      ctx.fillRect(-35, -8, 12, 18);
      ctx.fillRect(21, -8, 12, 18);
    }
    ctx.restore();
  }
}

class LockedWall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.open = false;
    this.flash = 0;
  }

  rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  unlock(game) {
    if (this.open) return;
    this.open = true;
    this.flash = 1.2;
    game.audio.sfx("unlock");
    game.burst(this.x + this.w / 2, this.y + this.h / 2, "#c77dff", 44);
    game.message = "Boss defeated. Hidden wall unlocked.";
    game.messageTime = 2.2;
  }

  draw(ctx, cam) {
    if (this.open) return;
    const y = this.y - cam;
    if (y > H + 100 || y + this.h < -100) return;
    ctx.save();
    ctx.fillStyle = "#170b22";
    ctx.fillRect(this.x, y, this.w, this.h);
    ctx.strokeStyle = "#ff44ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x + 2, y + 2, this.w - 4, this.h - 4);
    ctx.fillStyle = "rgba(199, 125, 255, .26)";
    for (let yy = y + 16; yy < y + this.h - 12; yy += 24) {
      ctx.fillRect(this.x + 8, yy, this.w - 16, 4);
    }
    ctx.fillStyle = "#ffd671";
    ctx.font = "12px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("ORB LOCK", this.x + this.w / 2, y + this.h / 2);
    ctx.restore();
  }
}

class ExitDoor {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.open = false;
    this.pulse = Math.random() * 10;
  }

  rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(player, game) {
    this.open = game.collected >= TOTAL_ORBS && (!game.boss || game.boss.dead);
    if (!this.open || game.playerDead() || !overlap(this.rect(), player.rect())) return;
    game.finishGame();
  }

  draw(ctx, cam, collected) {
    const y = this.y - cam;
    if (y > H + 100 || y + this.h < -100) return;
    const glow = this.open ? 0.4 + Math.sin(performance.now() * 0.006 + this.pulse) * 0.16 : 0.12;
    ctx.save();
    ctx.shadowColor = this.open ? "#ffd671" : "#2b2350";
    ctx.shadowBlur = this.open ? 22 : 4;
    ctx.fillStyle = this.open ? "rgba(255, 214, 113, .22)" : "rgba(8, 5, 18, .72)";
    ctx.fillRect(this.x, y, this.w, this.h);
    ctx.strokeStyle = this.open ? "#ffd671" : "#59446e";
    ctx.lineWidth = 4;
    ctx.strokeRect(this.x + 2, y + 2, this.w - 4, this.h - 4);
    ctx.fillStyle = this.open ? `rgba(114, 255, 240, ${glow})` : "rgba(15, 11, 30, .92)";
    ctx.fillRect(this.x + 16, y + 14, this.w - 32, this.h - 18);
    ctx.fillStyle = this.open ? "#fff4b8" : "#756188";
    ctx.font = "11px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(this.open ? "EXIT" : `${collected}/${TOTAL_ORBS}`, this.x + this.w / 2, y + this.h - 12);
    ctx.restore();
  }
}

class Abyss_Wing_God {
  static config = {
    maxHealth: 38,
    phase2At: 0.65,
    phase3At: 0.3,
    contactDamage: 3,
    heavyDamage: 3,
    fireballCooldown: { phase1: 6.8, phase2: 5.8, phase3: 4.8 },
    antiCampRangeX: 170,
    antiCampRangeY: 430,
    minionCooldown: 7.5,
    arenaLeft: 110,
    arenaRight: 850,
  };

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.w = 220;
    this.h = 285;
    this.hp = Abyss_Wing_God.config.maxHealth;
    this.maxHp = Abyss_Wing_God.config.maxHealth;
    this.left = Abyss_Wing_God.config.arenaLeft;
    this.right = Abyss_Wing_God.config.arenaRight;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.state = "STALK";
    this.stateTimer = 0.55;
    this.stateDuration = 0.55;
    this.actionIndex = 0;
    this.phase = 1;
    this.attackHit = false;
    this.slamMade = false;
    this.summonMade = false;
    this.fireballsMade = false;
    this.laserHit = false;
    this.gustHit = false;
    this.shockwaves = [];
    this.minionCooldown = 0;
    this.fireballCooldown = 1.6;
    this.rockCooldown = 2.4;
    this.ruptureMade = false;
    this.ragePulse = 0;
    this.invuln = 0;
    this.deathTimer = 0;
    this.dead = false;
    this.hitFlash = 0;
    this.visualScale = 0.62;
  }

  rect() {
    return { x: this.x - 92, y: this.y - 236, w: 184, h: 228 };
  }

  attackRect() {
    const p = this.progress();
    const dir = this.facing || 1;
    if ((this.state === "CLAW_SLASH_1" || this.state === "CLAW_SLASH_2") && p > 0.36 && p < 0.68) {
      const reach = this.phase >= 3 ? 182 : 158;
      return { x: dir > 0 ? this.x + 26 : this.x - reach - 26, y: this.y - 238, w: reach, h: 126 };
    }
    if (this.state === "BITE" && p > 0.44 && p < 0.67) {
      return { x: dir > 0 ? this.x + 6 : this.x - 122, y: this.y - 252, w: 116, h: 84 };
    }
    if ((this.state === "LEAP_SLAM" || this.state === "SHOCKWAVE") && p > 0.42 && p < 0.78) {
      return { x: this.x - 96, y: this.y - 88, w: 192, h: 78 };
    }
    if (this.state === "WALL_JUMP_ATTACK" && p > 0.28 && p < 0.72) {
      return { x: this.x - 112, y: this.y - 230, w: 224, h: 140 };
    }
    if (this.state === "MOUTH_LASER" && p > 0.46 && p < 0.72) {
      return { x: dir > 0 ? this.x - 10 : this.x - 390, y: this.y - 250, w: 400, h: 34 };
    }
    if (this.state === "WING_GUST" && p > 0.4 && p < 0.78) {
      return { x: this.left - 30, y: this.y - 255, w: this.right - this.left + 80, h: 190 };
    }
    return null;
  }

  weakRect() {
    if (this.deathTimer > 0) return { x: -9999, y: -9999, w: 0, h: 0 };
    return { x: this.x - 112, y: this.y - 282, w: 224, h: 256 };
  }

  mouthRect() {
    return { x: this.x - 44, y: this.y - 230, w: 88, h: 70 };
  }

  clawRect() {
    return { x: this.x - 176, y: this.y - 154, w: 352, h: 112 };
  }

  bodyRect() {
    return { x: this.x - 132, y: this.y - 280, w: 264, h: 248 };
  }

  damageForSword(sword) {
    if (overlap(sword, this.mouthRect())) return { zone: "mouth", damage: sword.damage };
    if (overlap(sword, this.clawRect())) return { zone: "claw", damage: Math.max(1, Math.ceil(sword.damage * 0.6)) };
    if (overlap(sword, this.bodyRect())) return { zone: "body", damage: Math.max(1, Math.ceil(sword.damage * 0.25)) };
    return null;
  }

  progress() {
    return clamp(1 - this.stateTimer / Math.max(0.001, this.stateDuration), 0, 1);
  }

  setState(state, duration, game) {
    this.state = state;
    this.stateTimer = duration;
    this.stateDuration = duration;
    this.attackHit = false;
    this.slamMade = false;
    this.summonMade = false;
    this.fireballsMade = false;
    this.laserHit = false;
    this.gustHit = false;
    this.ruptureMade = false;
    const dir = Math.sign(game.player.x - this.x) || this.facing || -1;
    this.facing = dir;
    if (state === "LEAP" || state === "LEAP_SLAM") {
      this.vx = dir * (this.phase >= 3 ? 520 : this.phase >= 2 ? 430 : 340);
      this.vy = state === "LEAP_SLAM" ? -650 : -520;
    }
    if (state === "WALL_CLING") {
      this.x = dir > 0 ? this.right : this.left;
      this.facing = dir > 0 ? -1 : 1;
      this.vx = 0;
      this.vy = 0;
    }
    if (state === "WALL_JUMP_ATTACK") {
      this.vx = this.facing * (this.phase >= 3 ? 650 : 520);
      this.vy = -360;
    }
    if (state === "BossFireballBarrage") game.burst(this.x, this.y - 250, "#ff315c", 22);
    if (state === "ROAR") game.burst(this.x, this.y - 210, "#72fff0", 20);
    if (state === "RAGE_MODE") {
      this.ragePulse = 1.2;
      game.burst(this.x, this.y - 185, "#2bc7ff", 44);
      game.shake = Math.max(game.shake, 7);
    }
  }

  chooseNext(player, game) {
    const patterns = this.phase === 1
      ? ["STALK", "CLAW_SLASH_1", "BossFireballBarrage", "BITE", "LEAP", "ROAR"]
      : this.phase === 2
        ? ["STALK", "WING_GUST", "CLAW_SLASH_1", "BossFireballBarrage", "CLAW_SLASH_2", "GROUND_RUPTURE", "LEAP_SLAM", "WALL_CLING", "WALL_JUMP_ATTACK", "SUMMON_WOLVES"]
        : ["RAGE_MODE", "RUN", "BossFireballBarrage", "CLAW_SLASH_1", "LEAP_SLAM", "MOUTH_LASER", "CLAW_SLASH_2", "GROUND_RUPTURE", "BITE", "SHOCKWAVE", "WALL_CLING", "WALL_JUMP_ATTACK", "SUMMON_WOLVES"];
    const state = patterns[this.actionIndex++ % patterns.length];
    const durations = {
      STALK: this.phase >= 3 ? 0.42 : 0.62,
      RUN: 0.52,
      CLAW_SLASH_1: this.phase >= 3 ? 0.48 : 0.56,
      CLAW_SLASH_2: this.phase >= 3 ? 0.42 : 0.52,
      BITE: 0.48,
      LEAP: 0.78,
      LEAP_SLAM: 0.9,
      WALL_CLING: 0.36,
      WALL_JUMP_ATTACK: 0.72,
      SHOCKWAVE: 0.62,
      WING_GUST: 0.7,
      MOUTH_LASER: 0.8,
      GROUND_RUPTURE: 0.85,
      BossFireballBarrage: this.phase >= 3 ? 0.96 : 1.1,
      ROAR: 0.72,
      SUMMON_WOLVES: 0.74,
      RAGE_MODE: 0.44,
    };
    this.setState(state, durations[state] || 0.55, game);
  }

  updatePhase(game) {
    const next = this.hp <= this.maxHp * 0.2 ? 3 : this.hp <= this.maxHp * 0.5 ? 2 : 1;
    if (next !== this.phase) {
      this.phase = next;
      this.setState(next === 3 ? "RAGE_MODE" : "ROAR", next === 3 ? 0.8 : 0.65, game);
    }
  }

  update(dt, player, game) {
    if (this.dead) return;
    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      this.y += Math.sin(performance.now() * 0.02) * 0.2;
      if (this.deathTimer <= 0) {
        this.dead = true;
        if (game.lockedWall) game.lockedWall.unlock(game);
        else {
          game.audio.sfx("unlock");
          game.burst(this.x, this.y - 120, "#c77dff", 24);
          game.message = "Boss defeated. The final orb is active.";
          game.messageTime = 2.2;
        }
      }
      return;
    }
    this.updatePhase(game);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.ragePulse = Math.max(0, this.ragePulse - dt);
    this.minionCooldown = Math.max(0, this.minionCooldown - dt);
    this.fireballCooldown = Math.max(0, this.fireballCooldown - dt);
    this.rockCooldown = Math.max(0, this.rockCooldown - dt);
    this.stateTimer -= dt;
    this.facing = Math.sign(player.x - this.x) || this.facing;
    const playerUnderMouth = player.y > this.y - 170
      && player.y < this.y + Abyss_Wing_God.config.antiCampRangeY
      && Math.abs(player.x - this.x) < Abyss_Wing_God.config.antiCampRangeX;
    const canPunishUnderCamp = playerUnderMouth
      && this.fireballCooldown <= 0
      && !["BossFireballBarrage", "MOUTH_LASER", "LEAP_SLAM", "SHOCKWAVE", "WING_GUST", "RAGE_MODE"].includes(this.state);
    if (canPunishUnderCamp) {
      this.setState("BossFireballBarrage", this.phase >= 3 ? 0.82 : 0.96, game);
    }

    const p = this.progress();
    if (this.state === "STALK" || this.state === "RUN") {
      const speed = this.state === "RUN" ? 430 : this.phase >= 3 ? 260 : this.phase >= 2 ? 205 : 155;
      this.x += Math.sign(player.x - this.x) * speed * dt;
    } else if (this.state === "LEAP" || this.state === "LEAP_SLAM" || this.state === "WALL_JUMP_ATTACK") {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += 1500 * dt;
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        if ((this.state === "LEAP_SLAM" || this.state === "WALL_JUMP_ATTACK") && !this.slamMade) this.makeShockwave(game);
        if (this.state === "LEAP") this.stateTimer = Math.min(this.stateTimer, 0.06);
      }
    } else if (this.state === "BossFireballBarrage") {
      if (p > 0.36 && !this.fireballsMade && this.fireballCooldown <= 0) this.makeFireballBarrage(game);
    } else if (this.state === "GROUND_RUPTURE" && p > 0.42 && !this.ruptureMade) {
      this.makeGroundRupture(game);
    } else if (this.state === "ROAR" && p > 0.38 && p < 0.66 && Math.abs(player.x - this.x) < 260 && player.invuln <= 0) {
      player.vx += Math.sign(player.x - this.x) * 420 * dt;
      player.vy = Math.min(player.vy, -120);
    } else if (this.state === "SUMMON_WOLVES" && p > 0.42 && !this.summonMade) {
      this.summonMade = true;
      if (this.minionCooldown <= 0) {
        game.enemies.push(new Enemy(clamp(player.x - 160, 120, 780), this.groundY, 100, 900, "dog"));
        game.burst(this.x, this.y - 160, "#2bc7ff", 24);
        this.minionCooldown = 7.5;
      }
    } else if (this.state === "SHOCKWAVE" && p > 0.36 && !this.slamMade) {
      this.makeShockwave(game);
    }

    this.x = clamp(this.x, this.left, this.right);
    const attack = this.attackRect();
    if (attack && this.state === "WING_GUST" && !this.gustHit && overlap(attack, player.rect())) {
      this.gustHit = true;
      player.vx += Math.sign(player.x - this.x || this.facing) * 520;
      player.vy = Math.min(player.vy, -130);
      game.shake = Math.max(game.shake, 5);
    } else if (attack && !this.attackHit && overlap(attack, player.rect()) && player.invuln <= 0) {
      this.attackHit = true;
      player.hurt(Math.sign(player.x - this.x) || 1, game, Abyss_Wing_God.config.heavyDamage);
      game.audio.sfx("dogHit");
      game.shake = Math.max(game.shake, this.phase >= 3 ? 10 : 8);
    }
    if (overlap(this.rect(), player.rect()) && player.invuln <= 0) {
      player.hurt(Math.sign(player.x - this.x) || 1, game, Abyss_Wing_God.config.contactDamage);
    }
    this.shockwaves.forEach((wave) => {
      wave.x += wave.dir * wave.speed * dt;
      wave.life -= dt;
      const wr = { x: wave.x - 28, y: wave.y - 32, w: 56, h: 46 };
      if (!wave.hit && overlap(wr, player.rect()) && player.invuln <= 0) {
        wave.hit = true;
        player.hurt(wave.dir, game, 2);
        game.shake = Math.max(game.shake, 6);
      }
    });
    this.shockwaves = this.shockwaves.filter((wave) => wave.life > 0 && wave.x > 40 && wave.x < WORLD_W - 40);
    if (this.stateTimer <= 0) this.chooseNext(player, game);
  }

  makeShockwave(game) {
    this.slamMade = true;
    this.shockwaves.push({ x: this.x - 55, y: this.groundY, dir: -1, speed: this.phase >= 3 ? 430 : 340, life: 1.2, hit: false });
    this.shockwaves.push({ x: this.x + 55, y: this.groundY, dir: 1, speed: this.phase >= 3 ? 430 : 340, life: 1.2, hit: false });
    game.audio.sfx("dogHit");
    game.burst(this.x, this.groundY - 18, "#72fff0", 26);
    game.shake = Math.max(game.shake, 9);
  }

  makeFireballBarrage(game) {
    this.fireballsMade = true;
    this.fireballCooldown = this.phase >= 3 ? Abyss_Wing_God.config.fireballCooldown.phase3 : this.phase >= 2 ? Abyss_Wing_God.config.fireballCooldown.phase2 : Abyss_Wing_God.config.fireballCooldown.phase1;
    const count = this.phase >= 3 ? 7 : this.phase >= 2 ? 5 : 3;
    const dir = Math.sign(game.player.x - this.x) || this.facing || -1;
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 58;
      const speed = 145 + this.phase * 18 + Math.abs(spread) * 0.16;
      game.addProjectile({
        owner: "boss",
        type: "BossFireballBarrage",
        x: this.x + dir * 38,
        y: this.y - 246,
        vx: dir * speed,
        vy: -145 + spread * 0.9,
        r: 14,
        damage: this.phase >= 3 ? 2 : 1,
        gravity: 250,
        life: 3.6,
      });
    }
    const playerUnderMouth = game.player.y > this.y - 170
      && game.player.y < this.y + Abyss_Wing_God.config.antiCampRangeY
      && Math.abs(game.player.x - this.x) < Abyss_Wing_God.config.antiCampRangeX + 40;
    if (playerUnderMouth) {
      const targetX = clamp(game.player.x, this.left + 44, this.right - 44);
      const columnCount = this.phase >= 3 ? 5 : 4;
      for (let i = 0; i < columnCount; i++) {
        game.addProjectile({
          owner: "boss",
          type: "BossFireballBarrageDown",
          x: targetX + (i % 2 ? 16 : -16),
          y: this.y - 226 + i * 34,
          vx: (i - (columnCount - 1) / 2) * 8,
          vy: 255 + this.phase * 34 + i * 22,
          r: 17,
          damage: this.phase >= 3 ? 2 : 1,
          gravity: 65,
          life: 2.05,
        });
      }
      game.burst(targetX, this.y - 168, "#ff5fd2", 18);
    }
    game.audio.sfx("wolfHit");
    game.burst(this.x, this.y - 246, "#ff315c", 28);
  }

  makeGroundRupture(game) {
    this.ruptureMade = true;
    const center = game.player.x;
    for (let i = -1; i <= 1; i++) {
      game.addProjectile({
        owner: "boss",
        type: "GroundRupture",
        x: clamp(center + i * 84, 80, WORLD_W - 80),
        y: this.groundY - 18,
        vx: 0,
        vy: 0,
        r: 24,
        damage: 2,
        life: 0.78,
        gravity: 0,
      });
    }
    game.burst(center, this.groundY - 16, "#ff315c", 16);
  }

  hit(game, damage = 1, heavy = false) {
    if (this.dead || this.deathTimer > 0 || this.invuln > 0) return;
    this.hp -= damage;
    this.hitFlash = 0.16;
    this.invuln = heavy ? 0.11 : 0.075;
    game.audio.sfx(this.hp <= 0 ? "kill" : "wolfHit");
    if (heavy) game.shake = Math.max(game.shake, 8);
    game.burst(this.x, this.y - 120, this.hp <= 0 ? "#ffd671" : "#ff4fd8", this.hp <= 0 ? 70 : 20);
    if (this.hp <= 0) {
      this.deathTimer = 1.05;
      this.state = "DEATH";
      this.stateDuration = 1.05;
      this.stateTimer = 1.05;
      this.vx = 0;
      this.vy = 0;
      game.shake = Math.max(game.shake, 12);
      game.score += 2500;
    }
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const img = images.boss;
    const sprite = makeFloodCutout("planitia-demon-flood-v1", img, 0, 0, img.naturalWidth || 1024, img.naturalHeight || 1024)
      || makeLightCutout("planitia-demon-light-v1", img, 0, 0, img.naturalWidth || 1024, img.naturalHeight || 1024);
    const y = this.y - cam;
    const p = this.progress();
    const warning = ["CLAW_SLASH_1", "CLAW_SLASH_2", "BITE", "LEAP_SLAM", "WALL_JUMP_ATTACK", "SHOCKWAVE", "BossFireballBarrage", "MOUTH_LASER", "WING_GUST", "GROUND_RUPTURE"].includes(this.state) && p < 0.38;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(y));
    if (this.facing < 0) ctx.scale(-1, 1);
    if (this.hitFlash > 0 || this.deathTimer > 0) {
      ctx.globalAlpha = 0.65;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
    } else if (this.phase >= 3 || this.ragePulse > 0) {
      ctx.shadowColor = "#ff315c";
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = "#ff44aa";
      ctx.shadowBlur = 8;
    }
    const leapTilt = (this.state === "LEAP" || this.state === "WALL_JUMP_ATTACK") ? -0.16 : 0;
    const stalkLean = this.state === "STALK" ? Math.sin(performance.now() * 0.008) * 0.035 : 0;
    ctx.rotate(leapTilt + stalkLean);
    if (warning) {
      ctx.globalAlpha *= 0.92;
      ctx.fillStyle = "rgba(255, 64, 92, .24)";
      ctx.fillRect(-86, -258, 172, 242);
      ctx.fillStyle = "#ffcc38";
      ctx.fillRect(-38, -286, 20, 12);
      ctx.fillRect(18, -286, 20, 12);
    }
    const scale = this.visualScale;
    const bossW = Math.round(660 * scale);
    const bossH = Math.round(560 * scale);
    const bossX = -Math.round(bossW / 2);
    const bossY = -Math.round(bossH - 16);
    if (sprite) {
      ctx.drawImage(sprite, bossX, bossY, bossW, bossH);
    } else if (images.boss.complete && images.boss.naturalWidth) {
      ctx.drawImage(images.boss, bossX, bossY, bossW, bossH);
    } else {
      ctx.fillStyle = "#102034";
      ctx.fillRect(-128, -330, 256, 312);
    }
    if (this.state === "BossFireballBarrage") {
      const charge = Math.sin(p * Math.PI);
      ctx.save();
      ctx.globalAlpha = 0.44 + charge * 0.46;
      ctx.shadowColor = "#ff315c";
      ctx.shadowBlur = 10 + charge * 8;
      ctx.fillStyle = "#ff315c";
      ctx.beginPath();
      ctx.arc(0, -174, 16 + charge * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffd671";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.phase >= 3 ? "#2bc7ff" : "#ffcc38";
    ctx.fillRect(-36, -244, 16, 9);
    ctx.fillRect(20, -244, 16, 9);
    const attack = this.attackRect();
    if (attack) {
      ctx.save();
      ctx.globalAlpha = 0.26 + Math.sin(p * Math.PI) * 0.34;
      ctx.shadowColor = "#ff44ff";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = this.phase >= 3 ? "#72fff0" : "#ff79ff";
      ctx.lineWidth = this.phase >= 3 ? 16 : 12;
      ctx.beginPath();
      ctx.arc(20, -165, this.state === "BITE" ? 92 : 184, -0.75 + p * 0.85, 0.42 + p * 0.85);
      ctx.stroke();
      ctx.strokeStyle = "#fff4b8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(20, -165, this.state === "BITE" ? 104 : 196, -0.62 + p * 0.85, 0.3 + p * 0.85);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    this.shockwaves.forEach((wave) => {
      ctx.save();
      ctx.globalAlpha = clamp(wave.life, 0, 1);
      ctx.strokeStyle = "#72fff0";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#2bc7ff";
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y - cam - 20, 28 + (1.2 - wave.life) * 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  drawBackdrop(ctx, playerY) {
    if (this.dead) return;
    const img = images.boss;
    if (!img || !img.complete || !img.naturalWidth) return;
    const reveal = clamp((720 - playerY) / 620, 0, 1);
    if (reveal <= 0.02) return;
    const sprite = makeFloodCutout("planitia-demon-flood-v1", img, 0, 0, img.naturalWidth, img.naturalHeight)
      || makeLightCutout("planitia-demon-light-v1", img, 0, 0, img.naturalWidth, img.naturalHeight)
      || img;
    const scale = Math.max(W / sprite.width, H / sprite.height) * (0.82 + reveal * 0.08);
    const bw = sprite.width * scale;
    const bh = sprite.height * scale;
    ctx.save();
    ctx.globalAlpha = 0.07 + reveal * 0.36;
    ctx.shadowColor = "#ff315c";
    ctx.shadowBlur = 0;
    ctx.drawImage(sprite, (W - bw) / 2 + 34, -58 + reveal * 16, bw, bh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(8, 0, 16, ${0.18 + reveal * 0.24})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.12 + reveal * 0.18;
    ctx.fillStyle = "#ff315c";
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, H - 3, W, 3);
    ctx.restore();
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 44;
    this.h = 92;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.wasGrounded = false;
    this.wallSide = 0;
    this.coyote = 0;
    this.wallCoyote = 0;
    this.jumps = 0;
    this.maxHp = 6;
    this.hp = this.maxHp;
    this.invuln = 0;
    this.deadTimer = 0;
    this.hurtTimer = 0;
    this.landTimer = 0;
    this.skidTimer = 0;
    this.stepTimer = 0;
    this.afterimages = [];
    this.hitTargets = new Set();
    this.input = { jump: 0, attack: 0, dash: 0 };
    this.attackHold = 0;
    this.attackReleased = false;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.attackState = null;
    this.attackTimer = 0;
    this.attackDuration = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.chargeGlow = 0;
    this.state = "IDLE";
    this.anim = "idle";
    this.prevState = "IDLE";
    this.animTime = 0;
    this.idleStillTimer = 0;
    this.attack = 0;
    this.visual = {
      cape: 0,
      capeVel: 0,
      bodyLean: 0,
      squash: 1,
      stretch: 1,
      strideBlend: 0,
      drawX: x,
      drawY: y,
      stepLeft: 0,
      stepRight: 0,
      crouch: 0,
      hipShift: 0,
      shoulderTwist: 0,
      runSpeedMix: 0,
      footLock: 0,
      jumpTuck: 0,
    };
  }

  // Movement tuning lives here: sharp ground starts, controlled air drift, and faster falling than rising.
  static movement = {
    groundAccel: GlitcherMotionPlusConfig.runAcceleration,
    groundDecel: GlitcherMotionPlusConfig.runDeceleration,
    airAccel: GlitcherMovementPolishConfig.airAcceleration,
    airDecel: GlitcherMovementPolishConfig.airDeceleration,
    maxRun: GlitcherMovementPolishConfig.maxRunSpeed,
    maxSprint: GlitcherMovementPolishConfig.maxSprintSpeed,
    maxAir: 260,
    jump: -705,
    doubleJump: -600,
    wallJumpX: 470,
    wallJumpY: -660,
    gravityRise: 1680,
    gravityFall: 2300,
    maxFall: 980,
    wallSlide: 205,
    dashSpeed: 610,
    dashTime: 0.16,
    dashCooldown: 0.42,
  };

  // Combo timing lives here: startup, active frames, recovery, damage, and hitbox shape.
  static attacks = {
    ATTACK_1: { duration: 0.22, activeStart: 0.045, activeEnd: 0.125, damage: 1, kb: 175, x: 10, y: -104, w: 104, h: 62, cancel: 0.13, shake: 0 },
    ATTACK_2: { duration: 0.26, activeStart: 0.055, activeEnd: 0.15, damage: 1, kb: 205, x: 8, y: -112, w: 124, h: 72, cancel: 0.15, shake: 0 },
    ATTACK_3: { duration: 0.34, activeStart: 0.075, activeEnd: 0.205, damage: 2, kb: 310, x: 12, y: -122, w: 142, h: 86, cancel: 0.3, shake: 6, heavy: true },
    AIR_ATTACK: { duration: 0.26, activeStart: 0.055, activeEnd: 0.17, damage: 1, kb: 190, x: 6, y: -108, w: 122, h: 74, cancel: 0.18, shake: 0 },
    UP_SLASH: { duration: 0.3, activeStart: 0.06, activeEnd: 0.18, damage: 1, kb: 185, x: -24, y: -150, w: 86, h: 120, cancel: 0.2, shake: 0 },
    DOWN_SLASH: { duration: 0.32, activeStart: 0.065, activeEnd: 0.2, damage: 1, kb: 225, x: -20, y: -54, w: 94, h: 100, cancel: 0.23, shake: 3 },
    DASH_SLASH: { duration: 0.26, activeStart: 0.02, activeEnd: 0.18, damage: 2, kb: 330, x: 0, y: -106, w: 148, h: 74, cancel: 0.22, shake: 5, heavy: true },
    CHARGE_ATTACK: { duration: 0.56, activeStart: 0.13, activeEnd: 0.34, damage: 3, kb: 430, x: 0, y: -132, w: 182, h: 112, cancel: 0.45, shake: 10, heavy: true },
  };

  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  setState(next) {
    if (this.state === next) return;
    this.prevState = this.state;
    this.state = next;
    const locomotion = ["IDLE", "RUN", "SPRINT", "SKID", "CROUCH", "JUMP", "JUMP_FLOAT", "FALL", "LAND"];
    if (!(locomotion.includes(this.prevState) && locomotion.includes(next))) this.animTime = 0;
    this.anim = next.toLowerCase();
  }

  buffer(type) {
    this.input[type] = type === "dash" ? 0.14 : 0.13;
  }

  tryJump(game) {
    this.buffer("jump");
  }

  swing(game) {
    this.buffer("attack");
  }

  releaseAttack(game) {
    this.attackReleased = true;
  }

  swordRect() {
    return this.activeAttackBox() || {
      x: this.x + (this.facing > 0 ? 10 : -54),
      y: this.y - 104,
      w: 44,
      h: 44,
      damage: 0,
      heavy: false,
    };
  }

  activeAttackBox() {
    if (!this.attackState) return null;
    const def = Player.attacks[this.attackState];
    const elapsed = this.attackDuration - this.attackTimer;
    if (elapsed < def.activeStart || elapsed > def.activeEnd) return null;
    const x = this.facing > 0 ? this.x + def.x : this.x - def.x - def.w;
    return { x, y: this.y + def.y, w: def.w, h: def.h, damage: def.damage, knockback: def.kb, heavy: !!def.heavy, state: this.attackState };
  }

  hurt(dir, game, amount = 1) {
    if (this.invuln > 0 || this.deadTimer > 0) return;
    this.hp -= amount;
    this.hurtTimer = 0.36;
    this.attackState = null;
    this.attackTimer = 0;
    this.dashTimer = 0;
    this.invuln = GameBalance.invincibleTime;
    this.vx = dir * 390;
    this.vy = -430;
    this.setState(this.hp <= 0 ? "DEAD" : "HURT");
    game.burst(this.x, this.y - 42, "#ff4040", 12);
    if (this.hp <= 0) {
      this.deadTimer = 0.7;
      game.audio.sfx("death");
      game.burst(this.x, this.y - 58, "#ff44ff", 36);
    } else {
      game.audio.sfx("hurt");
    }
  }

  consumeJump(game) {
    if (this.grounded || this.coyote > 0) {
      this.vy = Player.movement.jump;
      this.grounded = false;
      this.jumps = 1;
      this.coyote = 0;
      this.setState("JUMP");
      game.audio.sfx("jump");
      game.burst(this.x, this.y, "#72fff0", 8);
      return true;
    }
    if (this.wallCoyote > 0) {
      const push = -this.wallSide || -this.facing;
      this.vx = push * Player.movement.wallJumpX;
      this.vy = Player.movement.wallJumpY;
      this.facing = push;
      this.jumps = 1;
      this.wallCoyote = 0;
      this.setState("WALL_JUMP");
      game.audio.sfx("double");
      game.shake = Math.max(game.shake, 4);
      game.burst(this.x - this.wallSide * 16, this.y - 48, "#72fff0", 14);
      return true;
    }
    if (this.jumps < 2) {
      this.vy = Player.movement.doubleJump;
      this.jumps = 2;
      this.setState("DOUBLE_JUMP");
      game.audio.sfx("double");
      game.burst(this.x, this.y - 24, "#c77dff", 14);
      return true;
    }
    return false;
  }

  startDash(game, slash = false) {
    if (this.dashCooldown > 0) return false;
    this.dashTimer = Player.movement.dashTime;
    this.dashCooldown = Player.movement.dashCooldown;
    this.invuln = Math.max(this.invuln, 0.18);
    this.vx = this.facing * Player.movement.dashSpeed;
    this.vy *= 0.35;
    this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, life: 0.22 });
    if (slash) this.startAttack("DASH_SLASH", game);
    else this.setState("DASH");
    return true;
  }

  chooseAttack(game) {
    const up = game.isDown("KeyW") || game.isDown("ArrowUp");
    const down = game.isDown("KeyS") || game.isDown("ArrowDown");
    if (this.dashTimer > 0) return "DASH_SLASH";
    if (up) return "UP_SLASH";
    if (down) return "DOWN_SLASH";
    if (!this.grounded) return "AIR_ATTACK";
    if (this.comboTimer > 0 && this.comboStep === 1) return "ATTACK_2";
    if (this.comboTimer > 0 && this.comboStep === 2) return "ATTACK_3";
    return "ATTACK_1";
  }

  startAttack(name, game) {
    const def = Player.attacks[name];
    if (!def) return false;
    this.attackState = name;
    this.attackDuration = def.duration;
    this.attackTimer = def.duration;
    this.attack = def.duration;
    this.hitTargets.clear();
    this.attackReleased = false;
    this.chargeGlow = 0;
    if (name === "ATTACK_1") this.comboStep = 1;
    else if (name === "ATTACK_2") this.comboStep = 2;
    else if (name === "ATTACK_3") this.comboStep = 0;
    this.comboTimer = name.startsWith("ATTACK") && name !== "ATTACK_3" ? 0.42 : 0;
    this.setState(name);
    game.audio.sfx("sword");
    if (def.heavy) this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, life: 0.26 });
    return true;
  }

  update(dt, game) {
    if (this.deadTimer > 0) {
      this.deadTimer -= dt;
      this.setState("DEAD");
      this.vx *= Math.pow(0.02, dt);
      this.vy += Player.movement.gravityFall * dt;
      this.y += this.vy * dt;
      if (this.deadTimer <= 0) game.restart();
      return;
    }
    this.wasGrounded = this.grounded;
    Object.keys(this.input).forEach((key) => { this.input[key] = Math.max(0, this.input[key] - dt); });
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.landTimer = Math.max(0, this.landTimer - dt);
    this.skidTimer = Math.max(0, this.skidTimer - dt);
    this.wallCoyote = Math.max(0, this.wallCoyote - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.comboTimer <= 0 && !this.attackState) this.comboStep = 0;

    const left = game.isDown("KeyA") || game.isDown("ArrowLeft");
    const right = game.isDown("KeyD") || game.isDown("ArrowRight");
    const input = (right ? 1 : 0) - (left ? 1 : 0);
    if (this.grounded && input && Math.sign(this.vx) && Math.sign(this.vx) !== input && Math.abs(this.vx) > GlitcherMovementPolishConfig.turnSkidThreshold) {
      this.skidTimer = 0.1;
    }
    if (input) this.facing = input;

    if ((game.isDown("KeyF") || game.isDown("KeyJ")) && !this.attackState) {
      this.attackHold += dt;
      this.chargeGlow = clamp(this.attackHold / 1.05, 0, 1);
    } else if (!game.isDown("KeyF") && !game.isDown("KeyJ") && !this.attackState) {
      this.attackHold = 0;
      this.chargeGlow = 0;
    }

    if (this.input.dash > 0 && !this.attackState && this.dashCooldown <= 0) {
      this.input.dash = 0;
      this.startDash(game, game.isDown("KeyF") || game.isDown("KeyJ"));
    }
    if (this.input.jump > 0 && !this.attackState) {
      if (this.consumeJump(game)) this.input.jump = 0;
    }
    if (this.input.attack > 0 && (!this.attackState || this.canCancelAttack())) {
      this.input.attack = 0;
      this.startAttack(this.chooseAttack(game), game);
    }
    if (this.attackReleased && !this.attackState && this.attackHold > 0.55) {
      this.startAttack("CHARGE_ATTACK", game);
      this.attackHold = 0;
    }
    this.attackReleased = false;

    this.updateAttack(dt);
    this.updateMovement(dt, input, game);
    this.move(dt, game.platforms);
    this.updateLanding(game, dt);
    this.updateMovementPolish(dt, input, game);
    this.updateIdleStillTimer(dt, input, game);
    this.updateVisualState(input);
    this.afterimages.forEach((a) => { a.life -= dt; });
    this.afterimages = this.afterimages.filter((a) => a.life > 0);
    this.animTime += dt;
  }

  canCancelAttack() {
    if (!this.attackState) return true;
    const def = Player.attacks[this.attackState];
    const elapsed = this.attackDuration - this.attackTimer;
    return elapsed >= def.cancel && this.attackState !== "CHARGE_ATTACK" && this.attackState !== "DASH_SLASH";
  }

  updateIdleStillTimer(dt, input, game) {
    const downHeld = game.isDown("KeyS") || game.isDown("ArrowDown");
    const attackHeld = game.isDown("KeyF") || game.isDown("KeyJ");
    const busy = this.attackState || this.hurtTimer > 0 || this.deadTimer > 0 || this.dashTimer > 0;
    const moving = input !== 0 || Math.abs(this.vx) > 8 || Math.abs(this.vy) > 8 || !this.grounded;
    const buffered = this.input.jump > 0 || this.input.attack > 0 || this.input.dash > 0;
    if (busy || moving || buffered || downHeld || attackHeld) {
      this.idleStillTimer = 0;
      return;
    }
    this.idleStillTimer += dt;
  }

  updateAttack(dt) {
    if (!this.attackState) {
      this.attack = 0;
      return;
    }
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.attack = this.attackTimer;
    if (this.attackTimer <= 0) {
      this.attackState = null;
      this.hitTargets.clear();
    }
  }

  updateMovement(dt, input, game) {
    if (this.hurtTimer > 0) {
      this.vy += Player.movement.gravityFall * dt;
      return;
    }
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      this.vx = this.facing * Player.movement.dashSpeed;
      this.vy *= Math.pow(0.02, dt);
      if (this.dashTimer <= 0 && this.state === "DASH") this.setState(this.grounded ? "RUN" : "FALL");
      return;
    }

    const locked = this.attackState && this.grounded && !["ATTACK_1", "ATTACK_2"].includes(this.attackState);
    const accel = this.grounded ? Player.movement.groundAccel : Player.movement.airAccel;
    const decel = this.grounded ? Player.movement.groundDecel : Player.movement.airDecel;
    const max = this.grounded ? (Math.abs(this.vx) > 320 ? Player.movement.maxSprint : Player.movement.maxRun) : Player.movement.maxAir;
    if (input && !locked) {
      const turning = Math.sign(this.vx) && Math.sign(this.vx) !== input;
      this.vx += input * accel * (turning ? 1.35 : 1) * dt;
    } else {
      const drop = decel * dt;
      if (Math.abs(this.vx) <= drop) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * drop;
    }
    this.vx = clamp(this.vx, -max, max);

    const sliding = !this.grounded && this.wallSide && this.vy > 0 && input === this.wallSide;
    const jumpHeld = this.vy < 0 && (this.input.jump > 0 || game.isDown("Space"));
    const gravity = this.vy < 0 ? Player.movement.gravityRise * (jumpHeld ? 0.82 : 1.55) : Player.movement.gravityFall;
    this.vy += gravity * dt;
    if (sliding) this.vy = Math.min(this.vy, Player.movement.wallSlide);
    this.vy = Math.min(this.vy, Player.movement.maxFall);
  }

  updateLanding(game, dt) {
    if (!this.wasGrounded && this.grounded) {
      this.landTimer = 0.12;
      this.setState("LAND");
      game.burst(this.x, this.y, "#645878", 6);
    }
    if (this.grounded && Math.abs(this.vx) > 42) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = Math.abs(this.vx) > 300 ? 0.11 : 0.15;
        game.audio.sfx("footstep");
        game.burst(this.x - this.facing * 13, this.y - 1, "#554a69", 2);
      }
    } else {
      this.stepTimer = 0;
    }
  }

  updateMovementPolish(dt, input, game) {
    const cfg = GlitcherMovementPolishConfig;
    const plus = GlitcherMotionPlusConfig;
    const speedRatio = clamp(Math.abs(this.vx) / Player.movement.maxSprint, 0, 1);
    const topSpeed = clamp(Math.abs(this.vx) / plus.topSpeedVisualThreshold, 0, 1);
    const targetLean = this.grounded ? clamp(this.vx / 850, -plus.bodyLeanAmount, plus.bodyLeanAmount) : clamp(this.vx / 1200, -0.1, 0.1);
    const blend = 1 - Math.pow(0.001, dt * plus.animationBlendSpeed);
    this.visual.drawX += (this.x - this.visual.drawX) * (1 - Math.pow(0.0001, dt));
    this.visual.drawY += (this.y - this.visual.drawY) * (1 - Math.pow(0.0001, dt));
    this.visual.bodyLean += (targetLean - this.visual.bodyLean) * blend;
    const moving = this.grounded && Math.abs(this.vx) > 34;
    this.visual.strideBlend += ((moving ? 1 : 0) - this.visual.strideBlend) * blend;
    this.visual.runSpeedMix += (topSpeed - this.visual.runSpeedMix) * blend;
    const cycleSpeed = plus.strideSpeedMin + (plus.strideSpeedMax - plus.strideSpeedMin) * speedRatio;
    const step = Math.sin(this.animTime * cycleSpeed);
    const stepEase = 1 - Math.pow(0.0004, dt * cfg.footPlantBlendSpeed);
    this.visual.stepLeft += (((step > 0 ? 1 : 0) * this.visual.strideBlend) - this.visual.stepLeft) * stepEase;
    this.visual.stepRight += (((step <= 0 ? 1 : 0) * this.visual.strideBlend) - this.visual.stepRight) * stepEase;
    const crouching = this.grounded && !this.attackState && (game.isDown("KeyS") || game.isDown("ArrowDown"));
    const crouchSpeed = crouching ? plus.crouchEnterSpeed : plus.crouchExitSpeed;
    const crouchBlend = 1 - Math.pow(0.001, dt * crouchSpeed);
    this.visual.crouch += ((crouching ? 1 : 0) - this.visual.crouch) * crouchBlend;
    this.visual.hipShift += (Math.sin(this.animTime * cycleSpeed) * plus.strideLength * 0.16 * this.visual.strideBlend - this.visual.hipShift) * blend;
    this.visual.shoulderTwist += (Math.sin(this.animTime * cycleSpeed + Math.PI) * plus.shoulderCounterRotateAmount * this.visual.strideBlend - this.visual.shoulderTwist) * blend;
    this.visual.footLock += ((moving ? plus.footPlantLockStrength : 0) - this.visual.footLock) * blend;
    const tuckTarget = this.grounded ? 0 : (this.vy < 0 ? 1 : this.vy > 180 ? 0.45 : 0.75);
    this.visual.jumpTuck += (tuckTarget - this.visual.jumpTuck) * blend;
    const landingPulse = this.landTimer / cfg.landingSquashDuration;
    const takeoff = (!this.grounded && this.vy < -120) ? 1 : 0;
    this.visual.squash = 1 - Math.max(0, landingPulse) * cfg.landingSquashAmount + takeoff * cfg.jumpStretchAmount * 0.35;
    this.visual.stretch = 1 + Math.max(0, landingPulse) * cfg.landingSquashAmount - takeoff * cfg.jumpStretchAmount;

    const wind = Math.sin(performance.now() * 0.0015) * cfg.capeWindStrength;
    const speedDrag = clamp(-this.vx / 52, -plus.coatSpeedStretch, plus.coatSpeedStretch);
    const jumpLift = this.vy < -80 ? -plus.coatJumpLift : this.vy > 160 ? plus.coatFallDrag : 0;
    const dashKick = this.dashTimer > 0 ? -this.facing * 18 : 0;
    const targetCape = wind + speedDrag + jumpLift + dashKick;
    this.visual.capeVel += (targetCape - this.visual.cape) * cfg.capeSpringStrength * dt;
    this.visual.capeVel *= Math.max(0, 1 - cfg.capeDamping * dt);
    this.visual.cape += this.visual.capeVel * dt;
    this.visual.cape = clamp(this.visual.cape, -28, 30);
  }

  updateVisualState(input) {
    if (this.deadTimer > 0) return this.setState("DEAD");
    if (this.hurtTimer > 0) return this.setState("HURT");
    if (this.attackState) return this.setState(this.attackState);
    if (this.dashTimer > 0) return this.setState("DASH");
    if (!this.grounded && this.wallSide && this.vy > 0 && input === this.wallSide) return this.setState("WALL_SLIDE");
    if (!this.grounded && this.vy < -140) return this.setState(this.jumps > 1 ? "DOUBLE_JUMP" : "JUMP");
    if (!this.grounded && Math.abs(this.vy) <= 140) return this.setState("JUMP_FLOAT");
    if (!this.grounded) return this.setState("FALL");
    if (this.landTimer > 0) return this.setState("LAND");
    if (this.skidTimer > 0) return this.setState("SKID");
    if (this.visual.crouch > 0.45) return this.setState("CROUCH");
    if (Math.abs(this.vx) > 320) return this.setState("SPRINT");
    if (Math.abs(this.vx) > 20) return this.setState("RUN");
    return this.setState("IDLE");
  }

  move(dt, platforms) {
    this.x += this.vx * dt;
    let r = this.rect();
    this.wallSide = 0;
    for (const p of platforms) {
      if (p.isOneWay()) continue;
      if (!overlap(r, p)) continue;
      if (this.vx > 0) {
        this.x = p.x - this.w / 2;
        this.wallSide = 1;
      }
      if (this.vx < 0) {
        this.x = p.x + p.w + this.w / 2;
        this.wallSide = -1;
      }
      this.vx = 0;
      r = this.rect();
    }
    if (!this.grounded && this.wallSide) this.wallCoyote = 0.12;
    const previousBottom = this.y;
    this.y += this.vy * dt;
    this.grounded = false;
    r = this.rect();
    for (const p of platforms) {
      if (!overlap(r, p)) continue;
      if (this.vy > 0) {
        if (p.isOneWay() && previousBottom > p.y + 8) continue;
        this.y = p.y;
        this.vy = 0;
        this.grounded = true;
        this.jumps = 0;
        this.coyote = 0.09;
      } else if (this.vy < 0 && !p.isOneWay()) {
        this.y = p.y + p.h + this.h;
        this.vy = 0;
      }
      r = this.rect();
    }
    this.x = clamp(this.x, 32, WORLD_W - 32);
    if (this.y > WORLD_H + 240) {
      this.x = 120;
      this.y = WORLD_H - 120;
      this.vx = 0;
      this.vy = 0;
      this.hp = Math.max(1, this.hp - 1);
    }
  }

  draw(ctx, cam) {
    const flash = this.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0;
    this.afterimages.forEach((ghost) => {
      ctx.save();
      ctx.globalAlpha = clamp(ghost.life * 2.6, 0, 0.45);
      ctx.translate(ghost.x, ghost.y - cam);
      if (ghost.facing < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#5b1f8f";
      ctx.fillRect(-20, -126, 40, 126);
      ctx.fillStyle = "#d93cff";
      ctx.fillRect(-22, -140, 44, 13);
      ctx.restore();
    });
    ctx.save();
    ctx.translate(this.visual.drawX, this.visual.drawY - cam);
    if (this.facing < 0) ctx.scale(-1, 1);
    if (flash) ctx.globalAlpha = 0.55;
    const plus = GlitcherMotionPlusConfig;
    const speedRatio = clamp(Math.abs(this.vx) / Player.movement.maxSprint, 0, 1);
    const walkCycle = this.animTime * (plus.strideSpeedMin + (plus.strideSpeedMax - plus.strideSpeedMin) * speedRatio);
    const visualSprite = this.visualSpriteForState();
    const lockedIdle = visualSprite && this.state === "IDLE" && this.grounded && Math.abs(this.vx) < 4 && !this.attackState && this.hurtTimer <= 0 && this.deadTimer <= 0;
    const moving = this.grounded && (this.state === "RUN" || this.state === "SPRINT" || this.state === "SKID") && this.visual.crouch < 0.5;
    const bob = lockedIdle ? 0 : moving ? Math.abs(Math.sin(walkCycle)) * (4 + 3 * this.visual.runSpeedMix) * this.visual.strideBlend : 0;
    const attackLean = this.attackState && !this.grounded ? plus.airSlashBodyLean * this.facing : 0;
    const lean = lockedIdle ? 0 : this.visual.bodyLean + this.visual.shoulderTwist + attackLean + (this.state === "SKID" ? -this.facing * 0.09 : 0);
    const crouch = lockedIdle ? 0 : this.visual.crouch;
    const squash = lockedIdle ? 1 : this.visual.squash * (1 + crouch * 0.035);
    const stretch = lockedIdle ? 1 : this.visual.stretch * (1 - crouch * 0.11);
    ctx.save();
    ctx.globalAlpha *= 0.58;
    ctx.shadowColor = "#08020f";
    ctx.shadowBlur = 22;
    const aura = ctx.createRadialGradient(0, -70, 10, 0, -70, 88);
    aura.addColorStop(0, "rgba(35, 0, 55, .58)");
    aura.addColorStop(0.58, "rgba(12, 0, 22, .34)");
    aura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, -66, 58, 96, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.rotate(lean);
    ctx.translate(lockedIdle ? 0 : this.visual.hipShift * 0.22, bob + crouch * plus.crouchVisualHeight);
    ctx.scale(squash, stretch);
    if (!visualSprite) this.drawWindCoat(ctx, walkCycle);
    if (visualSprite) {
      this.drawGlitcherSprite(ctx, visualSprite);
    } else {
      const sprite = this.spriteForState();
      if (sprite && sprite.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, -25, -142, 50, 142);
      } else {
        ctx.fillStyle = "#15121d";
        ctx.fillRect(-22, -88, 44, 88);
        ctx.fillStyle = "#f02cff";
        ctx.fillRect(-20, -100, 40, 12);
      }
    }
    if (!visualSprite) this.drawMotionAccents(ctx, walkCycle, moving, flash);
    if (!visualSprite || !visualSprite.swordInFrame) this.drawSword(ctx, walkCycle);
    ctx.restore();
  }

  // Matte-black Glitcher visual hooks. These are draw-only and never change gameplay hitboxes.
  visualSpriteForState() {
    if (!GlitcherVisualCombatMotionConfig.enabled) return null;
    const cfg = GlitcherVisualCombatMotionConfig;
    const idleDanceReady = this.idleStillTimer >= 10;
    const idleDanceFrame = idleDanceReady && Math.floor((this.idleStillTimer - 10) * 7) % 4 === 1;
    const idleSpriteKey = idleDanceFrame ? "glitcherNewIdleDance" : "glitcherNewIdle";
    const table = {
      IDLE: { key: idleSpriteKey, height: cfg.baseHeight, yOffset: cfg.spriteYOffset, swordInFrame: false },
      WALK: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      RUN: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      SPRINT: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      TOP_SPEED_RUN: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      SKID: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      TURN: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      CROUCH: { key: "glitcherNewCrouch", height: cfg.crouchHeight, yOffset: cfg.spriteYOffset, swordInFrame: true },
      CROUCH_IDLE: { key: "glitcherNewCrouch", height: cfg.crouchHeight, yOffset: cfg.spriteYOffset, swordInFrame: true },
      JUMP: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      JUMP_RISE: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      DOUBLE_JUMP: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      JUMP_FLOAT: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      FALL: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      WALL_SLIDE: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      WALL_BOUNCE: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      WALL_JUMP: { key: "glitcherNewAirAttack", height: cfg.jumpHeight, yOffset: cfg.spriteYOffset, swordInFrame: true, sourceFacing: -1 },
      DASH: { key: "glitcherNewRunSword", height: cfg.runHeight, yOffset: cfg.runSpriteYOffset, swordInFrame: true },
      DASH_SLASH: { key: "glitcherNewDashSlash", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      ATTACK_1: { key: "glitcherNewChargeAttack", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      ATTACK_2: { key: "glitcherNewAttack02", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      ATTACK_3: { key: "glitcherNewAttack01", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      AIR_ATTACK: { key: "glitcherNewAirAttack", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true, sourceFacing: -1 },
      UP_SLASH: { key: "glitcherNewUpSlash", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      DOWN_SLASH: { key: "glitcherNewDownSlash", height: cfg.crouchHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      SPIN_SLASH: { key: "glitcherNewAttack02", height: cfg.attackHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      CHARGE_ATTACK: { key: "glitcherNewChargeAttack", height: cfg.chargeHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      CHARGED_SLASH: { key: "glitcherNewChargeAttack", height: cfg.chargeHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      FINISHER_SLASH: { key: "glitcherNewAttack03", height: cfg.chargeHeight, yOffset: cfg.attackSpriteYOffset, swordInFrame: true },
      HURT: { key: "glitcherNewHurt", height: cfg.baseHeight, yOffset: cfg.spriteYOffset, swordInFrame: true },
      DEATH: { key: "glitcherNewGuardKneel", height: cfg.crouchHeight, yOffset: cfg.spriteYOffset, swordInFrame: true },
      DEAD: { key: "glitcherNewGuardKneel", height: cfg.crouchHeight, yOffset: cfg.spriteYOffset, swordInFrame: true },
    };
    const desc = table[this.state] || table.IDLE;
    const img = images[desc.key];
    if (!img || !img.complete || !img.naturalWidth) return null;
    const sprite = makeTrimmedCutout(desc.key, img) || img;
    if (!sprite || !sprite.width || !sprite.height) return null;
    const height = desc.height;
    const width = Math.min(cfg.maxSpriteWidth, sprite.width * (height / sprite.height));
    return {
      sprite,
      width,
      height,
      yOffset: desc.yOffset || 0,
      swordInFrame: desc.swordInFrame,
      sourceFacing: desc.sourceFacing || 1,
    };
  }

  drawGlitcherSprite(ctx, visualSprite) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = "#7d1dff";
    ctx.shadowBlur = 10;
    const anchor = GlitcherVisualCombatMotionConfig.footAnchorX;
    const drawX = visualSprite.sourceFacing < 0
      ? -visualSprite.width * (1 - anchor)
      : -visualSprite.width * anchor;
    if (visualSprite.sourceFacing < 0) ctx.scale(-1, 1);
    ctx.drawImage(
      visualSprite.sprite,
      drawX,
      -visualSprite.height + visualSprite.yOffset,
      visualSprite.width,
      visualSprite.height
    );
    ctx.restore();
  }

  // Sprite hookups: if state-specific files exist, they are used; missing files fall back safely.
  spriteForState() {
    const table = {
      IDLE: images.glitcherIdleSword,
      RUN: images.glitcherRunSword,
      SPRINT: images.glitcherRunSword,
      SKID: images.glitcherRunSword,
      CROUCH: images.glitcherIdleSword,
      JUMP: images.glitcherJumpSword,
      JUMP_FLOAT: images.glitcherJumpSword,
      DOUBLE_JUMP: images.glitcherJumpSword,
      FALL: images.glitcherFallSword,
      WALL_SLIDE: images.glitcherWallSlide,
      WALL_JUMP: images.glitcherJumpSword,
      DASH: images.glitcherDash,
      DASH_SLASH: images.glitcherDashSlash,
      ATTACK_1: images.glitcherAttack01,
      ATTACK_2: images.glitcherAttack02,
      ATTACK_3: images.glitcherAttack03,
      AIR_ATTACK: images.glitcherAirAttack,
      UP_SLASH: images.glitcherUpSlash,
      DOWN_SLASH: images.glitcherDownSlash,
      CHARGE_ATTACK: images.glitcherChargeAttack,
      HURT: images.glitcherHurt,
      DEAD: images.glitcherDeath,
    };
    const preferred = table[this.state];
    return preferred && preferred.complete && preferred.naturalWidth ? preferred : images.glitcher;
  }

  drawWindCoat(ctx, walkCycle) {
    const plus = GlitcherMotionPlusConfig;
    const wind = this.visual.cape;
    const runKick = (this.state === "RUN" || this.state === "SPRINT" || this.state === "SKID") ? Math.sin(walkCycle) * plus.kneeBendAmount * 0.72 * this.visual.strideBlend : 0;
    const crouchFold = this.visual.crouch * 10;
    const jumpLift = -this.visual.jumpTuck * plus.jumpLegTuckAmount * 0.55;
    ctx.save();
    ctx.globalAlpha = 0.74;
    ctx.fillStyle = "#090711";
    ctx.beginPath();
    ctx.moveTo(-18, -86 + crouchFold * 0.4);
    ctx.lineTo(-34 - wind, -14 + runKick + crouchFold + jumpLift);
    ctx.lineTo(-12, -2 + crouchFold * 0.3);
    ctx.lineTo(-4, -84 + crouchFold * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#171427";
    ctx.beginPath();
    ctx.moveTo(12, -84 + crouchFold * 0.35);
    ctx.lineTo(28 - wind * 0.55, -12 - runKick + crouchFold + jumpLift * 0.7);
    ctx.lineTo(10, -2 + crouchFold * 0.3);
    ctx.lineTo(2, -84 + crouchFold * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d93cff";
    ctx.globalAlpha = 0.26;
    ctx.fillRect(-30 - wind, -22 + runKick + crouchFold + jumpLift, 10, 4);
    ctx.restore();
  }

  drawMotionAccents(ctx, walkCycle, moving, flash) {
    const plus = GlitcherMotionPlusConfig;
    const speedMix = this.visual.runSpeedMix;
    const stride = Math.sin(walkCycle);
    const crouch = this.visual.crouch;
    const tuck = this.visual.jumpTuck;
    const stepLeft = this.visual.stepLeft;
    const stepRight = this.visual.stepRight;
    const knee = plus.kneeBendAmount * this.visual.strideBlend;
    ctx.save();
    ctx.globalAlpha = flash ? 0.38 : 0.82;

    // Foot markers keep the run readable without changing collision or adding extra limbs.
    if (moving || crouch > 0.05 || tuck > 0.05) {
      ctx.fillStyle = "#07040b";
      const leftPlant = -18 - stepLeft * plus.strideLength * 0.23;
      const rightPlant = 7 + stepRight * plus.strideLength * 0.23;
      ctx.fillRect(leftPlant, -5 + crouch * 2 - tuck * 5, 19 + speedMix * 3, 4);
      ctx.fillRect(rightPlant, -3 + crouch * 2 - tuck * 4, 16 + speedMix * 3, 3);
      if (moving && speedMix > 0.62 && GlitcherMotionPlusConfig.skidDustEnabled) {
        ctx.globalAlpha *= 0.42;
        ctx.fillStyle = "#6e5b70";
        ctx.fillRect(-28 - speedMix * 8, -3, 5, 2);
        ctx.fillRect(-36 - speedMix * 10, -6, 3, 2);
        ctx.globalAlpha = flash ? 0.38 : 0.82;
      }
    }

    // Small pixel accents imply bent knees and shoulder counter-rotation without overpainting new arms.
    ctx.fillStyle = "#211a31";
    if (moving) {
      ctx.fillRect(-12 - stride * 3, -46 + Math.abs(stride) * knee * 0.18, 5, 12);
      ctx.fillRect(8 + stride * 3, -44 + Math.abs(stride) * knee * 0.16, 5, 11);
      ctx.fillStyle = "#342447";
      ctx.fillRect(-17, -102 + this.visual.shoulderTwist * 16, 8, 4);
      ctx.fillRect(10, -101 - this.visual.shoulderTwist * 16, 8, 4);
    } else if (crouch > 0.05) {
      ctx.fillRect(-14, -42 + crouch * 8, 6, 13);
      ctx.fillRect(8, -41 + crouch * 8, 6, 12);
      ctx.fillStyle = "#d93cff";
      ctx.globalAlpha *= 0.32;
      ctx.fillRect(14, -82 + crouch * 8, 8, 2);
    } else if (!this.grounded) {
      ctx.fillRect(-11, -45 - tuck * 8, 5, 10);
      ctx.fillRect(8, -44 - tuck * 7, 5, 10);
    }
    ctx.restore();
  }

  drawLooseLimbs(ctx, walkCycle, layer) {
    const speedMix = clamp(Math.abs(this.vx) / 250, 0, 1);
    const walking = this.grounded && (this.anim === "walk" || this.anim === "run");
    const stride = walking ? Math.sin(walkCycle) * speedMix : 0;
    const counter = walking ? Math.sin(walkCycle + Math.PI) * speedMix : 0;
    const airborne = this.grounded ? 0 : 1;
    const attackSwing = this.attack > 0 ? 1 - this.attack / 0.22 : 0;
    const hurtPull = this.anim === "hurt" ? -10 : 0;
    const colors = layer === "front"
      ? { core: "#171427", edge: "#2a2442", glow: "#e43cff" }
      : { core: "#090711", edge: "#18162a", glow: "#7a2cff" };
    const limb = (points, width) => {
      ctx.save();
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.strokeStyle = colors.edge;
      ctx.lineWidth = width + 4;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.stroke();
      ctx.strokeStyle = colors.core;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.stroke();
      ctx.fillStyle = colors.glow;
      const end = points[points.length - 1];
      ctx.globalAlpha = layer === "front" ? 0.55 : 0.25;
      ctx.fillRect(end[0] - 2, end[1] - 2, 4, 4);
      ctx.restore();
    };
    if (layer === "back") {
      limb([[-9, -55], [-15 - counter * 12, -31 + airborne * 10], [-13 - counter * 21, -4 + airborne * 6]], 9);
      limb([[-15, -102], [-26 - stride * 9, -82 + airborne * 7], [-24 - stride * 16, -63 + hurtPull]], 8);
      return;
    }
    const swordReach = this.attack > 0 ? 24 + attackSwing * 34 : stride * 8;
    limb([[8, -55], [12 + stride * 13, -29 + airborne * 8], [16 + stride * 24, -3 + airborne * 4]], 10);
    limb([[15, -101], [20 + swordReach * 0.55, -82 + airborne * 5], [24 + swordReach, -62 + hurtPull]], 8);
    if (walking) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#f03cff";
      ctx.fillRect(13 + stride * 24, -6 + airborne * 4, 18, 3);
      ctx.fillStyle = "#6842ff";
      ctx.fillRect(-24 - counter * 21, -7 + airborne * 6, 16, 3);
      ctx.restore();
    }
  }

  drawSword(ctx, walkCycle) {
    const plus = GlitcherMotionPlusConfig;
    const attacking = !!this.attackState;
    const def = attacking ? Player.attacks[this.attackState] : null;
    const slash = attacking ? clamp((this.attackDuration - this.attackTimer) / def.duration, 0, 1) : 0;
    const walkSway = this.grounded && (this.state === "RUN" || this.state === "SPRINT") ? Math.sin(walkCycle) * 0.12 : 0;
    const speedMix = clamp(Math.abs(this.vx) / 250, 0, 1);
    const handSwing = this.grounded && (this.state === "RUN" || this.state === "SPRINT") ? Math.sin(walkCycle) * speedMix * plus.armSwingAmount : 0;
    const runGuard = this.grounded && (this.state === "RUN" || this.state === "SPRINT") ? this.visual.runSpeedMix : 0;
    const crouch = this.visual.crouch;
    const airLift = this.grounded ? 0 : -8;
    if (attacking) this.drawSwordSlashTrail(ctx, slash, airLift);
    ctx.save();
    const windup = slash < 0.32;
    const follow = slash > 0.72;
    let handX = 21 + handSwing - crouch * 3;
    let handY = -62 + airLift + crouch * 13;
    let angle = -0.4 + walkSway - runGuard * plus.swordRunAngle * 0.45 + crouch * 0.24;
    if (this.state === "WALL_SLIDE") {
      handX = 12;
      handY = -80;
      angle = -1.15;
    }
    if (this.state === "JUMP" || this.state === "DOUBLE_JUMP" || this.state === "FALL") {
      angle = -0.62 - this.visual.jumpTuck * 0.12;
    }
    if (attacking) {
      handX += Math.sin(slash * Math.PI) * (this.attackState === "UP_SLASH" ? 4 : 18);
      handY += Math.sin(slash * Math.PI * 1.25) * -8;
      if (this.attackState === "UP_SLASH") angle = -2.15 + slash * 1.15;
      else if (this.attackState === "DOWN_SLASH") angle = 0.9 + slash * 0.8;
      else if (this.attackState === "DASH_SLASH") angle = -0.85 + slash * 1.65;
      else if (this.attackState === "CHARGE_ATTACK") angle = -1.75 + slash * 2.9;
      else angle = -1.35 + slash * 2.55;
    }
    ctx.translate(handX, handY);
    ctx.rotate(angle);
    if (attacking) {
      ctx.shadowColor = "#d93cff";
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = "#6d2cff";
      ctx.shadowBlur = 7;
    }
    if (attacking) {
      ctx.save();
      ctx.rotate(windup ? -0.45 : follow ? 0.25 : 0);
      ctx.fillStyle = "#171427";
      ctx.fillRect(-22, -4, 28, 8);
      ctx.fillStyle = "#2a2442";
      ctx.fillRect(-24, -7, 16, 14);
      ctx.fillStyle = "#e43cff";
      ctx.fillRect(-10, -3, 5, 6);
      ctx.restore();
    }
    ctx.fillStyle = "#120b1b";
    ctx.fillRect(-10, -3, 15, 6);
    ctx.fillStyle = "#442250";
    ctx.fillRect(-13, -2, 5, 4);
    ctx.fillStyle = "#f3c65d";
    ctx.fillRect(-1, -8, 8, 16);
    ctx.fillRect(-6, -5, 20, 4);
    ctx.fillStyle = "#6b4215";
    ctx.fillRect(1, 6, 6, 3);
    ctx.fillStyle = "#f3c65d";
    ctx.fillRect(8, -6, 60, 12);
    ctx.fillStyle = "#d93cff";
    ctx.fillRect(12, -4, 53, 8);
    ctx.fillStyle = "#5b1f8f";
    ctx.fillRect(15, 2, 47, 3);
    ctx.fillStyle = "#fff4b8";
    ctx.fillRect(14, -6, 45, 2);
    ctx.fillRect(66, -3, 8, 6);
    ctx.fillStyle = "#ff79ff";
    ctx.fillRect(29, -3, 4, 6);
    ctx.fillRect(48, -3, 3, 6);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawSwordSlashTrail(ctx, slash, airLift) {
    const t = clamp(slash, 0, 1);
    const box = this.activeAttackBox();
    ctx.save();
    ctx.translate(this.attackState === "UP_SLASH" ? 2 : 24, (this.attackState === "DOWN_SLASH" ? -46 : -70) + airLift);
    ctx.rotate(this.attackState === "DOWN_SLASH" ? 0.55 + t * 1.3 : this.attackState === "UP_SLASH" ? -2.05 + t * 1.1 : -1.35 + t * 2.25);
    ctx.shadowColor = "#d93cff";
    ctx.shadowBlur = 18;
    ctx.lineCap = "butt";
    ctx.globalAlpha = 0.22 + Math.sin(t * Math.PI) * 0.32;
    ctx.strokeStyle = "#6d2cff";
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(35, 18, 74, -0.78, 0.62);
    ctx.stroke();
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = "#d93cff";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(35, 18, 72, -0.7, 0.48);
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = "#fff4b8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(35, 18, 69, -0.58, 0.35);
    ctx.stroke();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ff79ff";
    for (let i = 0; i < 6; i++) {
      const a = -0.58 + i * 0.18 + t * 0.12;
      const r = 76 - i * 3;
      ctx.fillRect(35 + Math.cos(a) * r, 18 + Math.sin(a) * r, 7, 7);
    }
    if (box) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#d93cff";
      ctx.fillRect(box.x - this.x, box.y - this.y, box.w, box.h);
    }
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 460;
    this.vy = (Math.random() - 0.9) * 380;
    this.life = 0.55 + Math.random() * 0.35;
    this.color = color;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 950 * dt;
  }

  draw(ctx, cam) {
    ctx.globalAlpha = clamp(this.life * 2, 0, 1);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y - cam, 4, 4);
    ctx.globalAlpha = 1;
  }
}

class GameProjectile {
  constructor(config) {
    this.id = config.id;
    this.owner = config.owner;
    this.type = config.type;
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.r = config.r || 13;
    this.damage = config.damage || 1;
    this.life = config.life || 3;
    this.gravity = config.gravity || 0;
    this.dead = false;
    this.phase = Math.random() * Math.PI * 2;
  }

  rect() {
    return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 };
  }

  update(dt, game) {
    if (this.dead) return;
    this.life -= dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || this.x < 20 || this.x > WORLD_W - 20 || this.y < -120 || this.y > WORLD_H + 120) {
      this.dead = true;
      return;
    }
    const box = this.rect();
    if (game.platforms.some((platform) => platform.kind !== "danger" && overlap(box, platform))) {
      this.dead = true;
      game.burst(this.x, this.y, "#b23cff", 8);
      return;
    }
    if (this.owner === "boss" && overlap(box, game.player.rect()) && game.player.invuln <= 0) {
      this.dead = true;
      game.player.hurt(Math.sign(game.player.x - this.x) || 1, game, this.damage);
      game.burst(this.x, this.y, "#ff315c", 12);
    }
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const y = this.y - cam;
    ctx.save();
    ctx.translate(this.x, y);
    ctx.shadowColor = "#ff315c";
    ctx.shadowBlur = 14;
    const g = ctx.createRadialGradient(-4, -4, 1, 0, 0, this.r);
    g.addColorStop(0, "#fff4b8");
    g.addColorStop(0.28, "#ff5fd2");
    g.addColorStop(0.72, "#9c2cff");
    g.addColorStop(1, "#31051c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, this.r + Math.sin(performance.now() * 0.012 + this.phase) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ff9af0";
    ctx.stroke();
    ctx.restore();
  }
}

class WeatherParticle {
  constructor(kind) {
    this.kind = kind;
    this.reset(true);
  }

  reset(anywhere = false) {
    this.x = Math.random() * W;
    this.y = anywhere ? Math.random() * H : -20 - Math.random() * 80;
    if (this.kind === "rain") {
      this.vx = -24 - Math.random() * 24;
      this.vy = 260 + Math.random() * 210;
      this.size = 8 + Math.random() * 10;
      this.alpha = 0.14 + Math.random() * 0.18;
      this.color = "#9fdcff";
    } else if (this.kind === "ash") {
      this.vx = -18 + Math.random() * 36;
      this.vy = 16 + Math.random() * 42;
      this.size = 2 + Math.random() * 3;
      this.alpha = 0.18 + Math.random() * 0.28;
      this.color = Math.random() > 0.45 ? "#d6a7ff" : "#f3c65d";
    } else {
      this.vx = -10 + Math.random() * 20;
      this.vy = -3 + Math.random() * 8;
      this.size = 38 + Math.random() * 90;
      this.alpha = 0.025 + Math.random() * 0.055;
      this.color = "#bdd6ff";
    }
  }

  update(dt, wind) {
    this.x += (this.vx + wind) * dt;
    this.y += this.vy * dt;
    if (this.x < -120 || this.x > W + 120 || this.y > H + 120) this.reset(false);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    if (this.kind === "rain") {
      ctx.fillRect(this.x, this.y, 2, this.size);
    } else if (this.kind === "ash") {
      ctx.fillRect(this.x, this.y, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.size, this.size * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class Game {
  constructor() {
    this.audio = new AudioSystem();
    this.keys = new Set();
    this.state = "title";
    this.menuIndex = 0;
    this.soundtrackIndex = 0;
    this.pad = {};
    this.padPrev = {};
    this.controllerName = "No controller detected";
    this.soundtrackOptions = [
      { label: "MENU - BLUE HILL ZONE", key: "menu" },
      { label: "STAGE - EMERALD WORLD", key: "gameA" },
      { label: "ALT STAGE - EMERALD MIX", key: "gameB" },
      { label: "ENDING - ENCOUNTERS", key: "end" },
    ];
    this.cameraY = WORLD_H - H;
    this.targetCameraY = this.cameraY;
    this.cameraZoom = 1;
    this.targetZoom = 1;
    this.shake = 0;
    this.hitStop = 0;
    this.platforms = [];
    this.enemies = [];
    this.orbs = [];
    this.healthPickups = [];
    this.lockedWall = null;
    this.exitDoor = null;
    this.boss = null;
    this.particles = [];
    this.projectiles = [];
    this.weather = [];
    for (let i = 0; i < 16; i++) this.weather.push(new WeatherParticle("ash"));
    for (let i = 0; i < 36; i++) this.weather.push(new WeatherParticle("rain"));
    for (let i = 0; i < 6; i++) this.weather.push(new WeatherParticle("fog"));
    this.collected = 0;
    this.worldIndex = 0;
    this.worlds = [
      "Planitia, Mars",
      "Glitch Grid",
      "Gravity Tomb",
      "Alien Hive",
      "Rust Canyon",
      "Void Jungle",
      "Crystal Wastes",
      "Vektaur's Rift",
    ];
    this.message = "";
    this.messageTime = 0;
    this.currentMusicArea = "";
    this.hazardCooldown = 0;
    this.dogBarkCooldown = 0;
    this.bossArrivalPlayed = false;
    this.escapeDogsSpawned = false;
    this.projectileId = 0;
    this.score = 0;
    this.runTime = 0;
    this.player = new Player(120, WORLD_H - 58);
    this.buildLevel();
    this.bind();
    this.initDomMenu();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  buildLevel() {
    this.platforms = [];
    const P = (x, y, w, h, kind) => this.platforms.push(new Platform(x, y, w, h, kind));
    const Bridge = (x, y, w) => P(x, y, w, 24, "bridge");
    const Rock = (x, y, w = 170) => P(x, y, w, 26, "stone");
    const Danger = (x, y, w) => P(x, y, w, 28, "danger");
    P(0, WORLD_H - 42, WORLD_W, 42, "wall");
    Bridge(0, 3142, 238); Bridge(298, 3096, 112); Bridge(438, 3050, 116);
    Bridge(585, 2995, 126); Bridge(732, 2928, 228); Bridge(0, 2860, 310);
    Bridge(332, 2810, 210); Bridge(590, 2738, 295); Rock(142, 2650, 210);
    Bridge(70, 2990, 290); Bridge(410, 2926, 260); Rock(704, 2862, 185);
    Bridge(470, 2764, 315); Rock(188, 2702, 230); Bridge(65, 2578, 235);
    Bridge(352, 2492, 270); Rock(660, 2408, 215); Bridge(430, 2294, 250);
    Rock(132, 2210, 260); Bridge(382, 2106, 330); Rock(710, 1998, 175);
    Bridge(472, 1888, 240); Rock(178, 1800, 250); Bridge(72, 1676, 240);
    Bridge(350, 1580, 280); Rock(682, 1484, 210); Bridge(430, 1368, 240);
    Rock(126, 1288, 230); Bridge(330, 1180, 295); Rock(668, 1072, 210);
    Bridge(470, 950, 260); Rock(130, 862, 230); Bridge(334, 742, 300);
    Rock(690, 622, 170); Bridge(456, 510, 260); Rock(185, 414, 265);
    Danger(86, 268, 810); Bridge(662, 238, 235);
    Rock(395, 112, 210); Bridge(760, 154, 168);
    P(36, 2348, 40, 260, "wall"); P(WORLD_W - 76, 1760, 40, 250, "wall"); P(36, 1025, 40, 260, "wall");
    P(0, 0, 30, WORLD_H, "wall"); P(WORLD_W - 30, 0, 30, WORLD_H, "wall");
    this.lockedWall = null;
    this.exitDoor = new ExitDoor(836, 58, 84, 94);
    this.enemies = [
      new Enemy(252, 3142, 205, 430, "dog"),
      new Enemy(815, 2928, 738, 925, "dog"),
      new Enemy(455, 2810, 350, 535, "dog"),
      new Enemy(595, 2764, 480, 780, "shade"),
      new Enemy(230, 2210, 150, 390, "brute"),
      new Enemy(610, 1888, 485, 700, "wolf"),
      new Enemy(190, 1288, 120, 325, "shade"),
      new Enemy(555, 950, 505, 730, "brute"),
      new Enemy(510, 414, 210, 450, "wolf"),
    ];
    this.boss = new Abyss_Wing_God(770, 300);
    this.orbs = [
      new BulgaSphere(790, 2824, 0),
      new BulgaSphere(112, 2534, 1),
      new BulgaSphere(468, 2450, 2),
      new BulgaSphere(820, 1442, 3),
      new BulgaSphere(164, 1244, 4),
      new BulgaSphere(545, 910, 5),
      new BulgaSphere(220, 372, 6),
      new BulgaSphere(760, 124, 7),
    ];
    this.healthPickups = [
      new HealthPickup(365, 3058),
      new HealthPickup(650, 2738),
      new HealthPickup(218, 2210),
      new HealthPickup(700, 1072),
      new HealthPickup(468, 308),
      new HealthPickup(180, 268),
      new HealthPickup(520, 112),
    ];
  }

  restart() {
    this.player = new Player(120, WORLD_H - 58);
    this.cameraY = WORLD_H - H;
    this.targetCameraY = this.cameraY;
    this.cameraZoom = 1;
    this.targetZoom = 1;
    this.shake = 0;
    this.hitStop = 0;
    this.collected = 0;
    this.particles = [];
    this.projectiles = [];
    this.currentMusicArea = "";
    this.hazardCooldown = 0;
    this.dogBarkCooldown = 0;
    this.bossArrivalPlayed = false;
    this.escapeDogsSpawned = false;
    this.projectileId = 0;
    this.score = 0;
    this.runTime = 0;
    this.buildLevel();
    this.message = "Glitcher reboots.";
    this.messageTime = 1.6;
  }

  bind() {
    addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      this.audio.init();
      if (this.state === "title") return this.navTitle(e.code);
      if (this.state === "soundtrack") return this.navSoundtrack(e.code);
      if (this.state === "win" && (e.code === "Enter" || e.code === "Space")) {
        this.state = "title";
        videos.end.pause();
        this.audio.music("menu");
        this.syncDomMenu();
        return;
      }
      if (this.state === "credits" && (e.code === "Enter" || e.code === "Space")) {
        this.state = "title";
        this.syncDomMenu();
        return;
      }
      if (e.code === "Escape") {
        this.state = "title";
        this.audio.music("menu");
        this.syncDomMenu();
        return;
      }
      if (this.state !== "playing") {
        if (e.code === "Enter" || e.code === "Space") this.state = "title";
        return;
      }
      if (e.code === "Space" && !e.repeat) this.player.buffer("jump");
      if ((e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyK") && !e.repeat) this.player.buffer("dash");
      if ((e.code === "KeyF" || e.code === "KeyJ") && !e.repeat) this.player.buffer("attack");
      this.keys.add(e.code);
    });
    addEventListener("keyup", (e) => {
      if (e.code === "KeyF" || e.code === "KeyJ") this.player.releaseAttack(this);
      this.keys.delete(e.code);
    });
    canvas.addEventListener("pointerdown", () => {
      this.audio.init();
      if (this.state === "playing") this.player.swing(this);
    });
    addEventListener("gamepadconnected", (e) => {
      this.controllerName = e.gamepad.id || "Controller connected";
      this.message = "Controller connected.";
      this.messageTime = 1.2;
    });
    addEventListener("gamepaddisconnected", () => {
      this.controllerName = "No controller detected";
    });
  }

  initDomMenu() {
    this.menuScreen = document.getElementById("menu-screen");
    this.menuItems = Array.from(document.querySelectorAll("[data-menu-index]"));
    const starsEl = document.getElementById("menu-stars");
    if (starsEl && !starsEl.children.length) {
      for (let i = 0; i < 60; i++) {
        const star = document.createElement("span");
        const size = Math.random() < 0.75 ? 1 : 2;
        star.className = "star";
        star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 70}%;--d:${1.5 + Math.random() * 3}s;--a1:${0.1 + Math.random() * 0.3};--a2:${0.6 + Math.random() * 0.4};--delay:${Math.random() * 3}s`;
        starsEl.appendChild(star);
      }
    }
    this.menuItems.forEach((item) => {
      const index = Number(item.dataset.menuIndex);
      item.addEventListener("pointerenter", () => {
        if (this.menuIndex !== index) this.audio.sfx("menu");
        this.menuIndex = index;
        this.syncDomMenu();
      });
      item.addEventListener("click", () => {
        this.audio.init();
        this.menuIndex = index;
        this.navTitle("Enter");
      });
    });
    this.syncDomMenu();
  }

  syncDomMenu() {
    if (!this.menuScreen) return;
    this.menuScreen.classList.toggle("hidden", this.state !== "title");
    this.menuItems.forEach((item) => item.classList.toggle("active", Number(item.dataset.menuIndex) === this.menuIndex));
  }

  navTitle(code) {
    const count = this.menuItems.length || 6;
    const before = this.menuIndex;
    if (code === "ArrowUp" || code === "KeyW") this.menuIndex = (this.menuIndex + count - 1) % count;
    if (code === "ArrowDown" || code === "KeyS") this.menuIndex = (this.menuIndex + 1) % count;
    if (before !== this.menuIndex) this.audio.sfx("menu");
    if (code === "Enter" || code === "Space") {
      this.audio.sfx("select");
      if (this.menuIndex === 0 || this.menuIndex === 1) this.start();
      if (this.menuIndex === 2) this.state = "soundtrack";
      if (this.menuIndex === 3) this.state = "settings";
      if (this.menuIndex === 4) this.state = "credits";
      if (this.menuIndex === 5) {
        this.message = "Future chapter locked.";
        this.messageTime = 1.4;
      }
    }
    this.syncDomMenu();
  }

  navSoundtrack(code) {
    const count = this.soundtrackOptions.length;
    const before = this.soundtrackIndex;
    if (code === "ArrowUp" || code === "KeyW" || code === "ArrowLeft" || code === "KeyA") {
      this.soundtrackIndex = (this.soundtrackIndex + count - 1) % count;
    }
    if (code === "ArrowDown" || code === "KeyS" || code === "ArrowRight" || code === "KeyD") {
      this.soundtrackIndex = (this.soundtrackIndex + 1) % count;
    }
    if (before !== this.soundtrackIndex) {
      this.audio.music(this.soundtrackOptions[this.soundtrackIndex].key);
    }
    if (code === "Enter" || code === "Space") {
      this.audio.music(this.soundtrackOptions[this.soundtrackIndex].key);
    }
    if (code === "Escape") {
      this.state = "title";
      this.audio.music("menu");
      this.syncDomMenu();
    }
  }

  start() {
    this.audio.nextStage = false;
    this.audio.music("gameA");
    this.currentMusicArea = "gameA";
    this.state = "playing";
    this.restart();
    this.audio.sfx("wolfIntro");
    this.message = "Find 8 hidden orbs. Defeat the boss to unlock the last one.";
    this.messageTime = 2;
  }

  finishGame() {
    if (this.state === "win" || this.playerDead()) return;
    this.state = "win";
    Object.values(this.audio.tracks).forEach((track) => track.pause());
    this.audio.music("end");
    try {
      if (videos.boss) videos.boss.pause();
      videos.end.pause();
      if (videos.end.readyState > 0) videos.end.currentTime = 0;
      else videos.end.load();
      const play = videos.end.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    } catch (error) {
      try {
        videos.end.load();
      } catch (_) {}
    }
    this.messageTime = 0;
  }

  playerDead() {
    return this.player.hp <= 0 || this.player.deadTimer > 0;
  }

  burst(x, y, color, count) {
    const amount = Math.min(count, 24, Math.max(0, MAX_PARTICLES - this.particles.length));
    for (let i = 0; i < amount; i++) this.particles.push(new Particle(x, y, color));
  }

  addProjectile(config) {
    config.id = `${config.type}-${++this.projectileId}`;
    this.projectiles.push(new GameProjectile(config));
  }

  spawnEscapeDogs() {
    if (this.escapeDogsSpawned) return;
    this.escapeDogsSpawned = true;
    const behind = this.player.facing >= 0 ? this.player.x - 170 : this.player.x + 170;
    this.enemies.push(new Enemy(clamp(behind, 100, 850), clamp(this.player.y, 268, WORLD_H - 58), 90, 900, "dog"));
    this.enemies.push(new Enemy(856, 154, 778, 930, "dog"));
    this.message = "The guardian falls. One last dog guards the exit.";
    this.messageTime = 2.2;
  }

  update(dt) {
    this.pollGamepad();
    const wasPlaying = this.state === "playing";
    this.handleGamepadMenus();
    if (!wasPlaying && this.state === "playing") {
      this.finishPadFrame();
      return;
    }
    if (this.state === "title") this.audio.music("menu");
    this.syncDomMenu();
    if (this.messageTime > 0) this.messageTime -= dt;
    if (this.state !== "playing") {
      this.finishPadFrame();
      return;
    }
    this.runTime += dt;
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      this.finishPadFrame();
      return;
    }
    if (this.padPressed("jump")) this.player.buffer("jump");
    if (this.padPressed("dash")) this.player.buffer("dash");
    if (this.padPressed("attack")) this.player.buffer("attack");
    if (!this.pad.attack && this.padPrev.attack) this.player.releaseAttack(this);
    this.player.update(dt, this);
    this.updateAreaMusic();
    const scene = this.currentScene();
    const lead = this.player.vy < -80 ? H * 0.76 : this.player.y < 620 ? H * 0.7 : H * 0.6;
    this.targetCameraY = clamp(this.player.y - lead, scene.min, scene.max);
    const cameraSnap = this.targetCameraY < this.cameraY ? 0.00025 : 0.006;
    this.cameraY += (this.targetCameraY - this.cameraY) * (1 - Math.pow(cameraSnap, dt));
    this.targetZoom = scene.zoom;
    this.cameraZoom += (this.targetZoom - this.cameraZoom) * (1 - Math.pow(0.02, dt));
    this.shake = Math.max(0, this.shake - 24 * dt);
    this.hazardCooldown = Math.max(0, this.hazardCooldown - dt);
    this.dogBarkCooldown = Math.max(0, this.dogBarkCooldown - dt);
    if (!this.bossArrivalPlayed && this.player.y < 620) {
      this.bossArrivalPlayed = true;
      this.audio.sfx("bossArrive");
      this.burst(this.boss ? this.boss.x : WORLD_W / 2, this.boss ? this.boss.y - 190 : 320, "#ff315c", 34);
      this.shake = Math.max(this.shake, 5);
    }
    const wind = Math.sin(performance.now() * 0.0004) * 18;
    this.weather.forEach((w) => w.update(dt, wind));
    if (this.lockedWall && !this.lockedWall.open && overlap(this.player.rect(), this.lockedWall.rect())) {
      if (this.player.x < this.lockedWall.x + this.lockedWall.w / 2) this.player.x = this.lockedWall.x - this.player.w / 2;
      else this.player.x = this.lockedWall.x + this.lockedWall.w + this.player.w / 2;
      this.player.vx = 0;
    }
    this.orbs.forEach((orb) => orb.update(this.player, this));
    this.healthPickups.forEach((pickup) => pickup.update(this.player, this));
    this.platforms.forEach((platform) => {
      if (platform.kind !== "danger" || this.hazardCooldown > 0) return;
      const r = this.player.rect();
      const onBrick = overlap(r, platform) && this.player.y <= platform.y + 10 && this.player.y >= platform.y - 12;
      if (!onBrick) return;
      this.hazardCooldown = 0.9;
      this.player.hurt(this.player.facing * -1, this);
      this.burst(this.player.x, this.player.y - 10, "#ff4f75", 14);
    });
    this.enemies.forEach((enemy) => enemy.update(dt, this.platforms, this.player, this));
    this.separateEnemies();
    if (this.boss) this.boss.update(dt, this.player, this);
    if (this.boss && this.boss.dead) this.spawnEscapeDogs();
    this.projectiles.forEach((projectile) => projectile.update(dt, this));
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    if (this.exitDoor) this.exitDoor.update(this.player, this);
    const sword = this.player.activeAttackBox();
    if (sword) {
      this.enemies.forEach((enemy) => {
        if (enemy.dead || this.player.hitTargets.has(enemy) || !overlap(sword, enemy.rect())) return;
        this.player.hitTargets.add(enemy);
        enemy.hit(this, this.player.facing, sword.damage, sword.heavy);
        this.score += enemy.dead ? 300 : 75;
        this.hitStop = Math.max(this.hitStop, sword.heavy ? 0.06 : 0.032);
        this.burst(enemy.x, enemy.y - 42, "#d93cff", sword.heavy ? 22 : 12);
      });
      const bossHit = this.boss && !this.boss.dead ? this.boss.damageForSword(sword) : null;
      if (bossHit && !this.player.hitTargets.has(this.boss)) {
        this.player.hitTargets.add(this.boss);
        this.boss.hit(this, bossHit.damage, sword.heavy);
        this.score += bossHit.zone === "mouth" ? 180 : bossHit.zone === "claw" ? 120 : 60;
        this.hitStop = Math.max(this.hitStop, sword.heavy ? 0.08 : 0.04);
        this.burst(this.boss.x, this.boss.y - 150, "#ffd671", sword.heavy ? 28 : 14);
      }
    }
    this.particles.forEach((p) => p.update(dt));
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.collected >= TOTAL_ORBS && (!this.boss || this.boss.dead) && this.exitDoor && this.exitDoor.open) {
      this.message = "All orbs found. Climb into the top exit.";
      this.messageTime = Math.max(this.messageTime, 0.5);
    }
    this.finishPadFrame();
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const pad = pads[0];
    this.controllerName = pad ? pad.id : "No controller detected";
    const button = (i) => !!pad && !!pad.buttons[i] && pad.buttons[i].pressed;
    const axis = (i) => pad && typeof pad.axes[i] === "number" ? pad.axes[i] : 0;
    this.pad = {
      left: !!pad && (axis(0) < -0.32 || button(14)),
      right: !!pad && (axis(0) > 0.32 || button(15)),
      up: !!pad && (axis(1) < -0.42 || button(12)),
      down: !!pad && (axis(1) > 0.42 || button(13)),
      jump: !!pad && (button(0) || button(1)),
      attack: !!pad && (button(2) || button(5)),
      dash: !!pad && (button(4) || button(7)),
      start: !!pad && (button(9) || button(8)),
    };
  }

  padPressed(name) {
    return !!this.pad[name] && !this.padPrev[name];
  }

  finishPadFrame() {
    this.padPrev = { ...this.pad };
  }

  isDown(code) {
    const map = {
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      KeyW: "up",
      ArrowUp: "up",
      KeyS: "down",
      ArrowDown: "down",
      Space: "jump",
      KeyF: "attack",
      KeyJ: "attack",
      ShiftLeft: "dash",
      ShiftRight: "dash",
      KeyK: "dash",
    };
    return this.keys.has(code) || !!this.pad[map[code]];
  }

  handleGamepadMenus() {
    if (!this.pad.start && !this.pad.jump && !this.pad.attack && !this.pad.up && !this.pad.down && !this.pad.left && !this.pad.right && !this.pad.dash) return;
    if (this.state === "title") {
      if (this.padPressed("up")) this.navTitle("ArrowUp");
      if (this.padPressed("down")) this.navTitle("ArrowDown");
      if (this.padPressed("jump") || this.padPressed("attack") || this.padPressed("start")) this.navTitle("Enter");
      return;
    }
    if (this.state === "soundtrack") {
      if (this.padPressed("up") || this.padPressed("left")) this.navSoundtrack("ArrowUp");
      if (this.padPressed("down") || this.padPressed("right")) this.navSoundtrack("ArrowDown");
      if (this.padPressed("jump") || this.padPressed("attack")) this.navSoundtrack("Enter");
      if (this.padPressed("dash") || this.padPressed("start")) this.navSoundtrack("Escape");
      return;
    }
    if (this.state === "settings" || this.state === "credits") {
      if (this.padPressed("jump") || this.padPressed("attack") || this.padPressed("start") || this.padPressed("dash")) {
        this.state = "title";
        this.audio.music("menu");
        this.syncDomMenu();
      }
      return;
    }
    if (this.state === "win" && (this.padPressed("jump") || this.padPressed("attack") || this.padPressed("start"))) {
      this.state = "title";
      videos.end.pause();
      this.audio.music("menu");
      this.syncDomMenu();
    }
  }

  separateEnemies() {
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j];
        if (a.topDog || b.topDog) continue;
        if (b.dead || Math.abs(a.y - b.y) > 12 || !overlap(a.rect(), b.rect())) continue;
        const push = Math.sign(a.x - b.x) || 1;
        a.x = clamp(a.x + push * 8, a.left, a.right);
        b.x = clamp(b.x - push * 8, b.left, b.right);
        a.vx = Math.abs(a.vx) * push;
        b.vx = -Math.abs(b.vx) * push;
      }
    }
  }

  updateAreaMusic() {
    const area = this.player.y < 520 ? "gameB" : "gameA";
    if (area === this.currentMusicArea) return;
    this.currentMusicArea = area;
    this.audio.music(area);
  }

  currentScene() {
    const y = this.player.y;
    if (y < 360) return { min: 0, max: 360, zoom: 0.82 };
    if (y < 760) return { min: 80, max: 780, zoom: 0.9 };
    if (y < 1320) return { min: 650, max: 1460, zoom: 0.96 };
    if (y < 2050) return { min: 1260, max: 2180, zoom: 0.94 };
    if (y < 2600) return { min: 2040, max: 2760, zoom: 0.96 };
    return { min: WORLD_H - H, max: WORLD_H - H, zoom: 1 };
  }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.draw();
    requestAnimationFrame((n) => this.loop(n));
  }

  drawBackground() {
    ctx.fillStyle = "#020611";
    ctx.fillRect(0, 0, W, H);
    const layers = [
      { img: images.bgVoidHall, speed: 0.16, alpha: 0.58 },
      { img: images.bgColumns, speed: 0.28, alpha: 0.5 },
      { img: images.bgArch, speed: 0.42, alpha: 0.72 },
      { img: images.bgPinballRuins, speed: 0.56, alpha: 0.4 },
    ];
    layers.forEach((layer) => {
      const img = layer.img;
      if (!img || !img.complete || !img.naturalWidth) return;
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const bw = img.naturalWidth * scale;
      const bh = img.naturalHeight * scale;
      const drift = (this.cameraY * layer.speed) % Math.max(1, bh);
      ctx.save();
      ctx.globalAlpha = layer.alpha;
      ctx.drawImage(img, (W - bw) / 2, -drift, bw, bh);
      ctx.drawImage(img, (W - bw) / 2, -drift + bh, bw, bh);
      ctx.restore();
    });
    ctx.fillStyle = "rgba(2, 5, 13, .22)";
    ctx.fillRect(0, 0, W, H);
    this.drawOpeningMapBackdrop();
  }

  drawOpeningMapBackdrop() {
    const img = images.openingMap;
    if (!img || !img.complete || !img.naturalWidth) return;
    const alpha = 0.92;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const bw = img.naturalWidth * scale;
    const bh = img.naturalHeight * scale;
    const bottomView = clamp(this.cameraY / Math.max(1, WORLD_H - H), 0, 1);
    const y = (H - bh) * bottomView - 64 * (1 - bottomView);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - bw) / 2, y, bw, bh);
    ctx.fillStyle = "rgba(5, 8, 18, .18)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  draw() {
    ctx.clearRect(0, 0, W, H);
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);
    this.drawBackground();
    if (this.boss && this.state === "playing") this.boss.drawBackdrop(ctx, this.player.y);
    this.weather.forEach((w) => { if (w.kind === "fog") w.draw(ctx); });
    if (this.state === "settings") {
      this.drawPanel("SETTINGS", [
        "Keyboard: A/D or arrows move",
        "Keyboard: Space jump / double jump",
        "Keyboard: F or J sword, Shift or K dash",
        "Controller: left stick or D-pad moves",
        "Controller: A/Cross jumps, X/Square swords",
        "Controller: L1/RT dash, Start menu",
        `Detected: ${this.controllerName}`,
      ]);
      ctx.restore();
      return;
    }
    if (this.state === "soundtrack") {
      this.drawSoundtrackMenu();
      ctx.restore();
      return;
    }
    if (this.state === "credits") {
      this.drawPanel("CREDITS", ["ORBS: A Glitcher Adventure", "Glitcher recovered the hidden orbs", "Boss wolf defeated", "Press Enter to return to demo page"]);
      ctx.restore();
      return;
    }
    if (this.state === "win") {
      this.drawEndScreen();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-W / 2, -H / 2);
    this.platforms.forEach((p) => p.draw(ctx, this.cameraY));
    if (this.exitDoor) this.exitDoor.draw(ctx, this.cameraY, this.collected);
    if (this.lockedWall) this.lockedWall.draw(ctx, this.cameraY);
    this.orbs.forEach((orb) => orb.draw(ctx, this.cameraY));
    this.healthPickups.forEach((pickup) => pickup.draw(ctx, this.cameraY));
    this.enemies.forEach((e) => e.draw(ctx, this.cameraY));
    if (this.boss) this.boss.draw(ctx, this.cameraY);
    this.projectiles.forEach((projectile) => projectile.draw(ctx, this.cameraY));
    this.player.draw(ctx, this.cameraY);
    this.particles.forEach((p) => p.draw(ctx, this.cameraY));
    ctx.restore();
    this.weather.forEach((w) => { if (w.kind !== "fog") w.draw(ctx); });
    ctx.restore();
    this.drawHud();
    this.drawCrt();
  }

  drawBossPresence() {
    const img = images.wolfArena && images.wolfArena.complete && images.wolfArena.naturalWidth ? images.wolfArena : images.boss;
    if (!img || !img.complete || !img.naturalWidth) return;
    const topProgress = clamp((640 - this.player.y) / 560, 0, 1);
    const y = 24 + topProgress * 110 - this.cameraY * 0.02;
    ctx.save();
    ctx.globalAlpha = 0.08 + topProgress * 0.28;
    ctx.shadowColor = "#ff44ff";
    ctx.shadowBlur = 28;
    if (topProgress < 0.35) {
      ctx.drawImage(img, W - 260, y - 30, 210, 150);
    } else if (topProgress < 0.72) {
      ctx.drawImage(img, W - 430, y - 80, 390, 260);
      ctx.fillStyle = "rgba(0,0,0,.52)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.drawImage(img, W - 560, y - 135, 540, 420);
      ctx.fillStyle = "rgba(0,0,0,.34)";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 0.12 + topProgress * 0.14;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  drawEndScreen() {
    if (videos.end.readyState >= 2) {
      try {
        const vw = videos.end.videoWidth || W;
        const vh = videos.end.videoHeight || H;
        const scale = Math.max(W / vw, H / vh);
        const bw = vw * scale;
        const bh = vh * scale;
        ctx.drawImage(videos.end, (W - bw) / 2, (H - bh) / 2, bw, bh);
        ctx.fillStyle = "rgba(0,0,0,.16)";
        ctx.fillRect(0, 0, W, H);
        return;
      } catch (error) {}
    }
    const img = images.endScreen;
    if (img && img.complete && img.naturalWidth) {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const bw = img.naturalWidth * scale;
      const bh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - bw) / 2, (H - bh) / 2, bw, bh);
      ctx.fillStyle = "rgba(0,0,0,.38)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "rgba(0,0,0,.82)";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff4b8";
    ctx.font = "32px Courier New";
    ctx.fillText("THE GOLDEN ORB IS CLAIMED", W / 2, 122);
    ctx.font = "18px Courier New";
    ctx.fillStyle = "#dbeaff";
    ctx.fillText("Press Enter to return to the demo page", W / 2, H - 72);
  }

  drawHud() {
    ctx.fillStyle = "#050813";
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = "#1b2a44";
    ctx.fillRect(0, 28, W, 2);
    ctx.fillStyle = "#f6d36a";
    ctx.font = "13px Courier New";
    ctx.textAlign = "left";
    ctx.fillText("HP", 12, 20);
    for (let i = 0; i < this.player.maxHp; i++) {
      ctx.save();
      ctx.globalAlpha = i < this.player.hp ? 1 : 0.22;
      ctx.shadowColor = "#ff44ff";
      ctx.shadowBlur = i < this.player.hp ? 3 : 0;
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👾", 50 + i * 21, 18);
      ctx.restore();
    }
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f7e6a1";
    ctx.font = "14px Courier New";
    ctx.fillText(`PLANITIA, MARS   ORBS ${this.collected}/${TOTAL_ORBS}`, W / 2, 20);
    ctx.textAlign = "right";
    ctx.fillStyle = "#72fff0";
    ctx.fillText(`SCORE ${String(this.score).padStart(6, "0")}`, W - 12, 20);
    if (this.boss && !this.boss.dead && this.player.y < 650) {
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(W / 2 - 118, 30, 236, 6);
      ctx.fillStyle = "#ff44ff";
      ctx.fillRect(W / 2 - 116, 32, 232 * (this.boss.hp / this.boss.maxHp), 2);
      ctx.strokeStyle = "#ffd671";
      ctx.strokeRect(W / 2 - 118, 30, 236, 6);
    }
    if (this.messageTime > 0) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,.68)";
      ctx.fillRect(W / 2 - 230, H - 78, 460, 34);
      ctx.fillStyle = "#ffe082";
      ctx.fillText(this.message, W / 2, H - 55);
    }
  }

  drawPanel(title, lines) {
    ctx.fillStyle = "rgba(0,0,0,.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffd671";
    ctx.font = "34px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(title, W / 2, 145);
    ctx.font = "19px Courier New";
    ctx.fillStyle = "#f7e6a1";
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 210 + i * 38));
  }

  drawSoundtrackMenu() {
    ctx.fillStyle = "rgba(0,0,0,.68)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffd671";
    ctx.font = "34px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("SOUNDTRACK", W / 2, 118);
    ctx.font = "18px Courier New";
    ctx.fillStyle = "#dbeaff";
    ctx.fillText("UP / DOWN CHANGES SONG    ENTER PLAYS    ESC RETURNS", W / 2, 158);
    const boxX = W / 2 - 260;
    const boxY = 190;
    ctx.fillStyle = "rgba(8, 16, 36, .78)";
    ctx.fillRect(boxX, boxY, 520, 236);
    ctx.strokeStyle = "#b98b47";
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, 520, 236);
    this.soundtrackOptions.forEach((track, i) => {
      const y = boxY + 48 + i * 38;
      const active = i === this.soundtrackIndex;
      ctx.fillStyle = active ? "rgba(255, 214, 113, .2)" : "rgba(0,0,0,0)";
      ctx.fillRect(boxX + 18, y - 23, 484, 30);
      ctx.fillStyle = active ? "#fff4b8" : "#b7c7e6";
      ctx.textAlign = "left";
      ctx.fillText(`${active ? ">" : " "} ${track.label}`, boxX + 36, y);
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#72fff0";
    ctx.fillText(`NOW SELECTED: ${this.soundtrackOptions[this.soundtrackIndex].label}`, W / 2, 466);
  }

  drawCrt() {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#000";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    ctx.restore();
  }
}

window.__bulgaGame = new Game();
