class User < ApplicationRecord
  has_secure_password

  # Associations
  has_many :league_memberships, dependent: :destroy
  has_many :leagues, through: :league_memberships
  has_many :owned_leagues, class_name: "League", foreign_key: "owner_id", dependent: :destroy
  has_many :created_leagues, class_name: "League", foreign_key: "created_by_id", dependent: :destroy
  has_many :teams, foreign_key: "user_id", dependent: :destroy
  has_many :games, foreign_key: "user_id", dependent: :destroy

  # Validations
  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :last_name, presence: true, length: { minimum: 2, maximum: 50 }
  validates :role, inclusion: { in: %w[admin user] }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

  # Enums
  enum :role, { user: "user", admin: "admin" }

  # Scopes
  scope :confirmed, -> { where.not(confirmed_at: nil) }
  scope :unconfirmed, -> { where(confirmed_at: nil) }

  # Callbacks
  before_save :downcase_email
  before_create :generate_confirmation_token

  def full_name
    "#{first_name} #{last_name}"
  end

  def confirmed?
    confirmed_at.present?
  end

  def confirm!
    update!(confirmed_at: Time.current, confirmation_token: nil)
  end

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.urlsafe_base64
  end

  def generate_reset_password_token!
    self.reset_password_token = SecureRandom.urlsafe_base64
    self.reset_password_sent_at = Time.current
    save!
  end

  def reset_password_token_valid?
    reset_password_sent_at && reset_password_sent_at > 2.hours.ago
  end

  def clear_reset_password_token!
    update!(reset_password_token: nil, reset_password_sent_at: nil)
  end

  def league_role(league)
    league_memberships.find_by(league: league)&.role
  end

  def can_access_league?(league)
    league_memberships.active.exists?(league: league) || league.owner == self
  end

  def can_manage_league?(league)
    league.owner == self || league_role(league) == "admin"
  end

  private

  def downcase_email
    self.email = email.downcase.strip if email.present?
  end
end
