# Finance Platform - Project Summary

## Overview
An AI-powered personal finance management platform that helps users track expenses, predict spending, and receive personalized financial advice. Built with React frontend, Node.js backend, and Python ML services.

---

## Core Functions

### 1. **Transaction Management**
- **Add Transactions**: Manual entry or upload receipt images
- **Edit/Delete**: Modify or remove transactions
- **Recurring Transactions**: Automatically create transactions monthly on specified day
- **Export**: Download transactions as CSV or PDF
- **Categories**: Auto-categorize using AI or manual selection

### 2. **Account Management**
- **Create Accounts**: Checking, savings, credit, investment accounts
- **Track Balances**: Real-time balance updates
- **Recurring Transaction Management**: View, edit, activate/deactivate recurring transactions per account

### 3. **Receipt Processing (OCR)**
- **Upload Receipts**: Images (JPEG, PNG) or PDF files
- **Extract Data**: Merchant name, amount, date, items using Gemini Vision API
- **Currency Conversion**: Automatically converts foreign currencies to INR
- **Auto-fill Form**: Populates transaction form with extracted data

### 4. **AI Categorization**
- **Random Forest Classifier**: Predicts transaction category
- **NLP Processing**: Uses TF-IDF vectorization on merchant/description text
- **Text Preprocessing**: Tokenization, stopword removal, lemmatization (NLTK)
- **Learning**: Retrains model when users correct categories

### 5. **Spending Predictions**
- **LSTM Neural Network**: Forecasts future spending by category
- **Time Series Analysis**: Uses 12 months of historical data
- **Category-wise Predictions**: Separate forecasts for each expense category
- **Monthly Forecasts**: Predicts next 3-6 months of spending

### 6. **Budget Management**
- **Create Budgets**: Set spending limits by category
- **Track Progress**: Monitor budget vs actual spending
- **Budget Analysis**: Visual breakdown of budget performance
- **Alerts**: Warnings when approaching or exceeding budgets

### 7. **Financial Insights**
- **Dashboard Analytics**: Spending trends, category breakdowns, account summaries
- **Charts**: Pie charts, line graphs, bar charts for visual analysis
- **Monthly Comparisons**: Compare spending across different months
- **Top Categories**: Identify highest spending categories

### 8. **AI Financial Advice**
- **Gemini LLM Integration**: Generates personalized financial recommendations
- **Context-Aware**: Analyzes spending patterns, budgets, and predictions
- **Streaming Responses**: Real-time advice generation (Server-Sent Events)
- **Actionable Tips**: Specific suggestions based on user's financial data

---

## Technical Architecture

### Frontend (React + TypeScript)
- **Pages**: Dashboard, Transactions, Accounts, Budgets, Insights, Home
- **Components**: Reusable UI components (Radix UI + Tailwind CSS)
- **State Management**: React hooks, Context API
- **Authentication**: Clerk integration
- **API Client**: Centralized API communication with JWT tokens

### Backend (Node.js + Express)
- **API Routes**: `/api/auth`, `/api/accounts`, `/api/transactions`, `/api/budgets`, `/api/ai`
- **Database**: PostgreSQL with Knex.js ORM
- **Authentication**: Clerk SDK for JWT validation
- **Background Jobs**: Recurring transaction processor (runs daily)
- **File Handling**: Multer for receipt uploads, PDF generation

### ML Service (Python + FastAPI)
- **OCR Service**: Receipt image processing with Gemini Vision
- **Categorization Service**: Random Forest + NLP for transaction categorization
- **Prediction Service**: LSTM model for spending forecasts
- **Advice Service**: Gemini LLM for financial advice generation

---

## Key Features

### AI/ML Capabilities
1. **Receipt OCR**: Extracts transaction data from images using Gemini Vision
2. **Smart Categorization**: Random Forest + TF-IDF for automatic category assignment
3. **Spending Predictions**: LSTM neural network forecasts future expenses
4. **Financial Advice**: Gemini LLM provides personalized recommendations

### Automation
- **Recurring Transactions**: Auto-creates transactions monthly
- **Background Processing**: Daily job processes missed recurring transactions
- **Model Retraining**: Automatically improves categorization with user corrections

### User Experience
- **Dark/Light Mode**: Theme switching with system preference detection
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live data refresh and streaming AI responses
- **Export Options**: CSV and PDF export for transactions

