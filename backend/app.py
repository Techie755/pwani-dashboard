from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector
import os
import json
import decimal
from datetime import datetime, date
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
import re
try:
    import numpy as np
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


load_dotenv()
# Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app, 
     resources={r"/api/*": {"origins": "*"}}, 
     supports_credentials=False,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'tiff'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'pwani_analytics'),
    'port': int(os.getenv('DB_PORT', 3306)),
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def query(sql, params=None, fetch='all'):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or ())
        if fetch == 'all':
            return cursor.fetchall()
        elif fetch == 'one':
            return cursor.fetchone()
        else:
            conn.commit()
            return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def execute(sql, params=None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params or ())
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def serialize(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, decimal.Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

def json_response(data, status=200):
    return app.response_class(
        json.dumps(data, default=serialize),
        status=status,
        mimetype='application/json'
    )
@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/api/departments', methods=['GET'])
def get_departments():
    return json_response(query("SELECT * FROM departments ORDER BY name"))
import hashlib

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    role_requested = data.get('role', '').strip()
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    if role_requested == 'admin':
        admin = query("SELECT * FROM admin_users WHERE email = %s AND password_hash = %s", (email, password_hash), fetch='one')
        if admin:
            return json_response({
                'success': True,
                'role': 'admin',
                'id': admin['id'],
                'full_name': admin['full_name'],
                'email': admin['email'],
                'token': f"admin_{admin['id']}_{password_hash[:16]}"
            })
        return json_response({'success': False, 'error': 'Invalid admin credentials.'}, 401)

    elif role_requested == 'lecturer':
        lecturer = query("SELECT * FROM lecturers WHERE email = %s AND password_hash = %s AND is_active = 1", (email, password_hash), fetch='one')
        if lecturer:
            courses = query("SELECT c.* FROM courses c JOIN lecturer_courses lc ON lc.course_id = c.id WHERE lc.lecturer_id = %s", (lecturer['id'],))
            return json_response({
                'success': True,
                'role': 'lecturer',
                'id': lecturer['id'],
                'full_name': lecturer['full_name'],
                'email': lecturer['email'],
                'staff_no': lecturer.get('staff_no'),
                'department_id': lecturer.get('department_id'),
                'token': f"lecturer_{lecturer['id']}_{password_hash[:16]}",
                'courses': courses
            })
        return json_response({'success': False, 'error': 'Invalid lecturer credentials or account inactive.'}, 401)

    return json_response({'success': False, 'error': 'Please select a login type.'}, 400)
@app.route('/api/auth/register-lecturer', methods=['POST'])
def register_lecturer():
    data = request.json
    if not data.get('staff_no') or not data.get('email') or not data.get('password'):
        return json_response({'error': 'Staff No, Email and Password are required'}, 400)
    lecturer = query("SELECT * FROM lecturers WHERE staff_no = %s AND email = %s AND is_active = 1",
                    (data['staff_no'], data['email']), fetch='one')
    if not lecturer:
        return json_response({'error': 'Staff No and Email do not match our records.|Contact admin at admin@pu.ac.ke or visit the ICT office.'}, 400)
    if lecturer.get('password_hash'):
        return json_response({'error': 'Account already set up. Please login instead.'}, 400)
    if len(data['password']) < 6:
        return json_response({'error': 'Password must be at least 6 characters'}, 400)
    password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    execute("UPDATE lecturers SET password_hash = %s WHERE id = %s", (password_hash, lecturer['id']))
    return json_response({'message': 'Password set successfully! You can now login.'}, 200)
@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email', '').strip()
    new_password = data.get('new_password', '').strip()
    if not email or not new_password:
        return json_response({'error': 'Email and new password are required'}, 400)
    if len(new_password) < 6:
        return json_response({'error': 'Password must be at least 6 characters'}, 400)
    new_hash = hashlib.sha256(new_password.encode()).hexdigest()
    # Check admin
    admin = query("SELECT id FROM admin_users WHERE email = %s", (email,), fetch='one')
    if admin:
        execute("UPDATE admin_users SET password_hash = %s WHERE email = %s", (new_hash, email))
        return json_response({'message': 'Password reset successfully'})
    # Check lecturer
    lecturer = query("SELECT id FROM lecturers WHERE email = %s AND is_active = 1", (email,), fetch='one')
    if lecturer:
        execute("UPDATE lecturers SET password_hash = %s WHERE email = %s", (new_hash, email))
        return json_response({'message': 'Password reset successfully'})
    return json_response({'error': 'Email not found in our system'}, 404)
@app.route('/api/admin/register-lecturer', methods=['POST'])
def admin_register_lecturer():
    data = request.json
    if not data.get('staff_no') or not data.get('full_name') or not data.get('email'):
        return json_response({'error': 'Staff No, Full Name and Email are required'}, 400)

    existing = query("SELECT id FROM lecturers WHERE email = %s OR staff_no = %s",
                    (data['email'], data['staff_no']), fetch='one')
    if existing:
        return json_response({'error': 'Email or Staff Number already registered'}, 400)

    # Create lecturer
    lid = execute("""
        INSERT INTO lecturers (staff_no, full_name, email, department_id, is_active)
        VALUES (%s, %s, %s, %s, 1)
    """, (data['staff_no'], data['full_name'], data['email'], data.get('department_id', 1)))

    # Assign multiple courses
    for course_name in data.get('assigned_courses', []):
        if not course_name:
            continue
        # Find or create course
        course = query("SELECT id FROM courses WHERE name = %s OR code = %s", 
                      (course_name, course_name), fetch='one')
        if not course:
            course_id = execute("""
                INSERT INTO courses (code, name, department_id) 
                VALUES (%s, %s, %s)
            """, (course_name[:15].upper(), course_name, data.get('department_id', 1)))
        else:
            course_id = course['id']

        execute("INSERT IGNORE INTO lecturer_courses (lecturer_id, course_id) VALUES (%s, %s)", 
                (lid, course_id))

    return json_response({'id': lid, 'message': 'Lecturer registered successfully with courses'}, 201)
@app.route('/api/lecturers/<int:lid>/courses', methods=['POST'])
def add_course_to_lecturer(lid):
    data = request.json
    course_name = data.get('course')
    if not course_name:
        return json_response({'error': 'Course name is required'}, 400)

    lecturer = query("SELECT id FROM lecturers WHERE id = %s", (lid,), fetch='one')
    if not lecturer:
        return json_response({'error': 'Lecturer not found'}, 404)

    course = query("SELECT id FROM courses WHERE name = %s OR code = %s", 
                  (course_name, course_name), fetch='one')
    
    if not course:
        course_id = execute("""
            INSERT INTO courses (code, name, department_id) 
            VALUES (%s, %s, 1)
        """, (course_name[:15].upper(), course_name))
    else:
        course_id = course['id']

    # Prevent duplicate assignment
    existing = query("SELECT lecturer_id FROM lecturer_courses WHERE course_id = %s", 
                    (course_id,), fetch='one')
    if existing and existing['lecturer_id'] != lid:
        return json_response({'error': 'This course is already assigned to another lecturer'}, 409)

    execute("INSERT IGNORE INTO lecturer_courses (lecturer_id, course_id) VALUES (%s, %s)", 
            (lid, course_id))

    return json_response({'message': f'Course "{course_name}" assigned successfully'})

@app.route('/api/lecturers', methods=['GET'])
def get_lecturers():
    rows = query("""
        SELECT l.id, l.staff_no, l.full_name, l.email, l.department_id, 
               l.is_active, l.password_hash, d.name as department_name
        FROM lecturers l
        LEFT JOIN departments d ON d.id = l.department_id
        ORDER BY l.full_name
    """)

    for r in rows:
        r['assigned_courses'] = query("""
            SELECT c.name, c.code 
            FROM lecturer_courses lc
            JOIN courses c ON c.id = lc.course_id
            WHERE lc.lecturer_id = %s
            ORDER BY c.name
        """, (r['id'],))

    return json_response(rows)
@app.route('/api/lecturers/<int:lid>', methods=['PUT'])
def update_lecturer(lid):
    data = request.json
    lecturer = query("SELECT id FROM lecturers WHERE id = %s", (lid,), fetch='one')
    if not lecturer:
        return json_response({'error': 'Lecturer not found'}, 404)

    execute("""
        UPDATE lecturers 
        SET full_name = %s, 
            email = %s, 
            department_id = %s
        WHERE id = %s
    """, (data.get('full_name'), data.get('email'), data.get('department_id'), lid))

    # Update assigned courses
    if 'assigned_courses' in data:
        execute("DELETE FROM lecturer_courses WHERE lecturer_id = %s", (lid,))
        for course_item in data.get('assigned_courses', []):
            if not course_item:
                continue
            course_name = course_item if isinstance(course_item, str) else (course_item.get('name') or course_item.get('code', ''))
            if not course_name:
                continue
            courses_found = query("SELECT id FROM courses WHERE name = %s OR code = %s", 
                          (course_name, course_name))
            if courses_found:
                course_id = courses_found[0]['id']
            else:
                course_id = execute("INSERT INTO courses (code, name) VALUES (%s, %s)", 
                                  (course_name[:15].upper(), course_name))
            execute("INSERT IGNORE INTO lecturer_courses (lecturer_id, course_id) VALUES (%s, %s)", 
                    (lid, course_id))

    return json_response({'message': 'Lecturer updated successfully'})

@app.route('/api/lecturers/<int:lid>', methods=['DELETE'])
def delete_lecturer(lid):
    lecturer = query("SELECT email FROM lecturers WHERE id = %s", (lid,), fetch='one')
    execute("DELETE FROM lecturer_courses WHERE lecturer_id = %s", (lid,))
    execute("DELETE FROM lecturers WHERE id = %s", (lid,))
    return json_response({'message': 'Lecturer permanently deleted'})


@app.route('/api/lecturers/<int:lid>/deactivate', methods=['POST'])
def deactivate_lecturer(lid):
    lecturer = query("SELECT email FROM lecturers WHERE id = %s", (lid,), fetch='one')
    execute("UPDATE lecturers SET is_active = 0 WHERE id = %s", (lid,))
    return json_response({'message': 'Lecturer deactivated successfully'})

@app.route('/api/students', methods=['GET'])
def get_students():
    rows = query("""
        SELECT s.*, d.name as department_name
        FROM students s
        LEFT JOIN departments d ON d.id = s.department_id
        WHERE s.status = 'active'
        ORDER BY s.full_name
    """)
    return json_response(rows)
@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    data = request.json
    old_hash = hashlib.sha256(data['old_password'].encode()).hexdigest()
    new_hash = hashlib.sha256(data['new_password'].encode()).hexdigest()
    role = data.get('role')
    uid = data.get('id')
    if role == 'admin':
        user = query("SELECT * FROM admin_users WHERE id = %s AND password_hash = %s", (uid, old_hash), fetch='one')
        if not user:
            return json_response({'error': 'Current password is incorrect'}, 400)
        execute("UPDATE admin_users SET password_hash = %s WHERE id = %s", (new_hash, uid))
    else:
        user = query("SELECT * FROM lecturers WHERE id = %s AND password_hash = %s", (uid, old_hash), fetch='one')
        if not user:
            return json_response({'error': 'Current password is incorrect'}, 400)
        execute("UPDATE lecturers SET password_hash = %s WHERE id = %s", (new_hash, uid))
    return json_response({'message': 'Password changed successfully'})

@app.route('/api/students/<int:sid>', methods=['GET'])
def get_student(sid):
    student = query("""
        SELECT s.*, d.name as department_name
        FROM students s
        LEFT JOIN departments d ON d.id = s.department_id
        WHERE s.id = %s
    """, (sid,), fetch='one')
    if not student:
        return jsonify({'error': 'Not found'}), 404
    attendance = query("SELECT * FROM vw_student_attendance WHERE student_id = %s", (sid,))
    grades = query("SELECT * FROM vw_final_grades WHERE student_id = %s", (sid,))
    return json_response({'student': student, 'attendance': attendance, 'grades': grades})

@app.route('/api/students', methods=['POST'])
def create_student():
    try:
        data = request.json
        print("DEBUG Received:", data)

        if not data.get('reg_no') or not data.get('full_name'):
            return json_response({'error': 'Reg No and Full Name are required'}, 400)

        # Use execute function correctly
        student_id = execute("""
            INSERT INTO students 
            (reg_no, full_name, email, phone, department_id, year_of_study, semester, program, enrollment_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
        """, (
            data['reg_no'].strip(),
            data['full_name'].strip(),
            data.get('email', '').strip() or None,
            data.get('phone', '').strip() or None,
            int(data.get('department_id', 1)),
            int(data.get('year_of_study', 1)),
            int(data.get('semester', 1)),
            data.get('program', '').strip() or None,
            datetime.now().date()
        ))

        print(f"✅ Student created successfully! ID: {student_id}")
        program = data.get('program', '').strip()
        year = int(data.get('year_of_study', 1))
        enrolled_count = 0
        if program:
            matching_courses = query("""
                SELECT id FROM courses 
                WHERE LOWER(TRIM(program)) = LOWER(TRIM(%s))
                AND year_of_study = %s
            """, (program, year))
            for c in matching_courses:
                execute("INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (%s, %s)", (student_id, c['id']))
                enrolled_count += 1

        return json_response({'id': student_id, 'message': f'Student created and enrolled in {enrolled_count} courses'}, 201)

    except Exception as e:
        print("❌ ERROR creating student:", str(e))
        import traceback
        traceback.print_exc()
        return json_response({'error': str(e)}, 500)

@app.route('/api/students/<int:sid>', methods=['DELETE'])
def delete_student(sid):
    execute("DELETE FROM submissions WHERE student_id = %s", (sid,))
    execute("DELETE FROM attendance_records WHERE student_id = %s", (sid,))
    execute("DELETE FROM enrollments WHERE student_id = %s", (sid,))
    execute("DELETE FROM students WHERE id = %s", (sid,))
    return json_response({'message': 'Student deleted'})

@app.route('/api/courses', methods=['GET'])
def get_courses():
    rows = query("""
        SELECT c.*, d.name as department_name,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled_count,
            (SELECT COUNT(*) FROM attendance_sessions a WHERE a.course_id = c.id) as total_sessions
        FROM courses c
        LEFT JOIN departments d ON d.id = c.department_id
        ORDER BY c.code
    """)
    return json_response(rows)
@app.route('/api/courses/<int:course_id>/students', methods=['GET'])
def get_course_students(course_id):
    try:
        students = query("""
            SELECT s.id, s.reg_no, s.full_name, s.program, 
                   s.year_of_study, s.semester, s.status,
                   d.name as department_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE e.course_id = %s
            ORDER BY s.full_name
        """, (course_id,))
        
        print(f"✅ Found {len(students)} students for course {course_id}")
        return json_response(students)
    except Exception as e:
        print("❌ Error in get_course_students:", str(e))
        import traceback
        traceback.print_exc()
        return json_response([], 200)

@app.route('/api/courses', methods=['POST'])
def create_course():
    try:
        data = request.json
        print("DEBUG - Course data received:", data)

        course_id = execute("""
            INSERT INTO courses (code, name, department_id, program, credits, semester)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.get('code', '').strip().upper(),
            data.get('name', '').strip(),
            int(data.get('department_id') or 1),
            data.get('program'),
            int(data.get('credits', 3)),
            int(data.get('semester', 1))
        ))

        # Auto-enroll with flexible matching
        program = data.get('program')
        enrolled_count = 0

        if program:
            students = query("""
                SELECT id, full_name, program 
                FROM students 
                WHERE status = 'active'
            """)

            for student in students:
                # Flexible matching (ignore case and extra spaces)
                if student['program'] and str(student['program']).strip().lower() == str(program).strip().lower():
                    existing = query("""
                        SELECT 1 FROM enrollments 
                        WHERE student_id = %s AND course_id = %s
                    """, (student['id'], course_id), fetch='one')

                    if not existing:
                        execute("INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (%s, %s)", (student['id'], course_id))
                        enrolled_count += 1

            print(f"✅ Auto-enrolled {enrolled_count} students for program: {program}")

        return json_response({
            'id': course_id,
            'message': f'Course created successfully. {enrolled_count} students auto-enrolled.'
        })

    except Exception as e:
        print("❌ ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return json_response({'error': str(e)}, 500)

@app.route('/api/courses/<int:cid>', methods=['DELETE'])
def delete_course(cid):
    execute("DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = %s)", (cid,))
    execute("DELETE FROM assignments WHERE course_id = %s", (cid,))
    execute("DELETE FROM attendance_records WHERE session_id IN (SELECT id FROM attendance_sessions WHERE course_id = %s)", (cid,))
    execute("DELETE FROM attendance_sessions WHERE course_id = %s", (cid,))
    execute("DELETE FROM enrollments WHERE course_id = %s", (cid,))
    execute("DELETE FROM courses WHERE id = %s", (cid,))
    return json_response({'message': 'Course deleted'})
@app.route('/api/enrollments', methods=['POST'])
def create_enrollment():
    try:
        data = request.json
        student_id = data.get('student_id')
        course_id = data.get('course_id')

        if not student_id or not course_id:
            return json_response({'error': 'student_id and course_id are required'}, 400)

        # Check if already enrolled
        existing = query("""
            SELECT id FROM enrollments 
            WHERE student_id = %s AND course_id = %s
        """, (student_id, course_id), fetch='one')

        if existing:
            return json_response({'message': 'Student already enrolled'})

        # Create enrollment
        enrollment_id = execute("INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (%s, %s)", (student_id, course_id))

        print(f"✅ Student {student_id} enrolled in course {course_id}")
        return json_response({'id': enrollment_id, 'message': 'Student enrolled successfully'})

    except Exception as e:
        print("❌ Enrollment error:", str(e))
        import traceback
        traceback.print_exc()
        return json_response({'error': str(e)}, 500)
@app.route('/api/attendance/sessions', methods=['GET'])
def get_sessions():
    course_id = request.args.get('course_id')
    sql = """
        SELECT att.*, c.code as course_code, c.name as course_name,
            l.full_name as lecturer_name,
            COUNT(ar.id) as total_records,
            SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count
        FROM attendance_sessions att
        LEFT JOIN courses c ON c.id = att.course_id
        LEFT JOIN lecturers l ON l.id = att.lecturer_id
        LEFT JOIN attendance_records ar ON ar.session_id = att.id
    """
    params = []
    if course_id:
        sql += " WHERE att.course_id = %s"
        params.append(course_id)
    sql += " GROUP BY att.id ORDER BY att.session_date DESC LIMIT 50"
    return json_response(query(sql, params))

@app.route('/api/attendance/sessions', methods=['POST'])
def create_session():
    data = request.json
    sid = execute("""
        INSERT INTO attendance_sessions (course_id, lecturer_id, session_date, session_type, notes)
        VALUES (%s,%s,%s,%s,%s)
    """, (data['course_id'], data.get('lecturer_id'),
          data['session_date'], data.get('session_type', 'lecture'),
          data.get('notes')))
    students = query("SELECT student_id FROM enrollments WHERE course_id = %s", (data['course_id'],))
    for s in students:
        execute("""
            INSERT IGNORE INTO attendance_records (session_id, student_id, status)
            VALUES (%s,%s,'absent')
        """, (sid, s['student_id']))
    return json_response({'id': sid, 'message': 'Session created'}, 201)

@app.route('/api/attendance/sessions/<int:session_id>/records', methods=['GET'])
def get_session_records(session_id):
    rows = query("""
        SELECT ar.*, s.reg_no, s.full_name
        FROM attendance_records ar
        JOIN students s ON s.id = ar.student_id
        WHERE ar.session_id = %s
        ORDER BY s.full_name
    """, (session_id,))
    return json_response(rows)

@app.route('/api/attendance/sessions/<int:session_id>/records', methods=['PUT'])
def update_session_records(session_id):
    records = request.json.get('records', [])
    days_held = request.json.get('days_held', 1)
    # Update session with days_held if column exists
    try:
        execute("UPDATE attendance_sessions SET notes = %s WHERE id = %s",
                (f'days_held:{days_held}', session_id))
    except Exception:
        pass
    for r in records:
        existing = query(
            "SELECT id FROM attendance_records WHERE session_id = %s AND student_id = %s",
            (session_id, r['student_id']), fetch='one'
        )
        if existing:
            execute(
                "UPDATE attendance_records SET status = %s, source = 'ocr' WHERE session_id = %s AND student_id = %s",
                (r['status'], session_id, r['student_id'])
            )
        else:
            execute("""
                INSERT INTO attendance_records (session_id, student_id, status, source)
                VALUES (%s, %s, %s, 'ocr')
            """, (session_id, r['student_id'], r['status']))
    return json_response({'message': f'{len(records)} records updated', 'days_held': days_held})

@app.route('/api/attendance/upload', methods=['POST'])
def upload_register():
    if 'file' not in request.files:
        return json_response({'error': 'No file provided'}, 400)

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return json_response({'error': 'Invalid file'}, 400)

    course_id = request.form.get('course_id')
    session_date = request.form.get('session_date', datetime.now().date().isoformat())
    week_number = request.form.get('week_number', '1')

    if not course_id:
        return json_response({'error': 'course_id is required'}, 400)

    try:
        # Duplicate check using WEEK() only — no week_number column needed
        existing = query("""
            SELECT id FROM attendance_sessions
            WHERE course_id = %s
            AND YEAR(session_date) = YEAR(%s)
            AND WEEK(session_date, 1) = WEEK(%s, 1)
            LIMIT 1
        """, (course_id, session_date, session_date), fetch='one')

        if existing:
            return json_response({
                'error': f'A register for this week already exists (Session ID: {existing["id"]}). Delete it first before uploading a new one.'
            }, 409)

        # Save file
        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Insert attendance session — no week_number column used
        sid = execute("""
            INSERT INTO attendance_sessions
            (course_id, session_date, session_type, scanned_register_path)
            VALUES (%s, %s, 'lecture', %s)
        """, (course_id, session_date, filepath))

        # Pre-insert all enrolled students as absent
        enrolled = query(
            "SELECT student_id FROM enrollments WHERE course_id = %s",
            (course_id,)
        )
        for s in enrolled:
            execute("""
                INSERT IGNORE INTO attendance_records (session_id, student_id, status)
                VALUES (%s, %s, 'absent')
            """, (sid, s['student_id']))

        # register_uploads insert wrapped safely
        try:
            upload_id = execute("""
                INSERT INTO register_uploads
                (session_id, file_name, file_path, upload_status)
                VALUES (%s, %s, %s, 'completed')
            """, (sid, filename, filepath))
        except Exception:
            upload_id = sid  # fallback if register_uploads table schema differs

        return json_response({
            'success': True,
            'upload_id': upload_id,
            'session_id': sid,
            'filename': filename,
            'week_number': week_number,
            'message': f'File uploaded successfully for Week {week_number}.'
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json_response({'error': f'Upload failed: {str(e)}'}, 500)

@app.route('/api/courses/<int:course_id>/grades', methods=['GET'])
def get_course_grades(course_id):
    students = query("""
        SELECT s.id, s.reg_no, s.full_name FROM enrollments e
        JOIN students s ON e.student_id = s.id WHERE e.course_id = %s ORDER BY s.full_name
    """, (course_id,))
    results = []
    for student in students:
        scores = query("""
            SELECT a.id, a.title, a.type, a.max_score, sub.score
            FROM assignments a LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = %s
            WHERE a.course_id = %s
        """, (student['id'], course_id))
        cats = [s for s in scores if s['type'] in ('cat', 'assignment') and s['score'] is not None and s['max_score'] and float(s['max_score']) > 0]
        exams = [s for s in scores if s['type'] == 'exam' and s['score'] is not None and s['max_score'] and float(s['max_score']) > 0]
        # CAT/Assignment scores summed and scaled to 30
        cat_total_score = sum(float(s['score']) for s in cats)
        cat_total_max = sum(float(s['max_score']) for s in cats)
        cat_out_of_30 = round((cat_total_score / cat_total_max) * 30, 1) if cat_total_max > 0 else 0
        # Exam score scaled to 70
        exam_total_score = sum(float(s['score']) for s in exams)
        exam_total_max = sum(float(s['max_score']) for s in exams)
        exam_out_of_70 = round((exam_total_score / exam_total_max) * 70, 1) if exam_total_max > 0 else 0
        final = round(cat_out_of_30 + exam_out_of_70, 1)
        grade = 'A' if final >= 70 else 'B' if final >= 60 else 'C' if final >= 50 else 'D' if final >= 40 else 'F'
        status = 'pass' if final >= 50 else 'at_risk' if final >= 40 else 'failing'
        att = query("""
            SELECT COUNT(ar.id) as total, SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present
            FROM attendance_sessions att_s LEFT JOIN attendance_records ar ON ar.session_id = att_s.id AND ar.student_id = %s
            WHERE att_s.course_id = %s
        """, (student['id'], course_id), fetch='one')
        total_s = int(att['total'] or 0)
        present_s = int(att['present'] or 0)
        att_pct = round((present_s / total_s * 100), 1) if total_s > 0 else 0
        has_data = len(cats) > 0 or len(exams) > 0
        results.append({'student_id': student['id'], 'reg_no': student['reg_no'], 'full_name': student['full_name'], 'cat_score': cat_out_of_30, 'cat_max': 30, 'exam_score': exam_out_of_70, 'exam_max': 70, 'final_score': final, 'grade': grade, 'status': status, 'attendance_pct': att_pct, 'total_sessions': total_s, 'present_sessions': present_s, 'has_data': has_data})
    with_data = [r for r in results if r['has_data']]
    summary = {'total_students': len(results), 'passing': len([r for r in results if r['status'] == 'pass']), 'at_risk': len([r for r in results if r['status'] == 'at_risk']), 'failing': len([r for r in results if r['status'] == 'failing']), 'avg_final': round(sum(r['final_score'] for r in with_data) / len(with_data), 1) if with_data else 0, 'no_data': len(results) - len(with_data)}
    assessments = query("SELECT id, title, type, max_score FROM assignments WHERE course_id = %s ORDER BY id", (course_id,))
    return json_response({'students': results, 'summary': summary, 'assessments': assessments})

@app.route('/api/uploads/<filename>')
def get_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/attendance/ocr', methods=['POST', 'OPTIONS'])
def run_ocr():
    if request.method == 'OPTIONS':
        return app.make_default_options_response()

    try:
        if not CV2_AVAILABLE:
            raise ImportError("opencv-python not installed")

        data = request.json
        filename = data.get('filename')
        course_id = data.get('course_id')
        manual_days_held = data.get('days_held')

        if not filename or not course_id:
            return json_response({'error': 'filename and course_id are required'}, 400)

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(filepath):
            return json_response({'error': f'File not found: {filename}'}, 404)

        students = query("""
            SELECT s.id, s.reg_no, s.full_name
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            WHERE e.course_id = %s
            ORDER BY s.full_name
        """, (course_id,))

        if not students:
            return json_response({'error': 'No students enrolled in this course'}, 400)

        course = query("SELECT code, name FROM courses WHERE id = %s", (course_id,), fetch='one')
        course_code = course['code'] if course else ''
        course_name = course['name'] if course else ''

        # ── Load & preprocess image ──────────────────────────────────────
        img_pil = Image.open(filepath).convert('RGB')

        # Upscale small images for better OCR accuracy
        w, h = img_pil.size
        if w < 1200:
            scale = 1200 / w
            img_pil = img_pil.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        img_np = np.array(img_pil)
        img_gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        img_h, img_w = img_gray.shape

        # Denoise and enhance contrast for better OCR
        img_denoised = cv2.fastNlMeansDenoising(img_gray, h=10)
        img_enhanced = cv2.equalizeHist(img_denoised)

        # ── Run OCR with bounding box data ───────────────────────────────
        ocr_config = '--psm 6 --oem 3'
        ocr_text = pytesseract.image_to_string(Image.fromarray(img_enhanced), config=ocr_config)
        ocr_data = pytesseract.image_to_data(
            Image.fromarray(img_enhanced),
            config=ocr_config,
            output_type=pytesseract.Output.DICT
        )

        # ── Header verification ──────────────────────────────────────────
        ocr_lower = ocr_text.lower()
        code_parts = re.split(r'[/\-\s]', course_code)
        header_verified = (
            course_code.lower() in ocr_lower or
            any(p.lower() in ocr_lower for p in code_parts if len(p) >= 3) or
            any(w in ocr_lower for w in course_name.lower().split() if len(w) >= 4)
        )

        week_match = re.search(r'week\s*[:\-]?\s*(\d+)', ocr_text, re.IGNORECASE)
        week_number = week_match.group(1) if week_match else None

        # ── Detect days held ─────────────────────────────────────────────
        if manual_days_held and str(manual_days_held).strip().isdigit():
            days_held = min(max(int(manual_days_held), 1), 5)
        else:
            day_headers = re.findall(
                r'\b(MON(?:DAY)?|TUE(?:SDAY)?|WED(?:NESDAY)?|THU(?:RSDAY)?|FRI(?:DAY)?|DAY\s*\d+)\b',
                ocr_text, re.IGNORECASE
            )
            days_held = min(max(len(set(d.upper()[:3] for d in day_headers)), 1), 5)

        # ── Build TWO thresholded images ─────────────────────────────────
        # 1. Adaptive threshold — best for uneven lighting / phone photos
        thresh_adapt = cv2.adaptiveThreshold(
            img_denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 21, 8
        )
        # 2. Otsu global threshold — best for clean scans
        _, thresh_otsu = cv2.threshold(
            img_denoised, 0, 255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )
        # Use whichever has more ink (i.e. better detected the signatures)
        thresh = thresh_adapt if np.sum(thresh_adapt > 0) >= np.sum(thresh_otsu > 0) else thresh_otsu

        # Morphological close — connects broken signature strokes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        # ── Locate each student's row by reg number ──────────────────────
        reg_positions = {}
        n_words = len(ocr_data['text'])

        for i in range(n_words):
            word = (ocr_data['text'][i] or '').strip()
            if not word or int(ocr_data['conf'][i]) < 20:
                continue
            word_clean = word.replace('/', '').replace('-', '').replace(' ', '').lower()

            for student in students:
                sid = student['id']
                if sid in reg_positions:
                    continue
                reg_clean = student['reg_no'].replace('/', '').replace('-', '').replace(' ', '').lower()
                # Match on first 6+ chars of reg number
                if len(reg_clean) >= 4 and (
                    reg_clean in word_clean or
                    word_clean in reg_clean or
                    reg_clean[:6] in word_clean or
                    word_clean[:6] in reg_clean
                ):
                    reg_positions[sid] = {
                        'x': ocr_data['left'][i],
                        'y': ocr_data['top'][i],
                        'w': ocr_data['width'][i],
                        'h': max(ocr_data['height'][i], 25)
                    }

        # ── Determine signature columns ──────────────────────────────────
        # The signature area starts after the name column (~45% from left)
        # and ends before the total/lecturer column (~90% from left)
        sig_x_start = int(img_w * 0.44)
        sig_x_end   = int(img_w * 0.90)
        sig_width   = sig_x_end - sig_x_start

        # ── Adaptive ink threshold per row ───────────────────────────────
        # Signatures are much thicker than printed baseline lines.
        # We measure the baseline (printed line) ink density and require
        # signatures to exceed it by a factor.
        def count_ink_blobs(region):
            """Count connected components that are signature-sized (not tiny noise)."""
            if region.size == 0:
                return 0, 0.0
            num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(region, connectivity=8)
            sig_blobs = 0
            total_ink = 0
            for label in range(1, num_labels):  # skip background (0)
                area = stats[label, cv2.CC_STAT_AREA]
                w_blob = stats[label, cv2.CC_STAT_WIDTH]
                h_blob = stats[label, cv2.CC_STAT_HEIGHT]
                # A real signature stroke: area > 20px, wider than tall or reasonably sized
                if area > 15 and (w_blob > 8 or h_blob > 8):
                    sig_blobs += 1
                    total_ink += area
            ink_ratio = total_ink / region.size if region.size > 0 else 0
            return sig_blobs, ink_ratio

        # ── Score each student's day columns ─────────────────────────────
        results = []
        present_count = 0
        absent_count = 0

        # First pass: build per-row baseline ink (the printed horizontal line)
        # by sampling a thin strip at the bottom of each row
        def get_row_baseline_ink(y1, y2):
            strip_h = max(2, (y2 - y1) // 6)
            strip = thresh[max(0, y2 - strip_h):y2, sig_x_start:sig_x_end]
            if strip.size == 0:
                return 0.0
            return np.sum(strip > 0) / strip.size

        for student in students:
            sid = student['id']
            pos = reg_positions.get(sid)
            status = 'absent'
            days_present = 0

            if pos:
                row_y = pos['y']
                row_h = pos['h']

                # Expand row vertically to catch full signature height
                y1 = max(0, row_y - 6)
                y2 = min(img_h, row_y + row_h + 10)

                baseline_ink = get_row_baseline_ink(y1, y2)
                # Minimum ink ratio to call a cell "signed"
                # Must be at least 3x the baseline (printed line) + absolute minimum
                min_ink_ratio = max(0.025, baseline_ink * 3.0)

                col_w = sig_width // days_held
                day_results = []

                for d in range(days_held):
                    x1 = sig_x_start + d * col_w
                    x2 = sig_x_start + (d + 1) * col_w
                    # Trim left/right edges (avoid bleeding from adjacent cells)
                    x1_inner = x1 + max(2, col_w // 8)
                    x2_inner = x2 - max(2, col_w // 8)

                    cell = thresh[y1:y2, x1_inner:x2_inner]
                    if cell.size == 0:
                        day_results.append(False)
                        continue

                    blobs, ink_ratio = count_ink_blobs(cell)
                    # Signed if: enough ink blobs (2+) AND ink ratio exceeds threshold
                    signed = blobs >= 2 and ink_ratio >= min_ink_ratio
                    day_results.append(signed)

                days_present = sum(day_results)
                status = 'present' if days_present > 0 else 'absent'

            else:
                # ── Fallback: pure text OCR for this student ─────────────
                ocr_lines = ocr_text.split('\n')
                reg_clean = student['reg_no'].replace('/', '').replace('-', '').lower()
                for line in ocr_lines:
                    line_clean = line.replace('/', '').replace('-', '').replace(' ', '').lower()
                    if reg_clean[:6] in line_clean:
                        idx = line.lower().find(student['reg_no'].lower()[:4])
                        line_after = line[idx + len(student['reg_no']):] if idx >= 0 else line
                        # Check for explicit 1/0 marks
                        binary = re.findall(r'\b([01])\b', line_after)
                        if binary:
                            days_present = sum(1 for m in binary if m == '1')
                            status = 'present' if days_present > 0 else 'absent'
                        elif re.search(r'\bx\b|absent|\-\-', line_after, re.IGNORECASE):
                            status = 'absent'
                            days_present = 0
                        elif re.search(r'[a-zA-Z]{2,}', line_after):
                            status = 'present'
                            days_present = days_held
                        break

            if status == 'present':
                present_count += 1
            else:
                absent_count += 1

            results.append({
                'student_id': sid,
                'reg_no': student['reg_no'],
                'full_name': student['full_name'],
                'status': status,
                'days_present': days_present,
                'days_held': days_held
            })

        return json_response({
            'success': True,
            'course_code': course_code,
            'course_name': course_name,
            'header_verified': header_verified,
            'week_number': week_number,
            'days_held': days_held,
            'total': len(results),
            'present_count': present_count,
            'absent_count': absent_count,
            'results': results,
            'ocr_text_preview': ocr_text[:300]
        })

    except ImportError:
        return json_response({'error': 'opencv-python not installed. Run: pip install opencv-python numpy'}, 500)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json_response({'error': f'OCR processing failed: {str(e)}'}, 500)
@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    course_id = request.args.get('course_id')
    sql = """
        SELECT a.*, c.code as course_code, c.name as course_name,
            COUNT(sub.id) as submission_count,
            ROUND(AVG(sub.score), 1) as avg_score,
            SUM(CASE WHEN sub.status = 'missing' OR sub.id IS NULL THEN 1 ELSE 0 END) as missing_count
        FROM assignments a
        LEFT JOIN courses c ON c.id = a.course_id
        LEFT JOIN submissions sub ON sub.assignment_id = a.id
    """
    params = []
    if course_id:
        sql += " WHERE a.course_id = %s"
        params.append(course_id)
    sql += " GROUP BY a.id ORDER BY a.due_date DESC"
    return json_response(query(sql, params))

@app.route('/api/assignments', methods=['POST'])
def create_assignment():
    data = request.json
    aid = execute("""
        INSERT INTO assignments (course_id, title, description, max_score, due_date, type)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (data['course_id'], data['title'], data.get('description'),
          data.get('max_score', 100), data.get('due_date'),
          data.get('type', 'assignment')))
    students = query("SELECT student_id FROM enrollments WHERE course_id = %s", (data['course_id'],))
    for s in students:
        execute("""
            INSERT IGNORE INTO submissions (assignment_id, student_id, status)
            VALUES (%s,%s,'pending')
        """, (aid, s['student_id']))
    return json_response({'id': aid, 'message': 'Assignment created'}, 201)

@app.route('/api/assignments/<int:aid>/scores', methods=['GET'])
def get_scores(aid):
    rows = query("""
        SELECT sub.student_id, sub.score, s.reg_no, s.full_name
        FROM submissions sub
        JOIN students s ON s.id = sub.student_id
        WHERE sub.assignment_id = %s AND sub.score IS NOT NULL
        ORDER BY s.full_name
    """, (aid,))
    return json_response(rows)

@app.route('/api/debug/check-scores/<int:course_id>', methods=['GET'])
def debug_check_scores(course_id):
    assignments = query("SELECT id, title, type FROM assignments WHERE course_id = %s", (course_id,))
    result = []
    for a in assignments:
        subs = query("SELECT student_id, score, status FROM submissions WHERE assignment_id = %s", (a['id'],))
        result.append({'assignment_id': a['id'], 'title': a['title'], 'type': a['type'], 'submissions': subs})
    return json_response(result)

@app.route('/api/assignments/<int:aid>/scores', methods=['PUT'])
def update_scores(aid):
    scores_data = request.json.get('scores', [])
    updated = 0
    for sc in scores_data:
        student_id = sc['student_id']
        score = sc['score']
        existing = query(
            "SELECT id FROM submissions WHERE assignment_id = %s AND student_id = %s",
            (aid, student_id), fetch='one'
        )
        if existing:
            execute(
                "UPDATE submissions SET score = %s, status = 'graded', graded_at = NOW() WHERE id = %s",
                (score, existing['id'])
            )
        else:
            execute(
                "INSERT INTO submissions (assignment_id, student_id, score, status, graded_at) VALUES (%s, %s, %s, 'graded', NOW())",
                (aid, student_id, score)
            )
        updated += 1
    print(f"✅ Updated {updated} scores for assignment {aid}")
    return json_response({'message': f'{updated} scores updated'})

ATTENDANCE_THRESHOLD = 75.0
CAT_PASS_THRESHOLD = 40.0
FINAL_PASS_THRESHOLD = 50.0

def compute_insights(data):
    insights = []
    risk_level = 'low'
    att = data.get('attendance_pct') or 0
    cat_avg = data.get('cat_average') or 0
    final_score = data.get('final_score') or 0
    missing = data.get('missing_submissions') or 0
    if att < ATTENDANCE_THRESHOLD:
        insights.append({
            'type': 'attendance',
            'severity': 'critical' if att < 50 else 'warning',
            'title': 'Exam Eligibility At Risk',
            'action': 'Immediate attendance intervention required.'
        })
        risk_level = 'critical' if att < 50 else 'high'
    if missing > 0:
        insights.append({
            'type': 'assessment',
            'severity': 'warning',
            'title': f'{missing} Missing Submission(s)',
            'message': f'Student has {missing} missing CAT(s) or assignment(s).',
            'action': 'Schedule makeup assessment or counseling.'
        })
    if 0 < cat_avg < CAT_PASS_THRESHOLD:
        insights.append({
            'type': 'performance',
            'severity': 'warning',
            'title': 'Poor CAT Performance',
            'message': f'CAT average is {cat_avg:.1f}% — below 40% pass mark.',
            'action': 'Recommend tutoring and revision sessions.'
        })
    if 0 < final_score < FINAL_PASS_THRESHOLD:
        insights.append({
            'type': 'performance',
            'severity': 'critical',
            'title': 'Projected to Fail',
            'message': f'Projected final score is {final_score:.1f}% — below 50%.',
            'action': 'Immediate academic intervention required.'
        })
        risk_level = 'critical'
    if att >= 85 and cat_avg >= 70 and final_score >= 70:
        insights.append({
            'type': 'positive',
            'severity': 'success',
            'title': 'High Performer',
            'message': f'Excellent: {att:.0f}% attendance, {cat_avg:.1f}% CATs.',
            'action': 'Consider for academic excellence recognition.'
        })
    return {'insights': insights, 'risk_level': risk_level, 'eligible_for_exam': att >= ATTENDANCE_THRESHOLD}

@app.route('/api/analytics/at-risk', methods=['GET'])
def get_at_risk():
    lecturer_id = request.args.get('lecturer_id')
    
    if lecturer_id:
        low_attendance = query("""
            SELECT CAST(student_id AS UNSIGNED) as student_id,
                reg_no, full_name, course_code, course_name,
                attendance_percentage, sessions_attended, total_sessions, exam_eligibility
            FROM vw_student_attendance
            WHERE attendance_percentage < 75 AND total_sessions > 0
            AND course_id IN (
                SELECT course_id FROM lecturer_courses WHERE lecturer_id = %s
            )
            ORDER BY attendance_percentage ASC
        """, (lecturer_id,))
        low_performance = query("""
            SELECT CAST(student_id AS UNSIGNED) as student_id, 
                reg_no, full_name, course_code, course_name,
                final_score, cat_average, exam_score,
                CASE
                    WHEN final_score < 40 THEN 'failing'
                    WHEN final_score < 50 THEN 'at_risk'
                    ELSE 'pass'
                END as performance_status
            FROM vw_final_grades
            WHERE final_score < 50 AND final_score > 0
            AND course_id IN (
                SELECT course_id FROM lecturer_courses WHERE lecturer_id = %s
            )
            ORDER BY final_score ASC
        """, (lecturer_id,))
    else:
        low_attendance = query("""
            SELECT CAST(student_id AS UNSIGNED) as student_id,
                reg_no, full_name, course_code, course_name,
                attendance_percentage, sessions_attended, total_sessions, exam_eligibility
            FROM vw_student_attendance
            WHERE attendance_percentage < 75 AND total_sessions > 0
            ORDER BY attendance_percentage ASC
        """)
        low_performance = query("""
            SELECT CAST(student_id AS UNSIGNED) as student_id,
                reg_no, full_name, course_code, course_name,
                final_score, cat_average, exam_score,
                CASE
                    WHEN final_score < 40 THEN 'failing'
                    WHEN final_score < 50 THEN 'at_risk'
                    ELSE 'pass'
                END as performance_status
            FROM vw_final_grades
            WHERE final_score < 50 AND final_score > 0
            ORDER BY final_score ASC
        """)
    
    return json_response({
        'attendance_risk': low_attendance,
        'performance_risk': low_performance
    })
@app.route('/api/analytics/student/<int:sid>/insights', methods=['GET'])
def get_student_insights(sid):
    grades = query("SELECT * FROM vw_final_grades WHERE student_id = %s", (sid,))
    all_insights = []
    for g in grades:
        missing = query("""
            SELECT COUNT(*) as cnt FROM assignments a
            LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = %s
            WHERE a.course_id = %s
            AND a.type IN ('cat','assignment')
            AND (sub.id IS NULL OR sub.status = 'missing')
        """, (sid, g['course_id']), fetch='one')['cnt']
        g['missing_submissions'] = missing
        result = compute_insights(g)
        all_insights.append({'course': g['course_name'], 'course_code': g['course_code'], **result})
    return json_response({'student_id': sid, 'insights': all_insights})
@app.route('/api/lecturer/<int:lid>/dashboard', methods=['GET'])
def lecturer_dashboard(lid):
    courses = query("""
        SELECT c.id, c.code, c.name, c.program, c.year_of_study, c.semester,
            COUNT(DISTINCT e.student_id) as student_count,
            COUNT(DISTINCT att.id) as total_sessions
        FROM lecturer_courses lc
        JOIN courses c ON c.id = lc.course_id
        LEFT JOIN enrollments e ON e.course_id = c.id
        LEFT JOIN attendance_sessions att ON att.course_id = c.id
        WHERE lc.lecturer_id = %s
        GROUP BY c.id
        ORDER BY c.code
    """, (lid,))

    for c in courses:
        avg = query("""
            SELECT ROUND(AVG(attendance_percentage), 1) as avg_att
            FROM vw_student_attendance
            WHERE course_id = %s AND total_sessions > 0
        """, (c['id'],), fetch='one')
        c['avg_attendance'] = float(avg['avg_att']) if avg and avg['avg_att'] else 0

    return json_response({'courses': courses})

@app.route('/api/dashboard/overview', methods=['GET'])
def dashboard_overview():
    total_students = query("SELECT COUNT(*) as cnt FROM students WHERE status='active'", fetch='one')['cnt']
    total_courses = query("SELECT COUNT(*) as cnt FROM courses", fetch='one')['cnt']
    at_risk = query("""
        SELECT COUNT(DISTINCT student_id) as cnt
        FROM vw_student_attendance
        WHERE exam_eligibility = 'at_risk'
    """, fetch='one')['cnt']
    avg_attendance = query("""
        SELECT ROUND(AVG(attendance_percentage), 1) as avg
        FROM vw_student_attendance
        WHERE total_sessions > 0
    """, fetch='one')['avg'] or 0
    return json_response({
        'total_students': total_students,
        'total_courses': total_courses,
        'at_risk_attendance': at_risk,
        'avg_attendance': float(avg_attendance),
    })
@app.route('/api/courses/<int:course_id>/attendance-sheet', methods=['GET'])
def download_attendance_sheet(course_id):
    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.pdfgen import canvas as pdf_canvas
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        import math, io

        week = request.args.get('week', 1, type=int)

        course = query("SELECT * FROM courses WHERE id = %s", (course_id,), fetch='one')
        if not course:
            return json_response({'error': 'Course not found'}, 404)

        students = query("""
            SELECT s.reg_no, s.full_name 
            FROM enrollments e JOIN students s ON e.student_id = s.id
            WHERE e.course_id = %s ORDER BY s.full_name
        """, (course_id,))

        PAGE_W, PAGE_H = landscape(A4)
        MARGIN     = 12 * mm
        DARK_BLUE  = colors.HexColor("#0a3d62")
        MID_BLUE   = colors.HexColor("#1a5276")
        PALE_BLUE  = colors.HexColor("#eaf4fb")
        LIGHT_BLUE = colors.HexColor("#d6eaf8")
        GOLD       = colors.HexColor("#f39c12")
        WHITE      = colors.white
        GREY       = colors.HexColor("#aab7c4")
        LIGHT_GREY = colors.HexColor("#f4f6f7")
        BLACK      = colors.black

        HEADER_H    = 40 * mm
        SUBHDR_H    = 16 * mm
        NOTE_H      =  7 * mm
        COL_HDR_H   = 14 * mm
        FOOTER_H    = 13 * mm
        ROW_H       = 13 * mm

        USABLE_H = PAGE_H - MARGIN - HEADER_H - SUBHDR_H - NOTE_H - COL_HDR_H - FOOTER_H - MARGIN
        ROWS_PER_PAGE = max(1, int(USABLE_H / ROW_H))

        USABLE_W = PAGE_W - 2 * MARGIN
        COL_NO   =  8 * mm
        COL_REG  = 42 * mm
        COL_NAME = 55 * mm
        COL_DAY  = 30 * mm
        COL_TOTAL= 16 * mm
        COL_LECT = max(USABLE_W - COL_NO - COL_REG - COL_NAME - (COL_DAY*5) - COL_TOTAL, 20*mm)
        COLS = [COL_NO, COL_REG, COL_NAME] + [COL_DAY]*5 + [COL_TOTAL, COL_LECT]
        DAYS_SHORT = ["MON","TUE","WED","THU","FRI"]

        # Split students into pages
        student_list = list(students)
        if not student_list:
            chunks = [[]]
        else:
            chunks = [student_list[i:i+ROWS_PER_PAGE] 
                     for i in range(0, len(student_list), ROWS_PER_PAGE)]
        total_pages = len(chunks)

        buf = io.BytesIO()
        c = pdf_canvas.Canvas(buf, pagesize=landscape(A4))
        c.setTitle(f"Attendance ≠ Performance Dashboard — {course['code']} Week {week}")

        for page_idx, chunk in enumerate(chunks):
            page_num = page_idx + 1

            # BORDER
            c.setStrokeColor(DARK_BLUE); c.setLineWidth(2)
            c.rect(MARGIN, MARGIN, PAGE_W-2*MARGIN, PAGE_H-2*MARGIN)

            # HEADER BAND
            hy = PAGE_H - MARGIN - HEADER_H
            c.setFillColor(DARK_BLUE)
            c.rect(MARGIN, hy, PAGE_W-2*MARGIN, HEADER_H, fill=1, stroke=0)

            # Logo circle
            c.setFillColor(GOLD)
            c.circle(MARGIN+18*mm, hy+HEADER_H/2, 11*mm, fill=1, stroke=0)
            c.setFillColor(DARK_BLUE); c.setFont("Helvetica-Bold", 8)
            c.drawCentredString(MARGIN+18*mm, hy+HEADER_H/2+2*mm, "PWANI")
            c.drawCentredString(MARGIN+18*mm, hy+HEADER_H/2-3*mm, "UNIV.")

            # University title
            c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 16)
            c.drawCentredString(PAGE_W/2, hy+HEADER_H-14*mm, "PWANI UNIVERSITY")
            c.setFont("Helvetica", 9)
            c.drawCentredString(PAGE_W/2, hy+HEADER_H-21*mm, 
                                course.get('program','') or 'School of Pure and Applied Sciences')
            c.setStrokeColor(GOLD); c.setLineWidth(1.5)
            c.line(MARGIN+40*mm, hy+HEADER_H-25*mm, PAGE_W-MARGIN-40*mm, hy+HEADER_H-25*mm)
            c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 13)
            c.drawCentredString(PAGE_W/2, hy+HEADER_H-33*mm, "STUDENT ATTENDANCE REGISTER")

            # Week badge
            bx = PAGE_W-MARGIN-42*mm; by = hy+6*mm
            c.setFillColor(GOLD)
            c.roundRect(bx, by, 38*mm, 24*mm, 3*mm, fill=1, stroke=0)
            c.setFillColor(DARK_BLUE); c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(bx+19*mm, by+17*mm, "WEEK")
            c.setFont("Helvetica-Bold", 22)
            c.drawCentredString(bx+19*mm, by+7*mm, f"{week:02d}")

            # SUB-HEADER
            sy = hy - SUBHDR_H
            c.setFillColor(PALE_BLUE)
            c.rect(MARGIN, sy, PAGE_W-2*MARGIN, SUBHDR_H, fill=1, stroke=0)
            c.setStrokeColor(GREY); c.setLineWidth(0.5)
            c.rect(MARGIN, sy, PAGE_W-2*MARGIN, SUBHDR_H, fill=0, stroke=1)
            c.setFillColor(DARK_BLUE); c.setFont("Helvetica-Bold", 9)
            c.drawString(MARGIN+4*mm, sy+10*mm,
                f"Course Code:  {course['code']}      "
                f"Course Name:  {course['name']}")
            year_str = f"Year {course.get('year_of_study','')}" if course.get('year_of_study') else ''
            sem_str  = f"Semester {course.get('semester','')}" if course.get('semester') else ''
            c.drawString(MARGIN+4*mm, sy+4*mm,
                f"{year_str}   {sem_str}   |   "
                f"Total Enrolled: {len(student_list)} students   |   "
                f"Academic Year 2025/2026")
            c.setFont("Helvetica-Bold", 8); c.setFillColor(MID_BLUE)
            c.drawRightString(PAGE_W-MARGIN-4*mm, sy+4*mm,
                f"Page {page_num} of {total_pages}")

            # INSTRUCTION NOTE
            ny = sy - NOTE_H
            c.setFillColor(colors.HexColor("#fef9e7"))
            c.rect(MARGIN, ny, PAGE_W-2*MARGIN, NOTE_H, fill=1, stroke=0)
            c.setStrokeColor(colors.HexColor("#f9ca5a")); c.setLineWidth(0.4)
            c.rect(MARGIN, ny, PAGE_W-2*MARGIN, NOTE_H, fill=0, stroke=1)
            c.setFillColor(colors.HexColor("#856404"))
            c.setFont("Helvetica-BoldOblique", 7)
            c.drawString(MARGIN+3*mm, ny+3.5*mm,
                "⚠  REG NO and NAME are pre-printed by the system.  "
                "Students SIGN in the day column for each lecture attended.  "
                "Lecturer marks absent slots with  X  after each session.")

            # TABLE COLUMN HEADERS — row 1
            thy = ny - 8*mm
            x = MARGIN
            hdrs = ["#","REG NUMBER","FULL NAME (Pre-printed)"] + \
                   ["","","","",""] + \
                   ["TOTAL\nDays","LECTURER\nSIG."]
            for ci, (cw, hdr) in enumerate(zip(COLS, hdrs)):
                c.setFillColor(DARK_BLUE); c.setStrokeColor(WHITE); c.setLineWidth(0.5)
                c.rect(x, thy, cw, 8*mm, fill=1, stroke=1)
                c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 7)
                lines = hdr.split("\n")
                ty2 = thy + (8*mm + 3*mm*(len(lines)-1))/2
                for ln in lines:
                    c.drawCentredString(x+cw/2, ty2, ln); ty2 -= 3*mm
                x += cw

            # TABLE COLUMN HEADERS — row 2 (hint)
            hhy = thy - 6*mm
            hints = ["","(Pre-printed)","Student signs in each day box →"] + \
                    [""]*5 + ["",""]
            x = MARGIN
            for ci, (cw, hint) in enumerate(zip(COLS, hints)):
                c.setFillColor(LIGHT_BLUE); c.setStrokeColor(GREY); c.setLineWidth(0.4)
                c.rect(x, hhy, cw, 6*mm, fill=1, stroke=1)
                if hint:
                    c.setFillColor(MID_BLUE); c.setFont("Helvetica-Oblique", 6)
                    if ci == 2:
                        c.drawString(x+2*mm, hhy+2*mm, hint)
                    else:
                        c.drawCentredString(x+cw/2, hhy+2*mm, hint)
                x += cw

            # STUDENT ROWS
            row_y = hhy
            for ri, student in enumerate(chunk):
                row_y -= ROW_H
                bg = LIGHT_GREY if ri % 2 == 0 else WHITE
                x = MARGIN
                global_num = page_idx * ROWS_PER_PAGE + ri + 1

                for ci, cw in enumerate(COLS):
                    if ci in (3,4,5,6,7):
                        fill = colors.HexColor("#fdfefe") if ri%2==0 else WHITE
                    elif ci == 9:
                        fill = colors.HexColor("#fef5e4")
                    else:
                        fill = bg
                    c.setFillColor(fill); c.setStrokeColor(GREY); c.setLineWidth(0.4)
                    c.rect(x, row_y, cw, ROW_H, fill=1, stroke=1)

                    if ci == 0:
                        c.setFillColor(MID_BLUE); c.setFont("Helvetica-Bold", 8)
                        c.drawCentredString(x+cw/2, row_y+ROW_H/2-1.5*mm, str(global_num))
                    elif ci == 1:
                        c.setFillColor(DARK_BLUE); c.setFont("Helvetica-Bold", 7.5)
                        c.drawString(x+1.5*mm, row_y+ROW_H/2-1.5*mm, student['reg_no'])
                    elif ci == 2:
                        c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 8)
                        name = student['full_name']
                        if len(name) > 32: name = name[:31]+"…"
                        c.drawString(x+1.5*mm, row_y+ROW_H/2-1.5*mm, name)
                        # Subtle underline for signature
                        c.setStrokeColor(colors.HexColor("#cccccc")); c.setLineWidth(0.3)
                        c.line(x+1.5*mm, row_y+2.5*mm, x+cw-2*mm, row_y+2.5*mm)
                    elif ci in (3,4,5,6,7):
                        # Signature line only — no day label
                        c.setStrokeColor(colors.HexColor("#aaaaaa")); c.setLineWidth(0.5)
                        c.line(x+4*mm, row_y+3*mm, x+cw-4*mm, row_y+3*mm)
                    elif ci == 9:
                        c.setFillColor(colors.HexColor("#e8901a"))
                        c.setFont("Helvetica-Oblique", 5.5)
                        c.drawCentredString(x+cw/2, row_y+2.5*mm, "Lect. sign")
                    x += cw

            # FILL REMAINING EMPTY ROWS
            remaining = ROWS_PER_PAGE - len(chunk)
            for e in range(remaining):
                row_y -= ROW_H
                bg = LIGHT_GREY if (len(chunk)+e)%2==0 else WHITE
                x = MARGIN
                for ci, cw in enumerate(COLS):
                    fill = (colors.HexColor("#fdfefe") if (len(chunk)+e)%2==0 else WHITE) \
                           if ci in (3,4,5,6,7) else \
                           (colors.HexColor("#fef5e4") if ci==9 else bg)
                    c.setFillColor(fill); c.setStrokeColor(GREY); c.setLineWidth(0.3)
                    c.rect(x, row_y, cw, ROW_H, fill=1, stroke=1)
                    if ci in (3,4,5,6,7):
                        c.setStrokeColor(colors.HexColor("#aaaaaa")); c.setLineWidth(0.4)
                        c.line(x+4*mm, row_y+3*mm, x+cw-4*mm, row_y+3*mm)
                    x += cw

            # FOOTER
            fy = MARGIN+1*mm
            c.setFillColor(PALE_BLUE)
            c.rect(MARGIN, fy, PAGE_W-2*MARGIN, 11*mm, fill=1, stroke=0)
            c.setStrokeColor(GREY); c.setLineWidth(0.3)
            c.rect(MARGIN, fy, PAGE_W-2*MARGIN, 11*mm, fill=0, stroke=1)
            c.setFillColor(DARK_BLUE); c.setFont("Helvetica-Bold", 7.5)
            c.drawString(MARGIN+3*mm, fy+6.5*mm,
                "Lecturer's Name: ________________________________     "
                "Staff No: ____________________     "
                "Session Dates: ___ /___ /______  to  ___ /___ /______")
            c.setFont("Helvetica", 6.5); c.setFillColor(MID_BLUE)
            c.drawString(MARGIN+3*mm, fy+2*mm,
                f"{course['code']} — {course['name']}  |  "
                f"Week {week}  |  Page {page_num} of {total_pages}  |  "
                f"Pwani University  |  Printed by: Attendance ≠ Performance Dashboard")

            c.showPage()

        c.save()
        buf.seek(0)

        from flask import send_file
        return send_file(
            buf,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"Attendance_{course['code']}_Week{week:02d}.pdf"
        )

    except Exception as e:
        import traceback; traceback.print_exc()
        return json_response({'error': str(e)}, 500)
    
