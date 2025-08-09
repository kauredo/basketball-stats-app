FactoryBot.define do
  factory :player do
    team { nil }
    name { "MyString" }
    number { 1 }
    position { "MyString" }
    height_cm { 1 }
    weight_kg { 1 }
    birth_date { "2025-08-08" }
    active { false }
  end
end
