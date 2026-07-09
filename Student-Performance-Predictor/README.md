# Student Performance Prediction using Machine Learning

A production-ready, real-time Data Science web application that predicts student academic performance using Machine Learning. Built with Flask (backend) and Vanilla JavaScript (frontend), powered by Supabase PostgreSQL.

## Features

### Core Modules
- **Dashboard** - Real-time analytics with charts (performance distribution, prediction trends, attendance analysis, grade distribution, department-wise breakdown)
- **Student Management** - Full CRUD operations with search, pagination, and filtering
- **Predictions** - ML-powered performance prediction with grade, risk, and recommendation
- **Analytics** - Interactive EDA with bar, line, pie, radar charts, correlation matrix, and distribution plots
- **Reports** - Generate PDF reports (student, department, monthly, prediction summary)
- **ML Models** - Train multiple algorithms, compare metrics, auto-select best model
- **Dataset Upload** - CSV validation, missing value handling, preprocessing

### Authentication
- Login, Register, Forgot Password
- Role-based access (Admin / Faculty)
- Session management
- Secure password hashing with bcrypt

### Machine Learning
- **Algorithms**: Linear Regression, Logistic Regression, Decision Tree, Random Forest
- **Metrics**: Accuracy, Precision, Recall, F1 Score, MAE, RMSE, R² Score
- **Preprocessing**: Label Encoding, One-Hot Encoding, Normalization, Standardization, Outlier Detection
- **Model Persistence**: Save/load models using Joblib

### AI Insights
- Attendance impact analysis
- Study hour recommendations
- Risk assessment
- Personalized recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Chart.js, Bootstrap 5, Font Awesome |
| Backend | Python 3.10+, Flask |
| ML/DL | Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, Joblib |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + bcrypt |

## Project Structure

```
Student-Performance-Predictor/
├── frontend/
│   ├── index.html            # Landing page
│   ├── login.html            # Authentication
│   ├── register.html         # Registration
│   ├── dashboard.html        # Main dashboard
│   ├── students.html         # Student management
│   ├── prediction.html       # Prediction & history
│   ├── analytics.html        # Analytics & EDA
│   ├── reports.html          # PDF report generation
│   ├── css/
│   │   ├── style.css         # Main styles
│   │   ├── dashboard.css     # Dashboard-specific
│   │   └── responsive.css    # Responsive design
│   └── js/
│       ├── app.js            # Shared utilities
│       ├── auth.js           # Authentication logic
│       ├── dashboard.js      # Dashboard + ML training
│       ├── students.js       # Student CRUD
│       ├── prediction.js     # Prediction form & history
│       ├── analytics.js      # Charts & stats
│       ├── charts.js         # Chart.js wrappers
│       └── reports.js        # PDF generation
├── backend/
│   ├── app.py                # Flask entry point
│   ├── config.py             # Configuration
│   ├── requirements.txt      # Dependencies
│   ├── model.py              # ML model class
│   ├── train_model.py        # Training script
│   ├── create_sample_data.py # Generate sample data
│   ├── models/               # Saved .pkl models
│   ├── routes/
│   │   ├── auth.py           # Auth endpoints
│   │   ├── students.py       # Student CRUD
│   │   ├── prediction.py     # Prediction endpoints
│   │   ├── analytics.py      # Analytics endpoints
│   │   ├── reports.py        # PDF report generation
│   │   ├── ml.py             # ML training endpoints
│   │   └── dataset.py        # Dataset upload/preprocess
│   ├── services/
│   │   ├── ml_service.py     # ML training & prediction
│   │   ├── preprocessing.py  # Data preprocessing
│   │   └── visualization.py  # Chart generation
│   └── database/
│       └── supabase.py       # Supabase client
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js (optional, for local static serving)
- Supabase account (free tier)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Student-Performance-Predictor
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings > API** and copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_KEY)
   - `service_role` key (SUPABASE_SERVICE_KEY)
4. In the **SQL Editor**, run the SQL from `database/supabase.py` to create tables

### 3. Configure Environment
```bash
cd backend
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SECRET_KEY=your-random-secret-key
FLASK_ENV=development
DEBUG=True
```

### 4. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 5. Generate Sample Data
```bash
python create_sample_data.py
```
This creates `datasets/student_dataset.csv` with 200 sample records.

### 6. Train Initial Model (Optional)
```bash
python train_model.py
```
This trains a Random Forest model and saves it to `models/student_model.pkl`.

### 7. Run the Application
```bash
python app.py
```
The app will be available at `http://localhost:5000`.

### 8. Register & Login
1. Open `http://localhost:5000`
2. Click **Register** and create an account
3. First user can claim admin role
4. Login and start using the application

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Reset password |
| GET | `/api/auth/session` | Get current session |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students (paginated) |
| POST | `/api/students` | Add student |
| GET | `/api/students/:id` | Get student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predictions/predict` | Make prediction |
| GET | `/api/predictions/history` | Prediction history |
| DELETE | `/api/predictions/:id` | Delete prediction |
| GET | `/api/predictions/export` | Export as CSV |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/students` | Student analytics |
| GET | `/api/analytics/department` | Department analytics |
| GET | `/api/analytics/ml` | ML model performance |

### ML Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/train` | Train a model |
| GET | `/api/ml/models` | List trained models |
| PUT | `/api/ml/models/:id/activate` | Activate model |
| DELETE | `/api/ml/models/:id` | Delete model |

### Datasets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dataset/upload` | Upload CSV |
| GET | `/api/dataset/list` | List datasets |
| POST | `/api/dataset/preprocess` | Preprocess data |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/generate` | Generate PDF report |
| GET | `/api/reports/history` | Report history |
| DELETE | `/api/reports/:id` | Delete report |

## Deployment

### Frontend (Vercel)
1. Push the repository to GitHub
2. Import project to Vercel
3. Set build command: (none - static files)
4. Set output directory: `frontend`
5. Add environment variables if needed

### Backend (Render)
1. Create a Web Service on Render
2. Connect your GitHub repository
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. Add environment variables (Supabase credentials)
5. Deploy

## ML Workflow

```
Dataset → Preprocessing → EDA → Feature Selection
    → Train Model (Linear Regression / Decision Tree / Random Forest)
    → Evaluate (Accuracy, Precision, Recall, F1, MAE, RMSE, R²)
    → Select Best Model
    → Save Model (Joblib)
    → Predict Performance
    → Generate Insights & Recommendations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Screenshots

(Add screenshots of the dashboard, prediction module, and analytics here)

---

Built with ❤️ for academic performance analysis and educational data mining.