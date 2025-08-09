FactoryBot.define do
  factory :league_membership do
    user { nil }
    league { nil }
    role { "MyString" }
    status { "MyString" }
    joined_at { "2025-08-09 13:05:17" }
  end
end
