class StatsChannel < ApplicationCable::Channel
  def subscribed
    game = Game.find(params[:game_id])
    stream_from "game_#{game.id}_stats"
    
    Rails.logger.info "User #{current_user.id} subscribed to stats for game #{game.id}"

    # Send current stats state on connection
    stats = game.player_stats.includes(:player)
    transmit({
      type: 'stats_connected',
      message: "Connected to live stats",
      stats: stats.map { |stat| detailed_player_stat_json(stat) }
    })
  end

  def unsubscribed
    Rails.logger.info "User #{current_user.id} unsubscribed from stats"
  end

  def request_stats
    game = Game.find(params[:game_id])
    stats = game.player_stats.includes(:player)
    
    transmit({
      type: 'stats_update',
      stats: stats.map { |stat| detailed_player_stat_json(stat) }
    })
  rescue ActiveRecord::RecordNotFound
    transmit({ type: 'error', message: 'Game not found' })
  rescue => e
    transmit({ type: 'error', message: e.message })
  end

  private

  def detailed_player_stat_json(stat)
    {
      id: stat.id,
      points: stat.points,
      field_goals_made: stat.field_goals_made,
      field_goals_attempted: stat.field_goals_attempted,
      field_goal_percentage: stat.field_goal_percentage,
      three_pointers_made: stat.three_pointers_made,
      three_pointers_attempted: stat.three_pointers_attempted,
      three_point_percentage: stat.three_point_percentage,
      free_throws_made: stat.free_throws_made,
      free_throws_attempted: stat.free_throws_attempted,
      free_throw_percentage: stat.free_throw_percentage,
      rebounds: stat.rebounds,
      assists: stat.assists,
      steals: stat.steals,
      blocks: stat.blocks,
      turnovers: stat.turnovers,
      fouls: stat.fouls,
      minutes_played: stat.minutes_played,
      plus_minus: stat.plus_minus,
      effective_field_goal_percentage: stat.effective_field_goal_percentage,
      true_shooting_percentage: stat.true_shooting_percentage,
      player: {
        id: stat.player.id,
        name: stat.player.name,
        number: stat.player.number,
        position: stat.player.position,
        team: {
          id: stat.player.team.id,
          name: stat.player.team.name
        }
      }
    }
  end
end