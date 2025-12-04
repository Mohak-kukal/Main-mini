# System Architecture

## Overview
This is a full-stack AI-powered personal finance management platform with three main components: Frontend (React/TypeScript), Backend (Node.js/Express), and ML Service (Python/FastAPI).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (TypeScript)                             │  │
│  │  - Vite Build Tool                                       │  │
│  │  - React Router for Navigation                           │  │
│  │  - Clerk for Authentication                              │  │
│  │  - Radix UI Components                                   │  │
│  │  - Tailwind CSS for Styling                              │  │
│  │  - Recharts for Data Visualization                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │ (JWT Authentication)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js/Express Backend                                 │  │
│  │  - RESTful API Endpoints                                 │  │
│  │  - JWT Authentication Middleware                          │  │
│  │  - Rate Limiting                                         │  │
│  │  - CORS Configuration                                    │  │
│  │  - File Upload Handling (Multer)                         │  │
│  │  - Background Jobs (Recurring Transactions)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  PostgreSQL DB   │  │  ML Service      │
        │  (via Knex.js)   │  │  (FastAPI)       │
        └──────────────────┘  └──────────────────┘
                                      │
                                      ▼
                          ┌──────────────────────┐
                          │  ML Models & Services│
                          │  - TensorFlow/Keras  │
                          │  - Scikit-learn      │
                          │  - Google Gemini AI  │
                          └──────────────────────┘
```

---

## Component Details

### 1. Frontend Layer

**Technology Stack:**
- **Framework:** React 18.2.0 with TypeScript
- **Build Tool:** Vite 4.5.0
- **Routing:** React Router DOM 6.20.1
- **Authentication:** Clerk (@clerk/clerk-react 5.0.0)
- **UI Components:** Radix UI primitives
- **Styling:** Tailwind CSS 3.3.5
- **Charts:** Recharts 2.8.0
- **State Management:** React Hooks (useState, useEffect, Context API)
- **HTTP Client:** Axios 1.6.2

**Key Features:**
- **Pages:**
  - Home (Landing page)
  - Dashboard (Overview with charts and summaries)
  - Accounts (Account management with recurring transactions)
  - Transactions (Transaction list with filtering and export)
  - Budgets (Budget creation and tracking)
  - Insights (AI-powered financial insights)

- **Components:**
  - Layout with sidebar navigation
  - Theme provider (Light/Dark mode)
  - Protected routes with authentication
  - Reusable UI components (Button, Card, Dialog, Input, Select, etc.)

- **API Communication:**
  - Centralized API client (`lib/api.ts`)
  - Automatic JWT token injection from Clerk
  - Error handling and retry logic
  - Server-Sent Events (SSE) for streaming AI advice

**Port:** 5173 (development)

---

### 2. Backend Layer

**Technology Stack:**
- **Runtime:** Node.js
- **Framework:** Express.js 4.18.2
- **Database ORM:** Knex.js 3.0.1
- **Database:** PostgreSQL 8.11.3
- **Authentication:** Clerk SDK (@clerk/clerk-sdk-node 5.1.6)
- **Security:** Helmet 7.1.0, express-rate-limit 7.1.5
- **File Upload:** Multer 1.4.5
- **PDF Generation:** PDFKit 0.17.2

**API Structure:**
```
/api/auth          - Authentication endpoints
/api/accounts      - Account CRUD operations
/api/transactions  - Transaction management, recurring transactions, export
/api/budgets       - Budget creation and tracking
/api/ai            - AI service integration (proxies to ML service)
/api/health        - Health check endpoint
```

**Key Features:**
- **Authentication:**
  - JWT token validation via Clerk
  - User ID extraction from token
  - Protected route middleware

- **Database Schema:**
  - `users` - User accounts (linked to Clerk)
  - `accounts` - Bank accounts, credit cards, etc.
  - `transactions` - Financial transactions
  - `budgets` - Budget definitions
  - `receipts` - Receipt metadata
  - `predictions` - ML prediction history
  - `category_corrections` - User corrections for ML training
  - `recurring_transactions` - Recurring transaction templates

- **Background Jobs:**
  - Recurring transaction processor (runs on startup and daily)
  - Processes missed recurring transactions automatically

- **File Handling:**
  - Receipt uploads stored in `/uploads` directory
  - Static file serving for uploaded receipts

**Port:** 5000 (default)

---

### 3. ML Service Layer

**Technology Stack:**
- **Framework:** FastAPI 0.104.1
- **Server:** Uvicorn 0.24.0
- **ML Libraries:**
  - TensorFlow 2.15.0 (LSTM for spending prediction)
  - Scikit-learn 1.3.2 (Random Forest for categorization)
  - NLTK 3.8.1 (Natural language processing)
- **AI Services:** Google Generative AI (Gemini) 0.3.2
- **Data Processing:** Pandas 2.1.4, NumPy 1.24.3
- **Image Processing:** Pillow 10.1.0

**Services:**

1. **OCR Service (`ocr_service.py`)**
   - Receipt image processing
   - Text extraction using Google Gemini Vision API
   - Transaction data parsing (merchant, amount, date, items)

2. **Categorization Service (`categorization_service.py`)**
   - Random Forest classifier for transaction categorization
   - TF-IDF vectorization of merchant/description text
   - Model training with user corrections
   - Pre-trained with sample data, retrained with user data

3. **Prediction Service (`prediction_service.py`)**
   - LSTM (Long Short-Term Memory) neural network
   - Spending prediction by category
   - Time series analysis of historical spending
   - Pre-trained with synthetic data, retrained with user data

4. **Advice Service (`advice_service.py`)**
   - AI-powered financial advice generation
   - Uses Google Gemini for natural language generation
   - Analyzes spending patterns, budgets, and predictions
   - Supports streaming responses (Server-Sent Events)

**API Endpoints:**
```
/                    - Service info
/health              - Health check
/ocr/extract         - Extract data from receipt images
/categorize          - Categorize a transaction
/train               - Train categorization model with correction
/predict             - Predict future spending
/advice              - Generate financial advice
/advice/stream       - Stream financial advice (SSE)
```

**Port:** 8000 (default)

**Model Storage:**
- Models stored in `/models` directory:
  - `spend_rnn.h5` - LSTM model for spending prediction
  - `category_rf.pkl` - Random Forest model for categorization
  - `spend_scaler.pkl` - MinMaxScaler for spending data
  - `tfidf_vectorizer.pkl` - TF-IDF vectorizer
  - `label_encoder.pkl` - Category label encoder
  - `categories.pkl` - Category list

---

## Data Flow

### 1. User Authentication Flow
```
User → Frontend (Clerk) → Clerk Authentication Service
  ↓
