USE ekspedisi_jne_clone;

CREATE INDEX idx_cities_province_id ON cities(province_id);
CREATE INDEX idx_districts_city_id ON districts(city_id);
CREATE INDEX idx_branches_city_id ON branches(city_id);
CREATE INDEX idx_customers_city_id ON customers(city_id);
CREATE INDEX idx_employees_branch_id ON employees(branch_id);
CREATE INDEX idx_shipments_sender_customer_id ON shipments(sender_customer_id);
CREATE INDEX idx_shipments_receiver_city_id ON shipments(receiver_city_id);
CREATE INDEX idx_shipments_origin_branch_id ON shipments(origin_branch_id);
CREATE INDEX idx_shipments_service_type_id ON shipments(service_type_id);
CREATE INDEX idx_shipments_status ON shipments(shipment_status);
CREATE INDEX idx_shipments_booked_at ON shipments(booked_at);
CREATE INDEX idx_tracking_shipment_event_time ON shipment_tracking(shipment_id, event_time);
CREATE INDEX idx_assignments_employee_status ON shipment_assignments(employee_id, assignment_status);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_pickup_status_time ON pickup_requests(request_status, requested_pickup_time);

CREATE OR REPLACE VIEW vw_shipment_summary AS
SELECT
  s.shipment_id,
  s.tracking_no,
  s.order_no,
  c.customer_code AS sender_code,
  c.full_name AS sender_name,
  s.receiver_name,
  oc.city_name AS origin_city,
  dc.city_name AS destination_city,
  st.service_code,
  st.service_name,
  s.chargeable_weight_kg,
  s.total_amount,
  s.payment_type,
  s.shipment_status,
  s.booked_at,
  s.delivered_at
FROM shipments s
JOIN customers c ON c.customer_id = s.sender_customer_id
JOIN branches ob ON ob.branch_id = s.origin_branch_id
JOIN cities oc ON oc.city_id = ob.city_id
JOIN cities dc ON dc.city_id = s.receiver_city_id
JOIN service_types st ON st.service_type_id = s.service_type_id;

CREATE OR REPLACE VIEW vw_daily_revenue AS
SELECT
  DATE(s.booked_at) AS booking_date,
  COUNT(*) AS total_shipments,
  SUM(s.chargeable_weight_kg) AS total_weight_kg,
  SUM(s.total_amount) AS gross_revenue,
  SUM(CASE WHEN p.payment_status IN ('PAID', 'PARTIAL') THEN p.amount_paid ELSE 0 END) AS paid_revenue
FROM shipments s
LEFT JOIN payments p ON p.shipment_id = s.shipment_id
GROUP BY DATE(s.booked_at);

CREATE OR REPLACE VIEW vw_latest_tracking AS
SELECT
  s.shipment_id,
  s.tracking_no,
  t.event_time AS latest_event_time,
  t.status_code AS latest_status_code,
  t.status_description AS latest_status_description,
  b.branch_name AS latest_branch
FROM shipments s
LEFT JOIN shipment_tracking t
  ON t.tracking_id = (
    SELECT st2.tracking_id
    FROM shipment_tracking st2
    WHERE st2.shipment_id = s.shipment_id
    ORDER BY st2.event_time DESC, st2.tracking_id DESC
    LIMIT 1
  )
LEFT JOIN branches b ON b.branch_id = t.branch_id;
