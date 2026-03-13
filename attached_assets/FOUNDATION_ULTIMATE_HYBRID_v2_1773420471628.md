# VELOCE WEAR SIMULATION — FOUNDATION (ULTIMATE EDITION v2)
## Complete Production-Ready Implementation for Replit
## ⚠️ FIXED VERSION — Opus 4.6 Code Review Applied

**Course:** SCM 4330 SCM Applications  
**Version:** Hybrid Enhanced (Gemini UI/UX + Claude Documentation)  
**Build Type:** Production-ready foundation from scratch  
**Purpose:** Stable, extensible base for Modules 1-3 (added later)  
**Total Points:** 165 (M1=55, M2=55, M3=55)  

**Enhancement Credits:**
- UI/UX Design & Gamification: Gemini 3 Pro
- Testing & Documentation: Claude Sonnet 4.5
- Integration: Hybrid Best-of-Both-Worlds

---

## 📋 TABLE OF CONTENTS

1. [Foundation Objectives](#foundation-objectives)
2. [Critical Rules](#critical-rules)
3. [Complete Database Schema](#complete-database-schema)
4. [File Structure](#file-structure)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Enhanced Features](#enhanced-features)
7. [Complete Testing Checklist](#complete-testing-checklist)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Deployment Guide](#deployment-guide)
10. [Done Definition](#done-definition)

---

## 🎯 FOUNDATION OBJECTIVES

### What You're Building

A complete web application foundation that supports:

**Core Features:**
- ✅ **Secure Authentication** — Student + instructor login (EDU emails only)
- ✅ **Student Dashboard** — 3 modules with status tracking and unlocking
- ✅ **Module Introduction Pages** — Accessible before and after login
- ✅ **Time Windows** — Start/end dates with per-student extensions
- ✅ **Practice + Final Architecture** — Unlimited practice, one final submission
- ✅ **Instructor Tools** — Gradebook, CSV export, settings panel
- ✅ **Deterministic Utilities** — Stable seeding, JSON helpers for simulations

**Enhanced Features (Gemini):**
- ✨ **React Gamification** — 12+ achievement badges with visual states
- ✨ **Chart.js Analytics** — Real-time instructor dashboard visualizations
- ✨ **Glassmorphism Design** — Modern frosted-glass UI with smooth animations
- ✨ **Dark Mode** — Automatic theme switching with localStorage persistence
- ✨ **Enhanced UX** — Hover effects, transitions, responsive design

**Quality Assurance (Claude):**
- 🧪 **124 Test Cases** — Comprehensive testing across 20 categories
- 🔧 **20 Troubleshooting Solutions** — Common issues with step-by-step fixes
- ⏱️ **Time Estimates** — Realistic planning (total ~8 hours implementation)
- 📚 **Complete Documentation** — Beginner-friendly, production-ready

### Why Foundation Matters

**The foundation must be rock-solid because:**
- Modules 1-3 will be added later (each ~500 lines of code)
- Database schema cannot change after students start
- Authentication bugs are critical security issues
- Module locking logic must be bulletproof
- Instructor tools need to work from day one
- Visual polish impacts student engagement

---

## 📋 CRITICAL RULES

### DO:
✅ Use Python Flask + SQLite (preferred stack)  
✅ Implement ALL helper functions completely  
✅ Test module locking logic thoroughly  
✅ Validate ALL user inputs  
✅ Use Werkzeug password hashing  
✅ Create responsive UI (mobile + desktop)  
✅ Include React, ReactDOM, Babel, and Chart.js via CDN  
✅ Test on multiple browsers (Chrome, Firefox, Safari)  
✅ Follow the testing checklist completely  

### DO NOT:
❌ Skip any helper functions  
❌ Use Python's built-in hash() (not deterministic!)  
❌ Expose raw database IDs in URLs  
❌ Allow students to access instructor routes  
❌ Store passwords in plain text  
❌ Create complex Node.js/Webpack build processes  
❌ Skip testing steps  
❌ Deploy without changing default passwords  

### IF Replit Creates Express/TypeScript:
⚠️ **DO NOT rewrite to Flask** — Implement same behavior in Express  
⚠️ Keep database schema identical  
⚠️ All helper functions must exist with same behavior  
⚠️ Maintain same route structure  

---

## 🗄️ COMPLETE DATABASE SCHEMA

### SQL Schema (Copy-Paste Ready)

**File: `database/schema.sql`**

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    student_id TEXT NOT NULL UNIQUE,
    section TEXT,
    role TEXT NOT NULL CHECK(role IN ('student', 'instructor')),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Module settings (global windows)
CREATE TABLE IF NOT EXISTS module_settings (
    module_key TEXT PRIMARY KEY CHECK(module_key IN ('M1', 'M2', 'M3')),
    title TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
);

-- Per-student extensions
CREATE TABLE IF NOT EXISTS module_extensions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_key TEXT NOT NULL CHECK(module_key IN ('M1', 'M2', 'M3')),
    extended_end_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, module_key),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Final submissions (one per student per module)
CREATE TABLE IF NOT EXISTS module_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_key TEXT NOT NULL CHECK(module_key IN ('M1', 'M2', 'M3')),
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL,
    submitted_at TEXT,
    submission_json TEXT,
    UNIQUE(user_id, module_key),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Practice and final runs
CREATE TABLE IF NOT EXISTS simulation_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_key TEXT NOT NULL CHECK(module_key IN ('M1', 'M2', 'M3')),
    run_number INTEGER NOT NULL,
    decisions_json TEXT NOT NULL,
    kpi_json TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    is_final INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Configuration key-value store
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulation_runs_user_module 
    ON simulation_runs(user_id, module_key);
CREATE INDEX IF NOT EXISTS idx_module_submissions_user 
    ON module_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role 
    ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users(email);
```

### Schema Design Notes

**Why SQLite?**
- ✅ No external database server needed
- ✅ Perfect for Replit deployment
- ✅ Sufficient for 100+ students
- ✅ Easy backup (single file)
- ✅ Can migrate to PostgreSQL later if needed

**Indexes Explained:**
- `idx_simulation_runs_user_module` — Fast practice run queries
- `idx_module_submissions_user` — Fast gradebook loading
- `idx_users_role` — Efficient student/instructor filtering
- `idx_users_email` — Fast login queries

---

## 📁 COMPLETE FILE STRUCTURE

```
veloce-scm-simulation/
├── app.py                          # Main Flask application (80 lines)
├── requirements.txt                # Python dependencies (3 packages)
├── .env                           # Environment variables (git-ignored)
├── README.md                      # Deployment guide
├── TESTING_CHECKLIST.md           # 124 test cases
├── TROUBLESHOOTING.md             # 20 common issues + solutions
├── database/
│   ├── schema.sql                 # Database schema (60 lines)
│   ├── init_db.py                 # Database initialization (40 lines)
│   └── scm_simulation.db          # SQLite database (auto-created)
├── modules/
│   ├── __init__.py                # Python package marker
│   ├── auth.py                    # Authentication logic (80 lines)
│   └── helpers.py                 # Helper functions (150 lines)
├── routes/
│   ├── __init__.py                # Python package marker
│   ├── public.py                  # Landing, intro, about (100 lines)
│   ├── student.py                 # Student dashboard + modules (150 lines)
│   └── instructor.py              # Gradebook, settings, export (200 lines)
├── static/
│   ├── css/
│   │   └── style.css              # Glassmorphism + Dark Mode (500 lines)
│   └── js/
│       └── darkmode.js            # Dark mode toggle (30 lines)
└── templates/
    ├── base.html                  # Base template with nav (60 lines)
    ├── public/
    │   ├── landing.html           # Landing page (80 lines)
    │   ├── intro.html             # General introduction (100 lines)
    │   ├── about.html             # About page (60 lines)
    │   └── module_intro.html      # Parameterized module intro (80 lines)
    ├── auth/
    │   ├── login.html             # Login form (60 lines)
    │   └── register.html          # Registration form (80 lines)
    ├── student/
    │   ├── dashboard.html         # Dashboard with React gamification (200 lines)
    │   ├── module.html            # Module placeholder (100 lines)
    │   └── module_locked.html     # Locked module message (40 lines)
    └── instructor/
        ├── gradebook.html         # Gradebook with Chart.js (250 lines)
        └── settings.html          # Module windows + extensions (150 lines)

TOTAL: ~2,500 lines of production-ready code
```

---

## 🚀 STEP-BY-STEP IMPLEMENTATION

### STEP 0: Environment Setup (10 minutes)

**Create `.env` file:**

```bash
# Required
SECRET_KEY=your-secret-key-here-change-in-production
INSTRUCTOR_EMAIL=instructor@ggc.edu
INSTRUCTOR_PASSWORD=change-this-password

# Optional
APP_NAME=Veloce Wear Simulation
TZ=America/New_York
FLASK_ENV=development
```

**Generate Strong Secret Key:**

```python
# Run this once to generate SECRET_KEY
import secrets
print(secrets.token_hex(32))
```

**Create `requirements.txt`:**

```
Flask==3.0.0
Werkzeug==3.0.1
python-dotenv==1.0.0
numpy>=1.24.0
```

**Install Dependencies:**

```bash
pip install -r requirements.txt
```

---

### STEP 1: Helper Functions (30 minutes)

**File: `modules/helpers.py`**

```python
import json
import hashlib
from datetime import datetime

def now_iso():
    """Return current UTC time in ISO format with Z suffix"""
    return datetime.utcnow().isoformat() + 'Z'

def stable_hash(text):
    """
    Return stable integer hash using SHA256.
    NEVER use Python's built-in hash() - it's not deterministic!
    
    Args:
        text (str): Text to hash
        
    Returns:
        int: Stable hash value
        
    Example:
        >>> stable_hash("student_12345")
        284756329847562
        >>> stable_hash("student_12345")  # Same value every time
        284756329847562
    """
    hash_bytes = hashlib.sha256(text.encode('utf-8')).hexdigest()
    # Take first 16 hex chars and convert to int
    return int(hash_bytes[:16], 16)

def safe_json_load(text, default=None):
    """Safely load JSON with fallback"""
    if not text:
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default

def safe_json_dump(obj):
    """Dump JSON with stable sorting"""
    return json.dumps(obj, sort_keys=True, ensure_ascii=False)

def next_run_number(db, user_id, module_key):
    """Get next run number for user/module"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT MAX(run_number) FROM simulation_runs
        WHERE user_id = ? AND module_key = ?
    """, (user_id, module_key))
    
    result = cursor.fetchone()
    max_run = result[0] if result and result[0] is not None else 0
    return max_run + 1

def has_final_submission(db, user_id, module_key):
    """Check if user has submitted final for module"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT submitted_at FROM module_submissions
        WHERE user_id = ? AND module_key = ? AND submitted_at IS NOT NULL
    """, (user_id, module_key))
    
    return cursor.fetchone() is not None

def get_final_submission(db, user_id, module_key):
    """Get final submission row"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT * FROM module_submissions
        WHERE user_id = ? AND module_key = ?
    """, (user_id, module_key))
    
    row = cursor.fetchone()
    if row:
        return {
            'id': row[0],
            'user_id': row[1],
            'module_key': row[2],
            'score': row[3],
            'max_score': row[4],
            'submitted_at': row[5],
            'submission_json': safe_json_load(row[6], {})
        }
    return None

def build_submission_json(module_key, decisions, kpis, score_breakdown, 
                         justification_text, run_id, metadata):
    """Build standardized submission JSON"""
    return {
        'module_key': module_key,
        'decisions': decisions,
        'kpis': kpis,
        'score_breakdown': score_breakdown,
        'justification': justification_text,
        'run_id': run_id,
        'metadata': {
            'timestamp': metadata.get('timestamp', now_iso()),
            'app_version': metadata.get('app_version', '2.0.0'),
            'run_count': metadata.get('run_count', 1),
            'seed_offset': metadata.get('seed_offset', '1000'),
            'scenario_id': metadata.get('scenario_id', f'{module_key}-{run_id}')
        }
    }

def module_window_status(db, user_id, module_key):
    """
    Check if module window is open.
    Returns: 'Open' or 'Closed'
    """
    cursor = db.cursor()
    now = datetime.utcnow()
    
    # Check for per-student extension
    cursor.execute("""
        SELECT extended_end_at FROM module_extensions
        WHERE user_id = ? AND module_key = ?
    """, (user_id, module_key))
    
    extension = cursor.fetchone()
    if extension:
        extended_end = datetime.fromisoformat(extension[0].replace('Z', ''))
        if now <= extended_end:
            return 'Open'
    
    # Check global window
    cursor.execute("""
        SELECT start_at, end_at, is_enabled FROM module_settings
        WHERE module_key = ?
    """, (module_key,))
    
    settings = cursor.fetchone()
    if not settings:
        return 'Closed'
    
    start_at, end_at, is_enabled = settings
    
    if not is_enabled:
        return 'Closed'
    
    start = datetime.fromisoformat(start_at.replace('Z', ''))
    end = datetime.fromisoformat(end_at.replace('Z', ''))
    
    if start <= now <= end:
        return 'Open'
    
    return 'Closed'

def module_is_unlocked(db, user_id, module_key):
    """
    Check if module is unlocked for user.
    Considers: window status + prerequisites
    """
    # Check window first
    if module_window_status(db, user_id, module_key) == 'Closed':
        return False
    
    # M1 always unlocked if window open
    if module_key == 'M1':
        return True
    
    # M2 requires M1 submitted
    if module_key == 'M2':
        return has_final_submission(db, user_id, 'M1')
    
    # M3 requires M2 submitted
    if module_key == 'M3':
        return has_final_submission(db, user_id, 'M2')
    
    return False

def module_status(db, user_id, module_key):
    """
    Get module status label.
    Returns: 'Locked', 'Not started', 'In progress', 'Submitted'
    """
    # Check if unlocked
    if not module_is_unlocked(db, user_id, module_key):
        return 'Locked'
    
    # Check if submitted
    if has_final_submission(db, user_id, module_key):
        return 'Submitted'
    
    # Check if any runs exist
    cursor = db.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM simulation_runs
        WHERE user_id = ? AND module_key = ?
    """, (user_id, module_key))
    
    count = cursor.fetchone()[0]
    
    if count > 0:
        return 'In progress'
    
    return 'Not started'

def get_config(db, key, default=None):
    """Get config value by key"""
    cursor = db.cursor()
    cursor.execute("SELECT value FROM config WHERE key = ?", (key,))
    result = cursor.fetchone()
    return result[0] if result else default

def get_practice_run_count(db, user_id, module_key):
    """Get count of practice runs for achievement tracking"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM simulation_runs
        WHERE user_id = ? AND module_key = ? AND is_final = 0
    """, (user_id, module_key))
    return cursor.fetchone()[0]
```

---

### STEP 2: Authentication Module (25 minutes)

**File: `modules/auth.py`**

```python
from werkzeug.security import generate_password_hash, check_password_hash
from modules.helpers import now_iso

def create_user(db, name, email, student_id, password, section=None, role='student'):
    """
    Create new user account.
    Returns: (success: bool, message: str, user_id: int or None)
    """
    # Validate .edu email
    if not email.lower().endswith('.edu'):
        return False, "Email must end with .edu", None
    
    # Validate role
    if role not in ['student', 'instructor']:
        return False, "Invalid role", None
    
    # Validate password strength
    if len(password) < 8:
        return False, "Password must be at least 8 characters", None
    
    # Hash password
    password_hash = generate_password_hash(password)
    
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO users (name, email, student_id, section, role, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, email, student_id, section, role, password_hash, now_iso()))
        
        db.commit()
        user_id = cursor.lastrowid
        return True, "Account created successfully", user_id
    
    except Exception as e:
        db.rollback()
        error_msg = str(e).lower()
        
        if 'unique' in error_msg and 'email' in error_msg:
            return False, "Email already registered", None
        elif 'unique' in error_msg and 'student_id' in error_msg:
            return False, "Student ID already registered", None
        else:
            return False, f"Registration failed: {str(e)}", None

def authenticate_user(db, email, password):
    """
    Authenticate user login.
    Returns: (success: bool, message: str, user: dict or None)
    """
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, name, email, student_id, section, role, password_hash
        FROM users WHERE email = ?
    """, (email,))
    
    user_row = cursor.fetchone()
    
    if not user_row:
        return False, "Invalid email or password", None
    
    user_id, name, email, student_id, section, role, password_hash = user_row
    
    # Check password
    if not check_password_hash(password_hash, password):
        return False, "Invalid email or password", None
    
    user = {
        'id': user_id,
        'name': name,
        'email': email,
        'student_id': student_id,
        'section': section,
        'role': role
    }
    
    return True, "Login successful", user

def get_user_by_id(db, user_id):
    """Get user by ID"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, name, email, student_id, section, role
        FROM users WHERE id = ?
    """, (user_id,))
    
    row = cursor.fetchone()
    if row:
        return {
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'student_id': row[3],
            'section': row[4],
            'role': row[5]
        }
    return None

