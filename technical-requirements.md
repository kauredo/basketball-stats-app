# Technical Requirements & Rails Architecture

## Development Environment Setup

### Prerequisites

- **Ruby**: 3.2+ with rbenv or rvm
- **Rails**: 7.1+
- **Node.js**: 18+ and npm for frontend
- **PostgreSQL**: 15+ database
- **Redis**: 7+ for Action Cable and caching
- **Git**: Version control
- **Docker**: Optional containerized development

### Rails Dependencies (Gemfile)

```ruby
# Core Rails
gem 'rails', '~> 7.1.0'
gem 'pg', '~> 1.1'
gem 'puma', '~> 6.0'

# API & JSON
gem 'jsonapi-serializer'
gem 'rack-cors'
gem 'jbuilder'

# Authentication & Authorization
gem 'jwt'
gem 'bcrypt'
gem 'cancancan'

# Real-time & Background Jobs
gem 'redis', '~> 5.0'
gem 'sidekiq'
gem 'sidekiq-web'

# Performance & Monitoring
gem 'bootsnap', require: false
gem 'image_processing', '~> 1.2'
gem 'rack-attack'
gem 'bullet'

# Development & Testing
group :development, :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'pry-byebug'
  gem 'rubocop-rails'
end

group :development do
  gem 'listen'
  gem 'spring'
  gem 'annotate'
end
```

### Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-native": "^0.73.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "socket.io-client": "^4.7.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.47.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "tailwindcss": "^3.3.0",
    "nativewind": "^2.0.11"
  }
}
```

## Rails Application Architecture

### 1. Application Configuration

**config/application.rb**

```ruby
module BasketballStatsApp
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true

    # CORS configuration
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          expose: ['Authorization']
      end
    end

    # Action Cable configuration
    config.action_cable.mount_path = '/cable'
    config.action_cable.url = 'wss://localhost:3000/cable'
  end
end
```

**config/routes.rb**

```ruby
Rails.application.routes.draw do
  mount ActionCable.server => '/cable'
  mount Sidekiq::Web => '/sidekiq'

  namespace :api do
    namespace :v1 do
      resources :teams do
        resources :players, except: [:show]
        resources :games, only: [:index, :create]
      end

      resources :players, only: [:show, :update, :destroy]

      resources :games do
        member do
          post :start
          post :pause
          post :resume
          post :end
        end

        resources :stats, except: [:show]
        get :box_score
        get :live_stats
      end

      resources :stats, only: [:update, :destroy]

      # Authentication
      post '/auth/login', to: 'auth#login'
      post '/auth/logout', to: 'auth#logout'
      get '/auth/verify', to: 'auth#verify'
    end
  end
end
```

### 2. Database Schema & Models

**Database Migration Example**

```ruby
# db/migrate/001_create_teams.rb
class CreateTeams < ActiveRecord::Migration[7.1]
  def change
    create_table :teams do |t|
      t.string :name, null: false
      t.string :city
      t.string :logo_url
      t.text :description
      t.timestamps
    end

    add_index :teams, :name
  end
end

# db/migrate/002_create_players.rb
class CreatePlayers < ActiveRecord::Migration[7.1]
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

# db/migrate/003_create_games.rb
class CreateGames < ActiveRecord::Migration[7.1]
  def change
    create_table :games do |t|
      t.references :home_team, null: false, foreign_key: { to_table: :teams }
      t.references :away_team, null: false, foreign_key: { to_table: :teams }
      t.datetime :scheduled_at
      t.datetime :started_at
      t.datetime :ended_at
      t.integer :status, default: 0
      t.integer :current_quarter, default: 1
      t.integer :time_remaining_seconds, default: 720 # 12 minutes
      t.integer :home_score, default: 0
      t.integer :away_score, default: 0
      t.json :game_settings
      t.timestamps
    end

    add_index :games, [:home_team_id, :away_team_id]
    add_index :games, :scheduled_at
    add_index :games, :status
  end
end

