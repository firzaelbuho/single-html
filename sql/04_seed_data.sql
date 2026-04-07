USE ekspedisi_jne_clone;

INSERT INTO provinces (province_code, province_name)
VALUES
  ('ID-JK', 'DKI Jakarta'),
  ('ID-JB', 'Jawa Barat'),
  ('ID-JT', 'Jawa Tengah')
ON DUPLICATE KEY UPDATE
  province_name = VALUES(province_name);

INSERT INTO cities (province_id, city_code, city_name, city_type, postal_code)
SELECT p.province_id, x.city_code, x.city_name, x.city_type, x.postal_code
FROM (
  SELECT 'ID-JK' AS province_code, 'JKTSEL' AS city_code, 'Jakarta Selatan' AS city_name, 'KOTA' AS city_type, '12110' AS postal_code
  UNION ALL
  SELECT 'ID-JK', 'JKTPST', 'Jakarta Pusat', 'KOTA', '10110'
  UNION ALL
  SELECT 'ID-JB', 'BDG', 'Bandung', 'KOTA', '40111'
  UNION ALL
  SELECT 'ID-JT', 'SMG', 'Semarang', 'KOTA', '50135'
) x
JOIN provinces p ON p.province_code = x.province_code
ON DUPLICATE KEY UPDATE
  city_name = VALUES(city_name),
  city_type = VALUES(city_type),
  postal_code = VALUES(postal_code);

INSERT INTO districts (city_id, district_code, district_name)
SELECT c.city_id, x.district_code, x.district_name
FROM (
  SELECT 'JKTSEL' AS city_code, 'KEBAYORANBARU' AS district_code, 'Kebayoran Baru' AS district_name
  UNION ALL
  SELECT 'JKTPST', 'MENTENG', 'Menteng'
  UNION ALL
  SELECT 'BDG', 'LENGKONG', 'Lengkong'
  UNION ALL
  SELECT 'SMG', 'TEMBALANG', 'Tembalang'
) x
JOIN cities c ON c.city_code = x.city_code
ON DUPLICATE KEY UPDATE
  district_name = VALUES(district_name);

INSERT INTO branches (branch_code, branch_name, branch_type, city_id, district_id, address, phone, email)
SELECT
  x.branch_code,
  x.branch_name,
  x.branch_type,
  c.city_id,
  d.district_id,
  x.address,
  x.phone,
  x.email
FROM (
  SELECT 'CGK01' AS branch_code, 'Jakarta Selatan Gateway' AS branch_name, 'PUSAT' AS branch_type, 'JKTSEL' AS city_code, 'KEBAYORANBARU' AS district_code, 'Jl. Kyai Maja No. 10, Jakarta Selatan' AS address, '0215551000' AS phone, 'cgk01@ekspedisi.local' AS email
  UNION ALL
  SELECT 'BDO01', 'Bandung Distribution Center', 'CABANG', 'BDG', 'LENGKONG', 'Jl. Asia Afrika No. 88, Bandung', '0225552000', 'bdo01@ekspedisi.local'
  UNION ALL
  SELECT 'SRG01', 'Semarang Distribution Center', 'CABANG', 'SMG', 'TEMBALANG', 'Jl. Setiabudi No. 21, Semarang', '0245553000', 'srg01@ekspedisi.local'
) x
JOIN cities c ON c.city_code = x.city_code
LEFT JOIN districts d ON d.district_code = x.district_code
ON DUPLICATE KEY UPDATE
  branch_name = VALUES(branch_name),
  branch_type = VALUES(branch_type),
  city_id = VALUES(city_id),
  district_id = VALUES(district_id),
  address = VALUES(address),
  phone = VALUES(phone),
  email = VALUES(email);

INSERT INTO customers (customer_code, customer_type, full_name, company_name, phone, email, identity_no, tax_no, address, city_id, district_id, postal_code)
SELECT
  x.customer_code,
  x.customer_type,
  x.full_name,
  x.company_name,
  x.phone,
  x.email,
  x.identity_no,
  x.tax_no,
  x.address,
  c.city_id,
  d.district_id,
  x.postal_code
FROM (
  SELECT 'CUST0001' AS customer_code, 'INDIVIDU' AS customer_type, 'Budi Santoso' AS full_name, NULL AS company_name, '081234567890' AS phone, 'budi@example.com' AS email, '3174xxxxxxxxxxxx' AS identity_no, NULL AS tax_no, 'Jl. Radio Dalam No. 5, Jakarta Selatan' AS address, 'JKTSEL' AS city_code, 'KEBAYORANBARU' AS district_code, '12110' AS postal_code
  UNION ALL
  SELECT 'CUST0002', 'PERUSAHAAN', 'Siti Rahma', 'PT Maju Logistik', '082233445566', 'shipping@majulogistik.co.id', NULL, '01.234.567.8-999.000', 'Jl. Soekarno Hatta No. 77, Bandung', 'BDG', 'LENGKONG', '40111'
) x
JOIN cities c ON c.city_code = x.city_code
LEFT JOIN districts d ON d.district_code = x.district_code
ON DUPLICATE KEY UPDATE
  customer_type = VALUES(customer_type),
  full_name = VALUES(full_name),
  company_name = VALUES(company_name),
  phone = VALUES(phone),
  email = VALUES(email),
  identity_no = VALUES(identity_no),
  tax_no = VALUES(tax_no),
  address = VALUES(address),
  city_id = VALUES(city_id),
  district_id = VALUES(district_id),
  postal_code = VALUES(postal_code);

