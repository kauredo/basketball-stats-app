import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Game, 
  PlayerStat, 
  WebSocketMessage, 
  GameStatus, 
  StatAction 
} from '../types';
import { basketballAPI } from '../services/api';
import { basketballWebSocket } from '../services/websocket';

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

export const useGameStore = create<GameState>()(
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
        basketballWebSocket.on('game_connected', (data) => {
          console.log('Connected to game:', data.message);
        });
        basketballWebSocket.on('stats_connected', (data) => {
          console.log('Connected to stats:', data.message);
          if (data.stats) {
            set({ playerStats: data.stats });
          }
        });

        // Connect and subscribe
        basketballWebSocket.connect();
        basketballWebSocket.subscribeToGame(gameId);
        
      } catch (error) {
        console.error('Failed to connect to game:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to connect to game',
          connectionStatus: 'error',
        });
      }
    },

    disconnectFromGame: () => {
      basketballWebSocket.unsubscribeFromGame();
      basketballWebSocket.disconnect();
      
      // Clean up event handlers
      basketballWebSocket.off('game_update', get().handleGameUpdate);
      basketballWebSocket.off('stat_update', get().handleStatUpdate);
      basketballWebSocket.off('timer_update', get().handleTimerUpdate);
      
      set({ 
        connectionStatus: 'disconnected',
        timerRunning: false,
      });
    },

    // Game control actions
    startGame: async () => {
      const { currentGame } = get();
      if (!currentGame) return;
      
      set({ isLoading: true });
      
      try {
        const response = await basketballAPI.startGame(currentGame.id);
        set({ 
          currentGame: response.game,
          timerRunning: true,
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
      const { currentGame } = get();
      if (!currentGame) return;
      
      try {
        const response = await basketballAPI.pauseGame(currentGame.id);
        set({ 
          currentGame: response.game,
          timerRunning: false,
        });
      } catch (error) {
        console.error('Failed to pause game:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to pause game' });
      }
    },

    resumeGame: async () => {
      const { currentGame } = get();
      if (!currentGame) return;
      
      try {
        const response = await basketballAPI.resumeGame(currentGame.id);
        set({ 
          currentGame: response.game,
          timerRunning: true,
        });
      } catch (error) {
        console.error('Failed to resume game:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to resume game' });
      }
    },

    endGame: async () => {
      const { currentGame } = get();
      if (!currentGame) return;
      
      try {
        const response = await basketballAPI.endGame(currentGame.id);
        set({ 
          currentGame: response.game,
          timerRunning: false,
        });
      } catch (error) {
        console.error('Failed to end game:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to end game' });
      }
    },

    // Stat recording
    recordStat: async (action: StatAction) => {
      const { currentGame } = get();
      if (!currentGame) return;
      
      try {
        const response = await basketballAPI.recordStat(currentGame.id, action);
        
        // Update local stats with the returned stat
        set((state) => ({
          playerStats: state.playerStats.map(stat =>
            stat.id === response.stat.id ? response.stat : stat
          ),
          currentGame: state.currentGame ? {
            ...state.currentGame,
            home_score: response.game_score.home_score,
            away_score: response.game_score.away_score,
          } : null,
        }));
        
      } catch (error) {
        console.error('Failed to record stat:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to record stat' });
      }
    },

    // Timer controls
    updateTimer: (timeRemaining: number, quarter: number) => {
      const { currentGame } = get();
      if (!currentGame) return;
      
      // Update local state immediately (optimistic update)
      set({
        currentGame: {
          ...currentGame,
          time_remaining_seconds: timeRemaining,
          current_quarter: quarter,
          time_display: Math.floor(timeRemaining / 60) + ':' + 
                       (timeRemaining % 60).toString().padStart(2, '0'),
        }
      });
      
      // Send to server
      basketballWebSocket.updateTimer(timeRemaining, quarter);
    },

    // WebSocket event handlers
    handleGameUpdate: (data: WebSocketMessage) => {
      if (data.game) {
        set({ currentGame: data.game });
        
        // Update timer running state based on game status
        const isActive = data.game.status === 'active';
        set({ timerRunning: isActive });
      }
      
      if (data.game_score) {
        set((state) => ({
          currentGame: state.currentGame ? {
            ...state.currentGame,
            home_score: data.game_score!.home_score,
            away_score: data.game_score!.away_score,
          } : null,
        }));
      }
    },

    handleStatUpdate: (data: WebSocketMessage) => {
      if (data.stat && data.player_id) {
        set((state) => ({
          playerStats: state.playerStats.map(stat =>
            stat.player.id === data.player_id ? data.stat! : stat
          ),
        }));
      }
      
      if (data.stats) {
        set({ playerStats: data.stats });
      }
      
      if (data.game_score) {
        set((state) => ({
          currentGame: state.currentGame ? {
            ...state.currentGame,
            home_score: data.game_score!.home_score,
            away_score: data.game_score!.away_score,
          } : null,
        }));
      }
    },

    handleTimerUpdate: (data: WebSocketMessage) => {
      if (data.time_remaining_seconds !== undefined && data.current_quarter !== undefined) {
        set((state) => ({
          currentGame: state.currentGame ? {
            ...state.currentGame,
            time_remaining_seconds: data.time_remaining_seconds!,
            current_quarter: data.current_quarter!,
            time_display: data.time_display || state.currentGame.time_display,
          } : null,
        }));
      }
    },

    // State management helpers
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