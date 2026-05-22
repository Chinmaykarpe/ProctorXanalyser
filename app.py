import os
from flask import Flask, jsonify, request, Response
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from functools import wraps
from dotenv import load_dotenv
import csv
import io
import random
import string
import json
import re
import base64
import smtplib
import hashlib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

load_dotenv()

# In-memory OTP store: { email: { otp_hash, expires_at, verified } }
_otp_store = {}

app = Flask(__name__)

# CORS: in production, restrict to your Vercel frontend URL via FRONTEND_URL env var
_frontend_url = os.environ.get("FRONTEND_URL", "*")
CORS(app,
     origins=[_frontend_url] if _frontend_url != "*" else "*",
     supports_credentials=True)

mongo_uri = os.environ.get("MONGO_URI")
secret_key = os.environ.get("SECRET_KEY")
# ── Email (SMTP) ─────────────────────────────────────────────────────────────
# Recommended provider for cloud deployment: Brevo (free, 300 emails/day)
# Sign up at https://brevo.com → SMTP & API → generate SMTP key
# Set these in your cloud provider's environment variables panel:
#   SMTP_HOST     = smtp-relay.brevo.com
#   SMTP_PORT     = 587
#   SMTP_USER     = your-brevo-login@email.com
#   SMTP_PASSWORD = your-brevo-smtp-key
#   MAIL_FROM     = noreply@yourdomain.com   (or your Brevo sender address)
# ─────────────────────────────────────────────────────────────────────────────
SMTP_HOST     = os.environ.get("SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT     = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER     = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
MAIL_FROM     = os.environ.get("MAIL_FROM", SMTP_USER)  # display sender address
if mongo_uri:
    mongo_uri = mongo_uri.strip().strip('"\'')
if secret_key:
    secret_key = secret_key.strip().strip('"\'')

app.config["MONGO_URI"] = mongo_uri
app.config["SECRET_KEY"] = secret_key

try:
    mongo = PyMongo(app)
    mongo.cx.server_info()
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

bcrypt = Bcrypt(app)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = mongo.db.users.find_one({"_id": ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({"error": "User not found"}), 404
            request.current_user = {"user_id": str(current_user["_id"]), "username": current_user["username"], "role": current_user["role"]}
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except Exception as e:
            return jsonify({"error": f"Token is invalid: {e}"}), 401
        return f(*args, **kwargs)
    return decorated

IST = timezone(timedelta(hours=5, minutes=30))

def ist_str_to_utc(s):
    """Parse a datetime string from the frontend and return UTC datetime.
    Accepts: UTC ISO strings (2026-05-13T11:14:00.000Z or +00:00),
             or naive strings treated as IST (legacy fallback).
    """
    if not s:
        return None
    # Replace trailing Z with +00:00 for Python < 3.11 compatibility
    s_clean = s.strip().replace('Z', '+00:00')
    dt = datetime.fromisoformat(s_clean)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)      # treat naive as IST (legacy)
    return dt.astimezone(timezone.utc)   # store as UTC internally

def to_utc_iso(dt):
    """Return an ISO string with explicit +00:00 suffix so browsers always parse it as UTC.
    PyMongo returns naive UTC datetimes; without +00:00, browsers on IST machines treat
    the string as local time (IST) and display wrong values.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)   # attach UTC tzinfo to naive datetime
    return dt.astimezone(timezone.utc).isoformat()  # always ends with +00:00

def to_ist(dt):
    if dt is None: return None
    if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)

def fmt_ist(dt):
    d = to_ist(dt)
    return d.strftime('%d %b %Y at %I:%M %p IST') if d else ''

def _check_schedule(exam):
    now = datetime.now(timezone.utc)
    s_start = exam.get("scheduledStart")
    s_end   = exam.get("scheduledEnd")
    if s_start and s_start.tzinfo is None: s_start = s_start.replace(tzinfo=timezone.utc)
    if s_end   and s_end.tzinfo   is None: s_end   = s_end.replace(tzinfo=timezone.utc)
    if s_start and now < s_start:
        return False, f"This exam has not started yet. It opens on {fmt_ist(s_start)}.", to_utc_iso(s_start)
    if s_end and now > s_end:
        return False, f"This exam has closed. It ended on {fmt_ist(s_end)}.", None
    return True, None, None


@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Invalid JSON"}), 400
        username = data.get('username'); email = data.get('email')
        password = data.get('password'); role = data.get('role')
        if not username or not email or not password or not role:
            return jsonify({"error": "Missing fields"}), 400
        if mongo.db.users.find_one({"username": username}):
            return jsonify({"error": "Username already exists"}), 400
        if mongo.db.users.find_one({"email": email}):
            return jsonify({"error": "Email already exists"}), 400
        hashed = bcrypt.generate_password_hash(password).decode('utf-8')
        user_id = mongo.db.users.insert_one({"username": username, "email": email, "password": hashed, "role": role, "created_at": datetime.now(timezone.utc)}).inserted_id
        token = jwt.encode({"user_id": str(user_id), "role": role, "username": username, "exp": datetime.now(timezone.utc) + timedelta(days=1)}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"token": token, "user": {"username": username, "email": email, "role": role}}), 201
    except Exception as e:
        print(f"Error in /register: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data: return jsonify({"error": "Invalid JSON"}), 400
        username = data.get('username'); password = data.get('password'); role = data.get('role')
        if not username or not password or not role:
            return jsonify({"error": "Missing username, password, or role"}), 400
        user = mongo.db.users.find_one({"username": username, "role": role})
        if user and bcrypt.check_password_hash(user['password'], password):
            token = jwt.encode({"user_id": str(user['_id']), "role": user['role'], "username": user['username'], "exp": datetime.now(timezone.utc) + timedelta(days=1)}, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({"token": token, "user": {"username": user['username'], "email": user['email'], "role": user['role']}}), 200
        return jsonify({"error": "Invalid username, password, or role"}), 401
    except Exception as e:
        print(f"Error in /login: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams', methods=['POST'])
@token_required
def create_exam():
    if request.current_user['role'] != 'teacher': return jsonify({"error": "Forbidden"}), 403
    try:
        data = request.get_json()
        title = data.get('title')
        duration = int(data.get('duration', 0)) * 60
        questions = data.get('questions', [])
        show_results = data.get('showResults', True)
        required_fields = data.get('requiredFields', [])
        scheduled_start_str = data.get('scheduledStart')
        scheduled_end_str   = data.get('scheduledEnd')
        scheduled_start = scheduled_end = None
        if scheduled_start_str:
            try: scheduled_start = ist_str_to_utc(scheduled_start_str)
            except ValueError: return jsonify({"error": "Invalid scheduledStart format."}), 400
        if scheduled_end_str:
            try: scheduled_end = ist_str_to_utc(scheduled_end_str)
            except ValueError: return jsonify({"error": "Invalid scheduledEnd format."}), 400
        if scheduled_start and scheduled_end and scheduled_end <= scheduled_start:
            return jsonify({"error": "Scheduled end time must be after start time."}), 400
        if not title or not duration: return jsonify({"error": "Missing title or duration"}), 400
        if not isinstance(questions, list): return jsonify({"error": "Questions must be a list"}), 400
        total_marks = 0
        for i, q in enumerate(questions):
            q_type = q.get('type', 'mcq')
            if q_type == 'mcq':
                if not q.get('text') or not q.get('options') or not q.get('answers') or not q.get('marks'):
                    return jsonify({"error": f"Invalid question structure for question {i+1}"}), 400
                if not isinstance(q['answers'], list) or len(q['answers']) == 0:
                    return jsonify({"error": f"Question {i+1} must have at least one answer"}), 400
            else:
                if not q.get('text') or not q.get('marks'):
                    return jsonify({"error": f"Invalid question structure for question {i+1}"}), 400
            try: total_marks += int(q['marks'])
            except: return jsonify({"error": f"Invalid marks for question {i+1}"}), 400
            q['_id'] = str(i)
            if not q.get('imageUrl'): q['imageUrl'] = None
        # Batch-classify all untagged questions in one AI call
        untagged_qs = [q for q in questions if not q.get('topic')]
        if untagged_qs:
            _classify_topics_batch(untagged_qs)
        def gen_code():
            return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        exam_code = gen_code()
        while mongo.db.exams.find_one({"examCode": exam_code}): exam_code = gen_code()
        exam_doc = {"title": title, "duration": duration, "questions": questions, "totalMarks": total_marks, "questionCount": len(questions), "showResults": show_results, "requiredFields": required_fields, "examCode": exam_code, "scheduledStart": scheduled_start, "scheduledEnd": scheduled_end, "createdBy": ObjectId(request.current_user['user_id']), "createdAt": datetime.now(timezone.utc)}
        result = mongo.db.exams.insert_one(exam_doc)
        new_exam = {"_id": str(result.inserted_id), "title": title, "duration": duration, "questionCount": len(questions), "totalMarks": total_marks, "showResults": show_results, "requiredFields": required_fields, "examCode": exam_code,
            "scheduledStart":    to_utc_iso(scheduled_start),
            "scheduledEnd":      to_utc_iso(scheduled_end),
            "scheduledStartIST": fmt_ist(scheduled_start)    if scheduled_start else None,
            "scheduledEndIST":   fmt_ist(scheduled_end)      if scheduled_end   else None,
        }
        return jsonify({"message": "Exam created successfully!", "exam": new_exam}), 201
    except Exception as e:
        print(f"Error in /exams POST: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/teacher', methods=['GET'])
@token_required
def get_teacher_exams():
    if request.current_user['role'] != 'teacher': return jsonify({"error": "Forbidden"}), 403
    try:
        exams_cursor = mongo.db.exams.find({"createdBy": ObjectId(request.current_user['user_id'])}, {"title": 1, "duration": 1, "questionCount": 1, "totalMarks": 1, "createdAt": 1, "showResults": 1, "requiredFields": 1, "examCode": 1, "scheduledStart": 1, "scheduledEnd": 1})
        exam_list = []
        for exam in exams_cursor:
            s_start = exam.get("scheduledStart"); s_end = exam.get("scheduledEnd")
            exam_list.append({"_id": str(exam["_id"]), "title": exam.get("title"), "duration": exam.get("duration"), "questionCount": exam.get("questionCount", 0), "totalMarks": exam.get("totalMarks", 0), "createdAt": exam.get("createdAt"), "showResults": exam.get("showResults", True), "requiredFields": exam.get("requiredFields", []), "examCode": exam.get("examCode", "N/A"),
                "scheduledStart":    to_utc_iso(s_start) if s_start else None,
                "scheduledEnd":      to_utc_iso(s_end),
                "scheduledStartIST": fmt_ist(s_start)    if s_start else None,
                "scheduledEndIST":   fmt_ist(s_end)      if s_end   else None,
            })
        exam_list_sorted = sorted(exam_list, key=lambda x: x.get('createdAt', datetime.min), reverse=True)
        for exam in exam_list_sorted: exam.pop('createdAt', None)
        return jsonify(exam_list_sorted), 200
    except Exception as e:
        print(f"Error in /exams/teacher GET: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>', methods=['DELETE'])
@token_required
def delete_exam(exam_id):
    if request.current_user['role'] != 'teacher': return jsonify({"error": "Forbidden"}), 403
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id), "createdBy": ObjectId(request.current_user['user_id'])})
        if not exam: return jsonify({"error": "Exam not found or you do not own it"}), 404
        mongo.db.exams.delete_one({"_id": ObjectId(exam_id)})
        mongo.db.submissions.delete_many({"examId": ObjectId(exam_id)})
        return jsonify({"message": "Exam and all related submissions deleted"}), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id} DELETE: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>/results', methods=['GET'])
@token_required
def get_exam_results(exam_id):
    if request.current_user['role'] != 'teacher': return jsonify({"error": "Forbidden"}), 403
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id), "createdBy": ObjectId(request.current_user['user_id'])})
        if not exam: return jsonify({"error": "Exam not found or you do not own it"}), 404
        required_fields = exam.get("requiredFields", [])
        submissions = list(mongo.db.submissions.find({"examId": ObjectId(exam_id), "status": "submitted"}))
        results = []
        for sub in submissions:
            user = mongo.db.users.find_one({"_id": sub['studentId']})
            raw_submitted = sub.get('submittedAt')
            submitted_ist = fmt_ist(raw_submitted) if raw_submitted else None
            # Convert proctor log timestamps to IST strings
            proctor_logs = []
            for log in sub.get('proctorLogs', []):
                log_copy = dict(log)
                if log_copy.get('timestamp'):
                    try:
                        ts = datetime.fromisoformat(log_copy['timestamp'].replace('Z', '+00:00'))
                        log_copy['timestamp'] = fmt_ist(ts)
                    except Exception:
                        pass
                proctor_logs.append(log_copy)
            result_doc = {"_id": str(sub["_id"]), "studentUsername": user['username'] if user else 'Unknown', "score": sub.get('score', 0), "totalMarks": sub.get('totalMarks', 0), "correct": sub.get('correct', 0), "incorrect": sub.get('incorrect', 0), "submittedAt": submitted_ist, "proctorLogs": proctor_logs, "snapshots": sub.get('snapshots', [])}
            student_info = sub.get("studentInfo", {})
            for field in required_fields: result_doc[field] = student_info.get(field, "N/A")
            results.append(result_doc)
        results_sorted = sorted(results, key=lambda x: x['score'], reverse=True)
        for i, r in enumerate(results_sorted): r['rank'] = i + 1
        if request.args.get('format') == 'csv':
            if not results_sorted: return jsonify({"error": "No results to download"}), 404
            output = io.StringIO()
            headers = ['Rank', 'Student', 'Score', 'Total Marks', 'Correct', 'Incorrect', 'Proctor Alerts', 'Submitted At (IST)'] + required_fields
            writer = csv.writer(output); writer.writerow(headers)
            for r in results_sorted:
                row_data = [r['rank'], r['studentUsername'], r['score'], r['totalMarks'], r['correct'], r['incorrect'], len(r['proctorLogs']), r['submittedAt'] or 'N/A']
                for field in required_fields: row_data.append(r.get(field, "N/A"))
                writer.writerow(row_data)
            return Response(output.getvalue(), mimetype="text/csv", headers={"Content-disposition": f"attachment; filename=exam_results_{exam_id}.csv"})
        return jsonify(results_sorted), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/results GET: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>/details', methods=['GET'])
@token_required
def get_exam_details(exam_id):
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)}, {"_id": 1, "title": 1, "duration": 1, "questionCount": 1, "totalMarks": 1, "showResults": 1, "requiredFields": 1, "scheduledStart": 1, "scheduledEnd": 1})
        if not exam: return jsonify({"error": "Exam not found. Please check the Exam ID or code."}), 404
        already_submitted = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "submitted"})
        if already_submitted: return jsonify({"error": "You have already completed this exam. Only one attempt is allowed."}), 403
        ok, err, opens_at = _check_schedule(exam)
        if not ok: return jsonify({"error": err, "opensAt": opens_at}), 403
        active_session = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "started"})
        s_start = exam.get("scheduledStart"); s_end = exam.get("scheduledEnd")
        if s_start and s_start.tzinfo is None: s_start = s_start.replace(tzinfo=timezone.utc)
        if s_end and s_end.tzinfo is None: s_end = s_end.replace(tzinfo=timezone.utc)
        return jsonify({"_id": str(exam["_id"]), "title": exam.get("title"), "duration": exam.get("duration"), "questionCount": exam.get("questionCount", 0), "totalMarks": exam.get("totalMarks", 0), "showResults": exam.get("showResults", True), "requiredFields": exam.get("requiredFields", []), "scheduledStart": to_utc_iso(s_start), "scheduledEnd": to_utc_iso(s_end), "scheduledStartIST": fmt_ist(s_start) if s_start else None,
            "scheduledEndIST":   fmt_ist(s_end)   if s_end   else None,
            "sessionActive": active_session is not None}), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/details GET: {e}"); return jsonify({"error": "Invalid Exam ID format or internal server error."}), 500

@app.route('/exams/<exam_id>/schedule', methods=['PATCH'])
@token_required
def update_exam_schedule(exam_id):
    if request.current_user['role'] != 'teacher': return jsonify({"error": "Forbidden"}), 403
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id), "createdBy": ObjectId(request.current_user['user_id'])})
        if not exam: return jsonify({"error": "Exam not found or you do not own it."}), 404
        data = request.get_json()
        scheduled_start_str = data.get('scheduledStart'); scheduled_end_str = data.get('scheduledEnd')
        scheduled_start = scheduled_end = None
        if scheduled_start_str:
            try: scheduled_start = ist_str_to_utc(scheduled_start_str)
            except ValueError: return jsonify({"error": "Invalid scheduledStart format."}), 400
        if scheduled_end_str:
            try: scheduled_end = ist_str_to_utc(scheduled_end_str)
            except ValueError: return jsonify({"error": "Invalid scheduledEnd format."}), 400
        if scheduled_start and scheduled_end and scheduled_end <= scheduled_start:
            return jsonify({"error": "End time must be after start time."}), 400
        mongo.db.exams.update_one({"_id": ObjectId(exam_id)}, {"$set": {"scheduledStart": scheduled_start, "scheduledEnd": scheduled_end}})
        return jsonify({
            "message": "Schedule updated.",
            "scheduledStart":    to_utc_iso(scheduled_start),
            "scheduledEnd":      to_utc_iso(scheduled_end),
            "scheduledStartIST": fmt_ist(scheduled_start)    if scheduled_start else None,
            "scheduledEndIST":   fmt_ist(scheduled_end)      if scheduled_end   else None,
        }), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/schedule PATCH: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/code/<exam_code>', methods=['GET'])
@token_required
def get_exam_by_code(exam_code):
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        exam = mongo.db.exams.find_one({"examCode": exam_code.strip().upper()}, {"_id": 1, "title": 1})
        if not exam: return jsonify({"error": "No exam found with that code. Please check and try again."}), 404
        return jsonify({"examId": str(exam["_id"]), "title": exam.get("title")}), 200
    except Exception as e:
        print(f"Error in /exams/code/{exam_code} GET: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>/start', methods=['POST'])
@token_required
def start_exam(exam_id):
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        student_info = request.get_json().get("studentInfo", {})
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)}, {"_id": 1, "requiredFields": 1, "scheduledStart": 1, "scheduledEnd": 1})
        if not exam: return jsonify({"error": "Exam not found"}), 404
        ok, err, opens_at = _check_schedule(exam)
        if not ok: return jsonify({"error": err, "opensAt": opens_at}), 403
        if mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "submitted"}):
            return jsonify({"error": "You have already completed this exam. Only one attempt is allowed."}), 403
        required_fields = exam.get("requiredFields", [])
        for field in required_fields:
            if not student_info.get(field): return jsonify({"error": f"Missing required field: {field}"}), 400
        existing = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "started"})
        if existing:
            mongo.db.submissions.update_one({"_id": existing["_id"]}, {"$set": {"studentInfo": student_info}})
            return jsonify({"message": "Exam already started", "status": "started"}), 200
        mongo.db.submissions.insert_one({"examId": ObjectId(exam_id), "studentId": student_id, "studentInfo": student_info, "status": "started", "startedAt": datetime.now(timezone.utc), "score": 0, "totalMarks": 0, "answers": {}, "proctorLogs": []})
        return jsonify({"message": "Exam started", "status": "started"}), 201
    except Exception as e:
        print(f"Error in /exams/{exam_id}/start POST: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>/questions', methods=['GET'])
@token_required
def get_exam_questions(exam_id):
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        submission = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "started"})
        if not submission: return jsonify({"error": "You have not started this exam or have already submitted"}), 403
        exam_doc = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
        if not exam_doc: return jsonify({"error": "Exam document not found"}), 404
        original_questions = [{"_id": q.get('_id'), "text": q.get('text'), "options": q.get('options'), "marks": q.get('marks'), "type": q.get('type', 'mcq'), "imageUrl": q.get('imageUrl')} for q in exam_doc.get('questions', [])]
        random.shuffle(original_questions)
        saved_answers = submission.get('answers', {})
        final_questions = [{"_id": q['_id'], "text": q['text'], "options": q.get('options'), "marks": q['marks'], "type": q.get('type', 'mcq'), "imageUrl": q.get('imageUrl'), "duration": exam_doc.get('duration', 3600)} for q in original_questions]
        if not final_questions and exam_doc.get('questionCount', 0) > 0:
            return jsonify({"error": "Could not retrieve questions for this exam"}), 404
        return jsonify({"questions": final_questions, "savedAnswers": saved_answers}), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/questions GET: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>/autosave', methods=['PATCH'])
@token_required
def autosave_answers(exam_id):
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        answers = request.get_json().get('answers', {})
        submission = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "started"})
        if not submission: return jsonify({"error": "No active exam session found"}), 404
        mongo.db.submissions.update_one({"_id": submission["_id"]}, {"$set": {"answers": answers, "lastSavedAt": datetime.now(timezone.utc)}})
        return jsonify({"message": "Answers saved", "savedAt": datetime.now(timezone.utc).isoformat()}), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/autosave PATCH: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/exams/<exam_id>/submit', methods=['POST'])
@token_required
def submit_exam(exam_id):
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        data = request.get_json()
        student_answers = data.get('answers', {})
        proctor_logs = data.get('proctorLogs', [])
        snapshots = data.get('snapshots', [])
        submission = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "started"})
        if not submission: return jsonify({"error": "You have not started this exam or have already submitted"}), 403
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id)})
        if not exam: return jsonify({"error": "Exam not found"}), 404
        started_at = submission['startedAt']
        if started_at.tzinfo is None: started_at = started_at.replace(tzinfo=timezone.utc)
        time_elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
        if time_elapsed > (exam.get('duration', 0) + 15):
            proctor_logs.append({"type": "auto_submit", "message": "Time ran out", "timestamp": datetime.now(timezone.utc).isoformat()})
        original_question_map = {q.get('_id'): {"answers": q.get('answers', []), "marks": int(q.get('marks', 0)), "type": q.get('type', 'mcq'), "topic": q.get('topic', 'General')} for q in exam.get('questions', [])}
        score = correct_count = incorrect_count = 0
        total_marks = int(exam.get('totalMarks', 0))
        topic_stats = {}  # {topic: {correct, incorrect, marks_earned, total_marks}}
        for q_id, s_ans in student_answers.items():
            if q_id in original_question_map:
                cq = original_question_map[q_id]
                topic = cq.get('topic', 'General')
                if topic not in topic_stats:
                    topic_stats[topic] = {'correct': 0, 'incorrect': 0, 'marks_earned': 0, 'total_marks': 0}
                topic_stats[topic]['total_marks'] += cq['marks']
                if cq['type'] == 'mcq':
                    if sorted(s_ans) == sorted(cq['answers']):
                        score += cq['marks']; correct_count += 1
                        topic_stats[topic]['correct'] += 1
                        topic_stats[topic]['marks_earned'] += cq['marks']
                    else:
                        incorrect_count += 1
                        topic_stats[topic]['incorrect'] += 1
            else:
                incorrect_count += 1
        # Add total_marks per topic from all questions (including unanswered)
        for q in exam.get('questions', []):
            topic = q.get('topic', 'General')
            if topic not in topic_stats:
                topic_stats[topic] = {'correct': 0, 'incorrect': 0, 'marks_earned': 0, 'total_marks': 0}
            # Avoid double-counting: only add if question wasn't in student_answers
            if q.get('_id') not in student_answers:
                topic_stats[topic]['total_marks'] += int(q.get('marks', 0))
                topic_stats[topic]['incorrect'] += 1
        mongo.db.submissions.update_one({"_id": submission['_id']}, {"$set": {"status": "submitted", "submittedAt": datetime.now(timezone.utc), "answers": student_answers, "proctorLogs": proctor_logs, "snapshots": snapshots, "score": score, "totalMarks": total_marks, "correct": correct_count, "incorrect": incorrect_count, "topicStats": topic_stats}})
        all_scores = sorted([s.get('score', 0) for s in mongo.db.submissions.find({"examId": ObjectId(exam_id), "status": "submitted"}, {"score": 1})], reverse=True)
        rank = (all_scores.index(score) + 1) if score in all_scores else len(all_scores)
        return jsonify({"message": "Exam submitted successfully", "showResults": exam.get('showResults', True), "score": score, "totalMarks": total_marks, "correct": correct_count, "incorrect": incorrect_count, "totalStudents": len(all_scores)}), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/submit POST: {e}"); return jsonify({"error": "Internal server error"}), 500

@app.route('/student/history', methods=['GET'])
@token_required
def student_exam_history():
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        submissions = list(mongo.db.submissions.find({"studentId": student_id, "status": "submitted"}, {"examId": 1, "score": 1, "totalMarks": 1, "correct": 1, "incorrect": 1, "submittedAt": 1, "proctorLogs": 1}))
        history = []
        for sub in submissions:
            exam = mongo.db.exams.find_one({"_id": sub["examId"]}, {"title": 1, "showResults": 1, "examCode": 1})
            all_scores = sorted([s.get('score', 0) for s in mongo.db.submissions.find({"examId": sub["examId"], "status": "submitted"}, {"score": 1})], reverse=True)
            score = sub.get('score', 0)
            rank = (all_scores.index(score) + 1) if score in all_scores else len(all_scores)
            history.append({"_id": str(sub["_id"]), "examId": str(sub["examId"]), "examTitle": exam.get("title", "Unknown Exam") if exam else "Unknown Exam", "examCode": exam.get("examCode", "") if exam else "", "showResults": exam.get("showResults", True) if exam else True, "score": score, "totalMarks": sub.get("totalMarks", 0), "correct": sub.get("correct", 0), "incorrect": sub.get("incorrect", 0), "submittedAt": fmt_ist(sub.get("submittedAt")) if sub.get("submittedAt") else None, "proctorAlerts": len(sub.get("proctorLogs", [])), "rank": rank, "totalStudents": len(all_scores)})
        # Sort newest first using raw datetime from already-fetched submissions
        raw_dt = {str(s['_id']): s.get('submittedAt') or datetime.min for s in submissions}
        history.sort(key=lambda x: raw_dt.get(x['_id'], datetime.min), reverse=True)
        return jsonify(history), 200
    except Exception as e:
        print(f"Error in /student/history GET: {e}"); return jsonify({"error": "Internal server error"}), 500


@app.route('/exams/<exam_id>/report', methods=['GET'])
@token_required
def get_exam_report(exam_id):
    if request.current_user['role'] != 'teacher':
        return jsonify({"error": "Forbidden"}), 403
    try:
        exam = mongo.db.exams.find_one(
            {"_id": ObjectId(exam_id), "createdBy": ObjectId(request.current_user['user_id'])}
        )
        if not exam: return jsonify({"error": "Exam not found"}), 404
        submissions = list(mongo.db.submissions.find({"examId": ObjectId(exam_id), "status": "submitted"}))
        questions = exam.get("questions", [])
        q_stats = {q['_id']: {"text": q.get('text',''), "correct":0, "incorrect":0, "marks": q.get('marks',1)} for q in questions}
        students = []
        scores   = []
        for sub in submissions:
            user = mongo.db.users.find_one({"_id": sub['studentId']}, {"username":1})
            uname = user['username'] if user else 'Unknown'
            sc  = sub.get('score',0)
            tot = sub.get('totalMarks',0)
            pct = round(sc/tot*100, 1) if tot > 0 else 0
            qb  = []
            for q in questions:
                qid = q['_id']
                sa  = sub.get('answers',{}).get(qid,[])
                ca  = q.get('answers',[])
                ok  = sorted(sa) == sorted(ca)
                if ok: q_stats[qid]['correct'] += 1
                else:  q_stats[qid]['incorrect'] += 1
                qb.append({"qid":qid,"text":q.get('text',''),"marks":q.get('marks',1),"correct":ok,"studentAnswer":sa,"correctAnswer":ca})
            scores.append(sc)
            students.append({"username":uname,"score":sc,"totalMarks":tot,"percentage":pct,
                "correct":sub.get('correct',0),"incorrect":sub.get('incorrect',0),
                "alerts":len(sub.get('proctorLogs',[])),"submittedAt":fmt_ist(sub.get('submittedAt')),
                "studentInfo":sub.get('studentInfo',{}),"questionBreakdown":qb})
        students_sorted = sorted(students, key=lambda x: x['score'], reverse=True)
        for i,s in enumerate(students_sorted): s['rank'] = i+1
        avg = round(sum(scores)/len(scores),1) if scores else 0
        pass_count = sum(1 for s in scores if (s/exam.get('totalMarks',1)) >= 0.5)
        return jsonify({
            "examTitle": exam.get('title'), "totalMarks": exam.get('totalMarks',0),
            "questionCount": exam.get('questionCount',0), "totalStudents": len(students_sorted),
            "avgScore": avg, "passCount": pass_count,
            "topScore": max(scores) if scores else 0, "lowScore": min(scores) if scores else 0,
            "students": students_sorted, "questionStats": list(q_stats.values())
        }), 200
    except Exception as e:
        print(f"Error in /exams/{exam_id}/report: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/import-pdf', methods=['POST'])
@token_required
def import_pdf():
    """Extract MCQ questions from an uploaded PDF using text parsing — no API key needed."""
    if request.current_user.get('role') != 'teacher':
        return jsonify({"error": "Forbidden"}), 403

    try:
        if PdfReader is None:
            return jsonify({"error": "pypdf is not installed on the server. Run: pip install pypdf"}), 500

        data    = request.get_json(force=True)
        pdf_b64 = data.get('pdf')
        if not pdf_b64:
            return jsonify({"error": "No PDF data received"}), 400

        # Decode base64 → bytes → PdfReader
        pdf_bytes = base64.b64decode(pdf_b64)
        reader    = PdfReader(io.BytesIO(pdf_bytes))
        text      = '\n'.join(page.extract_text() or '' for page in reader.pages)

        if not text.strip():
            return jsonify({"error": "Could not extract text from this PDF. It may be a scanned image. Please use a text-based PDF."}), 422

        questions = _parse_mcq(text)

        if not questions:
            return jsonify({"error": "No MCQ questions found. Make sure the PDF has numbered questions (1. / 1) ) and options labelled A) B) C) D)."}), 422

        # Tag each question with a topic — single batch AI call (faster & cheaper)
        untagged = [q for q in questions if not q.get('topic')]
        if untagged:
            _classify_topics_batch(untagged)

        return jsonify({"questions": questions, "count": len(questions)}), 200

    except Exception as e:
        print(f"Error in /import-pdf: {e}")
        return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 500


def _parse_mcq(text):
    """
    Parse MCQ questions from raw PDF text — no AI required.

    Supports formats like:
      1. Question text        1) Question text       Q1. Question text
      A) Option text          A. Option text          (A) Option text
      Correct Answer: C       Answer: B)              Ans: a
    """
    OPT_LETTER = {'a': 0, 'b': 1, 'c': 2, 'd': 3}

    Q_PAT    = re.compile(r'^(?:Q\.?\s*|Question\s*)?(\d+)[.)]\s+(.+)', re.IGNORECASE)
    OPT_PAT  = re.compile(r'^(?:\(([a-dA-D])\)|([a-dA-D])[.)]\s)(.+)')
    ANS_PAT  = re.compile(r'(?:correct\s+answer|answer|ans(?:wer)?|key)\s*[:\-]\s*\(?([a-dA-D])\)?', re.IGNORECASE)
    MARKS_PAT= re.compile(r'\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)|(\d+)\s*marks?', re.IGNORECASE)

    lines = [l.strip() for l in text.splitlines() if l.strip()]

    questions = []
    current   = None

    def save():
        if current and current['text']:
            while len(current['options']) < 4:
                current['options'].append('')
            questions.append(dict(current))

    for line in lines:
        m = Q_PAT.match(line)
        if m:
            save()
            q_text = m.group(2).strip()
            mm     = MARKS_PAT.search(q_text)
            marks  = int(mm.group(1) or mm.group(2) or mm.group(3)) if mm else 1
            q_text = MARKS_PAT.sub('', q_text).strip()
            current = {'text': q_text, 'options': [], 'answers': [], 'marks': marks, 'imageUrl': ''}
            continue

        if current is None:
            continue

        om = OPT_PAT.match(line)
        if om:
            current['options'].append(om.group(3).strip())
            continue

        am = ANS_PAT.search(line)
        if am:
            idx = OPT_LETTER.get(am.group(1).lower())
            if idx is not None and idx < len(current['options']):
                current['answers'] = [idx]
            continue

        # Continuation of question text (before any options seen)
        if not current['options']:
            current['text'] += ' ' + line

    save()
    return questions



# ── Topic Classification ──────────────────────────────────────────────────────
# Supported topics — used by both AI and keyword fallback
SUPPORTED_TOPICS = [
    "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics",
    "Number Theory", "Physics", "Chemistry", "Biology", "Computer Science",
    "History", "Geography", "Economics", "English", "General Science",
    "General Knowledge", "General",
]

# Keyword fallback (used when AI is unavailable or GEMINI_API_KEY not set)
_TOPIC_KEYWORDS = {
    "Algebra":          ["algebra","equation","polynomial","variable","linear","quadratic","expression","coefficient","solve","simplify","factor","inequality","exponent","logarithm","matrix","determinant"],
    "Geometry":         ["geometry","triangle","circle","square","rectangle","polygon","angle","perimeter","area","volume","coordinate","congruent","parallel","perpendicular","diameter","radius","hypotenuse","tangent","sector"],
    "Trigonometry":     ["trigonometry","trigonometric","sine","cosine","tangent","sin","cos","tan","radian","degree","arcsin","arccos","arctan","pythagorean"],
    "Calculus":         ["calculus","derivative","integral","limit","differentiation","integration","continuous","differential","rate of change","slope","area under"],
    "Statistics":       ["statistics","probability","mean","median","mode","variance","standard deviation","distribution","histogram","frequency","sample","population","correlation","regression","hypothesis","random variable"],
    "Number Theory":    ["prime","divisible","factor","multiple","gcd","lcm","integer","rational","irrational","number theory","modular","remainder","digit","decimal","fraction","percentage","ratio"],
    "Physics":          ["physics","force","velocity","acceleration","mass","energy","power","momentum","friction","gravity","newton","joule","watt","wavelength","electric","magnetic","current","voltage","resistance","ohm","thermodynamic","heat","temperature","pressure"],
    "Chemistry":        ["chemistry","element","compound","molecule","atom","periodic","bond","reaction","acid","base","ph","oxidation","reduction","mole","solution","concentration","ion","electron","proton","neutron","organic","inorganic","polymer","catalyst"],
    "Biology":          ["biology","cell","dna","rna","protein","gene","chromosome","organism","photosynthesis","respiration","evolution","ecosystem","mitosis","meiosis","enzyme","hormone","nervous","immune","digestive","tissue","organ","species","bacteria","virus"],
    "Computer Science": ["algorithm","data structure","programming","software","hardware","network","database","operating system","cpu","memory","binary","loop","array","stack","queue","recursion","object oriented","python","java","javascript","html","css","complexity","sorting","compiler"],
    "History":          ["history","war","empire","civilization","century","revolution","dynasty","colonization","independence","ancient","medieval","modern","democracy","parliament","treaty","battle","monarchy"],
    "Geography":        ["geography","continent","ocean","river","mountain","climate","population","latitude","longitude","region","district","border","territory","plateau","peninsula","delta","tributary"],
    "Economics":        ["economics","supply","demand","market","inflation","gdp","trade","export","import","tax","budget","fiscal","monetary","investment","bank","currency","profit","cost","revenue","consumer","producer"],
    "English":          ["grammar","noun","verb","adjective","adverb","pronoun","tense","sentence","literature","poem","poetry","author","novel","character","plot","theme","metaphor","simile","synonym","antonym","vocabulary","punctuation","passage"],
    "General Science":  ["experiment","hypothesis","observation","theory","law","light","sound","electricity","magnetism","chemical","physical","environment","ecology","matter","wave","optics"],
    "General Knowledge":["capital","currency","president","prime minister","largest","smallest","award","olympic","sport","invention","discovery","world record","headquarters","founded","established"],
}

# ── AI-powered classifier (uses Google Gemini 1.5 Flash — free tier) ─────────
import urllib.request

_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent?key={key}"
)


def _gemini_generate(prompt: str, max_tokens: int = 50) -> str:
    """Send a prompt to Gemini 1.5 Flash and return the raw text response."""
    url = _GEMINI_URL.format(key=_GEMINI_API_KEY)
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0}
    }).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        return result["candidates"][0]["content"]["parts"][0]["text"].strip()


def _match_topic(raw: str) -> str:
    """Match a raw AI-returned string to one of SUPPORTED_TOPICS."""
    raw = raw.strip().strip(".")
    for t in SUPPORTED_TOPICS:
        if t.lower() == raw.lower():
            return t
    for t in SUPPORTED_TOPICS:
        if t.lower() in raw.lower() or raw.lower() in t.lower():
            return t
    return "General"


def _classify_topic_ai(question_text: str, options=None) -> str:
    """
    Use Gemini 1.5 Flash (free) to semantically classify one question.
    Falls back to keyword matching if API call fails or key not set.
    """
    if not _GEMINI_API_KEY:
        return _classify_topic_keywords(question_text, options)

    options_text = ""
    if options:
        options_text = "\nOptions:\n" + "\n".join(f"  - {o}" for o in options if o)

    prompt = (
        f"Classify the following exam question into exactly ONE topic from this list:\n"
        f"{', '.join(SUPPORTED_TOPICS)}\n\n"
        f"Question: {question_text}{options_text}\n\n"
        f"Rules:\n"
        f"- Reply with ONLY the topic name, nothing else.\n"
        f"- Choose the most specific topic that applies.\n"
        f"- If none fit well, reply: General\n"
        f"Topic:"
    )

    try:
        raw = _gemini_generate(prompt, max_tokens=20)
        return _match_topic(raw)
    except Exception as e:
        print(f"[TopicAI] Gemini single classification failed, using keywords: {e}")
        return _classify_topic_keywords(question_text, options)


def _classify_topic_keywords(question_text: str, options=None) -> str:
    """Keyword-based fallback classifier."""
    text = (question_text or "").lower()
    if options:
        text += " " + " ".join(str(o).lower() for o in options if o)
    best_topic = "General"
    best_score = 0
    for topic, keywords in _TOPIC_KEYWORDS.items():
        score = sum(2 if f" {kw} " in f" {text} " else 1 if kw in text else 0 for kw in keywords)
        if score > best_score:
            best_score = score
            best_topic = topic
    return best_topic if best_score > 0 else "General"


def _classify_topic(question_text: str, options=None) -> str:
    """
    Public classifier — tries Gemini AI first, falls back to keywords.
    Drop-in replacement for the old keyword-only version.
    """
    return _classify_topic_ai(question_text, options)


def _classify_topics_batch(questions: list) -> list:
    """
    Classify a batch of questions in ONE Gemini API call (faster, uses fewer quota).
    Falls back to per-question keyword matching if AI fails.

    Each item in `questions` is a dict with at least 'text' and optionally 'options'.
    Returns the same list with 'topic' set on each item.
    """
    if not questions:
        return questions

    if not _GEMINI_API_KEY:
        for q in questions:
            if not q.get('topic'):
                q['topic'] = _classify_topic_keywords(q.get('text', ''), q.get('options'))
        return questions

    # Build numbered question list for the prompt
    lines = []
    for i, q in enumerate(questions, 1):
        opts = ""
        if q.get('options'):
            opts = " | Options: " + " / ".join(str(o) for o in q['options'] if o)
        lines.append(f"{i}. {q.get('text', '')}{opts}")

    questions_block = "\n".join(lines)
    prompt = (
        f"Classify each exam question below into exactly ONE topic from this list:\n"
        f"{', '.join(SUPPORTED_TOPICS)}\n\n"
        f"{questions_block}\n\n"
        f"Reply with ONLY a JSON array of topic strings in the same order as the questions.\n"
        f'Example for 3 questions: ["Physics", "Algebra", "History"]\n'
        f"No extra text, no markdown, no explanation."
    )

    try:
        raw = _gemini_generate(prompt, max_tokens=max(60, len(questions) * 20))
        raw = re.sub(r"```[a-z]*", "", raw).strip().strip("`").strip()
        topics = json.loads(raw)
        if isinstance(topics, list) and len(topics) == len(questions):
            for q, ai_topic in zip(questions, topics):
                q['topic'] = _match_topic(str(ai_topic))
            print(f"[TopicAI] Gemini batch classified {len(questions)} questions successfully.")
            return questions
        else:
            print(f"[TopicAI] Gemini batch returned wrong count ({len(topics)} vs {len(questions)}), using keywords.")
    except Exception as e:
        print(f"[TopicAI] Gemini batch classification failed, using keywords: {e}")

    # Keyword fallback for each question
    for q in questions:
        if not q.get('topic'):
            q['topic'] = _classify_topic_keywords(q.get('text', ''), q.get('options'))
    return questions


@app.route('/exams/<exam_id>/analytics', methods=['GET'])
@token_required
def get_exam_analytics(exam_id):
    """Overall topic analytics for teacher — all students combined."""
    if request.current_user['role'] != 'teacher': return jsonify({"error": "Forbidden"}), 403
    try:
        exam = mongo.db.exams.find_one({"_id": ObjectId(exam_id), "createdBy": ObjectId(request.current_user['user_id'])})
        if not exam: return jsonify({"error": "Exam not found"}), 404
        submissions = list(mongo.db.submissions.find({"examId": ObjectId(exam_id), "status": "submitted"}, {"studentId": 1, "topicStats": 1, "score": 1, "totalMarks": 1}))
        if not submissions: return jsonify({"topicSummary": [], "studentBreakdowns": [], "totalStudents": 0}), 200

        # Aggregate topic stats across all students
        agg = {}
        for sub in submissions:
            for topic, ts in (sub.get('topicStats') or {}).items():
                if topic not in agg:
                    agg[topic] = {'correct': 0, 'incorrect': 0, 'marks_earned': 0, 'total_marks': 0, 'students': 0}
                agg[topic]['correct']      += ts.get('correct', 0)
                agg[topic]['incorrect']    += ts.get('incorrect', 0)
                agg[topic]['marks_earned'] += ts.get('marks_earned', 0)
                agg[topic]['total_marks']  += ts.get('total_marks', 0)
                agg[topic]['students']     += 1

        topic_summary = []
        for topic, a in agg.items():
            total_q = a['correct'] + a['incorrect']
            pct = round(a['correct'] / total_q * 100) if total_q > 0 else 0
            topic_summary.append({"topic": topic, "correct": a['correct'], "incorrect": a['incorrect'], "percentage": pct, "marksEarned": a['marks_earned'], "totalMarks": a['total_marks'], "students": a['students']})
        topic_summary.sort(key=lambda x: x['percentage'], reverse=True)

        # Per-student breakdown
        student_breakdowns = []
        for sub in submissions:
            user = mongo.db.users.find_one({"_id": sub['studentId']}, {"username": 1})
            ts_list = []
            for topic, ts in (sub.get('topicStats') or {}).items():
                total_q = ts['correct'] + ts['incorrect']
                pct = round(ts['correct'] / total_q * 100) if total_q > 0 else 0
                ts_list.append({"topic": topic, "correct": ts['correct'], "incorrect": ts['incorrect'], "percentage": pct, "marksEarned": ts.get('marks_earned', 0), "totalMarks": ts.get('total_marks', 0)})
            ts_list.sort(key=lambda x: x['percentage'], reverse=True)
            student_breakdowns.append({"studentId": str(sub['studentId']), "studentUsername": user['username'] if user else 'Unknown', "score": sub.get('score', 0), "totalMarks": sub.get('totalMarks', 0), "topicStats": ts_list})
        student_breakdowns.sort(key=lambda x: x['score'], reverse=True)

        return jsonify({"topicSummary": topic_summary, "studentBreakdowns": student_breakdowns, "totalStudents": len(submissions)}), 200
    except Exception as e:
        print(f"Error in analytics: {e}"); return jsonify({"error": "Internal server error"}), 500


@app.route('/exams/<exam_id>/my-analytics', methods=['GET'])
@token_required
def get_my_analytics(exam_id):
    """Per-student topic analytics — for the student themselves after submitting."""
    if request.current_user['role'] != 'student': return jsonify({"error": "Forbidden"}), 403
    try:
        student_id = ObjectId(request.current_user['user_id'])
        sub = mongo.db.submissions.find_one({"examId": ObjectId(exam_id), "studentId": student_id, "status": "submitted"})
        if not sub: return jsonify({"error": "Submission not found"}), 404
        topic_stats = sub.get('topicStats') or {}
        result = []
        for topic, ts in topic_stats.items():
            total_q = ts['correct'] + ts['incorrect']
            pct = round(ts['correct'] / total_q * 100) if total_q > 0 else 0
            status = 'Strong' if pct >= 75 else 'Improve' if pct >= 50 else 'Weak'
            result.append({"topic": topic, "correct": ts['correct'], "incorrect": ts['incorrect'], "percentage": pct, "marksEarned": ts.get('marks_earned', 0), "totalMarks": ts.get('total_marks', 0), "status": status})
        result.sort(key=lambda x: x['percentage'], reverse=True)
        return jsonify({"topicStats": result, "score": sub.get('score', 0), "totalMarks": sub.get('totalMarks', 0)}), 200
    except Exception as e:
        print(f"Error in my-analytics: {e}"); return jsonify({"error": "Internal server error"}), 500





# ──────────────────────────────────────────────
#  Profile routes (GET + UPDATE + CHANGE PASSWORD)
# ──────────────────────────────────────────────

@app.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Return the current user's profile."""
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(request.current_user['user_id'])})
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "username":  user.get("username", ""),
            "email":     user.get("email", ""),
            "role":      user.get("role", ""),
            "fullName":  user.get("fullName", ""),
            "phone":     user.get("phone", ""),
            "bio":       user.get("bio", ""),
            "avatarUrl": user.get("avatarUrl", ""),
        }), 200
    except Exception as e:
        print(f"Error in GET /profile: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/profile', methods=['PATCH'])
@token_required
def update_profile():
    """
    Update editable profile fields.
    Allowed: fullName, phone, bio, avatarUrl, email.
    Username and role cannot be changed.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        user_id = ObjectId(request.current_user['user_id'])
        updates = {}

        # ── fullName ─────────────────────────────────────────────────────────
        if 'fullName' in data:
            full_name = data['fullName'].strip()
            if len(full_name) > 100:
                return jsonify({"error": "Full name must be under 100 characters"}), 400
            updates['fullName'] = full_name

        # ── phone ─────────────────────────────────────────────────────────────
        if 'phone' in data:
            phone = data['phone'].strip()
            if phone and not re.match(r'^\+?[\d\s\-()]{7,20}$', phone):
                return jsonify({"error": "Invalid phone number format"}), 400
            updates['phone'] = phone

        # ── bio ───────────────────────────────────────────────────────────────
        if 'bio' in data:
            bio = data['bio'].strip()
            if len(bio) > 300:
                return jsonify({"error": "Bio must be under 300 characters"}), 400
            updates['bio'] = bio

        # ── avatarUrl ─────────────────────────────────────────────────────────
        if 'avatarUrl' in data:
            avatar = data['avatarUrl'].strip()
            if avatar and not re.match(r'^https?://', avatar):
                return jsonify({"error": "Avatar URL must start with http:// or https://"}), 400
            updates['avatarUrl'] = avatar

        # ── email ─────────────────────────────────────────────────────────────
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', new_email):
                return jsonify({"error": "Invalid email address"}), 400
            # Check not taken by another user
            existing = mongo.db.users.find_one({
                "email": {"$regex": f"^{re.escape(new_email)}$", "$options": "i"},
                "_id": {"$ne": user_id}
            })
            if existing:
                return jsonify({"error": "Email already in use by another account"}), 400
            updates['email'] = new_email

        if not updates:
            return jsonify({"error": "No valid fields provided to update"}), 400

        updates['updatedAt'] = datetime.now(timezone.utc)
        mongo.db.users.update_one({"_id": user_id}, {"$set": updates})

        # Return the full updated profile
        user = mongo.db.users.find_one({"_id": user_id})
        return jsonify({
            "message": "Profile updated successfully",
            "profile": {
                "username":  user.get("username", ""),
                "email":     user.get("email", ""),
                "role":      user.get("role", ""),
                "fullName":  user.get("fullName", ""),
                "phone":     user.get("phone", ""),
                "bio":       user.get("bio", ""),
                "avatarUrl": user.get("avatarUrl", ""),
            }
        }), 200
    except Exception as e:
        print(f"Error in PATCH /profile: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/profile/change-password', methods=['POST'])
@token_required
def change_password():
    """
    Change password for a logged-in user.
    Requires current password for verification.
    POST { "currentPassword": "...", "newPassword": "..." }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        current_password = data.get('currentPassword', '').strip()
        new_password     = data.get('newPassword', '').strip()

        if not current_password or not new_password:
            return jsonify({"error": "Both currentPassword and newPassword are required"}), 400
        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400
        if current_password == new_password:
            return jsonify({"error": "New password must be different from current password"}), 400

        user = mongo.db.users.find_one({"_id": ObjectId(request.current_user['user_id'])})
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not bcrypt.check_password_hash(user['password'], current_password):
            return jsonify({"error": "Current password is incorrect"}), 400

        hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
        mongo.db.users.update_one(
            {"_id": user['_id']},
            {"$set": {"password": hashed, "updatedAt": datetime.now(timezone.utc)}}
        )
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        print(f"Error in /profile/change-password: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ──────────────────────────────────────────────
#  OTP / Forgot-Password helpers & routes
# ──────────────────────────────────────────────

def _send_otp_email(to_email: str, otp: str) -> None:
    """
    Send a 6-digit OTP to *to_email* via SMTP (Gmail by default).

    Uses multipart/alternative so both plain-text and HTML parts are included.
    Many spam filters reject HTML-only mail, so the plain-text part is important.
    The correct SMTP sequence for STARTTLS is:
        connect → ehlo → starttls → ehlo again → login → sendmail
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your ExamPro Password Reset OTP"
    msg["From"]    = f"ExamPro <{MAIL_FROM}>"
    msg["To"]      = to_email

    # ── Plain-text part (required — prevents spam filtering) ──────────────────
    plain = (
        f"ExamPro — Password Reset\n\n"
        f"Your OTP is: {otp}\n\n"
        f"It is valid for 10 minutes and can only be used once.\n"
        f"If you did not request this, please ignore this email.\n"
    )

    # ── HTML part ─────────────────────────────────────────────────────────────
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:30px;margin:0;">
  <div style="max-width:420px;margin:auto;background:#fff;border-radius:12px;
              padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <h2 style="color:#2563eb;margin-top:0;margin-bottom:8px;">ExamPro — Password Reset</h2>
    <p style="color:#374151;">Use the OTP below to reset your password.
       It is valid for <strong>10 minutes</strong> and can only be used once.</p>
    <div style="font-size:40px;font-weight:700;letter-spacing:12px;
                text-align:center;color:#1d4ed8;background:#eff6ff;
                border-radius:8px;padding:20px 0;margin:24px 0;
                font-family:monospace;">
      {otp}
    </div>
    <p style="color:#6b7280;font-size:13px;margin-bottom:0;">
      If you did not request this, please ignore this email.
    </p>
  </div>
</body>
</html>"""

    # Attach plain first, HTML second (email clients prefer the last matching part)
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html,  "html",  "utf-8"))

    print(f"[SMTP] Connecting to {SMTP_HOST}:{SMTP_PORT} as {SMTP_USER} → {to_email}")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.set_debuglevel(1)          # prints full SMTP conversation to console
        server.ehlo()                      # greet before STARTTLS
        server.starttls()                  # upgrade to TLS
        server.ehlo()                      # greet again after STARTTLS (required by Gmail)
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, to_email, msg.as_string())
    print(f"[SMTP] OTP email sent successfully to {to_email}")


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


