USE ekspedisi_jne_clone;

CREATE TABLE IF NOT EXISTS shipments (
  shipment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tracking_no VARCHAR(30) NOT NULL UNIQUE,
  order_no VARCHAR(30) NULL UNIQUE,
  sender_customer_id BIGINT UNSIGNED NOT NULL,
  receiver_name VARCHAR(150) NOT NULL,
  receiver_phone VARCHAR(30) NOT NULL,
  receiver_address TEXT NOT NULL,
  receiver_city_id BIGINT UNSIGNED NOT NULL,
  receiver_district_id BIGINT UNSIGNED NULL,
  receiver_postal_code VARCHAR(10) NULL,
  origin_branch_id BIGINT UNSIGNED NOT NULL,
  destination_branch_id BIGINT UNSIGNED NULL,
  service_type_id BIGINT UNSIGNED NOT NULL,
  rate_id BIGINT UNSIGNED NULL,
  item_type ENUM('DOKUMEN', 'PAKET', 'MOTOR', 'ELEKTRONIK', 'FASHION', 'LAINNYA') NOT NULL DEFAULT 'PAKET',
  content_description VARCHAR(255) NOT NULL,
  total_colly INT UNSIGNED NOT NULL DEFAULT 1,
  actual_weight_kg DECIMAL(10,2) NOT NULL,
  volumetric_weight_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  chargeable_weight_kg DECIMAL(10,2) NOT NULL,
  goods_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  packing_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  insurance_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_type ENUM('CASH', 'TRANSFER', 'COD', 'KREDIT') NOT NULL DEFAULT 'CASH',
  shipment_status ENUM(
    'DRAFT',
    'BOOKED',
    'PICKUP',
    'MANIFEST',
    'TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED_DELIVERY',
    'RETURNED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'BOOKED',
  booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_sender
    FOREIGN KEY (sender_customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_shipments_receiver_city
    FOREIGN KEY (receiver_city_id) REFERENCES cities(city_id),
  CONSTRAINT fk_shipments_receiver_district
    FOREIGN KEY (receiver_district_id) REFERENCES districts(district_id),
  CONSTRAINT fk_shipments_origin_branch
    FOREIGN KEY (origin_branch_id) REFERENCES branches(branch_id),
  CONSTRAINT fk_shipments_destination_branch
    FOREIGN KEY (destination_branch_id) REFERENCES branches(branch_id),
  CONSTRAINT fk_shipments_service_type
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id),
  CONSTRAINT fk_shipments_rate
    FOREIGN KEY (rate_id) REFERENCES shipping_rates(rate_id),
  CONSTRAINT fk_shipments_created_by
    FOREIGN KEY (created_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipment_items (
  shipment_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  weight_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  length_cm DECIMAL(10,2) NOT NULL DEFAULT 0,
  width_cm DECIMAL(10,2) NOT NULL DEFAULT 0,
  height_cm DECIMAL(10,2) NOT NULL DEFAULT 0,
  declared_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_items_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipment_tracking (
  tracking_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  event_time DATETIME NOT NULL,
  status_code VARCHAR(30) NOT NULL,
  status_description VARCHAR(255) NOT NULL,
  branch_id BIGINT UNSIGNED NULL,
  employee_id BIGINT UNSIGNED NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  recipient_name VARCHAR(150) NULL,
  proof_photo_url VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tracking_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tracking_branch
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
  CONSTRAINT fk_tracking_employee
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipment_assignments (
  assignment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  vehicle_id BIGINT UNSIGNED NULL,
  assignment_type ENUM('PICKUP', 'LINEHAUL', 'DELIVERY') NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME NULL,
  completed_at DATETIME NULL,
  assignment_status ENUM('ASSIGNED', 'ACCEPTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignments_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assignments_employee
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
  CONSTRAINT fk_assignments_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  payment_no VARCHAR(30) NOT NULL UNIQUE,
  payment_method ENUM('CASH', 'TRANSFER', 'VA', 'EWALLET', 'COD', 'KREDIT') NOT NULL,
  payment_status ENUM('UNPAID', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
  amount_due DECIMAL(14,2) NOT NULL,
  amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_at DATETIME NULL,
  reference_no VARCHAR(100) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pickup_requests (
  pickup_request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(30) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  origin_branch_id BIGINT UNSIGNED NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_city_id BIGINT UNSIGNED NOT NULL,
  pickup_district_id BIGINT UNSIGNED NULL,
  contact_name VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  requested_pickup_time DATETIME NOT NULL,
  item_estimation VARCHAR(255) NULL,
  total_colly_estimation INT UNSIGNED NOT NULL DEFAULT 1,
  total_weight_estimation_kg DECIMAL(10,2) NOT NULL DEFAULT 1,
  request_status ENUM('OPEN', 'ASSIGNED', 'PICKED_UP', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
  assigned_employee_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pickup_customer
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_pickup_origin_branch
    FOREIGN KEY (origin_branch_id) REFERENCES branches(branch_id),
  CONSTRAINT fk_pickup_city
    FOREIGN KEY (pickup_city_id) REFERENCES cities(city_id),
  CONSTRAINT fk_pickup_district
    FOREIGN KEY (pickup_district_id) REFERENCES districts(district_id),
  CONSTRAINT fk_pickup_employee
    FOREIGN KEY (assigned_employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;
