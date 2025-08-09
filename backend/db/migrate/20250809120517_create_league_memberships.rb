class CreateLeagueMemberships < ActiveRecord::Migration[8.0]
  def change
    create_table :league_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :league, null: false, foreign_key: true
      t.string :role
      t.string :status
      t.datetime :joined_at

      t.timestamps
    end
  end
end
