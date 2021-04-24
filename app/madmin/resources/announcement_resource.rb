class AnnouncementResource < Madmin::Resource
  # Attributes
  attribute :id, form: false
  attribute :published_at
  attribute :announcement_type
  attribute :name
  attribute :description
  attribute :created_at, form: false
  attribute :updated_at, form: false

  # Associations

  # Uncomment this to customize the display name of records in the admin area.
  # def self.display_name(record)
  #   record.name
  # end
end
