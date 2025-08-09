class ApplicationController < ActionController::API
  include ActionController::Cookies

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
  rescue_from StandardError, with: :handle_standard_error

  before_action :authenticate_user

  attr_reader :current_user

  private

  def authenticate_user
    token = extract_token_from_header

    if token.nil?
      Rails.logger.warn "No authentication token provided"
      render_unauthorized
      return
    end

    begin
      decoded_token = JwtService.decode(token)
      @current_user = User.find(decoded_token[:user_id])
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      Rails.logger.error "JWT error: #{e.message}"
      render_unauthorized("Invalid or expired token")
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error "User not found: #{e.message}"
      render_unauthorized("User not found")
    rescue StandardError => e
      Rails.logger.error "Authentication error: #{e.message}"
      render_unauthorized("Authentication error")
    end
  end

  def authenticate_admin
    authenticate_user
    render_forbidden unless current_user&.admin?
  end

  def require_league_access(league)
    return render_forbidden unless current_user
    render_forbidden unless league.can_user_access?(current_user)
  end

  def require_league_management(league)
    return render_forbidden unless current_user
    render_forbidden unless current_user.can_manage_league?(league)
  end

  def extract_token_from_header
    auth_header = request.headers["Authorization"]
    return nil unless auth_header&.start_with?("Bearer ")

    auth_header.split(" ").last
  end

  def not_found
    render json: { error: "Record not found" }, status: :not_found
  end

  def unprocessable_entity(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end

  def handle_standard_error(exception)
    Rails.logger.error "Unhandled error: #{exception.message}\n#{exception.backtrace.join("\n")}"
    render json: { error: "Internal server error" }, status: :internal_server_error
  end

  def render_error(message, status = :bad_request)
    render json: { error: message }, status: status
  end

  def render_success(data, status = :ok)
    render json: data, status: status
  end

  def render_unauthorized(message = "Unauthorized")
    render json: { error: message }, status: :unauthorized
  end

  def render_forbidden(message = "Forbidden")
    render json: { error: message }, status: :forbidden
  end
end
