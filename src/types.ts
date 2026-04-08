export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  pos: Vector2D;
  history: Vector2D[];
  vel: Vector2D;
  acc: Vector2D;
  size: number;
  maxSpeed: number;
  idleSpeed: number;
  maxForce: number;
  angle: number;
  bodyRatio: number;
  segmentRatio: number;
  variationSeed: number;
  collisionImpact: number;
}

export type ThemeMode = 'day' | 'night';
export type ShapeType = 'none' | 'donut' | 'square' | 'circle' | 'triangle' | 'filled-circle' | 'text';

export interface MotionData {
  x: number;
  y: number;
  active: boolean;
}

export interface PhysicsConfig {
  particleCount: number;
  maxSpeed: number;
  attractStrength: number;
  randomness: number;
  damping: number;
  shape: ShapeType;
  shapeSize: number;
  separationForce: number;
  restitution: number;
  impactStrength: number;
  glowIntensity: number;
  isPaused: boolean;
  kingActive: boolean;
  antSkinUrl: string | null;
  limbElasticity: number;
  antSize: number;
  performanceMode: boolean;
  centerMode: boolean;
  roamMode: boolean;
  textShape: string;
  sizeVariation: number;
  backgroundUrl: string | null;
  backgroundEnabled: boolean;
  backgroundScale: number;
}

export interface RealTimeStats {
  fps: number;
  count: number;
  targetX: number;
  targetY: number;
  trackingActive: boolean;
}
