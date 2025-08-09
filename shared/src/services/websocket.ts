import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, Game, PlayerStat } from '../types';

export type WebSocketEventHandler = (data: WebSocketMessage) => void;
export type ConnectionStatusHandler = (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;

export class BasketballWebSocketService {
  private socket: Socket | null = null;
  private gameId: number | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private connectionHandlers: ConnectionStatusHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private baseURL: string = 'ws://localhost:3000') {}

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.notifyConnectionStatus('connecting');
    
    this.socket = io(this.baseURL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.gameId = null;
      this.notifyConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    }
  }

  subscribeToGame(gameId: number): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    this.gameId = gameId;
    
    // Subscribe to game channel
    this.socket.emit('subscribe', {
      channel: 'GameChannel',
      game_id: gameId,
    });

    // Subscribe to stats channel
    this.socket.emit('subscribe', {
      channel: 'StatsChannel', 
      game_id: gameId,
    });

    console.log(`Subscribed to game ${gameId} channels`);
  }

  unsubscribeFromGame(): void {
    if (!this.socket || !this.gameId) {
      return;
    }

    this.socket.emit('unsubscribe', {
      channel: 'GameChannel',
      game_id: this.gameId,
    });

    this.socket.emit('unsubscribe', {
      channel: 'StatsChannel',
      game_id: this.gameId,
    });

    this.gameId = null;
    console.log('Unsubscribed from game channels');
  }

  updateTimer(timeRemaining: number, quarter: number): void {
    if (!this.socket || !this.gameId) {
      console.error('Cannot update timer: not connected to game');
      return;
    }

    this.socket.emit('game_action', {
      action: 'update_timer',
      game_id: this.gameId,
      time_remaining_seconds: timeRemaining,
      current_quarter: quarter,
    });
  }

  ping(): void {
    if (!this.socket) {
      console.error('Cannot ping: WebSocket not connected');
      return;
    }

    this.socket.emit('ping');
  }

  requestStats(): void {
    if (!this.socket || !this.gameId) {
      console.error('Cannot request stats: not connected to game');
      return;
    }

    this.socket.emit('stats_action', {
      action: 'request_stats',
      game_id: this.gameId,
    });
  }

  // Event handling
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler?: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    if (handler) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(event, []);
    }
  }

  onConnectionStatus(handler: ConnectionStatusHandler): void {
    this.connectionHandlers.push(handler);
  }

  offConnectionStatus(handler: ConnectionStatusHandler): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get currentGameId(): number | null {
    return this.gameId;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.notifyConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.notifyConnectionStatus('error');
      this.handleReconnect();
    });

    // Game events
    this.socket.on('game_update', (data: WebSocketMessage) => {
      this.emitEvent('game_update', data);
    });

    this.socket.on('game_connected', (data: WebSocketMessage) => {
      console.log('Connected to game:', data.message);
      this.emitEvent('game_connected', data);
    });

    this.socket.on('timer_update', (data: WebSocketMessage) => {
      this.emitEvent('timer_update', data);
    });

    this.socket.on('quarter_end', (data: WebSocketMessage) => {
      this.emitEvent('quarter_end', data);
    });

    // Stats events
    this.socket.on('stat_update', (data: WebSocketMessage) => {
      this.emitEvent('stat_update', data);
    });

    this.socket.on('stats_connected', (data: WebSocketMessage) => {
      console.log('Connected to stats:', data.message);
      this.emitEvent('stats_connected', data);
    });

    this.socket.on('stats_state', (data: WebSocketMessage) => {
      this.emitEvent('stats_state', data);
    });

    // General events
    this.socket.on('pong', (data: WebSocketMessage) => {
      console.log('Pong received:', data.timestamp);
      this.emitEvent('pong', data);
    });

    this.socket.on('error', (data: WebSocketMessage) => {
      console.error('WebSocket error:', data.message);
      this.emitEvent('error', data);
    });
  }

  private emitEvent(event: string, data: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  private notifyConnectionStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error'): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyConnectionStatus('error');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
      
      if (this.gameId) {
        setTimeout(() => {
          this.subscribeToGame(this.gameId!);
        }, 1000);
      }
    }, delay);
  }
}

// Export singleton instance
export const basketballWebSocket = new BasketballWebSocketService();