---

## Database Schema

### Main Tables
- **users**: User accounts (linked to Clerk)
- **accounts**: Bank accounts, credit cards, etc.
- **transactions**: Financial transactions (expenses/income)
- **recurring_transactions**: Templates for recurring transactions
- **budgets**: Budget definitions by category
- **receipts**: Receipt metadata and file paths
- **predictions**: ML prediction history
- **category_corrections**: User corrections for ML training

---

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/uploadReceipt` - Upload receipt for OCR
- `POST /api/transactions/process-recurring` - Process recurring transactions
- `GET /api/transactions/recurring` - Get recurring transactions
- `PUT /api/transactions/recurring/:id` - Update recurring transaction
- `DELETE /api/transactions/recurring/:id` - Delete recurring transaction
- `GET /api/transactions/export` - Export transactions (CSV/PDF)

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
- `POST /api/ai/advice` - Get financial advice
- `GET /api/ai/insights` - Get spending insights

---

## ML Models

### Pre-trained Models

#### 1. **category_rf.pkl** - Random Forest Classifier
- **Purpose**: Categorizes transactions into expense categories (food, transportation, shopping, etc.)
- **Algorithm**: Random Forest (ensemble of 100 decision trees)
- **Input Features**: 
  - TF-IDF vectors from merchant/description text (1000 features)
  - Transaction amount (normalized)
- **Output**: Category prediction with confidence score
- **Pre-training**: Initialized with sample transaction data covering all 10 categories
- **How it works**: 
  - Combines predictions from multiple decision trees
  - Each tree votes on the category
  - Final category is the majority vote
  - More robust and accurate than single decision tree
- **File Format**: Pickle (.pkl) - Python object serialization

#### 2. **spend_rnn.h5** - LSTM Neural Network
- **Purpose**: Predicts future spending amounts by category for next 3-6 months
- **Algorithm**: LSTM (Long Short-Term Memory) - a type of Recurrent Neural Network
- **Architecture**: 
  - Input layer: 12 months of historical spending data
  - LSTM layers: Process sequential time series data
  - Dense layers: Output predictions
  - Dropout layers: Prevent overfitting
- **Input**: Time series of monthly spending by category (12 months)
- **Output**: Predicted spending amounts for each category for future months
- **Pre-training**: Initialized with 24 months of synthetic spending data with realistic patterns
- **How it works**:
  - LSTM remembers patterns from previous months
  - Learns seasonal trends and spending habits
  - Processes sequences to understand temporal dependencies
  - Generates forecasts based on learned patterns
- **File Format**: HDF5 (.h5) - TensorFlow/Keras model format

#### 3. **tfidf_vectorizer.pkl** - TF-IDF Vectorizer
- **Purpose**: Converts transaction text (merchant name, description) into numerical features
- **Algorithm**: TF-IDF (Term Frequency-Inverse Document Frequency)
- **What it does**:
  - **TF (Term Frequency)**: How often a word appears in a transaction
  - **IDF (Inverse Document Frequency)**: How rare/common a word is across all transactions
  - **TF-IDF Score**: Higher for words that are frequent in a transaction but rare overall (more distinctive)
- **Features**: Extracts top 1000 most important words/terms
- **Preprocessing**: 
  - Removes stopwords (common words like "the", "a", "is")
  - Converts text to lowercase
  - Handles tokenization
- **Example**: 
  - "Starbucks Coffee" → [0.8, 0.0, 0.3, ...] (1000-dimensional vector)
  - "McDonald's Restaurant" → [0.0, 0.7, 0.2, ...] (different vector)
- **Why needed**: Machine learning models need numbers, not text. TF-IDF converts text to meaningful numerical representations
- **File Format**: Pickle (.pkl) - Stores the fitted vectorizer with vocabulary

#### 4. **label_encoder.pkl** - Category Label Encoder
- **Purpose**: Converts category names (strings) to numbers and vice versa
- **Algorithm**: Label Encoding (scikit-learn)
- **What it does**:
  - Maps category names to integers: "food" → 0, "transportation" → 1, etc.
  - Enables reverse mapping: 0 → "food", 1 → "transportation"
- **Categories**: 10 categories (food, transportation, shopping, entertainment, utilities, healthcare, education, travel, insurance, other)
- **Why needed**: 
  - ML models work with numbers, not strings
  - Random Forest needs integer labels for training
  - Converts predictions back to readable category names
- **Example**:
  - Training: "food" → 0, "shopping" → 2
  - Prediction: Model outputs 0 → Decoder converts to "food"
- **File Format**: Pickle (.pkl) - Stores the mapping dictionary

#### 5. **spend_scaler.pkl** - MinMaxScaler
- **Purpose**: Normalizes spending amounts to a standard range (0 to 1)
- **Algorithm**: Min-Max Scaling (scikit-learn)
- **Formula**: `scaled_value = (value - min) / (max - min)`
- **What it does**:
  - Transforms spending amounts from original scale (e.g., 0-10000 INR) to 0-1 range
  - Preserves the relative relationships between values
- **Why needed**:
  - Neural networks (LSTM) train better with normalized data
  - Prevents large numbers from dominating the model
  - Speeds up training and improves accuracy
  - Ensures all features are on the same scale
- **Example**:
  - Original: [100, 500, 1000, 5000]
  - Scaled: [0.0, 0.08, 0.18, 1.0]
  - Reverse: Scaled predictions converted back to original INR amounts
- **File Format**: Pickle (.pkl) - Stores min/max values for inverse transformation

### Model Training Process

#### Initial Training
- **Random Forest**: Trained on sample transaction data with known categories
  - Includes examples like: "McDonald's" → food, "Uber" → transportation
  - Creates initial decision trees for categorization
- **LSTM**: Trained on 24 months of synthetic spending data
  - Simulates realistic spending patterns with seasonal variations
  - Learns to recognize trends and predict future spending

#### Continuous Learning
- **User Corrections**: When users correct a category, the correction is saved
- **Retraining**: Random Forest model retrains periodically with:
  - Original sample data
  - User corrections (category_corrections table)
  - Improves accuracy over time with real user data
- **Model Updates**: Updated models are saved back to .pkl/.h5 files
- **No Manual Intervention**: Training happens automatically in the background

### Model Workflow

#### Categorization Workflow
1. User enters transaction: "Starbucks Coffee - $5.50"
2. Text preprocessing: "starbucks coffee" (lowercase, cleaned)
3. TF-IDF vectorization: Converts to numerical vector
4. Random Forest prediction: Processes vector + amount
5. Label decoder: Converts number to category name ("food")
6. Returns: Category with confidence score

#### Prediction Workflow
1. System fetches 12 months of historical spending
2. Data normalization: MinMaxScaler converts amounts to 0-1 range
3. LSTM processing: Model analyzes time series patterns
4. Prediction generation: Forecasts next 3-6 months by category
5. Reverse scaling: Converts predictions back to INR amounts
6. Returns: Monthly predictions for each category

---

## Technologies Used

### Frontend
- React 18, TypeScript, Vite
- Tailwind CSS, Radix UI
- React Router DOM, Recharts
- Clerk (authentication)

### Backend
- Node.js, Express.js
- PostgreSQL, Knex.js
- Clerk SDK, Multer, PDFKit
- Axios, express-validator

### ML Service
- Python, FastAPI, Uvicorn
- TensorFlow/Keras (LSTM)
- Scikit-learn (Random Forest)
- NLTK (NLP)
- Google Generative AI (Gemini)
- Pandas, NumPy, Joblib

---

## Key Workflows

### Transaction Creation Flow
1. User uploads receipt or enters transaction manually
2. OCR extracts data (if receipt uploaded)
3. AI categorizes transaction
4. Transaction saved to database
5. Account balance updated

### Recurring Transaction Flow
1. User creates transaction with "recurring" flag
2. Recurring template saved to database
3. Background job runs daily
4. Checks for missed months since last processed
5. Creates transactions for all missed months
6. Updates last_processed date

### Prediction Flow
1. User requests insights
2. Backend fetches historical spending (12 months)
3. ML service processes time series data
4. LSTM model generates predictions by category
5. Predictions saved and returned to frontend

### Advice Generation Flow
1. User requests financial advice
2. Backend collects: spending, budgets, predictions
3. Data sent to ML service
4. Gemini LLM analyzes and generates advice
5. Advice streamed back to frontend in real-time

