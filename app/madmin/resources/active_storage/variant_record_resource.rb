class ActiveStorage::VariantRecordResource < Madmin::Resource
  # Attributes
  attribute :id, form: false
  attribute :variation, index: false, show: false
  attribute :variation_confirmation, index: false, show: false
  attribute :image, index: false

  # Associations
  attribute :blob

  # Uncomment this to customize the display name of records in the admin area.
  # def self.display_name(record)
  #   record.name
  # end
end
