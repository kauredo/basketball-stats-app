FactoryBot.define do
  factory :game do
    home_team { nil }
    away_team { nil }
    scheduled_at { "2025-08-08 19:41:29" }
    started_at { "2025-08-08 19:41:29" }
    ended_at { "2025-08-08 19:41:29" }
    status { 1 }
    current_quarter { 1 }
    time_remaining_seconds { 1 }
    home_score { 1 }
    away_score { 1 }
    game_settings { "" }
  end
end