@app.route('/api/courses/<int:course_id>/attendance-sessions', methods=['GET'])
def get_course_attendance_sessions(course_id):
    """Return all attendance sessions with per-student records for a course."""
    try:
        sessions = query("""
            SELECT att.id, att.session_date, att.session_type, att.notes,
                COUNT(ar.id) as total_records,
                SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN ar.status='absent' THEN 1 ELSE 0 END) as absent_count
            FROM attendance_sessions att
            LEFT JOIN attendance_records ar ON ar.session_id = att.id
            WHERE att.course_id = %s
            GROUP BY att.id
            ORDER BY att.session_date DESC
        """, (course_id,))

        for s in sessions:
            # Extract days_held from session notes
            notes = s.get('notes') or ''
            days_held = 1
            import re as re_mod
            match = re_mod.search(r'days_held:(\d+)', notes)
            if match:
                days_held = int(match.group(1))
            s['days_held'] = days_held

            try:
                s['records'] = query("""
                    SELECT ar.student_id, ar.status, 
                           COALESCE(ar.days_present, CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as days_present,
                           st.reg_no, st.full_name
                    FROM attendance_records ar
                    JOIN students st ON st.id = ar.student_id
                    WHERE ar.session_id = %s
                    ORDER BY st.full_name
                """, (s['id'],))
            except Exception:
                s['records'] = query("""
                    SELECT ar.student_id, ar.status,
                           CASE WHEN ar.status='present' THEN 1 ELSE 0 END as days_present,
                           st.reg_no, st.full_name
                    FROM attendance_records ar
                    JOIN students st ON st.id = ar.student_id
                    WHERE ar.session_id = %s
                    ORDER BY st.full_name
                """, (s['id'],))

        return json_response(sessions)
    except Exception as e:
        import traceback; traceback.print_exc()
        return json_response([], 200)
