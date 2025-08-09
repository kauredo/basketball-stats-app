class AddUserToTeams < ActiveRecord::Migration[8.0]
  def change
    add_reference :teams, :user, null: true, foreign_key: true
  end
end
