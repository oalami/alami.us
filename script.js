const root = document.documentElement;
const canvas = document.querySelector("#glyph-field");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  targetX: window.innerWidth / 2,
  targetY: window.innerHeight / 2,
};

const glyphs = [
  "·",
  "+",
  "~",
  "▒",
  "/",
  "\\",
  "|",
  "‖",
  "⁞",
  "∫",
  "<",
  ">",
  "✦",
  "⚹",
  "⁂",
  "꩜",
  "᯽",
  "🝓",
];
let cells = [];
let columns = 0;
let rows = 0;
let cellSize = 28;
let devicePixelRatio = 1;
let frame = 0;

// --- GHOST ECHO LOGIC ---

const ghost = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  targetX: window.innerWidth / 2,
  targetY: window.innerHeight / 2,
  path: [],
  currentIndex: 0,
  active: false,
};

const myPath = [];
const MAX_PATH_LENGTH = 400;

async function initGhost() {
  try {
    const res = await fetch("/api/ghosts");
    const path = await res.json();
    if (Array.isArray(path) && path.length > 0) {
      ghost.path = path;
      ghost.active = true;
      // Start ghost at the first point
      ghost.x = ghost.targetX = path[0].x * window.innerWidth;
      ghost.y = ghost.targetY = path[0].y * window.innerHeight;
    }
  } catch (e) {
    /* silent fail */
  }
}

function updateGhost() {
  if (!ghost.active || ghost.path.length === 0) return;

  const point = ghost.path[ghost.currentIndex];
  ghost.targetX = point.x * window.innerWidth;
  ghost.targetY = point.y * window.innerHeight;

  // Glide towards the target point
  ghost.x += (ghost.targetX - ghost.x) * 0.1;
  ghost.y += (ghost.targetY - ghost.y) * 0.1;

  // Update terminal signal every 60 frames (approx 1s) to be less distracting
  if (frame % 60 === 0) {
    const signalElement = document.querySelector("#ghost-signal");
    if (signalElement) {
      const dx = ghost.x - window.innerWidth / 2;
      const dy = ghost.y - window.innerHeight / 2;
      const dist = Math.hypot(dx, dy);
      const maxDist = Math.hypot(window.innerWidth / 2, window.innerHeight / 2);
      const intensity = Math.min(dist / (maxDist * 0.6), 1);
      const freq = (0.1 + intensity * 0.4).toFixed(3);

      const bars = [" ", "░", "▒", "▓", "█"];
      const barCount = Math.floor(intensity * 5);
      const bar = "█".repeat(barCount).padEnd(5, "░");
      signalElement.innerText = `${freq}hz [${bar}]`;
    }
  }

  // If we are close enough to the target point, move to the next one
  const dist = Math.hypot(ghost.targetX - ghost.x, ghost.targetY - ghost.y);
  if (dist < 5) {
    ghost.currentIndex = (ghost.currentIndex + 1) % ghost.path.length;
  }
}

async function saveMyPath() {
  if (myPath.length < 20) return;
  try {
    await fetch("/api/ghosts", {
      method: "POST",
      body: JSON.stringify({ path: myPath }),
      keepalive: true, // Important for saving on page hide
    });
  } catch (e) {
    /* silent fail */
  }
}

// --- CORE LOGIC ---

const kickers = [
  "it's me",
  "it's you?",
  "expecting you",
  "static in the wire",
  "the door was unlocked",
  "signal received",
  "don't look back",
  "you are here",
  "finally",
  "echoes only",
  "still shimmering",
  "a quiet corner",
  "light through the mesh",
  "just checking",
  "is it you?",
  "found this",
  "drifting",
  "vibes all the way",
];

function setRandomKicker() {
  const kickerElement = document.querySelector(".kicker");
  if (kickerElement) {
    kickerElement.innerText =
      kickers[Math.floor(Math.random() * kickers.length)];
  }
}

function setPointer(x, y) {
  pointer.targetX = x;
  pointer.targetY = y;
  root.style.setProperty("--pointer-x", `${x}px`);
  root.style.setProperty("--pointer-y", `${y}px`);
  root.style.setProperty("--tilt-x", `${x - window.innerWidth / 2}`);
  root.style.setProperty("--tilt-y", `${y - window.innerHeight / 2}`);

  // Record path
  if (
    myPath.length === 0 ||
    Math.hypot(
      x / window.innerWidth - myPath[myPath.length - 1].x,
      y / window.innerHeight - myPath[myPath.length - 1].y,
    ) > 0.01
  ) {
    myPath.push({ x: x / window.innerWidth, y: y / window.innerHeight });
    if (myPath.length > MAX_PATH_LENGTH) myPath.shift();
  }
}

function resizeCanvas() {
  devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  cellSize = window.innerWidth < 700 ? 24 : 30;
  columns = Math.ceil(window.innerWidth / cellSize) + 1;
  rows = Math.ceil(window.innerHeight / cellSize) + 1;

  cells = Array.from({ length: columns * rows }, (_, index) => {
    const x = (index % columns) * cellSize;
    const y = Math.floor(index / columns) * cellSize;

    // .1% chance of a watermelon or bridge, otherwise pick a random glyph
    const rand = Math.random();
    const glyph =
      rand < 0.001
        ? "🍉"
        : rand < 0.002
          ? "🌉"
          : glyphs[Math.floor(Math.random() * glyphs.length)];

    return {
      x,
      y,
      glyph,
      drift: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.009,
    };
  });
}

function drawGlyphField() {
  // Update pointers
  pointer.x += (pointer.targetX - pointer.x) * 0.08;
  pointer.y += (pointer.targetY - pointer.y) * 0.08;
  updateGhost();

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.font =
    "14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const cell of cells) {
    const wave = Math.sin(frame * cell.speed + cell.drift);

    // User Interaction
    const dx = cell.x - pointer.x;
    const dy = cell.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const pull = Math.max(0, 1 - distance / 190);

    // Ghost Interaction
    const gdx = cell.x - ghost.x;
    const gdy = cell.y - ghost.y;
    const gDistance = Math.hypot(gdx, gdy);
    const gPull = Math.max(0, 1 - gDistance / 140);

    const alpha = 0.06 + pull * 0.58 + gPull * 0.3 + (wave + 1) * 0.025;
    const lift = pull * -10 + gPull * -6 + wave * 1.5;
    const slide = pull * (dx > 0 ? 5 : -5) + gPull * (gdx > 0 ? 3 : -3);

    if (gPull > 0.1 && pull < 0.2) {
      ctx.fillStyle = `rgba(210, 190, 255, ${Math.min(alpha * 1.2, 1)})`;
    } else {
      ctx.fillStyle = `rgba(176, 220, 255, ${alpha})`;
    }

    ctx.fillText(cell.glyph, cell.x + slide, cell.y + lift);
  }

  frame += 1;

  if (!prefersReducedMotion.matches) {
    requestAnimationFrame(drawGlyphField);
  }
}

// Save path on exit or every 20 seconds
setInterval(saveMyPath, 20000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveMyPath();
});

window.addEventListener("pointermove", (event) => {
  setPointer(event.clientX, event.clientY);
});

window.addEventListener("pointerleave", () => {
  setPointer(window.innerWidth / 2, window.innerHeight / 2);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  setPointer(window.innerWidth / 2, window.innerHeight / 2);
});

resizeCanvas();
setPointer(pointer.x, pointer.y);
setRandomKicker();
initGhost();
drawGlyphField();
