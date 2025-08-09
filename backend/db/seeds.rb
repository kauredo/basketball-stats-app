# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create teams
lakers = Team.find_or_create_by!(name: "Los Angeles Lakers") do |team|
  team.city = "Los Angeles"
  team.description = "Professional basketball team"
end

celtics = Team.find_or_create_by!(name: "Boston Celtics") do |team|
  team.city = "Boston"
  team.description = "Professional basketball team"
end

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

# Create a sample game
sample_game = Game.find_or_create_by!(
  home_team: lakers,
  away_team: celtics,
  scheduled_at: 1.hour.from_now
)

puts "✅ Seed data created successfully!"
puts "Teams: #{Team.count}"
puts "Players: #{Player.count}"
puts "Games: #{Game.count}"