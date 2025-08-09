FactoryBot.define do
  factory :league do
    name { "MyString" }
    description { "MyText" }
    league_type { "MyString" }
    season { "MyString" }
    status { "MyString" }
    created_by { nil }
    owner { nil }
  end
end
