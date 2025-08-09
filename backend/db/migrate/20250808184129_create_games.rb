class CreateGames < ActiveRecord::Migration[8.0]
  def change
    create_table :games do |t|
      t.references :home_team, null: false, foreign_key: { to_table: :teams }
      t.references :away_team, null: false, foreign_key: { to_table: :teams }
      t.datetime :scheduled_at
      t.datetime :started_at
      t.datetime :ended_at
      t.integer :status, default: 0
      t.integer :current_quarter, default: 1
      t.integer :time_remaining_seconds, default: 720  # 12 minutes
      t.integer :home_score, default: 0
      t.integer :away_score, default: 0
      t.json :game_settings

      t.timestamps
    end

    add_index :games, [ :home_team_id, :away_team_id ]
    add_index :games, :scheduled_at
    add_index :games, :status
  end
end