INSERT INTO employees (branch_id, employee_code, full_name, role_name, phone, email, hire_date)
SELECT
  b.branch_id,
  x.employee_code,
  x.full_name,
  x.role_name,
  x.phone,
  x.email,
  x.hire_date
FROM (
  SELECT 'CGK01' AS branch_code, 'EMP0001' AS employee_code, 'Andi Pratama' AS full_name, 'ADMIN' AS role_name, '081111111111' AS phone, 'andi@ekspedisi.local' AS email, '2024-01-15' AS hire_date
  UNION ALL
  SELECT 'CGK01', 'EMP0002', 'Rina Lestari', 'KURIR', '081122223333', 'rina@ekspedisi.local', '2024-02-01'
  UNION ALL
  SELECT 'BDO01', 'EMP0003', 'Dedi Kurniawan', 'SUPERVISOR', '081133334444', 'dedi@ekspedisi.local', '2024-02-10'
) x
JOIN branches b ON b.branch_code = x.branch_code
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  full_name = VALUES(full_name),
  role_name = VALUES(role_name),
  phone = VALUES(phone),
  email = VALUES(email),
  hire_date = VALUES(hire_date);

INSERT INTO vehicles (branch_id, vehicle_code, vehicle_type, plate_number, capacity_kg)
SELECT
  b.branch_id,
  x.vehicle_code,
  x.vehicle_type,
  x.plate_number,
  x.capacity_kg
FROM (
  SELECT 'CGK01' AS branch_code, 'VEH0001' AS vehicle_code, 'MOTOR' AS vehicle_type, 'B1234ABC' AS plate_number, 50.00 AS capacity_kg
  UNION ALL
  SELECT 'BDO01', 'VEH0002', 'VAN', 'D9876XYZ', 800.00
) x
JOIN branches b ON b.branch_code = x.branch_code
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  vehicle_type = VALUES(vehicle_type),
  plate_number = VALUES(plate_number),
  capacity_kg = VALUES(capacity_kg);

INSERT INTO service_types (service_code, service_name, description, estimated_min_days, estimated_max_days, is_cod_available, is_insurance_available)
VALUES
  ('REG', 'Regular Service', 'Layanan reguler antar kota.', 2, 4, 1, 1),
  ('YES', 'Yakin Esok Sampai', 'Layanan prioritas tiba keesokan hari.', 1, 1, 1, 1),
  ('OKE', 'Ongkos Kirim Ekonomis', 'Layanan ekonomis dengan lead time lebih panjang.', 3, 6, 0, 1)
ON DUPLICATE KEY UPDATE
  service_name = VALUES(service_name),
  description = VALUES(description),
  estimated_min_days = VALUES(estimated_min_days),
  estimated_max_days = VALUES(estimated_max_days),
  is_cod_available = VALUES(is_cod_available),
  is_insurance_available = VALUES(is_insurance_available);

INSERT INTO shipping_rates (origin_city_id, destination_city_id, service_type_id, base_price, price_per_kg, min_charge_kg, lead_time_days)
SELECT
  oc.city_id,
  dc.city_id,
  st.service_type_id,
  x.base_price,
  x.price_per_kg,
  x.min_charge_kg,
  x.lead_time_days
FROM (
  SELECT 'JKTSEL' AS origin_code, 'BDG' AS destination_code, 'REG' AS service_code, 9000.00 AS base_price, 8000.00 AS price_per_kg, 1.00 AS min_charge_kg, 2 AS lead_time_days
  UNION ALL
  SELECT 'JKTSEL', 'BDG', 'YES', 15000.00, 12000.00, 1.00, 1
  UNION ALL
  SELECT 'JKTSEL', 'SMG', 'REG', 12000.00, 10000.00, 1.00, 2
  UNION ALL
  SELECT 'BDG', 'SMG', 'OKE', 10000.00, 8500.00, 1.00, 4
) x
JOIN cities oc ON oc.city_code = x.origin_code
JOIN cities dc ON dc.city_code = x.destination_code
JOIN service_types st ON st.service_code = x.service_code
ON DUPLICATE KEY UPDATE
  base_price = VALUES(base_price),
  price_per_kg = VALUES(price_per_kg),
  min_charge_kg = VALUES(min_charge_kg),
  lead_time_days = VALUES(lead_time_days);
