class CreatePlayerStats < ActiveRecord::Migration[8.0]
  def change
    create_table :player_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      
      # Scoring
      t.integer :points, default: 0
      t.integer :field_goals_made, default: 0
      t.integer :field_goals_attempted, default: 0
      t.integer :three_pointers_made, default: 0
      t.integer :three_pointers_attempted, default: 0
      t.integer :free_throws_made, default: 0
      t.integer :free_throws_attempted, default: 0
      
      # Other stats
      t.integer :rebounds, default: 0
      t.integer :assists, default: 0
      t.integer :steals, default: 0
      t.integer :blocks, default: 0
      t.integer :turnovers, default: 0
      t.integer :fouls, default: 0
      t.integer :minutes_played, default: 0
      
      # Advanced stats
      t.integer :plus_minus, default: 0

      t.timestamps
    end

    add_index :player_stats, [:game_id, :player_id], unique: true
    add_index :player_stats, :points
  end
end
