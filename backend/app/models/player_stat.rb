class PlayerStat < ApplicationRecord
  belongs_to :player
  belongs_to :game

  validates :points, :field_goals_made, :field_goals_attempted,
            :three_pointers_made, :three_pointers_attempted,
            :free_throws_made, :free_throws_attempted,
            :rebounds, :assists, :steals, :blocks, :turnovers, :fouls,
            numericality: { greater_than_or_equal_to: 0 }

  validate :field_goals_made_not_greater_than_attempted
  validate :three_pointers_made_not_greater_than_attempted
  validate :free_throws_made_not_greater_than_attempted

  after_update :broadcast_stat_update

  def field_goal_percentage
    return 0.0 if field_goals_attempted.zero?
    ((field_goals_made.to_f / field_goals_attempted) * 100).round(1)
  end

  def three_point_percentage
    return 0.0 if three_pointers_attempted.zero?
    ((three_pointers_made.to_f / three_pointers_attempted) * 100).round(1)
  end

  def free_throw_percentage
    return 0.0 if free_throws_attempted.zero?
    ((free_throws_made.to_f / free_throws_attempted) * 100).round(1)
  end

  def effective_field_goal_percentage
    return 0.0 if field_goals_attempted.zero?
    (((field_goals_made + (0.5 * three_pointers_made)).to_f / field_goals_attempted) * 100).round(1)
  end

  def true_shooting_percentage
    true_shot_attempts = field_goals_attempted + (0.44 * free_throws_attempted)
    return 0.0 if true_shot_attempts.zero?
    ((points.to_f / (2 * true_shot_attempts)) * 100).round(1)
  end

  def update_stat(stat_type, value = 1, made = true)
    case stat_type.to_s
    when "shot2"
      increment!(:field_goals_attempted)
      if made
        increment!(:field_goals_made)
        increment!(:points, 2)
        update_team_score(2)
      end
    when "shot3"
      increment!(:three_pointers_attempted)
      increment!(:field_goals_attempted)
      if made
        increment!(:three_pointers_made)
        increment!(:field_goals_made)
        increment!(:points, 3)
        update_team_score(3)
      end
    when "freethrow"
      increment!(:free_throws_attempted)
      if made
        increment!(:free_throws_made)
        increment!(:points, 1)
        update_team_score(1)
      end
    else
      increment!(stat_type.to_sym, value)
    end
  end

  private

  def field_goals_made_not_greater_than_attempted
    return unless field_goals_made > field_goals_attempted
    errors.add(:field_goals_made, "cannot be greater than attempts")
  end

  def three_pointers_made_not_greater_than_attempted
    return unless three_pointers_made > three_pointers_attempted
    errors.add(:three_pointers_made, "cannot be greater than attempts")
  end

  def free_throws_made_not_greater_than_attempted
    return unless free_throws_made > free_throws_attempted
    errors.add(:free_throws_made, "cannot be greater than attempts")
  end

  def update_team_score(points)
    if player.team == game.home_team
      game.increment!(:home_score, points)
    else
      game.increment!(:away_score, points)
    end
  end

  def broadcast_stat_update
    ActionCable.server.broadcast("game_#{game_id}_stats", {
      type: "stat_update",
      player_id: player_id,
      stats: as_json,
      game_score: {
        home_score: game.home_score,
        away_score: game.away_score
      }
    })
  end
end
