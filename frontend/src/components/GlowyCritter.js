import { useEffect, useRef } from "react";

/**
 * GlowyCritter - 2D Canvas renderer for animated repository spirits
 * 
 * This component renders a unique, animated "spirit" based on repository traits.
 * Each spirit has:
 * - Species (blob, sprout, pebble, puff)
 * - Pattern overlay (freckles, speckles, stripes, rings)
 * - Accessories (leaves, antenna, bow, monocle)
 * - Aura particles
 * - Breathing and swaying animations
 * 
 * @param {Object} config - Spirit configuration object
 * @param {string} config.seed - Deterministic seed for random number generation
 * @param {Object} config.palette - Color palette (bg, fg, accents)
 * @param {Object} config.traits - Visual traits (species, pattern, accessory, etc.)
 * @param {Object} config.motion - Animation properties (tempo, style)
 * @param {string} config.mood - Overall mood (calm, playful, techno, poetic)
 * 
 * @example
 * <GlowyCritter config={{
 *   seed: "abc123",
 *   palette: { bg: "#000", fg: "#61DAFB", accents: ["#0099FF"] },
 *   traits: { species: "pebble", pattern: "freckles", glowLevel: 2 }
 * }} />
 */
const GlowyCritter = ({ config }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    
    const size = 720;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    /**
     * Create a deterministic pseudo-random number generator from seed.
     * Uses xorshift algorithm for consistent randomness across renders.
     */
    const makePRNG = (seedHex) => {
      let s = parseInt(seedHex.slice(0, 16), 16) || 0x9e3779b9;
      return () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return ((s >>> 0) % 1e9) / 1e9;
      };
    };

    const rnd = makePRNG(config.seed || "cafebabe");
    const startTime = performance.now();

    // Pick face features based on seed
    const face = {
      eyeSpacing: 44 + rnd() * 20,
      eyeRadius: 8 + rnd() * 5,
      eyeOffsetY: 18 + rnd() * 8,
      mouthWidth: 22 + rnd() * 10,
      mouthHeight: 6 + rnd() * 6,
      mouthOffsetY: 28 + rnd() * 12,
      cheek: 10 + rnd() * 5
    };

    const animate = () => {
      const t = (performance.now() - startTime) / 1000;
      const tempo = config.motion.tempo_hz;
      const breath = Math.sin(2 * Math.PI * tempo * t) * config.traits.breathAmount;
      const sway = smoothNoise(t, 0.5) * config.traits.swayAmount;

      drawScene(ctx, size, config, t, breath, sway, face, rnd);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="critter-canvas"
      style={{
        width: "100%",
        height: "auto",
        maxWidth: "720px",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
};

// Helper functions
function smoothNoise(t, speed = 0.4) {
  return Math.sin(t * speed) * 0.5 + Math.sin(t * speed * 0.37) * 0.3 + Math.sin(t * speed * 0.19) * 0.2;
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function lerpColor(h1, h2, t) {
  const n1 = parseInt(h1.replace("#", ""), 16);
  const n2 = parseInt(h2.replace("#", ""), 16);
  const r1 = (n1 >> 16) & 255, g1 = (n1 >> 8) & 255, b1 = n1 & 255;
  const r2 = (n2 >> 16) & 255, g2 = (n2 >> 8) & 255, b2 = n2 & 255;
  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function drawScene(ctx, size, config, t, breath, sway, face, rnd) {
  const cx = size / 2;
  const cy = size / 2;

  // Background
  drawBackground(ctx, size, config, t);

  // Aura particles
  if (config.traits.glowLevel > 0) {
    drawAura(ctx, size, config, t);
  }

  // Apply breath & sway transform
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sway * 0.05);
  const scale = 1 + breath * 0.03;
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // Body
  drawBody(ctx, size, config, t, rnd);

  // Pattern
  drawPattern(ctx, size, config, t);

  // Face
  drawFace(ctx, size, config, face, t);

  // Accessory
  drawAccessory(ctx, size, config, t);

  ctx.restore();
}

function drawBackground(ctx, size, config, t) {
  const phase = Math.sin(t * 0.15);
  ctx.clearRect(0, 0, size, size);
  
  const grad = ctx.createRadialGradient(
    size * 0.55,
    size * 0.45,
    60 + 20 * phase,
    size * 0.5,
    size * 0.6,
    Math.max(size, size)
  );
  
  const [accent1] = config.palette.accents;
  grad.addColorStop(0, hexToRgba(accent1, 0.22));
  grad.addColorStop(1, config.palette.bg);
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

function drawAura(ctx, size, config, t) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  
  const count = config.traits.auraParticles;
  const [accent1] = config.palette.accents;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * 0.2;
    const R = size * 0.34 + Math.sin(t * 0.9 + i) * 6;
    const x = size / 2 + R * Math.cos(angle);
    const y = size / 2 + R * Math.sin(angle);
    const r = 28 + 8 * Math.sin(t + i);
    
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const alpha = 0.12 + config.traits.glowLevel * 0.06;
    grad.addColorStop(0, hexToRgba(accent1, alpha));
    grad.addColorStop(1, hexToRgba(accent1, 0));
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawBody(ctx, size, config, t, rnd) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.28;
  
  ctx.save();
  
  // Glow effect
  if (config.traits.glowLevel > 0) {
    const [accent1] = config.palette.accents;
    ctx.shadowColor = hexToRgba(accent1, 0.55);
    ctx.shadowBlur = config.traits.glowLevel === 2 ? 45 : 28;
  }
  
  // Draw body shape based on species
  ctx.beginPath();
  
  if (config.traits.species === "blob") {
    // Organic blob
    ctx.moveTo(cx + R, cy);
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rr = R * (0.9 + 0.15 * (rnd() - 0.5));
      const px = cx + rr * Math.cos(a);
      const py = cy + rr * Math.sin(a);
      ctx.quadraticCurveTo(
        cx + R * Math.cos(a - 0.2),
        cy + R * Math.sin(a - 0.2),
        px,
        py
      );
    }
    ctx.closePath();
  } else if (config.traits.species === "sprout") {
    // Rounded capsule
    ctx.roundRect(cx - R * 0.7, cy - R * 0.7, R * 1.4, R * 1.4, R * 0.4);
  } else if (config.traits.species === "pebble") {
    // Pebble shape
    ctx.moveTo(cx - R, cy);
    ctx.quadraticCurveTo(cx - R * 0.2, cy - R * 0.9, cx + R * 0.2, cy - R * 0.9);
    ctx.quadraticCurveTo(cx + R * 0.9, cy - R * 0.2, cx + R, cy);
    ctx.quadraticCurveTo(cx + R * 0.6, cy + R * 0.9, cx, cy + R);
    ctx.quadraticCurveTo(cx - R * 0.9, cy + R * 0.3, cx - R, cy);
    ctx.closePath();
  } else {
    // Puff (cloud-like)
    ctx.ellipse(cx, cy, R * 0.85, R * 0.72, 0, 0, Math.PI * 2);
  }
  
  // Fill body
  const [accent1, accent2] = config.palette.accents;
  const bodyColor = lerpColor(accent1, accent2, rnd());
  ctx.fillStyle = bodyColor;
  ctx.globalAlpha = 0.97;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.28, cy - R * 0.28, R * 0.36, R * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba("#FFFFFF", 0.16);
  ctx.fill();
  
  ctx.restore();
}

function drawPattern(ctx, size, config, t) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.28;
  const [accent1] = config.palette.accents;
  
  ctx.save();
  ctx.globalAlpha = 0.18;
  
  if (config.traits.pattern === "freckles") {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.sin(t * 0.7 + i) * 0.1;
      const rr = R * 0.65 + Math.sin(t + i) * 4;
      const x = cx + rr * Math.cos(a);
      const y = cy + rr * Math.sin(a);
      ctx.fillStyle = hexToRgba("#F9A8D4", 0.5);
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 2.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.traits.pattern === "speckles") {
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = R * (0.3 + 0.7 * Math.random());
      const x = cx + rr * Math.cos(a);
      const y = cy + rr * Math.sin(a);
      ctx.fillStyle = hexToRgba("#E5E7EB", 0.45);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.traits.pattern === "stripes") {
    ctx.strokeStyle = hexToRgba(accent1, 0.22);
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 10]);
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy - i * 8, R, R * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  } else if (config.traits.pattern === "rings") {
    ctx.strokeStyle = hexToRgba(accent1, 0.22);
    ctx.lineWidth = 2;
    for (let r = R * 0.3; r < R; r += R * 0.12) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + Math.sin(t * 0.8 + r) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

function drawFace(ctx, size, config, face, t) {
  const cx = size / 2;
  const cy = size / 2;
  
  // Blinking
  const blink = Math.max(0.18, Math.abs(Math.sin(t * 3.2)));
  
  // Eyes
  const eyeY = cy - face.eyeOffsetY;
  [-1, 1].forEach((dir) => {
    ctx.beginPath();
    ctx.ellipse(
      cx + dir * face.eyeSpacing,
      eyeY,
      face.eyeRadius,
      face.eyeRadius * blink,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#0B0B0B";
    ctx.fill();
    
    // Eye glow
    const [accent1] = config.palette.accents;
    const grad = ctx.createRadialGradient(
      cx + dir * face.eyeSpacing,
      eyeY,
      0,
      cx + dir * face.eyeSpacing,
      eyeY,
      5
    );
    grad.addColorStop(0, hexToRgba(accent1, 0.18));
    grad.addColorStop(1, hexToRgba(accent1, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + dir * face.eyeSpacing, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Mouth
  const mouthH = face.mouthHeight * (0.7 + 0.3 * Math.abs(Math.sin(t * 2.1)));
  ctx.beginPath();
  ctx.ellipse(
    cx,
    cy + face.mouthOffsetY,
    face.mouthWidth,
    mouthH,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = hexToRgba("#000000", 0.8);
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Cheeks
  [-1, 1].forEach((dir) => {
    ctx.beginPath();
    ctx.ellipse(
      cx + dir * (face.eyeSpacing * 0.9),
      cy + face.mouthOffsetY - 8,
      face.cheek,
      face.cheek * 0.75,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = hexToRgba("#FF6B9A", 0.35);
    ctx.fill();
  });
}

function drawAccessory(ctx, size, config, t) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.28;
  const [accent1, accent2] = config.palette.accents;
  
  if (config.traits.accessory === "none") return;
  
  ctx.save();
  
  if (config.traits.accessory === "sprout-leaf") {
    ctx.translate(cx, cy - R * 1.3);
    ctx.rotate(0.1 * Math.sin(t));
    
    // Leaf 1
    ctx.beginPath();
    ctx.ellipse(16, 0, 14, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = accent1;
    ctx.fill();
    
    // Leaf 2
    ctx.beginPath();
    ctx.ellipse(-10, -4, 12, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(accent2, 0.6);
    ctx.fill();
  } else if (config.traits.accessory === "antenna") {
    ctx.translate(cx, cy - R * 1.2);
    ctx.strokeStyle = hexToRgba(accent1, 0.6);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -18, -12, -30);
    ctx.stroke();
    
    // Tip glow
    const grad = ctx.createRadialGradient(-12, -30, 0, -12, -30, 6);
    grad.addColorStop(0, hexToRgba(accent1, 0.5));
    grad.addColorStop(1, hexToRgba(accent1, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(-12, -30, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (config.traits.accessory === "bow") {
    ctx.translate(cx + size * 0.12, cy - size * 0.025);
    
    // Bow wings
    ctx.fillStyle = accent1;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.quadraticCurveTo(-28, -10, -16, -18);
    ctx.quadraticCurveTo(-8, -6, -14, 0);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.quadraticCurveTo(28, -10, 16, -18);
    ctx.quadraticCurveTo(8, -6, 14, 0);
    ctx.fill();
    
    // Center
    ctx.beginPath();
    ctx.fillStyle = hexToRgba(accent2, 0.8);
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (config.traits.accessory === "monocle") {
    ctx.translate(cx + size * 0.17, cy - size * 0.008);
    ctx.lineWidth = 3;
    ctx.strokeStyle = hexToRgba(accent1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    
    // Chain
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 22);
    ctx.stroke();
  }
  
  ctx.restore();
}

export default GlowyCritter;