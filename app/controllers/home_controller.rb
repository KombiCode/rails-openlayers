class HomeController < ApplicationController
  def index
  end

  def terms
  end

  def privacy
  end

  def init
    render json: {
      ignApiKey: "#{Rails.application.credentials.ign[:api_choisirgeoportail]}",
      ignLHApiKey: "#{Rails.application.credentials.ign[:api_lh]}",
    }
  end
end
