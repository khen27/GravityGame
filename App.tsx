import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🎮 GAME CONSTANTS
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 100;
const BASE_SPEED = 2;
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

// 🎯 GAME MODES (from Screenshot 10)
enum GameMode {
  CLASSIC = 'classic',
  TIME_ATTACK = 'time_attack',
  POWER_UP_RUSH = 'power_up_rush',
  HARDCORE = 'hardcore',
  ZEN = 'zen',
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
    powerUpRush: 'Power-up Rush',
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

interface TrailEffect {
  id: string;
  name: string;
  type: string;
  unlocked: boolean;
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

// ⭐ POWER-UP TYPES
interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'score' | 'shield' | 'slow_time';
  collected: boolean;
}

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
  
  // 🌍 LANGUAGE SYSTEM
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.ENGLISH);
  const t = TRANSLATIONS[currentLanguage];

     // 🎯 GAME OBJECTS
   const [obstacles, setObstacles] = useState<Obstacle[]>([]);
   const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
   
   // 🏆 ACHIEVEMENT TRACKING
   const [totalFlips, setTotalFlips] = useState(0);
   const [gamesPlayed, setGamesPlayed] = useState(0);

  // 🎪 ANIMATIONS
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const screenShake = useRef(new Animated.Value(0)).current;
  const gameOverFadeAnim = useRef(new Animated.Value(0)).current;
  const gameOverScaleAnim = useRef(new Animated.Value(0.8)).current;

  // 🎮 GAME LOOP REFS
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleSpawnRef = useRef<NodeJS.Timeout | null>(null);

     // 🎵 AUDIO FUNCTIONS (placeholder for now)
   const playSound = useCallback((soundName: string) => {
     if (!audioEnabled) return;
     // Audio implementation will come in Phase 4
   }, [audioEnabled]);

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

  // 🎮 CORE GAME MECHANICS
  const flipPlayer = useCallback(() => {
    if (playerState === PlayerState.TRANSITIONING) return;

    const isAtTop = playerState === PlayerState.TOP;
    const targetY = isAtTop ? SAFE_BOTTOM_POSITION : SAFE_TOP_POSITION;
    const newState = isAtTop ? PlayerState.BOTTOM : PlayerState.TOP;

         setPlayerState(PlayerState.TRANSITIONING);
     setTotalFlips(prev => prev + 1);
     triggerHaptic('light');
     playSound('flip');

    // Haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics failed
    }

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
         ]).start(() => {
       setPlayerState(newState);
       currentPlayerY.current = targetY;
       playerRotation.setValue(0); // Reset rotation
     });
  }, [playerState, playSound, playerY, playerScale, playerRotation]);

  // 🚧 OBSTACLE SPAWNING WITH MODE-SPECIFIC BEHAVIORS
  const spawnObstacle = useCallback(() => {
    // MODE-SPECIFIC OBSTACLE PROPERTIES
    let obstacleCount = 1;
    let obstacleSize = OBSTACLE_WIDTH;
    let obstacleColor = '#FF4444';
    
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
        obstacleColor = '#FF4444';
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

  // 💥 COLLISION DETECTION
  const checkCollision = useCallback(() => {
    const playerBounds = {
      x: 50 - PLAYER_SIZE / 2,
      y: currentPlayerY.current - PLAYER_SIZE / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    for (const obstacle of obstacles) {
      if (
        playerBounds.x < obstacle.x + obstacle.width &&
        playerBounds.x + playerBounds.width > obstacle.x &&
        playerBounds.y < obstacle.y + obstacle.height &&
        playerBounds.y + playerBounds.height > obstacle.y
      ) {
        return true;
      }
    }
    return false;
  }, [obstacles]);

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
   triggerHaptic('error');
   playSound('game_over');

   // Screen shake effect
   Animated.sequence([
     Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: false }),
     Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: false }),
     Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: false }),
   ]).start();

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
  }, [gameState.distance, gameState.highScore, saveHighScore, playSound, screenShake]);

     // 🚀 START GAME
   const startGame = useCallback(() => {
     // Reset player
     playerY.setValue(SAFE_BOTTOM_POSITION);
     currentPlayerY.current = SAFE_BOTTOM_POSITION;
     setPlayerState(PlayerState.BOTTOM);

     // Reset animations
     gameOverFadeAnim.setValue(0);
     gameOverScaleAnim.setValue(0.8);

    // Reset game state
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      distance: 0,
      speed: BASE_SPEED,
      skill: 0,
      flow: 0,
      maxSpeed: BASE_SPEED,
    }));

    // Clear objects
    setObstacles([]);
    setPowerUps([]);

    playSound('start');
  }, [playerY, playSound]);

  // 🎮 GAME LOOP
  useEffect(() => {
    if (!gameState.isPlaying) return;

    gameLoopRef.current = setInterval(() => {
      // Update distance and speed with MODE-SPECIFIC MECHANICS
      setGameState(prev => {
        let speedMultiplier = 1;
        let skillGainMultiplier = 1;
        let distanceMultiplier = 1;
        
        // MODE-SPECIFIC GAMEPLAY MECHANICS
        switch (prev.currentMode) {
          case GameMode.TIME_ATTACK:
            speedMultiplier = 1.5; // 50% faster
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
        
        return {
          ...prev,
          distance: prev.distance + (prev.speed * 0.1 * distanceMultiplier),
          speed: (BASE_SPEED + (prev.distance * 0.001)) * speedMultiplier,
          skill: Math.min(10, (prev.distance / 100) * skillGainMultiplier),
          flow: Math.min(100, (prev.distance / 10) % 100),
          maxSpeed: Math.max(prev.maxSpeed, prev.speed),
        };
      });

      // Move obstacles
      setObstacles(prev => 
        prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - gameState.speed,
        })).filter(obstacle => obstacle.x > -100)
      );

      // Check collisions
      if (checkCollision()) {
        gameOver();
      }
    }, 16); // ~60fps

    // Spawn obstacles
    obstacleSpawnRef.current = setInterval(() => {
      spawnObstacle();
    }, 2000);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (obstacleSpawnRef.current) clearInterval(obstacleSpawnRef.current);
    };
  }, [gameState.isPlaying, gameState.speed, checkCollision, gameOver, spawnObstacle]);

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

  // 💾 LOAD HIGH SCORE ON MOUNT
  useEffect(() => {
    loadHighScore();
    loadLanguage();
  }, [loadHighScore, loadLanguage]);

  // 🎮 TOUCH HANDLER
  const handleTouch = useCallback(() => {
    if (gameState.isPlaying) {
      flipPlayer();
    } else if (gameState.isGameOver) {
      setGameState(prev => ({ ...prev, isGameOver: false }));
    } else {
      startGame();
    }
  }, [gameState.isPlaying, gameState.isGameOver, flipPlayer, startGame]);

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <Animated.View style={[styles.gameArea, { transform: [{ translateX: screenShake }] }]}>
          {/* 🎮 GAMEPLAY SCREEN */}
          {gameState.isPlaying && (
            <>
              {/* Game UI */}
              <View style={styles.gameUI}>
                <Text style={styles.distanceText}>{Math.floor(gameState.distance)}m</Text>
                <Text style={styles.speedText}>x{gameState.speed.toFixed(1)}</Text>
                <Text style={styles.bestText}>Best: {gameState.highScore}m</Text>
              </View>

              {/* Skill/Flow Meter (from screenshots) */}
              <View style={styles.skillMeter}>
                <Text style={styles.skillText}>🎯 Skill: {gameState.skill.toFixed(1)}/10</Text>
                <Text style={styles.flowText}>🌀 Flow: {Math.floor(gameState.flow)}%</Text>
                <View style={styles.flowBar}>
                  <View style={[styles.flowProgress, { width: `${gameState.flow}%` }]} />
                </View>
              </View>

              {/* Player */}
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
                                 <View style={styles.gameOverHeader}>
                   <Text style={styles.gameOverTitle}>💀 {t.gameOver}</Text>
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
                      onPress={() => setGameState(prev => ({ ...prev, isGameOver: false }))}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.gameOverButtonIcon}>🏠</Text>
                      <Text style={styles.gameOverButtonText}>Menu</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.gameOverButtonSmall, audioEnabled ? styles.audioEnabled : styles.audioDisabled]}
                      onPress={() => setAudioEnabled(!audioEnabled)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.gameOverButtonIcon}>{audioEnabled ? '🔊' : '🔇'}</Text>
                      <Text style={styles.gameOverButtonText}>Audio</Text>
                    </TouchableOpacity>
                  </View>
                                 </View>
               </Animated.View>
             </View>
           )}

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

        {/* 🎨 CUSTOMIZATION MODAL */}
         <Modal visible={showCustomization} animationType="slide" transparent>
           <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
               <View style={styles.achievementHeader}>
                 <Text style={styles.modalTitle}>🎨 Customize</Text>
                 <TouchableOpacity onPress={() => setShowCustomization(false)}>
                   <Text style={styles.closeButton}>×</Text>
                 </TouchableOpacity>
               </View>

               <ScrollView style={styles.achievementList}>
                 <Text style={styles.achievementCategory}>PLAYER SKINS</Text>
                 
                 <View style={styles.customizationGrid}>
                   <TouchableOpacity style={[styles.customizationItem, styles.customizationSelected]}>
                     <View style={[styles.skinPreview, { backgroundColor: '#8B5CF6' }]} />
                     <Text style={styles.customizationName}>Purple Orb</Text>
                     <Text style={styles.customizationStatus}>✓ EQUIPPED</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={[styles.skinPreview, { backgroundColor: '#FF4081' }]} />
                     <Text style={styles.customizationName}>Pink Blast</Text>
                     <Text style={styles.customizationPrice}>🔒 100m</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={[styles.skinPreview, { backgroundColor: '#00BCD4' }]} />
                     <Text style={styles.customizationName}>Cyan Wave</Text>
                     <Text style={styles.customizationPrice}>🔒 250m</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={[styles.skinPreview, { backgroundColor: '#FF9800' }]} />
                     <Text style={styles.customizationName}>Fire Ball</Text>
                     <Text style={styles.customizationPrice}>🔒 500m</Text>
                   </TouchableOpacity>
                 </View>

                 <Text style={styles.achievementCategory}>TRAIL EFFECTS</Text>
                 
                 <View style={styles.customizationGrid}>
                   <TouchableOpacity style={[styles.customizationItem, styles.customizationSelected]}>
                     <View style={styles.trailPreview}>
                       <View style={[styles.trailDot, { backgroundColor: '#FFD60A' }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#FFD60A', opacity: 0.7 }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#FFD60A', opacity: 0.4 }]} />
                     </View>
                     <Text style={styles.customizationName}>Golden Trail</Text>
                     <Text style={styles.customizationStatus}>✓ EQUIPPED</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={styles.trailPreview}>
                       <View style={[styles.trailDot, { backgroundColor: '#00FF66' }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#00FF66', opacity: 0.7 }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#00FF66', opacity: 0.4 }]} />
                     </View>
                     <Text style={styles.customizationName}>Neon Green</Text>
                     <Text style={styles.customizationPrice}>🔒 150m</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={styles.trailPreview}>
                       <View style={[styles.trailDot, { backgroundColor: '#FF0080' }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#FF0080', opacity: 0.7 }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#FF0080', opacity: 0.4 }]} />
                     </View>
                     <Text style={styles.customizationName}>Hot Pink</Text>
                     <Text style={styles.customizationPrice}>🔒 300m</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={styles.trailPreview}>
                       <View style={[styles.trailDot, { backgroundColor: '#8B5CF6' }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#FF4081', opacity: 0.7 }]} />
                       <View style={[styles.trailDot, { backgroundColor: '#00BCD4', opacity: 0.4 }]} />
                     </View>
                     <Text style={styles.customizationName}>Rainbow</Text>
                     <Text style={styles.customizationPrice}>🔒 750m</Text>
                   </TouchableOpacity>
                 </View>

                 <Text style={styles.achievementCategory}>PARTICLE EFFECTS</Text>
                 
                 <View style={styles.customizationGrid}>
                   <TouchableOpacity style={[styles.customizationItem, styles.customizationSelected]}>
                     <View style={styles.particlePreview}>
                       <Text style={styles.particleText}>✨</Text>
                     </View>
                     <Text style={styles.customizationName}>Sparkles</Text>
                     <Text style={styles.customizationStatus}>✓ EQUIPPED</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={styles.particlePreview}>
                       <Text style={styles.particleText}>🔥</Text>
                     </View>
                     <Text style={styles.customizationName}>Fire Burst</Text>
                     <Text style={styles.customizationPrice}>🔒 200m</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={styles.particlePreview}>
                       <Text style={styles.particleText}>❄️</Text>
                     </View>
                     <Text style={styles.customizationName}>Ice Crystals</Text>
                     <Text style={styles.customizationPrice}>🔒 400m</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.customizationItem}>
                     <View style={styles.particlePreview}>
                       <Text style={styles.particleText}>⚡</Text>
                     </View>
                     <Text style={styles.customizationName}>Lightning</Text>
                     <Text style={styles.customizationPrice}>🔒 600m</Text>
                   </TouchableOpacity>
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
                
                                 <View style={[styles.achievementItem, totalFlips >= 1 && styles.achievementUnlocked]}>
                   <Text style={styles.achievementIcon}>{totalFlips >= 1 ? '✅' : '🔒'}</Text>
                   <View style={styles.achievementInfo}>
                     <Text style={styles.achievementTitle}>{t.firstFlip}</Text>
                     <Text style={styles.achievementDescription}>{t.firstFlipDesc}</Text>
                     <View style={styles.achievementProgress}>
                       <Text style={styles.achievementProgressText}>{Math.min(totalFlips, 1)} / 1</Text>
                     </View>
                   </View>
                 </View>

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
    backgroundColor: '#16213e',
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

  // 🎮 PLAYER
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: '#8B5CF6',
    borderRadius: PLAYER_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  // 🚧 OBSTACLES
  obstacle: {
    position: 'absolute',
    borderRadius: 5,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
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
  languageCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    shadowColor: '#4CAF50',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  gameOverModal: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
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
     fontSize: 36,
     fontWeight: 'bold',
     color: '#FF4081',
     marginBottom: 8,
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
     borderRadius: 15,
     padding: 20,
     marginBottom: 15,
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
     fontSize: 32,
     fontWeight: '900',
     color: '#FFD60A',
     textShadowColor: 'rgba(255, 214, 10, 0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 6,
     marginBottom: 5,
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
 });
