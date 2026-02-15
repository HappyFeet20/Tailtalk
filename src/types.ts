
export enum EventType {
  PEE = 'pee',
  POOP = 'poop',
  FOOD = 'food',
  WATER = 'water',
  WALK = 'walk',
  HEALTH_CHECK = 'health_check'
}

export interface DogProfile {
  name: string;
  breed: string;
  lifeStage: 'puppy' | 'adult' | 'senior';
  sex?: 'male' | 'female';
  avatarUrl?: string;
}

export interface DogEvent {
  id: string;
  type: EventType;
  rawText: string;
  timestamp: number;
  metadata: {
    amount?: string;
    consistency?: number;
    urgencyReset?: boolean;
    healthFlag?: boolean;
    volume?: string;
    duration?: string;
  };
}

export interface DogStats {
  tummy: number; // 0-100
  tank: number;  // 0-100
  energy: number; // 0-100
  urgency: number; // 0-1 (Predictive Piddle)
}