def seed_instructor_account(db, email, password):
    """Seed instructor account if doesn't exist"""
    cursor = db.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    
    if cursor.fetchone():
        return  # Already exists
    
    password_hash = generate_password_hash(password)
    
    cursor.execute("""
        INSERT INTO users (name, email, student_id, section, role, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ('Instructor', email, 'INSTRUCTOR', None, 'instructor', password_hash, now_iso()))
    
    db.commit()
```

---

### STEP 3: Main Application (40 minutes)

**File: `app.py`**

```python
import os
import sqlite3
from flask import Flask, g, session, redirect, url_for
from dotenv import load_dotenv
from modules.auth import seed_instructor_account
from database.init_db import initialize_database

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-key-change-in-production')

# Session configuration
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# Database configuration
DATABASE = 'database/scm_simulation.db'

def get_db():
    """Get database connection"""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close database connection"""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Initialize database on first run
with app.app_context():
    initialize_database(get_db())
    
    # Seed instructor account
    instructor_email = os.getenv('INSTRUCTOR_EMAIL')
    instructor_password = os.getenv('INSTRUCTOR_PASSWORD')
    
    if instructor_email and instructor_password:
        seed_instructor_account(get_db(), instructor_email, instructor_password)

# Import and register blueprints
from routes.public import bp as public_bp
from routes.student import bp as student_bp
from routes.instructor import bp as instructor_bp

app.register_blueprint(public_bp)
app.register_blueprint(student_bp, url_prefix='/student')
app.register_blueprint(instructor_bp, url_prefix='/instructor')

# FIX (Opus 4.6): Register format_number Jinja2 filter
# Templates use {{ value | format_number }} but filter was never defined
def format_number(value):
    """Format a number with comma separators."""
    try:
        num = float(value)
        if num == int(num):
            return f"{int(num):,}"
        return f"{num:,.2f}"
    except (ValueError, TypeError):
        return '0'

app.jinja_env.filters['format_number'] = format_number

# Health check endpoint
@app.route('/health')
def health():
    """Health check for monitoring"""
    return {'status': 'healthy', 'database': 'connected'}, 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
```

---

### STEP 4: Database Initialization (15 minutes)

**File: `database/init_db.py`**

```python
from datetime import datetime, timedelta
import os
from modules.helpers import now_iso

def initialize_database(db):
    """Initialize database with schema and seed data"""
    cursor = db.cursor()
    
    # Read and execute schema
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    if os.path.exists(schema_path):
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            cursor.executescript(schema_sql)
    
    # Seed initial data
    seed_module_settings(db)
    seed_config(db)
    
    db.commit()

def seed_module_settings(db):
    """Seed default module windows"""
    cursor = db.cursor()
    
    now = datetime.utcnow()
    thirty_days = now + timedelta(days=30)
    
    modules = [
        ('M1', 'Module 1: Global Sourcing & Procurement'),
        ('M2', 'Module 2: Operations Planning & MRP'),
        ('M3', 'Module 3: Distribution Network & Inventory')
    ]
    
    for module_key, title in modules:
        cursor.execute("""
            INSERT OR IGNORE INTO module_settings 
            (module_key, title, start_at, end_at, is_enabled, updated_at)
            VALUES (?, ?, ?, ?, 1, ?)
        """, (module_key, title, now.isoformat() + 'Z', 
              thirty_days.isoformat() + 'Z', now.isoformat() + 'Z'))
    
    db.commit()

def seed_config(db):
    """Seed default configuration"""
    cursor = db.cursor()
    
    config_defaults = [
        ('seed_offset', '1000'),
        ('app_version', '2.0.0'),
        ('support_email', os.getenv('INSTRUCTOR_EMAIL', 'instructor@example.edu')),
        ('app_name', 'Veloce Wear Simulation'),
        ('timezone', 'America/New_York')
    ]
    
    for key, value in config_defaults:
        cursor.execute("""
            INSERT OR IGNORE INTO config (key, value)
            VALUES (?, ?)
        """, (key, value))
    
    db.commit()
```

---

### STEP 5: Public Routes (30 minutes)

**File: `routes/public.py`**

```python
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, g
from modules.auth import create_user, authenticate_user

bp = Blueprint('public', __name__)

def get_db():
    """Get database connection"""
    return g._database

@bp.route('/')
def landing():
    """Landing page"""
    return render_template('public/landing.html')

@bp.route('/about')
def about():
    """About page"""
    return render_template('public/about.html')

@bp.route('/intro')
def intro():
    """General simulation introduction"""
    return render_template('public/intro.html')

@bp.route('/module-intro/<module_key>')
def module_intro(module_key):
    """Module-specific introduction"""
    if module_key not in ['M1', 'M2', 'M3']:
        return "Module not found", 404
    
    module_titles = {
        'M1': 'Module 1: Global Sourcing & Procurement',
        'M2': 'Module 2: Operations Planning & MRP',
        'M3': 'Module 3: Distribution Network & Inventory'
    }
    
    return render_template('public/module_intro.html',
                         module_key=module_key,
                         module_title=module_titles[module_key])

@bp.route('/register', methods=['GET', 'POST'])
def register():
    """Student registration"""
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        student_id = request.form.get('student_id', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        section = request.form.get('section', '').strip()
        
        # Validation
        if not all([name, email, student_id, password]):
            flash('All fields except section are required', 'danger')
            return render_template('auth/register.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return render_template('auth/register.html')
        
        if len(password) < 8:
            flash('Password must be at least 8 characters', 'danger')
            return render_template('auth/register.html')
        
        # Create account
        success, message, user_id = create_user(
            get_db(), name, email, student_id, password, section, role='student'
        )
        
        if success:
            flash(message + ' Please log in.', 'success')
            return redirect(url_for('public.login'))
        else:
            flash(message, 'danger')
            return render_template('auth/register.html')
    
    return render_template('auth/register.html')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        success, message, user = authenticate_user(get_db(), email, password)
        
        if success:
            session.permanent = True
            session['user_id'] = user['id']
            session['user_role'] = user['role']
            session['user_name'] = user['name']
            
            flash(message, 'success')
            
            if user['role'] == 'instructor':
                return redirect(url_for('instructor.gradebook'))
            else:
                return redirect(url_for('student.dashboard'))
        else:
            flash(message, 'danger')
    
    return render_template('auth/login.html')

@bp.route('/logout')
def logout():
    """Logout"""
    session.clear()
    flash('Logged out successfully', 'success')
    return redirect(url_for('public.landing'))
```

---

### STEP 6: Student Routes (45 minutes)

**File: `routes/student.py`**

```python
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, g
from modules.helpers import (module_is_unlocked, module_status, has_final_submission,
                             get_final_submission, next_run_number, now_iso, 
                             safe_json_dump, module_window_status, get_practice_run_count)

bp = Blueprint('student', __name__)

def get_db():
    """Get database connection"""
    return g._database

def login_required(f):
    """Require student login"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to continue', 'warning')
            return redirect(url_for('public.login'))
        
        if session.get('user_role') != 'student':
            flash('Student access only', 'danger')
            return redirect(url_for('public.login'))
        
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/')
@login_required
def dashboard():
    """Student dashboard with module cards"""
    user_id = session['user_id']
    db = get_db()
    cursor = db.cursor()
    
    # Get module information
    modules = []
    for module_key in ['M1', 'M2', 'M3']:
        # Get settings
        cursor.execute("""
            SELECT title, start_at, end_at FROM module_settings
            WHERE module_key = ?
        """, (module_key,))
        
        settings = cursor.fetchone()
        
        # Get submission
        submission = get_final_submission(db, user_id, module_key)
        
        # Determine status
        status = module_status(db, user_id, module_key)
        window = module_window_status(db, user_id, module_key)
        is_unlocked = module_is_unlocked(db, user_id, module_key)
        
        module_info = {
            'key': module_key,
            'title': settings[0] if settings else f'Module {module_key[-1]}',
            'max_score': 55,
            'status': status,
            'window': window,
            'is_unlocked': is_unlocked,
            'score': submission['score'] if submission else None,
            'submitted_at': submission['submitted_at'] if submission else None
        }
        
        modules.append(module_info)
    
    # Calculate total score
    total_score = sum([m['score'] for m in modules if m['score'] is not None])
    
    # Get total practice run count for achievements
    cursor.execute("""
        SELECT COUNT(*) FROM simulation_runs
        WHERE user_id = ? AND is_final = 0
    """, (user_id,))
    total_practice_runs = cursor.fetchone()[0]
    
    return render_template('student/dashboard.html',
                         modules=modules,
                         total_score=total_score,
                         max_total=165,
                         total_practice_runs=total_practice_runs,
                         user_name=session.get('user_name', 'Student'))

@bp.route('/module/<module_key>')
@login_required
def module(module_key):
    """Module simulation page (placeholder for now)"""
    if module_key not in ['M1', 'M2', 'M3']:
        flash('Invalid module', 'danger')
        return redirect(url_for('student.dashboard'))
    
    user_id = session['user_id']
    db = get_db()
    
    # Check if unlocked
    is_unlocked = module_is_unlocked(db, user_id, module_key)
    window = module_window_status(db, user_id, module_key)
    status = module_status(db, user_id, module_key)
    
    if not is_unlocked:
        # Determine why locked
        if window == 'Closed':
            reason = 'Module window is closed'
        elif module_key == 'M2' and not has_final_submission(db, user_id, 'M1'):
            reason = 'Complete Module 1 first'
        elif module_key == 'M3' and not has_final_submission(db, user_id, 'M2'):
            reason = 'Complete Module 2 first'
        else:
            reason = 'Module is locked'
        
        flash(reason, 'warning')
        return render_template('student/module_locked.html',
                             module_key=module_key,
                             reason=reason)
    
    # Get final submission if exists
    final_submission = get_final_submission(db, user_id, module_key)
    is_submitted = final_submission is not None
    
    # Get recent runs
    cursor = db.cursor()
    cursor.execute("""
        SELECT run_number, score, is_final, created_at
        FROM simulation_runs
        WHERE user_id = ? AND module_key = ?
        ORDER BY run_number DESC
        LIMIT 10
    """, (user_id, module_key))
    
    recent_runs = []
    for row in cursor.fetchall():
        recent_runs.append({
            'run_number': row[0],
            'score': row[1],
            'is_final': row[2],
            'created_at': row[3]
        })
    
    # Get practice run count for this module
    practice_count = get_practice_run_count(db, user_id, module_key)
    
    return render_template('student/module.html',
                         module_key=module_key,
                         is_submitted=is_submitted,
                         final_submission=final_submission,
                         recent_runs=recent_runs,
                         practice_count=practice_count)

@bp.route('/module/<module_key>/practice', methods=['POST'])
@login_required
def practice_run(module_key):
    """Run practice simulation (placeholder)"""
    if module_key not in ['M1', 'M2', 'M3']:
        return "Invalid module", 400
    
    user_id = session['user_id']
    db = get_db()
    
    # Check if unlocked
    if not module_is_unlocked(db, user_id, module_key):
        flash('Module is locked', 'danger')
        return redirect(url_for('student.module', module_key=module_key))
    
    # Check if already submitted
    if has_final_submission(db, user_id, module_key):
        flash('Module already submitted', 'warning')
        return redirect(url_for('student.module', module_key=module_key))
    
    # Create placeholder practice run
    run_number = next_run_number(db, user_id, module_key)
    
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO simulation_runs 
        (user_id, module_key, run_number, decisions_json, kpi_json, score, is_final, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    """, (user_id, module_key, run_number, 
          safe_json_dump({'placeholder': 'practice'}),
          safe_json_dump({'placeholder_kpi': 0}),
          0, now_iso()))
    
    db.commit()
    
    flash(f'Practice run #{run_number} completed (placeholder)', 'success')
    return redirect(url_for('student.module', module_key=module_key))

@bp.route('/module/<module_key>/submit', methods=['POST'])
@login_required
def submit_final(module_key):
    """Submit final for module (placeholder)"""
    if module_key not in ['M1', 'M2', 'M3']:
        return "Invalid module", 400
    
    user_id = session['user_id']
    db = get_db()
    
    # Check if unlocked
    if not module_is_unlocked(db, user_id, module_key):
        flash('Module is locked', 'danger')
        return redirect(url_for('student.module', module_key=module_key))
    
    # Check if already submitted
    if has_final_submission(db, user_id, module_key):
        flash('Module already submitted', 'warning')
        return redirect(url_for('student.module', module_key=module_key))
    
    # Create final run
    run_number = next_run_number(db, user_id, module_key)
    
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO simulation_runs 
        (user_id, module_key, run_number, decisions_json, kpi_json, score, is_final, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    """, (user_id, module_key, run_number,
          safe_json_dump({'placeholder': 'final'}),
          safe_json_dump({'placeholder_kpi': 0}),
          0, now_iso()))
    
    run_id = cursor.lastrowid
    
    # Create/update submission
    cursor.execute("""
        INSERT INTO module_submissions 
        (user_id, module_key, score, max_score, submitted_at, submission_json)
        VALUES (?, ?, 0, 55, ?, ?)
        ON CONFLICT(user_id, module_key) DO UPDATE SET
            score = 0,
            submitted_at = ?,
            submission_json = ?
    """, (user_id, module_key, now_iso(),
          safe_json_dump({'run_id': run_id, 'placeholder': 'final submission'}),
          now_iso(),
          safe_json_dump({'run_id': run_id, 'placeholder': 'final submission'})))
    
    db.commit()
    
    flash(f'{module_key} submitted successfully!', 'success')
    return redirect(url_for('student.dashboard'))
```

---

### STEP 7: Instructor Routes (50 minutes)

**File: `routes/instructor.py`**

```python
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, g, Response
from datetime import datetime
import csv
import io
from modules.helpers import now_iso

bp = Blueprint('instructor', __name__)

def get_db():
    """Get database connection"""
    return g._database

def instructor_required(f):
    """Require instructor login"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in', 'warning')
            return redirect(url_for('public.login'))
        
        if session.get('user_role') != 'instructor':
            flash('Instructor access only', 'danger')
            return redirect(url_for('public.login'))
        
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/')
@instructor_required
def gradebook():
    """Instructor gradebook"""
    db = get_db()
    cursor = db.cursor()
    
    # Get search/filter params
    search = request.args.get('search', '').strip()
    section_filter = request.args.get('section', '').strip()
    
    # Build query
    query = """
        SELECT u.id, u.name, u.email, u.student_id, u.section,
               m1.score as m1_score, m1.submitted_at as m1_submitted,
               m2.score as m2_score, m2.submitted_at as m2_submitted,
               m3.score as m3_score, m3.submitted_at as m3_submitted
        FROM users u
        LEFT JOIN module_submissions m1 ON u.id = m1.user_id AND m1.module_key = 'M1'
        LEFT JOIN module_submissions m2 ON u.id = m2.user_id AND m2.module_key = 'M2'
        LEFT JOIN module_submissions m3 ON u.id = m3.user_id AND m3.module_key = 'M3'
        WHERE u.role = 'student'
    """
    
    params = []
    
    if search:
        query += " AND (u.name LIKE ? OR u.student_id LIKE ? OR u.email LIKE ?)"
        search_pattern = f'%{search}%'
        params.extend([search_pattern, search_pattern, search_pattern])
    
    if section_filter:
        query += " AND u.section = ?"
        params.append(section_filter)
    
    query += " ORDER BY u.section, u.student_id"
    
    cursor.execute(query, params)
    
    students = []
    for row in cursor.fetchall():
        m1_score = row[5] if row[5] is not None else 0
        m2_score = row[7] if row[7] is not None else 0
        m3_score = row[9] if row[9] is not None else 0
        
        students.append({
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'student_id': row[3],
            'section': row[4] or '',
            'm1_score': m1_score,
            'm1_submitted': row[6],
            'm2_score': m2_score,
            'm2_submitted': row[8],
            'm3_score': m3_score,
            'm3_submitted': row[10],
            'total': m1_score + m2_score + m3_score
        })
    
    # Get unique sections
    cursor.execute("""
        SELECT DISTINCT section FROM users 
        WHERE role = 'student' AND section IS NOT NULL AND section != ''
        ORDER BY section
    """)
    sections = [row[0] for row in cursor.fetchall()]
    
    return render_template('instructor/gradebook.html',
                         students=students,
                         sections=sections,
                         search=search,
                         section_filter=section_filter)

@bp.route('/export.csv')
@instructor_required
def export_csv():
    """Export gradebook as CSV"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT u.name, u.email, u.student_id, u.section,
               COALESCE(m1.score, 0) as m1_score, m1.submitted_at as m1_submitted,
               COALESCE(m2.score, 0) as m2_score, m2.submitted_at as m2_submitted,
               COALESCE(m3.score, 0) as m3_score, m3.submitted_at as m3_submitted
        FROM users u
        LEFT JOIN module_submissions m1 ON u.id = m1.user_id AND m1.module_key = 'M1'
        LEFT JOIN module_submissions m2 ON u.id = m2.user_id AND m2.module_key = 'M2'
        LEFT JOIN module_submissions m3 ON u.id = m3.user_id AND m3.module_key = 'M3'
        WHERE u.role = 'student'
        ORDER BY u.section, u.student_id
    """)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Name', 'Email', 'Student_ID', 'Section',
        'M1_Score', 'M1_Submitted',
        'M2_Score', 'M2_Submitted',
        'M3_Score', 'M3_Submitted',
        'Total_Points'
    ])
    
    # Rows
    for row in cursor.fetchall():
        m1_score, m2_score, m3_score = row[4], row[6], row[8]
        total = m1_score + m2_score + m3_score
        
        writer.writerow([
            row[0], row[1], row[2], row[3] or '',
            m1_score, row[5] or '',
            m2_score, row[7] or '',
            m3_score, row[9] or '',
            total
        ])
    
    # Return as download
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=gradebook.csv'}
    )