# db/migrate/004_create_player_stats.rb
class CreatePlayerStats < ActiveRecord::Migration[7.1]
  def change
    create_table :player_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true

      # Scoring
      t.integer :points, default: 0
      t.integer :field_goals_made, default: 0
      t.integer :field_goals_attempted, default: 0
      t.integer :three_pointers_made, default: 0
      t.integer :three_pointers_attempted, default: 0
      t.integer :free_throws_made, default: 0
      t.integer :free_throws_attempted, default: 0

      # Other stats
      t.integer :rebounds, default: 0
      t.integer :assists, default: 0
      t.integer :steals, default: 0
      t.integer :blocks, default: 0
      t.integer :turnovers, default: 0
      t.integer :fouls, default: 0
      t.integer :minutes_played, default: 0

      # Advanced stats
      t.integer :plus_minus, default: 0

      t.timestamps
    end

    add_index :player_stats, [:game_id, :player_id], unique: true
    add_index :player_stats, :points
  end
end
```

### 3. Rails Models with Business Logic

**app/models/team.rb**

```ruby
class Team < ApplicationRecord
  has_many :players, dependent: :destroy
  has_many :home_games, class_name: 'Game', foreign_key: 'home_team_id'
  has_many :away_games, class_name: 'Game', foreign_key: 'away_team_id'

  validates :name, presence: true, uniqueness: true

  def games
    Game.where('home_team_id = ? OR away_team_id = ?', id, id)
  end

  def active_players
    players.where(active: true)
  end
end
```

**app/models/player.rb**

```ruby
class Player < ApplicationRecord
  belongs_to :team
  has_many :player_stats, dependent: :destroy
  has_many :games, through: :player_stats

  validates :name, presence: true
  validates :number, presence: true, uniqueness: { scope: :team_id }
  validates :position, inclusion: { in: %w[PG SG SF PF C] }

  enum position: { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 }

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

  private

  def calculate_percentage(made, attempted)
    return 0.0 if attempted.zero?
    ((made.to_f / attempted) * 100).round(1)
  end
end
```

**app/models/game.rb**

```ruby
class Game < ApplicationRecord
  belongs_to :home_team, class_name: 'Team'
  belongs_to :away_team, class_name: 'Team'
  has_many :player_stats, dependent: :destroy
  has_many :plays, dependent: :destroy
  has_many :players, through: :player_stats

  enum status: { scheduled: 0, active: 1, paused: 2, completed: 3 }

  validates :current_quarter, inclusion: { in: 1..4 }
  validates :time_remaining_seconds, numericality: { greater_than_or_equal_to: 0 }

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
    GameSummaryJob.perform_later(id)
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

  private

  def initialize_player_stats
    (home_team.active_players + away_team.active_players).each do |player|
      player_stats.create!(player: player)
    end
  end

  def broadcast_game_update
    ActionCable.server.broadcast("game_#{id}", {
      type: 'game_update',
      game: GameSerializer.new(self).serializable_hash
    })
  end
end
```

**app/models/player_stat.rb**

```ruby
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

  def update_stat(stat_type, value, made = true)
    case stat_type
    when 'shot2'
      increment!(:field_goals_attempted)
      if made
        increment!(:field_goals_made)
        increment!(:points, 2)
        game.increment!(:home_score, 2) if player.team == game.home_team
        game.increment!(:away_score, 2) if player.team == game.away_team
      end
    when 'shot3'
      increment!(:three_pointers_attempted)
      increment!(:field_goals_attempted)
      if made
        increment!(:three_pointers_made)
        increment!(:field_goals_made)
        increment!(:points, 3)
        game.increment!(:home_score, 3) if player.team == game.home_team
        game.increment!(:away_score, 3) if player.team == game.away_team
      end
    when 'freethrow'
      increment!(:free_throws_attempted)
      if made
        increment!(:free_throws_made)
        increment!(:points, 1)
        game.increment!(:home_score, 1) if player.team == game.home_team
        game.increment!(:away_score, 1) if player.team == game.away_team
      end
    else
      increment!(stat_type.to_sym)
    end
  end

  private

  def field_goals_made_not_greater_than_attempted
    return unless field_goals_made > field_goals_attempted
    errors.add(:field_goals_made, 'cannot be greater than attempts')
  end

  def three_pointers_made_not_greater_than_attempted
    return unless three_pointers_made > three_pointers_attempted
    errors.add(:three_pointers_made, 'cannot be greater than attempts')
  end

  def free_throws_made_not_greater_than_attempted
    return unless free_throws_made > free_throws_attempted
    errors.add(:free_throws_made, 'cannot be greater than attempts')
  end

  def broadcast_stat_update
    ActionCable.server.broadcast("game_#{game_id}_stats", {
      type: 'stat_update',
      player_id: player_id,
      stats: StatsSerializer.new(self).serializable_hash
    })
  end
