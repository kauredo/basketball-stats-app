class Api::V1::LeaguesController < ApplicationController
  before_action :authenticate_user
  before_action :set_league, only: [:show, :update, :destroy, :join, :leave, :members, :standings]
  before_action :require_league_access, only: [:show, :members, :standings]
  before_action :require_league_management, only: [:update, :destroy]

  # GET /api/v1/leagues
  def index
    user_leagues = current_user.leagues.includes(:owner, :league_memberships)
    public_leagues = League.public_leagues.includes(:owner).where.not(id: user_leagues.ids)
    leagues = (user_leagues + public_leagues).uniq

    render_success({
      leagues: leagues.map { |league| league_json(league, include_membership: true) }
    })
  end

  # GET /api/v1/leagues/:id
  def show
    render_success({
      league: league_json(@league, detailed: true, include_membership: true)
    })
  end

  # POST /api/v1/leagues
  def create
    league = current_user.owned_leagues.build(league_params)
    league.created_by = current_user
    league.season = League.current_season_name unless league.season.present?
    league.status = 'draft' unless league.status.present?

    if league.save
      render_success({
        league: league_json(league, detailed: true, include_membership: true),
        message: 'League created successfully'
      }, :created)
    else
      render json: { errors: league.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/leagues/:id
  def update
    if @league.update(league_params)
      render_success({
        league: league_json(@league, detailed: true, include_membership: true),
        message: 'League updated successfully'
      })
    else
      render json: { errors: @league.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/leagues/:id
  def destroy
    if @league.teams.exists?
      render_error('Cannot delete league with existing teams', :bad_request)
    else
      @league.destroy
      render_success({ message: 'League deleted successfully' })
    end
  end

  # POST /api/v1/leagues/:id/join
  def join
    role = params[:role] || 'member'
    
    unless LeagueMembership.roles.keys.include?(role)
      return render_error('Invalid role specified', :bad_request)
    end

    if @league.league_memberships.exists?(user: current_user)
      return render_error('You are already a member of this league', :bad_request)
    end

    membership = @league.league_memberships.build(
      user: current_user,
      role: role,
      status: 'active',
      joined_at: Time.current
    )

    if membership.save
      render_success({
        league: league_json(@league, include_membership: true),
        membership: membership_json(membership),
        message: 'Successfully joined league'
      })
    else
      render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/leagues/:id/leave
  def leave
    membership = @league.league_memberships.find_by(user: current_user)
    
    if membership
      if @league.owner == current_user
        render_error('League owner cannot leave the league. Transfer ownership first.', :bad_request)
      else
        membership.destroy
        render_success({ message: 'Successfully left league' })
      end
    else
      render_error('You are not a member of this league', :bad_request)
    end
  end

  # GET /api/v1/leagues/:id/members
  def members
    memberships = @league.league_memberships.includes(:user).active.order(:joined_at)
    
    render_success({
      members: memberships.map { |membership| membership_json(membership, include_user: true) }
    })
  end

  # GET /api/v1/leagues/:id/standings
  def standings
    standings = @league.standings.includes(:league)
    
    render_success({
      standings: standings.map { |team| team_standings_json(team) }
    })
  end

  # GET /api/v1/leagues/:id/invite_code
  def invite_code
    require_league_management

    render_success({
      invite_code: @league.invite_code,
      invite_url: "#{request.base_url}/leagues/join/#{@league.invite_code}"
    })
  end

  # POST /api/v1/leagues/join_by_code
  def join_by_code
    code = params[:code]
    return render_error('Invite code is required', :bad_request) unless code

    # Extract league ID from invite code format: "league-name-123"
    league_id = code.split('-').last.to_i
    league = League.find_by(id: league_id)

    return render_error('Invalid invite code', :not_found) unless league
    return render_error('Invalid invite code', :bad_request) unless league.invite_code == code

    if league.league_memberships.exists?(user: current_user)
      return render_error('You are already a member of this league', :bad_request)
    end

    membership = league.league_memberships.create!(
      user: current_user,
      role: 'member',
      status: 'active',
      joined_at: Time.current
    )

    render_success({
      league: league_json(league, include_membership: true),
      membership: membership_json(membership),
      message: 'Successfully joined league'
    })
  end

  private

  def set_league
    @league = League.find(params[:id])
  end

  def require_league_access
    super(@league)
  end

  def require_league_management
    super(@league)
  end

  def league_params
    params.require(:league).permit(:name, :description, :league_type, :season, :status, :is_public)
  end

  def league_json(league, detailed: false, include_membership: false)
    json = {
      id: league.id,
      name: league.name,
      description: league.description,
      league_type: league.league_type,
      season: league.season,
      status: league.status,
      is_public: league.is_public,
      owner: {
        id: league.owner.id,
        name: league.owner.full_name,
        email: league.owner.email
      },
      created_at: league.created_at.iso8601,
      updated_at: league.updated_at.iso8601
    }

    if detailed
      json.merge!({
        teams_count: league.teams.count,
        members_count: league.league_memberships.active.count,
        games_count: league.games.count
      })
    end

    if include_membership && current_user
      membership = league.league_memberships.find_by(user: current_user)
      json[:membership] = membership ? membership_json(membership) : nil
    end

    json
  end

  def membership_json(membership, include_user: false)
    json = {
      id: membership.id,
      role: membership.role,
      display_role: membership.display_role,
      status: membership.status,
      joined_at: membership.joined_at&.iso8601,
      can_manage_teams: membership.can_manage_teams?,
      can_record_stats: membership.can_record_stats?,
      can_view_analytics: membership.can_view_analytics?,
      can_manage_league: membership.can_manage_league?
    }

    if include_user
      json[:user] = {
        id: membership.user.id,
        name: membership.user.full_name,
        email: membership.user.email
      }
    end

    json
  end

  def team_standings_json(team)
    {
      id: team.id,
      name: team.name,
      wins: team.wins,
      losses: team.losses,
      games_played: team.games_played,
      win_percentage: team.win_percentage
    }
  end
end