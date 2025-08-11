import { createConsumer, Cable, Subscription } from "@rails/actioncable";
import type { WebSocketMessage, Game, PlayerStat } from "../types";

export type WebSocketEventHandler = (data: any) => void;
export type ConnectionStatusHandler = (
  status: "connected" | "connecting" | "disconnected" | "error"
) => void;

export class BasketballWebSocketService {
  private cable: Cable | null = null;
  private gameChannel: Subscription | null = null;
  private statsChannel: Subscription | null = null;
  private gameId: number | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private connectionHandlers: ConnectionStatusHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // constructor(private baseURL: string = "ws://localhost:3000/cable") {}
  constructor(private baseURL: string = "ws://192.168.1.55:3000/cable") {}

  connect(): void {
    if (this.cable?.connection?.isOpen()) {
      console.log("ActionCable already connected");
      return;
    }

    this.notifyConnectionStatus("connecting");

    this.cable = createConsumer(this.baseURL);
    this.setupConnectionHandlers();
  }

  disconnect(): void {
    if (this.gameChannel) {
      this.gameChannel.unsubscribe();
      this.gameChannel = null;
    }
    
    if (this.statsChannel) {
      this.statsChannel.unsubscribe();
      this.statsChannel = null;
    }

    if (this.cable) {
      this.cable.disconnect();
      this.cable = null;
      this.gameId = null;
      this.notifyConnectionStatus("disconnected");
      console.log("ActionCable disconnected");
    }
  }

  subscribeToGame(gameId: number): void {
    if (!this.cable) {
      throw new Error("ActionCable not connected. Call connect() first.");
    }

    this.gameId = gameId;

    // Subscribe to GameChannel
    this.gameChannel = this.cable.subscriptions.create(
      { channel: "GameChannel", game_id: gameId },
      {
        connected: () => {
          console.log(`Connected to GameChannel for game ${gameId}`);
          this.notifyConnectionStatus("connected");
          this.emitEvent("game_connected", { message: `Connected to game ${gameId}` });
        },

        disconnected: () => {
          console.log(`Disconnected from GameChannel for game ${gameId}`);
          this.notifyConnectionStatus("disconnected");
        },

        received: (data: any) => {
          console.log("GameChannel received:", data);
          
          switch (data.type) {
            case "game_update":
              this.emitEvent("game_update", data);
              break;
            case "timer_update":
              this.emitEvent("timer_update", data);
              break;
            case "quarter_end":
              this.emitEvent("quarter_end", data);
              break;
            case "pong":
              this.emitEvent("pong", data);
              break;
            default:
              console.log("Unknown GameChannel message:", data);
          }
        },

        rejected: () => {
          console.error("GameChannel subscription rejected");
          this.notifyConnectionStatus("error");
        }
      }
    );

    // Subscribe to StatsChannel
    this.statsChannel = this.cable.subscriptions.create(
      { channel: "StatsChannel", game_id: gameId },
      {
        connected: () => {
          console.log(`Connected to StatsChannel for game ${gameId}`);
          this.emitEvent("stats_connected", { message: `Connected to stats for game ${gameId}` });
        },

        disconnected: () => {
          console.log(`Disconnected from StatsChannel for game ${gameId}`);
        },

        received: (data: any) => {
          console.log("StatsChannel received:", data);
          
          switch (data.type) {
            case "stat_update":
              this.emitEvent("stat_update", data);
              break;
            case "stats_state":
              this.emitEvent("stats_state", data);
              break;
            default:
              console.log("Unknown StatsChannel message:", data);
          }
        },

        rejected: () => {
          console.error("StatsChannel subscription rejected");
        }
      }
    );
  }

  unsubscribeFromGame(): void {
    if (this.gameChannel) {
      this.gameChannel.unsubscribe();
      this.gameChannel = null;
    }

    if (this.statsChannel) {
      this.statsChannel.unsubscribe();
      this.statsChannel = null;
    }

    this.gameId = null;
    console.log("Unsubscribed from game channels");
  }

  updateTimer(timeRemaining: number, quarter: number): void {
    if (!this.gameChannel || !this.gameId) {
      console.error("Cannot update timer: not connected to game");
      return;
    }

    this.gameChannel.perform("update_timer", {
      game_id: this.gameId,
      time_remaining_seconds: timeRemaining,
      current_quarter: quarter,
    });
  }

  updateScore(gameId: number, homeScore: number, awayScore: number): void {
    if (!this.gameChannel) {
      console.error("Cannot update score: not connected");
      return;
    }

    // Note: Score updates are typically handled through stat recordings
    // This method can be used for manual score corrections
    console.log(`Score update: Home ${homeScore}, Away ${awayScore}`);
  }

  updateGameState(gameId: number, gameState: any): void {
    if (!this.gameChannel) {
      console.error("Cannot update game state: not connected");
      return;
    }

    // Game state changes should use the existing API endpoints
    // and will be automatically broadcast by the backend
    console.log("Game state update:", gameState);
  }

  updatePlayerStats(gameId: number, playerId: number, stats: any): void {
    if (!this.statsChannel) {
      console.error("Cannot update player stats: not connected");
      return;
    }

    // Player stats updates should use the API endpoints
    // and will be automatically broadcast by the backend
    console.log("Player stats update:", { playerId, stats });
  }

  ping(): void {
    if (!this.gameChannel) {
      console.error("Cannot ping: GameChannel not connected");
      return;
    }

    this.gameChannel.perform("ping");
  }

  requestStats(): void {
    if (!this.statsChannel || !this.gameId) {
      console.error("Cannot request stats: not connected to stats channel");
      return;
    }

    this.statsChannel.perform("request_stats", {
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
    return this.cable?.connection?.isOpen() || false;
  }

  get currentGameId(): number | null {
    return this.gameId;
  }

  private setupConnectionHandlers(): void {
    if (!this.cable) return;

    // ActionCable connection events
    this.cable.connection.monitor.on("connected", () => {
      console.log("ActionCable connected");
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus("connected");
    });

    this.cable.connection.monitor.on("disconnected", () => {
      console.log("ActionCable disconnected");
      this.notifyConnectionStatus("disconnected");
      this.handleReconnect();
    });

    this.cable.connection.monitor.on("rejected", () => {
      console.error("ActionCable connection rejected");
      this.notifyConnectionStatus("error");
      this.handleReconnect();
    });
  }

  private emitEvent(event: string, data: any): void {
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

  private notifyConnectionStatus(
    status: "connected" | "connecting" | "disconnected" | "error"
  ): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error("Error in connection status handler:", error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.notifyConnectionStatus("error");
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`
    );

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