import React, { useEffect, useRef } from 'react';
import { ThemeMode, Particle, Vector2D, PhysicsConfig, RealTimeStats } from '../types';

interface VisualizerProps {
  mode: ThemeMode;
  config: PhysicsConfig;
  onStatsUpdate?: (stats: RealTimeStats) => void;
}

const GRID_SIZE = 40;
const COLLISION_RADIUS = 12;
const SENSING_RANGE = 35;

const Visualizer: React.FC<VisualizerProps> = ({ mode, config, onStatsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mousePos = useRef<Vector2D>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetPos = useRef<Vector2D>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const globalPhase = useRef<number>(0);
  const antImg = useRef<HTMLImageElement | null>(null);
  const bgImg = useRef<HTMLImageElement | null>(null);
  
  // Pre-rendered ant canvases for performance
  const antCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  
  // Text shape positions cache
  const textPositions = useRef<Vector2D[]>([]);

  const grid = useRef<Map<string, number[]>>(new Map());
  const lastTime = useRef(performance.now());
  const frameCount = useRef(0);
  const fps = useRef(0);

  useEffect(() => {
    if (config.antSkinUrl) {
      const img = new Image();
      img.src = config.antSkinUrl;
      img.onload = () => {
        antImg.current = img;
      };
    } else {
      antImg.current = null;
    }
  }, [config.antSkinUrl]);

  // Load background image
  useEffect(() => {
    if (config.backgroundUrl) {
      const img = new Image();
      img.src = config.backgroundUrl;
      img.onload = () => {
        bgImg.current = img;
      };
    } else {
      bgImg.current = null;
    }
  }, [config.backgroundUrl]);

  useEffect(() => {
    const p: Particle[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < config.particleCount; i++) {
      const variety = Math.random();
      const startPos = { x: Math.random() * width, y: Math.random() * height };
      // Each ant has its own idle speed multiplier (0.3 to 1.0)
      const idleSpeedMultiplier = 0.3 + Math.random() * 0.7;
      // Size: base size 1.5, variation controlled by sizeVariation (0 = all same, 1 = max variation)
      const baseSize = 1.5;
      const sizeMultiplier = 1.0 + (variety - 0.5) * 2 * config.sizeVariation;
      p.push({
        pos: startPos,
        history: [],
        vel: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
        acc: { x: 0, y: 0 },
        size: baseSize * sizeMultiplier,
        maxSpeed: config.maxSpeed * (0.8 + variety * 0.4),
        idleSpeed: config.maxSpeed * idleSpeedMultiplier,
        maxForce: 0.2,
        angle: Math.random() * Math.PI * 2,
        bodyRatio: 0.9 + Math.random() * 0.4,
        segmentRatio: 0.8 + Math.random() * 0.5,
        variationSeed: Math.random(),
        collisionImpact: 0
      });
    }
    particles.current = p;
  }, [config.particleCount, config.maxSpeed, config.sizeVariation]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate text positions when textShape changes
  useEffect(() => {
    if (config.shape === 'text' && config.textShape) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const fontSize = 120;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.textShape, canvas.width / 2, canvas.height / 2);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const positions: Vector2D[] = [];
      const step = 4; // Sample every 4 pixels for performance
      
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const index = (y * canvas.width + x) * 4;
          if (imageData.data[index] > 128) {
            positions.push({ x, y });
          }
        }
      }
      
      textPositions.current = positions;
    }
  }, [config.textShape, config.shape]);

  const getQueuePosition = (t: number, shape: string, size: number, seed: number): Vector2D => {
    const angle = t * Math.PI * 2;
    const jX = (seed - 0.5) * 8;
    const jY = ((seed * 13) % 1 - 0.5) * 8;

    switch (shape) {
      case 'circle':
        return { x: Math.cos(angle) * size + jX, y: Math.sin(angle) * size + jY };
      case 'donut':
        const r = size * (0.7 + Math.sin(seed * 100) * 0.2);
        return { x: Math.cos(angle) * r + jX, y: Math.sin(angle) * r + jY };
      case 'filled-circle': {
        // Distribute points evenly inside a circle using sqrt for uniform density
        const radius = Math.sqrt(seed) * size;
        const a = t * Math.PI * 2 + seed * 10;
        return { x: Math.cos(a) * radius + jX, y: Math.sin(a) * radius + jY };
      }
      case 'square': {
        const p = (t * 4) % 4;
        let x, y;
        if (p < 1) {
          x = -size + p * size * 2;
          y = -size;
        } else if (p < 2) {
          x = size;
          y = -size + (p - 1) * size * 2;
        } else if (p < 3) {
          x = size - (p - 2) * size * 2;
          y = size;
        } else {
          x = -size;
          y = size - (p - 3) * size * 2;
        }
        return { x: x + jX, y: y + jY };
      }
      case 'triangle': {
        const p = (t * 3) % 3;
        const side = size * 2;
        let x, y;
        if (p < 1) {
          x = -side / 2 + p * side;
          y = size * 0.6;
        } else if (p < 2) {
          x = side / 2 - (p - 1) * (side / 2);
          y = size * 0.6 - (p - 1) * (size * 1.5);
        } else {
          x = 0 - (p - 2) * (side / 2);
          y = -size * 0.9 + (p - 2) * (size * 1.5);
        }
        return { x: x + jX, y: y + jY };
      }
      default:
        return { x: 0, y: 0 };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId: number;

    const update = (time: number) => {
      if (config.isPaused) {
        animationId = requestAnimationFrame(update);
        return;
      }

      frameCount.current++;
      if (time - lastTime.current >= 1000) {
        fps.current = frameCount.current;
        frameCount.current = 0;
        lastTime.current = time;
        if (onStatsUpdate) {
          onStatsUpdate({
            fps: fps.current,
            count: particles.current.length,
            targetX: targetPos.current.x,
            targetY: targetPos.current.y,
            trackingActive: false
          });
        }
      }

      if (config.shape !== 'none') {
        globalPhase.current += 0.002 * (config.maxSpeed / 5);
        if (globalPhase.current > 1) globalPhase.current -= 1;
      }

      ctx.fillStyle = mode === 'day' ? '#ffffff' : '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background image if enabled
      if (config.backgroundEnabled && bgImg.current) {
        const img = bgImg.current;
        const scale = config.backgroundScale;
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;
        const x = (canvas.width - imgWidth) / 2;
        const y = (canvas.height - imgHeight) / 2;
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
      }

      // Center mode: always target screen center, ignore mouse
      const actualTarget = config.centerMode
        ? { x: canvas.width / 2, y: canvas.height / 2 }
        : mousePos.current;
      
      targetPos.current.x += (actualTarget.x - targetPos.current.x) * 0.2;
      targetPos.current.y += (actualTarget.y - targetPos.current.y) * 0.2;

      grid.current.clear();
      particles.current.forEach((p, idx) => {
        const key = `${Math.floor(p.pos.x / GRID_SIZE)},${Math.floor(p.pos.y / GRID_SIZE)}`;
        if (!grid.current.has(key)) grid.current.set(key, []);
        grid.current.get(key)!.push(idx);
      });

      const sizeBase = Math.min(canvas.width, canvas.height) * 0.25 * config.shapeSize;

      particles.current.forEach((p, i) => {

        const gx = Math.floor(p.pos.x / GRID_SIZE);
        const gy = Math.floor(p.pos.y / GRID_SIZE);

        let sensingActive = false;
        let sensorDist = 1.0;

        // Skip collision detection in performance mode for every other particle
        const skipCollision = config.performanceMode && i % 2 === 0;
        
        if (!skipCollision) {
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const neighbors = grid.current.get(`${gx + ox},${gy + oy}`);
              if (neighbors) {
                neighbors.forEach((idx) => {
                  if (idx === i) return;
                  const other = particles.current[idx];
                  const dx = p.pos.x - other.pos.x;
                  const dy = p.pos.y - other.pos.y;
                  const dSq = dx * dx + dy * dy;

                  const currentCollisionRadius = COLLISION_RADIUS * config.antSize;
                  if (dSq > 0 && dSq < currentCollisionRadius * currentCollisionRadius) {
                    const dist = Math.sqrt(dSq);
                    const overlap = (currentCollisionRadius - dist) * 0.5;
                    p.pos.x += (dx / dist) * overlap * config.separationForce;
                    p.pos.y += (dy / dist) * overlap * config.separationForce;
                  }

                  // Skip sensing in performance mode
                  if (!config.performanceMode) {
                    const currentSensingRange = SENSING_RANGE * config.antSize;
                    if (dSq > 0 && dSq < currentSensingRange * currentSensingRange) {
                      sensingActive = true;
                      sensorDist = Math.sqrt(dSq) / currentSensingRange;
                    }
                  }
                });
              }
            }
          }
        }

        let targetX, targetY;
        if (config.shape === 'none') {
          const orbitAngle = time * 0.001 + p.variationSeed * Math.PI * 2;
          const r = (80 + p.variationSeed * 100) * config.shapeSize;
          targetX = targetPos.current.x + Math.cos(orbitAngle) * r;
          targetY = targetPos.current.y + Math.sin(orbitAngle) * r;
        } else if (config.shape === 'text' && textPositions.current.length > 0) {
          // Text shape: assign each ant to a text pixel position
          const posIndex = i % textPositions.current.length;
          const textPos = textPositions.current[posIndex];
          // Scale based on shapeSize
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          targetX = centerX + (textPos.x - centerX) * config.shapeSize;
          targetY = centerY + (textPos.y - centerY) * config.shapeSize;
        } else {
          const t = (globalPhase.current + i / particles.current.length) % 1;
          const offset = getQueuePosition(t, config.shape, sizeBase, p.variationSeed);
          targetX = targetPos.current.x + offset.x;
          targetY = targetPos.current.y + offset.y;
        }

        const tdx = targetX - p.pos.x;
        const tdy = targetY - p.pos.y;
        const tDistSq = tdx * tdx + tdy * tdy;
        const force = config.attractStrength * (config.shape === 'none' ? 0.8 : 1.2);
        p.acc.x += (tdx / Math.sqrt(tDistSq) || 0) * force;
        p.acc.y += (tdy / Math.sqrt(tDistSq) || 0) * force;

        p.acc.x += (Math.random() - 0.5) * config.randomness;
        p.acc.y += (Math.random() - 0.5) * config.randomness;

        p.vel.x += p.acc.x;
        p.vel.y += p.acc.y;
        const spd = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y);
        // Use individual idle speed when mouse is stationary (free mode)
        const limit = config.shape === 'none' ? p.idleSpeed : config.maxSpeed;
        if (spd > limit) {
          p.vel.x = (p.vel.x / spd) * limit;
          p.vel.y = (p.vel.y / spd) * limit;
        }
        p.vel.x *= config.damping;
        p.vel.y *= config.damping;
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.acc.x = 0;
        p.acc.y = 0;

        const m = 50 * config.antSize;
        if (p.pos.x < -m) p.pos.x = canvas.width + m;
        else if (p.pos.x > canvas.width + m) p.pos.x = -m;
        if (p.pos.y < -m) p.pos.y = canvas.height + m;
        else if (p.pos.y > canvas.height + m) p.pos.y = -m;

        const isKing = i === 0 && config.kingActive;
        // Solid colors - no transparency
        let colorStr = mode === 'day' ? '#000000' : '#ffffff';
        if (isKing) colorStr = mode === 'day' ? '#D97706' : '#FBBF24';

        p.angle = Math.atan2(p.vel.y, p.vel.x);
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.rotate(p.angle);

        const scaleFactor = (isKing ? 3.0 : 1.0) * config.antSize;
        ctx.scale(scaleFactor, scaleFactor);

        if (antImg.current) {
          const img = antImg.current;
          const iw = p.size * 10;
          const ih = (iw * img.height) / img.width;
          ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
        } else if (config.performanceMode) {
          // Performance mode: simplified rendering - just ellipses, no legs/antennae
          ctx.fillStyle = colorStr;
          
          // Simple body (single elongated ellipse)
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 5, p.size * 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = colorStr;

          // Abdomen
          ctx.beginPath();
          ctx.ellipse(-p.size * 2.5, 0, p.size * 3.8 * p.bodyRatio, p.size * 2.4 * p.segmentRatio, 0, 0, Math.PI * 2);
          ctx.fill();

          // Thorax
          ctx.beginPath();
          ctx.ellipse(p.size * 1.5, 0, p.size * 0.8, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Head
          ctx.beginPath();
          ctx.ellipse(p.size * 3.8, 0, p.size * 1.8, p.size * 1.6, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = colorStr;
          ctx.lineWidth = 0.8;
          ctx.lineJoin = 'round';

          const baseSway = Math.sin(time * 0.05 + p.variationSeed * 10) * 0.22;
          const senseJitter = sensingActive ? Math.sin(time * 0.2) * (1.0 - sensorDist) * 0.6 : 0;
          const combinedElasticity = config.limbElasticity * (sensingActive ? 1.5 : 1.0);

          const inertiaLag = (p.vel.x * Math.cos(p.angle) + p.vel.y * Math.sin(p.angle)) * 0.04;

          const drawAntenna = (side: number) => {
            const basePos = { x: p.size * 4.6, y: side * p.size * 0.6 };
            const jointPos = {
              x: basePos.x + p.size * 1.4,
              y: basePos.y + side * p.size * (1.4 + (baseSway + senseJitter) * combinedElasticity - inertiaLag)
            };
            const tipPos = {
              x: jointPos.x + p.size * 1.2,
              y: jointPos.y + side * p.size * (2.0 + (baseSway * 1.5 + senseJitter * 2) * combinedElasticity)
            };

            ctx.beginPath();
            ctx.moveTo(basePos.x, basePos.y);
            ctx.lineTo(jointPos.x, jointPos.y);
            ctx.lineTo(tipPos.x, tipPos.y);
            ctx.stroke();

            if (sensingActive) {
              ctx.beginPath();
              ctx.arc(tipPos.x, tipPos.y, 0.5, 0, Math.PI * 2);
              ctx.fill();
            }
          };
          drawAntenna(1);
          drawAntenna(-1);

          const legPhase = time * 0.015 * (spd + 1);
          const drawLeg = (idx: number, side: number) => {
            let startX = 0;
            let dirX = 0;
            let dirY = 1.0;

            if (idx === 0) {
              startX = p.size * 2.2;
              dirX = 1.5;
              dirY = 1.0;
            } else if (idx === 1) {
              startX = p.size * 1.5;
              dirX = 0.0;
              dirY = 2.0;
            } else {
              startX = p.size * 0.6;
              dirX = -1.8;
              dirY = 1.5;
            }

            const startY = 0;
            const step = Math.sin(legPhase + idx * 1.5 + p.variationSeed * 5) * 0.5;
            const drag = (spd / limit) * config.limbElasticity * 0.6;

            const j1 = {
              x: startX + p.size * (dirX - drag),
              y: side * p.size * (dirY + step * 0.5)
            };
            const j2 = {
              x: j1.x + p.size * (dirX * 0.6 - drag),
              y: j1.y + side * p.size * (dirY * 1.0 + step)
            };
            const j3 = {
              x: j2.x + p.size * (dirX * 0.4),
              y: j2.y + side * p.size * (0.8 + step * 0.3)
            };

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(j1.x, j1.y);
            ctx.lineTo(j2.x, j2.y);
            ctx.lineTo(j3.x, j3.y);
            ctx.stroke();
          };

          for (let legIdx = 0; legIdx < 3; legIdx++) {
            drawLeg(legIdx, 1);
            drawLeg(legIdx, -1);
          }
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [mode, config, onStatsUpdate]);

  return (
    <div
      className="w-full h-full touch-none select-none overflow-hidden"
      onPointerMove={(e) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default Visualizer;
