class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_user

  # POST /api/v1/auth/signup
  def signup
    user = User.new(signup_params)

    if user.save
      tokens = generate_tokens(user)
      render_success({
        user: user_json(user),
        tokens: tokens,
        message: "Account created successfully. Please check your email to confirm your account."
      }, :created)
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/auth/login
  def login
    user = User.find_by(email: login_params[:email]&.downcase)

    if user&.authenticate(login_params[:password])
      if user.confirmed?
        tokens = generate_tokens(user)
        render_success({
          user: user_json(user),
          tokens: tokens,
          message: "Login successful"
        })
      else
        render_error("Please confirm your email address before logging in", :unprocessable_entity)
      end
    else
      render_error("Invalid email or password", :unauthorized)
    end
  end

  # POST /api/v1/auth/refresh
  def refresh
    token = params[:refresh_token]
    return render_error("Refresh token is required", :bad_request) unless token

    begin
      decoded_token = JwtService.decode(token)
      return render_error("Invalid token type", :bad_request) unless decoded_token[:type] == "refresh"

      user = User.find(decoded_token[:user_id])
      tokens = generate_tokens(user)

      render_success({
        user: user_json(user),
        tokens: tokens
      })
    rescue StandardError => e
      render_error("Invalid refresh token: #{e.message}", :unauthorized)
    end
  end

  # POST /api/v1/auth/logout
  def logout
    # In a production app, you might want to blacklist tokens
    render_success({ message: "Logged out successfully" })
  end

  # POST /api/v1/auth/confirm_email
  def confirm_email
    token = params[:token]
    return render_error("Confirmation token is required", :bad_request) unless token

    begin
      decoded_token = JwtService.decode(token)
      return render_error("Invalid token type", :bad_request) unless decoded_token[:type] == "confirmation"

      user = User.find(decoded_token[:user_id])

      if user.confirmed?
        render_error("Account already confirmed", :bad_request)
      else
        user.confirm!
        tokens = generate_tokens(user)

        render_success({
          user: user_json(user),
          tokens: tokens,
          message: "Email confirmed successfully"
        })
      end
    rescue StandardError => e
      render_error("Invalid confirmation token: #{e.message}", :bad_request)
    end
  end

  # POST /api/v1/auth/resend_confirmation
  def resend_confirmation
    email = params[:email]&.downcase
    return render_error("Email is required", :bad_request) unless email

    user = User.find_by(email: email)
    return render_error("User not found", :not_found) unless user

    if user.confirmed?
      render_error("Account already confirmed", :bad_request)
    else
      user.generate_confirmation_token
      user.save!

      # In a real app, you would send an email here
      # UserMailer.confirmation_email(user).deliver_now

      render_success({ message: "Confirmation email sent" })
    end
  end

  # POST /api/v1/auth/forgot_password
  def forgot_password
    email = params[:email]&.downcase
    return render_error("Email is required", :bad_request) unless email

    user = User.find_by(email: email)

    if user
      user.generate_reset_password_token!

      # In a real app, you would send an email here
      # UserMailer.reset_password_email(user).deliver_now

      render_success({ message: "Password reset email sent" })
    else
      # Don't reveal if email exists or not for security
      render_success({ message: "Password reset email sent" })
    end
  end

  # POST /api/v1/auth/reset_password
  def reset_password
    token = params[:token]
    password = params[:password]
    password_confirmation = params[:password_confirmation]

    return render_error("Token, password, and password confirmation are required", :bad_request) unless
      token && password && password_confirmation

    return render_error("Password and confirmation do not match", :bad_request) unless
      password == password_confirmation

    begin
      decoded_token = JwtService.decode(token)
      return render_error("Invalid token type", :bad_request) unless decoded_token[:type] == "reset_password"

      user = User.find(decoded_token[:user_id])

      if user.update(password: password, password_confirmation: password_confirmation)
        user.clear_reset_password_token!
        tokens = generate_tokens(user)

        render_success({
          user: user_json(user),
          tokens: tokens,
          message: "Password reset successfully"
        })
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    rescue StandardError => e
      render_error("Invalid reset token: #{e.message}", :bad_request)
    end
  end

  # GET /api/v1/auth/me
  def me
    authenticate_user
    return unless current_user

    render_success({ user: user_json(current_user) })
  end

  private

  def signup_params
    params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
  end

  def login_params
    params.require(:user).permit(:email, :password)
  end

  def generate_tokens(user)
    {
      access_token: JwtService.generate_access_token(user),
      refresh_token: JwtService.generate_refresh_token(user),
      expires_at: 24.hours.from_now.iso8601
    }
  end

  def user_json(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      role: user.role,
      confirmed: user.confirmed?,
      created_at: user.created_at.iso8601,
      updated_at: user.updated_at.iso8601
    }
  end
end
