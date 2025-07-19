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

// 🎯 GAME MODES (from Screenshot 10)
enum GameMode {
  CLASSIC = 'classic',
  TIME_ATTACK = 'time_attack',
  POWER_UP_RUSH = 'power_up_rush',
  HARDCORE = 'hardcore',
  ZEN = 'zen',
}

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
  const [audioEnabled, setAudioEnabled] = useState(true);

  // 🎯 GAME OBJECTS
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // 🎪 ANIMATIONS
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const screenShake = useRef(new Animated.Value(0)).current;

  // 🎮 GAME LOOP REFS
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleSpawnRef = useRef<NodeJS.Timeout | null>(null);

  // 🎵 AUDIO FUNCTIONS (placeholder for now)
  const playSound = useCallback((soundName: string) => {
    if (!audioEnabled) return;
    // Audio implementation will come in Phase 4
  }, [audioEnabled]);

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

  // 🎮 CORE GAME MECHANICS
  const flipPlayer = useCallback(() => {
    if (playerState === PlayerState.TRANSITIONING) return;

    const isAtTop = playerState === PlayerState.TOP;
    const targetY = isAtTop ? SAFE_BOTTOM_POSITION : SAFE_TOP_POSITION;
    const newState = isAtTop ? PlayerState.BOTTOM : PlayerState.TOP;

    setPlayerState(PlayerState.TRANSITIONING);
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

  // 🚧 OBSTACLE SPAWNING
  const spawnObstacle = useCallback(() => {
    const newObstacle: Obstacle = {
      id: `obstacle_${Date.now()}`,
      x: SCREEN_WIDTH + 50,
      y: Math.random() * (SCREEN_HEIGHT - SAFE_AREA_TOP - SAFE_AREA_BOTTOM - OBSTACLE_HEIGHT) + SAFE_AREA_TOP,
      width: OBSTACLE_WIDTH,
      height: OBSTACLE_HEIGHT,
      color: '#FF4444',
      type: 'basic',
    };

    setObstacles(prev => [...prev, newObstacle]);
  }, []);

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
    playSound('game_over');

    // Screen shake effect
    Animated.sequence([
      Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: false }),
      Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();
  }, [gameState.distance, gameState.highScore, saveHighScore, playSound, screenShake]);

  // 🚀 START GAME
  const startGame = useCallback(() => {
    // Reset player
    playerY.setValue(SAFE_BOTTOM_POSITION);
    currentPlayerY.current = SAFE_BOTTOM_POSITION;
    setPlayerState(PlayerState.BOTTOM);

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
      // Update distance and speed
      setGameState(prev => ({
        ...prev,
        distance: prev.distance + prev.speed * 0.1,
        speed: BASE_SPEED + (prev.distance * 0.001),
        skill: Math.min(10, prev.distance / 100),
        flow: Math.min(100, (prev.distance / 10) % 100),
        maxSpeed: Math.max(prev.maxSpeed, prev.speed),
      }));

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
  }, [loadHighScore]);

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
                <Text style={styles.startButtonText}>TAP ANYWHERE TO START</Text>
                <Text style={styles.startButtonSubtext}>🎮 Ready for action? 🎮</Text>
              </Animated.View>

              {/* Menu Cards Grid (from Screenshot 3) */}
              <View style={styles.menuGrid}>
                {/* Mode Card */}
                <TouchableOpacity
                  style={[styles.menuCard, styles.modeCard]}
                  onPress={() => setShowModeSelection(true)}
                >
                  <Text style={styles.cardEmoji}>🎮</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>MODE</Text>
                  </View>
                  <Text style={styles.cardTitle}>Classic</Text>
                  <Text style={styles.cardDescription}>Tap to change mode</Text>
                </TouchableOpacity>

                {/* Achievements Card */}
                <TouchableOpacity
                  style={[styles.menuCard, styles.achievementCard]}
                  onPress={() => setShowAchievements(true)}
                >
                  <Text style={styles.cardEmoji}>🏆</Text>
                  <View style={styles.cardProgress}>
                    <Text style={styles.cardProgressText}>0/16</Text>
                  </View>
                  <Text style={styles.cardTitle}>Achievements</Text>
                  <Text style={styles.cardDescription}>Unlock rewards & glory</Text>
                </TouchableOpacity>

                {/* Customize Card */}
                <TouchableOpacity
                  style={[styles.menuCard, styles.customizeCard]}
                  onPress={() => setShowCustomization(true)}
                >
                  <Text style={styles.cardEmoji}>🎨</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>NEW</Text>
                  </View>
                  <Text style={styles.cardTitle}>Customize</Text>
                  <Text style={styles.cardDescription}>Skins • Trails • Effects</Text>
                </TouchableOpacity>

                {/* Share Card */}
                <TouchableOpacity style={[styles.menuCard, styles.shareCard]}>
                  <Text style={styles.cardEmoji}>📱</Text>
                  <Text style={styles.cardTitle}>Share Game</Text>
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
              <View style={styles.gameOverModal}>
                <Text style={styles.gameOverTitle}>Game Over</Text>
                <Text style={styles.gameOverDistance}>Distance: {Math.floor(gameState.distance)}m</Text>
                <Text style={styles.gameOverSpeed}>Max Speed: x{gameState.maxSpeed.toFixed(1)}</Text>

                {/* Game Over Buttons */}
                <View style={styles.gameOverButtons}>
                  <TouchableOpacity style={styles.gameOverButton}>
                    <Text style={styles.gameOverButtonIcon}>🎬</Text>
                    <Text style={styles.gameOverButtonText}>Continue</Text>
                    <Text style={styles.gameOverButtonSubtext}>Watch ad to continue</Text>
                  </TouchableOpacity>

                  <View style={styles.gameOverButtonRow}>
                    <TouchableOpacity style={styles.gameOverButtonSmall}>
                      <Text style={styles.gameOverButtonIcon}>🔄</Text>
                      <Text style={styles.gameOverButtonText}>Restart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gameOverButtonSmall}>
                      <Text style={styles.gameOverButtonIcon}>📤</Text>
                      <Text style={styles.gameOverButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.gameOverButtonRow}>
                    <TouchableOpacity 
                      style={styles.gameOverButtonSmall}
                      onPress={() => setGameState(prev => ({ ...prev, isGameOver: false }))}
                    >
                      <Text style={styles.gameOverButtonIcon}>🏠</Text>
                      <Text style={styles.gameOverButtonText}>Menu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.gameOverButtonSmall}
                      onPress={() => setAudioEnabled(!audioEnabled)}
                    >
                      <Text style={styles.gameOverButtonIcon}>{audioEnabled ? '🔊' : '🔇'}</Text>
                      <Text style={styles.gameOverButtonText}>Audio</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* 🎮 MODE SELECTION MODAL (from Screenshot 10) */}
        <Modal visible={showModeSelection} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Game Mode</Text>
              
              <TouchableOpacity style={[styles.modeOption, styles.modeSelected]}>
                <Text style={styles.modeEmoji}>🎮</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Classic</Text>
                  <Text style={styles.modeDescription}>The original endless runner experience</Text>
                </View>
                <Text style={styles.modeCheck}>✓</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeOption}>
                <Text style={styles.modeEmoji}>⏰</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Time Attack</Text>
                  <Text style={styles.modeDescription}>Survive 60 seconds, score based on distance + style</Text>
                  <Text style={styles.modeFeature}>⏱️ 60s time limit</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeOption}>
                <Text style={styles.modeEmoji}>⚡</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Power-up Rush</Text>
                  <Text style={styles.modeDescription}>Chaos mode with extra power-ups everywhere!</Text>
                  <Text style={styles.modeFeature}>⚡ Extra power-ups</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeOption}>
                <Text style={styles.modeEmoji}>💀</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Hardcore</Text>
                  <Text style={styles.modeDescription}>No power-ups, pure skill and reflexes</Text>
                  <Text style={styles.modeFeature}>🚫 No power-ups</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeOption}>
                <Text style={styles.modeEmoji}>🧘</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>Zen Mode</Text>
                  <Text style={styles.modeDescription}>Slower pace, relaxing endless journey</Text>
                </View>
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
                  <Text style={styles.achievementStatNumber}>0</Text>
                  <Text style={styles.achievementStatLabel}>Unlocked</Text>
                </View>
                <View style={styles.achievementStatItem}>
                  <Text style={styles.achievementStatNumber}>16</Text>
                  <Text style={styles.achievementStatLabel}>Total</Text>
                </View>
              </View>

              <ScrollView style={styles.achievementList}>
                <Text style={styles.achievementCategory}>DISTANCE</Text>
                
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>🔒</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>First Flip</Text>
                    <Text style={styles.achievementDescription}>Make your first gravity flip</Text>
                    <View style={styles.achievementProgress}>
                      <Text style={styles.achievementProgressText}>0 / 1</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>🔒</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Century Runner</Text>
                    <Text style={styles.achievementDescription}>Travel 100 meters in a single run</Text>
                    <View style={styles.achievementProgress}>
                      <Text style={styles.achievementProgressText}>0 / 100</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>🔒</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Distance Demon</Text>
                    <Text style={styles.achievementDescription}>Travel 500 meters in a single run</Text>
                    <View style={styles.achievementProgress}>
                      <Text style={styles.achievementProgressText}>0 / 500</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>🔒</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Kilometer King</Text>
                    <Text style={styles.achievementDescription}>Travel 1000 meters in a single run</Text>
                    <View style={styles.achievementProgress}>
                      <Text style={styles.achievementProgressText}>0 / 1000</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.achievementCategory}>SURVIVAL</Text>
                
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>🔒</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Minute Master</Text>
                    <Text style={styles.achievementDescription}>Survive for 60 seconds in any mode</Text>
                    <View style={styles.achievementProgress}>
                      <Text style={styles.achievementProgressText}>0 / 60</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    marginTop: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD60A',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // 📊 STATS ROW
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD60A',
  },

  // 🚀 START BUTTON
  startButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  startButtonSubtext: {
    fontSize: 14,
    color: '#1a1a2e',
    opacity: 0.8,
  },

  // 🎴 MENU CARDS GRID
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  menuCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  modeCard: {
    borderColor: '#FFD60A',
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
  },
  achievementCard: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  customizeCard: {
    borderColor: '#FFD60A',
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
  },
  shareCard: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD60A',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  cardProgress: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardProgressText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },

  // 🟣 BOTTOM ORB
  bottomOrb: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
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
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4081',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameOverDistance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  gameOverSpeed: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 30,
  },

  // 🔘 GAME OVER BUTTONS
  gameOverButtons: {
    width: '100%',
  },
  gameOverButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
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
});
