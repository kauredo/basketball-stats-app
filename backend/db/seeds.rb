# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "Dropping all tables"
User.destroy_all
Team.destroy_all
Player.destroy_all
Game.destroy_all
League.destroy_all
LeagueMembership.destroy_all

puts "🌱 Creating seed data..."

# Create users
admin_user = User.find_or_create_by!(email: "admin@basketballstats.com") do |user|
  user.password = "password123"
  user.first_name = "Admin"
  user.last_name = "User"
  user.role = "admin"
  user.confirmed_at = Time.current
end

coach_user = User.find_or_create_by!(email: "coach@basketballstats.com") do |user|
  user.password = "password123"
  user.first_name = "Coach"
  user.last_name = "Johnson"
  user.role = "user"
  user.confirmed_at = Time.current
end

scorekeeper = User.find_or_create_by!(email: "scorekeeper@basketballstats.com") do |user|
  user.password = "password123"
  user.first_name = "Score"
  user.last_name = "Keeper"
  user.role = "user"
  user.confirmed_at = Time.current
end

puts "👤 Created users"

# Create leagues
nba_league = League.find_or_create_by!(name: "NBA 2025-2026") do |league|
  league.description = "Professional basketball league in North America"
  league.league_type = "professional"
  league.season = "2025-2026"
  league.status = "active"
  league.created_by = admin_user
  league.owner = admin_user
end

rec_league = League.find_or_create_by!(name: "Downtown Recreational League") do |league|
  league.description = "Local recreational basketball league"
  league.league_type = "recreational"
  league.season = League.current_season_name
  league.status = "active"
  league.created_by = coach_user
  league.owner = coach_user
end

puts "🏆 Created leagues"

# Create league memberships
LeagueMembership.find_or_create_by!(user: admin_user, league: nba_league) do |membership|
  membership.role = "admin"
  membership.status = "active"
  membership.joined_at = Time.current
end

LeagueMembership.find_or_create_by!(user: coach_user, league: nba_league) do |membership|
  membership.role = "viewer"
  membership.status = "active"
  membership.joined_at = Time.current
end

LeagueMembership.find_or_create_by!(user: coach_user, league: rec_league) do |membership|
  membership.role = "admin"
  membership.status = "active"
  membership.joined_at = Time.current
end

LeagueMembership.find_or_create_by!(user: scorekeeper, league: rec_league) do |membership|
  membership.role = "scorekeeper"
  membership.status = "active"
  membership.joined_at = Time.current
end

puts "👥 Created league memberships"

# Create teams
lakers = Team.find_or_create_by!(name: "Los Angeles Lakers") do |team|
  team.city = "Los Angeles"
  team.description = "Professional basketball team"
  team.league = nba_league
  team.user = admin_user
end

celtics = Team.find_or_create_by!(name: "Boston Celtics") do |team|
  team.city = "Boston"
  team.description = "Professional basketball team"
  team.league = nba_league
  team.user = admin_user
end

downtown_warriors = Team.find_or_create_by!(name: "Downtown Warriors") do |team|
  team.city = "San Francisco"
  team.description = "Local recreational team"
  team.league = rec_league
  team.user = coach_user
end

southside_ballers = Team.find_or_create_by!(name: "Southside Ballers") do |team|
  team.city = "San Francisco"
  team.description = "Local recreational team"
  team.league = rec_league
  team.user = coach_user
end

puts "🏀 Created teams"

# Create Lakers players
lakers_players = [
  { name: "LeBron James", number: 6, position: "SF", height_cm: 206, weight_kg: 113 },
  { name: "Anthony Davis", number: 3, position: "PF", height_cm: 208, weight_kg: 115 },
  { name: "Russell Westbrook", number: 0, position: "PG", height_cm: 191, weight_kg: 91 },
  { name: "Carmelo Anthony", number: 7, position: "SF", height_cm: 203, weight_kg: 109 },
  { name: "Dwight Howard", number: 39, position: "C", height_cm: 211, weight_kg: 120 }
]

lakers_players.each do |player_attrs|
  lakers.players.find_or_create_by!(number: player_attrs[:number]) do |player|
    player.name = player_attrs[:name]
    player.position = player_attrs[:position]
    player.height_cm = player_attrs[:height_cm]
    player.weight_kg = player_attrs[:weight_kg]
    player.active = true
  end
