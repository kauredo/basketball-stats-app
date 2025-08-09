class League < ApplicationRecord
  # Associations
  belongs_to :created_by, class_name: 'User'
  belongs_to :owner, class_name: 'User'
  has_many :league_memberships, dependent: :destroy
  has_many :users, through: :league_memberships
  has_many :teams, dependent: :destroy
  has_many :games, through: :teams
  has_many :players, through: :teams
  
  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :league_type, inclusion: { in: %w[professional college high_school youth recreational] }
  validates :season, presence: true
  validates :status, inclusion: { in: %w[draft active completed archived] }
  
  # Enums
  enum :league_type, {
    professional: 'professional',
    college: 'college',
    high_school: 'high_school',
    youth: 'youth',
    recreational: 'recreational'
  }
  
  enum :status, {
    draft: 'draft',
    active: 'active', 
    completed: 'completed',
    archived: 'archived'
  }
  
  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :public_leagues, -> { where(is_public: true) }
  scope :by_type, ->(type) { where(league_type: type) }
  scope :current_season, -> { where(season: current_season_name) }
  
  # Callbacks
  after_create :add_owner_as_admin
  
  def self.current_season_name
    "#{Date.current.year}-#{Date.current.year + 1}"
  end
  
  def standings
    teams.joins(:home_games, :away_games)
         .group('teams.id')
         .select('teams.*, 
                  COUNT(CASE WHEN (games.home_team_id = teams.id AND games.home_score > games.away_score) 
                              OR (games.away_team_id = teams.id AND games.away_score > games.home_score) 
                         THEN 1 END) as wins,
                  COUNT(CASE WHEN (games.home_team_id = teams.id AND games.home_score < games.away_score)
                              OR (games.away_team_id = teams.id AND games.away_score < games.home_score)
                         THEN 1 END) as losses,
                  COUNT(games.id) as games_played')
         .order('wins DESC, losses ASC')
  end
  
  def add_user(user, role: 'member')
    return false if league_memberships.exists?(user: user)
    
    league_memberships.create!(
      user: user,
      role: role,
      status: 'active',
      joined_at: Time.current
    )
  end
  
  def remove_user(user)
    league_memberships.find_by(user: user)&.destroy
  end
  
  def user_role(user)
    return 'owner' if owner == user
    league_memberships.find_by(user: user)&.role
  end
  
  def can_user_access?(user)
    return true if owner == user
    league_memberships.active.exists?(user: user)
  end
  
  def invite_code
    "#{name.parameterize}-#{id}"
  end
  
  private
  
  def add_owner_as_admin
    league_memberships.create!(
      user: owner,
      role: 'admin',
      status: 'active',
      joined_at: Time.current
    )
  end
end