Frontend receives JWT token
  ↓
Token included in API requests
  ↓
Backend validates token with Clerk SDK
  ↓
User ID extracted and used for data operations
```

### 2. Transaction Creation Flow
```
User uploads receipt/image
  ↓
Frontend → Backend (/api/transactions/upload)
  ↓
Backend → ML Service (/ocr/extract)
  ↓
ML Service processes image with Gemini Vision
  ↓
Extracted data returned to Backend
  ↓
Backend → ML Service (/categorize)
  ↓
ML Service categorizes transaction
  ↓
Transaction saved to database
  ↓
Response sent to Frontend
```

### 3. Spending Prediction Flow
```
User requests insights
  ↓
Frontend → Backend (/api/ai/predict)
  ↓
Backend fetches user's historical spending
  ↓
Backend → ML Service (/predict)
  ↓
ML Service:
  - Loads LSTM model
  - Processes time series data
  - Generates predictions by category
  ↓
Predictions returned to Backend
  ↓
Backend saves predictions to database
  ↓
Response sent to Frontend
```

### 4. AI Advice Generation Flow
```
User requests financial advice
  ↓
Frontend → Backend (/api/ai/advice)
  ↓
Backend collects:
  - Current spending
  - Monthly spending patterns
  - Budgets
  - Predictions
  ↓
Backend → ML Service (/advice/stream)
  ↓
ML Service:
  - Analyzes financial data
  - Uses Gemini AI to generate advice
  - Streams response chunks
  ↓
Frontend receives streamed chunks (SSE)
  ↓
Advice displayed in real-time
```

### 5. Recurring Transaction Processing Flow
```
Background Job (runs daily)
  ↓
Fetches active recurring transactions
  ↓
For each recurring transaction:
  - Checks if already processed this month
  - Calculates target month (next after last_processed)
  - Creates transaction for target month
  - Updates account balance
  - Updates last_processed date
  ↓
