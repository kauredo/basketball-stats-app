import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  Game, 
  PlayerStat, 
  WebSocketMessage, 
  StatAction 
} from '../types';
import { basketballAPI } from '../services/api';
import { basketballWebSocket } from '../services/websocket';

// Game status constants to replace the enum reference
const GAME_STATUS = {
  SCHEDULED: 'scheduled',
  PLAYING: 'active',
  PAUSED: 'paused',
  ENDED: 'completed'
} as const;

// Split state and actions for better TypeScript support in SSR
interface GameState {
  // Current game data
  currentGame: Game | null;
  playerStats: PlayerStat[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  
  // Timer state
  timerRunning: boolean;
}

interface GameActions {
  // Actions
  loadGame: (gameId: number) => Promise<void>;
  connectToGame: (gameId: number) => Promise<void>;
  disconnectFromGame: () => void;
  
  // Game control actions
  startGame: () => Promise<void>;
  pauseGame: () => Promise<void>;
  resumeGame: () => Promise<void>;
  endGame: () => Promise<void>;
  
  // Stat recording
  recordStat: (action: StatAction) => Promise<void>;
  
  // Timer controls
  updateTimer: (timeRemaining: number, quarter: number) => void;
  
  // WebSocket event handlers
  handleGameUpdate: (data: WebSocketMessage) => void;
  handleStatUpdate: (data: WebSocketMessage) => void;
  handleTimerUpdate: (data: WebSocketMessage) => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearGame: () => void;
}

// Create a function to connect to a game
function connectToGameWebSocket(gameId: number) {
  if (!basketballWebSocket.isConnected) {
    basketballWebSocket.connect();
  }
  basketballWebSocket.subscribeToGame(gameId);
}

// Create a function to disconnect from a game
function disconnectFromGameWebSocket() {
  basketballWebSocket.unsubscribeFromGame();
}

// Create the game store with singleton pattern to ensure it works in both browser and server
let store: any;

function createGameStore() {
  return create<GameState & GameActions>()(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentGame: null,
      playerStats: [],
      isLoading: false,
      error: null,
      connectionStatus: 'disconnected',
      timerRunning: false,

      // Load game data
      loadGame: async (gameId: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const [gameResponse, statsResponse] = await Promise.all([
            basketballAPI.getGame(gameId),
            basketballAPI.getGameStats(gameId)
          ]);

          set({
            currentGame: gameResponse.game,
            playerStats: statsResponse.stats,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to load game:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load game',
            isLoading: false,
          });
        }
      },

      // WebSocket connection
      connectToGame: async (gameId: number) => {
        set({ connectionStatus: 'connecting' });
        
        try {
          // Load initial game data
          await get().loadGame(gameId);
          
          // Set up connection status handler
          basketballWebSocket.onConnectionStatus((status) => {
            set({ connectionStatus: status });
          });

          // Set up event handlers
          basketballWebSocket.on('game_update', get().handleGameUpdate);
          basketballWebSocket.on('stat_update', get().handleStatUpdate);
          basketballWebSocket.on('timer_update', get().handleTimerUpdate);
          
          // Connect to the game channel
          connectToGameWebSocket(gameId);
          
          set({ connectionStatus: 'connected' });
        } catch (error) {
          console.error('Failed to connect to game:', error);
          set({ 
            connectionStatus: 'error',
            error: error instanceof Error ? error.message : 'Failed to connect to game',
          });
        }
      },

      disconnectFromGame: () => {
        try {
          disconnectFromGameWebSocket();
          set({ connectionStatus: 'disconnected' });
        } catch (error) {
          console.error('Error disconnecting from game:', error);
        }
      },

      // Game control actions
      startGame: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { currentGame } = get();
          if (!currentGame) throw new Error('No game loaded');
          
          const response = await basketballAPI.startGame(currentGame.id);
          
          set({
            currentGame: response.game,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to start game:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to start game',
            isLoading: false,
          });
        }
      },

      pauseGame: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { currentGame } = get();
          if (!currentGame) throw new Error('No game loaded');
          
          const response = await basketballAPI.pauseGame(currentGame.id);
          
          set({
            currentGame: response.game,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to pause game:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to pause game',
            isLoading: false,
          });
        }
      },

      resumeGame: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { currentGame } = get();
          if (!currentGame) throw new Error('No game loaded');
          
          const response = await basketballAPI.resumeGame(currentGame.id);
          
          set({
            currentGame: response.game,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to resume game:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to resume game',
            isLoading: false,
          });
        }
      },

      endGame: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const { currentGame } = get();
          if (!currentGame) throw new Error('No game loaded');
          
          const response = await basketballAPI.endGame(currentGame.id);
          
          set({
            currentGame: response.game,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to end game:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to end game',
            isLoading: false,
          });
        }
      },

      // Stat recording
      recordStat: async (action: StatAction) => {
        try {
          set({ isLoading: true, error: null });
          
          const { currentGame } = get();
          if (!currentGame) throw new Error('No game loaded');
          
          await basketballAPI.recordStat(currentGame.id, action);
          
          // The actual update will come via WebSocket
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to record stat:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to record stat',
            isLoading: false,
          });
        }
      },

      // Timer controls
      updateTimer: (timeRemaining: number, quarter: number) => {
        const { currentGame } = get();
        if (currentGame) {
          set({
            currentGame: {
              ...currentGame,
              time_remaining_seconds: timeRemaining,
              current_quarter: quarter,
            },
          });
        }
      },

      // WebSocket event handlers
      handleGameUpdate: (data: WebSocketMessage) => {
        if (data.type === 'game_update' && data.game) {
          set({ currentGame: data.game });
          
          if (data.game.status === GAME_STATUS.PLAYING) {
            set({ timerRunning: true });
          } else if (data.game.status === GAME_STATUS.PAUSED || data.game.status === GAME_STATUS.ENDED) {
            set({ timerRunning: false });
          }
        }
      },

      handleStatUpdate: (data: WebSocketMessage) => {
        if (data.type === 'stat_update') {
          if (data.stats) {
            set({ playerStats: data.stats });
          }
          
          if (data.game) {
            set({ currentGame: data.game });
          }
        }
      },

      handleTimerUpdate: (data: WebSocketMessage) => {
        if (data.type === 'timer_update' && data.time_remaining_seconds !== undefined && data.current_quarter !== undefined) {
          const { currentGame } = get();
          if (currentGame) {
            set({
              currentGame: {
                ...currentGame,
                time_remaining_seconds: data.time_remaining_seconds,
                current_quarter: data.current_quarter,
              },
            });
          }
        }
      },

      // State management
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearGame: () => set({ 
        currentGame: null, 
        playerStats: [], 
        error: null,
        timerRunning: false,
      }),
    }))
  );
}

