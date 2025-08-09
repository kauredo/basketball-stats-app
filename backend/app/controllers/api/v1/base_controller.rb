class Api::V1::BaseController < ApplicationController
  before_action :set_cors_headers

  private

  def set_cors_headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, Token'
    response.headers['Access-Control-Max-Age'] = '1728000'
  end

  def paginate_collection(collection, per_page: 20)
    page = params[:page]&.to_i || 1
    offset = (page - 1) * per_page
    
    paginated = collection.limit(per_page).offset(offset)
    total = collection.count
    
    {
      data: paginated,
      meta: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }
  end
end