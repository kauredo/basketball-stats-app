class Api::V1::PlayersController < Api::V1::BaseController
  before_action :set_team, only: [:index, :create]
  before_action :set_player, only: [:show, :update, :destroy]

  def index
    players = @team.players.includes(:team)
    result = paginate_collection(players)
    
    render_success({
      players: result[:data].map(&method(:player_json)),
      meta: result[:meta]
    })
  end

  def show
    render_success({
      player: player_json(@player, include_stats: true)
    })
  end

  def create
    @player = @team.players.build(player_params)

    if @player.save
      render_success({
        player: player_json(@player)
      }, :created)
    else
      render json: { errors: @player.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @player.update(player_params)
      render_success({
        player: player_json(@player)
      })
    else
      render json: { errors: @player.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @player.destroy
    head :no_content
  end

  private

  def set_team
    @team = Team.find(params[:team_id]) if params[:team_id]
  end

  def set_player
    @player = Player.includes(:team).find(params[:id])
  end

  def player_params
    params.require(:player).permit(
      :name, :number, :position, :height_cm, :weight_kg, 
      :birth_date, :active
    )
  end

  def player_json(player, include_stats: false)
    result = {
      id: player.id,
      name: player.name,
      number: player.number,
      position: player.position,
      height_cm: player.height_cm,
      weight_kg: player.weight_kg,
      birth_date: player.birth_date,
      age: player.age,
      active: player.active,
      created_at: player.created_at,
      updated_at: player.updated_at,
      team: {
        id: player.team.id,
        name: player.team.name,
        city: player.team.city
      }
    }

    if include_stats
      result[:season_averages] = player.season_averages
      result[:games_played] = player.player_stats.count
    end

    result
  end
end