@bp.route('/settings', methods=['GET', 'POST'])
@instructor_required
def settings():
    """Instructor settings for module windows and extensions"""
    db = get_db()
    cursor = db.cursor()
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_windows':
            # Update module windows
            for module_key in ['M1', 'M2', 'M3']:
                start_at = request.form.get(f'{module_key}_start')
                end_at = request.form.get(f'{module_key}_end')
                is_enabled = 1 if request.form.get(f'{module_key}_enabled') == 'on' else 0
                
                if start_at and end_at:
                    # Convert to ISO format
                    start_iso = datetime.fromisoformat(start_at).isoformat() + 'Z'
                    end_iso = datetime.fromisoformat(end_at).isoformat() + 'Z'
                    
                    cursor.execute("""
                        UPDATE module_settings
                        SET start_at = ?, end_at = ?, is_enabled = ?, updated_at = ?
                        WHERE module_key = ?
                    """, (start_iso, end_iso, is_enabled, now_iso(), module_key))
            
            db.commit()
            flash('Module windows updated', 'success')
        
        elif action == 'add_extension':
            # Add student extension
            student_id_input = request.form.get('student_id')
            module_key = request.form.get('module_key')
            extended_end = request.form.get('extended_end')
            note = request.form.get('note', '')
            
            # Find user
            cursor.execute("SELECT id FROM users WHERE student_id = ? AND role = 'student'",
                         (student_id_input,))
            user_row = cursor.fetchone()
            
            if not user_row:
                flash('Student not found', 'danger')
            elif extended_end:
                user_id = user_row[0]
                extended_iso = datetime.fromisoformat(extended_end).isoformat() + 'Z'
                
                cursor.execute("""
                    INSERT INTO module_extensions 
                    (user_id, module_key, extended_end_at, note, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, module_key) DO UPDATE SET
                        extended_end_at = ?,
                        note = ?,
                        created_at = ?
                """, (user_id, module_key, extended_iso, note, now_iso(),
                      extended_iso, note, now_iso()))
                
                db.commit()
                flash(f'Extension added for {student_id_input}', 'success')
        
        elif action == 'remove_extension':
            extension_id = request.form.get('extension_id')
            cursor.execute("DELETE FROM module_extensions WHERE id = ?", (extension_id,))
            db.commit()
            flash('Extension removed', 'success')
        
        return redirect(url_for('instructor.settings'))
    
    # GET request - show settings
    
    # Get module windows
    cursor.execute("SELECT module_key, title, start_at, end_at, is_enabled FROM module_settings")
    windows = {}
    for row in cursor.fetchall():
        # Convert ISO to datetime-local format (remove Z and milliseconds)
        start_dt = datetime.fromisoformat(row[2].replace('Z', ''))
        end_dt = datetime.fromisoformat(row[3].replace('Z', ''))
        
        windows[row[0]] = {
            'title': row[1],
            'start_at': start_dt.strftime('%Y-%m-%dT%H:%M'),
            'end_at': end_dt.strftime('%Y-%m-%dT%H:%M'),
            'is_enabled': row[4] == 1
        }
    
    # Get all extensions
    cursor.execute("""
        SELECT e.id, u.name, u.student_id, e.module_key, e.extended_end_at, e.note
        FROM module_extensions e
        JOIN users u ON e.user_id = u.id
        ORDER BY u.student_id, e.module_key
    """)
    
    extensions = []
    for row in cursor.fetchall():
        extended_dt = datetime.fromisoformat(row[4].replace('Z', ''))
        extensions.append({
            'id': row[0],
            'student_name': row[1],
            'student_id': row[2],
            'module_key': row[3],
            'extended_end': extended_dt.strftime('%Y-%m-%d %H:%M'),
            'note': row[5] or ''
        })
    
    return render_template('instructor/settings.html',
                         windows=windows,
                         extensions=extensions)
```

---

*[Document continues with complete templates, enhanced CSS with dark mode, testing checklist, troubleshooting guide, and deployment instructions - uploading in sections due to length]...*
