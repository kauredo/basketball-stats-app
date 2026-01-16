class Api::V1::StatisticsController < Api::V1::BaseController
  before_action :authenticate_user
  before_action :set_league
  before_action :ensure_league_access

  # GET /api/v1/statistics/players
  # Get all players statistics for the league
  def players
    season = params[:season]
    page = params[:page] || 1
    per_page = params[:per_page] || 20
    sort_by = params[:sort_by] || 'avg_points'
    order = params[:order] || 'desc'

    players = @league.players.includes(:team, player_stats: :game)

    player_stats = players.map do |player|
      StatisticsService.player_season_stats(player, @league, season)
    end

    # Sort the results
    player_stats = player_stats.sort_by { |stats| stats[sort_by.to_sym] || 0 }
    player_stats.reverse! if order == 'desc'

    # Apply pagination
    total = player_stats.count
    start_index = (page.to_i - 1) * per_page.to_i
    end_index = start_index + per_page.to_i - 1
    paginated_stats = player_stats[start_index..end_index] || []

    render json: {
      players: paginated_stats,
      pagination: {
        current_page: page.to_i,
        per_page: per_page.to_i,
        total_pages: (total.to_f / per_page.to_i).ceil,
        total_count: total
      }
    }
  end

  # GET /api/v1/statistics/players/:id
  # Get individual player detailed statistics
  def player
    player = @league.players.find(params[:id])
    season = params[:season]

    player_stats = StatisticsService.player_season_stats(player, @league, season)
    game_log = StatisticsService.player_game_log(player, @league, season, 10)

    render json: {
      player: {
        id: player.id,
        name: player.name,
        team: player.team.name,
        position: player.position,
        number: player.number
      },
      season_stats: player_stats,
      recent_games: game_log
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Player not found' }, status: :not_found
  end

  # GET /api/v1/statistics/teams
  # Get all teams statistics for the league
  def teams
    season = params[:season]
    sort_by = params[:sort_by] || 'win_percentage'
    order = params[:order] || 'desc'

    teams_stats = @league.teams.map do |team|
      StatisticsService.team_season_stats(team, season)
    end

    # Sort the results
    teams_stats = teams_stats.sort_by { |stats| stats[sort_by.to_sym] || 0 }
    teams_stats.reverse! if order == 'desc'

    render json: {
      teams: teams_stats
    }
  end

  # GET /api/v1/statistics/teams/:id
  # Get individual team detailed statistics
  def team
    team = @league.teams.find(params[:id])
    season = params[:season]

    team_stats = StatisticsService.team_season_stats(team, season)

    # Get top performers for this team
    team_players = team.players.includes(player_stats: :game)
    top_scorers = team_players.map do |player|
      stats = StatisticsService.player_season_stats(player, @league, season)
      next if stats[:games_played].zero?

      {
        player_id: player.id,
        player_name: player.name,
        avg_points: stats[:avg_points]
      }
    end.compact.sort_by { |p| p[:avg_points] }.reverse.first(5)

    top_rebounders = team_players.map do |player|
      stats = StatisticsService.player_season_stats(player, @league, season)
      next if stats[:games_played].zero?

      {
        player_id: player.id,
        player_name: player.name,
        avg_rebounds: stats[:avg_rebounds]
      }
    end.compact.sort_by { |p| p[:avg_rebounds] }.reverse.first(5)

    render json: {
      team: {
        id: team.id,
        name: team.name,
        city: team.city
      },
      season_stats: team_stats,
      top_scorers: top_scorers,
      top_rebounders: top_rebounders
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Team not found' }, status: :not_found
  end

  # GET /api/v1/statistics/leagues/:league_id/leaders
  # Get statistical leaders for the league
  def leaders
    season = params[:season]

    # Get all players with their stats for the league
    players = @league.players.includes(:team, player_stats: :game)

    # Calculate stats for each player
    player_stats = players.map do |player|
      StatisticsService.player_season_stats(player, @league, season)
    end

    # Filter out players with no games
    player_stats.reject { |stats| stats[:games_played].zero? }

    # Create leaderboards for key stats
    render json: {
      league: {
        id: @league.id,
        name: @league.name,
        season: @league.season || 'Current',
        total_teams: @league.teams.count,
        total_players: @league.players.count
      }
    }
  end

  # GET /api/v1/statistics/leagues/:league_id/dashboard
  def dashboard
    season = params[:season]

    # League leaders in key categories
    scoring_leaders = StatisticsService.league_leaders(@league, 'points', season, 5)
    rebounding_leaders = StatisticsService.league_leaders(@league, 'rebounds', season, 5)
    assists_leaders = StatisticsService.league_leaders(@league, 'assists', season, 5)
    shooting_leaders = StatisticsService.league_leaders(@league, 'field_goal_percentage', season, 5)

    # Team standings
    team_standings = @league.teams.map do |team|
      StatisticsService.team_season_stats(team, season)
    end.sort_by { |stats| stats[:win_percentage] }.reverse

    # Recent high-scoring games
    recent_games = @league.games
                     .where(status: 'completed')
                     .order(game_date: :desc)
                     .limit(5)
                     .map do |game|
      {
        id: game.id,
        date: game.game_date,
        home_team: game.home_team.name,
        away_team: game.away_team.name,
        home_score: game.home_score,
        away_score: game.away_score,
        total_points: game.home_score + game.away_score
      }
    end

    render json: {
      leaders: {
        scoring: scoring_leaders,
        rebounding: rebounding_leaders,
        assists: assists_leaders,
        shooting: shooting_leaders
      },
      standings: team_standings,
      recent_games: recent_games,
      league_info: {
        total_games: @league.games.completed.count,
        total_teams: @league.teams.count,
        total_players: @league.players.count
      }
    }
  end

  private

  def set_league
    @league = current_user.leagues.find(params[:league_id] || current_user.selected_league&.id)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'League not found or access denied' }, status: :forbidden
  end

  def ensure_league_access
    return if current_user.can_access_league?(@league)

    render json: { error: 'Access denied to this league' }, status: :forbidden
  end
end
