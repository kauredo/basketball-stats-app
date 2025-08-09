class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base || 'default_secret'
  ALGORITHM = 'HS256'.freeze
  
  def self.encode(payload, expiration = 24.hours.from_now)
    payload[:exp] = expiration.to_i
    JWT.encode(payload, SECRET_KEY, ALGORITHM)
  end
  
  def self.decode(token)
    body = JWT.decode(token, SECRET_KEY, true, algorithm: ALGORITHM)[0]
    HashWithIndifferentAccess.new(body)
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    raise StandardError, "Invalid token: #{e.message}"
  end
  
  def self.generate_access_token(user)
    encode({
      user_id: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    }, 24.hours.from_now)
  end
  
  def self.generate_refresh_token(user)
    encode({
      user_id: user.id,
      type: 'refresh'
    }, 7.days.from_now)
  end
  
  def self.generate_confirmation_token(user)
    encode({
      user_id: user.id,
      email: user.email,
      type: 'confirmation'
    }, 24.hours.from_now)
  end
  
  def self.generate_reset_password_token(user)
    encode({
      user_id: user.id,
      email: user.email,
      type: 'reset_password'
    }, 1.hour.from_now)
  end
end