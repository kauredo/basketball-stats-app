class Api::V1::TeamsController < ApplicationController
  before_action :set_team, only: [ :show, :update, :destroy ]
  before_action :set_league, only: [ :create ], if: -> { params[:league_id] }
  before_action :require_team_management, only: [ :update, :destroy ]

  def index
    if current_user
      # Show teams user has access to through leagues
      accessible_leagues = current_user.leagues.pluck(:id)
      teams = Team.includes(:players, :league).where(league_id: accessible_leagues)
    else
      # Show teams from public leagues
      public_leagues = League.public_leagues.pluck(:id)
      teams = Team.includes(:players, :league).where(league_id: public_leagues)
    end

    render_success({
      teams: teams.map { |team| team_json(team) }
    })
  end

  def show
    if @team.league && !@team.league.can_user_access?(current_user)
      return render_forbidden
    end

    render_success({
      team: team_json(@team, include_players: true)
    })
  end

  def create
    @team = (@league || current_user.teams).build(team_params)
    @team.user = current_user if @team.league.nil?

    if @team.save
      render_success({
        team: team_json(@team)
      }, :created)
    else
      render json: { errors: @team.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @team.update(team_params)
      render_success({
        team: team_json(@team)
      })
    else
      render json: { errors: @team.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @team.destroy
    head :no_content
  end

  private

  def set_team
    @team = Team.find(params[:id])
  end

  def set_league
    @league = League.find(params[:league_id])
    require_league_access(@league)
  end

  def require_team_management
    render_forbidden unless @team.can_be_managed_by?(current_user)
  end

  def team_params
    permitted = [ :name, :city, :logo_url, :description ]
    permitted << :league_id if params[:league_id].blank? && current_user&.admin?
    params.require(:team).permit(*permitted)
  end

  def team_json(team, include_players: false)
    result = {
      id: team.id,
      name: team.name,
      city: team.city,
      logo_url: team.logo_url,
      description: team.description,
      active_players_count: team.active_players.count,
      wins: team.wins,
      losses: team.losses,
      games_played: team.games_played,
      win_percentage: team.win_percentage,
      created_at: team.created_at,
      updated_at: team.updated_at
    }

    if team.league
      result[:league] = {
        id: team.league.id,
        name: team.league.name,
        league_type: team.league.league_type
      }
    end

    if team.user
      result[:owner] = {
        id: team.user.id,
        name: team.user.full_name
      }
    end

    if include_players
      result[:players] = team.active_players.map { |player| player_json(player) }
    end

    result
  end

  def player_json(player)
    {
      id: player.id,
      name: player.name,
      jersey_number: player.jersey_number,
      position: player.position,
      height: player.height,
      weight: player.weight,
      active: player.is_active
    }
  end
end
