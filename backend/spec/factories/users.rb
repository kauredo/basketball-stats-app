FactoryBot.define do
  factory :user do
    email { "MyString" }
    password_digest { "MyString" }
    first_name { "MyString" }
    last_name { "MyString" }
    role { "MyString" }
    confirmed_at { "2025-08-09 13:05:07" }
    confirmation_token { "MyString" }
    reset_password_token { "MyString" }
    reset_password_sent_at { "2025-08-09 13:05:07" }
  end
end
