class Game < ApplicationRecord
  # Associations
  belongs_to :home_team, class_name: 'Team'
  belongs_to :away_team, class_name: 'Team'
  belongs_to :user, optional: true  # Game creator/manager
  has_many :player_stats, dependent: :destroy
  has_many :players, through: :player_stats
  has_one :league, through: :home_team

  # Enums
  enum :status, { scheduled: 0, active: 1, paused: 2, completed: 3 }

  # Validations
  validates :current_quarter, inclusion: { in: 1..4 }
  validates :time_remaining_seconds, numericality: { greater_than_or_equal_to: 0 }
  validate :teams_in_same_league

  # Scopes
  scope :in_league, ->(league) { joins(:home_team).where(teams: { league_id: league.id }) }

  after_create :initialize_player_stats

  def start_game!
    update!(status: :active, started_at: Time.current)
    broadcast_game_update
  end

  def pause_game!
    update!(status: :paused)
    broadcast_game_update
  end

  def resume_game!
    update!(status: :active)
    broadcast_game_update
  end

  def end_game!
    update!(status: :completed, ended_at: Time.current)
    broadcast_game_update
  end

  def time_display
    minutes = time_remaining_seconds / 60
    seconds = time_remaining_seconds % 60
    "#{minutes}:#{seconds.to_s.rjust(2, '0')}"
  end

  def box_score
    {
      home_team: {
        team: home_team,
        score: home_score,
        stats: player_stats.joins(:player).where(players: { team_id: home_team_id })
      },
      away_team: {
        team: away_team,
        score: away_score,
        stats: player_stats.joins(:player).where(players: { team_id: away_team_id })
      }
    }
  end

  def duration_minutes
    if started_at && ended_at
      ((ended_at - started_at) / 1.minute).round
    elsif started_at
      ((Time.current - started_at) / 1.minute).round
    else
      0
    end
  end

  def can_be_managed_by?(user)
    return false unless user
    return true if self.user == user
    return true if league&.owner == user
    return true if league&.league_memberships&.active&.exists?(user: user, role: ['admin', 'coach', 'scorekeeper'])
    false
  end

  private

  def initialize_player_stats
    (home_team.active_players + away_team.active_players).each do |player|
      player_stats.create!(player: player)
    end
  end

  def teams_in_same_league
    return unless home_team && away_team
    
    if home_team.league_id != away_team.league_id
      errors.add(:away_team, 'must be in the same league as home team')
    end
  end

  def broadcast_game_update
    ActionCable.server.broadcast("game_#{id}", {
      type: 'game_update',
      game: as_json(include: [:home_team, :away_team])
    })
  end
end