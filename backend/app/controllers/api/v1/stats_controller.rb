class Api::V1::StatsController < Api::V1::BaseController
  before_action :set_game
  before_action :set_stat, only: [ :update, :destroy ]

  def index
    stats = @game.player_stats.includes(:player)
    result = paginate_collection(stats)

    render_success({
      stats: result[:data].map(&method(:player_stat_json)),
      meta: result[:meta]
    })
  end

  def create
    player = Player.find(stat_params[:player_id])
    @stat = @game.player_stats.find_by(player: player)

    unless @stat
      render_error("Player not found in game", :not_found)
      return
    end

    begin
      if stat_params[:stat_type].present?
        # Handle action-based stat recording (shots, rebounds, etc.)
        @stat.update_stat(
          stat_params[:stat_type],
          stat_params[:value] || 1,
          stat_params[:made] == "true"
        )

        render_success({
          stat: player_stat_json(@stat),
          game_score: {
            home_score: @game.reload.home_score,
            away_score: @game.away_score
          },
          message: "#{stat_params[:stat_type]} recorded for #{player.name}"
        })
      else
        # Handle direct stat updates
        if @stat.update(direct_stat_params)
          render_success({
            stat: player_stat_json(@stat),
            message: "Stats updated for #{player.name}"
          })
        else
          render json: { errors: @stat.errors.full_messages }, status: :unprocessable_entity
        end
      end
    rescue => e
      render_error("Failed to update stats: #{e.message}", :unprocessable_entity)
    end
  end

  def update
    if @stat.update(direct_stat_params)
      render_success({
        stat: player_stat_json(@stat),
        message: "Stats updated successfully"
      })
    else
      render json: { errors: @stat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    player_name = @stat.player.name
    @stat.destroy
    render_success({
      message: "Stats cleared for #{player_name}"
    })
  end

  private

  def set_game
    @game = Game.find(params[:game_id])
  end

  def set_stat
    @stat = @game.player_stats.find(params[:id])
  end

  def stat_params
    params.require(:stat).permit(
      :player_id, :stat_type, :value, :made
    )
  end

  def direct_stat_params
    params.require(:stat).permit(
      :points, :field_goals_made, :field_goals_attempted,
      :three_pointers_made, :three_pointers_attempted,
      :free_throws_made, :free_throws_attempted,
      :rebounds, :assists, :steals, :blocks, :turnovers, :fouls,
      :minutes_played, :plus_minus
    )
  end

  def player_stat_json(stat)
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
      created_at: stat.created_at,
      updated_at: stat.updated_at,
      player: {
        id: stat.player.id,
        name: stat.player.name,
        number: stat.player.number,
        position: stat.player.position,
        team: {
          id: stat.player.team.id,
          name: stat.player.team.name
        }
      },
      game: {
        id: stat.game.id,
        status: stat.game.status,
        current_quarter: stat.game.current_quarter,
        time_display: stat.game.time_display
      }
    }
  end
end
