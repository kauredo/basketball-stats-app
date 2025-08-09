class LeagueMembership < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :league

  # Validations
  validates :role, inclusion: { in: %w[admin coach scorekeeper member viewer] }
  validates :status, inclusion: { in: %w[pending active suspended removed] }
  validates :user_id, uniqueness: { scope: :league_id }

  # Enums
  enum :role, {
    admin: "admin",
    coach: "coach",
    scorekeeper: "scorekeeper",
    member: "member",
    viewer: "viewer"
  }

  enum :status, {
    pending: "pending",
    active: "active",
    suspended: "suspended",
    removed: "removed"
  }

  # Scopes
  scope :active, -> { where(status: "active") }
  scope :pending, -> { where(status: "pending") }
  scope :by_role, ->(role) { where(role: role) }

  def can_manage_teams?
    %w[admin coach].include?(role)
  end

  def can_record_stats?
    %w[admin coach scorekeeper].include?(role)
  end

  def can_view_analytics?
    %w[admin coach].include?(role)
  end

  def can_manage_league?
    role == "admin"
  end

  def display_role
    case role
    when "admin" then "League Administrator"
    when "coach" then "Coach"
    when "scorekeeper" then "Scorekeeper"
    when "member" then "Member"
    when "viewer" then "Viewer"
    else role.humanize
    end
  end
end
