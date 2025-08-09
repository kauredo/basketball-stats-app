class StatisticsService
  def self.player_season_stats(player, league, season = nil)
    stats_query = player.player_stats.joins(game: :teams).where(teams: { league: league })
    stats_query = stats_query.joins(:game).where(games: { season: season }) if season
    
    return empty_player_stats if stats_query.empty?
    
    games_played = stats_query.count
    totals = calculate_totals(stats_query)
    averages = calculate_averages(totals, games_played)
    percentages = calculate_shooting_percentages(totals)
    advanced_stats = calculate_advanced_stats(totals, averages, games_played)
    
    {
      player_id: player.id,
      player_name: player.name,
      team: player.team.name,
      position: player.position,
      games_played: games_played,
      **totals,
      **averages,
      **percentages,
      **advanced_stats
    }
  end
  
  def self.team_season_stats(team, season = nil)
    games_query = team.games.where(league: team.league)
    games_query = games_query.where(season: season) if season
    
    return empty_team_stats if games_query.empty?
    
    games_played = games_query.count
    wins = calculate_team_wins(team, games_query)
    losses = games_played - wins
    win_percentage = games_played.zero? ? 0.0 : (wins.to_f / games_played * 100).round(1)
    
    # Aggregate all player stats for the team
    player_stats = PlayerStat.joins(:player, :game)
                            .where(players: { team: team })
                            .where(games: games_query)
    
    return empty_team_stats if player_stats.empty?
    
    totals = calculate_totals(player_stats)
    averages = calculate_averages(totals, games_played)
    percentages = calculate_shooting_percentages(totals)
    
    {
      team_id: team.id,
      team_name: team.name,
      games_played: games_played,
      wins: wins,
      losses: losses,
      win_percentage: win_percentage,
      **totals,
      **averages,
      **percentages
    }
  end
  
  def self.league_leaders(league, stat_category, season = nil, limit = 10)
    stats_query = PlayerStat.joins(player: { team: [] }, game: [])
                           .where(teams: { league: league })
                           
    stats_query = stats_query.joins(:game).where(games: { season: season }) if season
    
    case stat_category.to_s
    when 'points'
      stats_query.joins(:player)
                 .group('players.id, players.name')
                 .order('AVG(player_stats.points) DESC')
                 .limit(limit)
                 .calculate('AVG(player_stats.points)')
    when 'rebounds'
      stats_query.joins(:player)
                 .group('players.id, players.name')
                 .order('AVG(player_stats.rebounds) DESC')
                 .limit(limit)
                 .calculate('AVG(player_stats.rebounds)')
    when 'assists'
      stats_query.joins(:player)
                 .group('players.id, players.name')
                 .order('AVG(player_stats.assists) DESC')
                 .limit(limit)
                 .calculate('AVG(player_stats.assists)')
    when 'field_goal_percentage'
      # Only include players with minimum attempts
      stats_query.joins(:player)
                 .group('players.id, players.name')
                 .having('SUM(player_stats.field_goals_attempted) >= ?', 10)
                 .order('(SUM(player_stats.field_goals_made)::float / SUM(player_stats.field_goals_attempted)) DESC')
                 .limit(limit)
                 .pluck(
                   'players.id',
                   'players.name', 
                   'SUM(player_stats.field_goals_made)::float / SUM(player_stats.field_goals_attempted) * 100'
                 )
                 .map { |id, name, percentage| [name, percentage.round(1)] }
                 .to_h
    else
      {}
    end
  end
  
  def self.player_game_log(player, league, season = nil, limit = 20)
    games_query = player.games.joins(:teams).where(teams: { league: league })
    games_query = games_query.where(season: season) if season
    
    games_query.joins(:player_stats)
               .where(player_stats: { player: player })
               .includes(:home_team, :away_team, :player_stats)
               .order(game_date: :desc)
               .limit(limit)
               .map do |game|
      stat = game.player_stats.find { |ps| ps.player_id == player.id }
      
      {
        game_id: game.id,
        game_date: game.game_date,
        opponent: game.home_team == player.team ? game.away_team.name : game.home_team.name,
        home_game: game.home_team == player.team,
        result: game.status == 'completed' ? game_result(game, player.team) : 'N/A',
        minutes: stat.minutes_played,
        points: stat.points,
        rebounds: stat.rebounds,
        assists: stat.assists,
        field_goals: "#{stat.field_goals_made}/#{stat.field_goals_attempted}",
        field_goal_percentage: stat.field_goal_percentage,
        three_pointers: "#{stat.three_pointers_made}/#{stat.three_pointers_attempted}",
        three_point_percentage: stat.three_point_percentage,
        free_throws: "#{stat.free_throws_made}/#{stat.free_throws_attempted}",
        free_throw_percentage: stat.free_throw_percentage,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        fouls: stat.fouls,
        plus_minus: stat.plus_minus
      }
    end
  end
  
  private
  
  def self.calculate_totals(stats_query)
    {
      total_points: stats_query.sum(:points),
      total_field_goals_made: stats_query.sum(:field_goals_made),
      total_field_goals_attempted: stats_query.sum(:field_goals_attempted),
      total_three_pointers_made: stats_query.sum(:three_pointers_made),
      total_three_pointers_attempted: stats_query.sum(:three_pointers_attempted),
      total_free_throws_made: stats_query.sum(:free_throws_made),
      total_free_throws_attempted: stats_query.sum(:free_throws_attempted),
      total_rebounds: stats_query.sum(:rebounds),
      total_assists: stats_query.sum(:assists),
      total_steals: stats_query.sum(:steals),
      total_blocks: stats_query.sum(:blocks),
      total_turnovers: stats_query.sum(:turnovers),
      total_fouls: stats_query.sum(:fouls),
      total_minutes: stats_query.sum(:minutes_played)
    }
  end
  
  def self.calculate_averages(totals, games_played)
    return {} if games_played.zero?
    
    {
      avg_points: (totals[:total_points].to_f / games_played).round(1),
      avg_field_goals_made: (totals[:total_field_goals_made].to_f / games_played).round(1),
      avg_field_goals_attempted: (totals[:total_field_goals_attempted].to_f / games_played).round(1),
      avg_three_pointers_made: (totals[:total_three_pointers_made].to_f / games_played).round(1),
      avg_three_pointers_attempted: (totals[:total_three_pointers_attempted].to_f / games_played).round(1),
      avg_free_throws_made: (totals[:total_free_throws_made].to_f / games_played).round(1),
      avg_free_throws_attempted: (totals[:total_free_throws_attempted].to_f / games_played).round(1),
      avg_rebounds: (totals[:total_rebounds].to_f / games_played).round(1),
      avg_assists: (totals[:total_assists].to_f / games_played).round(1),
      avg_steals: (totals[:total_steals].to_f / games_played).round(1),
      avg_blocks: (totals[:total_blocks].to_f / games_played).round(1),
      avg_turnovers: (totals[:total_turnovers].to_f / games_played).round(1),
      avg_fouls: (totals[:total_fouls].to_f / games_played).round(1),
      avg_minutes: (totals[:total_minutes].to_f / games_played).round(1)
    }
  end
  
  def self.calculate_shooting_percentages(totals)
    {
      field_goal_percentage: calculate_percentage(totals[:total_field_goals_made], totals[:total_field_goals_attempted]),
      three_point_percentage: calculate_percentage(totals[:total_three_pointers_made], totals[:total_three_pointers_attempted]),
      free_throw_percentage: calculate_percentage(totals[:total_free_throws_made], totals[:total_free_throws_attempted]),
      effective_field_goal_percentage: calculate_efg_percentage(totals),
      true_shooting_percentage: calculate_ts_percentage(totals)
    }
  end
  
  def self.calculate_advanced_stats(totals, averages, games_played)
    {
      player_efficiency_rating: calculate_per(totals, averages, games_played),
      usage_rate: calculate_usage_rate(totals, games_played),
      assist_to_turnover_ratio: calculate_ast_to_ratio(totals[:total_assists], totals[:total_turnovers])
    }
  end
  
  def self.calculate_percentage(made, attempted)
    return 0.0 if attempted.zero?
    ((made.to_f / attempted) * 100).round(1)
  end
  
  def self.calculate_efg_percentage(totals)
    attempted = totals[:total_field_goals_attempted]
    return 0.0 if attempted.zero?
    
    made = totals[:total_field_goals_made]
    three_made = totals[:total_three_pointers_made]
    
    (((made + (0.5 * three_made)).to_f / attempted) * 100).round(1)
  end
  
  def self.calculate_ts_percentage(totals)
    fga = totals[:total_field_goals_attempted]
    fta = totals[:total_free_throws_attempted]
    points = totals[:total_points]
    
    true_shot_attempts = fga + (0.44 * fta)
    return 0.0 if true_shot_attempts.zero?
    
    ((points.to_f / (2 * true_shot_attempts)) * 100).round(1)
  end
  
  def self.calculate_per(totals, averages, games_played)
    # Simplified PER calculation
    return 0.0 if games_played.zero?
    
    factor = (averages[:avg_field_goals_made] + 0.5 * averages[:avg_three_pointers_made] + 
             averages[:avg_free_throws_made] + averages[:avg_rebounds] + 
             averages[:avg_assists] + averages[:avg_steals] + averages[:avg_blocks] -
             (averages[:avg_field_goals_attempted] - averages[:avg_field_goals_made]) -
             (averages[:avg_free_throws_attempted] - averages[:avg_free_throws_made]) -
             averages[:avg_turnovers])
    
    [factor * 15, 0].max.round(1)
  end
  
  def self.calculate_usage_rate(totals, games_played)
    # Simplified usage rate - percentage of team possessions used by player
    return 0.0 if games_played.zero?
    
    player_possessions = totals[:total_field_goals_attempted] + 
                        (0.44 * totals[:total_free_throws_attempted]) + 
                        totals[:total_turnovers]
    
    # Estimate team possessions (simplified)
    estimated_team_possessions = games_played * 100
    
    return 0.0 if estimated_team_possessions.zero?
    ((player_possessions.to_f / estimated_team_possessions) * 100).round(1)
  end
  
  def self.calculate_ast_to_ratio(assists, turnovers)
    return assists.to_f if turnovers.zero?
    (assists.to_f / turnovers).round(2)
  end
  
  def self.calculate_team_wins(team, games_query)
    wins = 0
    games_query.find_each do |game|
      next unless game.status == 'completed'
      
      if game.home_team == team && game.home_score > game.away_score
        wins += 1
      elsif game.away_team == team && game.away_score > game.home_score
        wins += 1
      end
    end
    wins
  end
  
  def self.game_result(game, team)
    return 'N/A' unless game.status == 'completed'
    
    if game.home_team == team
      game.home_score > game.away_score ? 'W' : 'L'
    else
      game.away_score > game.home_score ? 'W' : 'L'
    end
  end
  
  def self.empty_player_stats
    {
      games_played: 0,
      total_points: 0,
      avg_points: 0.0,
      total_rebounds: 0,
      avg_rebounds: 0.0,
      total_assists: 0,
      avg_assists: 0.0,
      field_goal_percentage: 0.0
    }
  end
  
  def self.empty_team_stats
    {
      games_played: 0,
      wins: 0,
      losses: 0,
      win_percentage: 0.0,
      total_points: 0,
      avg_points: 0.0
    }
  end
end