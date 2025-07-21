import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
// Audio system - using Web Audio API for better compatibility

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🎮 GAME CONSTANTS - MARTIN'S FEEDBACK EDITION! 🚀
const PLAYER_SIZE = 32; // Smaller player like reference game
const OBSTACLE_WIDTH = 24; // Thinner obstacles like reference
const OBSTACLE_HEIGHT = 120; // Taller obstacles like reference
const BASE_SPEED = 7; // 🚀 SUPER SPEED MODE!
const POWERUP_SIZE = 25;
const TRANSITION_DURATION = 200;

// Safe areas for player movement
const SAFE_AREA_TOP = 100;
const SAFE_AREA_BOTTOM = 150;
const SAFE_TOP_POSITION = SAFE_AREA_TOP + 50;
const SAFE_BOTTOM_POSITION = SCREEN_HEIGHT - SAFE_AREA_BOTTOM - 50;

// Storage keys
const HIGH_SCORE_KEY = '@gravity_game_high_score';
const SETTINGS_KEY = '@gravity_game_settings';
const LANGUAGE_KEY = '@gravity_game_language';
const TUTORIAL_KEY = '@gravity_game_tutorial_completed';
const PLAYER_NAME_KEY = '@gravity_game_player_name';

// 🎯 GAME MODES (from Screenshot 10)
enum GameMode {
  CLASSIC = 'classic',
  TIME_ATTACK = 'time_attack',
  POWER_UP_RUSH = 'power_up_rush',
  HARDCORE = 'hardcore',
  ZEN = 'zen',
}

// 🪙 MARIO-STYLE COIN INTERFACES - ENHANCED!
interface MarioCoin {
  id: string;
  x: number;
  y: number;
  type: 'normal' | 'rainbow' | 'gem' | 'powerup' | 'multiplier';
  patternId?: string;
  sparkle: Animated.Value;
  bounce: Animated.Value;
  value?: number; // Custom point value
  multiplier?: number; // For multiplier coins
}

// 🌍 MULTI-LANGUAGE SYSTEM
enum Language {
  ENGLISH = 'en',
  CZECH = 'cs',
  SPANISH = 'es',
}

interface Translation {
  // UI Labels
  tapToStart: string;
  gameOver: string;
  distance: string;
  best: string;
  speed: string;
  skill: string;
  flow: string;
  language: string;
  achievements: string;
  customize: string;
  shareGame: string;
  selectLanguage: string;
  close: string;
  back: string;
  restart: string;
  continue: string;
  menu: string;
  audio: string;
  
  // Game Modes
  classic: string;
  timeAttack: string;
  powerUpRush: string;
  hardcore: string;
  zenMode: string;
  
  // Achievements
  unlocked: string;
  total: string;
  firstFlip: string;
  firstFlipDesc: string;
  centuryRunner: string;
  centuryRunnerDesc: string;
  distanceDemon: string;
  distanceDemonDesc: string;
  kilometerKing: string;
  kilometerKingDesc: string;
  persistentPlayer: string;
  persistentPlayerDesc: string;
  
  // Motivational Messages
  keepPracticing: string;
  gettingBetter: string;
  excellentWork: string;
  amazing: string;
  legendary: string;
}

const TRANSLATIONS: Record<Language, Translation> = {
  [Language.ENGLISH]: {
    tapToStart: 'TAP ANYWHERE TO START',
    gameOver: 'Game Over',
    distance: 'Distance',
    best: 'Best',
    speed: 'Speed',
    skill: 'Skill',
    flow: 'Flow',
    language: 'Language',
    achievements: 'Achievements',
    customize: 'Customize',
    shareGame: 'Share Game',
    selectLanguage: '🌍 Select Language',
    close: 'Close',
    back: '← Back',
    restart: 'Restart',
    continue: 'Continue',
    menu: 'Menu',
    audio: 'Audio',
    
    classic: 'Classic',
    timeAttack: 'Time Attack',
    powerUpRush: 'Power Rush',
    hardcore: 'Hardcore',
    zenMode: 'Zen Mode',
    
    unlocked: 'Unlocked',
    total: 'Total',
    firstFlip: 'First Flip',
    firstFlipDesc: 'Make your first gravity flip',
    centuryRunner: 'Century Runner',
    centuryRunnerDesc: 'Travel 100 meters in a single run',
    distanceDemon: 'Distance Demon',
    distanceDemonDesc: 'Travel 500 meters in a single run',
    kilometerKing: 'Kilometer King',
    kilometerKingDesc: 'Travel 1000 meters in a single run',
    persistentPlayer: 'Persistent Player',
    persistentPlayerDesc: 'Play 5 games in a row',
    
    keepPracticing: '🌟 Keep practicing! Every flip counts!',
    gettingBetter: '🚀 Getting better! You\'re finding your rhythm!',
    excellentWork: '⚡ Excellent work! You\'re in the zone!',
    amazing: '🔥 AMAZING! You\'re a gravity master!',
    legendary: '👑 LEGENDARY! You\'ve conquered the stars!',
  },
  
  [Language.CZECH]: {
    tapToStart: 'KLEPNI KAMKOLIV PRO START',
    gameOver: 'Konec Hry',
    distance: 'Vzdálenost',
    best: 'Nejlepší',
    speed: 'Rychlost',
    skill: 'Dovednost',
    flow: 'Flow',
    language: 'Jazyk',
    achievements: 'Úspěchy',
    customize: 'Upravit',
    shareGame: 'Sdílet Hru',
    selectLanguage: '🌍 Vybrat Jazyk',
    close: 'Zavřít',
    back: '← Zpět',
    restart: 'Restart',
    continue: 'Pokračovat',
    menu: 'Menu',
    audio: 'Zvuk',
    
    classic: 'Klasický',
    timeAttack: 'Časový útok',
    powerUpRush: 'Power-up Rush',
    hardcore: 'Hardcore',
    zenMode: 'Zen Mód',
    
    unlocked: 'Odemčeno',
    total: 'Celkem',
    firstFlip: 'První Flip',
    firstFlipDesc: 'Udělej svůj první gravitační flip',
    centuryRunner: 'Století Běžec',
    centuryRunnerDesc: 'Ujeď 100 metrů v jednom běhu',
    distanceDemon: 'Vzdálenostní Démon',
    distanceDemonDesc: 'Ujeď 500 metrů v jednom běhu',
    kilometerKing: 'Kilometrový Král',
    kilometerKingDesc: 'Ujeď 1000 metrů v jednom běhu',
    persistentPlayer: 'Vytrvalý Hráč',
    persistentPlayerDesc: 'Zahraj si 5 her po sobě',
    
    keepPracticing: '🌟 Pokračuj v tréninku! Každý flip se počítá!',
    gettingBetter: '🚀 Zlepšuješ se! Nacházíš svůj rytmus!',
    excellentWork: '⚡ Výborná práce! Jsi v zóně!',
    amazing: '🔥 ÚŽASNÉ! Jsi mistr gravitace!',
    legendary: '👑 LEGENDÁRNÍ! Dobyl jsi hvězdy!',
  },
  
  [Language.SPANISH]: {
    tapToStart: 'TOCA EN CUALQUIER LUGAR PARA EMPEZAR',
    gameOver: 'Fin del Juego',
    distance: 'Distancia',
    best: 'Mejor',
    speed: 'Velocidad',
    skill: 'Habilidad',
    flow: 'Flujo',
    language: 'Idioma',
    achievements: 'Logros',
    customize: 'Personalizar',
    shareGame: 'Compartir Juego',
    selectLanguage: '🌍 Seleccionar Idioma',
    close: 'Cerrar',
    back: '← Atrás',
    restart: 'Reiniciar',
    continue: 'Continuar',
    menu: 'Menú',
    audio: 'Audio',
    
    classic: 'Clásico',
    timeAttack: 'Ataque de Tiempo',
    powerUpRush: 'Impulso de Poderes',
    hardcore: 'Extremo',
    zenMode: 'Modo Zen',
    
    unlocked: 'Desbloqueado',
    total: 'Total',
    firstFlip: 'Primer Volteo',
    firstFlipDesc: 'Haz tu primer volteo de gravedad',
    centuryRunner: 'Corredor del Siglo',
    centuryRunnerDesc: 'Viaja 100 metros en una sola carrera',
    distanceDemon: 'Demonio de la Distancia',
    distanceDemonDesc: 'Viaja 500 metros en una sola carrera',
    kilometerKing: 'Rey del Kilómetro',
    kilometerKingDesc: 'Viaja 1000 metros en una sola carrera',
    persistentPlayer: 'Jugador Persistente',
    persistentPlayerDesc: 'Juega 5 partidas seguidas',
    
    keepPracticing: '🌟 ¡Sigue practicando! ¡Cada volteo cuenta!',
    gettingBetter: '🚀 ¡Mejorando! ¡Estás encontrando tu ritmo!',
    excellentWork: '⚡ ¡Excelente trabajo! ¡Estás en la zona!',
    amazing: '🔥 ¡INCREÍBLE! ¡Eres un maestro de la gravedad!',
    legendary: '👑 ¡LEGENDARIO! ¡Has conquistado las estrellas!',
  },
};

// 🎭 PLAYER STATES
enum PlayerState {
  TOP = 'top',
  BOTTOM = 'bottom',
  TRANSITIONING = 'transitioning',
}

// 🎨 CUSTOMIZATION TYPES (from Screenshots)
interface PlayerSkin {
  id: string;
  name: string;
  color: string;
  rarity: 'common' | 'rare' | 'legendary';
  unlocked: boolean;
}

// 🧪 AUTOMATED TESTING FRAMEWORK - NINTENDO LEVEL QUALITY ASSURANCE!
interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'ui' | 'gameplay' | 'customization' | 'integration';
  steps: TestStep[];
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  timestamp?: number;
}

interface TestStep {
  action: string;
  target: string;
  expectedState?: any;
  actualState?: any;
}

interface TestSuite {
  id: string;
  name: string;
  tests: TestCase[];
  passRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

// 🎮 CUSTOMIZATION TAB SYSTEM
enum CustomizationTab {
  SKINS = 'skins',
  TRAILS = 'trails', 
  EFFECTS = 'effects',
  SPECIAL = 'special'
}

// ✨ PARTICLE SYSTEM TYPES
interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'explosion' | 'achievement' | 'flip' | 'trail' | 'special';
  opacity: number;
}

interface TrailParticle {
  id: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

interface TrailEffect {
  id: string;
  name: string;
  type: string;
  unlocked: boolean;
}

// 🎓 EPIC TUTORIAL SYSTEM INTERFACES
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  target?: 'tap' | 'flip' | 'collect' | 'survive' | 'distance';
  targetValue?: number;
  completed: boolean;
  skippable: boolean;
}

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  showOverlay: boolean;
  highlightTarget?: 'player' | 'obstacle' | 'powerup' | 'ui';
}



interface ParticleEffect {
  id: string;
  name: string;
  shape: string;
  unlocked: boolean;
}

// 🏆 ACHIEVEMENT SYSTEM (from Screenshot 8)
interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'distance' | 'survival' | 'skill' | 'special';
  target: number;
  progress: number;
  unlocked: boolean;
  reward?: string;
}

// 🎮 MAIN GAME STATE
interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  distance: number;
  speed: number;
  highScore: number;
  currentMode: GameMode;
  skill: number;
  flow: number;
  maxSpeed: number;
}

// 🚧 OBSTACLE TYPES
interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'basic' | 'spike' | 'moving';
}

// ⭐ EPIC POWER-UP TYPES - MASSIVE EXPANSION!
interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'score' | 'shield' | 'slow_time' | 'time_freeze' | 'double_score' | 'magnet' | 'ghost_mode';
  collected: boolean;
  duration?: number; // For timed effects
}

// 🦹‍♂️ EPIC BOSS SYSTEM TYPES
interface Boss {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'gravity_well' | 'speed_demon' | 'size_shifter' | 'adaptive_hunter' | 'chaos_master';
  health: number;
  maxHealth: number;
  phase: number;
  lastAbilityTime: number;
  isWarning: boolean;
  warningTime: number;
  color: string;
  speed: number;
  direction: number;
  abilityPattern: number[];
  defeated: boolean;
}

enum BossType {
  GRAVITY_WELL = 'gravity_well',
  SPEED_DEMON = 'speed_demon', 
  SIZE_SHIFTER = 'size_shifter',
  ADAPTIVE_HUNTER = 'adaptive_hunter',
  CHAOS_MASTER = 'chaos_master'
}

// 🏆 ONLINE LEADERBOARD TYPES
interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  distance: number;
  bossesDefeated: number;
  gameMode: GameMode;
  timestamp: number;
  country: string;
  rank: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: string;
  type: 'distance' | 'bosses' | 'flips' | 'survival_time' | 'perfect_run';
  progress: number;
  completed: boolean;
  expiresAt: number;
}

interface PlayerStats {
  totalGames: number;
  totalDistance: number;
  totalFlips: number;
  bossesDefeated: number;
  averageScore: number;
  bestStreak: number;
  achievementsUnlocked: number;
  rank: number;
  level: number;
}

// 🎨 COMPREHENSIVE ORB SYSTEM - NINTENDO DREAM TEAM DESIGN!
interface OrbSkin {
  id: string;
  name: string;
  category: 'classic' | 'elemental' | 'cosmic' | 'legendary' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  colors: {
    core: string;
    outer: string;
    glow: string;
    sparkle: string;
  };
  effects: {
    hasTrail: boolean;
    hasParticles: boolean;
    hasGlow: boolean;
    hasPulse: boolean;
    customEffect?: string;
  };
  unlockCondition: {
    type: 'default' | 'distance' | 'games' | 'achievement' | 'premium';
    requirement?: number;
    description: string;
  };
  unlocked: boolean;
  isNew?: boolean;
}

// 🏁 SUPER MARIO RUN INSPIRED COURSE SYSTEM!
interface Course {
  id: number;
  name: string;
  targetDistance: number;
  coinTarget: number;
  environment: 'sky' | 'underground' | 'castle' | 'space' | 'special';
  unlocked: boolean;
  completed: boolean;
  bestDistance: number;
  coinsCollected: number;
  stars: number; // 1-3 stars based on performance
  attempts: number;
}

interface Coin {
  id: string;
  x: number;
  y: number;
  type: 'normal' | 'special' | 'multiplier';
  value: number;
  collected: boolean;
  sparkleEffect: boolean;
}

interface CourseCompletion {
  courseId: number;
  completed: boolean;
  distance: number;
  coinsCollected: number;
  stars: number;
  celebrationShown: boolean;
}

// 🏁 SUPER MARIO RUN INSPIRED COURSES!
const MARIO_INSPIRED_COURSES: Course[] = [
  {
    id: 1,
    name: "Up and Over",
    targetDistance: 100,
    coinTarget: 15,
    environment: 'sky',
    unlocked: true,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 2, 
    name: "Wall-Kicking It Underground",
    targetDistance: 200,
    coinTarget: 25,
    environment: 'underground',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 3,
    name: "Gravity Caverns",
    targetDistance: 300,
    coinTarget: 35,
    environment: 'underground',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 4,
    name: "Sky Palace Challenge", 
    targetDistance: 400,
    coinTarget: 45,
    environment: 'sky',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 5,
    name: "Cosmic Flip Zone",
    targetDistance: 500,
    coinTarget: 60,
    environment: 'space',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 6,
    name: "Bowser's Castle Hangout",
    targetDistance: 600,
    coinTarget: 75,
    environment: 'castle',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 7,
    name: "Master's Trial",
    targetDistance: 750,
    coinTarget: 90,
    environment: 'special',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  },
  {
    id: 8,
    name: "Infinite Flip Final",
    targetDistance: 1000,
    coinTarget: 120,
    environment: 'special',
    unlocked: false,
    completed: false,
    bestDistance: 0,
    coinsCollected: 0,
    stars: 0,
    attempts: 0
  }
];

// 🌈 EPIC ORB COLLECTION - NINTENDO-LEVEL VARIETY!
const EPIC_ORB_COLLECTION: OrbSkin[] = [
  // 🎭 CLASSIC CATEGORY
  {
    id: 'classic_blue',
    name: 'Classic Blue',
    category: 'classic',
    rarity: 'common',
    colors: {
      core: '#E0E7FF',
      outer: '#3B82F6',
      glow: '#60A5FA',
      sparkle: '#DBEAFE'
    },
    effects: {
      hasTrail: false,
      hasParticles: false,
      hasGlow: true,
      hasPulse: false
    },
    unlockCondition: {
      type: 'default',
      description: 'Available from start'
    },
    unlocked: true
  },
  {
    id: 'classic_purple',
    name: 'Classic Purple',
    category: 'classic',
    rarity: 'common',
    colors: {
      core: '#F3E8FF',
      outer: '#8B5CF6',
      glow: '#A78BFA',
      sparkle: '#EDE9FE'
    },
    effects: {
      hasTrail: false,
      hasParticles: false,
      hasGlow: true,
      hasPulse: false
    },
    unlockCondition: {
      type: 'games',
      requirement: 5,
      description: 'Play 5 games'
    },
    unlocked: false
  },
  {
    id: 'classic_green',
    name: 'Classic Green',
    category: 'classic',
    rarity: 'common',
    colors: {
      core: '#ECFDF5',
      outer: '#10B981',
      glow: '#34D399',
      sparkle: '#D1FAE5'
    },
    effects: {
      hasTrail: false,
      hasParticles: false,
      hasGlow: true,
      hasPulse: false
    },
    unlockCondition: {
      type: 'distance',
      requirement: 100,
      description: 'Travel 100m in a single run'
    },
    unlocked: false
  },

  // 🔥 ELEMENTAL CATEGORY
  {
    id: 'fire_orb',
    name: 'Fire Orb',
    category: 'elemental',
    rarity: 'rare',
    colors: {
      core: '#FEF3C7',
      outer: '#DC2626',
      glow: '#F87171',
      sparkle: '#FCA5A5'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'flame'
    },
    unlockCondition: {
      type: 'distance',
      requirement: 250,
      description: 'Travel 250m in a single run'
    },
    unlocked: false
  },
  {
    id: 'water_orb',
    name: 'Water Orb',
    category: 'elemental',
    rarity: 'rare',
    colors: {
      core: '#F0F9FF',
      outer: '#0369A1',
      glow: '#0EA5E9',
      sparkle: '#7DD3FC'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: false,
      customEffect: 'ripple'
    },
    unlockCondition: {
      type: 'achievement',
      requirement: 10,
      description: 'Collect 10 power-ups in one game'
    },
    unlocked: false
  },
  {
    id: 'lightning_orb',
    name: 'Lightning Orb',
    category: 'elemental',
    rarity: 'epic',
    colors: {
      core: '#FFFBEB',
      outer: '#7C2D12',
      glow: '#F59E0B',
      sparkle: '#FDE68A'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'electric'
    },
    unlockCondition: {
      type: 'distance',
      requirement: 500,
      description: 'Travel 500m in a single run'
    },
    unlocked: false
  },

  // 🌌 COSMIC CATEGORY  
  {
    id: 'galaxy_orb',
    name: 'Galaxy Orb',
    category: 'cosmic',
    rarity: 'epic',
    colors: {
      core: '#1E1B4B',
      outer: '#4C1D95',
      glow: '#8B5CF6',
      sparkle: '#C4B5FD'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'stardust'
    },
    unlockCondition: {
      type: 'games',
      requirement: 50,
      description: 'Complete 50 games'
    },
    unlocked: false
  },
  {
    id: 'nebula_orb',
    name: 'Nebula Orb',
    category: 'cosmic',
    rarity: 'epic',
    colors: {
      core: '#FDF2F8',
      outer: '#BE185D',
      glow: '#EC4899',
      sparkle: '#F9A8D4'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'cosmic_dust'
    },
    unlockCondition: {
      type: 'distance',
      requirement: 750,
      description: 'Travel 750m in a single run'
    },
    unlocked: false
  },

  // 👑 LEGENDARY CATEGORY
  {
    id: 'rainbow_orb',
    name: 'Rainbow Orb',
    category: 'legendary',
    rarity: 'legendary',
    colors: {
      core: '#FFFFFF',
      outer: '#6366F1',
      glow: '#8B5CF6',
      sparkle: '#F59E0B'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'rainbow_shift'
    },
    unlockCondition: {
      type: 'distance',
      requirement: 1000,
      description: 'Travel 1000m in a single run!'
    },
    unlocked: false
  },
  {
    id: 'diamond_orb',
    name: 'Diamond Orb',
    category: 'legendary',
    rarity: 'legendary',
    colors: {
      core: '#FFFFFF',
      outer: '#F8FAFC',
      glow: '#E2E8F0',
      sparkle: '#CBD5E1'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'crystal_shine'
    },
    unlockCondition: {
      type: 'achievement',
      requirement: 100,
      description: 'Score 100+ points without dying'
    },
    unlocked: false
  },

  // 🌟 SPECIAL/MYTHIC CATEGORY
  {
    id: 'master_orb',
    name: 'Master Orb',
    category: 'special',
    rarity: 'mythic',
    colors: {
      core: '#8B5CF6',
      outer: '#6366F1',
      glow: '#A78BFA',
      sparkle: '#C4B5FD'
    },
    effects: {
      hasTrail: true,
      hasParticles: true,
      hasGlow: true,
      hasPulse: true,
      customEffect: 'master_aura'
    },
    unlockCondition: {
      type: 'achievement',
      requirement: 1000,
      description: 'Complete all achievements'
    },
    unlocked: false
  }
];

