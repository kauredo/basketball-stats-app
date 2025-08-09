module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # For development, we'll allow anonymous connections
      # In production, implement proper authentication here
      if Rails.env.development?
        OpenStruct.new(id: "anonymous_#{SecureRandom.hex(8)}")
      else
        reject_unauthorized_connection
      end
    end
  end
end
