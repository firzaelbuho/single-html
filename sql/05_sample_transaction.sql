USE ekspedisi_jne_clone;

INSERT INTO shipments (
  tracking_no,
  order_no,
  sender_customer_id,
  receiver_name,
  receiver_phone,
  receiver_address,
  receiver_city_id,
  receiver_district_id,
  receiver_postal_code,
  origin_branch_id,
  destination_branch_id,
  service_type_id,
  rate_id,
  item_type,
  content_description,
  total_colly,
  actual_weight_kg,
  volumetric_weight_kg,
  chargeable_weight_kg,
  goods_value,
  shipping_cost,
  packing_cost,
  insurance_cost,
  other_cost,
  discount_amount,
  total_amount,
  payment_type,
  shipment_status,
  booked_at,
  created_by
)
SELECT
  'JNC2604070001',
  'ORD2604070001',
  c.customer_id,
  'Hendra Wijaya',
  '081355566677',
  'Jl. Ngesrep Timur V No. 12, Semarang',
  rc.city_id,
  rd.district_id,
  '50135',
  ob.branch_id,
  db.branch_id,
  st.service_type_id,
  sr.rate_id,
  'PAKET',
  'Dokumen dan sample produk',
  1,
  1.20,
  1.00,
  1.20,
  500000.00,
  24000.00,
  2000.00,
  2500.00,
  0.00,
  0.00,
  28500.00,
  'TRANSFER',
  'TRANSIT',
  '2026-04-07 09:00:00',
  e.employee_id
FROM customers c
JOIN cities rc ON rc.city_code = 'SMG'
LEFT JOIN districts rd ON rd.district_code = 'TEMBALANG'
JOIN branches ob ON ob.branch_code = 'CGK01'
JOIN branches db ON db.branch_code = 'SRG01'
JOIN service_types st ON st.service_code = 'REG'
JOIN shipping_rates sr
  ON sr.origin_city_id = ob.city_id
 AND sr.destination_city_id = rc.city_id
 AND sr.service_type_id = st.service_type_id
JOIN employees e ON e.employee_code = 'EMP0001'
WHERE c.customer_code = 'CUST0001'
  AND NOT EXISTS (
    SELECT 1 FROM shipments s WHERE s.tracking_no = 'JNC2604070001'
  );

INSERT INTO shipment_items (
  shipment_id,
  item_name,
  quantity,
  weight_kg,
  length_cm,
  width_cm,
  height_cm,
  declared_value,
  notes
)
SELECT
  s.shipment_id,
  'Sample Produk UMKM',
  1,
  1.20,
  30.00,
  20.00,
  10.00,
  500000.00,
  'Handle with care'
FROM shipments s
WHERE s.tracking_no = 'JNC2604070001'
  AND NOT EXISTS (
    SELECT 1 FROM shipment_items si WHERE si.shipment_id = s.shipment_id
  );

INSERT INTO shipment_tracking (
  shipment_id,
  event_time,
  status_code,
  status_description,
  branch_id,
  employee_id
)
SELECT s.shipment_id, x.event_time, x.status_code, x.status_description, b.branch_id, e.employee_id
FROM shipments s
JOIN (
  SELECT '2026-04-07 09:05:00' AS event_time, 'BOOKED' AS status_code, 'Paket berhasil dibuat dan menunggu proses gudang.' AS status_description, 'CGK01' AS branch_code, 'EMP0001' AS employee_code
  UNION ALL
  SELECT '2026-04-07 11:30:00', 'MANIFEST', 'Paket telah dimanifest ke linehaul Jakarta.', 'CGK01', 'EMP0001'
  UNION ALL
  SELECT '2026-04-07 19:45:00', 'TRANSIT', 'Paket dalam perjalanan menuju hub Semarang.', 'CGK01', 'EMP0001'
) x
JOIN branches b ON b.branch_code = x.branch_code
JOIN employees e ON e.employee_code = x.employee_code
WHERE s.tracking_no = 'JNC2604070001'
  AND NOT EXISTS (
    SELECT 1
    FROM shipment_tracking st
    WHERE st.shipment_id = s.shipment_id
      AND st.event_time = x.event_time
      AND st.status_code = x.status_code
  );

INSERT INTO shipment_assignments (
  shipment_id,
  employee_id,
  vehicle_id,
  assignment_type,
  assigned_at,
  accepted_at,
  assignment_status,
  notes
)
SELECT
  s.shipment_id,
  e.employee_id,
  v.vehicle_id,
  'PICKUP',
  '2026-04-07 08:30:00',
  '2026-04-07 08:35:00',
  'COMPLETED',
  'Pickup selesai dan paket dibawa ke gateway.'
FROM shipments s
JOIN employees e ON e.employee_code = 'EMP0002'
JOIN vehicles v ON v.vehicle_code = 'VEH0001'
WHERE s.tracking_no = 'JNC2604070001'
  AND NOT EXISTS (
    SELECT 1 FROM shipment_assignments sa
    WHERE sa.shipment_id = s.shipment_id
      AND sa.assignment_type = 'PICKUP'
  );

INSERT INTO payments (
  shipment_id,
  payment_no,
  payment_method,
  payment_status,
  amount_due,
  amount_paid,
  paid_at,
  reference_no,
  notes
)
SELECT
  s.shipment_id,
  'PAY2604070001',
  'TRANSFER',
  'PAID',
  28500.00,
  28500.00,
  '2026-04-07 09:10:00',
  'TRX-260407-001',
  'Pembayaran lunas via transfer bank.'
FROM shipments s
WHERE s.tracking_no = 'JNC2604070001'
  AND NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.payment_no = 'PAY2604070001'
  );
