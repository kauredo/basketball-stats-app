class Player < ApplicationRecord
  belongs_to :team
  has_many :player_stats, dependent: :destroy
  has_many :games, through: :player_stats

  validates :name, presence: true
  validates :number, presence: true, uniqueness: { scope: :team_id }
  validates :position, inclusion: { in: %w[PG SG SF PF C] }, allow_blank: true

  def season_averages(season = nil)
    stats = season ? player_stats.joins(:game).where(games: { season: season }) : player_stats
    return {} if stats.empty?

    games_played = stats.count
    {
      games_played: games_played,
      points: stats.average(:points).to_f.round(1),
      rebounds: stats.average(:rebounds).to_f.round(1),
      assists: stats.average(:assists).to_f.round(1),
      field_goal_percentage: calculate_percentage(stats.sum(:field_goals_made), stats.sum(:field_goals_attempted))
    }
  end

  def age
    return nil unless birth_date
    ((Time.current - birth_date.to_time) / 1.year.seconds).floor
  end

  private

  def calculate_percentage(made, attempted)
    return 0.0 if attempted.zero?
    ((made.to_f / attempted) * 100).round(1)
  end
end