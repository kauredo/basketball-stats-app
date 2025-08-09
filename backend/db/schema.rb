# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_08_09_120708) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "games", force: :cascade do |t|
    t.bigint "home_team_id", null: false
    t.bigint "away_team_id", null: false
    t.datetime "scheduled_at"
    t.datetime "started_at"
    t.datetime "ended_at"
    t.integer "status", default: 0
    t.integer "current_quarter", default: 1
    t.integer "time_remaining_seconds", default: 720
    t.integer "home_score", default: 0
    t.integer "away_score", default: 0
    t.json "game_settings"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["away_team_id"], name: "index_games_on_away_team_id"
    t.index ["home_team_id", "away_team_id"], name: "index_games_on_home_team_id_and_away_team_id"
    t.index ["home_team_id"], name: "index_games_on_home_team_id"
    t.index ["scheduled_at"], name: "index_games_on_scheduled_at"
    t.index ["status"], name: "index_games_on_status"
    t.index ["user_id"], name: "index_games_on_user_id"
  end

  create_table "league_memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "league_id", null: false
    t.string "role"
    t.string "status"
    t.datetime "joined_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["league_id"], name: "index_league_memberships_on_league_id"
    t.index ["user_id"], name: "index_league_memberships_on_user_id"
  end

  create_table "leagues", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.string "league_type"
    t.string "season"
    t.string "status"
    t.bigint "created_by_id", null: false
    t.bigint "owner_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_public"
    t.index ["created_by_id"], name: "index_leagues_on_created_by_id"
    t.index ["owner_id"], name: "index_leagues_on_owner_id"
  end

  create_table "player_stats", force: :cascade do |t|
    t.bigint "player_id", null: false
    t.bigint "game_id", null: false
    t.integer "points", default: 0
    t.integer "field_goals_made", default: 0
    t.integer "field_goals_attempted", default: 0
    t.integer "three_pointers_made", default: 0
    t.integer "three_pointers_attempted", default: 0
    t.integer "free_throws_made", default: 0
    t.integer "free_throws_attempted", default: 0
    t.integer "rebounds", default: 0
    t.integer "assists", default: 0
    t.integer "steals", default: 0
    t.integer "blocks", default: 0
    t.integer "turnovers", default: 0
    t.integer "fouls", default: 0
    t.integer "minutes_played", default: 0
    t.integer "plus_minus", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id", "player_id"], name: "index_player_stats_on_game_id_and_player_id", unique: true
    t.index ["game_id"], name: "index_player_stats_on_game_id"
    t.index ["player_id"], name: "index_player_stats_on_player_id"
    t.index ["points"], name: "index_player_stats_on_points"
  end

  create_table "players", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.string "name", null: false
    t.integer "number", null: false
    t.string "position"
    t.integer "height_cm"
    t.integer "weight_kg"
    t.date "birth_date"
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_players_on_name"
    t.index ["team_id", "number"], name: "index_players_on_team_id_and_number", unique: true
    t.index ["team_id"], name: "index_players_on_team_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "name", null: false
    t.string "city"
    t.string "logo_url"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "league_id"
    t.index ["league_id"], name: "index_teams_on_league_id"
    t.index ["name"], name: "index_teams_on_name", unique: true
    t.index ["user_id"], name: "index_teams_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.string "first_name"
    t.string "last_name"
    t.string "role"
    t.datetime "confirmed_at"
    t.string "confirmation_token"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "games", "teams", column: "away_team_id"
  add_foreign_key "games", "teams", column: "home_team_id"
  add_foreign_key "games", "users"
  add_foreign_key "league_memberships", "leagues"
  add_foreign_key "league_memberships", "users"
  add_foreign_key "leagues", "users", column: "created_by_id"
  add_foreign_key "leagues", "users", column: "owner_id"
  add_foreign_key "player_stats", "games"
  add_foreign_key "player_stats", "players"
  add_foreign_key "players", "teams"
  add_foreign_key "teams", "leagues"
  add_foreign_key "teams", "users"
end
