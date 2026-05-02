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

const glyphs = [".", "·", "*", "+", "~", "░", "▒", "/", "\\", "|", "<", ">"];
let cells = [];
let ghostPoints = [];
let columns = 0;
let rows = 0;
let cellSize = 28;
let devicePixelRatio = 1;
let frame = 0;

function setPointer(x, y) {
  pointer.targetX = x;
  pointer.targetY = y;
  root.style.setProperty("--pointer-x", `${x}px`);
  root.style.setProperty("--pointer-y", `${y}px`);
  root.style.setProperty("--tilt-x", `${x - window.innerWidth / 2}`);
  root.style.setProperty("--tilt-y", `${y - window.innerHeight / 2}`);
  reportGhost(x, y);
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

    return {
      x,
      y,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      drift: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.009,
    };
  });
}

function drawGlyphField() {
  pointer.x += (pointer.targetX - pointer.x) * 0.08;
  pointer.y += (pointer.targetY - pointer.y) * 0.08;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.font =
    "14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const now = Date.now();

  for (const cell of cells) {
    const wave = Math.sin(frame * cell.speed + cell.drift);

    // Interaction with user pointer
    const dx = cell.x - pointer.x;
    const dy = cell.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const pull = Math.max(0, 1 - distance / 190);

    // Interaction with ghost points
    let ghostPull = 0;
    for (const gp of ghostPoints) {
      const gdx = cell.x - gp.x;
      const gdy = cell.y - gp.y;
      const gDist = Math.hypot(gdx, gdy);
      // Ghosts have a tighter, softer pull
      const p = Math.max(0, 1 - gDist / 120);
      // Fade ghost pull based on age (45s max)
      const ageFade = Math.max(0, 1 - (now - gp.ts) / 45000);
      ghostPull += p * ageFade;
    }
    ghostPull = Math.min(ghostPull, 1);

    const alpha = 0.06 + pull * 0.58 + ghostPull * 0.25 + (wave + 1) * 0.025;
    const lift = pull * -10 + ghostPull * -5 + wave * 1.5;
    const slide = pull * (dx > 0 ? 5 : -5);

    // If ghost is present, shift color slightly to violet
    if (ghostPull > 0.1 && pull < 0.2) {
      ctx.fillStyle = `rgba(195, 180, 255, ${alpha})`;
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
drawGlyphField();