// Initialize the store (create it if needed)
export const useGameStore = () => {
  if (typeof window !== 'undefined' && !store) {
    store = createGameStore();
  }
  return store || {
    getState: () => ({
      currentGame: null,
      playerStats: [],
      isLoading: false,
      error: null,
      connectionStatus: 'disconnected',
      timerRunning: false
    } as GameState),
    setState: () => {},
    subscribe: () => () => {},
    destroy: () => {},
    // Empty implementations for all actions
    loadGame: async () => { throw new Error('Game actions not available in SSR'); },
    connectToGame: async () => { throw new Error('Game actions not available in SSR'); },
    disconnectFromGame: () => {},
    startGame: async () => { throw new Error('Game actions not available in SSR'); },
    pauseGame: async () => { throw new Error('Game actions not available in SSR'); },
    resumeGame: async () => { throw new Error('Game actions not available in SSR'); },
    endGame: async () => { throw new Error('Game actions not available in SSR'); },
    recordStat: async () => { throw new Error('Game actions not available in SSR'); },
    updateTimer: () => {},
    handleGameUpdate: () => {},
    handleStatUpdate: () => {},
    handleTimerUpdate: () => {},
    setLoading: () => {},
    setError: () => {},
    clearGame: () => {}
  };
};

// Get state without hooks for non-component code
export const getGameState = () => {
  if (typeof window !== 'undefined') {
    const gameStore = useGameStore();
    if (typeof gameStore.getState === 'function') {
      return gameStore.getState();
    }
  }
  return {
    currentGame: null,
    playerStats: [],
    isLoading: false,
    error: null,
    connectionStatus: 'disconnected',
    timerRunning: false
  } as GameState;
};
