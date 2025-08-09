class Api::V1::GamesController < Api::V1::BaseController
  before_action :set_game, only: [ :show, :update, :destroy, :start, :pause, :resume, :end, :box_score, :live_stats ]
  before_action :set_team, only: [ :index, :create ]

  def index
    games = @team ? @team.games.includes(:home_team, :away_team) : Game.includes(:home_team, :away_team)
    games = games.order(scheduled_at: :desc)
    result = paginate_collection(games)

    render_success({
      games: result[:data].map(&method(:game_json)),
      meta: result[:meta]
    })
  end

  def show
    render_success({
      game: game_json(@game, include_stats: true)
    })
  end

  def create
    @game = Game.new(game_params)

    if @game.save
      render_success({
        game: game_json(@game)
      }, :created)
    else
      render json: { errors: @game.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @game.update(game_params)
      broadcast_game_update
      render_success({
        game: game_json(@game)
      })
    else
      render json: { errors: @game.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @game.destroy
    head :no_content
  end

  def start
    @game.start_game!
    render_success({
      game: game_json(@game),
      message: "Game started successfully"
    })
  end

  def pause
    @game.pause_game!
    render_success({
      game: game_json(@game),
      message: "Game paused successfully"
    })
  end

  def resume
    @game.resume_game!
    render_success({
      game: game_json(@game),
      message: "Game resumed successfully"
    })
  end

  def end
    @game.end_game!
    render_success({
      game: game_json(@game),
      message: "Game ended successfully"
    })
  end

  def box_score
    box_score_data = @game.box_score

    render_success({
      game: game_json(@game),
      box_score: {
        home_team: {
          team: team_summary_json(box_score_data[:home_team][:team]),
          score: box_score_data[:home_team][:score],
          players: box_score_data[:home_team][:stats].map(&method(:player_stat_json))
        },
        away_team: {
          team: team_summary_json(box_score_data[:away_team][:team]),
          score: box_score_data[:away_team][:score],
          players: box_score_data[:away_team][:stats].map(&method(:player_stat_json))
        }
      }
    })
  end

  def live_stats
    stats = @game.player_stats.includes(:player)

    render_success({
      game: game_json(@game),
      stats: stats.map(&method(:player_stat_json))
    })
  end

  private

  def set_game
    @game = Game.includes(:home_team, :away_team).find(params[:id])
  end

  def set_team
    @team = Team.find(params[:team_id]) if params[:team_id]
  end

  def game_params
    params.require(:game).permit(
      :home_team_id, :away_team_id, :scheduled_at,
      :current_quarter, :time_remaining_seconds,
      :home_score, :away_score, game_settings: {}
    )
  end

  def game_json(game, include_stats: false)
    result = {
      id: game.id,
      scheduled_at: game.scheduled_at,
      started_at: game.started_at,
      ended_at: game.ended_at,
      status: game.status,
      current_quarter: game.current_quarter,
      time_remaining_seconds: game.time_remaining_seconds,
      time_display: game.time_display,
      home_score: game.home_score,
      away_score: game.away_score,
      duration_minutes: game.duration_minutes,
      game_settings: game.game_settings,
      created_at: game.created_at,
      updated_at: game.updated_at,
      home_team: team_summary_json(game.home_team),
      away_team: team_summary_json(game.away_team)
    }

    if include_stats
      result[:player_stats] = game.player_stats.includes(:player).map(&method(:player_stat_json))
    end

    result
  end

  def team_summary_json(team)
    {
      id: team.id,
      name: team.name,
      city: team.city,
      logo_url: team.logo_url
    }
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
      player: {
        id: stat.player.id,
        name: stat.player.name,
        number: stat.player.number,
        position: stat.player.position
      }
    }
  end

  def broadcast_game_update
    ActionCable.server.broadcast("game_#{@game.id}", {
      type: "game_update",
      game: game_json(@game)
    })
  end
end
