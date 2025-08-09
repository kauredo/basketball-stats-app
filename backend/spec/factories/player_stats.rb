FactoryBot.define do
  factory :player_stat do
    player { nil }
    game { nil }
    points { 1 }
    field_goals_made { 1 }
    field_goals_attempted { 1 }
    three_pointers_made { 1 }
    three_pointers_attempted { 1 }
    free_throws_made { 1 }
    free_throws_attempted { 1 }
    rebounds { 1 }
    assists { 1 }
    steals { 1 }
    blocks { 1 }
    turnovers { 1 }
    fouls { 1 }
    minutes_played { 1 }
    plus_minus { 1 }
  end
end
