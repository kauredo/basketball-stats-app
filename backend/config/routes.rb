Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Action Cable WebSocket mount
  mount ActionCable.server => '/cable'

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      scope :auth do
        post 'signup', to: 'auth#signup'
        post 'login', to: 'auth#login'
        post 'refresh', to: 'auth#refresh'
        post 'logout', to: 'auth#logout'
        post 'confirm_email', to: 'auth#confirm_email'
        post 'resend_confirmation', to: 'auth#resend_confirmation'
        post 'forgot_password', to: 'auth#forgot_password'
        post 'reset_password', to: 'auth#reset_password'
        get 'me', to: 'auth#me'
      end

      # Leagues with nested resources
      resources :leagues do
        member do
          post :join
          delete :leave
          get :members
          get :standings
          get :invite_code
        end

        # League-scoped teams
        resources :teams, except: [:index] do
          resources :players, except: [:show, :index]
          resources :games, only: [:create]
        end
        
        # League statistics
        scope :statistics do
          get 'players', to: 'statistics#players'
          get 'players/:id', to: 'statistics#player'
          get 'teams', to: 'statistics#teams'
          get 'teams/:id', to: 'statistics#team'
          get 'leaders', to: 'statistics#leaders'
          get 'dashboard', to: 'statistics#dashboard'
        end
      end

      # Global league operations
      post 'leagues/join_by_code', to: 'leagues#join_by_code'

      # Teams with nested players and games (legacy - will be moved to league scope)
      resources :teams do
        resources :players, except: [:show]
        resources :games, only: [:index, :create]
      end

      # Players (standalone operations)
      resources :players, only: [:index, :show, :update, :destroy] do
        member do
          get :stats
        end
      end

      # Games with nested stats and actions
      resources :games do
        member do
          post :start
          post :pause
          post :resume
          post :end
          get :box_score
          get :live_stats
        end

        resources :stats, except: [:show]
      end

      # Player stats (standalone operations)
      resources :stats, only: [:update, :destroy]

      # User management
      resources :users, only: [:show, :update] do
        member do
          get :leagues
          get :teams
        end
      end
    end
  end
end