@app.route('/auth/send-otp', methods=['POST'])
def send_otp():
    try:
        data  = request.get_json()
        email = (data.get('email') or '').strip().lower()

        print(f"\n[OTP] ── send-otp called ──────────────────────")
        print(f"[OTP] Requested email : {email}")
        print(f"[OTP] SMTP_HOST       : {SMTP_HOST}")
        print(f"[OTP] SMTP_PORT       : {SMTP_PORT}")
        print(f"[OTP] SMTP_USER       : {SMTP_USER!r}")
        print(f"[OTP] SMTP_PASSWORD   : {'SET (' + str(len(SMTP_PASSWORD)) + ' chars)' if SMTP_PASSWORD else 'NOT SET'}")
        print(f"[OTP] MAIL_FROM       : {MAIL_FROM!r}")

        if not email:
            return jsonify({"error": "Email is required."}), 400

        # ── Check if email exists in DB ───────────────────────────────────────
        user = mongo.db.users.find_one(
            {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}
        )
        print(f"[OTP] User found in DB: {bool(user)}")
        if user:
            print(f"[OTP] DB email stored : {user.get('email')!r}")

        if not user:
            print(f"[OTP] Email not in DB — returning generic success (no email sent)")
            return jsonify({"message": "If that email is registered, an OTP has been sent."}), 200

        # ── Generate OTP ──────────────────────────────────────────────────────
        otp     = ''.join(random.choices(string.digits, k=6))
        expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        _otp_store[email] = {"otp_hash": _hash_otp(otp), "expires_at": expires, "verified": False}
        print(f"[OTP] Generated OTP   : {otp}  (expires {expires.strftime('%H:%M:%S')} UTC)")

        # ── Send email ────────────────────────────────────────────────────────
        if SMTP_USER and SMTP_PASSWORD:
            print(f"[OTP] Attempting SMTP send via {SMTP_HOST}:{SMTP_PORT} ...")
            try:
                _send_otp_email(email, otp)
                print(f"[OTP] SUCCESS — email sent to {email}")
                return jsonify({"message": "OTP sent to your registered email."}), 200
            except smtplib.SMTPAuthenticationError as e:
                print(f"[OTP] SMTP AUTH ERROR: {e}")
                return jsonify({"error": f"SMTP authentication failed. Check SMTP_USER / SMTP_PASSWORD. Detail: {e}"}), 500
            except smtplib.SMTPRecipientsRefused as e:
                print(f"[OTP] SMTP RECIPIENT REFUSED: {e}")
                return jsonify({"error": f"Recipient address refused by mail server: {e}"}), 500
            except smtplib.SMTPException as e:
                print(f"[OTP] SMTP ERROR: {e}")
                return jsonify({"error": f"SMTP error: {str(e)}"}), 500
            except OSError as e:
                print(f"[OTP] NETWORK/OS ERROR: {e}")
                return jsonify({"error": f"Could not connect to mail server ({SMTP_HOST}:{SMTP_PORT}): {str(e)}"}), 500
            except Exception as e:
                print(f"[OTP] UNEXPECTED ERROR: {type(e).__name__}: {e}")
                return jsonify({"error": f"Unexpected error sending email: {str(e)}"}), 500
        else:
            # SMTP not configured — show OTP in UI for local dev
            print(f"[OTP] SMTP not configured — returning OTP in response for dev use")
            return jsonify({
                "message": "SMTP not configured. OTP shown below (dev only).",
                "dev_otp": otp
            }), 200

    except Exception as e:
        print(f"[OTP] ROUTE ERROR: {type(e).__name__}: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    except Exception as e:
        print(f"Error in /auth/send-otp: {e}")
        return jsonify({"error": "Failed to send OTP. Please try again."}), 500


@app.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    """
    POST { "email": "...", "otp": "123456" }
    Verifies the OTP. On success marks it as verified (one-time use for reset).
    Returns a short-lived reset_token the client must pass to /auth/reset-password.
    """
    try:
        data  = request.get_json()
        email = (data.get('email') or '').strip().lower()
        otp   = (data.get('otp')   or '').strip()

        record = _otp_store.get(email)
        if not record:
            return jsonify({"error": "No OTP requested for this email. Please request a new one."}), 400

        if datetime.now(timezone.utc) > record["expires_at"]:
            _otp_store.pop(email, None)
            return jsonify({"error": "OTP has expired. Please request a new one."}), 400

        if record.get("verified"):
            return jsonify({"error": "OTP already used. Please request a new one."}), 400

        if _hash_otp(otp) != record["otp_hash"]:
            return jsonify({"error": "Incorrect OTP. Please check and try again."}), 400

        # Mark verified — consumed on /reset-password
        _otp_store[email]["verified"] = True

        # Issue a short-lived reset token (5 min)
        reset_token = jwt.encode(
            {"email": email, "purpose": "password_reset",
             "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
            app.config['SECRET_KEY'], algorithm="HS256"
        )
        return jsonify({"message": "OTP verified.", "reset_token": reset_token}), 200

    except Exception as e:
        print(f"Error in /auth/verify-otp: {e}")
        return jsonify({"error": "Internal server error."}), 500


@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """
    POST { "reset_token": "...", "new_password": "..." }
    Validates the reset_token issued by /verify-otp and updates the password.
    """
    try:
        data          = request.get_json()
        reset_token   = data.get('reset_token', '')
        new_password  = data.get('new_password', '').strip()

        if not new_password or len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters."}), 400

        try:
            payload = jwt.decode(reset_token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Reset session expired. Please start over."}), 400
        except Exception:
            return jsonify({"error": "Invalid reset token."}), 400

        if payload.get("purpose") != "password_reset":
            return jsonify({"error": "Invalid token purpose."}), 400

        email = payload.get("email", "").lower()

        # Ensure the OTP was actually verified (not replayed)
        record = _otp_store.get(email)
        if not record or not record.get("verified"):
            return jsonify({"error": "OTP not verified. Please complete verification first."}), 400

        hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
        result = mongo.db.users.update_one(
            {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}},
            {"$set": {"password": hashed}}
        )
        if result.matched_count == 0:
            return jsonify({"error": "User not found."}), 404

        # Consume the OTP record so it can't be reused
        _otp_store.pop(email, None)

        return jsonify({"message": "Password updated successfully. You can now log in."}), 200

    except Exception as e:
        print(f"Error in /auth/reset-password: {e}")
        return jsonify({"error": "Internal server error."}), 500


# ──────────────────────────────────────────────────────────────────────────────
#  Image Upload & Serve
#  Images are stored as base64 in MongoDB (no extra storage service needed).
#  Max size: 5 MB per image. Supported types: JPEG, PNG, GIF, WEBP.
# ──────────────────────────────────────────────────────────────────────────────

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024   # 5 MB


@app.route('/upload-image', methods=['POST'])
@token_required
def upload_image():
    """
    Accept a base64-encoded image from the teacher, store it in MongoDB,
    and return a permanent URL: /images/<image_id>

    Expected JSON body:
    {
        "data":     "<base64 string>",          # raw base64, no data-URI prefix
        "mimeType": "image/jpeg",               # must be in ALLOWED_IMAGE_TYPES
        "filename": "question1.jpg"             # optional, for reference
    }
    """
    try:
        if request.current_user.get('role') != 'teacher':
            return jsonify({"error": "Only teachers can upload images"}), 403

        body = request.get_json()
        if not body:
            return jsonify({"error": "Invalid JSON"}), 400

        raw_data  = body.get('data', '')
        mime_type = body.get('mimeType', '').lower().strip()
        filename  = body.get('filename', 'image')[:200]

        if not raw_data:
            return jsonify({"error": "No image data provided"}), 400
        if mime_type not in ALLOWED_IMAGE_TYPES:
            return jsonify({"error": f"Unsupported image type '{mime_type}'. Allowed: JPEG, PNG, GIF, WEBP"}), 400

        # Strip data-URI prefix if the client accidentally included it
        if ',' in raw_data:
            raw_data = raw_data.split(',', 1)[1]

        try:
            image_bytes = base64.b64decode(raw_data)
        except Exception:
            return jsonify({"error": "Invalid base64 data"}), 400

        if len(image_bytes) > MAX_IMAGE_BYTES:
            return jsonify({"error": f"Image too large (max 5 MB, got {len(image_bytes)//1024} KB)"}), 400

        doc = {
            "data":        raw_data,        # stored as base64 string
            "mimeType":    mime_type,
            "filename":    filename,
            "uploadedBy":  request.current_user['user_id'],
            "uploadedAt":  datetime.now(timezone.utc),
            "sizeBytes":   len(image_bytes),
        }
        image_id = mongo.db.images.insert_one(doc).inserted_id

        image_url = f"/images/{str(image_id)}"
        return jsonify({"imageUrl": image_url, "imageId": str(image_id)}), 201

    except Exception as e:
        print(f"Error in /upload-image: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/images/<image_id>', methods=['GET'])
def serve_image(image_id):
    """
    Serve an uploaded image by its MongoDB _id.
    No authentication required — any student viewing an exam can load the image.
    Responses are cached for 7 days via Cache-Control header.
    """
    try:
        doc = mongo.db.images.find_one({"_id": ObjectId(image_id)})
        if not doc:
            return jsonify({"error": "Image not found"}), 404

        image_bytes = base64.b64decode(doc['data'])
        return Response(
            image_bytes,
            mimetype=doc.get('mimeType', 'image/jpeg'),
            headers={
                "Cache-Control": "public, max-age=604800, immutable",   # 7 days
                "Content-Disposition": f"inline; filename=\"{doc.get('filename','image')}\"",
            }
        )
    except Exception as e:
        print(f"Error in /images/{image_id}: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    if not app.config["MONGO_URI"] or not app.config["SECRET_KEY"]:
        print("FATAL ERROR: MONGO_URI and SECRET_KEY must be set in .env file.")
    else:
        app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))