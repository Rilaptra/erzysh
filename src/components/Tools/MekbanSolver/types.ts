export enum LoadType {
  POINT = "POINT",
  DISTRIBUTED = "DISTRIBUTED",
  TRIANGULAR = "TRIANGULAR", // Assumes increasing from 0 to magnitude (Left to Right)
}

export enum SupportType {
  PIN = "PIN",
  ROLLER = "ROLLER",
  FIXED = "FIXED",
}

export interface Support {
  id: string;
  position: number; // distance from left end
  type: SupportType;
}

export interface Load {
  id: string;
  type: LoadType;
  position: number; // start position
  magnitude: number; // Peak value
  length?: number; // for distributed/triangular loads
}

export interface BeamConfig {
  length: number;
  supports: Support[];
  loads: Load[];
  unitLength: string;
  unitForce: string;
}

export interface CalculationPoint {
  x: number;
  shear: number;
  moment: number;
}

export interface SectionInput {
  I: number; // Moment of Inertia (mm^4 atau m^4)
  y_max: number; // Jarak serat terluar / c (mm atau m)
  sigma_allow: number; // Tegangan Izin (MPa atau kPa)
}

export interface StressResult {
  sigma_max: number; // Tegangan Lentur Maksimum
  isSafe: boolean; // Aman gak? (sigma_max <= sigma_allow)
  safetyFactor: number; // SF = sigma_allow / sigma_max
}

export interface CalculationResult {
  points: CalculationPoint[];
  maxMoment: number;
  maxShear: number;
  reactions: Record<string, number>; // simplified reaction outputs
  stressAnalysis?: StressResult; // NEW: Hasil analisis tegangan (opsional)
}

export interface SectionProperties {
  width: number;
  height: number;
  ix: number; // Moment of Inertia X
  iy: number; // Moment of Inertia Y
  area: number;
}

export interface ReportItem {
  id: string;
  timestamp: Date;
  config: BeamConfig;
  result: CalculationResult;
  solutionText: string; // The markdown solution
  images?: {
    beam?: string; // base64 data url
    charts?: string; // base64 data url
  };
}