@app.route('/api/attendance/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        execute("DELETE FROM attendance_records WHERE session_id = %s", (session_id,))
        try:
            execute("DELETE FROM register_uploads WHERE session_id = %s", (session_id,))
        except Exception:
            pass  # register_uploads may not exist or have different schema
        execute("DELETE FROM attendance_sessions WHERE id = %s", (session_id,))
        return json_response({'message': 'Attendance session deleted successfully'})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json_response({'error': str(e)}, 500)

@app.route('/api/admin/reset-attendance', methods=['POST'])
def reset_attendance():
    if request.json.get('confirm') != "RESET_ALL_ATTENDANCE_CONFIRMED":
        return json_response({'error': 'Invalid confirmation code'}, 400)
    
    execute("DELETE FROM attendance_records")
    execute("DELETE FROM attendance_sessions")
    execute("DELETE FROM register_uploads")
    return json_response({'message': 'All attendance data has been reset successfully.'})
@app.route('/api/analytics/quadrant', methods=['GET'])
def get_quadrant_analysis():
    lecturer_id = request.args.get('lecturer_id')
    att_threshold = float(request.args.get('att_threshold', 75))
    perf_threshold = float(request.args.get('perf_threshold', 50))

    if lecturer_id:
        course_filter = """
            AND a.course_id IN (
                SELECT course_id FROM lecturer_courses WHERE lecturer_id = %s
            )
        """
        params = (lecturer_id,)
    else:
        course_filter = ""
        params = ()

    rows = query(f"""
        SELECT 
            a.student_id,
            a.reg_no,
            a.full_name,
            a.course_id,
            a.course_code,
            a.course_name,
            a.attendance_percentage,
            a.total_sessions,
            COALESCE(g.final_score, 0) as final_score,
            COALESCE(g.cat_average, 0) as cat_average,
            COALESCE(g.exam_score, 0) as exam_score
        FROM vw_student_attendance a
        LEFT JOIN vw_final_grades g 
            ON g.student_id = a.student_id 
            AND g.course_id = a.course_id
        WHERE a.total_sessions > 0
        {course_filter}
        ORDER BY a.full_name
    """, params)

    results = []
    summary = {
        'high_att_high_perf': 0,
        'high_att_low_perf': 0,
        'low_att_high_perf': 0,
        'low_att_low_perf': 0,
        'total': 0
    }

    for r in rows:
        att = float(r['attendance_percentage'] or 0)
        perf = float(r['final_score'] or 0)
        high_att = att >= att_threshold
        high_perf = perf >= perf_threshold

        if high_att and high_perf:
            quadrant = 'high_att_high_perf'
            label = 'Ideal'
            color = '#1e8449'
            description = 'Attending and performing well'
        elif high_att and not high_perf:
            quadrant = 'high_att_low_perf'
            label = 'Hidden Struggle'
            color = '#e67e22'
            description = 'Attending but not performing — academic difficulty'
        elif not high_att and high_perf:
            quadrant = 'low_att_high_perf'
            label = 'Independent Learner'
            color = '#2980b9'
            description = 'Missing lectures but performing well — no intervention needed'
        else:
            quadrant = 'low_att_low_perf'
            label = 'True At-Risk'
            color = '#c0392b'
            description = 'Low attendance AND low performance — urgent intervention'

        summary[quadrant] += 1
        summary['total'] += 1

        results.append({
            'student_id': r['student_id'],
            'reg_no': r['reg_no'],
            'full_name': r['full_name'],
            'course_id': r['course_id'],
            'course_code': r['course_code'],
            'course_name': r['course_name'],
            'attendance_pct': att,
            'final_score': perf,
            'cat_average': float(r['cat_average'] or 0),
            'exam_score': float(r['exam_score'] or 0),
            'quadrant': quadrant,
            'label': label,
            'color': color,
            'description': description,
            'is_contradiction': quadrant in ('high_att_low_perf', 'low_att_high_perf')
        })

    contradictions = [r for r in results if r['is_contradiction']]
    true_at_risk = [r for r in results if r['quadrant'] == 'low_att_low_perf']

    return json_response({
        'results': results,
        'summary': summary,
        'contradictions': contradictions,
        'true_at_risk': true_at_risk,
        'thresholds': {
            'attendance': att_threshold,
            'performance': perf_threshold
        }
    })
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)