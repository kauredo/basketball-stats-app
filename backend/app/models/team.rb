class Team < ApplicationRecord
  # Associations
  belongs_to :league, optional: true  # Optional during transition
  belongs_to :user, optional: true  # Team owner/manager
  has_many :players, dependent: :destroy
  has_many :home_games, class_name: 'Game', foreign_key: 'home_team_id'
  has_many :away_games, class_name: 'Game', foreign_key: 'away_team_id'

  # Validations
  validates :name, presence: true, uniqueness: { scope: :league_id }

  # Scopes
  scope :active, -> { where(active: true) }
  scope :in_league, ->(league) { where(league: league) }

  def games
    Game.where('home_team_id = ? OR away_team_id = ?', id, id)
  end

  def active_players
    players.where(active: true)
  end
  
  def active_players_count
    active_players.count
  end

  def wins
    games.completed.where(
      '(home_team_id = ? AND home_score > away_score) OR (away_team_id = ? AND away_score > home_score)',
      id, id
    ).count
  end

  def losses
    games.completed.where(
      '(home_team_id = ? AND home_score < away_score) OR (away_team_id = ? AND away_score < home_score)',
      id, id
    ).count
  end

  def games_played
    games.completed.count
  end

  def win_percentage
    return 0.0 if games_played.zero?
    (wins.to_f / games_played * 100).round(1)
  end

  def can_be_managed_by?(user)
    return false unless user
    return true if league.owner == user
    return true if self.user == user
    return true if league.league_memberships.active.exists?(user: user, role: ['admin', 'coach'])
    false
  end
end