export default function App() {
  // 🎮 CORE GAME STATE
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    distance: 0,
    speed: BASE_SPEED,
    highScore: 0,
    currentMode: GameMode.CLASSIC,
    skill: 0,
    flow: 0,
    maxSpeed: BASE_SPEED,
  });

  // 🎭 PLAYER STATE
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.BOTTOM);
  const playerY = useRef(new Animated.Value(SAFE_BOTTOM_POSITION)).current;
  const currentPlayerY = useRef(SAFE_BOTTOM_POSITION);
  const playerScale = useRef(new Animated.Value(1)).current;
  const playerRotation = useRef(new Animated.Value(0)).current;

  // 🎨 UI STATES (from Screenshots)
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // 🎮 CUSTOMIZATION STATE MANAGEMENT - NINTENDO STYLE!
  const [activeCustomizationTab, setActiveCustomizationTab] = useState<CustomizationTab>(CustomizationTab.SKINS);
  const [selectedSkinId, setSelectedSkinId] = useState('classic_blue');
  const [selectedTrailId, setSelectedTrailId] = useState('default');
  const [selectedEffectId, setSelectedEffectId] = useState('none');
  const [availableOrbs, setAvailableOrbs] = useState<OrbSkin[]>(EPIC_ORB_COLLECTION);
  const [unlockedOrbs, setUnlockedOrbs] = useState<string[]>(['classic_blue']);

  // 🏁 SUPER MARIO RUN INSPIRED COURSE SYSTEM STATE!
  const [courses, setCourses] = useState<Course[]>(MARIO_INSPIRED_COURSES);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [courseCoins, setCourseCoins] = useState<Coin[]>([]);
  const [collectedCoins, setCollectedCoins] = useState<number>(0);
  const [showCourseCompletion, setShowCourseCompletion] = useState(false);
  const [completionData, setCompletionData] = useState<CourseCompletion | null>(null);
  const [showCourseSelection, setShowCourseSelection] = useState(false);
  
  // 🧪 AUTOMATED TESTING STATE - QUALITY ASSURANCE!
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  
  // 🌍 LANGUAGE SYSTEM
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.ENGLISH);
  const t = TRANSLATIONS[currentLanguage];

       // 🎯 GAME OBJECTS
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // ⚡ EPIC POWER-UP EFFECTS STATE - GAME-CHANGING ABILITIES!
  const [activePowerUps, setActivePowerUps] = useState({
    timeFreeze: { active: false, endTime: 0 },
    doubleScore: { active: false, endTime: 0 },
    magnet: { active: false, endTime: 0 },
    ghostMode: { active: false, endTime: 0 },
    shield: { active: false, endTime: 0 },
  });

  // 🦹‍♂️ EPIC BOSS BATTLE STATE
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [bossWarningActive, setBossWarningActive] = useState(false);
  const [lastBossSpawn, setLastBossSpawn] = useState(0);
  const [bossesDefeated, setBossesDefeated] = useState(0);

  // 🏆 ONLINE FEATURES STATE
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);

  // 👤 PLAYER PROFILE SYSTEM!
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  // 🎓 EPIC TUTORIAL & ONBOARDING SYSTEM!
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    totalSteps: 6,
    showOverlay: false,
    highlightTarget: undefined,
  });


  const [tutorialStats, setTutorialStats] = useState({
    tapsCount: 0,
    flipsCount: 0,
    powerUpsCollected: 0,
    maxDistance: 0,
    survivedTime: 0,
  });
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalGames: 0,
    totalDistance: 0,
    totalFlips: 0,
    bossesDefeated: 0,
    averageScore: 0,
    bestStreak: 0,
    achievementsUnlocked: 0,
    rank: 999999,
    level: 1,
  });
  const [playerName, setPlayerName] = useState('Anonymous Player');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
   
     // 🏆 ACHIEVEMENT TRACKING
  const [totalFlips, setTotalFlips] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

    // 🌟 SIMPLIFIED XP & LEVEL SYSTEM
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [sessionXp, setSessionXp] = useState(0); // XP gained this session
  const xpGainAnim = useRef(new Animated.Value(1)).current;
  
  // XP thresholds for each level
  const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000];

  // 🪙 MARIO-STYLE COIN SYSTEM
  const [marioCoins, setMarioCoins] = useState<MarioCoin[]>([]);
  const [coinCount, setCoinCount] = useState(0);
  const [coinCombo, setCoinCombo] = useState(0);
  const [lastCoinTime, setLastCoinTime] = useState(0);
  const [activeStreaks, setActiveStreaks] = useState<string[]>([]);
  const coinCountAnim = useRef(new Animated.Value(1)).current;
  const comboPopupAnim = useRef(new Animated.Value(0)).current;
  const [comboPopupVisible, setComboPopupVisible] = useState(false);
  
  // 🎨 MARIO-STYLE COIN PATTERNS - CREATIVE & AMAZING!
  const COIN_PATTERNS = {
    line: (startX: number, startY: number) => 
      Array.from({ length: 3 }, (_, i) => ({ x: startX + i * 50, y: startY })),
    arc: (startX: number, startY: number) => [
      { x: startX, y: startY + 30 },
      { x: startX + 60, y: startY },
      { x: startX + 120, y: startY + 30 }
    ],
    zigzag: (startX: number, startY: number) => [
      { x: startX, y: startY },
      { x: startX + 60, y: startY + 40 },
      { x: startX + 120, y: startY }
    ],
    ring: (startX: number, startY: number) => [
      { x: startX + 40, y: startY - 20 },
      { x: startX + 60, y: startY },
      { x: startX + 40, y: startY + 20 },
      { x: startX + 20, y: startY },
      { x: startX + 40, y: startY } // Rainbow coin in center
    ],
    // 💖 NEW: HEART PATTERN - Perfect for special occasions!
    heart: (startX: number, startY: number) => {
      const coins = [];
      const scale = 20;
      for (let i = 0; i < 10; i++) {
        const t = (i / 10) * 2 * Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        coins.push({
          x: startX + (x * scale) / 16,
          y: startY - (y * scale) / 16
        });
      }
      return coins;
    },
    // 🌊 NEW: WAVE PATTERN - Flows like water!
    wave: (startX: number, startY: number) => 
      Array.from({ length: 8 }, (_, i) => ({
        x: startX + i * 35,
        y: startY + Math.sin((i / 8) * 4 * Math.PI) * 35
      })),
    // 🌀 NEW: SPIRAL PATTERN - Mesmerizing!
    spiral: (startX: number, startY: number) => {
      const coins = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 3 * Math.PI;
        const radius = 15 + i * 4;
        coins.push({
          x: startX + Math.cos(angle) * radius,
          y: startY + Math.sin(angle) * radius
        });
      }
      return coins;
    },
    // ⭐ NEW: STAR PATTERN - Shine bright!
    star: (startX: number, startY: number) => [
      { x: startX, y: startY - 40 }, // Top point
      { x: startX - 30, y: startY - 10 }, // Upper left
      { x: startX - 40, y: startY + 20 }, // Lower left
      { x: startX, y: startY }, // Center
      { x: startX + 40, y: startY + 20 }, // Lower right
      { x: startX + 30, y: startY - 10 }, // Upper right
    ],
    // 🎯 NEW: DIAMOND FORMATION - Classic and elegant!
    diamond: (startX: number, startY: number) => [
      { x: startX, y: startY - 40 }, // Top
      { x: startX - 30, y: startY }, // Left
      { x: startX, y: startY }, // Center (rainbow coin!)
      { x: startX + 30, y: startY }, // Right
      { x: startX, y: startY + 40 } // Bottom
    ],
    // 🏃 NEW: MARIO JUMP - Classic platformer pattern!
    jump: (startX: number, startY: number) => [
      { x: startX, y: startY + 40 },
      { x: startX + 25, y: startY + 20 },
      { x: startX + 50, y: startY },
      { x: startX + 75, y: startY - 20 },
      { x: startX + 100, y: startY - 30 },
      { x: startX + 125, y: startY - 20 },
      { x: startX + 150, y: startY },
      { x: startX + 175, y: startY + 20 }
    ]
  };

  // 🌟 XP FUNCTIONS
  const gainXp = (amount: number, reason: string = 'gameplay') => {
    const newSessionXp = sessionXp + amount;
    const newTotalXp = xp + amount;
    
    setSessionXp(newSessionXp);
    setXp(newTotalXp);
    
    // Animate XP gain
    Animated.sequence([
      Animated.timing(xpGainAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(xpGainAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
    
    console.log(`✨ [XP] +${amount} XP for ${reason} (Total: ${newTotalXp})`);
    
    // Check for level up
    checkLevelUp(newTotalXp);
  };

  const checkLevelUp = (currentXp: number) => {
    const newLevel = XP_THRESHOLDS.findIndex(threshold => currentXp < threshold) - 1;
    const calculatedLevel = newLevel === -2 ? XP_THRESHOLDS.length - 1 : Math.max(1, newLevel);
    
    if (calculatedLevel > level) {
      setLevel(calculatedLevel);
      console.log(`🎉 [LEVEL UP] Reached Level ${calculatedLevel}!`);
      
      // Celebration effects
      triggerHaptic('success');
      createParticles(SCREEN_WIDTH / 2, 100, 'special', 20);
    }
  };

  // 🪙 MARIO-STYLE COIN FUNCTIONS
  const spawnCoinPattern = useCallback((patternType: keyof typeof COIN_PATTERNS, baseX: number, baseY: number) => {
    const patternId = `pattern_${Date.now()}_${Math.random()}`;
    const positions = COIN_PATTERNS[patternType](baseX, baseY);
    
    const newCoins: MarioCoin[] = positions.map((pos, index) => {
      // 🌈 SPECIAL COIN LOGIC - More variety and excitement!
      let coinType: MarioCoin['type'] = 'normal';
      let coinValue = 10;
      let coinMultiplier = 1;
      
      // Center coins in certain patterns become special
      const isCenterCoin = (patternType === 'ring' && index === 4) || 
                          (patternType === 'diamond' && index === 2) ||
                          (patternType === 'star' && index === 3);
                          
      if (isCenterCoin) {
        coinType = 'rainbow';
        coinValue = 50;
      } else if (Math.random() < 0.15) { // 15% chance for special coins
        const specialTypes = ['gem', 'powerup', 'multiplier'];
        coinType = specialTypes[Math.floor(Math.random() * specialTypes.length)] as MarioCoin['type'];
        
        switch (coinType) {
          case 'gem':
            coinValue = 25;
            break;
          case 'powerup':
            coinValue = 30;
            break;
          case 'multiplier':
            coinValue = 15;
            coinMultiplier = 2;
            break;
        }
      }
      
      return {
        id: `coin_${patternId}_${index}`,
        x: pos.x,
        y: pos.y,
        type: coinType,
        patternId,
        sparkle: new Animated.Value(0),
        bounce: new Animated.Value(0),
        value: coinValue,
        multiplier: coinMultiplier,
      };
    });

    // ✨ MAGICAL COIN ENTRANCE ANIMATIONS!
    newCoins.forEach((coin, index) => {
      // Set initial values for dramatic entrance
      coin.sparkle.setValue(0);
      coin.bounce.setValue(-30);
      
      setTimeout(() => {
        // 🎭 PHASE 1: DRAMATIC ENTRANCE with bounce-back effect
        Animated.sequence([
          Animated.parallel([
            Animated.timing(coin.sparkle, {
              toValue: 1.4,
              duration: 250,
              easing: Easing.out(Easing.back(2.5)),
              useNativeDriver: true,
            }),
            Animated.timing(coin.bounce, {
              toValue: 8,
              duration: 250,
              easing: Easing.out(Easing.back(1.8)),
              useNativeDriver: true,
            })
          ]),
          // 🎭 PHASE 2: SETTLE INTO FLOATING
          Animated.parallel([
            Animated.timing(coin.sparkle, {
              toValue: 1,
              duration: 200,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(coin.bounce, {
              toValue: 0,
              duration: 200,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            })
          ])
        ]).start(() => {
          // 🌟 PHASE 3: CONTINUOUS FLOATING for special coins
          if (coin.type !== 'normal') {
            const floatRange = coin.type === 'rainbow' ? 8 : coin.type === 'gem' ? 6 : 4;
            const floatSpeed = coin.type === 'rainbow' ? 1800 : coin.type === 'multiplier' ? 1200 : 1500;
            
            Animated.loop(
              Animated.sequence([
                Animated.timing(coin.bounce, {
                  toValue: -floatRange,
                  duration: floatSpeed,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
                Animated.timing(coin.bounce, {
                  toValue: floatRange,
                  duration: floatSpeed,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ])
            ).start();
          } else {
            // Normal coins get subtle bob
            Animated.loop(
              Animated.sequence([
                Animated.timing(coin.bounce, {
                  toValue: -2,
                  duration: 2000,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
                Animated.timing(coin.bounce, {
                  toValue: 2,
                  duration: 2000,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }
        });
      }, index * 120); // Stagger entrance timing
    });

    setMarioCoins(prev => [...prev, ...newCoins]);
    console.log(`🪙 [COINS] Spawned ${patternType} pattern with ${newCoins.length} coins at X=${baseX}, Y=${baseY}`);
  }, []);

  const collectMarioCoin = useCallback((coinId: string) => {
    const coin = marioCoins.find(c => c.id === coinId);
    if (!coin) return;

    const now = Date.now();
    const timeSinceLastCoin = now - lastCoinTime;
    
    // 🎯 ENHANCED XP AND SCORE CALCULATION - All coin types!
    let baseXp = 5;
    let baseScore = 1;
    let extraMultiplier = 1;
    
    switch (coin.type) {
      case 'rainbow':
        baseXp = 25;
        baseScore = 10;
        break;
      case 'gem':
        baseXp = 15;
        baseScore = 5;
        break;
      case 'powerup':
        baseXp = 20;
        baseScore = 6;
        // TODO: Grant temporary power-up
        break;
      case 'multiplier':
        baseXp = 10;
        baseScore = 3;
        extraMultiplier = coin.multiplier || 2; // Double the rewards!
        break;
      default: // normal
        baseXp = 5;
        baseScore = 1;
    }
    
    // Combo system
    let newCombo = coinCombo;
    if (timeSinceLastCoin < 3000) { // 3 second window
      newCombo = Math.min(coinCombo + 1, 10); // Max 10x combo
    } else {
      newCombo = 1; // Reset combo
    }
    
    const multiplier = newCombo >= 10 ? 10 : newCombo >= 5 ? 5 : newCombo >= 3 ? 3 : newCombo >= 2 ? 2 : 1;
    const finalXp = baseXp * multiplier * extraMultiplier;
    const finalScore = baseScore * multiplier * extraMultiplier;

    // Update state
    setCoinCount(prev => prev + finalScore);
    setCoinCombo(newCombo);
    setLastCoinTime(now);
    gainXp(finalXp, `coin collection (${multiplier}x)`);

    // 🎵 SATISFYING HAPTIC FEEDBACK
    if (settings.hapticFeedback) {
      try {
        if (coin.type === 'rainbow') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Stronger for rainbow!
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (e) {
        console.log('Haptic feedback not available');
      }
    }

    // 🎵 JUICY COIN COLLECTION ANIMATION
    Animated.sequence([
      Animated.timing(coinCountAnim, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(coinCountAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();

    // 🎵 ENHANCED COMBO POPUP with screen juice!
    if (multiplier >= 2) {
      setComboPopupVisible(true);
      Animated.sequence([
        Animated.timing(comboPopupAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }), // Bigger pop!
        Animated.timing(comboPopupAnim, { toValue: 1.0, duration: 100, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(comboPopupAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start(() => setComboPopupVisible(false));
    }

    // Remove coin
    setMarioCoins(prev => prev.filter(c => c.id !== coinId));
    
    // 🎨 ENHANCED COLLECTION PARTICLES - Type-specific effects!
    let particleCount, colors, particleSize, burst;
    
    switch (coin.type) {
      case 'rainbow':
        particleCount = 12;
        colors = ['#FF69B4', '#FF1493', '#8A2BE2', '#4B0082', '#00CED1', '#FFD700'];
        particleSize = 10;
        burst = 300;
        break;
      case 'gem':
        particleCount = 8;
        colors = ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD'];
        particleSize = 8;
        burst = 250;
        break;
      case 'powerup':
        particleCount = 10;
        colors = ['#FF4500', '#FF6347', '#FFA500', '#FFD700'];
        particleSize = 9;
        burst = 280;
        break;
      case 'multiplier':
        particleCount = 6;
        colors = ['#32CD32', '#90EE90', '#00FF00', '#ADFF2F'];
        particleSize = 7;
        burst = 200;
        break;
      default: // normal
        particleCount = 4;
        colors = ['#FFD700', '#FFA500', '#FF8C00'];
        particleSize = 6;
        burst = 180;
    }
    
    // Spawn particles in burst pattern
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.5 + Math.random() * 0.8;
      const particle = {
        id: `coin-particle-${Date.now()}-${i}`,
        x: coin.x + Math.random() * 15 - 7.5,
        y: coin.y + Math.random() * 15 - 7.5,
        vx: Math.cos(angle) * burst * speed,
        vy: Math.sin(angle) * burst * speed - 80, // Upward bias
        life: 1.0,
        maxLife: 1.0,
        decay: 0.015, // Slower decay for better visibility
        type: 'special' as const,
        opacity: 1.0,
        color: colors[i % colors.length],
        size: particleSize + Math.random() * 3
      };
      setParticles(prev => [...prev, particle]);
    }
    
    // ✨ EXTRA SPARKLE EFFECT for special coins
    if (coin.type !== 'normal') {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const sparkle = {
            id: `sparkle-${Date.now()}-${i}`,
            x: coin.x + (Math.random() - 0.5) * 40,
            y: coin.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 100,
            vy: -Math.random() * 100 - 30,
            life: 1.0,
            maxLife: 1.0,
            decay: 0.025,
            type: 'special' as const,
            opacity: 0.8,
            color: '#FFFFFF',
            size: 4
          };
          setParticles(prev => [...prev, sparkle]);
        }, i * 50);
      }
    }
    
    // 🎵 MARIO-STYLE COIN COLLECTION SOUNDS!
    if (coin.type === 'rainbow') {
      playSound('rainbow');
    } else if (coin.type === 'gem') {
      playSound('gem');
    } else if (coin.type === 'multiplier') {
      playSound('multiplier');
    } else {
      playSound('coin');
    }
    
    // 🎵 COMBO SOUND EFFECT
    if (multiplier >= 5) {
      setTimeout(() => playSound('combo'), 100); // Slight delay for combo celebration
    }
    
    // 🎵 FLOATING SCORE TEXT
    const scoreText = `+${finalScore}`;
    const xpText = `+${finalXp} XP`;
    console.log(`🪙 [COLLECT] ${coin.type} coin collected! ${scoreText} ${xpText} (${multiplier}x combo) 💥`);
  }, [marioCoins, coinCombo, lastCoinTime, gainXp]);

  const checkCoinCollisions = useCallback(() => {
    if (gameState.isGameOver || marioCoins.length === 0) return;

    // Use actual player Y position from playerState
    const actualPlayerY = playerState === 'top' ? 150 : 732;
    console.log(`🪙 [COLLISION] Checking ${marioCoins.length} coins vs Player Y=${actualPlayerY} state=${playerState}`);
    
    // More forgiving collision bounds!
    const playerBounds = {
      left: 20,  // Wider left bound
      right: 80, // Wider right bound  
      top: actualPlayerY - 30,  // Taller collision box
      bottom: actualPlayerY + 30
    };

    console.log(`🪙 [COLLISION] Checking ${marioCoins.length} coins vs Player Y=${actualPlayerY} state=${playerState}`);

    marioCoins.forEach(coin => {
      const coinBounds = {
        left: coin.x,
        right: coin.x + 30,  // Slightly wider coin bounds
        top: coin.y - 15,    // Slightly taller coin bounds
        bottom: coin.y + 15
      };

      const collision = playerBounds.left < coinBounds.right &&
                       playerBounds.right > coinBounds.left &&
                       playerBounds.top < coinBounds.bottom &&
                       playerBounds.bottom > coinBounds.top;

      if (collision) {
        console.log(`🪙 [COLLECT] ✅ COIN COLLECTED! Player(${playerBounds.left}-${playerBounds.right}, ${playerBounds.top}-${playerBounds.bottom}) vs Coin(${coinBounds.left}-${coinBounds.right}, ${coinBounds.top}-${coinBounds.bottom})`);
        collectMarioCoin(coin.id);
      } else {
        // Debug: Show near misses
        const distance = Math.abs((playerBounds.left + playerBounds.right) / 2 - (coinBounds.left + coinBounds.right) / 2);
        if (distance < 100) {
          console.log(`🪙 [NEAR] Coin ${coin.id} close! Distance: ${distance.toFixed(1)}px Player(${playerBounds.left}-${playerBounds.right}) Coin(${coinBounds.left}-${coinBounds.right})`);
        }
      }
    });
  }, [marioCoins, collectMarioCoin, gameState.isPlaying, playerState]);

  const getCurrentLevelProgress = () => {
    if (level >= XP_THRESHOLDS.length - 1) return { progress: 100, current: xp, needed: xp };
    
    const currentThreshold = XP_THRESHOLDS[level];
    const nextThreshold = XP_THRESHOLDS[level + 1];
    const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    
    return {
      progress: Math.max(0, Math.min(100, progress)),
      current: xp - currentThreshold,
      needed: nextThreshold - currentThreshold
    };
  };

  // ✨ PARTICLE SYSTEM STATE
   const [particles, setParticles] = useState<Particle[]>([]);
   const [trailParticles, setTrailParticles] = useState<TrailParticle[]>([]);

     // 🎵 EPIC AUDIO SYSTEM SETUP - FIXED VERSION!
   const audioContextRef = useRef<AudioContext | null>(null);
   const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
   const currentSettingsRef = useRef<GameSettings | null>(null);

  // 🎪 ANIMATIONS
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  // 💥 ENHANCED CAMERA SHAKE SYSTEM - EPIC VISUAL FEEDBACK!
  const triggerScreenShake = useCallback((intensity: 'light' | 'medium' | 'heavy' | 'extreme' = 'medium') => {
    const shakeValues: Record<string, { amount: number; duration: number; cycles: number }> = {
      light: { amount: 3, duration: 30, cycles: 2 },
      medium: { amount: 8, duration: 40, cycles: 3 },
      heavy: { amount: 15, duration: 60, cycles: 4 },
      extreme: { amount: 25, duration: 80, cycles: 6 },
    };

    const { amount, duration, cycles } = shakeValues[intensity];
    const animations: Animated.CompositeAnimation[] = [];

    for (let i = 0; i < cycles; i++) {
      animations.push(
        Animated.timing(screenShake, {
          toValue: (i % 2 === 0 ? 1 : -1) * amount * (1 - i / cycles), // Diminishing shake
          duration: duration,
          useNativeDriver: false,
        })
      );
    }

    animations.push(
      Animated.timing(screenShake, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      })
    );

    Animated.sequence(animations).start();
  }, [screenShake]);


  const gameOverFadeAnim = useRef(new Animated.Value(0)).current;
  const gameOverScaleAnim = useRef(new Animated.Value(0.8)).current;

  // 🎮 GAME LOOP REFS
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleSpawnRef = useRef<NodeJS.Timeout | null>(null);

     // 🎵 SOUND GENERATION FUNCTIONS - REMOVED (using Web Audio API instead)

   // 🎵 EPIC AUDIO SYSTEM + SUPER DEBUG - FIXED VERSION!
   const initializeAudio = useCallback(() => {
     try {
       if (typeof window !== 'undefined' && window.AudioContext) {
         audioContextRef.current = new AudioContext();
         console.log('[AUDIO] 🎵 Audio context initialized successfully');
       }
     } catch (error) {
       console.error('[AUDIO] ❌ Failed to initialize audio context:', error);
     }
   }, []);

   const createAudioBuffer = useCallback((frequencies: number[], duration: number = 0.1): AudioBuffer | null => {
     if (!audioContextRef.current) return null;
     
     try {
       const sampleRate = audioContextRef.current.sampleRate;
       const buffer = audioContextRef.current.createBuffer(1, sampleRate * duration, sampleRate);
       const channelData = buffer.getChannelData(0);
       
       for (let i = 0; i < channelData.length; i++) {
         const time = i / sampleRate;
         let sample = 0;
         
         frequencies.forEach((freq, index) => {
           const amplitude = 0.3 * Math.exp(-time * 2); // Decay envelope
           sample += amplitude * Math.sin(2 * Math.PI * freq * time);
         });
         
         channelData[i] = Math.max(-1, Math.min(1, sample));
       }
       
       return buffer;
     } catch (error) {
       console.error('[AUDIO] ❌ Failed to create audio buffer:', error);
       return null;
     }
   }, []);

   const playSound = useCallback((soundType: 'flip' | 'game_over' | 'start' | 'power_up' | 'achievement' | 'coin' | 'gem' | 'rainbow' | 'multiplier' | 'combo') => {
     // Get current settings from ref to avoid circular dependency
     const currentSettings = currentSettingsRef.current;
     if (!currentSettings?.audioEnabled || !audioContextRef.current) {
       console.log(`[AUDIO] 🔇 Audio disabled or context not available for ${soundType}`);
       return;
     }

     const soundId = Math.random().toString(36).substr(2, 6);
     const soundStartTime = performance.now();
     
     console.log(`[AUDIO] 🎵 Starting sound playback: ${soundType} (ID: ${soundId})`);
     
     try {
       console.log(`🎵 Playing ${soundType} sound effect!`);
       
       let buffer: AudioBuffer | null = null;
       
       switch (soundType) {
         case 'flip':
           buffer = createAudioBuffer([800, 1200], 0.08); // Crisp flip sound
           break;
         case 'game_over':
           buffer = createAudioBuffer([400, 300, 200], 0.3); // Descending game over
           break;
         case 'start':
           buffer = createAudioBuffer([600, 800, 1000], 0.2); // Rising start
           break;
         case 'power_up':
           buffer = createAudioBuffer([1000, 1200, 1400], 0.15); // Power-up chime
           break;
         case 'achievement':
           buffer = createAudioBuffer([800, 1000, 1200, 1400], 0.4); // Achievement fanfare
           break;
         // 🪙 MARIO-STYLE COIN SOUNDS!
         case 'coin':
           buffer = createAudioBuffer([1047, 1319], 0.12); // Classic Mario coin sound (C6 to E6)
           break;
         case 'gem':
           buffer = createAudioBuffer([1319, 1568, 1760], 0.15); // Sparkling gem sound (E6-G6-A6)
           break;
         case 'rainbow':
           buffer = createAudioBuffer([1047, 1319, 1568, 1760, 2093], 0.25); // Rainbow ascending (C6-E6-G6-A6-C7)
           break;
         case 'multiplier':
           buffer = createAudioBuffer([1760, 1568, 1760, 2093], 0.18); // Money multiplier sound
           break;
         case 'combo':
           buffer = createAudioBuffer([1568, 1760, 2093, 2349], 0.3); // Combo celebration sound
           break;
       }
       
       if (buffer) {
         const source = audioContextRef.current.createBufferSource();
         const gainNode = audioContextRef.current.createGain();
         
         source.buffer = buffer;
         source.connect(gainNode);
         gainNode.connect(audioContextRef.current.destination);
         
         // Apply volume settings
         const volume = currentSettings.masterVolume * currentSettings.soundEffectsVolume;
         gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
         
         source.start();
         source.onended = () => {
           const soundEndTime = performance.now();
           console.log(`[AUDIO] ✅ Sound ${soundType} (${soundId}) completed in ${(soundEndTime - soundStartTime).toFixed(2)}ms`);
         };
       }
       
     } catch (error) {
       const errorTime = performance.now();
       console.error(`[AUDIO] ❌ Audio playback failed for ${soundType} (${soundId}) after ${(errorTime - soundStartTime).toFixed(2)}ms:`, error);
     }
   }, [createAudioBuffer]);

   // 📳 HAPTIC FEEDBACK FUNCTIONS
   const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
     try {
       switch (type) {
         case 'light':
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
           break;
         case 'medium':
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
           break;
         case 'heavy':
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
           break;
         case 'success':
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           break;
         case 'warning':
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
           break;
         case 'error':
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
           break;
       }
     } catch (error) {
       // Haptics might not be available on all devices
       console.log('Haptic feedback not available');
     }
      }, []);

   // ✨ PARTICLE SYSTEM FUNCTIONS
   const createParticles = useCallback((x: number, y: number, type: Particle['type'], count: number = 4) => { // Reduced default particles for cleaner look
     const newParticles: Particle[] = [];
     
     for (let i = 0; i < count; i++) {
       const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
       const speed = Math.random() * 3 + 1;
       const life = Math.random() * 60 + 30;
       
       let color = '#FFD60A';
       let size = Math.random() * 8 + 4;
       
       switch (type) {
         case 'explosion':
           color = ['#FF4444', '#FF6B35', '#FFD60A', '#FFFFFF'][Math.floor(Math.random() * 4)];
           size = Math.random() * 12 + 6;
           break;
         case 'achievement':
           color = ['#22C55E', '#4CAF50', '#8BC34A', '#CDDC39'][Math.floor(Math.random() * 4)];
           size = Math.random() * 10 + 5;
           break;
         case 'flip':
           color = gameState.currentMode === GameMode.TIME_ATTACK ? '#FF6B35' :
                   gameState.currentMode === GameMode.POWER_UP_RUSH ? '#9C27B0' :
                   gameState.currentMode === GameMode.HARDCORE ? '#D32F2F' :
                   gameState.currentMode === GameMode.ZEN ? '#4CAF50' : '#8B5CF6';
           size = Math.random() * 6 + 3;
           break;
         case 'special':
           color = '#FFD60A';
           size = Math.random() * 15 + 8;
           break;
       }
       
       newParticles.push({
         id: `particle_${Date.now()}_${i}`,
         x,
         y,
         vx: Math.cos(angle) * speed,
         vy: Math.sin(angle) * speed,
         life,
         maxLife: life,
         size,
         color,
         type,
         opacity: 1,
       });
     }
     
     setParticles(prev => [...prev, ...newParticles]);
   }, [gameState.currentMode]);

   const createTrailParticle = useCallback((x: number, y: number) => {
     const trailParticle: TrailParticle = {
       id: `trail_${Date.now()}`,
       x,
       y,
       life: 30,
       maxLife: 30,
       size: Math.random() * 4 + 2,
       color: gameState.currentMode === GameMode.TIME_ATTACK ? '#FF6B35' :
              gameState.currentMode === GameMode.POWER_UP_RUSH ? '#9C27B0' :
              gameState.currentMode === GameMode.HARDCORE ? '#D32F2F' :
              gameState.currentMode === GameMode.ZEN ? '#4CAF50' : '#8B5CF6',
       opacity: 0.8,
     };
     
     setTrailParticles(prev => [...prev, trailParticle]);
   }, [gameState.currentMode]);

   // ✨ PARTICLE UPDATE SYSTEM
   useEffect(() => {
     if (!gameState.isPlaying) return;

     const updateInterval = setInterval(() => {
       // Update regular particles
       setParticles(prev => 
         prev.map(particle => ({
           ...particle,
           x: particle.x + particle.vx,
           y: particle.y + particle.vy,
           life: particle.life - 1,
           opacity: particle.life / particle.maxLife,
           vy: particle.vy + 0.1, // Gravity effect
         })).filter(particle => particle.life > 0)
       );

       // Update trail particles
       setTrailParticles(prev => 
         prev.map(trail => ({
           ...trail,
           life: trail.life - 1,
           opacity: (trail.life / trail.maxLife) * 0.8,
           size: trail.size * 0.98, // Shrink over time
         })).filter(trail => trail.life > 0)
       );

       // Create player trail particles
       if (Math.random() > 0.7) { // 30% chance each frame
         createTrailParticle(50, currentPlayerY.current);
       }
     }, 32); // ~30fps for particles

     return () => clearInterval(updateInterval);
   }, [gameState.isPlaying, createTrailParticle]);

   // 💾 STORAGE FUNCTIONS
  const loadHighScore = useCallback(async () => {
    try {
      const savedScore = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (savedScore) {
        setGameState(prev => ({ ...prev, highScore: parseInt(savedScore) }));
      }
    } catch (error) {
      console.log('Error loading high score:', error);
    }
  }, []);

  const saveHighScore = useCallback(async (score: number) => {
    try {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
    } catch (error) {
      console.log('Error saving high score:', error);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const savedLeaderboard = await AsyncStorage.getItem('leaderboard');
      if (savedLeaderboard) {
        const parsedLeaderboard: LeaderboardEntry[] = JSON.parse(savedLeaderboard);
        setLeaderboard(parsedLeaderboard);
        console.log(`[LEADERBOARD] 📊 Loaded ${parsedLeaderboard.length} scores from storage`);
      }
    } catch (error) {
      console.log('[LEADERBOARD] ❌ Error loading leaderboard:', error);
    }
  }, []);

  // 🌍 LANGUAGE PERSISTENCE FUNCTIONS
  const loadLanguage = useCallback(async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && Object.values(Language).includes(savedLanguage as Language)) {
        console.log('🌍 Loading saved language:', savedLanguage);
        setCurrentLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  }, []);

  const saveLanguage = useCallback(async (newLanguage: Language) => {
    try {
      console.log('🌍 Saving language:', newLanguage);
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  }, []);

  // 🎮 CORE GAME MECHANICS + SUPER DEBUG
  const flipPlayer = useCallback(() => {
    const flipId = Math.random().toString(36).substr(2, 9);
    const flipStartTime = performance.now();
    
    console.log(`🔄 [FLIP DEBUG] 🚀 Starting flip ${flipId}`);
    console.log(`🔄 [FLIP DEBUG] 📊 Current state: ${playerState}`);
    console.log(`🔄 [FLIP DEBUG] 📍 Current Y position: ${currentPlayerY.current}px`);
    
    if (playerState === PlayerState.TRANSITIONING) {
      console.warn(`🔄 [FLIP DEBUG] ⚠️ Flip blocked - player already transitioning!`);
      return;
    }

    const isAtTop = playerState === PlayerState.TOP;
    const targetY = isAtTop ? SAFE_BOTTOM_POSITION : SAFE_TOP_POSITION;
    const newState = isAtTop ? PlayerState.BOTTOM : PlayerState.TOP;
    
    console.log(`🔄 [FLIP DEBUG] 🎯 Target: ${playerState} -> ${newState}`);
    console.log(`🔄 [FLIP DEBUG] 📏 Y movement: ${currentPlayerY.current} -> ${targetY} (${Math.abs(targetY - currentPlayerY.current)}px)`);
    console.log(`🔄 [FLIP DEBUG] ⏱️ Animation duration: ${TRANSITION_DURATION}ms`);

         setPlayerState(PlayerState.TRANSITIONING);
     setTotalFlips(prev => {
       console.log(`🔄 [FLIP DEBUG] 📊 Total flips: ${prev} -> ${prev + 1}`);
       gainXp(2, 'flip'); // 2 XP per flip
       return prev + 1;
     });
     
     // ✨ CREATE FLIP PARTICLE EFFECT
     console.log(`🔄 [FLIP DEBUG] ✨ Creating particles at Y: ${currentPlayerY.current}`);
     createParticles(50, currentPlayerY.current, 'flip', 6);
     
     console.log(`🔄 [FLIP DEBUG] 📳 Triggering haptic feedback`);
     triggerHaptic('light');
     playSound('flip');
     
     // 💫 SUBTLE FLIP CAMERA SHAKE!
     console.log(`🔄 [FLIP DEBUG] 📳 Triggering screen shake`);
     triggerScreenShake('light');
     
     // 🌈 FLIP GLOW EFFECT!
     console.log(`🔄 [FLIP DEBUG] 🌈 Updating player glow`);
     updatePlayerGlow('#00FF88', 1.3);

    // Haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics failed
    }

    // Update position in real-time for collision detection! 🎯
    const animationListener = playerY.addListener(({ value }) => {
      currentPlayerY.current = value;
    });

    // Player animations
    Animated.parallel([
      Animated.timing(playerY, {
        toValue: targetY,
        duration: TRANSITION_DURATION,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(playerScale, {
          toValue: 1.2,
          duration: TRANSITION_DURATION / 2,
          useNativeDriver: false,
        }),
        Animated.timing(playerScale, {
          toValue: 1,
          duration: TRANSITION_DURATION / 2,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(playerRotation, {
        toValue: 360,
        duration: TRANSITION_DURATION,
        useNativeDriver: false,
      }),
         ]).start((finished) => {
       const flipEndTime = performance.now();
       console.log(`🔄 [FLIP DEBUG] ✅ Flip ${flipId} animation finished=${finished} in ${(flipEndTime - flipStartTime).toFixed(2)}ms`);
       console.log(`🔄 [FLIP DEBUG] 📍 Setting final position: ${targetY}px`);
       console.log(`🔄 [FLIP DEBUG] 🎯 Setting final state: ${newState}`);
       
       setPlayerState(newState);
       currentPlayerY.current = targetY;
       playerRotation.setValue(0); // Reset rotation
       playerY.removeListener(animationListener); // Clean up listener
       
       // Verify final position
       const finalCheck = setTimeout(() => {
         console.log(`🔄 [FLIP DEBUG] 🔍 Post-flip verification:`);
         console.log(`🔄 [FLIP DEBUG] 📍 Expected Y: ${targetY}, Actual Y: ${currentPlayerY.current}`);
         console.log(`🔄 [FLIP DEBUG] 🎯 Expected State: ${newState}, Actual State: ${playerState}`);
         
         if (Math.abs(currentPlayerY.current - targetY) > 5) {
           console.error(`🔄 [FLIP DEBUG] ❌ POSITION MISMATCH! Off by ${Math.abs(currentPlayerY.current - targetY)}px`);
         }
       }, 50);
     });
  }, [playerState, playSound, playerY, playerScale, playerRotation]);

  // 🚧 OBSTACLE SPAWNING WITH MODE-SPECIFIC BEHAVIORS
  const spawnObstacle = useCallback(() => {
    // MODE-SPECIFIC OBSTACLE PROPERTIES
    let obstacleCount = 1;
    let obstacleSize = OBSTACLE_WIDTH;
    let obstacleColor = '#E53E3E'; // Clean solid red like reference game
    
    switch (gameState.currentMode) {
      case GameMode.TIME_ATTACK:
        obstacleCount = Math.random() > 0.7 ? 2 : 1; // 30% chance for double obstacles
        obstacleColor = '#FF6B35'; // Orange for urgency
        break;
      case GameMode.POWER_UP_RUSH:
        obstacleSize = OBSTACLE_WIDTH * 0.8; // 20% smaller obstacles
        obstacleColor = '#9C27B0'; // Purple theme
        break;
      case GameMode.HARDCORE:
        obstacleCount = Math.random() > 0.5 ? 2 : 1; // 50% chance for double obstacles
        obstacleSize = OBSTACLE_WIDTH * 1.2; // 20% larger obstacles
        obstacleColor = '#D32F2F'; // Dark red for danger
        break;
      case GameMode.ZEN:
        obstacleSize = OBSTACLE_WIDTH * 0.9; // 10% smaller obstacles
        obstacleColor = '#4CAF50'; // Green for calm
        break;
      default: // CLASSIC
        obstacleColor = '#E53E3E'; // Clean solid red like reference game
        break;
    }

    // Spawn obstacles based on count
    for (let i = 0; i < obstacleCount; i++) {
      const newObstacle: Obstacle = {
        id: `obstacle_${Date.now()}_${i}`,
        x: SCREEN_WIDTH + 50 + (i * 200), // Space them out if multiple
        y: Math.random() * (SCREEN_HEIGHT - SAFE_AREA_TOP - SAFE_AREA_BOTTOM - OBSTACLE_HEIGHT) + SAFE_AREA_TOP,
        width: obstacleSize,
        height: OBSTACLE_HEIGHT,
        color: obstacleColor,
        type: 'basic',
      };

      setObstacles(prev => [...prev, newObstacle]);
    }
  }, [gameState.currentMode]);

  // 💥 COLLISION DETECTION + SUPER DEBUG - MARTIN'S CHALLENGE MODE! 🎯
  const checkCollision = useCallback(() => {
    const collisionId = Math.random().toString(36).substr(2, 6);
    const checkStartTime = performance.now();
    
    const playerBounds = {
      x: 50 - PLAYER_SIZE / 2,
      y: currentPlayerY.current - PLAYER_SIZE / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    console.log(`[COLLISION] 🎯 Starting collision check ${collisionId}`);
    console.log(`[COLLISION] 👤 Player: pos(${50}, ${currentPlayerY.current}) bounds(${playerBounds.x}, ${playerBounds.y}, ${playerBounds.width}x${playerBounds.height}) state=${playerState}`);
    console.log(`[COLLISION] 🚧 Checking ${obstacles.length} obstacles`);

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const obstacleDistance = Math.abs(obstacle.x - 50);
      
      console.log(`[COLLISION] 🚧 Obstacle ${i}: pos(${obstacle.x}, ${obstacle.y}) size(${obstacle.width}x${obstacle.height}) distance=${obstacleDistance.toFixed(1)}px`);
      
      // Enhanced collision bounds checking with detailed logging
      const leftOverlap = playerBounds.x < obstacle.x + obstacle.width;
      const rightOverlap = playerBounds.x + playerBounds.width > obstacle.x;
      const topOverlap = playerBounds.y < obstacle.y + obstacle.height;
      const bottomOverlap = playerBounds.y + playerBounds.height > obstacle.y;
      
      console.log(`[COLLISION] 📐 Overlap check: left=${leftOverlap} right=${rightOverlap} top=${topOverlap} bottom=${bottomOverlap}`);
      
      if (leftOverlap && rightOverlap && topOverlap && bottomOverlap) {
        const overlapX = Math.min(playerBounds.x + playerBounds.width, obstacle.x + obstacle.width) - Math.max(playerBounds.x, obstacle.x);
        const overlapY = Math.min(playerBounds.y + playerBounds.height, obstacle.y + obstacle.height) - Math.max(playerBounds.y, obstacle.y);
        
        console.error(`[COLLISION] 💥 COLLISION DETECTED! ID=${collisionId}`);
        console.error(`[COLLISION] 💥 Overlap area: ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px`);
        console.error(`[COLLISION] 💥 Player state: ${playerState} at Y=${currentPlayerY.current}`);
        console.error(`[COLLISION] 💥 Obstacle ${i}: x=${obstacle.x}, y=${obstacle.y}, w=${obstacle.width}, h=${obstacle.height}`);
        
        // Check if player is in a power-up state that should prevent collision
        if (activePowerUps.ghostMode.active) {
          console.warn(`[COLLISION] 👻 Ghost mode active - ignoring collision!`);
          continue;
        }
        
        if (activePowerUps.shield.active) {
          console.warn(`[COLLISION] 🛡️ Shield active - blocking collision!`);
          // This should be handled elsewhere, but log it
          continue;
        }
        
        return true;
      }
    }
    
    const checkEndTime = performance.now();
    console.log(`[COLLISION] ✅ No collisions detected in ${(checkEndTime - checkStartTime).toFixed(2)}ms`);
    return false;
  }, [obstacles, playerState, activePowerUps]);

  // ⭐ POWER-UP COLLISION DETECTION - MARTIN'S COLLECTION EDITION! 💎
  const checkPowerUpCollision = useCallback(() => {
    if (gameState.isGameOver || powerUps.length === 0) return null;
    console.log('[POWERUP DEBUG][COLLISION CHECK] Running power-up collision check. Power-ups in state:', powerUps.length);
    
    const playerBounds = {
      x: 50 - PLAYER_SIZE / 2,
      y: currentPlayerY.current - PLAYER_SIZE / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    console.log('[POWERUP] ⭐ Checking power-up collisions - Player Y:', currentPlayerY.current, 'Power-ups:', powerUps.length);

    for (const powerUp of powerUps) {
      if (powerUp.collected) continue;

      const powerUpBounds = {
        x: powerUp.x - POWERUP_SIZE / 2,
        y: powerUp.y - POWERUP_SIZE / 2,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
      };

      console.log('[POWERUP] 💎 Power-up at:', powerUp.x, powerUp.y, 'Player bounds:', playerBounds);

      if (
        playerBounds.x < powerUpBounds.x + powerUpBounds.width &&
        playerBounds.x + playerBounds.width > powerUpBounds.x &&
        playerBounds.y < powerUpBounds.y + powerUpBounds.height &&
        playerBounds.y + playerBounds.height > powerUpBounds.y
      ) {
        console.log('[POWERUP] ✨ POWER-UP COLLECTED!', powerUp.type);
        return powerUp;
      }
    }
    return null;
  }, [powerUps]);

  // 🦹‍♂️ BOSS COLLISION DETECTION
  const checkBossCollision = useCallback(() => {
    const playerBounds = {
      x: 50 - PLAYER_SIZE / 2,
      y: currentPlayerY.current - PLAYER_SIZE / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    for (const boss of bosses) {
      if (boss.defeated) continue;

      const bossBounds = {
        x: boss.x,
        y: boss.y,
        width: boss.width,
        height: boss.height,
      };

      if (
        playerBounds.x < bossBounds.x + bossBounds.width &&
        playerBounds.x + playerBounds.width > bossBounds.x &&
        playerBounds.y < bossBounds.y + bossBounds.height &&
        playerBounds.y + playerBounds.height > bossBounds.y
      ) {
        return boss;
      }
    }
    return null;
  }, [bosses]);

  // 🌟 PARALLAX BACKGROUND SYSTEM - EPIC SPACE ENVIRONMENT!
  const generateBackgroundStars = useCallback(() => {
    const stars: BackgroundStar[] = [];
    const starColors = ['#FFFFFF', '#FFD700', '#87CEEB', '#DDA0DD', '#98FB98', '#F0E68C'];
    
    // Generate initial stars
    for (let i = 0; i < 150; i++) {
      stars.push({
        id: `star_${i}`,
        x: Math.random() * (SCREEN_WIDTH + 200),
        y: Math.random() * SCREEN_HEIGHT,
        size: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7,
        speed: 0.5 + Math.random() * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    
    setBackgroundStars(stars);
  }, []);

  const generateBackgroundPlanets = useCallback(() => {
    const planets: BackgroundPlanet[] = [];
    const planetColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12'];
    const planetTypes: ('planet' | 'moon' | 'asteroid')[] = ['planet', 'moon', 'asteroid'];
    
    // Generate initial planets
    for (let i = 0; i < 8; i++) {
      planets.push({
        id: `planet_${i}`,
        x: Math.random() * (SCREEN_WIDTH + 400),
        y: Math.random() * SCREEN_HEIGHT,
        size: 20 + Math.random() * 80,
        color: planetColors[Math.floor(Math.random() * planetColors.length)],
        speed: 0.2 + Math.random() * 0.8,
        type: planetTypes[Math.floor(Math.random() * planetTypes.length)],
      });
    }
    
    setBackgroundPlanets(planets);
  }, []);

  const spawnNewBackgroundElement = useCallback(() => {
    // Spawn new star
    if (Math.random() < 0.7) {
      const starColors = ['#FFFFFF', '#FFD700', '#87CEEB', '#DDA0DD', '#98FB98', '#F0E68C'];
      const newStar: BackgroundStar = {
        id: `star_${Date.now()}`,
        x: SCREEN_WIDTH + 50,
        y: Math.random() * SCREEN_HEIGHT,
        size: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7,
        speed: 0.5 + Math.random() * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      };
      setBackgroundStars(prev => [...prev, newStar]);
    }
    
    // Spawn new planet occasionally
    if (Math.random() < 0.1) {
      const planetColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12'];
      const planetTypes: ('planet' | 'moon' | 'asteroid')[] = ['planet', 'moon', 'asteroid'];
      const newPlanet: BackgroundPlanet = {
        id: `planet_${Date.now()}`,
        x: SCREEN_WIDTH + 100,
        y: Math.random() * SCREEN_HEIGHT,
        size: 20 + Math.random() * 80,
        color: planetColors[Math.floor(Math.random() * planetColors.length)],
        speed: 0.2 + Math.random() * 0.8,
        type: planetTypes[Math.floor(Math.random() * planetTypes.length)],
      };
      setBackgroundPlanets(prev => [...prev, newPlanet]);
    }
  }, []);

  // 🎯 GAME OVER
  const gameOver = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (obstacleSpawnRef.current) {
      clearInterval(obstacleSpawnRef.current);
      obstacleSpawnRef.current = null;
    }

    // Check for new high score
    if (gameState.distance > gameState.highScore) {
      saveHighScore(Math.floor(gameState.distance));
      setGameState(prev => ({ ...prev, highScore: Math.floor(gameState.distance) }));
    }

       setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
   setGamesPlayed(prev => prev + 1);
   
   // 🔥 STOP PLAYER TRAIL
   stopPlayerTrail();
   
   // ✨ CREATE EPIC EXPLOSION PARTICLE EFFECT
   createParticles(50, currentPlayerY.current, 'explosion', 8); // Reduced particles for cleaner look
   
   // 🏆 SUBMIT SCORE TO LEADERBOARD
   submitScore(gameState.distance, gameState.distance, bossesDefeated);
   
   triggerHaptic('error');
   playSound('game_over');

   // 💥 EPIC GAME OVER SCREEN SHAKE!
   triggerScreenShake('extreme');

   // 🏁 CHECK FOR COURSE COMPLETION FIRST!
   if (currentCourse) {
     const courseDistance = Math.floor(gameState.distance);
     const targetReached = courseDistance >= currentCourse.targetDistance;
     const coinsEarned = collectedCoins;
     
     if (targetReached) {
       // 🎉 COURSE COMPLETED! Calculate stars and rewards
       const coinPercentage = (coinsEarned / currentCourse.coinTarget) * 100;
       let stars = 1; // Base completion star
       if (coinPercentage >= 70) stars = 2;
       if (coinPercentage >= 90) stars = 3;
       
       const completionData: CourseCompletion = {
         courseId: currentCourse.id,
         completed: true,
         distance: courseDistance,
         coinsCollected: coinsEarned,
         stars: stars,
         celebrationShown: false
       };
       
       setCompletionData(completionData);
       setShowCourseCompletion(true);
       
       // 🎊 EPIC COURSE COMPLETION EFFECTS!
       createParticles(200, 400, 'achievement', 30);
       triggerHaptic('success');
       playSound('power_up');
       
       // Don't show regular game over - show course completion instead
       return;
     }
   }

   // Game over modal entrance animation
   setTimeout(() => {
     Animated.parallel([
       Animated.timing(gameOverFadeAnim, {
         toValue: 1,
         duration: 800,
         useNativeDriver: false,
       }),
       Animated.spring(gameOverScaleAnim, {
         toValue: 1,
         tension: 50,
         friction: 8,
         useNativeDriver: false,
       }),
     ]).start();
   }, 300);
  }, [gameState.distance, gameState.highScore, saveHighScore, playSound, triggerScreenShake]);

     // 🚀 START GAME
   const startGame = useCallback(() => {
         // 👤 For first-time players, prompt for name BEFORE starting the game
     if (gamesPlayed === 0 && (!playerName || playerName === 'Anonymous Player')) {
       console.log('[GAME] 👤 First game detected - prompting for player name before starting');
       setShowNameInput(true);
       setTempPlayerName('');
       return; // Don't start the game yet - let the name input completion trigger the start
     }
    
    console.log('🎵 Playing start sound effect!');
    playSound('start');
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      distance: 0,
      speed: BASE_SPEED,
      skill: 0,
      flow: 0,
    }));
    
    // Reset player position
    playerY.setValue(SAFE_BOTTOM_POSITION);
    currentPlayerY.current = SAFE_BOTTOM_POSITION;
    setPlayerState(PlayerState.BOTTOM);
    
    // Reset game objects
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    setBosses([]);
    setBossWarningActive(false);
    setLastBossSpawn(0);

    // ⚡ RESET ALL POWER-UP EFFECTS!
    setActivePowerUps({
      timeFreeze: { active: false, endTime: 0 },
      doubleScore: { active: false, endTime: 0 },
      magnet: { active: false, endTime: 0 },
      ghostMode: { active: false, endTime: 0 },
      shield: { active: false, endTime: 0 },
    });

    // 🎓 RESET TUTORIAL STATS FOR NEW GAME
    setTutorialStats({
      tapsCount: 0,
      flipsCount: 0,
      powerUpsCollected: 0,
      maxDistance: 0,
      survivedTime: 0,
    });

    // 🌟 INITIALIZE EPIC PARALLAX BACKGROUND!
    generateBackgroundStars();
    generateBackgroundPlanets();
    
    // 🌈 START GAMEPLAY GLOW PULSE!
    pulsePlayerGlow();
    
    // 🔥 START EPIC PLAYER TRAIL!
    startPlayerTrail();
    
    // Trigger haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [playSound, generateBackgroundStars, generateBackgroundPlanets, gamesPlayed, playerName]);

  // ⭐ EPIC POWER-UP SPAWNING SYSTEM - 7 AMAZING ABILITIES!
  const spawnPowerUp = useCallback(() => {
    if (Math.random() < 0.18) { // 18% chance to spawn power-up (increased for more fun!)
      const powerUpTypes: PowerUp['type'][] = [
        'score', 'shield', 'slow_time', 
        'time_freeze', 'double_score', 'magnet', 'ghost_mode'
      ];
      
      // Weighted distribution - rare power-ups are less common
      const weights = [0.25, 0.2, 0.2, 0.1, 0.1, 0.1, 0.05]; // Total = 1.0
      let random = Math.random();
      let selectedType = powerUpTypes[0];
      
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedType = powerUpTypes[i];
          break;
        }
      }

      const newPowerUp: PowerUp = {
        id: `powerup_${Date.now()}`,
        x: SCREEN_WIDTH + 50,
        y: Math.random() * (SCREEN_HEIGHT - 200) + 100,
        type: selectedType,
        collected: false,
        duration: ['time_freeze', 'double_score', 'magnet', 'ghost_mode', 'shield'].includes(selectedType) 
                  ? (selectedType === 'time_freeze' ? 3000 : selectedType === 'ghost_mode' ? 4000 : 5000) 
                  : undefined,
      };
      
      console.log('⭐ Spawning power-up...', selectedType);
      setPowerUps(prev => [...prev, newPowerUp]);
    }
  }, []);

  // ⚡ EPIC POWER-UP EFFECT MANAGEMENT - GAME-CHANGING MAGIC!
  const activatePowerUp = useCallback((type: PowerUp['type'], duration?: number) => {
    const currentTime = Date.now();
    
    switch (type) {
      case 'time_freeze':
        console.log('❄️ TIME FREEZE ACTIVATED!');
        setActivePowerUps(prev => ({
          ...prev,
          timeFreeze: { active: true, endTime: currentTime + (duration || 3000) }
        }));
        // 🎨 Epic visual effects
        createParticles(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'special', 15);
        triggerScreenShake('heavy');
        break;
        
      case 'double_score':
        console.log('💰 DOUBLE SCORE ACTIVATED!');
        setActivePowerUps(prev => ({
          ...prev,
          doubleScore: { active: true, endTime: currentTime + (duration || 5000) }
        }));
        createParticles(50, currentPlayerY.current, 'achievement', 12);
        break;
        
      case 'magnet':
        console.log('🧲 MAGNET ACTIVATED!');
        setActivePowerUps(prev => ({
          ...prev,
          magnet: { active: true, endTime: currentTime + (duration || 5000) }
        }));
        createParticles(50, currentPlayerY.current, 'special', 10);
        break;
        
      case 'ghost_mode':
        console.log('👻 GHOST MODE ACTIVATED!');
        setActivePowerUps(prev => ({
          ...prev,
          ghostMode: { active: true, endTime: currentTime + (duration || 4000) }
        }));
        createParticles(50, currentPlayerY.current, 'special', 8);
        break;
        
      case 'shield':
        console.log('🛡️ SHIELD ACTIVATED!');
        setActivePowerUps(prev => ({
          ...prev,
          shield: { active: true, endTime: currentTime + (duration || 5000) }
        }));
        createParticles(50, currentPlayerY.current, 'special', 6);
        break;
        
      case 'score':
        console.log('💰 INSTANT SCORE BOOST!');
        setGameState(prev => ({ ...prev, distance: prev.distance + 100 }));
        createParticles(50, currentPlayerY.current, 'achievement', 8);
        break;
        
      case 'slow_time':
        console.log('⏰ SLOW TIME ACTIVATED!');
        setGameState(prev => ({ ...prev, speed: Math.max(1, prev.speed - 1) }));
        createParticles(50, currentPlayerY.current, 'special', 6);
        break;
    }
    
    // Universal effects for all power-ups
    triggerHaptic('success');
    playSound('power_up');
  }, [createParticles, triggerScreenShake, triggerHaptic, playSound]);

  // ⏰ POWER-UP TIMER MANAGEMENT
  const updatePowerUpTimers = useCallback(() => {
    const currentTime = Date.now();
    
    setActivePowerUps(prev => {
      const updated = { ...prev };
      let hasExpired = false;
      
      Object.keys(updated).forEach(key => {
        const powerUp = updated[key as keyof typeof updated];
        if (powerUp.active && currentTime >= powerUp.endTime) {
          updated[key as keyof typeof updated] = { active: false, endTime: 0 };
          hasExpired = true;
          console.log(`⏰ Power-up expired: ${key}`);
        }
      });
      
      return updated;
    });
  }, []);

  // 🧲 MAGNET EFFECT - ATTRACT NEARBY POWER-UPS!
  const applyMagnetEffect = useCallback(() => {
    if (!activePowerUps.magnet.active) return;
    
    setPowerUps(prev => prev.map(powerUp => {
      if (powerUp.collected) return powerUp;
      
      const playerX = 50;
      const playerY = currentPlayerY.current;
      const magnetRange = 150;
      
      const distance = Math.sqrt(
        Math.pow(powerUp.x - playerX, 2) + 
        Math.pow(powerUp.y - playerY, 2)
      );
      
      if (distance < magnetRange) {
        const magnetStrength = 0.3;
        const dx = (playerX - powerUp.x) * magnetStrength;
        const dy = (playerY - powerUp.y) * magnetStrength;
        
        return {
          ...powerUp,
          x: powerUp.x + dx,
          y: powerUp.y + dy,
        };
      }
      
      return powerUp;
    }));
  }, [activePowerUps.magnet.active]);

  // 🦹‍♂️ BOSS HELPER FUNCTIONS
  const getBossName = useCallback((type: BossType): string => {
    switch (type) {
      case BossType.GRAVITY_WELL: return 'Gravity Well';
      case BossType.SPEED_DEMON: return 'Speed Demon';
      case BossType.SIZE_SHIFTER: return 'Size Shifter';
      case BossType.ADAPTIVE_HUNTER: return 'Adaptive Hunter';
      case BossType.CHAOS_MASTER: return 'Chaos Master';
      default: return 'Unknown Boss';
    }
  }, []);

  const getBossEmoji = useCallback((type: BossType): string => {
    switch (type) {
      case BossType.GRAVITY_WELL: return '🌌';
      case BossType.SPEED_DEMON: return '⚡';
      case BossType.SIZE_SHIFTER: return '🔄';
      case BossType.ADAPTIVE_HUNTER: return '🤖';
      case BossType.CHAOS_MASTER: return '👹';
      default: return '👾';
    }
  }, []);

  // 🦹‍♂️ EPIC BOSS SPAWNING SYSTEM
  const createBoss = useCallback((type: BossType): Boss => {
    const bossConfigs = {
      [BossType.GRAVITY_WELL]: {
        width: 80,
        height: 80,
        health: 3,
        color: '#9C27B0',
        speed: 1,
        abilityPattern: [2000, 1500, 1000], // Ability intervals by phase
      },
      [BossType.SPEED_DEMON]: {
        width: 60,
        height: 60,
        health: 2,
        color: '#FF5722',
        speed: 3,
        abilityPattern: [1500, 1000],
      },
      [BossType.SIZE_SHIFTER]: {
        width: 70,
        height: 70,
        health: 4,
        color: '#4CAF50',
        speed: 1.5,
        abilityPattern: [3000, 2000, 1500, 1000],
      },
      [BossType.ADAPTIVE_HUNTER]: {
        width: 65,
        height: 65,
        health: 3,
        color: '#FF9800',
        speed: 2,
        abilityPattern: [2500, 2000, 1500],
      },
      [BossType.CHAOS_MASTER]: {
        width: 90,
        height: 90,
        health: 5,
        color: '#E91E63',
        speed: 1,
        abilityPattern: [3500, 3000, 2500, 2000, 1500],
      },
    };

    const config = bossConfigs[type];
    return {
      id: `boss_${type}_${Date.now()}`,
      x: SCREEN_WIDTH + 100,
      y: Math.random() * (SCREEN_HEIGHT - config.height - 200) + 100,
      width: config.width,
      height: config.height,
      type,
      health: config.health,
      maxHealth: config.health,
      phase: 0,
      lastAbilityTime: Date.now(),
      isWarning: false,
      warningTime: 0,
      color: config.color,
      speed: config.speed,
      direction: 1,
      abilityPattern: config.abilityPattern,
      defeated: false,
    };
  }, []);

  const spawnBoss = useCallback(() => {
    const distance = gameState.distance;
    const timeSinceLastBoss = distance - lastBossSpawn;
    
    // Spawn boss every 500m
    if (timeSinceLastBoss >= 500) {
             const bossTypes = Object.values(BossType);
       const randomType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
       
       console.log(`[SPAWN] 🚧 New obstacle: ${randomType} at distance ${distance}m`);
       console.log(`[BOSS] 🦹‍♂️ Boss spawned: ${getBossEmoji(randomType as BossType)} ${getBossName(randomType as BossType)}`);
       console.log(`[BOSS] 🚨 WARNING: ${getBossName(randomType as BossType).toUpperCase()} INCOMING!`);
      
             // Show boss warning
       setBossWarningActive(true);
       setTimeout(() => setBossWarningActive(false), 3000);
       
       // 💥 BOSS WARNING CAMERA SHAKE!
       triggerScreenShake('medium');
       
       // ⚠️ BOSS WARNING GLOW!
       updatePlayerGlow('#FF6B00', 1.8);
      
      // Create and add boss
      const newBoss = createBoss(randomType);
      setBosses(prev => [...prev, newBoss]);
      setLastBossSpawn(distance);
      
      // Spawn warning particles
             createParticles(SCREEN_WIDTH - 100, SCREEN_HEIGHT / 2, 'special', 20);
       playSound('achievement'); // Boss warning sound
     }
   }, [gameState.distance, lastBossSpawn, createBoss, createParticles, playSound]);

   // 🏆 LEADERBOARD SYSTEM FUNCTIONS
   const generateMockLeaderboard = useCallback((): LeaderboardEntry[] => {
     const mockNames = [
       'DragonSlayer99', 'GravityMaster', 'SpeedDemon42', 'BossHunter', 'FlipKing',
       'QuantumPlayer', 'NinjaFlips', 'OrbitMaster', 'ChaosRider', 'StarWarrior',
       'VelocityQueen', 'GravityWizard', 'FlightPro', 'BossTerminator', 'PhysicsMaster',
       'SpaceRanger', 'FlipLegend', 'CosmicPlayer', 'GalaxyExplorer', 'NebulaCrusher'
     ];
     
     const countries = ['🇺🇸', '🇬🇧', '🇯🇵', '🇩🇪', '🇫🇷', '🇨🇦', '🇦🇺', '🇧🇷', '🇰🇷', '🇨🇳'];
     const gameModes = Object.values(GameMode);
     
     return Array.from({ length: 50 }, (_, i) => ({
       id: `player_${i}`,
       playerName: mockNames[Math.floor(Math.random() * mockNames.length)],
       score: Math.floor(Math.random() * 5000) + 200,
       distance: Math.floor(Math.random() * 3000) + 100,
       bossesDefeated: Math.floor(Math.random() * 10),
       gameMode: gameModes[Math.floor(Math.random() * gameModes.length)],
       timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
       country: countries[Math.floor(Math.random() * countries.length)],
       rank: i + 1,
     })).sort((a, b) => b.score - a.score);
   }, []);

   const generateDailyChallenges = useCallback((): DailyChallenge[] => {
     const challenges = [
       {
         title: '🏃‍♂️ Marathon Runner',
         description: 'Travel 2000m in a single run',
         target: 2000,
         type: 'distance' as const,
         reward: '🏆 Epic Skin Unlock'
       },
       {
         title: '🦹‍♂️ Boss Hunter',
         description: 'Defeat 3 bosses in one game',
         target: 3,
         type: 'bosses' as const,
         reward: '💎 200 Gems'
       },
       {
         title: '🌪️ Flip Master',
         description: 'Perform 100 gravity flips',
         target: 100,
         type: 'flips' as const,
         reward: '⚡ Speed Boost Trail'
       },
       {
         title: '⏱️ Survival Expert',
         description: 'Survive for 180 seconds',
         target: 180,
         type: 'survival_time' as const,
         reward: '🎯 Precision Mode Unlock'
       },
       {
         title: '✨ Perfect Run',
         description: 'Complete a run without taking damage',
         target: 1,
         type: 'perfect_run' as const,
         reward: '👑 Golden Crown Avatar'
       }
     ];

     return challenges.slice(0, 3).map((challenge, i) => ({
       id: `daily_${Date.now()}_${i}`,
       ...challenge,
       progress: 0,
       completed: false,
       expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
     }));
   }, []);

   const submitScore = useCallback(async (finalScore: number, finalDistance: number, finalBossesDefeated: number) => {
     try {
       console.log(`[LEADERBOARD] 🏆 Submitting score: ${finalScore} points, ${finalDistance}m, ${finalBossesDefeated} bosses`);
       
       const newEntry: LeaderboardEntry = {
         id: `score_${Date.now()}`,
         playerName,
         score: finalScore,
         distance: finalDistance,
         bossesDefeated: finalBossesDefeated,
         gameMode: gameState.currentMode,
         timestamp: Date.now(),
         country: '🌍', // Default country
         rank: 1, // Will be calculated
       };

       // Add to leaderboard and sort
       let updatedLeaderboard: LeaderboardEntry[] = [];
       setLeaderboard(prev => {
         const updated = [...prev, newEntry].sort((a, b) => b.score - a.score);
         // Update ranks
         updatedLeaderboard = updated.map((entry, index) => ({ ...entry, rank: index + 1 }));
         return updatedLeaderboard;
       });

       // Update player stats
       let updatedPlayerStats: any = {};
       setPlayerStats(prev => {
         updatedPlayerStats = {
           ...prev,
           totalGames: prev.totalGames + 1,
           totalDistance: prev.totalDistance + finalDistance,
           bossesDefeated: prev.bossesDefeated + finalBossesDefeated,
           averageScore: Math.floor((prev.averageScore * prev.totalGames + finalScore) / (prev.totalGames + 1)),
         };
         return updatedPlayerStats;
       });

       // Save to storage
       await AsyncStorage.setItem('leaderboard', JSON.stringify(updatedLeaderboard));
       await AsyncStorage.setItem('playerStats', JSON.stringify(updatedPlayerStats));
       
       console.log(`[LEADERBOARD] ✅ Score submitted successfully!`);
       
       return true;
     } catch (error) {
       console.error('[LEADERBOARD] ❌ Failed to submit score:', error);
       return false;
     }
   }, [playerName, gameState.currentMode, leaderboard, playerStats]);

   // 🦹‍♂️ BOSS DAMAGE SYSTEM
   const damageBoss = useCallback((boss: Boss) => {
     const newHealth = boss.health - 1;
     
     if (newHealth <= 0) {
       // Boss defeated!
       console.log(`[BOSS] 🎉 Boss defeated: ${getBossEmoji(boss.type as BossType)} ${getBossName(boss.type as BossType)} (Survived ${((Date.now() - parseInt(boss.id.split('_')[2])) / 1000).toFixed(1)}s)`);
       
       // Epic defeat effects
       createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 'explosion', 12); // Reduced particles for cleaner look
       
       // 💥 EPIC BOSS DEFEAT CAMERA SHAKE!
       triggerScreenShake('heavy');
       
       // 🔥 BOSS DEFEAT GLOW EXPLOSION!
       updatePlayerGlow('#FF4444', 3.0);
       
       setBossesDefeated(prev => prev + 1);
       playSound('achievement');
       
       // Mark as defeated and remove after animation
       setBosses(prev => prev.map(b => 
         b.id === boss.id ? { ...b, defeated: true } : b
       ));
       
       setTimeout(() => {
         setBosses(prev => prev.filter(b => b.id !== boss.id));
       }, 1000);
       
       return true; // Boss defeated
     } else {
       // Damage boss and advance phase
       const newPhase = boss.maxHealth - newHealth;
       setBosses(prev => prev.map(b => 
         b.id === boss.id ? { 
           ...b, 
           health: newHealth, 
           phase: newPhase,
           // Boss gets angrier and faster when damaged
           speed: b.speed * 1.2,
           color: newHealth === 1 ? '#FF0000' : b.color
         } : b
       ));
       
       // Damage particle effects
       createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 'flip', 10);
       
       return false; // Boss still alive
     }
   }, [createParticles, playSound, getBossEmoji, getBossName]);

  // 🎮 GAME LOOP + SUPER DEBUG PERFORMANCE MONITORING
  useEffect(() => {
    if (!gameState.isPlaying) return;

    let frameCount = 0;
    let lastFpsUpdate = Date.now();
    let totalFrameTime = 0;
    let maxFrameTime = 0;
    let minFrameTime = Infinity;

    gameLoopRef.current = setInterval(() => {
      const frameStartTime = performance.now();
      const frameId = Math.random().toString(36).substr(2, 6);
      
      frameCount++;
      console.log(`[GAME LOOP] 🎮 Frame ${frameCount} (ID: ${frameId}) started`);
      console.log(`[GAME LOOP] 📊 Game state: speed=${gameState.speed.toFixed(1)}, distance=${gameState.distance.toFixed(1)}m, mode=${gameState.currentMode}`);
      console.log(`[GAME LOOP] 👤 Player: Y=${currentPlayerY.current.toFixed(1)}, state=${playerState}`);
      console.log(`[GAME LOOP] 🚧 Objects: ${obstacles.length} obstacles, ${powerUps.length} power-ups, ${bosses.length} bosses, ${marioCoins.length} mario-coins`);
      console.log(`[GAME LOOP] ⚡ Active power-ups: ${Object.entries(activePowerUps).filter(([_, p]) => p.active).map(([name]) => name).join(', ') || 'none'}`);
      
      try {
      // Update distance and speed with MODE-SPECIFIC MECHANICS
      setGameState(prev => {
        let speedMultiplier = 1;
        let skillGainMultiplier = 1;
        let distanceMultiplier = 1;
        
        // MODE-SPECIFIC GAMEPLAY MECHANICS
        switch (prev.currentMode) {
          case GameMode.TIME_ATTACK:
            speedMultiplier = 1.8; // 80% faster for speed power-ups!
            skillGainMultiplier = 2; // Double skill gain
            distanceMultiplier = 1.3; // 30% more distance per frame
            break;
          case GameMode.POWER_UP_RUSH:
            speedMultiplier = 1.2; // 20% faster
            distanceMultiplier = 1.1; // 10% more distance
            break;
          case GameMode.HARDCORE:
            speedMultiplier = 1.4; // 40% faster
            skillGainMultiplier = 1.5; // 50% more skill gain
            distanceMultiplier = 1.2; // 20% more distance
            break;
          case GameMode.ZEN:
            speedMultiplier = 0.6; // 40% slower
            skillGainMultiplier = 0.7; // 30% less skill gain
            distanceMultiplier = 0.8; // 20% less distance
            break;
          default: // CLASSIC
            speedMultiplier = 1;
            distanceMultiplier = 1;
            break;
        }
        
        // 💰 DOUBLE SCORE POWER-UP EFFECT!
        const scoreMultiplier = activePowerUps.doubleScore.active ? 2.0 : 1.0;
        
        const newDistance = prev.distance + (prev.speed * 0.1 * distanceMultiplier * scoreMultiplier);
        
        // 🎓 Tutorial tracking for distance and survival
        setTutorialStats(prevStats => ({
          ...prevStats,
          maxDistance: Math.max(prevStats.maxDistance, newDistance),
          survivedTime: prevStats.survivedTime + 0.016, // ~60fps
        }));

        return {
          ...prev,
          distance: newDistance,
          speed: (BASE_SPEED + (prev.distance * 0.002)) * speedMultiplier, // Faster acceleration!
          skill: Math.min(10, (prev.distance / 100) * skillGainMultiplier),
          flow: Math.min(100, (prev.distance / 10) % 100),
          maxSpeed: Math.max(prev.maxSpeed, prev.speed),
        };
      });

      // Move obstacles (affected by time freeze!)
      setObstacles(prev => 
        prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - (gameState.speed * timeMultiplier),
        })).filter(obstacle => obstacle.x > -100)
      );

      // 🪙 MOVE MARIO COINS (affected by time freeze!)
      setMarioCoins(prev => 
        prev.map(coin => ({
          ...coin,
          x: coin.x - (gameState.speed * timeMultiplier),
        })).filter(coin => coin.x > -100)
      );

      // 🌟 MOVE BACKGROUND ELEMENTS - PARALLAX MAGIC!
      setBackgroundStars(prev => 
        prev.map(star => ({
          ...star,
          x: star.x - (star.speed * gameState.speed * 0.3), // Parallax effect
        })).filter(star => star.x > -100)
      );

      setBackgroundPlanets(prev => 
        prev.map(planet => ({
          ...planet,
          x: planet.x - (planet.speed * gameState.speed * 0.1), // Slower parallax for planets
        })).filter(planet => planet.x > -200)
      );

      // Spawn new background elements
      if (Math.random() < 0.3) {
        spawnNewBackgroundElement();
      }

      // Move power-ups (affected by time freeze!)
      const timeMultiplier = activePowerUps.timeFreeze.active ? 0.2 : 1.0;
      setPowerUps(prev => 
        prev.map(powerUp => ({
          ...powerUp,
          x: powerUp.x - (gameState.speed * timeMultiplier),
        })).filter(powerUp => powerUp.x > -100)
      );

      // ⏰ Update power-up timers
      updatePowerUpTimers();
      
      // 🧲 Apply magnet effect
      applyMagnetEffect();

      // 🎓 Check tutorial progress
      checkTutorialProgress();

      // Move and update bosses
      setBosses(prev => 
        prev.map(boss => {
          if (boss.defeated) return boss;
          
          let newY = boss.y;
          let newDirection = boss.direction;
          
          // Boss AI movement patterns
          switch (boss.type) {
            case BossType.GRAVITY_WELL:
              // Slow vertical oscillation
              newY = boss.y + Math.sin(Date.now() / 1000) * boss.speed;
              break;
            case BossType.SPEED_DEMON:
              // Fast up-down movement
              if (boss.y <= 100 || boss.y >= SCREEN_HEIGHT - boss.height - 100) {
                newDirection = -boss.direction;
              }
              newY = boss.y + (boss.speed * 3 * newDirection);
              break;
            case BossType.SIZE_SHIFTER:
              // Smooth sine wave movement
              newY = (SCREEN_HEIGHT / 2) + Math.sin(Date.now() / 800) * 150;
              break;
            case BossType.ADAPTIVE_HUNTER:
              // Chase player Y position
              const playerTargetY = currentPlayerY.current;
              const diffY = playerTargetY - (boss.y + boss.height / 2);
              newY = boss.y + Math.sign(diffY) * Math.min(Math.abs(diffY), boss.speed * 2);
              break;
            case BossType.CHAOS_MASTER:
              // Random erratic movement
              newY = boss.y + (Math.random() - 0.5) * boss.speed * 4;
              break;
          }
          
          // Keep bosses within screen bounds
          newY = Math.max(100, Math.min(SCREEN_HEIGHT - boss.height - 100, newY));
          
          return {
            ...boss,
            x: boss.x - gameState.speed * 0.5, // Bosses move slower than obstacles
            y: newY,
            direction: newDirection,
          };
        }).filter(boss => boss.x > -boss.width - 50)
      );

      // Check collisions (with Epic Power-Up Protection!)
      const hitObstacle = checkCollision();
      
      // 🪙 CHECK MARIO COIN COLLISIONS
      checkCoinCollisions();
      
      if (hitObstacle) {
        // 👻 GHOST MODE - Phase through obstacles!
        if (activePowerUps.ghostMode.active) {
          console.log('👻 Ghost Mode: Phased through obstacle!');
          createParticles(50, currentPlayerY.current, 'special', 6);
        }
        // 🛡️ SHIELD - Block one hit!
        else if (activePowerUps.shield.active) {
          console.log('🛡️ Shield deflected obstacle!');
          setActivePowerUps(prev => ({
            ...prev,
            shield: { active: false, endTime: 0 }
          }));
          createParticles(50, currentPlayerY.current, 'explosion', 8);
          triggerScreenShake('medium');
        }
        // 💀 Game Over!
        else {
          gameOver();
        }
      }

      // Check boss collisions
      const hitBoss = checkBossCollision();
      if (hitBoss && !hitBoss.defeated) {
        const bossDefeated = damageBoss(hitBoss);
        if (!bossDefeated) {
          // Player survives hitting boss but takes damage
          triggerHaptic('heavy');
          // Knockback effect - could reduce speed temporarily
          setGameState(prev => ({ ...prev, speed: Math.max(1, prev.speed * 0.8) }));
        }
      }

      // Check power-up collisions
      const collectedPowerUp = checkPowerUpCollision();
      if (collectedPowerUp) {
        // ✨ EPIC POWER-UP COLLECTED PARTICLE BURST!
        createParticles(collectedPowerUp.x, collectedPowerUp.y, 'achievement', 8);
        
        // 💥 POWER-UP COLLECTION CAMERA SHAKE!
        triggerScreenShake('light');
        
        // ⚡ ACTIVATE THE EPIC POWER-UP!
        activatePowerUp(collectedPowerUp.type, collectedPowerUp.duration);
        
        // 🎓 Tutorial tracking for power-up collection
        setTutorialStats(prev => ({
          ...prev,
          powerUpsCollected: prev.powerUpsCollected + 1,
        }));
        
        // Remove collected power-up
        setPowerUps(prev => prev.filter(p => p.id !== collectedPowerUp.id));
      }

      // Spawn bosses at intervals
      spawnBoss();
      
      } catch (error) {
        console.error(`[GAME LOOP] ❌ Error in frame ${frameId}:`, error);
        console.error(`[GAME LOOP] ❌ Game state at error:`, {
          speed: gameState.speed,
          distance: gameState.distance,
          playerY: currentPlayerY.current,
          playerState,
          obstacleCount: obstacles.length,
          powerUpCount: powerUps.length
        });
      }
      
      // Performance monitoring
      const frameEndTime = performance.now();
      const frameTime = frameEndTime - frameStartTime;
      totalFrameTime += frameTime;
      maxFrameTime = Math.max(maxFrameTime, frameTime);
      minFrameTime = Math.min(minFrameTime, frameTime);
      
      console.log(`[GAME LOOP] ⏱️ Frame ${frameId} completed in ${frameTime.toFixed(2)}ms`);
      
      // Log performance stats every 60 frames (~1 second)
      if (frameCount % 60 === 0) {
        const now = Date.now();
        const elapsed = now - lastFpsUpdate;
        const avgFrameTime = totalFrameTime / 60;
        const fps = 1000 / avgFrameTime;
        
        console.log(`[PERFORMANCE] 📊 60-frame performance report:`);
        console.log(`[PERFORMANCE] 🎯 FPS: ${fps.toFixed(1)} (target: 62.5)`);
        console.log(`[PERFORMANCE] ⏱️ Avg frame time: ${avgFrameTime.toFixed(2)}ms`);
        console.log(`[PERFORMANCE] 📈 Max frame time: ${maxFrameTime.toFixed(2)}ms`);
        console.log(`[PERFORMANCE] 📉 Min frame time: ${minFrameTime.toFixed(2)}ms`);
        console.log(`[PERFORMANCE] 🚧 Objects in scene: ${obstacles.length + powerUps.length + bosses.length}`);
        
        if (avgFrameTime > 20) {
          console.warn(`[PERFORMANCE] ⚠️ HIGH FRAME TIME! Average ${avgFrameTime.toFixed(2)}ms (target: <16ms)`);
        }
        
        // Reset for next measurement period
        totalFrameTime = 0;
        maxFrameTime = 0;
        minFrameTime = Infinity;
        lastFpsUpdate = now;
      }
      
    }, 16); // ~60fps

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
      }, [gameState.isPlaying, activePowerUps, updatePowerUpTimers, applyMagnetEffect, activatePowerUp]);

  // 🚧 SEPARATE OBSTACLE SPAWNING LOOP (prevents interval conflicts)
  useEffect(() => {
    if (gameState.isGameOver) return;

    // Spawn obstacles and power-ups - MORE CHALLENGE! 💥
    obstacleSpawnRef.current = setInterval(() => {
      spawnObstacle();
      if (gameState.currentMode === GameMode.POWER_UP_RUSH || Math.random() < 0.4) {
        spawnPowerUp();
      }
      
      // 🪙 MARIO-STYLE COIN SPAWNING - ALL NEW AMAZING PATTERNS!
      console.log(`🪙 [SPAWN] Coin spawn check - Playing: ${gameState.isPlaying}, GameOver: ${gameState.isGameOver}, Coins: ${marioCoins.length}`);
      const patterns = ['line', 'arc', 'zigzag'] as const;
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      const spawnX = SCREEN_WIDTH + 50; // Closer spawn point
      const spawnY = Math.random() * (SCREEN_HEIGHT - 400) + 200; // Better safe spawn area
      console.log(`🪙 [SPAWN] ✨ Spawning ${randomPattern} pattern at X=${spawnX}, Y=${spawnY}`);
      spawnCoinPattern(randomPattern, spawnX, spawnY);
    }, 3000); // 🎯 BALANCED SPAWNING - every 3 seconds!

    return () => {
      if (obstacleSpawnRef.current) clearInterval(obstacleSpawnRef.current);
    };
  }, [gameState.isGameOver, gameState.currentMode]);

  // 🎪 PULSING ANIMATION FOR MAIN MENU
  useEffect(() => {
    if (!gameState.isPlaying && !gameState.isGameOver) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [gameState.isPlaying, gameState.isGameOver, pulseAnim]);

  // 💾 LOAD HIGH SCORE AND SETTINGS ON MOUNT
  useEffect(() => {
    loadHighScore();
    loadLanguage();
    loadLeaderboard();
  }, [loadHighScore, loadLanguage, loadLeaderboard]);

  // ⚙️ LOAD SETTINGS ON MOUNT
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings) as GameSettings;
          setSettings(parsedSettings);
          currentSettingsRef.current = parsedSettings; // Update ref
          setAudioEnabled(parsedSettings.audioEnabled);
          setCurrentLanguage(parsedSettings.language);
          console.log('⚙️ Settings loaded successfully!');
        }
        
        // 🎵 Initialize audio system after settings are loaded
        initializeAudio();
      } catch (error) {
        console.error('❌ Failed to load settings:', error);
      }
    };
    initializeSettings();
  }, [initializeAudio]);

  // 🎓 LOAD TUTORIAL PROGRESS ON MOUNT
  useEffect(() => {
    const initializeTutorial = async () => {
      try {
        const saved = await AsyncStorage.getItem(TUTORIAL_KEY);
        if (saved) {
          setTutorialCompleted(JSON.parse(saved));
          console.log('🎓 Tutorial progress loaded:', JSON.parse(saved));
        } else {
          // First time player - offer tutorial
          console.log('🎓 New player detected - tutorial available');
        }
      } catch (error) {
        console.error('❌ Failed to load tutorial progress:', error);
      }
    };
    initializeTutorial();
  }, []);

  // 👤 LOAD PLAYER NAME ON MOUNT & CHECK FIRST RUN
  useEffect(() => {
    const initializePlayerName = async () => {
      try {
        const savedName = await AsyncStorage.getItem(PLAYER_NAME_KEY);
        if (savedName) {
          setPlayerName(savedName);
          console.log('👤 Player name loaded:', savedName);
        } else {
          console.log('👤 No saved player name - showing welcome screen');
          setShowWelcomeScreen(true);
        }
      } catch (error) {
        console.error('❌ Failed to load player name:', error);
        setShowWelcomeScreen(true); // Show welcome screen on error too
      }
    };
    initializePlayerName();
  }, []);

  // 🎮 TOUCH HANDLER WITH TUTORIAL INTEGRATION + SUPER DEBUG
  const handleTouch = useCallback(() => {
    const touchTime = Date.now();
    console.log(`🎮 [TOUCH DEBUG] Touch detected at ${touchTime}ms`);
    console.log(`🎮 [TOUCH DEBUG] Game state: playing=${gameState.isPlaying}, gameOver=${gameState.isGameOver}`);
    console.log(`🎮 [TOUCH DEBUG] Player position: ${currentPlayerY.current}px`);
    
    // 🎓 Tutorial tracking
    setTutorialStats(prev => ({
      ...prev,
      tapsCount: prev.tapsCount + 1,
      flipsCount: gameState.isPlaying ? prev.flipsCount + 1 : prev.flipsCount,
    }));

    if (gameState.isPlaying) {
      console.log(`🎮 [TOUCH DEBUG] Calling flipPlayer() - current state: ${playerState}`);
      const flipStartTime = performance.now();
      flipPlayer();
      const flipEndTime = performance.now();
      console.log(`🎮 [TOUCH DEBUG] flipPlayer() took ${(flipEndTime - flipStartTime).toFixed(2)}ms`);
    } else if (gameState.isGameOver) {
      console.log(`🎮 [TOUCH DEBUG] Resetting from game over`);
      setGameState(prev => ({ ...prev, isGameOver: false }));
    } else {
      console.log(`🎮 [TOUCH DEBUG] Starting new game`);
      startGame();
    }
  }, [gameState.isPlaying, gameState.isGameOver, flipPlayer, startGame, playerState]);

  // 🌟 PARALLAX BACKGROUND STATE - EPIC VISUAL EFFECTS!
  interface BackgroundStar {
    id: string;
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
    color: string;
  }

  interface BackgroundPlanet {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    speed: number;
    type: 'planet' | 'moon' | 'asteroid';
  }

  const [backgroundStars, setBackgroundStars] = useState<BackgroundStar[]>([]);
  const [backgroundPlanets, setBackgroundPlanets] = useState<BackgroundPlanet[]>([]);

  // 🌈 DYNAMIC LIGHTING SYSTEM - EPIC GLOW EFFECTS!
  const playerGlow = useRef(new Animated.Value(1)).current;
  const [currentPlayerGlow, setCurrentPlayerGlow] = useState('#FFD60A');

  // 🔥 PARTICLE TRAIL SYSTEM - EPIC MOVEMENT TRAILS!
  interface TrailParticle {
    id: string;
    x: number;
    y: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    opacity: number;
  }

  const [playerTrail, setPlayerTrail] = useState<TrailParticle[]>([]);
  const trailSpawnTimer = useRef<NodeJS.Timeout | null>(null);

  // 🌈 DYNAMIC LIGHTING EFFECTS - REACTIVE GLOW SYSTEM!
  const updatePlayerGlow = useCallback((color: string, intensity: number = 1) => {
    setCurrentPlayerGlow(color);
    Animated.sequence([
      Animated.timing(playerGlow, {
        toValue: intensity * 1.5,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(playerGlow, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [playerGlow]);

  const pulsePlayerGlow = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(playerGlow, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(playerGlow, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [playerGlow]);



  // 🔥 TRAIL PARTICLE SYSTEM - EPIC MOVEMENT EFFECTS!
  const spawnTrailParticle = useCallback(() => {
    const newTrail: TrailParticle = {
      id: `trail_${Date.now()}_${Math.random()}`,
      x: 50, // Player X position
      y: currentPlayerY.current,
      life: 0,
      maxLife: 30 + Math.random() * 20, // 30-50 frames
      size: 8 + Math.random() * 6,
      color: currentPlayerGlow,
      opacity: 0.7 + Math.random() * 0.3,
    };
    
    setPlayerTrail(prev => [...prev, newTrail]);
  }, [currentPlayerGlow]);

  const updateTrailParticles = useCallback(() => {
    setPlayerTrail(prev => 
      prev.map(trail => ({
        ...trail,
        life: trail.life + 1,
        x: trail.x - 3, // Move particles backwards
        opacity: Math.max(0, trail.opacity * (1 - trail.life / trail.maxLife)),
        size: trail.size * (1 - trail.life / (trail.maxLife * 2)),
      })).filter(trail => trail.life < trail.maxLife && trail.opacity > 0.1)
    );
  }, []);

  const startPlayerTrail = useCallback(() => {
    if (trailSpawnTimer.current) return;
    
    trailSpawnTimer.current = setInterval(() => {
      spawnTrailParticle();
      updateTrailParticles();
    }, 50); // Spawn every 50ms for smooth trail
  }, [spawnTrailParticle, updateTrailParticles]);

  const stopPlayerTrail = useCallback(() => {
    if (trailSpawnTimer.current) {
      clearInterval(trailSpawnTimer.current);
      trailSpawnTimer.current = null;
    }
    setPlayerTrail([]);
  }, []);

  // 🎊 PARTICLE EFFECTS SYSTEM
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `particle_${Date.now()}_${i}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: 4 + Math.random() * 6,
        color,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        type: 'special',
        opacity: 0.8 + Math.random() * 0.2,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // ⚙️ COMPREHENSIVE SETTINGS SYSTEM - EPIC CUSTOMIZATION!
  interface GameSettings {
    // Audio Settings
    masterVolume: number;
    soundEffectsVolume: number;
    musicVolume: number;
    audioEnabled: boolean;
    
    // Graphics Settings
    particleQuality: 'low' | 'medium' | 'high' | 'ultra';
    backgroundEffects: boolean;
    screenShake: boolean;
    
    // Control Settings
    hapticFeedback: boolean;
    touchSensitivity: number;
    
    // Game Settings
    showDebugInfo: boolean;
    autoSaveProgress: boolean;
    confirmGameExit: boolean;
    
    // Display Settings
    language: Language;
    theme: 'dark' | 'light' | 'auto';
  }

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.8,
    soundEffectsVolume: 0.7,
    musicVolume: 0.6,
    audioEnabled: true,
    particleQuality: 'high',
    backgroundEffects: true,
    screenShake: true,
    hapticFeedback: true,
    touchSensitivity: 1.0,
    showDebugInfo: false,
    autoSaveProgress: true,
    confirmGameExit: false,
    language: Language.ENGLISH,
    theme: 'dark',
  });

  // ⚙️ SETTINGS MANAGEMENT SYSTEM - EPIC CUSTOMIZATION CONTROL!
  const saveSettings = useCallback(async (newSettings: GameSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      currentSettingsRef.current = newSettings; // Update ref
      console.log('⚙️ Settings saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as GameSettings;
        setSettings(parsedSettings);
        setAudioEnabled(parsedSettings.audioEnabled);
        setCurrentLanguage(parsedSettings.language);
        console.log('⚙️ Settings loaded successfully!');
      }
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    currentSettingsRef.current = newSettings; // Update ref
    
    // Apply immediate effects for certain settings
    if (key === 'audioEnabled') {
      setAudioEnabled(value as boolean);
    }
    if (key === 'language') {
      setCurrentLanguage(value as Language);
    }
  }, [settings, saveSettings]);

  const resetSettings = useCallback(() => {
    const defaultSettings: GameSettings = {
      masterVolume: 0.8,
      soundEffectsVolume: 0.7,
      musicVolume: 0.6,
      audioEnabled: true,
      particleQuality: 'high',
      backgroundEffects: true,
      screenShake: true,
      hapticFeedback: true,
      touchSensitivity: 1.0,
      showDebugInfo: false,
      autoSaveProgress: true,
      confirmGameExit: false,
      language: Language.ENGLISH,
      theme: 'dark',
    };
    saveSettings(defaultSettings);
    currentSettingsRef.current = defaultSettings; // Update ref
  }, [saveSettings]);

  // 🧪 AUTOMATED TESTING FRAMEWORK - NINTENDO QUALITY ASSURANCE!
  const createTestSuite = useCallback((): TestSuite => {
    return {
      id: 'customization_test_suite',
      name: 'Customization System Test Suite',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      passRate: 0,
      tests: [
        {
          id: 'test_customization_modal_open',
          name: 'Customization Modal Opens',
          description: 'Test that customization modal opens when customize button is pressed',
          category: 'ui',
          status: 'pending',
          expectedResult: 'Customization modal should be visible',
          steps: [
            { action: 'press', target: 'customize_button' },
            { action: 'verify', target: 'customization_modal', expectedState: { visible: true } }
          ]
        },
        {
          id: 'test_tab_switching',
          name: 'Tab Switching Works',
          description: 'Test that tabs switch between Skins, Trails, Effects, Special',
          category: 'customization',
          status: 'pending',
          expectedResult: 'Active tab should change when tab is pressed',
          steps: [
            { action: 'press', target: 'trails_tab' },
            { action: 'verify', target: 'active_tab', expectedState: 'trails' },
            { action: 'press', target: 'effects_tab' },
            { action: 'verify', target: 'active_tab', expectedState: 'effects' }
          ]
        },
        {
          id: 'test_orb_selection',
          name: 'Orb Selection Works',
          description: 'Test that orbs can be selected and preview updates',
          category: 'customization',
          status: 'pending',
          expectedResult: 'Selected orb should be highlighted and preview should update',
          steps: [
            { action: 'press', target: 'legendary_orb' },
            { action: 'verify', target: 'selected_orb', expectedState: 'legendary' },
            { action: 'verify', target: 'preview_orb', expectedState: 'legendary' }
          ]
        },
        {
          id: 'test_customization_persistence',
          name: 'Customization Saves',
          description: 'Test that customization choices persist after modal close',
          category: 'integration',
          status: 'pending',
          expectedResult: 'Selected customization should persist after closing modal',
          steps: [
            { action: 'press', target: 'legendary_orb' },
            { action: 'press', target: 'close_button' },
            { action: 'press', target: 'customize_button' },
            { action: 'verify', target: 'selected_orb', expectedState: 'legendary' }
          ]
        },
        {
          id: 'test_game_integration',
          name: 'Game Uses Selected Skin',
          description: 'Test that game player uses the selected skin during gameplay',
          category: 'integration',
          status: 'pending',
          expectedResult: 'Game player should use selected skin color/appearance',
          steps: [
            { action: 'press', target: 'legendary_orb' },
            { action: 'press', target: 'close_button' },
            { action: 'press', target: 'start_game' },
            { action: 'verify', target: 'player_appearance', expectedState: 'legendary' }
          ]
        }
      ]
    };
  }, []);

  const runAutomatedTests = useCallback(async () => {
    console.log('🧪 [NINTENDO QA] Starting automated test suite!');
    setIsRunningTests(true);
    const suite = createTestSuite();
    suite.totalTests = suite.tests.length;
    
    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      console.log(`🧪 [TEST ${i + 1}/${suite.tests.length}] Running: ${test.name}`);
      test.status = 'running';
      test.timestamp = Date.now();
      
      try {
        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For now, we'll simulate test results based on current functionality
        if (test.id === 'test_customization_modal_open') {
          test.actualResult = showCustomization ? 'Modal is visible' : 'Modal failed to open';
          test.status = showCustomization ? 'passed' : 'failed';
        } else if (test.id === 'test_tab_switching') {
          // This will fail because tabs aren't implemented yet
          test.actualResult = 'Tab switching not implemented';
          test.status = 'failed';
        } else if (test.id === 'test_orb_selection') {
          // This will fail because orb selection isn't implemented yet
          test.actualResult = 'Orb selection not implemented';
          test.status = 'failed';
        } else {
          test.actualResult = 'Feature not implemented';
          test.status = 'failed';
        }
        
        if (test.status === 'passed') {
          suite.passedTests++;
          console.log(`✅ [TEST PASSED] ${test.name}`);
        } else {
          suite.failedTests++;
          console.log(`❌ [TEST FAILED] ${test.name}: ${test.actualResult}`);
        }
        
      } catch (error) {
        test.status = 'failed';
        test.actualResult = `Test error: ${error}`;
        suite.failedTests++;
        console.log(`❌ [TEST ERROR] ${test.name}: ${error}`);
      }
    }
    
    suite.passRate = Math.round((suite.passedTests / suite.totalTests) * 100);
    setTestSuite(suite);
    setIsRunningTests(false);
    setShowTestResults(true);
    
    console.log(`🧪 [NINTENDO QA] Test suite complete! Pass rate: ${suite.passRate}%`);
    console.log(`🧪 [NINTENDO QA] ${suite.passedTests} passed, ${suite.failedTests} failed`);
  }, [createTestSuite, showCustomization]);

  // 🎮 CUSTOMIZATION LOGIC - NINTENDO STYLE FUNCTIONALITY!
  const handleTabSwitch = useCallback((tab: CustomizationTab) => {
    console.log(`🎮 [CUSTOMIZATION] Switching to tab: ${tab}`);
    setActiveCustomizationTab(tab);
    createParticles(SCREEN_WIDTH / 2, 200, 'achievement', 5);
    triggerHaptic('light');
  }, [createParticles, triggerHaptic]);

  const handleOrbSelection = useCallback((orbId: string) => {
    console.log(`🎮 [CUSTOMIZATION] Selecting orb: ${orbId}`);
    setSelectedSkinId(orbId);
    createParticles(SCREEN_WIDTH / 2, 300, 'achievement', 8);
    triggerHaptic('medium');
    playSound('power_up');
  }, [createParticles, triggerHaptic, playSound]);

  // 🎯 EPIC ORB UNLOCK SYSTEM - NINTENDO-LEVEL PROGRESSION!
  const checkOrbUnlocks = useCallback(() => {
    console.log('🎮 [ORB UNLOCK] Checking unlock conditions...');
    
    const currentStats = {
      gamesPlayed: gamesPlayed,
      bestDistance: gameState.highScore || 0,
      currentDistance: gameState.distance,
    };

    const newUnlocks: string[] = [];
    
    EPIC_ORB_COLLECTION.forEach(orb => {
      if (!unlockedOrbs.includes(orb.id) && !orb.unlocked) {
        let shouldUnlock = false;
        
        switch (orb.unlockCondition.type) {
          case 'default':
            shouldUnlock = true;
            break;
          case 'games':
            shouldUnlock = currentStats.gamesPlayed >= (orb.unlockCondition.requirement || 0);
            break;
          case 'distance':
            shouldUnlock = Math.max(currentStats.bestDistance, currentStats.currentDistance) >= (orb.unlockCondition.requirement || 0);
            break;
          case 'achievement':
            shouldUnlock = false; // Placeholder for achievement system
            break;
        }
        
        if (shouldUnlock) {
          newUnlocks.push(orb.id);
          console.log(`🎉 [ORB UNLOCK] New orb unlocked: ${orb.name}!`);
        }
      }
    });

    if (newUnlocks.length > 0) {
      setUnlockedOrbs(prev => [...prev, ...newUnlocks]);
      setAvailableOrbs(prev => prev.map(orb => ({
        ...orb,
        unlocked: unlockedOrbs.includes(orb.id) || newUnlocks.includes(orb.id),
        isNew: newUnlocks.includes(orb.id)
      })));
      
      // Show unlock notification with particles
      newUnlocks.forEach(orbId => {
        const orb = EPIC_ORB_COLLECTION.find(o => o.id === orbId);
        if (orb) {
          createParticles(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'achievement', 20);
        }
      });
    }
  }, [gamesPlayed, gameState.distance, gameState.highScore, unlockedOrbs, createParticles]);

  // Check for unlocks when relevant stats change
  useEffect(() => {
    checkOrbUnlocks();
  }, [gamesPlayed, gameState.distance, checkOrbUnlocks]);

  // 🎨 HELPER FUNCTION FOR RARITY COLORS
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      case 'mythic': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // 🏁 MARIO RUN INSPIRED HELPER FUNCTIONS!
  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'sky': return '#87CEEB';
      case 'underground': return '#8B4513';
      case 'castle': return '#696969';
      case 'space': return '#483D8B';
      case 'special': return '#FFD700';
      default: return '#87CEEB';
    }
  };

  const getEnvironmentEmoji = (environment: string) => {
    switch (environment) {
      case 'sky': return '☁️';
      case 'underground': return '🌍';
      case 'castle': return '🏰';
      case 'space': return '🌌';
      case 'special': return '⭐';
      default: return '☁️';
    }
  };

  // 🏁 SUPER MARIO RUN INSPIRED COURSE SYSTEM LOGIC!
  const generateCourseCoins = useCallback((course: Course) => {
    const coins: Coin[] = [];
    const coinSpacing = (course.targetDistance * 10) / course.coinTarget; // Spread coins across course
    
    for (let i = 0; i < course.coinTarget; i++) {
      const x = (i * coinSpacing) + Math.random() * 100; // Add some randomness
      const y = Math.random() > 0.5 ? 200 : 600; // Top or bottom half
      const isSpecial = Math.random() < 0.1; // 10% chance for special coins
      
      coins.push({
        id: `coin_${course.id}_${i}`,
        x,
        y,
        type: isSpecial ? 'special' : 'normal',
        value: isSpecial ? 5 : 1,
        collected: false,
        sparkleEffect: isSpecial
      });
    }
    
    return coins;
  }, []);

  const startCourse = useCallback((course: Course) => {
    console.log(`🏁 [COURSE] Starting course ${course.id}: ${course.name}`);
    setCurrentCourse(course);
    const coins = generateCourseCoins(course);
    setCourseCoins(coins);
    setCollectedCoins(0);
    setGameState(prev => ({ ...prev, distance: 0 }));
    
    // Update course attempts
    setCourses(prev => prev.map(c => 
      c.id === course.id ? { ...c, attempts: c.attempts + 1 } : c
    ));
    
    // Start the actual game
    startGame();
    setShowCourseSelection(false);
  }, [generateCourseCoins, startGame]);

  const checkCourseCompletion = useCallback(() => {
    if (!currentCourse) return;
    
    const distance = gameState.distance;
    const targetReached = distance >= currentCourse.targetDistance;
    
    if (targetReached && !currentCourse.completed) {
      console.log(`🏁 [COURSE] Course ${currentCourse.id} completed!`);
      
      // Calculate stars based on performance
      let stars = 1; // Base completion
      if (collectedCoins >= currentCourse.coinTarget * 0.8) stars = 2; // 80% coins
      if (collectedCoins >= currentCourse.coinTarget) stars = 3; // All coins
      
      const completion: CourseCompletion = {
        courseId: currentCourse.id,
        completed: true,
        distance,
        coinsCollected: collectedCoins,
        stars,
        celebrationShown: false
      };
      
      setCompletionData(completion);
      setShowCourseCompletion(true);
      
      // Update course data
      setCourses(prev => prev.map(c => {
        if (c.id === currentCourse.id) {
          return {
            ...c,
            completed: true,
            bestDistance: Math.max(c.bestDistance, distance),
            coinsCollected: Math.max(c.coinsCollected, collectedCoins),
            stars: Math.max(c.stars, stars)
          };
        }
        // Unlock next course
        if (c.id === currentCourse.id + 1) {
          return { ...c, unlocked: true };
        }
        return c;
      }));
      
      // Epic celebration effects!
      createParticles(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'achievement', 50);
      triggerHaptic('heavy');
      playSound('power_up');
    }
  }, [currentCourse, gameState.distance, collectedCoins, createParticles, triggerHaptic, playSound]);

  const collectCoin = useCallback((coinId: string) => {
    const coin = courseCoins.find(c => c.id === coinId);
    if (!coin || coin.collected) return;
    
    console.log(`🪙 [COIN] Collected ${coin.type} coin worth ${coin.value} points!`);
    
    setCourseCoins(prev => prev.map(c => 
      c.id === coinId ? { ...c, collected: true } : c
    ));
    
    setCollectedCoins(prev => prev + coin.value);
    
    // Visual feedback
    createParticles(coin.x, coin.y, 'achievement', coin.value * 2);
    triggerHaptic('light');
    playSound('power_up');
  }, [courseCoins, createParticles, triggerHaptic, playSound]);

  // Check course completion when distance changes
  useEffect(() => {
    if (gameState.isPlaying && currentCourse) {
      checkCourseCompletion();
    }
  }, [gameState.distance, gameState.isPlaying, currentCourse, checkCourseCompletion]);

  // 🎓 EPIC TUTORIAL STEPS DEFINITION - PROGRESSIVE LEARNING!
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: '🚀 Welcome to Gravity Game!',
      description: 'Master the art of gravity flipping in this epic space adventure!',
      instruction: 'Tap anywhere to begin your journey',
      target: 'tap',
      targetValue: 1,
      completed: false,
      skippable: false,
    },
    {
      id: 'basic_flip',
      title: '🔄 Learn to Flip',
      description: 'Tap the screen to flip gravity and navigate safely',
      instruction: 'Tap 3 times to practice flipping gravity',
      target: 'flip',
      targetValue: 3,
      completed: false,
      skippable: false,
    },
    {
      id: 'avoid_obstacles',
      title: '🚧 Dodge Obstacles',
      description: 'Red obstacles are dangerous! Flip gravity to avoid them',
      instruction: 'Survive for 10 seconds without hitting obstacles',
      target: 'survive',
      targetValue: 10,
      completed: false,
      skippable: true,
    },
    {
      id: 'collect_powerups',
      title: '⭐ Collect Power-ups',
      description: 'Golden power-ups give you amazing abilities!',
      instruction: 'Collect 2 power-ups to see their magic',
      target: 'collect',
      targetValue: 2,
      completed: false,
      skippable: true,
    },
    {
      id: 'reach_distance',
      title: '🏃‍♂️ Go the Distance',
      description: 'The further you travel, the higher your score!',
      instruction: 'Reach 100 meters to prove your skills',
      target: 'distance',
      targetValue: 100,
      completed: false,
      skippable: true,
    },
    {
      id: 'graduation',
      title: '🎓 Tutorial Complete!',
      description: 'You\'re ready for the full gravity adventure!',
      instruction: 'Tap to start your epic journey',
      completed: false,
      skippable: false,
    }
  ];



  // 🎓 TUTORIAL MANAGEMENT FUNCTIONS
  const loadTutorialProgress = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(TUTORIAL_KEY);
      if (saved) {
        setTutorialCompleted(JSON.parse(saved));
        console.log('🎓 Tutorial progress loaded:', JSON.parse(saved));
      }
    } catch (error) {
      console.error('❌ Failed to load tutorial progress:', error);
    }
  }, []);

  const saveTutorialProgress = useCallback(async (completed: boolean) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, JSON.stringify(completed));
      setTutorialCompleted(completed);
      console.log('🎓 Tutorial progress saved:', completed);
    } catch (error) {
      console.error('❌ Failed to save tutorial progress:', error);
    }
  }, []);

  const startTutorial = useCallback(() => {
    console.log('🎓 Starting epic tutorial!');
    setTutorialState({
      isActive: true,
      currentStep: 0,
      totalSteps: tutorialSteps.length,
      showOverlay: true,
      highlightTarget: 'ui',
    });
    setTutorialStats({
      tapsCount: 0,
      flipsCount: 0,
      powerUpsCollected: 0,
      maxDistance: 0,
      survivedTime: 0,
    });
  }, []);

  const nextTutorialStep = useCallback(() => {
    setTutorialState(prev => {
      const nextStep = prev.currentStep + 1;
      if (nextStep >= prev.totalSteps) {
        // Tutorial completed!
        saveTutorialProgress(true);
        return {
          ...prev,
          isActive: false,
          showOverlay: false,
          highlightTarget: undefined,
        };
      }
      
      const step = tutorialSteps[nextStep];
      console.log('🎓 Moving to tutorial step:', step.title);
      
      return {
        ...prev,
        currentStep: nextStep,
        highlightTarget: step.target === 'flip' ? 'player' : 
                        step.target === 'collect' ? 'powerup' :
                        step.target === 'survive' ? 'obstacle' : 'ui',
      };
    });
  }, [saveTutorialProgress]);

  const completeTutorialStep = useCallback((stepId: string) => {
    const currentStep = tutorialSteps[tutorialState.currentStep];
    if (currentStep && currentStep.id === stepId) {
      console.log('✅ Tutorial step completed:', stepId);
      createParticles(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'achievement', 10);
      triggerScreenShake('light');
      setTimeout(() => nextTutorialStep(), 1000);
    }
  }, [tutorialState.currentStep, nextTutorialStep, createParticles, triggerScreenShake]);

  const checkTutorialProgress = useCallback(() => {
    if (!tutorialState.isActive) return;
    
    const currentStep = tutorialSteps[tutorialState.currentStep];
    if (!currentStep || currentStep.completed) return;

    switch (currentStep.target) {
      case 'tap':
        if (tutorialStats.tapsCount >= (currentStep.targetValue || 1)) {
          completeTutorialStep(currentStep.id);
        }
        break;
      case 'flip':
        if (tutorialStats.flipsCount >= (currentStep.targetValue || 1)) {
          completeTutorialStep(currentStep.id);
        }
        break;
      case 'collect':
        if (tutorialStats.powerUpsCollected >= (currentStep.targetValue || 1)) {
          completeTutorialStep(currentStep.id);
        }
        break;
      case 'survive':
        if (tutorialStats.survivedTime >= (currentStep.targetValue || 10)) {
          completeTutorialStep(currentStep.id);
        }
        break;
      case 'distance':
        if (tutorialStats.maxDistance >= (currentStep.targetValue || 100)) {
          completeTutorialStep(currentStep.id);
        }
        break;
    }
  }, [tutorialState, tutorialStats, completeTutorialStep]);





  // 🔍 SUPER DEBUG: Comprehensive game state dump
  const logGameStateDump = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`\n[DEBUG DUMP] 📊 COMPREHENSIVE GAME STATE @ ${timestamp}`);
    console.log(`[DEBUG DUMP] ===========================================`);
    
    // Game State
    console.log(`[DEBUG DUMP] 🎮 GAME STATE:`);
    console.log(`[DEBUG DUMP]   Playing: ${gameState.isPlaying}`);
    console.log(`[DEBUG DUMP]   Game Over: ${gameState.isGameOver}`);
    console.log(`[DEBUG DUMP]   Distance: ${gameState.distance.toFixed(1)}m`);
    console.log(`[DEBUG DUMP]   Speed: ${gameState.speed.toFixed(1)}`);
    console.log(`[DEBUG DUMP]   Mode: ${gameState.currentMode}`);
    console.log(`[DEBUG DUMP]   High Score: ${gameState.highScore}`);
    
    // Player State
    console.log(`[DEBUG DUMP] 👤 PLAYER STATE:`);
    console.log(`[DEBUG DUMP]   State: ${playerState}`);
    console.log(`[DEBUG DUMP]   Y Position: ${currentPlayerY.current.toFixed(1)}px`);
    console.log(`[DEBUG DUMP]   Total Flips: ${totalFlips}`);
    
    // Objects in Scene
    console.log(`[DEBUG DUMP] 🚧 SCENE OBJECTS:`);
    console.log(`[DEBUG DUMP]   Obstacles: ${obstacles.length}`);
    console.log(`[DEBUG DUMP]   Power-ups: ${powerUps.length}`);
    console.log(`[DEBUG DUMP]   Bosses: ${bosses.length}`);
    console.log(`[DEBUG DUMP]   Particles: ${particles.length}`);
    console.log(`[DEBUG DUMP]   Mario Coins: ${marioCoins.length}`);
    
    // Active Power-ups
    const activePowerUpsList = Object.entries(activePowerUps)
      .filter(([_, powerUp]) => powerUp.active)
      .map(([name, powerUp]) => `${name}(${((powerUp.endTime - Date.now()) / 1000).toFixed(1)}s)`);
    console.log(`[DEBUG DUMP] ⚡ ACTIVE POWER-UPS: ${activePowerUpsList.join(', ') || 'none'}`);
    
    // Settings
    console.log(`[DEBUG DUMP] ⚙️ SETTINGS:`);
    console.log(`[DEBUG DUMP]   Audio Enabled: ${audioEnabled}`);
    console.log(`[DEBUG DUMP]   Master Volume: ${settings.masterVolume}`);
    console.log(`[DEBUG DUMP]   Sound Effects: ${settings.soundEffectsVolume}`);
    console.log(`[DEBUG DUMP]   Screen Shake: ${settings.screenShake}`);
    console.log(`[DEBUG DUMP]   Haptic Feedback: ${settings.hapticFeedback}`);
    
    // Tutorial
    console.log(`[DEBUG DUMP] 🎓 TUTORIAL:`);
    console.log(`[DEBUG DUMP]   Completed: ${tutorialCompleted}`);
    console.log(`[DEBUG DUMP]   Active: ${tutorialState.isActive}`);
    console.log(`[DEBUG DUMP]   Current Step: ${tutorialState.currentStep}/${tutorialState.totalSteps}`);
    
    // Player Profile
    console.log(`[DEBUG DUMP] 👤 PROFILE:`);
    console.log(`[DEBUG DUMP]   Player Name: "${playerName}"`);
    console.log(`[DEBUG DUMP]   Games Played: ${gamesPlayed}`);
    
    console.log(`[DEBUG DUMP] ===========================================\n`);
  }, [
    gameState, playerState, totalFlips, obstacles.length, powerUps.length, 
    bosses.length, particles.length, activePowerUps, audioEnabled, settings,
    tutorialCompleted, tutorialState, playerName, gamesPlayed
  ]);

  // 🔍 SUPER DEBUG: Performance and error monitoring
  useEffect(() => {
    // Log initial state
    console.log(`[SUPER DEBUG] 🚀 Super Tester Mode ACTIVATED!`);
    logGameStateDump();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(() => {
      if (gameState.isPlaying) {
        console.log(`[HEALTH CHECK] 💗 Game health check - Frame: ${Date.now()}`);
        
        // Check for potential issues
        if (obstacles.length > 50) {
          console.warn(`[HEALTH CHECK] ⚠️ High obstacle count: ${obstacles.length}`);
        }
        if (particles.length > 100) {
          console.warn(`[HEALTH CHECK] ⚠️ High particle count: ${particles.length}`);
        }
        if (gameState.speed > 20) {
          console.warn(`[HEALTH CHECK] ⚠️ Very high speed: ${gameState.speed}`);
        }
      }
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, [gameState.isPlaying, obstacles.length, particles.length, gameState.speed, logGameStateDump]);

  // 👤 PLAYER NAME MANAGEMENT FUNCTIONS
  const loadPlayerName = useCallback(async () => {
    try {
      const savedName = await AsyncStorage.getItem(PLAYER_NAME_KEY);
      if (savedName) {
        setPlayerName(savedName);
        console.log('👤 Player name loaded:', savedName);
      } else {
        console.log('👤 No saved player name, using default');
      }
    } catch (error) {
      console.error('❌ Failed to load player name:', error);
    }
  }, []);

  const savePlayerName = useCallback(async (name: string) => {
    try {
      await AsyncStorage.setItem(PLAYER_NAME_KEY, name);
      setPlayerName(name);
      console.log('👤 Player name saved:', name);
    } catch (error) {
      console.error('❌ Failed to save player name:', error);
    }
  }, []);

  const promptPlayerName = useCallback(() => {
    setTempPlayerName(playerName || '');
    setShowNameInput(true);
  }, [playerName]);

  const handleWelcomeNameSubmit = useCallback((name: string) => {
    if (name.trim().length > 0) {
      savePlayerName(name.trim());
      setShowWelcomeScreen(false);
      console.log('🎉 Welcome screen completed for:', name.trim());
    }
  }, [savePlayerName]);

  const handleNameSubmit = useCallback((name: string) => {
    if (name.trim().length > 0) {
      savePlayerName(name.trim());
      setShowNameInput(false);
      
      // 🎮 If this is first game and game isn't playing, start the game automatically
      if (gamesPlayed === 0 && !gameState.isPlaying) {
        console.log('[GAME] 👤 Name submitted for first game - auto-starting game');
        setTimeout(() => {
          // Call startGame directly to bypass the name check
          console.log('🎵 Playing start sound effect!');
          playSound('start');
          
          setGameState(prev => ({
            ...prev,
            isPlaying: true,
            isGameOver: false,
            distance: 0,
            speed: BASE_SPEED,
            skill: 0,
            flow: 0,
          }));
          
          // Reset player position
          playerY.setValue(SAFE_BOTTOM_POSITION);
          currentPlayerY.current = SAFE_BOTTOM_POSITION;
          setPlayerState(PlayerState.BOTTOM);
          
          // Reset game objects
          setObstacles([]);
          setPowerUps([]);
          setParticles([]);
          setBosses([]);
          setBossWarningActive(false);
          setLastBossSpawn(0);

          // ⚡ RESET ALL POWER-UP EFFECTS!
          setActivePowerUps({
            timeFreeze: { active: false, endTime: 0 },
            doubleScore: { active: false, endTime: 0 },
            magnet: { active: false, endTime: 0 },
            ghostMode: { active: false, endTime: 0 },
            shield: { active: false, endTime: 0 },
          });

          // 🎓 RESET TUTORIAL STATS FOR NEW GAME
          setTutorialStats({
            tapsCount: 0,
            flipsCount: 0,
            powerUpsCollected: 0,
            maxDistance: 0,
            survivedTime: 0,
          });

          // 🌟 INITIALIZE EPIC PARALLAX BACKGROUND!
          generateBackgroundStars();
          generateBackgroundPlanets();
          
          // 🌈 START GAMEPLAY GLOW PULSE!
          pulsePlayerGlow();
          
          // 🔥 START EPIC PLAYER TRAIL!
          startPlayerTrail();
          
          // Trigger haptics
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 500); // Small delay for smooth transition
      }
    }
  }, [savePlayerName, gamesPlayed, gameState.isPlaying, playSound, generateBackgroundStars, generateBackgroundPlanets]);

  return (
    <TouchableWithoutFeedback 
      onPress={handleTouch}
      onPressIn={() => {
        const touchStartTime = performance.now();
        console.log(`[INPUT] 👆 Touch DOWN at ${touchStartTime}ms - Game playing: ${gameState.isPlaying}`);
      }}
      onPressOut={() => {
        const touchEndTime = performance.now();
        console.log(`[INPUT] 👆 Touch UP at ${touchEndTime}ms`);
      }}
    >
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* 🎉 WELCOME SCREEN - FIRST TIME USER */}
        {showWelcomeScreen && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeModal}>
              <Text style={styles.welcomeTitle}>🌟 Welcome to Gravity Flip! 🌟</Text>
              <Text style={styles.welcomeSubtitle}>
                An epic space adventure awaits you!
              </Text>
              
              <Text style={styles.namePrompt}>What should we call you, space explorer?</Text>
              
              <TextInput
                style={styles.welcomeNameInput}
                value={tempPlayerName}
                onChangeText={setTempPlayerName}
                placeholder="Enter your name..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={() => handleWelcomeNameSubmit(tempPlayerName)}
                autoFocus={true}
              />
              
              <TouchableOpacity 
                style={[
                  styles.welcomeButton,
                  tempPlayerName.trim().length === 0 && styles.welcomeButtonDisabled
                ]}
                onPress={() => handleWelcomeNameSubmit(tempPlayerName)}
                disabled={tempPlayerName.trim().length === 0}
              >
                <Text style={styles.welcomeButtonText}>
                  🚀 Start My Space Journey!
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.welcomeSkipButton}
                onPress={() => handleWelcomeNameSubmit('Space Explorer')}
              >
                <Text style={styles.welcomeSkipText}>Skip (use "Space Explorer")</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <Animated.View style={[styles.gameArea, { transform: [{ translateX: screenShake }] }]}>
          {/* 🌟 CLEAN MARIO RUN INSPIRED BACKGROUND! */}
          {/* Simple Stars Only - No Confusing Shapes */}
          {backgroundStars.slice(0, 30).map(star => ( // Limit to 30 simple stars
            <View
              key={star.id}
              style={[
                styles.cleanBackgroundStar,
                {
                  left: star.x,
                  top: star.y,
                  opacity: star.opacity * 0.3, // Much more subtle
                },
              ]}
            />
          ))}

          {/* 🎮 GAMEPLAY SCREEN */}
          {gameState.isPlaying && (
            <>
              {/* 🎮 ENHANCED MARIO RUN STYLE GAME UI */}
              <View style={styles.gameUI}>
                {/* 🏁 COURSE MODE UI */}
                {currentCourse && (
                  <>
                    {/* Course Header */}
                    <View style={styles.courseHeader}>
                      <View style={styles.courseNumberBadge}>
                        <Text style={styles.courseNumberText}>Course</Text>
                        <Text style={styles.courseBigNumber}>{currentCourse.id}</Text>
                      </View>
                      <View style={styles.courseInfoPanel}>
                        <Text style={styles.courseNameText}>{currentCourse.name}</Text>
                        <Text style={styles.courseTargetText}>Goal: {currentCourse.targetDistance}m</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBG}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${Math.min(100, (gameState.distance / currentCourse.targetDistance) * 100)}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {gameState.distance.toFixed(0)}m / {currentCourse.targetDistance}m
                      </Text>
                    </View>

                    {/* Coin Counter with Mario Run Style */}
                    <View style={styles.coinCounterPanel}>
                      <View style={styles.coinIcon}>
                        <Text style={styles.coinEmoji}>🪙</Text>
                      </View>
                      <Text style={styles.coinCountText}>
                        {collectedCoins || 0}
                      </Text>
                      <Text style={styles.coinTotalText}>
                        / {courseCoins || 0}
                      </Text>
                    </View>
                  </>
                )}

                {/* 🌟 SIMPLIFIED CLASSIC MODE UI - NINTENDO CLEAN! */}
                {!currentCourse && (
                  <>
                    {/* Distance - Left, Large, Bold */}
                    <Text style={styles.simplifiedDistanceText}>
                      {Math.floor(gameState.distance)}m
                    </Text>
                    
                    {/* XP Bar + Number - Center */}
                    <View style={styles.xpContainer}>
                      <View style={styles.xpBarBackground}>
                        <Animated.View 
                          style={[
                            styles.xpBarFill, 
                            { 
                              width: `${getCurrentLevelProgress().progress}%`,
                              transform: [{ scale: xpGainAnim }]
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.xpText}>
                        XP: {xp}
                      </Text>
                    </View>
                    
                    {/* Coin Counter + Level - Right Side */}
                    <View style={styles.rightHudContainer}>
                      <Animated.View style={[styles.coinCounter, { transform: [{ scale: coinCountAnim }] }]}>
                        <Text style={styles.coinIcon}>🪙</Text>
                        <Text style={styles.coinCountText}>{coinCount}</Text>
                      </Animated.View>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Lv.{level}</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* ⚡ ACTIVE POWER-UPS INDICATOR - EPIC STATUS! */}
                <View style={styles.powerUpIndicators}>
                  {activePowerUps.timeFreeze.active && (
                    <View style={[styles.powerUpIndicator, { backgroundColor: '#00FFFF' }]}>
                      <Text style={styles.powerUpIndicatorIcon}>❄️</Text>
                    </View>
                  )}
                  {activePowerUps.doubleScore.active && (
                    <View style={[styles.powerUpIndicator, { backgroundColor: '#FFD700' }]}>
                      <Text style={styles.powerUpIndicatorIcon}>💎</Text>
                    </View>
                  )}
                  {activePowerUps.magnet.active && (
                    <View style={[styles.powerUpIndicator, { backgroundColor: '#FF6B35' }]}>
                      <Text style={styles.powerUpIndicatorIcon}>🧲</Text>
                    </View>
                  )}
                  {activePowerUps.ghostMode.active && (
                    <View style={[styles.powerUpIndicator, { backgroundColor: '#9C27B0' }]}>
                      <Text style={styles.powerUpIndicatorIcon}>👻</Text>
                    </View>
                  )}
                  {activePowerUps.shield.active && (
                    <View style={[styles.powerUpIndicator, { backgroundColor: '#22C55E' }]}>
                      <Text style={styles.powerUpIndicatorIcon}>🛡️</Text>
                    </View>
                  )}
                </View>

                {/* Debug info moved to bottom-left for cleaner UI */}
              </View>

              {/* 🚨 BOSS WARNING SYSTEM */}
              {bossWarningActive && (
                <View style={styles.bossWarning}>
                  <Text style={styles.bossWarningText}>⚠️ BOSS INCOMING! ⚠️</Text>
                  <Text style={styles.bossWarningSubtext}>Prepare for battle!</Text>
                </View>
              )}

              {/* 📊 OPTIONAL DEBUG INFO - BOTTOM LEFT */}
              <View style={styles.debugInfoPanel}>
                <Text style={styles.debugText}>🚧 Obstacles: {obstacles.length} | ⭐ Power-ups: {powerUps.length}</Text>
                <Text style={styles.debugText}>🎯 Player Y: {Math.round(currentPlayerY.current)}</Text>
                <Text style={styles.debugText}>🎯 Skill: {gameState.skill.toFixed(1)}/10 | 🌀 Flow: {Math.floor(gameState.flow)}%</Text>
              </View>

              {/* 🔥 ENHANCED COMBO POPUP - Dynamic & Exciting! */}
              {comboPopupVisible && (
                <Animated.View style={[
                  styles.comboPopup,
                  {
                    transform: [
                      { scale: comboPopupAnim },
                      { translateY: comboPopupAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, -10] // More dramatic movement
                      })},
                      { rotate: comboPopupAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['-5deg', '2deg', '0deg'] // Slight wobble
                      })}
                    ],
                    opacity: comboPopupAnim,
                    // Dynamic background color based on combo level
                    backgroundColor: coinCombo >= 10 ? 'rgba(255, 0, 255, 0.9)' : 
                                   coinCombo >= 5 ? 'rgba(255, 165, 0, 0.9)' : 
                                   coinCombo >= 3 ? 'rgba(255, 215, 0, 0.9)' : 'rgba(50, 205, 50, 0.9)'
                  }
                ]}>
                  <Text style={[styles.comboText, {
                    fontSize: coinCombo >= 10 ? 32 : coinCombo >= 5 ? 28 : 24,
                    color: coinCombo >= 10 ? '#FFFFFF' : coinCombo >= 5 ? '#FFD700' : '#FFFFFF'
                  }]}>
                    {coinCombo >= 10 ? '🏆 LEGEND' : coinCombo >= 5 ? '🔥 MEGA' : coinCombo >= 3 ? '⚡ SUPER' : '🌟 NICE'} 
                    {' '}
                    {coinCombo >= 10 ? '10x' : coinCombo >= 5 ? '5x' : coinCombo >= 3 ? '3x' : '2x'} COMBO!
                  </Text>
                  <Text style={[styles.comboSubtext, {
                    color: coinCombo >= 10 ? '#FFD700' : '#FFFFFF'
                  }]}>
                    {coinCombo >= 10 ? '💎 UNSTOPPABLE! 💎' : 
                     coinCombo >= 5 ? '🔥 ON FIRE! 🔥' : 
                     coinCombo >= 3 ? '⚡ ELECTRIC! ⚡' : '🌟 KEEP GOING! 🌟'}
                  </Text>
                </Animated.View>
              )}

              {/* 🔥 Player Trail Particles */}
              {playerTrail.map(trail => (
                <View
                  key={trail.id}
                  style={[
                    styles.trailParticle,
                    {
                      left: trail.x - trail.size / 2,
                      top: trail.y - trail.size / 2,
                      width: trail.size,
                      height: trail.size,
                      backgroundColor: trail.color,
                      opacity: trail.opacity,
                    },
                  ]}
                />
              ))}

              {/* Player with Dynamic Glow */}
              <Animated.View
                style={[
                  styles.player,
                  {
                    left: 50 - PLAYER_SIZE / 2,
                    transform: [
                      { translateY: playerY },
                      { scale: playerScale },
                      { rotate: playerRotation.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }) },
                    ],
                    shadowColor: currentPlayerGlow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: playerGlow.interpolate({
                      inputRange: [0.8, 3],
                      outputRange: [0.5, 1],
                      extrapolate: 'clamp',
                    }),
                    shadowRadius: playerGlow.interpolate({
                      inputRange: [0.8, 3],
                      outputRange: [10, 30],
                      extrapolate: 'clamp',
                    }),
                    elevation: playerGlow.interpolate({
                      inputRange: [0.8, 3],
                      outputRange: [10, 30],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />

              {/* Obstacles */}
              {obstacles.map(obstacle => (
                <View
                  key={obstacle.id}
                  style={[
                    styles.obstacle,
                    {
                      left: obstacle.x,
                      top: obstacle.y,
                      width: obstacle.width,
                      height: obstacle.height,
                      backgroundColor: obstacle.color,
                    },
                  ]}
                />
              ))}

              {/* ⭐ POWER-UPS - The epic rewards! */}
              {powerUps.map(powerUp => {
                // ⚡ EPIC POWER-UP VISUAL SYSTEM!
                const getPowerUpColor = (type: PowerUp['type']) => {
                  switch (type) {
                    case 'score': return '#FFD60A';
                    case 'shield': return '#22C55E';
                    case 'slow_time': return '#8B5CF6';
                    case 'time_freeze': return '#00FFFF';
                    case 'double_score': return '#FFD700';
                    case 'magnet': return '#FF6B35';
                    case 'ghost_mode': return '#9C27B0';
                    default: return '#FFD60A';
                  }
                };

                const getPowerUpIcon = (type: PowerUp['type']) => {
                  switch (type) {
                    case 'score': return '💰';
                    case 'shield': return '🛡️';
                    case 'slow_time': return '⏰';
                    case 'time_freeze': return '❄️';
                    case 'double_score': return '💎';
                    case 'magnet': return '🧲';
                    case 'ghost_mode': return '👻';
                    default: return '💰';
                  }
                };

                return (
                  <View
                    key={powerUp.id}
                    style={[
                      styles.powerUp,
                      {
                        left: powerUp.x - POWERUP_SIZE / 2,
                        top: powerUp.y - POWERUP_SIZE / 2,
                        backgroundColor: getPowerUpColor(powerUp.type),
                        shadowColor: getPowerUpColor(powerUp.type),
                      },
                    ]}
                  >
                    <Text style={styles.powerUpIcon}>
                      {getPowerUpIcon(powerUp.type)}
                    </Text>
                  </View>
                );
              })}

              {/* 🦹‍♂️ EPIC BOSS BATTLES! */}
              {bosses.map(boss => (
                <View
                  key={boss.id}
                  style={[
                    styles.boss,
                    {
                      left: boss.x,
                      top: boss.y,
                      width: boss.width,
                      height: boss.height,
                      backgroundColor: boss.color,
                      opacity: boss.defeated ? 0.3 : 1,
                      borderColor: boss.health === 1 ? '#FF0000' : '#FFFFFF',
                      shadowColor: boss.color,
                      transform: [
                        { scale: boss.defeated ? 0.8 : 1 },
                        { rotate: boss.type === 'chaos_master' ? `${Date.now() / 50}deg` : '0deg' }
                      ],
                    },
                  ]}
                >
                  <Text style={styles.bossIcon}>
                    {getBossEmoji(boss.type as BossType)}
                  </Text>
                  
                  {/* Boss health indicator */}
                  <View style={styles.bossHealthBar}>
                    <View style={[
                      styles.bossHealthFill,
                      { 
                        width: `${(boss.health / boss.maxHealth) * 100}%`,
                        backgroundColor: boss.health === 1 ? '#FF0000' : '#22C55E'
                      }
                    ]} />
                  </View>
                  
                  {/* Boss phase indicator */}
                  <Text style={styles.bossPhase}>
                    {Array.from({ length: boss.maxHealth }, (_, i) => 
                      i < boss.health ? '❤️' : '💔'
                    ).join('')}
                  </Text>
                </View>
              ))}

              {/* 🪙 MARIO-STYLE COINS */}
              {marioCoins.map(coin => (
                <Animated.View
                  key={coin.id}
                  style={[
                    styles.marioCoin,
                    {
                      left: coin.x,
                      top: coin.y,
                      transform: [
                        { translateY: coin.bounce },
                        { scale: coin.sparkle },
                        { rotateY: `${Date.now() / 10}deg` } // Spinning effect
                      ],
                      opacity: coin.sparkle
                    }
                  ]}
                >
                  <Text style={[
                    styles.marioCoinIcon,
                    { 
                      color: coin.type === 'rainbow' ? '#FF69B4' : 
                             coin.type === 'gem' ? '#8A2BE2' :
                             coin.type === 'powerup' ? '#FF4500' :
                             coin.type === 'multiplier' ? '#32CD32' : '#FFD700',
                      textShadowColor: coin.type === 'rainbow' ? '#FF1493' : 
                                      coin.type === 'gem' ? '#4B0082' :
                                      coin.type === 'powerup' ? '#DC143C' :
                                      coin.type === 'multiplier' ? '#228B22' : '#B8860B'
                    }
                  ]}>
                    {coin.type === 'rainbow' ? '🌈' : 
                     coin.type === 'gem' ? '💎' :
                     coin.type === 'powerup' ? '⚡' :
                     coin.type === 'multiplier' ? '💰' : '🪙'}
                  </Text>
                  
                  {/* ✨ ENHANCED SPECIAL EFFECTS for all coin types! */}
                  {coin.type === 'rainbow' && (
                    <View style={styles.rainbowSparkles}>
                      <Text style={[styles.sparkle, { top: -5, left: -8 }]}>✨</Text>
                      <Text style={[styles.sparkle, { top: -3, right: -8 }]}>💫</Text>
                      <Text style={[styles.sparkle, { bottom: -5, left: 5 }]}>⭐</Text>
                      <Text style={[styles.sparkle, { top: 8, right: 3 }]}>🌟</Text>
                    </View>
                  )}
                  
                  {coin.type === 'gem' && (
                    <View style={styles.gemSparkles}>
                      <Text style={[styles.sparkle, { top: -2, left: -5, color: '#BA55D3' }]}>💎</Text>
                      <Text style={[styles.sparkle, { bottom: -2, right: -5, color: '#9370DB' }]}>✨</Text>
                    </View>
                  )}
                  
                  {coin.type === 'powerup' && (
                    <View style={styles.powerupGlow}>
                      <Text style={[styles.sparkle, { top: -3, left: -6, color: '#FFA500' }]}>⚡</Text>
                      <Text style={[styles.sparkle, { bottom: -3, right: -6, color: '#FF6347' }]}>💥</Text>
                    </View>
                  )}
                  
                  {coin.type === 'multiplier' && (
                    <View style={styles.multiplierAura}>
                      <Text style={[styles.sparkle, { top: -4, left: -7, color: '#90EE90' }]}>💲</Text>
                      <Text style={[styles.sparkle, { bottom: -4, right: -7, color: '#ADFF2F' }]}>✨</Text>
                      <Text style={[styles.sparkle, { top: 2, right: -2, color: '#32CD32', fontSize: 8 }]}>2x</Text>
                    </View>
                  )}
                </Animated.View>
              ))}

              {/* ✨ SPECTACULAR PARTICLE EFFECTS */}
              {/* Trail Particles */}
              {trailParticles.map(trail => (
                <View
                  key={trail.id}
                  style={[
                    styles.particle,
                    {
                      left: trail.x - trail.size / 2,
                      top: trail.y - trail.size / 2,
                      width: trail.size,
                      height: trail.size,
                      backgroundColor: trail.color,
                      opacity: trail.opacity,
                      borderRadius: trail.size / 2,
                    },
                  ]}
                />
              ))}

              {/* Regular Particles */}
              {particles.map(particle => (
                <View
                  key={particle.id}
                  style={[
                    styles.particle,
                    {
                      left: particle.x - particle.size / 2,
                      top: particle.y - particle.size / 2,
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                      opacity: particle.opacity,
                      borderRadius: particle.size / 2,
                      shadowColor: particle.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: particle.size / 2,
                      elevation: 5,
                    },
                  ]}
                />
              ))}
            </>
          )}

          {/* 🏠 MAIN MENU (from Screenshot 3) */}
          {!gameState.isPlaying && !gameState.isGameOver && (
            <View style={styles.mainMenu}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>GravityFlip</Text>
                <Text style={styles.subtitle}>Master the Gravity</Text>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{Math.floor(gameState.distance)}m</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Best</Text>
                  <Text style={styles.statValue}>{gameState.highScore}m</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Speed</Text>
                  <Text style={styles.statValue}>x{gameState.speed.toFixed(1)}</Text>
                </View>
              </View>

              {/* Start Button */}
              <Animated.View style={[styles.startButton, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.startButtonText}>{t.tapToStart}</Text>
                <Text style={styles.startButtonSubtext}>🎮 Ready for action? 🎮</Text>
              </Animated.View>

              {/* Menu Cards Grid (from Screenshot 3) */}
              <View style={styles.menuGrid}>
                                 {/* Mode Card */}
                 <TouchableOpacity
                   style={[styles.menuCard, styles.modeCard]}
                   onPress={() => setShowModeSelection(true)}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🎮</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>MODE</Text>
                   </View>
                   <Text style={styles.cardTitle}>
                     {gameState.currentMode === GameMode.CLASSIC ? 'Classic' :
                      gameState.currentMode === GameMode.TIME_ATTACK ? 'Time Attack' :
                      gameState.currentMode === GameMode.POWER_UP_RUSH ? 'Power Rush' :
                      gameState.currentMode === GameMode.HARDCORE ? 'Hardcore' :
                      gameState.currentMode === GameMode.ZEN ? 'Zen Mode' : 'Classic'}
                   </Text>
                   <Text style={styles.cardDescription}>Tap to change mode</Text>
                 </TouchableOpacity>

                 {/* 🏁 Course Mode Card - MARIO RUN INSPIRED! */}
                 <TouchableOpacity 
                   style={[styles.menuCard, styles.courseCard]}
                   onPress={() => setShowCourseSelection(true)}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🏁</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>NEW</Text>
                   </View>
                   <Text style={styles.cardTitle}>Course Mode</Text>
                   <Text style={styles.cardDescription}>Complete • Collect • Conquer</Text>
                 </TouchableOpacity>

                 {/* Achievements Card */}
                 <TouchableOpacity
                   style={[styles.menuCard, styles.achievementCard]}
                   onPress={() => setShowAchievements(true)}
                   activeOpacity={0.8}
                 >
                  <Text style={styles.cardEmoji}>🏆</Text>
                  <View style={styles.cardProgress}>
                    <Text style={styles.cardProgressText}>0/16</Text>
                  </View>
                  <Text style={styles.cardTitle}>{t.achievements}</Text>
                  <Text style={styles.cardDescription}>Unlock rewards & glory</Text>
                </TouchableOpacity>

                                 {/* Customize Card */}
                 <TouchableOpacity
                   style={[styles.menuCard, styles.customizeCard]}
                   onPress={() => setShowCustomization(true)}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🎨</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>NEW</Text>
                   </View>
                   <Text style={styles.cardTitle}>{t.customize}</Text>
                   <Text style={styles.cardDescription}>Skins • Trails • Effects</Text>
                 </TouchableOpacity>

                 {/* Language Card */}
                 <TouchableOpacity 
                   style={[styles.menuCard, styles.languageCard]}
                   onPress={() => setShowLanguageSelector(true)}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🌍</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>
                       {currentLanguage === Language.ENGLISH ? 'EN' :
                        currentLanguage === Language.CZECH ? 'CS' : 'ES'}
                     </Text>
                   </View>
                   <Text style={styles.cardTitle}>{t.language}</Text>
                   <Text style={styles.cardDescription}>
                     {currentLanguage === Language.ENGLISH ? 'English' :
                      currentLanguage === Language.CZECH ? 'Čeština' : 'Español'}
                   </Text>
                 </TouchableOpacity>

                 {/* ⚙️ Settings Card - EPIC CUSTOMIZATION! */}
                 <TouchableOpacity 
                   style={[styles.menuCard, styles.settingsCard]}
                   onPress={() => setShowSettings(true)}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>⚙️</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>PRO</Text>
                   </View>
                   <Text style={styles.cardTitle}>Settings</Text>
                   <Text style={styles.cardDescription}>Audio • Graphics • Controls</Text>
                 </TouchableOpacity>

                 {/* 🧪 QA Testing Card - NINTENDO ENGINEER MODE! */}
                 <TouchableOpacity
                   style={[styles.menuCard, styles.testCard]}
                   onPress={runAutomatedTests}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🧪</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>QA</Text>
                   </View>
                   <Text style={styles.cardTitle}>Run Tests</Text>
                   <Text style={styles.cardDescription}>Automated Testing Suite</Text>
                 </TouchableOpacity>

                 {/* 🎓 Tutorial Card - LEARN THE GAME! */}
                 <TouchableOpacity 
                   style={[styles.menuCard, styles.tutorialCard]}
                   onPress={startTutorial}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🎓</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>
                       {tutorialCompleted ? 'DONE' : 'NEW'}
                     </Text>
                   </View>
                   <Text style={styles.cardTitle}>Tutorial</Text>
                   <Text style={styles.cardDescription}>
                     {tutorialCompleted ? 'Replay tutorial' : 'Learn to play'}
                   </Text>
                 </TouchableOpacity>

                 {/* 🏆 Leaderboard Card - COMPETE WITH OTHERS! */}
                 <TouchableOpacity 
                   style={[styles.menuCard, styles.leaderboardCard]}
                   onPress={() => setShowLeaderboard(true)}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>🏆</Text>
                   <View style={styles.cardBadge}>
                     <Text style={styles.cardBadgeText}>TOP</Text>
                   </View>
                   <Text style={styles.cardTitle}>Leaderboard</Text>
                   <Text style={styles.cardDescription}>View top scores</Text>
                 </TouchableOpacity>

                 {/* Share Card */}
                 <TouchableOpacity 
                   style={[styles.menuCard, styles.shareCard]}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.cardEmoji}>📱</Text>
                   <Text style={styles.cardTitle}>{t.shareGame}</Text>
                   <Text style={styles.cardDescription}>Tell your friends!</Text>
                 </TouchableOpacity>
              </View>

              {/* Purple orb at bottom */}
              <View style={styles.bottomOrb} />
            </View>
          )}

                     {/* 💀 GAME OVER SCREEN (from Screenshot 5) */}
           {gameState.isGameOver && (
             <View style={styles.gameOverContainer}>
               <Animated.View style={[
                 styles.gameOverModal,
                 {
                   opacity: gameOverFadeAnim,
                   transform: [{ scale: gameOverScaleAnim }],
                 }
               ]}>
                 <ScrollView 
                   showsVerticalScrollIndicator={false}
                   contentContainerStyle={{ paddingBottom: 20 }}
                 >
                   <View style={styles.gameOverHeader}>
                     <Text style={styles.gameOverTitle}>💀 {t.gameOver}</Text>
                     <Text style={styles.playerNameDisplay}>👤 {playerName}</Text>
                     <Text style={styles.gameOverSubtitle}>Nice try, gravity master!</Text>
                   </View>

                   <View style={styles.gameOverStatsContainer}>
                  <View style={styles.gameOverMainStat}>
                    <Text style={styles.gameOverStatLabel}>Final Distance</Text>
                    <Text style={styles.gameOverStatValue}>{Math.floor(gameState.distance)}m</Text>
                    {gameState.distance > gameState.highScore && (
                      <View style={styles.newRecordBadge}>
                        <Text style={styles.newRecordText}>🏆 NEW RECORD! 🏆</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.gameOverStatsGrid}>
                    <View style={styles.gameOverStatItem}>
                      <Text style={styles.gameOverStatIcon}>🏁</Text>
                      <Text style={styles.gameOverStatLabel}>Personal Best</Text>
                      <Text style={styles.gameOverStatValue}>{gameState.highScore}m</Text>
                    </View>

                    <View style={styles.gameOverStatItem}>
                      <Text style={styles.gameOverStatIcon}>⚡</Text>
                      <Text style={styles.gameOverStatLabel}>Max Speed</Text>
                      <Text style={styles.gameOverStatValue}>x{gameState.maxSpeed.toFixed(1)}</Text>
                    </View>

                    <View style={styles.gameOverStatItem}>
                      <Text style={styles.gameOverStatIcon}>🎯</Text>
                      <Text style={styles.gameOverStatLabel}>Skill Level</Text>
                      <Text style={styles.gameOverStatValue}>{gameState.skill.toFixed(1)}/10</Text>
                    </View>

                    <View style={styles.gameOverStatItem}>
                      <Text style={styles.gameOverStatIcon}>🌀</Text>
                      <Text style={styles.gameOverStatLabel}>Flow State</Text>
                      <Text style={styles.gameOverStatValue}>{Math.floor(gameState.flow)}%</Text>
                    </View>
                  </View>
                </View>

                {/* Motivational Message */}
                <View style={styles.motivationalContainer}>
                  <Text style={styles.motivationalText}>
                    {gameState.distance < 50 ? t.keepPracticing :
                     gameState.distance < 200 ? t.gettingBetter :
                     gameState.distance < 500 ? t.excellentWork :
                     gameState.distance < 1000 ? t.amazing :
                     t.legendary}
                  </Text>
                </View>

                {/* Enhanced Game Over Buttons */}
                <View style={styles.gameOverButtons}>
                  <TouchableOpacity 
                    style={styles.gameOverButton}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gameOverButtonGlow} />
                    <Text style={styles.gameOverButtonIcon}>🎬</Text>
                    <Text style={styles.gameOverButtonText}>Continue</Text>
                    <Text style={styles.gameOverButtonSubtext}>Watch ad to continue playing</Text>
                  </TouchableOpacity>

                  <View style={styles.gameOverButtonRow}>
                    <TouchableOpacity 
                      style={styles.gameOverButtonSmall}
                      onPress={() => startGame()}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.gameOverButtonIcon}>🔄</Text>
                      <Text style={styles.gameOverButtonText}>Restart</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.gameOverButtonSmall}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.gameOverButtonIcon}>📤</Text>
                      <Text style={styles.gameOverButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.gameOverButtonRow}>
                    <TouchableOpacity 
                      style={styles.gameOverButtonSmall}
                      onPress={() => {
                        setGameState(prev => ({ ...prev, isGameOver: false }));
                        setShowLeaderboard(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.gameOverButtonIcon}>🏆</Text>
                      <Text style={styles.gameOverButtonText}>Leaderboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.gameOverButtonSmall}
                      onPress={() => setGameState(prev => ({ ...prev, isGameOver: false }))}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.gameOverButtonIcon}>🏠</Text>
                      <Text style={styles.gameOverButtonText}>Menu</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                </ScrollView>
               </Animated.View>
             </View>
           )}

        {/* 🌍 LANGUAGE SELECTOR MODAL */}
        <Modal visible={showLanguageSelector} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.achievementHeader}>
                <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
                <TouchableOpacity onPress={() => setShowLanguageSelector(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.languageOptions}>
                {Object.values(Language).map(language => (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageOption,
                      currentLanguage === language && styles.languageOptionSelected
                    ]}
                    onPress={() => {
                      setCurrentLanguage(language);
                      saveLanguage(language);
                      setShowLanguageSelector(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.languageOptionEmoji}>
                      {language === Language.ENGLISH ? '🇺🇸' :
                       language === Language.CZECH ? '🇨🇿' : '🇪🇸'}
                    </Text>
                    <View style={styles.languageOptionText}>
                      <Text style={styles.languageOptionName}>
                        {language === Language.ENGLISH ? 'English' :
                         language === Language.CZECH ? 'Čeština' : 'Español'}
                      </Text>
                      <Text style={styles.languageOptionCode}>
                        {language === Language.ENGLISH ? 'EN' :
                         language === Language.CZECH ? 'CS' : 'ES'}
                      </Text>
                    </View>
                    {currentLanguage === language && (
                      <Text style={styles.languageOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* ⚙️ COMPREHENSIVE SETTINGS MODAL - EPIC CUSTOMIZATION! */}
        <Modal visible={showSettings} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.achievementHeader}>
                <Text style={styles.modalTitle}>⚙️ Game Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
                {/* 👤 PLAYER PROFILE SETTINGS */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingSectionTitle}>👤 Player Profile</Text>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Player Name</Text>
                    <TouchableOpacity 
                      style={styles.nameInputButton}
                      onPress={promptPlayerName}
                    >
                      <Text style={styles.nameInputText}>
                        {playerName || 'Tap to set name'}
                      </Text>
                      <Text style={styles.nameInputIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 🔊 AUDIO SETTINGS */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingSectionTitle}>🔊 Audio Settings</Text>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Master Volume</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderValue}>{Math.round(settings.masterVolume * 100)}%</Text>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Sound Effects</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderValue}>{Math.round(settings.soundEffectsVolume * 100)}%</Text>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Music Volume</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderValue}>{Math.round(settings.musicVolume * 100)}%</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.settingToggle, settings.audioEnabled && styles.settingToggleActive]}
                    onPress={() => updateSetting('audioEnabled', !settings.audioEnabled)}
                  >
                    <Text style={styles.settingToggleText}>
                      {settings.audioEnabled ? '🔊' : '🔇'} Audio {settings.audioEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 🎨 GRAPHICS SETTINGS */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingSectionTitle}>🎨 Graphics Settings</Text>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Particle Quality</Text>
                    <View style={styles.segmentedControl}>
                      {(['low', 'medium', 'high', 'ultra'] as const).map(quality => (
                        <TouchableOpacity
                          key={quality}
                          style={[
                            styles.segmentButton,
                            settings.particleQuality === quality && styles.segmentButtonActive
                          ]}
                          onPress={() => updateSetting('particleQuality', quality)}
                        >
                          <Text style={[
                            styles.segmentButtonText,
                            settings.particleQuality === quality && styles.segmentButtonTextActive
                          ]}>
                            {quality.charAt(0).toUpperCase() + quality.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.settingToggle, settings.backgroundEffects && styles.settingToggleActive]}
                    onPress={() => updateSetting('backgroundEffects', !settings.backgroundEffects)}
                  >
                    <Text style={styles.settingToggleText}>
                      🌟 Background Effects {settings.backgroundEffects ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.settingToggle, settings.screenShake && styles.settingToggleActive]}
                    onPress={() => updateSetting('screenShake', !settings.screenShake)}
                  >
                    <Text style={styles.settingToggleText}>
                      📳 Screen Shake {settings.screenShake ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 🎮 CONTROL SETTINGS */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingSectionTitle}>🎮 Control Settings</Text>
                  
                  <TouchableOpacity 
                    style={[styles.settingToggle, settings.hapticFeedback && styles.settingToggleActive]}
                    onPress={() => updateSetting('hapticFeedback', !settings.hapticFeedback)}
                  >
                    <Text style={styles.settingToggleText}>
                      📳 Haptic Feedback {settings.hapticFeedback ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Touch Sensitivity</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderValue}>{settings.touchSensitivity.toFixed(1)}x</Text>
                    </View>
                  </View>
                </View>

                {/* 🎯 GAME SETTINGS */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingSectionTitle}>🎯 Game Settings</Text>
                  
                  <TouchableOpacity 
                    style={[styles.settingToggle, settings.showDebugInfo && styles.settingToggleActive]}
                    onPress={() => updateSetting('showDebugInfo', !settings.showDebugInfo)}
                  >
                    <Text style={styles.settingToggleText}>
                      🐛 Debug Info {settings.showDebugInfo ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.settingToggle, settings.autoSaveProgress && styles.settingToggleActive]}
                    onPress={() => updateSetting('autoSaveProgress', !settings.autoSaveProgress)}
                  >
                    <Text style={styles.settingToggleText}>
                      💾 Auto Save {settings.autoSaveProgress ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 🚨 RESET SETTINGS */}
                <View style={styles.settingsSection}>
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={resetSettings}
                  >
                    <Text style={styles.resetButtonText}>🔄 Reset to Defaults</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 🎓 EPIC TUTORIAL OVERLAY - INTERACTIVE LEARNING! */}
        {tutorialState.isActive && (
          <View style={styles.tutorialOverlay}>
            <View style={styles.tutorialContent}>
              <View style={styles.tutorialHeader}>
                <Text style={styles.tutorialTitle}>
                  {tutorialSteps[tutorialState.currentStep]?.title}
                </Text>
                <Text style={styles.tutorialProgress}>
                  {tutorialState.currentStep + 1} / {tutorialState.totalSteps}
                </Text>
              </View>
              
              <Text style={styles.tutorialDescription}>
                {tutorialSteps[tutorialState.currentStep]?.description}
              </Text>
              
              <View style={styles.tutorialInstructionBox}>
                <Text style={styles.tutorialInstruction}>
                  {tutorialSteps[tutorialState.currentStep]?.instruction}
                </Text>
              </View>

              {/* Tutorial Progress Bar */}
              <View style={styles.tutorialProgressBar}>
                <View 
                  style={[
                    styles.tutorialProgressFill,
                    { width: `${((tutorialState.currentStep + 1) / tutorialState.totalSteps) * 100}%` }
                  ]}
                />
              </View>

              {/* Skip Button for skippable steps */}
              {tutorialSteps[tutorialState.currentStep]?.skippable && (
                <TouchableOpacity 
                  style={styles.tutorialSkipButton}
                  onPress={nextTutorialStep}
                >
                  <Text style={styles.tutorialSkipText}>Skip Step →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}



        {/* 🔍 SUPER DEBUG CONTROLS */}
        <View style={styles.debugControls}>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log(`[MANUAL DEBUG] 🧪 Manual debug dump triggered by user`);
              logGameStateDump();
            }}
          >
            <Text style={styles.debugButtonText}>🔍 DEBUG DUMP</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log(`[MANUAL DEBUG] 🎯 Manual collision test at player position Y=${currentPlayerY.current}`);
              const collision = checkCollision();
              console.log(`[MANUAL DEBUG] 🎯 Collision result: ${collision}`);
            }}
          >
            <Text style={styles.debugButtonText}>🎯 TEST COLLISION</Text>
          </TouchableOpacity>
        </View>

        {/* 🏆 LEADERBOARD MODAL */}
        <Modal visible={showLeaderboard} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.achievementHeader}>
                <Text style={styles.modalTitle}>🏆 Leaderboard</Text>
                <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.leaderboardStats}>
                <View style={styles.achievementStatItem}>
                  <Text style={styles.achievementStatNumber}>{leaderboard.length}</Text>
                  <Text style={styles.achievementStatLabel}>Players</Text>
                </View>
                <View style={styles.achievementStatItem}>
                  <Text style={styles.achievementStatNumber}>
                    {leaderboard.length > 0 ? Math.max(...leaderboard.map(entry => entry.distance)).toFixed(0) : 0}m
                  </Text>
                  <Text style={styles.achievementStatLabel}>Best Distance</Text>
                </View>
                <View style={styles.achievementStatItem}>
                  <Text style={styles.achievementStatNumber}>
                    {leaderboard.findIndex(e => e.playerName === playerName) + 1 || '-'}
                  </Text>
                  <Text style={styles.achievementStatLabel}>Your Rank</Text>
                </View>
              </View>

              <ScrollView style={styles.achievementList}>
                <Text style={styles.achievementCategory}>TOP SCORES</Text>
                
                {leaderboard.length === 0 ? (
                  <View style={styles.leaderboardEmpty}>
                    <Text style={styles.leaderboardEmptyIcon}>🎮</Text>
                    <Text style={styles.leaderboardEmptyTitle}>No scores yet!</Text>
                    <Text style={styles.leaderboardEmptyDesc}>Play a game to be the first on the leaderboard!</Text>
                  </View>
                ) : (
                  leaderboard
                    .sort((a, b) => b.score - a.score) // Sort by score descending
                    .slice(0, 10) // Top 10
                    .map((entry, index) => (
                      <View 
                        key={entry.id} 
                        style={[
                          styles.leaderboardEntry, 
                          entry.playerName === playerName && styles.leaderboardCurrentPlayer
                        ]}
                      >
                        <View style={styles.leaderboardRank}>
                          <Text style={styles.leaderboardRankText}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </Text>
                        </View>
                        <View style={styles.leaderboardInfo}>
                          <Text style={styles.leaderboardPlayerName}>
                            {entry.playerName} {entry.playerName === playerName && '(You)'}
                          </Text>
                          <Text style={styles.leaderboardScore}>{entry.distance.toFixed(0)}m</Text>
                          <Text style={styles.leaderboardDetails}>
                            {entry.gameMode} • {entry.bossesDefeated} bosses • {new Date(entry.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 👤 PLAYER NAME INPUT MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showNameInput}
          onRequestClose={() => setShowNameInput(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.nameModalContent}>
              <Text style={styles.nameModalTitle}>👤 Enter Your Name</Text>
              <Text style={styles.nameModalDescription}>
                Your name will appear on leaderboards and when sharing scores!
              </Text>
              
              <TextInput
                style={styles.nameTextInput}
                placeholder="Enter your name..."
                placeholderTextColor="#999"
                maxLength={20}
                autoFocus={true}
                value={tempPlayerName}
                onChangeText={setTempPlayerName}
                onSubmitEditing={() => handleNameSubmit(tempPlayerName)}
                returnKeyType="done"
              />
              
              <View style={styles.nameModalButtons}>
                <TouchableOpacity 
                  style={[styles.nameModalButton, styles.nameModalCancelButton]}
                  onPress={() => setShowNameInput(false)}
                >
                  <Text style={styles.nameModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.nameModalButton, styles.nameModalSaveButton]}
                  onPress={() => handleNameSubmit(tempPlayerName)}
                >
                  <Text style={styles.nameModalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 🎮 MODE SELECTION MODAL (from Screenshot 10) */}
        <Modal visible={showModeSelection} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Game Mode</Text>
              
                             <TouchableOpacity 
                 style={[styles.modeOption, gameState.currentMode === GameMode.CLASSIC && styles.modeSelected]}
                 onPress={() => setGameState(prev => ({ ...prev, currentMode: GameMode.CLASSIC }))}
                 activeOpacity={0.8}
               >
                 <Text style={styles.modeEmoji}>🎮</Text>
                 <View style={styles.modeInfo}>
                   <Text style={styles.modeTitle}>Classic</Text>
                   <Text style={styles.modeDescription}>The original endless runner experience</Text>
                 </View>
                 {gameState.currentMode === GameMode.CLASSIC && <Text style={styles.modeCheck}>✓</Text>}
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[styles.modeOption, gameState.currentMode === GameMode.TIME_ATTACK && styles.modeSelected]}
                 onPress={() => setGameState(prev => ({ ...prev, currentMode: GameMode.TIME_ATTACK }))}
                 activeOpacity={0.8}
               >
                 <Text style={styles.modeEmoji}>⏰</Text>
                 <View style={styles.modeInfo}>
                   <Text style={styles.modeTitle}>Time Attack</Text>
                   <Text style={styles.modeDescription}>Survive 60 seconds, score based on distance + style</Text>
                   <Text style={styles.modeFeature}>⏱️ 60s time limit</Text>
                 </View>
                 {gameState.currentMode === GameMode.TIME_ATTACK && <Text style={styles.modeCheck}>✓</Text>}
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[styles.modeOption, gameState.currentMode === GameMode.POWER_UP_RUSH && styles.modeSelected]}
                 onPress={() => setGameState(prev => ({ ...prev, currentMode: GameMode.POWER_UP_RUSH }))}
                 activeOpacity={0.8}
               >
                 <Text style={styles.modeEmoji}>⚡</Text>
                 <View style={styles.modeInfo}>
                   <Text style={styles.modeTitle}>Power-up Rush</Text>
                   <Text style={styles.modeDescription}>Chaos mode with extra power-ups everywhere!</Text>
                   <Text style={styles.modeFeature}>⚡ Extra power-ups</Text>
                 </View>
                 {gameState.currentMode === GameMode.POWER_UP_RUSH && <Text style={styles.modeCheck}>✓</Text>}
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[styles.modeOption, gameState.currentMode === GameMode.HARDCORE && styles.modeSelected]}
                 onPress={() => setGameState(prev => ({ ...prev, currentMode: GameMode.HARDCORE }))}
                 activeOpacity={0.8}
               >
                 <Text style={styles.modeEmoji}>💀</Text>
                 <View style={styles.modeInfo}>
                   <Text style={styles.modeTitle}>Hardcore</Text>
                   <Text style={styles.modeDescription}>No power-ups, pure skill and reflexes</Text>
                   <Text style={styles.modeFeature}>🚫 No power-ups</Text>
                 </View>
                 {gameState.currentMode === GameMode.HARDCORE && <Text style={styles.modeCheck}>✓</Text>}
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[styles.modeOption, gameState.currentMode === GameMode.ZEN && styles.modeSelected]}
                 onPress={() => setGameState(prev => ({ ...prev, currentMode: GameMode.ZEN }))}
                 activeOpacity={0.8}
               >
                 <Text style={styles.modeEmoji}>🧘</Text>
                 <View style={styles.modeInfo}>
                   <Text style={styles.modeTitle}>Zen Mode</Text>
                   <Text style={styles.modeDescription}>Slower pace, relaxing endless journey</Text>
                 </View>
                 {gameState.currentMode === GameMode.ZEN && <Text style={styles.modeCheck}>✓</Text>}
               </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowModeSelection(false)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

                 {/* 🌍 LANGUAGE SELECTOR MODAL */}
        <Modal visible={showLanguageSelector} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.achievementHeader}>
                <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
                <TouchableOpacity onPress={() => setShowLanguageSelector(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.languageOptions}>
                {Object.values(Language).map(language => (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageOption,
                      currentLanguage === language && styles.languageOptionSelected
                    ]}
                    onPress={() => {
                      setCurrentLanguage(language);
                      saveLanguage(language);
                      setShowLanguageSelector(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.languageOptionEmoji}>
                      {language === Language.ENGLISH ? '🇺🇸' :
                       language === Language.CZECH ? '🇨🇿' : '🇪🇸'}
                    </Text>
                    <View style={styles.languageOptionText}>
                      <Text style={styles.languageOptionName}>
                        {language === Language.ENGLISH ? 'English' :
                         language === Language.CZECH ? 'Čeština' : 'Español'}
                      </Text>
                      <Text style={styles.languageOptionCode}>
                        {language === Language.ENGLISH ? 'EN' :
                         language === Language.CZECH ? 'CS' : 'ES'}
                      </Text>
                    </View>
                    {currentLanguage === language && (
                      <Text style={styles.languageOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* 🏁 COURSE SELECTION MODAL - SIMPLIFIED FOR NOW */}
        <Modal visible={showCourseSelection} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.courseSelectionModal, { maxHeight: '80%' }]}>
              <Text style={styles.customizationTitle}>🏁 Course Mode</Text>
              <Text style={styles.customizationSubtitle}>Choose Your Challenge</Text>
              
              <ScrollView style={{ flex: 1, marginTop: 20 }}>
                {courses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.skinOption, course.unlocked ? {} : { opacity: 0.5 }]}
                    onPress={() => course.unlocked ? startCourse(course) : null}
                    activeOpacity={course.unlocked ? 0.8 : 1}
                  >
                    <Text style={styles.skinName}>Course {course.id}: {course.name}</Text>
                    <Text style={styles.skinDescription}>
                      {course.unlocked ? `Target: ${course.targetDistance}m | Coins: ${course.coinTarget}` : '🔒 Locked'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCourseSelection(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 🎉 SUPER MARIO RUN INSPIRED COURSE COMPLETION MODAL! */}
        <Modal visible={showCourseCompletion} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            {/* 🎊 CONFETTI BACKGROUND EFFECT */}
            {showCourseCompletion && completionData && (
              <View style={styles.confettiContainer}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.confettiPiece,
                                             {
                         left: `${Math.random() * 100}%`,
                         top: Math.random() * -50,
                         backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)]
                       }
                    ]}
                  />
                ))}
              </View>
            )}
            
            <Animated.View style={[styles.clearedModal, { 
              transform: [{ scale: gameOverScaleAnim }],
              opacity: gameOverFadeAnim 
            }]}>
              {completionData && (
                <>
                  {/* 🎊 EPIC CLEARED BANNER WITH MARIO RUN STYLE */}
                  <View style={styles.clearedHeader}>
                    <Text style={styles.clearedTitle}>CLEARED!</Text>
                    <View style={styles.clearedBadge}>
                      <Text style={styles.clearedBadgeText}>Course {completionData.courseId}</Text>
                    </View>
                    <Text style={styles.clearedSubtitle}>Amazing Performance!</Text>
                  </View>

                  {/* ⭐ ANIMATED STAR RATING WITH MARIO RUN STYLE */}
                  <View style={styles.starContainer}>
                    {[1, 2, 3].map((star) => (
                      <Animated.View
                        key={star}
                        style={[
                          styles.starWrapper,
                          {
                            transform: [{ scale: star <= completionData.stars ? 1.2 : 0.8 }]
                          }
                        ]}
                      >
                        <Text style={[
                          styles.starIcon,
                          { 
                            color: star <= completionData.stars ? '#FFD700' : '#444',
                            textShadowColor: star <= completionData.stars ? '#FF8C00' : 'transparent',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 4
                          }
                        ]}>
                          ⭐
                        </Text>
                        {star <= completionData.stars && (
                          <View style={styles.starGlow} />
                        )}
                      </Animated.View>
                    ))}
                  </View>

                  {/* 📊 NINTENDO-STYLE COMPLETION STATS */}
                  <View style={styles.completionStats}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>🏁</Text>
                      <Text style={styles.statValue}>{completionData.distance}m</Text>
                      <Text style={styles.statLabel}>Distance</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>🪙</Text>
                      <Text style={styles.statValue}>{completionData.coinsCollected}</Text>
                      <Text style={styles.statLabel}>Coins</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>⚡</Text>
                      <Text style={styles.statValue}>{completionData.stars}/3</Text>
                      <Text style={styles.statLabel}>Stars</Text>
                    </View>
                  </View>

                  {/* 🎮 MARIO RUN STYLE ACTION BUTTONS */}
                  <View style={styles.completionButtons}>
                    <TouchableOpacity 
                      style={[styles.completionButton, styles.continueButton]}
                      onPress={() => {
                        setShowCourseCompletion(false);
                        setCurrentCourse(null);
                        setCompletionData(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.completionButtonIcon}>🏠</Text>
                      <Text style={styles.completionButtonText}>Menu</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.completionButton, styles.retryButton]}
                      onPress={() => {
                        setShowCourseCompletion(false);
                        if (currentCourse) {
                          // Restart the same course
                          startCourse(currentCourse);
                        }
                      }}
                    >
                      <Text style={styles.closeButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>

        {/* 🎨 EPIC NINTENDO-STYLE CUSTOMIZATION MODAL */}
        <Modal visible={showCustomization} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.epicCustomizeContainer}>
              
              {/* 🎮 NINTENDO-STYLE HEADER */}
              <View style={styles.epicCustomizeHeader}>
                <View style={styles.epicHeaderLeft}>
                  <Text style={styles.epicCustomizeEmoji}>🎨</Text>
                  <Text style={styles.epicCustomizeTitle}>Customize Your Game</Text>
                </View>
                <TouchableOpacity 
                  style={styles.epicCloseButton}
                  onPress={() => setShowCustomization(false)}
                >
                  <Text style={styles.epicCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 🎮 EPIC CUSTOMIZATION TABS - NOW WITH FUNCTIONALITY! */}
              <View style={styles.epicCustomizeTabs}>
                <TouchableOpacity 
                  style={[
                    styles.epicTab, 
                    activeCustomizationTab === CustomizationTab.SKINS && styles.epicTabActive
                  ]}
                  onPress={() => handleTabSwitch(CustomizationTab.SKINS)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.epicTabEmoji}>🎭</Text>
                  <Text style={styles.epicTabText}>Skins</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.epicTab,
                    activeCustomizationTab === CustomizationTab.TRAILS && styles.epicTabActive
                  ]}
                  onPress={() => handleTabSwitch(CustomizationTab.TRAILS)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.epicTabEmoji}>✨</Text>
                  <Text style={styles.epicTabText}>Trails</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.epicTab,
                    activeCustomizationTab === CustomizationTab.EFFECTS && styles.epicTabActive
                  ]}
                  onPress={() => handleTabSwitch(CustomizationTab.EFFECTS)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.epicTabEmoji}>💫</Text>
                  <Text style={styles.epicTabText}>Effects</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.epicTab,
                    activeCustomizationTab === CustomizationTab.SPECIAL && styles.epicTabActive
                  ]}
                  onPress={() => handleTabSwitch(CustomizationTab.SPECIAL)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.epicTabEmoji}>🌟</Text>
                  <Text style={styles.epicTabText}>Special</Text>
                </TouchableOpacity>
              </View>

              {/* 🎮 EPIC PREVIEW SECTION - DYNAMIC CONTENT! */}
              <View style={styles.epicPreviewSection}>
                <Text style={styles.epicPreviewTitle}>Preview</Text>
                <View style={styles.epicPreviewStage}>
                  <View style={styles.epicPreviewBackground}>
                    {/* Mini game environment */}
                    <View style={styles.epicPreviewPlayer} />
                    <View style={styles.epicPreviewTrail}>
                      <View style={[styles.epicTrailDot, { opacity: 1 }]} />
                      <View style={[styles.epicTrailDot, { opacity: 0.7 }]} />
                      <View style={[styles.epicTrailDot, { opacity: 0.4 }]} />
                    </View>
                  </View>
                  <Text style={styles.epicPreviewLabel}>
                    {activeCustomizationTab === CustomizationTab.SKINS ? `🔮 ${selectedSkinId === 'classic' ? 'Classic' : selectedSkinId === 'legendary' ? 'Legendary' : selectedSkinId === 'time' ? 'Time' : selectedSkinId === 'master' ? 'Master' : 'Champion'} Orb` :
                     activeCustomizationTab === CustomizationTab.TRAILS ? `✨ ${selectedTrailId === 'default' ? 'Default' : selectedTrailId === 'fire' ? 'Fire' : selectedTrailId === 'rainbow' ? 'Rainbow' : 'Cosmic'} Trail` :
                     activeCustomizationTab === CustomizationTab.EFFECTS ? `💫 ${selectedEffectId === 'none' ? 'No Effects' : selectedEffectId === 'sparkle' ? 'Sparkle' : selectedEffectId === 'glow' ? 'Glow' : 'Cosmic'} Effect` :
                     '🌟 Special Features'}
                  </Text>
                </View>
              </View>

              {/* 🎮 EPIC ORBS GRID - DYNAMIC CONTENT! */}
              <ScrollView style={styles.epicOrbsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.epicOrbsGrid}>
                
                {activeCustomizationTab === CustomizationTab.SKINS && (
                  <>
                    {/* 🌈 EPIC ORB COLLECTION - NINTENDO-LEVEL VARIETY! */}
                    {availableOrbs.map((orb) => {
                      const isUnlocked = unlockedOrbs.includes(orb.id);
                      const isSelected = selectedSkinId === orb.id;
                      
                      return (
                        <TouchableOpacity 
                          key={orb.id}
                          style={[
                            styles.epicOrbCard,
                            isSelected && styles.epicOrbSelected,
                            !isUnlocked && styles.epicOrbLocked
                          ]}
                          onPress={() => isUnlocked && handleOrbSelection(orb.id)}
                          activeOpacity={isUnlocked ? 0.8 : 0.3}
                        >
                          <View style={styles.epicOrbCardContent}>
                            {/* Rarity Badge */}
                            {orb.rarity !== 'common' && (
                              <View style={[styles.epicRarityBadge, { backgroundColor: getRarityColor(orb.rarity) }]}>
                                <Text style={styles.epicRarityText}>{orb.rarity.toUpperCase()}</Text>
                              </View>
                            )}
                            
                            {/* NEW Badge */}
                            {orb.isNew && (
                              <View style={styles.epicNewBadge}>
                                <Text style={styles.epicNewText}>NEW!</Text>
                              </View>
                            )}
                            
                            {/* Orb Visual */}
                            <View style={[
                              styles.epicOrb, 
                              { backgroundColor: orb.colors.outer },
                              orb.effects.hasGlow && { 
                                shadowColor: orb.colors.glow, 
                                shadowOpacity: 0.8, 
                                shadowRadius: 15,
                                elevation: 8 
                              },
                              !isUnlocked && { opacity: 0.3 }
                            ]}>
                              <View style={[styles.epicOrbCore, { backgroundColor: orb.colors.core }]} />
                              {orb.effects.hasParticles && isUnlocked && (
                                <View style={styles.epicOrbSparkles}>
                                  <Text style={[styles.epicSparkle, { color: orb.colors.sparkle }]}>✨</Text>
                                </View>
                              )}
                            </View>
                            
                            {/* Orb Name */}
                            <Text style={[styles.epicOrbName, !isUnlocked && { opacity: 0.5 }]}>
                              {orb.name}
                            </Text>
                            
                            {/* Unlock Condition or Equipped Status */}
                            {!isUnlocked ? (
                              <Text style={styles.epicOrbLockText}>
                                {orb.unlockCondition.description}
                              </Text>
                            ) : isSelected ? (
                              <View style={styles.epicOrbStatus}>
                                <Text style={styles.epicOrbEquipped}>✓</Text>
                              </View>
                            ) : (
                              <View style={styles.epicOrbStatus}>
                                <Text style={styles.epicOrbEquipped}>○</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                {activeCustomizationTab === CustomizationTab.TRAILS && (
                  <>
                    {/* TRAILS TAB CONTENT */}
                    <TouchableOpacity 
                      style={[
                        styles.epicOrbCard, 
                        selectedTrailId === 'default' && styles.epicOrbSelected
                      ]}
                      onPress={() => setSelectedTrailId('default')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.epicOrbCardContent}>
                        <View style={[styles.epicOrb, { backgroundColor: '#E0E7FF' }]}>
                          <Text style={styles.epicOrbIcon}>✨</Text>
                        </View>
                        <Text style={styles.epicOrbName}>Default Trail</Text>
                      </View>
                      <View style={styles.epicOrbStatus}>
                        <Text style={styles.epicOrbEquipped}>
                          {selectedTrailId === 'default' ? '✓' : '○'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.epicOrbCard,
                        selectedTrailId === 'fire' && styles.epicOrbSelected
                      ]}
                      onPress={() => setSelectedTrailId('fire')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.epicOrbCardContent}>
                        <View style={[styles.epicOrb, { backgroundColor: '#FF6B6B' }]}>
                          <Text style={styles.epicOrbIcon}>🔥</Text>
                        </View>
                        <Text style={styles.epicOrbName}>Fire Trail</Text>
                      </View>
                      <View style={styles.epicOrbRarity}>
                        <Text style={styles.epicOrbRarityText}>EPIC</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.epicOrbCard,
                        selectedTrailId === 'rainbow' && styles.epicOrbSelected
                      ]}
                      onPress={() => setSelectedTrailId('rainbow')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.epicOrbCardContent}>
                        <View style={[styles.epicOrb, { backgroundColor: '#FFD700' }]}>
                          <Text style={styles.epicOrbIcon}>🌈</Text>
                        </View>
                        <Text style={styles.epicOrbName}>Rainbow Trail</Text>
                      </View>
                      <View style={styles.epicOrbRarity}>
                        <Text style={styles.epicOrbRarityText}>LEGENDARY</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {activeCustomizationTab === CustomizationTab.EFFECTS && (
                  <>
                    {/* EFFECTS TAB CONTENT */}
                    <TouchableOpacity 
                      style={[
                        styles.epicOrbCard, 
                        selectedEffectId === 'none' && styles.epicOrbSelected
                      ]}
                      onPress={() => setSelectedEffectId('none')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.epicOrbCardContent}>
                        <View style={[styles.epicOrb, { backgroundColor: '#E0E7FF' }]}>
                          <Text style={styles.epicOrbIcon}>⭕</Text>
                        </View>
                        <Text style={styles.epicOrbName}>No Effects</Text>
                      </View>
                      <View style={styles.epicOrbStatus}>
                        <Text style={styles.epicOrbEquipped}>
                          {selectedEffectId === 'none' ? '✓' : '○'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.epicOrbCard,
                        selectedEffectId === 'sparkle' && styles.epicOrbSelected
                      ]}
                      onPress={() => setSelectedEffectId('sparkle')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.epicOrbCardContent}>
                        <View style={[styles.epicOrb, { backgroundColor: '#FFD700' }]}>
                          <Text style={styles.epicOrbIcon}>✨</Text>
                        </View>
                        <Text style={styles.epicOrbName}>Sparkle Effect</Text>
                      </View>
                      <View style={styles.epicOrbRarity}>
                        <Text style={styles.epicOrbRarityText}>RARE</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {activeCustomizationTab === CustomizationTab.SPECIAL && (
                  <>
                    {/* SPECIAL TAB CONTENT */}
                    <View style={styles.epicOrbCard}>
                      <View style={styles.epicOrbCardContent}>
                        <View style={[styles.epicOrb, { backgroundColor: '#8B5CF6' }]}>
                          <Text style={styles.epicOrbIcon}>🌟</Text>
                        </View>
                        <Text style={styles.epicOrbName}>Coming Soon!</Text>
                      </View>
                      <View style={styles.epicOrbLocked}>
                        <Text style={styles.epicAchievementText}>Special features coming in future updates!</Text>
                      </View>
                    </View>
                  </>
                )}

                </View>
              </ScrollView>

            </View>
          </View>
        </Modal>

         {/* 🏆 ACHIEVEMENTS MODAL (from Screenshot 8) */}
         <Modal visible={showAchievements} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.achievementHeader}>
                <Text style={styles.modalTitle}>Achievements</Text>
                <TouchableOpacity onPress={() => setShowAchievements(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

                             <View style={styles.achievementStats}>
                 <View style={styles.achievementStatItem}>
                   <Text style={styles.achievementStatNumber}>
                     {(totalFlips >= 1 ? 1 : 0) + 
                      (gameState.highScore >= 100 ? 1 : 0) + 
                      (gameState.highScore >= 500 ? 1 : 0) + 
                      (gameState.highScore >= 1000 ? 1 : 0) + 
                      (gamesPlayed >= 5 ? 1 : 0)}
                   </Text>
                   <Text style={styles.achievementStatLabel}>{t.unlocked}</Text>
                 </View>
                 <View style={styles.achievementStatItem}>
                   <Text style={styles.achievementStatNumber}>16</Text>
                   <Text style={styles.achievementStatLabel}>{t.total}</Text>
                 </View>
               </View>

              <ScrollView style={styles.achievementList}>
                <Text style={styles.achievementCategory}>DISTANCE</Text>
                
                                 <TouchableOpacity 
                   style={[styles.achievementItem, totalFlips >= 1 && styles.achievementUnlocked]}
                   onPress={() => {
                     if (totalFlips >= 1) {
                       // ✨ ACHIEVEMENT CELEBRATION PARTICLES!
                       createParticles(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'achievement', 12);
                       playSound('achievement');
                     }
                   }}
                   activeOpacity={0.8}
                 >
                   <Text style={styles.achievementIcon}>{totalFlips >= 1 ? '✅' : '🔒'}</Text>
                   <View style={styles.achievementInfo}>
                     <Text style={styles.achievementTitle}>{t.firstFlip}</Text>
                     <Text style={styles.achievementDescription}>{t.firstFlipDesc}</Text>
                     <View style={styles.achievementProgress}>
                       <Text style={styles.achievementProgressText}>{Math.min(totalFlips, 1)} / 1</Text>
                     </View>
                   </View>
                 </TouchableOpacity>

                 <View style={[styles.achievementItem, gameState.highScore >= 100 && styles.achievementUnlocked]}>
                   <Text style={styles.achievementIcon}>{gameState.highScore >= 100 ? '✅' : '🔒'}</Text>
                   <View style={styles.achievementInfo}>
                     <Text style={styles.achievementTitle}>{t.centuryRunner}</Text>
                     <Text style={styles.achievementDescription}>{t.centuryRunnerDesc}</Text>
                     <View style={styles.achievementProgress}>
                       <Text style={styles.achievementProgressText}>{Math.min(gameState.highScore, 100)} / 100</Text>
                     </View>
                   </View>
                 </View>

                 <View style={[styles.achievementItem, gameState.highScore >= 500 && styles.achievementUnlocked]}>
                   <Text style={styles.achievementIcon}>{gameState.highScore >= 500 ? '✅' : '🔒'}</Text>
                   <View style={styles.achievementInfo}>
                     <Text style={styles.achievementTitle}>{t.distanceDemon}</Text>
                     <Text style={styles.achievementDescription}>{t.distanceDemonDesc}</Text>
                     <View style={styles.achievementProgress}>
                       <Text style={styles.achievementProgressText}>{Math.min(gameState.highScore, 500)} / 500</Text>
                     </View>
                   </View>
                 </View>

                 <View style={[styles.achievementItem, gameState.highScore >= 1000 && styles.achievementUnlocked]}>
                   <Text style={styles.achievementIcon}>{gameState.highScore >= 1000 ? '✅' : '🔒'}</Text>
                   <View style={styles.achievementInfo}>
                     <Text style={styles.achievementTitle}>{t.kilometerKing}</Text>
                     <Text style={styles.achievementDescription}>{t.kilometerKingDesc}</Text>
                     <View style={styles.achievementProgress}>
                       <Text style={styles.achievementProgressText}>{Math.min(gameState.highScore, 1000)} / 1000</Text>
                     </View>
                   </View>
                 </View>

                 <Text style={styles.achievementCategory}>SURVIVAL</Text>
                 
                 <View style={[styles.achievementItem, gamesPlayed >= 5 && styles.achievementUnlocked]}>
                   <Text style={styles.achievementIcon}>{gamesPlayed >= 5 ? '✅' : '🔒'}</Text>
                   <View style={styles.achievementInfo}>
                     <Text style={styles.achievementTitle}>{t.persistentPlayer}</Text>
                     <Text style={styles.achievementDescription}>{t.persistentPlayerDesc}</Text>
                     <View style={styles.achievementProgress}>
                       <Text style={styles.achievementProgressText}>{Math.min(gamesPlayed, 5)} / 5</Text>
                     </View>
                   </View>
                 </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#1E293B', // Slightly lighter background like reference game
  },

  // 🎮 GAMEPLAY STYLES
  gameUI: {
    position: 'absolute',
    top: SAFE_AREA_TOP,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },

  // 🌟 SIMPLIFIED TOP ROW STYLES - NINTENDO LEVEL CLEAN!
  simplifiedDistanceText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  xpContainer: {
    alignItems: 'center',
    minWidth: 120,
  },
  xpBarBackground: {
    width: 100,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.5)',
    marginBottom: 4,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFD60A',
    borderRadius: 3,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD60A',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#FFD60A',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD60A',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // 🪙 MARIO-STYLE COIN SYSTEM STYLES
  rightHudContainer: {
    alignItems: 'center',
    gap: 8,
  },
  coinCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  coinIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  coinCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  comboPopup: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 69, 0, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    zIndex: 100,
  },
  comboText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  comboSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  marioCoin: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  marioCoinIcon: {
    fontSize: 20,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rainbowSparkles: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    top: -8,
    left: -8,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 10,
    color: '#FFFFFF',
  },
  // ✨ NEW SPECIAL COIN EFFECT STYLES
  gemSparkles: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    top: -8,
    left: -8,
  },
  powerupGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    top: -8,
    left: -8,
  },
  multiplierAura: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    top: -8,
    left: -8,
  },
  distanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  speedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD60A',
  },
  bestText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  bossCounter: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E91E63',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  debugText: {
    fontSize: 10,
    color: '#00FF00',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  debugInfoPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 8,
    maxWidth: 200,
  },

  // 🚨 BOSS WARNING STYLES
  bossWarning: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    zIndex: 200,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  bossWarningText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  bossWarningSubtext: {
    fontSize: 14,
    color: '#FFCCCC',
    textAlign: 'center',
    marginTop: 5,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // 📊 SKILL METER
  skillMeter: {
    position: 'absolute',
    top: SAFE_AREA_TOP + 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    borderColor: '#FFD60A',
    borderWidth: 2,
    zIndex: 10,
  },
  skillText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  flowText: {
    fontSize: 12,
    color: '#00FF66',
    marginBottom: 5,
  },
  flowBar: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  flowProgress: {
    height: '100%',
    backgroundColor: '#00FF66',
    borderRadius: 3,
  },

  // 🎮 PLAYER - CLEAN SIMPLE STYLE (MARIO RUN INSPIRED)
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#2D3748', // Dark gray like reference game
    borderRadius: PLAYER_SIZE / 2,
    borderWidth: 1.5, // Thinner border like reference
    borderColor: '#FFFFFF88', // Semi-transparent border like reference
    // Removed excessive shadows for cleaner look
  },

  // ✨ PARTICLES
  particle: {
    position: 'absolute',
    zIndex: 100,
  },

  // ⭐ POWER-UPS
  powerUp: {
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  powerUpIcon: {
    fontSize: 14,
    textAlign: 'center',
  },

  // 🦹‍♂️ EPIC BOSS STYLES
  boss: {
    position: 'absolute',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    elevation: 10,
  },
  bossIcon: {
    fontSize: 28,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  bossHealthBar: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 2,
  },
  bossHealthFill: {
    height: '100%',
    borderRadius: 2,
  },
  bossPhase: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
  },

  // 🚧 OBSTACLES - CLEAN SIMPLE STYLE (MARIO RUN INSPIRED)
  obstacle: {
    position: 'absolute',
    borderRadius: 4, // Slightly rounded corners like reference
    // Removed shadows for cleaner, sharper look like reference game
  },

     // 🏠 MAIN MENU STYLES (from Screenshot 3)
   mainMenu: {
     flex: 1,
     padding: 20,
     justifyContent: 'space-between',
   },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFD60A',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 214, 10, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    elevation: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 1,
  },

  // 📊 STATS ROW
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD60A',
    textShadowColor: 'rgba(255, 214, 10, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // 🚀 START BUTTON
  startButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginVertical: 25,
    marginHorizontal: 15,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1a2e',
    marginBottom: 6,
    letterSpacing: 1,
  },
  startButtonSubtext: {
    fontSize: 15,
    color: '#1a1a2e',
    opacity: 0.8,
    fontWeight: '600',
  },

  // 🎴 MENU CARDS GRID
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  menuCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modeCard: {
    borderColor: '#FFD60A',
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    shadowColor: '#FFD60A',
    shadowOpacity: 0.4,
  },
  courseCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
  },
  achievementCard: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    shadowColor: '#22C55E',
    shadowOpacity: 0.4,
  },
  customizeCard: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.4,
  },
  shareCard: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
  },
  leaderboardCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
  },
  languageCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.4,
  },
  settingsCard: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.4,
  },
  testCard: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    shadowColor: '#22C55E',
    shadowOpacity: 0.4,
  },
  tutorialCard: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD60A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  cardProgress: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardProgressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  // 🟣 BOTTOM ORB
  bottomOrb: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    backgroundColor: '#8B5CF6',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
  },

  // 💀 GAME OVER STYLES (from Screenshot 5)
  gameOverContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Start from top
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 40, // Add top padding
  },
  gameOverModal: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 20, // Reduced padding
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%', // Limit height
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD60A',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
     gameOverHeader: {
     alignItems: 'center',
     marginBottom: 20,
   },
   gameOverTitle: {
     fontSize: 32, // Slightly smaller
     fontWeight: 'bold',
     color: '#FF4081',
     marginBottom: 6, // Less margin
     textAlign: 'center',
     textShadowColor: 'rgba(255, 64, 129, 0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 8,
   },
   gameOverSubtitle: {
     fontSize: 16,
     color: '#CCCCCC',
     fontStyle: 'italic',
     textAlign: 'center',
   },
   gameOverStatsContainer: {
     width: '100%',
     marginBottom: 20,
   },
   gameOverMainStat: {
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.08)',
     borderRadius: 12, // Smaller radius
     padding: 15, // Less padding
     marginBottom: 10, // Less margin
     borderWidth: 2,
     borderColor: 'rgba(255, 214, 10, 0.3)',
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 5,
   },
   gameOverStatLabel: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.8)',
     fontWeight: '600',
     marginBottom: 8,
     letterSpacing: 0.5,
   },
   gameOverStatValue: {
     fontSize: 28, // Smaller font
     fontWeight: '900',
     color: '#FFD60A',
     textShadowColor: 'rgba(255, 214, 10, 0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 6,
     marginBottom: 4, // Less margin
   },
   newRecordBadge: {
     backgroundColor: '#22C55E',
     borderRadius: 12,
     paddingHorizontal: 12,
     paddingVertical: 6,
     marginTop: 10,
     shadowColor: '#22C55E',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.6,
     shadowRadius: 4,
     elevation: 3,
   },
   newRecordText: {
     fontSize: 12,
     fontWeight: '800',
     color: '#FFFFFF',
     letterSpacing: 0.5,
     textAlign: 'center',
   },
   gameOverStatsGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     backgroundColor: 'rgba(255, 255, 255, 0.08)',
     borderRadius: 15,
     padding: 15,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   gameOverStatItem: {
     alignItems: 'center',
     width: '48%',
     marginBottom: 15,
   },
   gameOverStatIcon: {
     fontSize: 24,
     marginBottom: 8,
   },
   motivationalContainer: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 15,
     padding: 20,
     marginBottom: 25,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
     shadowColor: '#000000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 3,
   },
   motivationalText: {
     fontSize: 16,
     color: '#FFFFFF',
     textAlign: 'center',
     lineHeight: 22,
     fontStyle: 'italic',
     fontWeight: '500',
   },
  gameOverButtons: {
    width: '100%',
  },
  gameOverButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  gameOverButtonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gameOverButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gameOverButtonSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gameOverButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  gameOverButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  gameOverButtonSubtext: {
    fontSize: 10,
    color: '#CCCCCC',
  },
  audioEnabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  audioDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // 🎭 MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#FFD60A',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD60A',
    textAlign: 'center',
    marginBottom: 20,
  },

  // 🎮 MODE SELECTION STYLES
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeSelected: {
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    borderColor: '#FFD60A',
  },
  modeEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  modeFeature: {
    fontSize: 10,
    color: '#FFD60A',
    fontStyle: 'italic',
  },
  modeCheck: {
    fontSize: 20,
    color: '#22C55E',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 🏆 ACHIEVEMENT STYLES
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 24,
    color: '#CCCCCC',
    padding: 10,
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  achievementStatItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  achievementStatNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD60A',
  },
  achievementStatLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  achievementList: {
    flex: 1,
  },
  achievementCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD60A',
    marginTop: 15,
    marginBottom: 10,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  achievementProgress: {
    alignSelf: 'flex-end',
  },
     achievementProgressText: {
     fontSize: 10,
     color: '#FFD60A',
   },
   achievementUnlocked: {
     backgroundColor: 'rgba(34, 197, 94, 0.1)',
     borderColor: '#22C55E',
   },

   // 🌍 LANGUAGE SELECTOR STYLES
   languageOptions: {
     marginTop: 20,
   },
   languageOption: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.08)',
     borderRadius: 15,
     padding: 15,
     marginBottom: 10,
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   languageOptionSelected: {
     backgroundColor: 'rgba(76, 175, 80, 0.2)',
     borderColor: '#4CAF50',
     shadowColor: '#4CAF50',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 3,
   },
   languageOptionEmoji: {
     fontSize: 32,
     marginRight: 15,
   },
   languageOptionText: {
     flex: 1,
   },
   languageOptionName: {
     fontSize: 18,
     fontWeight: '600',
     color: '#FFFFFF',
     marginBottom: 2,
   },
   languageOptionCode: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.7)',
     fontWeight: '500',
   },
   languageOptionCheck: {
     fontSize: 24,
     color: '#4CAF50',
     fontWeight: 'bold',
   },

   // 🎨 CUSTOMIZATION STYLES
   customizationGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     marginBottom: 20,
   },
   customizationItem: {
     width: '48%',
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 12,
     padding: 15,
     marginBottom: 15,
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   customizationSelected: {
     borderColor: '#FFD60A',
     backgroundColor: 'rgba(255, 214, 10, 0.1)',
   },
   skinPreview: {
     width: 40,
     height: 40,
     borderRadius: 20,
     marginBottom: 8,
     borderWidth: 2,
     borderColor: '#FFFFFF',
   },
   trailPreview: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
     height: 40,
     justifyContent: 'center',
   },
   trailDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     marginHorizontal: 2,
   },
   particlePreview: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 8,
   },
   particleText: {
     fontSize: 20,
   },
   customizationName: {
     fontSize: 14,
     fontWeight: 'bold',
     color: '#FFFFFF',
     textAlign: 'center',
     marginBottom: 4,
   },
   customizationStatus: {
     fontSize: 10,
     color: '#22C55E',
     fontWeight: 'bold',
   },
   customizationPrice: {
     fontSize: 10,
     color: '#CCCCCC',
     fontWeight: 'bold',
   },

   // 🌟 CLEAN BACKGROUND STYLES (MARIO RUN INSPIRED)
   cleanBackgroundStar: {
     position: 'absolute',
     width: 2,
     height: 2,
     borderRadius: 1,
     backgroundColor: '#FFFFFF',
     opacity: 0.2,
   },
   backgroundStar: {
     position: 'absolute',
     width: 10,
     height: 10,
     borderRadius: 5,
     backgroundColor: '#FFFFFF',
     opacity: 0.5,
     shadowColor: '#FFFFFF',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.5,
     shadowRadius: 5,
     elevation: 5,
   },
   backgroundPlanet: {
     position: 'absolute',
     width: 20,
     height: 20,
     borderRadius: 10,
     backgroundColor: '#FF6B6B',
     shadowColor: '#FF6B6B',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.5,
     shadowRadius: 10,
     elevation: 5,
   },
   backgroundPlanetRound: {
     borderWidth: 2,
     borderColor: '#FFFFFF',
   },
   backgroundMoon: {
     backgroundColor: '#DDA0DD',
   },
   backgroundAsteroid: {
     backgroundColor: '#F39C12',
   },

   // 🔥 TRAIL PARTICLE STYLES
   trailParticle: {
     position: 'absolute',
     borderRadius: 50,
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.8,
     shadowRadius: 5,
     elevation: 5,
   },

   // ⚙️ SETTINGS MODAL STYLES - EPIC CUSTOMIZATION UI!
   settingsContainer: {
     flex: 1,
     maxHeight: '80%',
   },
   settingsSection: {
     marginBottom: 25,
     backgroundColor: 'rgba(255, 255, 255, 0.02)',
     borderRadius: 15,
     padding: 15,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   settingSectionTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#FFD60A',
     marginBottom: 15,
     textAlign: 'center',
   },
   settingItem: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 15,
     paddingVertical: 5,
   },
   settingLabel: {
     fontSize: 16,
     color: '#FFFFFF',
     fontWeight: '500',
     flex: 1,
   },
   sliderContainer: {
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: 'rgba(255, 214, 10, 0.1)',
     borderRadius: 10,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderWidth: 1,
     borderColor: '#FFD60A',
   },
   sliderValue: {
     fontSize: 14,
     fontWeight: 'bold',
     color: '#FFD60A',
   },
   settingToggle: {
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 12,
     padding: 15,
     marginBottom: 10,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   settingToggleActive: {
     backgroundColor: 'rgba(255, 214, 10, 0.1)',
     borderColor: '#FFD60A',
   },
   settingToggleText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#FFFFFF',
     textAlign: 'center',
   },
   segmentedControl: {
     flexDirection: 'row',
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 10,
     padding: 2,
   },
   segmentButton: {
     flex: 1,
     paddingVertical: 8,
     paddingHorizontal: 6,
     borderRadius: 8,
     alignItems: 'center',
   },
   segmentButtonActive: {
     backgroundColor: '#FFD60A',
   },
   segmentButtonText: {
     fontSize: 12,
     fontWeight: '600',
     color: '#CCCCCC',
   },
   segmentButtonTextActive: {
     color: '#1a1a2e',
   },
   resetButton: {
     backgroundColor: 'rgba(239, 68, 68, 0.2)',
     borderColor: '#EF4444',
     borderWidth: 2,
     borderRadius: 12,
     padding: 15,
     alignItems: 'center',
   },
   resetButtonText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#EF4444',
   },

   // ⚡ POWER-UP INDICATOR STYLES - EPIC STATUS DISPLAY!
   powerUpIndicators: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     marginTop: 5,
     gap: 5,
   },
   powerUpIndicator: {
     width: 30,
     height: 30,
     borderRadius: 15,
     alignItems: 'center',
     justifyContent: 'center',
     borderWidth: 2,
     borderColor: '#FFFFFF',
     shadowColor: '#000000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 5,
   },
   powerUpIndicatorIcon: {
     fontSize: 14,
     fontWeight: 'bold',
   },

   // 🎓 TUTORIAL OVERLAY STYLES - EPIC LEARNING INTERFACE!
   tutorialOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0, 0, 0, 0.8)',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1000,
   },
   tutorialContent: {
     backgroundColor: '#1a1a2e',
     borderRadius: 20,
     padding: 25,
     margin: 20,
     maxWidth: '90%',
     borderWidth: 2,
     borderColor: '#10B981',
     shadowColor: '#10B981',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.5,
     shadowRadius: 10,
     elevation: 10,
   },
   tutorialHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 15,
   },
   tutorialTitle: {
     fontSize: 22,
     fontWeight: 'bold',
     color: '#10B981',
     flex: 1,
   },
   tutorialProgress: {
     fontSize: 14,
     color: '#CCCCCC',
     backgroundColor: 'rgba(16, 185, 129, 0.2)',
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 12,
   },
   tutorialDescription: {
     fontSize: 16,
     color: '#FFFFFF',
     marginBottom: 15,
     lineHeight: 22,
   },
   tutorialInstructionBox: {
     backgroundColor: 'rgba(16, 185, 129, 0.1)',
     borderRadius: 12,
     padding: 15,
     marginBottom: 20,
     borderWidth: 1,
     borderColor: '#10B981',
   },
   tutorialInstruction: {
     fontSize: 18,
     fontWeight: '600',
     color: '#10B981',
     textAlign: 'center',
   },
   tutorialProgressBar: {
     height: 6,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 3,
     marginBottom: 15,
     overflow: 'hidden',
   },
   tutorialProgressFill: {
     height: '100%',
     backgroundColor: '#10B981',
     borderRadius: 3,
   },
   tutorialSkipButton: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 8,
     padding: 10,
     alignItems: 'center',
   },
   tutorialSkipText: {
     color: '#CCCCCC',
     fontSize: 14,
     fontWeight: '500',
   },

   
   // 👤 PLAYER NAME INPUT STYLES
   nameInputButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 8,
     padding: 12,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
     minWidth: 150,
   },
   nameInputText: {
     color: '#FFFFFF',
     fontSize: 16,
     flex: 1,
   },
   nameInputIcon: {
     fontSize: 16,
     marginLeft: 8,
   },
   
   // 👤 NAME MODAL STYLES
   nameModalContent: {
     backgroundColor: '#1a1a2e',
     borderRadius: 20,
     padding: 25,
     margin: 20,
     borderWidth: 2,
     borderColor: '#4F46E5',
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.5,
     shadowRadius: 10,
     elevation: 10,
   },
   nameModalTitle: {
     fontSize: 22,
     fontWeight: 'bold',
     color: '#4F46E5',
     textAlign: 'center',
     marginBottom: 10,
   },
   nameModalDescription: {
     fontSize: 16,
     color: '#CCCCCC',
     textAlign: 'center',
     marginBottom: 20,
     lineHeight: 22,
   },
   nameTextInput: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 10,
     padding: 15,
     fontSize: 18,
     color: '#FFFFFF',
     textAlign: 'center',
     marginBottom: 20,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   nameModalButtons: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 10,
   },
   nameModalButton: {
     flex: 1,
     padding: 15,
     borderRadius: 10,
     alignItems: 'center',
   },
   nameModalCancelButton: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   nameModalSaveButton: {
     backgroundColor: '#4F46E5',
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   nameModalCancelText: {
     color: '#CCCCCC',
     fontSize: 16,
     fontWeight: '600',
   },
   nameModalSaveText: {
     color: '#FFFFFF',
     fontSize: 16,
     fontWeight: '600',
   },
   playerNameDisplay: {
     fontSize: 18,
     color: '#4F46E5',
     fontWeight: '600',
     textAlign: 'center',
     marginVertical: 5,
   },
   
   // 🔍 DEBUG CONTROL STYLES
   debugControls: {
     position: 'absolute',
     bottom: 50,
     right: 20,
     zIndex: 9999,
     flexDirection: 'column',
     gap: 10,
   },
   debugButton: {
     backgroundColor: 'rgba(255, 0, 0, 0.8)',
     borderRadius: 8,
     padding: 8,
     minWidth: 120,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#FF0000',
   },
   debugButtonText: {
     color: '#FFFFFF',
     fontSize: 12,
     fontWeight: 'bold',
   },

   // 🏆 LEADERBOARD STYLES
   leaderboardStats: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     marginBottom: 20,
     paddingVertical: 15,
     backgroundColor: 'rgba(255, 215, 0, 0.1)',
     borderRadius: 12,
     borderWidth: 1,
     borderColor: 'rgba(255, 215, 0, 0.3)',
   },
   leaderboardEmpty: {
     alignItems: 'center',
     paddingVertical: 40,
     opacity: 0.6,
   },
   leaderboardEmptyIcon: {
     fontSize: 48,
     marginBottom: 10,
   },
   leaderboardEmptyTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#FFFFFF',
     marginBottom: 5,
   },
   leaderboardEmptyDesc: {
     fontSize: 14,
     color: '#AAAAAA',
     textAlign: 'center',
   },
   leaderboardEntry: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 15,
     marginVertical: 5,
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 12,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   leaderboardCurrentPlayer: {
     backgroundColor: 'rgba(255, 215, 0, 0.15)',
     borderColor: 'rgba(255, 215, 0, 0.4)',
   },
   leaderboardRank: {
     width: 50,
     alignItems: 'center',
   },
   leaderboardRankText: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#FFD700',
   },
   leaderboardInfo: {
     flex: 1,
     marginLeft: 15,
   },
   leaderboardPlayerName: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#FFFFFF',
     marginBottom: 2,
   },
   leaderboardScore: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#FFD700',
     marginBottom: 2,
   },
   leaderboardDetails: {
     fontSize: 12,
     color: '#AAAAAA',
   },

   // 🎉 WELCOME SCREEN STYLES - FIRST TIME USER EXPERIENCE
   welcomeContainer: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0, 0, 0, 0.95)',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 10000,
   },

   // 🎮 EPIC NINTENDO-STYLE CUSTOMIZATION STYLES
   epicCustomizeContainer: {
     backgroundColor: '#16213e',
     borderRadius: 25,
     padding: 0,
     width: '95%',
     maxWidth: 450,
     maxHeight: '90%',
     borderWidth: 3,
     borderColor: 'rgba(255, 214, 10, 0.6)',
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 15 },
     shadowOpacity: 0.8,
     shadowRadius: 25,
     elevation: 30,
     overflow: 'hidden',
   },
   epicCustomizeHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 20,
     backgroundColor: 'rgba(255, 214, 10, 0.1)',
     borderBottomWidth: 2,
     borderBottomColor: 'rgba(255, 214, 10, 0.3)',
   },
   epicHeaderLeft: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   epicCustomizeEmoji: {
     fontSize: 32,
     marginRight: 12,
   },
   epicCustomizeTitle: {
     fontSize: 22,
     fontWeight: '900',
     color: '#FFD60A',
     textShadowColor: 'rgba(255, 214, 10, 0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 10,
   },
   epicCloseButton: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 20,
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   epicCloseButtonText: {
     fontSize: 18,
     color: '#FFFFFF',
     fontWeight: 'bold',
   },
   epicCustomizeTabs: {
     flexDirection: 'row',
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     marginHorizontal: 20,
     marginTop: 15,
     borderRadius: 15,
     padding: 5,
   },
   epicTab: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     paddingHorizontal: 8,
     borderRadius: 10,
   },
   epicTabActive: {
     backgroundColor: '#FFD60A',
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.5,
     shadowRadius: 5,
     elevation: 3,
   },
   epicTabEmoji: {
     fontSize: 16,
     marginRight: 4,
   },
   epicTabText: {
     fontSize: 12,
     fontWeight: '700',
     color: '#1a1a2e',
   },
   epicPreviewSection: {
     padding: 20,
     alignItems: 'center',
   },
   epicPreviewTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: '#FFD60A',
     marginBottom: 15,
   },
   epicPreviewStage: {
     backgroundColor: 'rgba(0, 0, 0, 0.3)',
     borderRadius: 20,
     padding: 20,
     borderWidth: 2,
     borderColor: 'rgba(255, 214, 10, 0.3)',
     alignItems: 'center',
   },
   epicPreviewBackground: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 10,
   },
   epicPreviewPlayer: {
     width: 30,
     height: 30,
     borderRadius: 15,
     backgroundColor: '#8B5CF6',
     borderWidth: 2,
     borderColor: '#FFFFFF',
     marginRight: 15,
   },
   epicPreviewTrail: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   epicTrailDot: {
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: '#FFD60A',
     marginHorizontal: 2,
   },
   epicPreviewLabel: {
     fontSize: 14,
     color: '#FFFFFF',
     fontWeight: '600',
   },
   epicOrbsContainer: {
     flex: 1,
     paddingHorizontal: 20,
   },
   epicOrbsGrid: {
     paddingBottom: 20,
   },
   epicOrbCard: {
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 20,
     marginBottom: 15,
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.1)',
     overflow: 'hidden',
   },
   epicOrbSelected: {
     borderColor: '#FFD60A',
     backgroundColor: 'rgba(255, 214, 10, 0.1)',
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 5 },
     shadowOpacity: 0.6,
     shadowRadius: 15,
     elevation: 8,
   },
   epicOrbCardContent: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 20,
   },
   epicOrb: {
     width: 50,
     height: 50,
     borderRadius: 25,
     marginRight: 15,
     borderWidth: 3,
     borderColor: '#FFFFFF',
     justifyContent: 'center',
     alignItems: 'center',
     position: 'relative',
   },
   epicMasterOrb: {
     backgroundColor: '#8B5CF6',
     shadowColor: '#A855F7',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.8,
     shadowRadius: 10,
     elevation: 8,
   },
   epicOrbCore: {
     width: 20,
     height: 20,
     borderRadius: 10,
     backgroundColor: '#FFFFFF',
     position: 'absolute',
   },
   epicOrbSparkle: {
     position: 'absolute',
     fontSize: 12,
     top: -2,
     right: -2,
   },
   epicOrbIcon: {
     position: 'absolute',
     fontSize: 16,
   },
   epicOrbName: {
     fontSize: 18,
     fontWeight: '700',
     color: '#FFFFFF',
     flex: 1,
   },
   epicOrbStatus: {
     position: 'absolute',
     top: 15,
     right: 15,
     backgroundColor: '#22C55E',
     borderRadius: 15,
     width: 30,
     height: 30,
     justifyContent: 'center',
     alignItems: 'center',
   },
   epicOrbEquipped: {
     fontSize: 16,
     color: '#FFFFFF',
     fontWeight: 'bold',
   },
   epicOrbRarity: {
     position: 'absolute',
     top: 10,
     right: 10,
     backgroundColor: 'rgba(255, 214, 10, 0.9)',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 8,
   },
   epicOrbRarityText: {
     fontSize: 10,
     fontWeight: '900',
     color: '#1a1a2e',
     letterSpacing: 0.5,
   },
   epicOrbLocked: {
     position: 'absolute',
     top: 10,
     right: 10,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 8,
     maxWidth: 120,
   },
   epicOrbUnlockText: {
     fontSize: 16,
     color: '#AAAAAA',
   },
   epicAchievementText: {
     fontSize: 10,
     color: '#AAAAAA',
     textAlign: 'center',
     lineHeight: 12,
   },
   welcomeModal: {
     backgroundColor: '#16213e',
     borderRadius: 20,
     padding: 25,
     width: '85%',
     maxWidth: 400,
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 214, 10, 0.6)',
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 5 },
     shadowOpacity: 0.8,
     shadowRadius: 15,
     elevation: 20,
   },
   welcomeTitle: {
     fontSize: 26,
     fontWeight: '900',
     color: '#FFD60A',
     textAlign: 'center',
     marginBottom: 8,
     textShadowColor: 'rgba(255, 214, 10, 0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 10,
   },
   welcomeSubtitle: {
     fontSize: 16,
     color: '#FFFFFF',
     textAlign: 'center',
     marginBottom: 15,
     fontStyle: 'italic',
     opacity: 0.9,
   },
   welcomeDescription: {
     fontSize: 16,
     color: 'rgba(255, 255, 255, 0.8)',
     textAlign: 'center',
     lineHeight: 24,
     marginBottom: 30,
     paddingHorizontal: 10,
   },
   namePrompt: {
     fontSize: 18,
     color: '#FFD60A',
     fontWeight: '700',
     textAlign: 'center',
     marginBottom: 15,
   },
   welcomeNameInput: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 12,
     padding: 15,
     fontSize: 16,
     color: '#FFFFFF',
     textAlign: 'center',
     width: '100%',
     marginBottom: 20,
     borderWidth: 2,
     borderColor: 'rgba(255, 214, 10, 0.4)',
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 5,
   },
   welcomeButton: {
     backgroundColor: '#FFD60A',
     borderRadius: 15,
     padding: 15,
     width: '100%',
     alignItems: 'center',
     marginBottom: 12,
     shadowColor: '#FFD60A',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.6,
     shadowRadius: 8,
     elevation: 6,
   },
   welcomeButtonDisabled: {
     backgroundColor: 'rgba(255, 214, 10, 0.3)',
     shadowOpacity: 0.2,
   },
   welcomeButtonText: {
     fontSize: 16,
     fontWeight: '900',
     color: '#1a1a2e',
     letterSpacing: 0.5,
   },
   welcomeSkipButton: {
     padding: 8,
   },
   welcomeSkipText: {
     fontSize: 13,
     color: 'rgba(255, 255, 255, 0.6)',
     textDecorationLine: 'underline',
   },

   // 🎨 NEW ORB SYSTEM STYLES - NINTENDO-LEVEL BEAUTY!
   epicRarityBadge: {
     position: 'absolute',
     top: 5,
     right: 5,
     backgroundColor: '#8B5CF6',
     borderRadius: 8,
     paddingHorizontal: 6,
     paddingVertical: 2,
     zIndex: 10,
   },
   epicRarityText: {
     fontSize: 8,
     fontWeight: '900',
     color: '#FFFFFF',
     letterSpacing: 0.5,
   },

   // 🏁 MARIO RUN INSPIRED COURSE MODAL STYLES!
   courseSelectionModal: {
     backgroundColor: '#16213e',
     borderRadius: 20,
     padding: 20,
     width: '90%',
     maxWidth: 400,
     maxHeight: '80%',
     borderWidth: 2,
     borderColor: '#3B82F6',
     shadowColor: '#3B82F6',
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.6,
     shadowRadius: 15,
     elevation: 15,
   },
   customizationTitle: {
     fontSize: 24,
     fontWeight: '900',
     color: '#3B82F6',
     textAlign: 'center',
     marginBottom: 8,
     textShadowColor: 'rgba(59, 130, 246, 0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 8,
   },
   customizationSubtitle: {
     fontSize: 16,
     color: 'rgba(255, 255, 255, 0.8)',
     textAlign: 'center',
     marginBottom: 20,
     fontStyle: 'italic',
   },
   skinOption: {
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 12,
     padding: 15,
     marginBottom: 10,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   skinName: {
     fontSize: 16,
     fontWeight: '700',
     color: '#FFFFFF',
     marginBottom: 4,
   },
   skinDescription: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.7)',
   },
   closeButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#FFFFFF',
   },
   courseModalFooter: {
     marginTop: 20,
     paddingTop: 15,
     borderTopWidth: 1,
     borderTopColor: 'rgba(255, 255, 255, 0.1)',
   },
   courseModalTip: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.6)',
     textAlign: 'center',
     fontStyle: 'italic',
   },
   epicOrbLockText: {
     fontSize: 10,
     color: '#AAAAAA',
     textAlign: 'center',
   },
   epicNewBadge: {
     position: 'absolute',
     top: 5,
     left: 5,
     backgroundColor: '#EF4444',
     borderRadius: 8,
     paddingHorizontal: 6,
     paddingVertical: 2,
     zIndex: 10,
   },
   epicNewText: {
     fontSize: 8,
     fontWeight: '900',
     color: '#FFFFFF',
     letterSpacing: 0.5,
   },
   epicOrbSparkles: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     justifyContent: 'center',
     alignItems: 'center',
   },
   epicSparkle: {
     fontSize: 12,
     position: 'absolute',
   },
   epicOrbLockText: {
     fontSize: 10,
     color: '#9CA3AF',
     textAlign: 'center',
     marginTop: 4,
     fontStyle: 'italic',
   },

   // 🎉 MARIO RUN INSPIRED COURSE COMPLETION STYLES!
   confettiContainer: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     overflow: 'hidden',
     pointerEvents: 'none',
   },
   confettiPiece: {
     position: 'absolute',
     width: 10,
     height: 10,
     top: -10,
     borderRadius: 5,
     opacity: 0.8,
   },
   clearedModal: {
     backgroundColor: '#0F172A',
     borderRadius: 25,
     padding: 30,
     width: '90%',
     maxWidth: 400,
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#FFD700',
     shadowColor: '#FFD700',
     shadowOffset: { width: 0, height: 10 },
     shadowOpacity: 1,
     shadowRadius: 30,
     elevation: 25,
   },
   clearedHeader: {
     alignItems: 'center',
     marginBottom: 30,
   },
   clearedTitle: {
     fontSize: 56,
     fontWeight: '900',
     color: '#FFD700',
     textAlign: 'center',
     letterSpacing: 4,
     textShadowColor: '#FF8C00',
     textShadowOffset: { width: 0, height: 4 },
     textShadowRadius: 12,
     marginBottom: 15,
   },
   clearedBadge: {
     backgroundColor: '#3B82F6',
     borderRadius: 20,
     paddingHorizontal: 20,
     paddingVertical: 8,
     marginBottom: 10,
     borderWidth: 2,
     borderColor: '#FFFFFF',
     shadowColor: '#3B82F6',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.6,
     shadowRadius: 8,
   },
   clearedBadgeText: {
     fontSize: 16,
     fontWeight: '700',
     color: '#FFFFFF',
     letterSpacing: 1,
   },
   clearedSubtitle: {
     fontSize: 18,
     color: '#94A3B8',
     fontStyle: 'italic',
     textAlign: 'center',
   },
   starContainer: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 25,
     paddingVertical: 10,
   },
   starWrapper: {
     alignItems: 'center',
     justifyContent: 'center',
     marginHorizontal: 8,
     position: 'relative',
   },
   starIcon: {
     fontSize: 48,
     textAlign: 'center',
   },
   starGlow: {
     position: 'absolute',
     width: 60,
     height: 60,
     borderRadius: 30,
     backgroundColor: '#FFD700',
     opacity: 0.3,
     top: -6,
     left: -6,
   },
   
   // 📊 COMPLETION STATS STYLES
   completionStats: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     width: '100%',
     marginBottom: 30,
     paddingHorizontal: 10,
   },
   statCard: {
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.05)',
     borderRadius: 15,
     padding: 15,
     minWidth: 80,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   statIcon: {
     fontSize: 24,
     marginBottom: 8,
   },
   statValue: {
     fontSize: 20,
     fontWeight: '900',
     color: '#FFD700',
     marginBottom: 4,
     textAlign: 'center',
   },
   statLabel: {
     fontSize: 12,
     color: '#94A3B8',
     textAlign: 'center',
     fontWeight: '600',
   },
   
   // 🎮 COMPLETION BUTTONS STYLES
   completionButtons: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     width: '100%',
     paddingHorizontal: 10,
   },
   completionButton: {
     flex: 0.48,
     backgroundColor: '#1E293B',
     borderRadius: 15,
     padding: 18,
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.1)',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 6,
   },
   continueButton: {
     backgroundColor: '#22C55E',
     borderColor: '#16A34A',
     shadowColor: '#22C55E',
   },
   retryButton: {
     backgroundColor: '#F59E0B',
     borderColor: '#D97706',
     shadowColor: '#F59E0B',
   },
   completionButtonIcon: {
     fontSize: 20,
     marginBottom: 6,
   },
   completionButtonText: {
     fontSize: 14,
     fontWeight: '700',
     color: '#FFFFFF',
     textAlign: 'center',
   },

   // 🎮 MARIO RUN INSPIRED IN-GAME UI STYLES!
   courseHeader: {
     position: 'absolute',
     top: 60,
     left: 20,
     right: 20,
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(0, 0, 0, 0.7)',
     borderRadius: 15,
     padding: 12,
     borderWidth: 2,
     borderColor: '#FFD700',
   },
   courseNumberBadge: {
     backgroundColor: '#3B82F6',
     borderRadius: 12,
     padding: 8,
     marginRight: 12,
     alignItems: 'center',
     minWidth: 50,
     borderWidth: 2,
     borderColor: '#FFFFFF',
   },
   courseNumberText: {
     fontSize: 10,
     color: '#FFFFFF',
     fontWeight: '600',
     marginBottom: 2,
   },
   courseBigNumber: {
     fontSize: 18,
     color: '#FFFFFF',
     fontWeight: '900',
   },
   courseInfoPanel: {
     flex: 1,
   },
   courseNameText: {
     fontSize: 16,
     color: '#FFFFFF',
     fontWeight: '700',
     marginBottom: 2,
   },
   courseTargetText: {
     fontSize: 12,
     color: '#94A3B8',
     fontWeight: '500',
   },
   
   // Progress Bar Styles
   progressBarContainer: {
     position: 'absolute',
     top: 140,
     left: 20,
     right: 20,
     backgroundColor: 'rgba(0, 0, 0, 0.7)',
     borderRadius: 12,
     padding: 10,
     borderWidth: 2,
     borderColor: '#4ADE80',
   },
   progressBarBG: {
     height: 8,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 4,
     marginBottom: 6,
     overflow: 'hidden',
   },
   progressBarFill: {
     height: '100%',
     backgroundColor: '#4ADE80',
     borderRadius: 4,
     shadowColor: '#4ADE80',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.8,
     shadowRadius: 4,
   },
   progressText: {
     fontSize: 12,
     color: '#FFFFFF',
     textAlign: 'center',
     fontWeight: '600',
   },
   
   // Coin Counter Styles
   coinCounterPanel: {
     position: 'absolute',
     top: 200,
     right: 20,
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 215, 0, 0.9)',
     borderRadius: 20,
     padding: 8,
     paddingHorizontal: 12,
     borderWidth: 2,
     borderColor: '#FFD700',
     shadowColor: '#FFD700',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.8,
     shadowRadius: 4,
   },
   coinIcon: {
     marginRight: 6,
   },
   coinEmoji: {
     fontSize: 16,
   },
   coinCountText: {
     fontSize: 16,
     color: '#1F2937',
     fontWeight: '900',
   },
   coinTotalText: {
     fontSize: 14,
     color: '#6B7280',
     fontWeight: '600',
   },
 });
