class CreatePlayers < ActiveRecord::Migration[8.0]
  def change
    create_table :players do |t|
      t.references :team, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :number, null: false
      t.string :position
      t.integer :height_cm
      t.integer :weight_kg
      t.date :birth_date
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :players, [:team_id, :number], unique: true
    add_index :players, :name
  end
end
