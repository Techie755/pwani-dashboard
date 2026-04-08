from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector
import os
import json
from datetime import datetime, date
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
CORS(app)

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
        print(f"DEBUG: email={email}, hash={password_hash}")
        lecturer = query("SELECT * FROM lecturers WHERE email = %s AND password_hash = %s AND is_active = 1", (email, password_hash), fetch='one')
        print(f"DEBUG: lecturer found = {lecturer}")
        if lecturer:
           courses = query("SELECT * FROM courses")
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
    if not data.get('full_name') or not data.get('email') or not data.get('password') or not data.get('staff_no'):
        return json_response({'error': 'All fields including Staff Number are required'}, 400)
    password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    existing = query("SELECT id FROM lecturers WHERE email = %s OR staff_no = %s", (data['email'], data['staff_no']), fetch='one')
    if existing:
        return json_response({'error': 'Email or Staff Number already registered'}, 400)
    lid = execute("""
        INSERT INTO lecturers (staff_no, full_name, email, password_hash, role, department_id, is_active)
        VALUES (%s, %s, %s, %s, 'lecturer', %s, 1)
    """, (data['staff_no'], data['full_name'], data['email'], password_hash, data.get('department_id', 1)))
    return json_response({'id': lid, 'message': 'Lecturer registered successfully'}, 201)
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

@app.route('/api/lecturers', methods=['GET'])
def get_lecturers():
    rows = query("""
        SELECT l.id, l.full_name, l.email, l.role, l.is_active, d.name as department_name
        FROM lecturers l
        LEFT JOIN departments d ON d.id = l.department_id
        ORDER BY l.full_name
    """)
    return json_response(rows)

@app.route('/api/lecturers/<int:lid>', methods=['DELETE'])
def delete_lecturer(lid):
    execute("UPDATE lecturers SET is_active = 0 WHERE id = %s", (lid,))
    return json_response({'message': 'Lecturer deactivated'})

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
    data = request.json
    lid = execute("""
        INSERT INTO students (reg_no, full_name, email, phone, department_id, year_of_study, semester, enrollment_date)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (data['reg_no'], data['full_name'], data.get('email'),
          data.get('phone'), data.get('department_id'),
          data.get('year_of_study', 1), data.get('semester', 1),
          data.get('enrollment_date', datetime.now().date().isoformat())))
    return json_response({'id': lid, 'message': 'Student created'}, 201)

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

@app.route('/api/courses/<int:cid>/students', methods=['GET'])
def get_course_students(cid):
    rows = query("""
        SELECT va.*, s.email, s.phone
        FROM vw_student_attendance va
        JOIN students s ON s.id = va.student_id
        WHERE va.course_id = %s
        ORDER BY va.full_name
    """, (cid,))
    return json_response(rows)
@app.route('/api/enrollments', methods=['POST'])
def enroll_student():
    data = request.json
    existing = query("SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s", 
                    (data['student_id'], data['course_id']), fetch='one')
    if existing:
        return json_response({'error': 'Student already enrolled'}, 400)
    eid = execute("INSERT INTO enrollments (student_id, course_id) VALUES (%s, %s)", 
                  (data['student_id'], data['course_id']))
    return json_response({'id': eid, 'message': 'Student enrolled'}, 201)

@app.route('/api/enrollments', methods=['DELETE'])
def unenroll_student():
    data = request.json
    execute("DELETE FROM enrollments WHERE student_id = %s AND course_id = %s", 
            (data['student_id'], data['course_id']))
    return json_response({'message': 'Student removed from course'})
@app.route('/api/courses', methods=['POST'])
def create_course():
    data = request.json
    cid = execute("""
        INSERT INTO courses (code, name, department_id, year_of_study, semester, credits)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (data['code'], data['name'], data.get('department_id', 1),
          data.get('year_of_study', 1), data.get('semester', 1),
          data.get('credits', 3)))
    return json_response({'id': cid, 'message': 'Course created'}, 201)

@app.route('/api/courses/<int:cid>', methods=['DELETE'])
def delete_course(cid):
    execute("DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = %s)", (cid,))
    execute("DELETE FROM assignments WHERE course_id = %s", (cid,))
    execute("DELETE FROM attendance_records WHERE session_id IN (SELECT id FROM attendance_sessions WHERE course_id = %s)", (cid,))
    execute("DELETE FROM attendance_sessions WHERE course_id = %s", (cid,))
    execute("DELETE FROM enrollments WHERE course_id = %s", (cid,))
    execute("DELETE FROM courses WHERE id = %s", (cid,))
    return json_response({'message': 'Course deleted'})

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
    for r in records:
        execute("""
            INSERT INTO attendance_records (session_id, student_id, status, source)
            VALUES (%s,%s,%s,'manual')
            ON DUPLICATE KEY UPDATE status=%s, source='manual'
        """, (session_id, r['student_id'], r['status'], r['status']))
    return json_response({'message': f'{len(records)} records updated'})

@app.route('/api/attendance/upload', methods=['POST'])
def upload_register():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    session_id = request.form.get('session_id')
    course_id = request.form.get('course_id')
    session_date = request.form.get('session_date', datetime.now().date().isoformat())
    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    if not session_id and course_id:
        session_id = execute("""
            INSERT INTO attendance_sessions
            (course_id, session_date, session_type, scanned_register_path)
            VALUES (%s,%s,'lecture',%s)
        """, (course_id, session_date, filepath))
    upload_id = execute("""
        INSERT INTO register_uploads
        (session_id, file_name, file_path, upload_status, uploaded_by)
        VALUES (%s,%s,%s,'completed',%s)
    """, (session_id, filename, filepath, request.form.get('uploaded_by', 'system')))
    return json_response({
        'upload_id': upload_id,
        'session_id': session_id,
        'filename': filename,
        'message': 'Register uploaded successfully.',
        'file_url': f'/api/uploads/{filename}'
    }, 201)

@app.route('/api/uploads/<filename>')
def get_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
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
        SELECT sub.*, s.reg_no, s.full_name
        FROM submissions sub
        JOIN students s ON s.id = sub.student_id
        WHERE sub.assignment_id = %s
        ORDER BY s.full_name
    """, (aid,))
    return json_response(rows)

@app.route('/api/assignments/<int:aid>/scores', methods=['PUT'])
def update_scores(aid):
    scores = request.json.get('scores', [])
    for sc in scores:
        execute("""
            INSERT INTO submissions (assignment_id, student_id, score, status, graded_at)
            VALUES (%s,%s,%s,'graded', NOW())
            ON DUPLICATE KEY UPDATE score=%s, status='graded', graded_at=NOW()
        """, (aid, sc['student_id'], sc['score'], sc['score']))
    return json_response({'message': f'{len(scores)} scores updated'})

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
            'message': f'Attendance is {att:.1f}% — needs 75% to sit for exams.',
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
    low_attendance = query("""
        SELECT student_id, reg_no, full_name, course_code, course_name,
            attendance_percentage, sessions_attended, total_sessions, exam_eligibility
        FROM vw_student_attendance
        WHERE attendance_percentage < 75 AND total_sessions > 0
        ORDER BY attendance_percentage ASC
    """)
    low_performance = query("""
        SELECT student_id, reg_no, full_name, course_code, course_name,
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)