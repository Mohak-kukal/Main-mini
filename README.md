# AI Finance Platform

An intelligent personal finance management platform powered by AI and machine learning. Track expenses, predict spending, categorize transactions automatically, and receive personalized financial advice.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)

## 🚀 Features

### Core Functionality
- **Transaction Management**: Add, edit, delete, and export transactions (CSV/PDF)
- **Account Management**: Create and manage multiple accounts (checking, savings, credit, investment)
- **Recurring Transactions**: Automatically create transactions monthly on specified days
- **Budget Tracking**: Set budgets by category and monitor spending progress
- **Receipt OCR**: Upload receipt images to automatically extract transaction data
- **Currency Conversion**: Automatically converts foreign currencies to INR

### AI/ML Capabilities
- **Smart Categorization**: Automatic transaction categorization using Random Forest + NLP
- **Spending Predictions**: LSTM neural network forecasts future spending by category
- **Financial Insights**: Visual analytics with charts and spending trends
- **AI Financial Advice**: Personalized recommendations using Gemini LLM
- **Model Learning**: Continuously improves categorization with user corrections

### User Experience
- **Dark/Light Mode**: Theme switching with system preference detection
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live data refresh and streaming AI responses
- **Modern UI**: Built with Radix UI components and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Recharts** for data visualization
- **Clerk** for authentication
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Knex.js** for database migrations and queries
- **JWT** for authentication
- **Multer** for file uploads
- **PDFKit** for PDF generation

### ML Service
- **Python 3.11** with FastAPI
- **TensorFlow/Keras** for LSTM models
- **scikit-learn** for Random Forest and preprocessing
- **NLTK** for NLP text processing
- **Google Gemini API** for OCR and LLM advice
- **Pillow** for image processing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.11 recommended, v3.10+ works)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Git**

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Mohak-kukal/Main-mini.git
cd Main-mini
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/finance_ai
DATABASE_PASSWORD=your_postgres_password
CLERK_SECRET_KEY=your_clerk_secret_key
ML_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret_key
```

Run database migrations:

```bash
npm run migrate
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. ML Service Setup

```bash
cd mlservice
```

Create a virtual environment (Windows):

```bash
py -3.11 -m venv venv311
venv311\Scripts\Activate.ps1
```

Or on Linux/Mac:

```bash
python3.11 -m venv venv311
source venv311/bin/activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create a `.env` file in the `mlservice` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
ML_SERVICE_PORT=8000
MODEL_PATH=../models
UPLOAD_DIR=uploads
```

Start the ML service:

```bash
python main.py
```

The ML service will run on `http://localhost:8000`

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🗄️ Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE finance_ai;
```

2. Update the `DATABASE_URL` in `backend/.env` with your PostgreSQL credentials

3. Run migrations from the `backend` directory:

```bash
npm run migrate
```

## 📁 Project Structure

```
Main-mini/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # API client and utilities
│   │   └── types/        # TypeScript type definitions
│   └── public/           # Static assets
├── backend/              # Node.js backend API
│   ├── routes/           # API route handlers
│   ├── middleware/      # Authentication and validation
│   ├── jobs/             # Background jobs (recurring transactions)
│   ├── migrations/       # Database migrations
│   └── config/           # Configuration files
├── mlservice/            # Python ML service
│   ├── ocr_service.py           # Receipt OCR processing
│   ├── categorization_service.py # Transaction categorization
│   ├── prediction_service.py    # Spending predictions
│   └── advice_service.py         # Financial advice generation
└── models/               # Pre-trained ML models
    ├── category_rf.pkl          # Random Forest classifier
    ├── spend_rnn.h5            # LSTM neural network
    ├── tfidf_vectorizer.pkl     # TF-IDF vectorizer
    ├── label_encoder.pkl        # Category encoder
    └── spend_scaler.pkl         # Data scaler
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/uploadReceipt` - Upload receipt for OCR
- `GET /api/transactions/export` - Export transactions (CSV/PDF)
- `POST /api/transactions/process-recurring` - Process recurring transactions
- `GET /api/transactions/recurring` - Get recurring transactions
- `PUT /api/transactions/recurring/:id` - Update recurring transaction
- `DELETE /api/transactions/recurring/:id` - Delete recurring transaction

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/analysis` - Get budget analysis

### AI Services
- `POST /api/ai/categorize` - Categorize transaction
- `POST /api/ai/train` - Retrain categorization model
- `GET /api/ai/predict` - Get spending predictions
- `POST /api/ai/advice/stream` - Get streaming financial advice
- `GET /api/ai/insights` - Get spending insights

## 🤖 ML Models

The platform uses pre-trained machine learning models:

1. **Random Forest Classifier** (`category_rf.pkl`)
   - Categorizes transactions into expense categories
   - Uses TF-IDF features from merchant/description text
   - Continuously improves with user corrections

2. **LSTM Neural Network** (`spend_rnn.h5`)
   - Predicts future spending by category
   - Uses 12 months of historical data
   - Generates forecasts for next 3-6 months

3. **TF-IDF Vectorizer** (`tfidf_vectorizer.pkl`)
   - Converts transaction text to numerical features
   - Extracts top 1000 most important terms

4. **Label Encoder** (`label_encoder.pkl`)
   - Maps category names to integers for ML processing

5. **MinMax Scaler** (`spend_scaler.pkl`)
   - Normalizes spending amounts for neural network training

## 🔐 Authentication

The platform uses **Clerk** for authentication. To set up:

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key**
4. Add them to your `.env` files (frontend and backend)

## 🚦 Running the Application

1. **Start PostgreSQL** (ensure it's running)

2. **Start the Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

3. **Start the ML Service** (Terminal 2):
```bash
cd mlservice
venv311\Scripts\Activate.ps1  # Windows
# or
source venv311/bin/activate   # Linux/Mac
python main.py
```

4. **Start the Frontend** (Terminal 3):
```bash
cd frontend
npm run dev
```

5. **Open your browser** and navigate to `http://localhost:5173`

## 📊 Features in Detail

### Recurring Transactions
- Create templates for monthly recurring expenses/income
- Automatically processes on specified day of month
- Handles missed months and processes all at once
- Can be activated/deactivated without deletion

### Receipt OCR
- Upload receipt images (JPEG, PNG) or PDF files
- Extracts merchant, amount, date, and items
- Automatically detects currency and converts to INR
- Auto-fills transaction form with extracted data

### Budget Management
- Set budgets by category or monthly total
- Track spending progress with visual indicators
- Get alerts when approaching or exceeding budgets
- View detailed budget analysis

### Spending Predictions
- Uses LSTM neural network for time-series forecasting
- Predicts spending by category for future months
- Based on 12 months of historical data
- Helps with financial planning

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Documentation

- [Project Summary](./PROJECT_SUMMARY.md) - Detailed overview of all features
- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Technical architecture documentation
- [Architecture Prompt](./ARCHITECTURE_PROMPT.md) - High-level system flow

## 🐛 Troubleshooting

### Common Issues

**PostgreSQL Connection Error**
- Ensure PostgreSQL is running
- Verify database credentials in `backend/.env`
- Check if database `finance_ai` exists

**ML Service Not Starting**
- Ensure Python 3.11 is installed
- Activate virtual environment before running
- Check if all dependencies are installed: `pip install -r requirements.txt`
- Verify `GEMINI_API_KEY` is set in `mlservice/.env`

**Frontend Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if all environment variables are set in `frontend/.env`

**Port Already in Use**
- Change ports in respective `.env` files
- Or stop processes using ports 5000, 8000, or 5173

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using AI and modern web technologies**