end
```

### 4. Controllers & API Structure

**app/controllers/application_controller.rb**

```ruby
class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :authenticate_request
  before_action :set_current_user

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
  rescue_from CanCan::AccessDenied, with: :forbidden

  private

  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header

    begin
      @decoded = JsonWebToken.decode(header)
      @current_user = User.find(@decoded[:user_id])
    rescue ActiveRecord::RecordNotFound => e
      render json: { errors: e.message }, status: :unauthorized
    rescue JWT::DecodeError => e
      render json: { errors: e.message }, status: :unauthorized
    end
  end

  def set_current_user
    Current.user = @current_user
  end

  def not_found
    render json: { error: 'Record not found' }, status: :not_found
  end

  def unprocessable_entity(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end

  def forbidden
    render json: { error: 'Access denied' }, status: :forbidden
  end
end
```

**app/controllers/api/v1/games_controller.rb**

```ruby
class Api::V1::GamesController < ApplicationController
  before_action :set_game, only: [:show, :update, :destroy, :start, :pause, :resume, :end, :box_score, :live_stats]

  def index
    @games = Game.includes(:home_team, :away_team).order(scheduled_at: :desc)
    render json: GameSerializer.new(@games).serializable_hash
  end

  def show
    render json: GameSerializer.new(@game, include: [:home_team, :away_team, :player_stats]).serializable_hash
  end

  def create
    @game = Game.new(game_params)

    if @game.save
      render json: GameSerializer.new(@game).serializable_hash, status: :created
    else
      render json: { errors: @game.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @game.update(game_params)
      broadcast_game_update
      render json: GameSerializer.new(@game).serializable_hash
    else
      render json: { errors: @game.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def start
    @game.start_game!
    render json: GameSerializer.new(@game).serializable_hash
  end

  def pause
    @game.pause_game!
    render json: GameSerializer.new(@game).serializable_hash
  end

  def resume
    @game.resume_game!
    render json: GameSerializer.new(@game).serializable_hash
  end

  def end
    @game.end_game!
    render json: GameSerializer.new(@game).serializable_hash
  end

  def box_score
    render json: {
      game: GameSerializer.new(@game).serializable_hash,
      box_score: @game.box_score
    }
  end

  def live_stats
    stats = @game.player_stats.includes(:player)
    render json: StatsSerializer.new(stats).serializable_hash
  end

  private

  def set_game
    @game = Game.find(params[:id])
  end

  def game_params
    params.require(:game).permit(
      :home_team_id, :away_team_id, :scheduled_at,
      :current_quarter, :time_remaining_seconds,
      :home_score, :away_score, game_settings: {}
    )
  end

  def broadcast_game_update
    ActionCable.server.broadcast("game_#{@game.id}", {
      type: 'game_update',
      game: GameSerializer.new(@game).serializable_hash
    })
  end
end
```

**app/controllers/api/v1/stats_controller.rb**

```ruby
class Api::V1::StatsController < ApplicationController
  before_action :set_game
  before_action :set_stat, only: [:update, :destroy]

  def index
    @stats = @game.player_stats.includes(:player)
    render json: StatsSerializer.new(@stats).serializable_hash
  end

  def create
    @stat = @game.player_stats.find_by(player_id: stat_params[:player_id])

    if @stat
      @stat.update_stat(stat_params[:stat_type], stat_params[:value], stat_params[:made])
      render json: StatsSerializer.new(@stat).serializable_hash
    else
      render json: { error: 'Player not found in game' }, status: :not_found
    end
  end

  def update
    if @stat.update(stat_params.except(:stat_type, :made))
      render json: StatsSerializer.new(@stat).serializable_hash
    else
      render json: { errors: @stat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @stat.destroy
    head :no_content
  end

  private

  def set_game
    @game = Game.find(params[:game_id])
  end

  def set_stat
    @stat = @game.player_stats.find(params[:id])
  end

  def stat_params
    params.require(:stat).permit(:player_id, :stat_type, :value, :made, :points, :field_goals_made,
                                 :field_goals_attempted, :three_pointers_made, :three_pointers_attempted,
                                 :free_throws_made, :free_throws_attempted, :rebounds, :assists, :steals,
                                 :blocks, :turnovers, :fouls, :minutes_played)
  end
end
```

### 5. Action Cable Channels for Real-time Updates

**app/channels/application_cable/channel.rb**

```ruby
module ApplicationCable
  class Channel < ActionCable::Channel::Base
    private

    def current_user
      @current_user ||= find_verified_user
    end

    def find_verified_user
      if verified_user = User.find_by(id: connection.current_user&.id)
        verified_user
      else
        reject_unauthorized_connection
      end
    end
  end
end
```

**app/channels/application_cable/connection.rb**

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      if verified_user = User.find_by(id: decoded_token[:user_id])
        verified_user
      else
        reject_unauthorized_connection
      end
    end

    def decoded_token
      if request.params[:token]
        JsonWebToken.decode(request.params[:token])
      else
        {}
      end
    end
  end
end
```

**app/channels/game_channel.rb**

```ruby
class GameChannel < ApplicationCable::Channel
  def subscribed
    game = Game.find(params[:game_id])
    stream_from "game_#{game.id}"

    # Send current game state on connection
    transmit({
      type: 'game_state',
      game: GameSerializer.new(game).serializable_hash
    })
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def update_timer(data)
    game = Game.find(params[:game_id])

    if game.update(
      time_remaining_seconds: data['time_remaining_seconds'],
      current_quarter: data['current_quarter']
    )
      ActionCable.server.broadcast("game_#{game.id}", {
        type: 'timer_update',
        time_remaining_seconds: game.time_remaining_seconds,
        current_quarter: game.current_quarter,
        time_display: game.time_display
      })
    end
  end
end
```

**app/channels/stats_channel.rb**

```ruby
class StatsChannel < ApplicationCable::Channel
  def subscribed
    game = Game.find(params[:game_id])
    stream_from "game_#{game.id}_stats"

    # Send current stats on connection
    stats = game.player_stats.includes(:player)
    transmit({
      type: 'stats_state',
      stats: StatsSerializer.new(stats).serializable_hash
    })
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
```

### 6. Serializers for Consistent API Responses

**app/serializers/game_serializer.rb**

```ruby
class GameSerializer
  include JSONAPI::Serializer

  attributes :id, :scheduled_at, :started_at, :ended_at, :status,
             :current_quarter, :time_remaining_seconds, :home_score, :away_score

  belongs_to :home_team, serializer: TeamSerializer
  belongs_to :away_team, serializer: TeamSerializer
  has_many :player_stats, serializer: StatsSerializer

  attribute :time_display do |game|
    game.time_display
  end

  attribute :is_active do |game|
    game.active?
  end

  attribute :duration do |game|
    if game.started_at && game.ended_at
      ((game.ended_at - game.started_at) / 1.minute).round
    elsif game.started_at
      ((Time.current - game.started_at) / 1.minute).round
    else
      0
    end
  end
end
```

**app/serializers/player_serializer.rb**

```ruby
class PlayerSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :number, :position, :height_cm, :weight_kg, :active

  belongs_to :team, serializer: TeamSerializer

  attribute :age do |player|
    if player.birth_date
      ((Time.current - player.birth_date.to_time) / 1.year.seconds).floor
    end
  end

  attribute :season_averages do |player|
    player.season_averages
  end
end
```

**app/serializers/stats_serializer.rb**

```ruby
class StatsSerializer
  include JSONAPI::Serializer

  attributes :id, :points, :field_goals_made, :field_goals_attempted,
             :three_pointers_made, :three_pointers_attempted,
             :free_throws_made, :free_throws_attempted,
             :rebounds, :assists, :steals, :blocks, :turnovers, :fouls,
             :minutes_played, :plus_minus

  belongs_to :player, serializer: PlayerSerializer
  belongs_to :game, serializer: GameSerializer

  attribute :field_goal_percentage do |stat|
    stat.field_goal_percentage
  end

  attribute :three_point_percentage do |stat|
    stat.three_point_percentage
  end

  attribute :free_throw_percentage do |stat|
    stat.free_throw_percentage
  end

  attribute :effective_field_goal_percentage do |stat|
    stat.effective_field_goal_percentage
  end

  attribute :true_shooting_percentage do |stat|
    stat.true_shooting_percentage
  end
end
```

**app/serializers/team_serializer.rb**

```ruby
class TeamSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :city, :logo_url, :description

  has_many :players, serializer: PlayerSerializer

  attribute :active_players_count do |team|
    team.active_players.count
  end
end
```

### 7. Background Jobs for Performance

**app/jobs/stats_calculation_job.rb**

```ruby
class StatsCalculationJob < ApplicationJob
  queue_as :default

  def perform(game_id)
    game = Game.find(game_id)

    # Calculate advanced team statistics
    game.player_stats.each do |stat|
      # Calculate plus/minus
      # Calculate efficiency ratings
      # Update derived statistics
    end

    # Cache expensive calculations
    Rails.cache.write("game_#{game_id}_advanced_stats", calculate_advanced_stats(game), expires_in: 5.minutes)
  end

  private

  def calculate_advanced_stats(game)
    {
      team_stats: calculate_team_stats(game),
      efficiency_ratings: calculate_efficiency_ratings(game),
      pace: calculate_pace(game)
    }
  end

  def calculate_team_stats(game)
    # Implementation for team-level statistics
  end

  def calculate_efficiency_ratings(game)
    # Implementation for player efficiency ratings
  end

  def calculate_pace(game)
    # Implementation for game pace calculation
  end
end
```

**app/jobs/game_summary_job.rb**

```ruby
class GameSummaryJob < ApplicationJob
  queue_as :default

  def perform(game_id)
    game = Game.find(game_id)

    # Generate final box score
    box_score = generate_box_score(game)

    # Save game summary
    game.update(
      final_box_score: box_score,
      game_summary: generate_summary(game)
    )

    # Send notifications
    # NotificationService.send_game_complete(game)

    # Archive real-time data
    archive_real_time_data(game)
  end

  private

  def generate_box_score(game)
    # Generate comprehensive box score
  end

  def generate_summary(game)
    # Generate text summary of game
  end

  def archive_real_time_data(game)
    # Archive real-time updates to long-term storage
  end
end
```

### 8. Services for Business Logic

**app/services/stats_calculator.rb**

```ruby
class StatsCalculator
  def self.update_player_stat(player_stat, action_type, made = true)
    new(player_stat).update_stat(action_type, made)
  end

  def initialize(player_stat)
    @player_stat = player_stat
    @game = player_stat.game
    @player = player_stat.player
  end

  def update_stat(action_type, made = true)
    case action_type.to_s
    when 'shot2'
      process_two_point_shot(made)
    when 'shot3'
      process_three_point_shot(made)
    when 'freethrow'
      process_free_throw(made)
    when 'rebound'
      process_rebound
    when 'assist'
      process_assist
    when 'steal'
      process_steal
    when 'block'
      process_block
    when 'turnover'
      process_turnover
    when 'foul'
      process_foul
    end

    broadcast_update
  end

  private

  def process_two_point_shot(made)
    @player_stat.increment!(:field_goals_attempted)

    if made
      @player_stat.increment!(:field_goals_made)
      @player_stat.increment!(:points, 2)
      update_team_score(2)
    end
  end

  def process_three_point_shot(made)
    @player_stat.increment!(:three_pointers_attempted)
    @player_stat.increment!(:field_goals_attempted)

    if made
      @player_stat.increment!(:three_pointers_made)
      @player_stat.increment!(:field_goals_made)
      @player_stat.increment!(:points, 3)
      update_team_score(3)
    end
  end

  def process_free_throw(made)
    @player_stat.increment!(:free_throws_attempted)

    if made
      @player_stat.increment!(:free_throws_made)
      @player_stat.increment!(:points, 1)
      update_team_score(1)
    end
  end

  def process_rebound
    @player_stat.increment!(:rebounds)
  end

  def process_assist
    @player_stat.increment!(:assists)
  end

  def process_steal
    @player_stat.increment!(:steals)
  end

  def process_block
    @player_stat.increment!(:blocks)
  end

  def process_turnover
    @player_stat.increment!(:turnovers)
  end

  def process_foul
    @player_stat.increment!(:fouls)
  end

  def update_team_score(points)
    if @player.team == @game.home_team
      @game.increment!(:home_score, points)
    else
      @game.increment!(:away_score, points)
    end
  end

  def broadcast_update
    ActionCable.server.broadcast("game_#{@game.id}_stats", {
      type: 'stat_update',
      player_id: @player.id,
      stats: StatsSerializer.new(@player_stat).serializable_hash[:data][:attributes],
      game_score: {
        home_score: @game.home_score,
        away_score: @game.away_score
      }
    })
  end
end
```

**app/services/game_manager.rb**

```ruby
class GameManager
  def self.start_game(game_id)
    new(game_id).start_game
  end

  def self.update_timer(game_id, time_remaining, quarter)
    new(game_id).update_timer(time_remaining, quarter)
  end

  def initialize(game_id)
    @game = Game.find(game_id)
  end

  def start_game
    @game.update!(
      status: :active,
      started_at: Time.current
    )

    broadcast_game_state
    schedule_timer_updates
  end

  def update_timer(time_remaining, quarter)
    @game.update!(
      time_remaining_seconds: time_remaining,
      current_quarter: quarter
    )

    broadcast_timer_update

    # Check for end of quarter/game
    check_period_end if time_remaining <= 0
  end

  private

  def broadcast_game_state
    ActionCable.server.broadcast("game_#{@game.id}", {
      type: 'game_state_change',
      status: @game.status,
      started_at: @game.started_at
    })
  end

  def broadcast_timer_update
    ActionCable.server.broadcast("game_#{@game.id}", {
      type: 'timer_update',
      time_remaining_seconds: @game.time_remaining_seconds,
      current_quarter: @game.current_quarter,
      time_display: @game.time_display
    })
  end

  def schedule_timer_updates
    # Schedule periodic timer updates if needed
    TimerUpdateJob.set(wait: 1.second).perform_later(@game.id) if @game.active?
  end

  def check_period_end
    if @game.current_quarter >= 4
      # Game is over
      @game.end_game!
    else
      # End of quarter
      @game.update!(
        current_quarter: @game.current_quarter + 1,
        time_remaining_seconds: 720, # Reset to 12 minutes
        status: :paused
      )

      broadcast_quarter_end
    end
  end

  def broadcast_quarter_end
    ActionCable.server.broadcast("game_#{@game.id}", {
      type: 'quarter_end',
      current_quarter: @game.current_quarter,
      time_remaining_seconds: @game.time_remaining_seconds
    })
  end
end
```

### 9. Testing Configuration

**spec/rails_helper.rb**

```ruby
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.fixture_path = "#{::Rails.root}/spec/fixtures"
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  # FactoryBot configuration
  config.include FactoryBot::Syntax::Methods

  # Database cleaning
  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end
end
```

**spec/factories/games.rb**

```ruby
FactoryBot.define do
  factory :game do
    association :home_team, factory: :team
    association :away_team, factory: :team
    scheduled_at { 1.hour.from_now }
    status { :scheduled }
    current_quarter { 1 }
    time_remaining_seconds { 720 }
    home_score { 0 }
    away_score { 0 }

    trait :active do
      status { :active }
      started_at { Time.current }
    end

    trait :completed do
      status { :completed }
      started_at { 2.hours.ago }
      ended_at { Time.current }
      home_score { 85 }
      away_score { 78 }
    end
  end
end
```

### 10. Performance Optimizations

**config/environments/production.rb additions**

```ruby
# Caching configuration
config.cache_store = :redis_cache_store, {
  url: ENV['REDIS_URL'],
  connect_timeout: 30,
  read_timeout: 0.2,
  write_timeout: 0.2,
  reconnect_attempts: 1,
  error_handler: -> (method:, returning:, exception:) {
    Rails.logger.error "Cache error: #{exception.message}"
  }
}

# Action Cable configuration
config.action_cable.mount_path = '/cable'
config.action_cable.url = ENV['ACTION_CABLE_URL']
config.action_cable.allowed_request_origins = [
  'http://localhost:3000',
  'https://yourapp.com'
]

# Background job configuration
config.active_job.queue_adapter = :sidekiq
```

**app/models/concerns/cacheable.rb**

```ruby
module Cacheable
  extend ActiveSupport::Concern

  def cache_key_with_version
    "#{model_name.cache_key}/#{id}/#{updated_at.to_i}"
  end

  class_methods do
    def cached_find(id)
      Rails.cache.fetch("#{name.downcase}/#{id}", expires_in: 1.hour) do
        find(id)
      end
    end
  end
end
```

This comprehensive Rails architecture provides:

1. **Robust API structure** with RESTful endpoints
2. **Real-time capabilities** via Action Cable
3. **Performance optimizations** with caching and background jobs
4. **Comprehensive testing** setup with RSpec and FactoryBot
5. **Business logic encapsulation** in services and models
6. **Consistent API responses** with serializers
7. **Error handling** and validation
8. **Scalable database design** with proper indexing
