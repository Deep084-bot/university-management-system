BEGIN;

INSERT INTO grade_scale (grade_letter, grade_point)
VALUES
	('A+', 10.00),
	('A', 9.00),
	('B+', 8.00),
	('B', 7.00),
	('C', 6.00),
	('D', 5.00),
	('F', 0.00)
ON CONFLICT (grade_letter) DO UPDATE
SET grade_point = EXCLUDED.grade_point;

WITH admin_account AS (
	INSERT INTO app_user (name, email, phone, dob, gender, password, user_type)
	VALUES (
		'Aarav Admin',
		'admin@sums.edu',
		'9990000001',
		'1985-05-14',
		'Male',
		crypt('Admin@123', gen_salt('bf')),
		'ADMIN'
	)
	ON CONFLICT (email) DO UPDATE
	SET name = EXCLUDED.name,
		phone = EXCLUDED.phone,
		dob = EXCLUDED.dob,
		gender = EXCLUDED.gender,
		password = EXCLUDED.password,
		user_type = EXCLUDED.user_type
	RETURNING user_id
)
INSERT INTO admin_user (user_id, role)
SELECT user_id, 'Registrar'
FROM admin_account
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role;

COMMIT;