end

# Create Celtics players
celtics_players = [
  { name: "Jayson Tatum", number: 0, position: "SF", height_cm: 203, weight_kg: 95 },
  { name: "Jaylen Brown", number: 7, position: "SG", height_cm: 201, weight_kg: 101 },
  { name: "Marcus Smart", number: 36, position: "PG", height_cm: 193, weight_kg: 100 },
  { name: "Robert Williams III", number: 44, position: "C", height_cm: 206, weight_kg: 108 },
  { name: "Al Horford", number: 42, position: "C", height_cm: 206, weight_kg: 109 }
]

celtics_players.each do |player_attrs|
  celtics.players.find_or_create_by!(number: player_attrs[:number]) do |player|
    player.name = player_attrs[:name]
    player.position = player_attrs[:position]
    player.height_cm = player_attrs[:height_cm]
    player.weight_kg = player_attrs[:weight_kg]
    player.active = true
  end
end

# Create Warriors players
warriors_players = [
  { name: "Michael Johnson", number: 23, position: "SG", height_cm: 188, weight_kg: 82 },
  { name: "David Smith", number: 11, position: "PG", height_cm: 180, weight_kg: 75 },
  { name: "Jason Williams", number: 33, position: "C", height_cm: 203, weight_kg: 102 },
  { name: "Kevin Thomas", number: 21, position: "PF", height_cm: 198, weight_kg: 95 },
  { name: "Eric Davis", number: 10, position: "SF", height_cm: 195, weight_kg: 90 }
]

warriors_players.each do |player_attrs|
  downtown_warriors.players.find_or_create_by!(number: player_attrs[:number]) do |player|
    player.name = player_attrs[:name]
    player.position = player_attrs[:position]
    player.height_cm = player_attrs[:height_cm]
    player.weight_kg = player_attrs[:weight_kg]
    player.active = true
  end
end

# Create Ballers players
ballers_players = [
  { name: "Chris Rodriguez", number: 4, position: "PG", height_cm: 183, weight_kg: 78 },
  { name: "Mark Wilson", number: 15, position: "SG", height_cm: 190, weight_kg: 85 },
  { name: "Andre Martin", number: 32, position: "C", height_cm: 205, weight_kg: 105 },
  { name: "Paul Harris", number: 12, position: "PF", height_cm: 200, weight_kg: 98 },
  { name: "Tyrone Jackson", number: 8, position: "SF", height_cm: 193, weight_kg: 88 }
]

ballers_players.each do |player_attrs|
  southside_ballers.players.find_or_create_by!(number: player_attrs[:number]) do |player|
    player.name = player_attrs[:name]
    player.position = player_attrs[:position]
    player.height_cm = player_attrs[:height_cm]
    player.weight_kg = player_attrs[:weight_kg]
    player.active = true
  end
end

puts "👨‍💼 Created players"

# Create sample games
Game.find_or_create_by!(
  home_team: lakers,
  away_team: celtics
) do |game|
  game.scheduled_at = 1.day.from_now
  game.status = :scheduled
  game.user = admin_user
  game.current_quarter = 1
  game.time_remaining_seconds = 12 * 60
end

Game.find_or_create_by!(
  home_team: downtown_warriors,
  away_team: southside_ballers
) do |game|
  game.scheduled_at = 2.days.from_now
  game.status = :scheduled
  game.user = coach_user
  game.current_quarter = 1
  game.time_remaining_seconds = 10 * 60
end

Game.find_or_create_by!(
  home_team: lakers, 
  away_team: celtics,
  scheduled_at: 1.day.ago
) do |game|
  game.status = :completed
  game.user = admin_user
  game.current_quarter = 4
  game.time_remaining_seconds = 0
  game.home_score = 112
  game.away_score = 108
  game.started_at = 1.day.ago
  game.ended_at = 1.day.ago + 2.hours
end

puts "🏀 Created games"

puts "✅ Seed data created successfully!"
puts "Users: #{User.count}"
puts "Leagues: #{League.count}"
puts "League Memberships: #{LeagueMembership.count}"
puts "Teams: #{Team.count}"
puts "Players: #{Player.count}"
puts "Games: #{Game.count}"