All missed months processed in one run
```

---

## Database Schema

### Core Tables

**users**
- `id` (PK)
- `clerk_user_id` (unique, from Clerk)
- `name`
- `email`
- `created_at`, `updated_at`

**accounts**
- `id` (PK)
- `user_id` (FK → users)
- `name`
- `type` (checking, savings, credit_card, etc.)
- `balance`
- `created_at`, `updated_at`

**transactions**
- `id` (PK)
- `user_id` (FK → users)
- `account_id` (FK → accounts)
- `date`
- `amount` (positive for income, negative for expenses)
- `merchant`
- `description`
- `category`
- `is_recurring` (boolean)
- `recurring_transaction_id` (FK → recurring_transactions, nullable)
- `created_at`, `updated_at`

**recurring_transactions**
- `id` (PK)
- `user_id` (FK → users)
- `account_id` (FK → accounts)
- `day_of_month` (1-31)
- `merchant`
- `description`
- `category`
- `amount`
- `is_expense` (boolean)
- `start_date`
- `end_date` (nullable)
- `last_processed` (nullable)
- `is_active` (boolean)
- `created_at`, `updated_at`

**budgets**
- `id` (PK)
- `user_id` (FK → users)
- `category`
- `amount`
- `period` (monthly, yearly)
- `start_date`
- `end_date` (nullable)
- `created_at`, `updated_at`

**receipts**
- `id` (PK)
- `user_id` (FK → users)
- `transaction_id` (FK → transactions, nullable)
- `file_path`
- `created_at`

**predictions**
- `id` (PK)
- `user_id` (FK → users)
- `category`
- `predicted_amount`
- `month`
- `year`
- `created_at`

**category_corrections**
- `id` (PK)
- `user_id` (FK → users)
- `transaction_id` (FK → transactions)
- `original_category`
- `correct_category`
- `created_at`

---

## Security Architecture

### Authentication & Authorization
- **Clerk Integration:** Centralized authentication service
- **JWT Tokens:** Stateless authentication
- **Token Validation:** Backend validates tokens with Clerk SDK
- **User Isolation:** All queries filtered by `user_id`

### API Security
- **Helmet:** Security headers (XSS protection, content security policy)
- **Rate Limiting:** 100 requests per 15 minutes (production), 1000 (development)
- **CORS:** Configured for specific origins
- **Input Validation:** Express-validator for request validation

### Data Security
- **SQL Injection Prevention:** Knex.js parameterized queries
- **File Upload Security:** Multer with file type validation
- **Environment Variables:** Sensitive data stored in `.env` files

---

## Deployment Architecture

### Development Environment
```
Frontend:  http://localhost:5173
Backend:   http://localhost:5000
ML Service: http://localhost:8000
Database:  localhost:5432 (PostgreSQL)
```

### Production Considerations
- **Frontend:** Static build served via CDN or web server (Nginx)
- **Backend:** Node.js process (PM2, Docker, or cloud platform)
- **ML Service:** Python process (Gunicorn/Uvicorn, Docker)
- **Database:** Managed PostgreSQL service (AWS RDS, Azure Database, etc.)
- **File Storage:** Cloud storage (AWS S3, Azure Blob, etc.) for receipts
- **Model Storage:** Persistent volume or cloud storage for ML models

---

## Key Design Patterns

1. **RESTful API Design:** Standard HTTP methods and status codes
2. **Microservices:** Separation of concerns (Backend, ML Service)
3. **Service Layer Pattern:** Business logic separated from routes
4. **Repository Pattern:** Database access abstracted via Knex.js
5. **Middleware Pattern:** Authentication, validation, error handling
6. **Streaming:** Server-Sent Events for real-time AI advice
7. **Background Jobs:** Scheduled tasks for recurring transactions

---

## Technology Versions

### Frontend
- React: 18.2.0
- TypeScript: 5.2.2
- Vite: 4.5.0
- Tailwind CSS: 3.3.5

### Backend
- Node.js: (latest LTS)
- Express: 4.18.2
- Knex.js: 3.0.1
- PostgreSQL: 8.11.3

### ML Service
- Python: 3.11
- FastAPI: 0.104.1
- TensorFlow: 2.15.0
- Scikit-learn: 1.3.2

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/finance_db
CLERK_SECRET_KEY=sk_test_...
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)
```
ML_SERVICE_PORT=8000
GOOGLE_API_KEY=...
MODEL_PATH=../models
UPLOAD_DIR=uploads
```

---

## Future Enhancements

1. **Real-time Updates:** WebSocket support for live transaction updates
2. **Mobile App:** React Native or Flutter mobile application
3. **Advanced Analytics:** More sophisticated ML models for fraud detection
4. **Multi-currency Support:** International transaction handling
5. **Bank Integration:** Direct bank API connections (Plaid, Yodlee)
6. **Collaborative Budgets:** Shared budgets for families/groups
7. **Export Formats:** Additional export formats (Excel, JSON)
8. **Caching Layer:** Redis for improved performance
9. **Message Queue:** RabbitMQ/Kafka for async job processing
10. **Monitoring:** Application performance monitoring (APM) tools

---

## Dependencies Overview

### Frontend Dependencies
- **UI Framework:** React, React Router
- **Authentication:** Clerk
- **UI Components:** Radix UI
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **HTTP:** Axios

### Backend Dependencies
- **Web Framework:** Express
- **Database:** Knex.js, PostgreSQL driver
- **Authentication:** Clerk SDK
- **Security:** Helmet, express-rate-limit
- **File Handling:** Multer
- **PDF:** PDFKit

### ML Service Dependencies
- **Web Framework:** FastAPI
- **ML:** TensorFlow, Scikit-learn
- **AI:** Google Generative AI
- **NLP:** NLTK
- **Data:** Pandas, NumPy
- **Image:** Pillow

---

This architecture provides a scalable, maintainable, and secure foundation for the AI-powered finance management platform.

