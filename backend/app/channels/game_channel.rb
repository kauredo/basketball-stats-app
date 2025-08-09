class GameChannel < ApplicationCable::Channel
  def subscribed
    game = Game.find(params[:game_id])
    stream_from "game_#{game.id}"

    Rails.logger.info "User #{current_user.id} subscribed to game #{game.id}"

    # Send current game state on connection
    transmit({
      type: "game_connected",
      message: "Connected to game: #{game.home_team.name} vs #{game.away_team.name}",
      game: game_json(game)
    })

    # Send current live stats
    stats = game.player_stats.includes(:player)
    transmit({
      type: "stats_state",
      stats: stats.map { |stat| player_stat_json(stat) }
    })
  end

  def unsubscribed
    Rails.logger.info "User #{current_user.id} unsubscribed from game"
  end

  def update_timer(data)
    game = Game.find(params[:game_id])

    if game.update(
      time_remaining_seconds: data["time_remaining_seconds"],
      current_quarter: data["current_quarter"]
    )
      ActionCable.server.broadcast("game_#{game.id}", {
        type: "timer_update",
        time_remaining_seconds: game.time_remaining_seconds,
        current_quarter: game.current_quarter,
        time_display: game.time_display
      })
    end
  rescue ActiveRecord::RecordNotFound
    transmit({ type: "error", message: "Game not found" })
  rescue => e
    transmit({ type: "error", message: e.message })
  end

  def ping
    transmit({ type: "pong", timestamp: Time.current })
  end

  private

  def game_json(game)
    {
      id: game.id,
      status: game.status,
      current_quarter: game.current_quarter,
      time_remaining_seconds: game.time_remaining_seconds,
      time_display: game.time_display,
      home_score: game.home_score,
      away_score: game.away_score,
      home_team: {
        id: game.home_team.id,
        name: game.home_team.name
      },
      away_team: {
        id: game.away_team.id,
        name: game.away_team.name
      }
    }
  end

  def player_stat_json(stat)
    {
      id: stat.id,
      points: stat.points,
      field_goals_made: stat.field_goals_made,
      field_goals_attempted: stat.field_goals_attempted,
      three_pointers_made: stat.three_pointers_made,
      three_pointers_attempted: stat.three_pointers_attempted,
      free_throws_made: stat.free_throws_made,
      free_throws_attempted: stat.free_throws_attempted,
      rebounds: stat.rebounds,
      assists: stat.assists,
      steals: stat.steals,
      blocks: stat.blocks,
      turnovers: stat.turnovers,
      fouls: stat.fouls,
      player: {
        id: stat.player.id,
        name: stat.player.name,
        number: stat.player.number
      }
    }
  end
end
