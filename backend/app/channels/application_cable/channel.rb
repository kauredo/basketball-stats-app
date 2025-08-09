module ApplicationCable
  class Channel < ActionCable::Channel::Base
    private

    def current_user
      connection.current_user
    end
  end
end