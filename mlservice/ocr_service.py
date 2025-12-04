import google.generativeai as genai
import os
import json
import re
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
import aiofiles
import aiohttp

class OCRService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        # Dynamically detect an available vision-capable model that supports generateContent
        self.model_names = self._detect_vision_models()
        if not self.model_names:
            # Reasonable fallbacks
            self.model_names = [
                "gemini-1.5-flash",
                "gemini-1.5-flash-latest",
                "gemini-1.0-pro-vision",
            ]
        print(f"[OCR] Model candidates: {self.model_names}")

    def _detect_vision_models(self):
        try:
            models = genai.list_models()
            names = []
            for m in models:
                # Some SDKs expose 'name' like 'models/gemini-1.5-flash', normalize it
                name = getattr(m, 'name', '') or ''
                if name.startswith('models/'):
                    name = name.split('models/')[-1]
                methods = set(getattr(m, 'supported_generation_methods', []) or [])
                if ('generateContent' in methods) and (
                    'vision' in name or 'flash' in name or 'pro-vision' in name
                ):
                    names.append(name)
            # Prefer 1.5 flash variants first
            names.sort(key=lambda n: (
                0 if '1.5' in n and 'flash' in n else 1,
                0 if 'flash' in n else 1,
                n
            ))
            return names
        except Exception:
            return []
        
    async def extract_receipt_data(self, file: Any) -> Dict[str, Any]:
        """Extract structured data from receipt image using Gemini Vision API"""
        try:
            # Persist upload to disk so the SDK can read by path
            upload_dir = Path(os.getenv("UPLOAD_DIR", "uploads"))
            upload_dir.mkdir(parents=True, exist_ok=True)
            suffix = Path(file.filename).suffix or ".jpg"
            safe_name = f"receipt_{int(datetime.now().timestamp())}{suffix}"
            save_path = upload_dir / safe_name

            async with aiofiles.open(save_path, 'wb') as out:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    await out.write(chunk)

            # Prepare image/file part for Gemini (compat with older SDKs without upload_file)
            ext = save_path.suffix.lower()
            mime = 'image/png'
            if ext in ['.jpg', '.jpeg']:
                mime = 'image/jpeg'
            elif ext == '.pdf':
                mime = 'application/pdf'

            with open(save_path, 'rb') as f:
                file_bytes = f.read()
            image_part = {"mime_type": mime, "data": file_bytes}
            
            # Create prompt for receipt extraction
            prompt = """
            Analyze this receipt image and extract the following information in JSON format ONLY (no prose, no markdown):
            {
                "merchant": "store/company name",
                "date": "YYYY-MM-DD",
                "total_amount": "total amount as number (without currency symbol)",
                "currency": "currency code (USD, EUR, GBP, INR, etc.) or symbol ($, €, £, ₹, etc.)",
                "items": [
                    {
                        "description": "item description",
                        "amount": "item amount as number (without currency symbol)"
                    }
                ],
                "category": "likely expense category (food, transportation, shopping, entertainment, etc.)",
                "confidence": "confidence score 0-1"
            }
            
            Rules:
            - Extract merchant name from header/top of receipt
            - Extract date in YYYY-MM-DD format (convert if printed as MM/DD/YYYY or DD-MM-YYYY)
            - Extract total amount as a number (remove currency symbols)
            - IMPORTANT: Detect and extract the currency code or symbol (USD, EUR, GBP, INR, $, €, £, ₹, etc.)
            - List main items purchased
            - Suggest appropriate category based on merchant and items
            - Return only valid JSON, no additional text
            """
            
            # Generate content with fallback across known model names
            response = None
            last_err = None
            for name in self.model_names:
                try:
                    model = genai.GenerativeModel(name)
                    response = model.generate_content([prompt, image_part])
                    if response and getattr(response, 'text', None):
                        break
                except Exception as e:
                    last_err = e
                    continue
            if response is None:
                raise RuntimeError(str(last_err) if last_err else "OCR model generation failed")
            
            # Parse JSON response
            try:
                # Clean the response text
                response_text = response.text.strip()
                
                # Remove any markdown formatting
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                
                extracted_data = json.loads(response_text)
                
                # Validate and clean the data
                cleaned_data = self._clean_extracted_data(extracted_data)
                
                # Convert currency to INR if needed
                if "currency" in cleaned_data and "total_amount" in cleaned_data:
                    currency = cleaned_data.get("currency", "INR")
                    original_amount = cleaned_data.get("total_amount", 0.0)
                    
                    # Convert to INR (async call)
                    converted_amount = await self._convert_to_inr(original_amount, currency)
                    
                    cleaned_data["total_amount"] = round(converted_amount, 2)
                    cleaned_data["original_amount"] = original_amount
                    cleaned_data["original_currency"] = currency
                    cleaned_data["converted_to_inr"] = currency.upper() != "INR"
                
                return {
                    "success": True,
                    "data": cleaned_data,
                    "raw_response": response.text
                }
                
            except json.JSONDecodeError as e:
                # If JSON parsing fails, try to extract data using regex
                cleaned_data = self._extract_with_regex(response.text)
                
                # Try to convert currency if detected
                if "currency" in cleaned_data and "total_amount" in cleaned_data:
                    currency = cleaned_data.get("currency", "INR")
                    original_amount = cleaned_data.get("total_amount", 0.0)
                    converted_amount = await self._convert_to_inr(original_amount, currency)
                    cleaned_data["total_amount"] = round(converted_amount, 2)
                    cleaned_data["original_amount"] = original_amount
                    cleaned_data["original_currency"] = currency
                    cleaned_data["converted_to_inr"] = currency.upper() != "INR"
                
                return {
                    "success": True,
                    "data": cleaned_data,
                    "raw_response": response.text,
                    "note": "Used regex extraction due to JSON parsing error"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": {
                    "merchant": "",
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "total_amount": 0.0,
                    "items": [],
                    "category": "other",
                    "confidence": 0.0,
                }
            }
    
    async def _convert_to_inr(self, amount: float, currency: str) -> float:
        """Convert amount from given currency to INR using exchange rates"""
        if not currency or currency.upper() in ['INR', '₹', 'RS', 'RS.', 'Rs', 'Rs.']:
            return amount
        
        # Normalize currency code
        currency_map = {
            '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR',
            'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP', 'JPY': 'JPY',
            'AUD': 'AUD', 'CAD': 'CAD', 'CHF': 'CHF', 'CNY': 'CNY',
            'SGD': 'SGD', 'AED': 'AED', 'SAR': 'SAR'
        }
        
        currency_code = currency_map.get(currency.upper(), currency.upper())
        
        if currency_code == 'INR':
            return amount
        
        try:
            # Use exchangerate-api.com free tier (no API key needed for base currency USD)
            # For other base currencies, we'll use a free API
            async with aiohttp.ClientSession() as session:
                # Try exchangerate-api.com first (free, no key needed)
                url = f"https://api.exchangerate-api.com/v4/latest/{currency_code}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'rates' in data and 'INR' in data['rates']:
                            rate = data['rates']['INR']
                            return amount * rate
                
                # Fallback: Use fixer.io style API (free alternative)
                # Using exchangerate.host (free, no API key)
                url = f"https://api.exchangerate.host/latest?base={currency_code}&symbols=INR"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'rates' in data and 'INR' in data['rates']:
                            rate = data['rates']['INR']
                            return amount * rate
        except Exception as e:
            print(f"[OCR] Currency conversion error: {e}")
            # Return original amount if conversion fails
            return amount
        
        # If all APIs fail, return original amount
        print(f"[OCR] Could not convert {currency_code} to INR, returning original amount")
        return amount
    
    def _clean_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and validate extracted data"""
        cleaned = {}
        
        # Clean merchant name
        if "merchant" in data:
            cleaned["merchant"] = str(data["merchant"]).strip()
        
        # Clean and validate date
        if "date" in data:
            date_str = str(data["date"]).strip()
            try:
                # Try to parse the date
                parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
                cleaned["date"] = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                # Try other common formats
                for fmt in ["%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d"]:
                    try:
                        parsed_date = datetime.strptime(date_str, fmt)
                        cleaned["date"] = parsed_date.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
                else:
                    cleaned["date"] = datetime.now().strftime("%Y-%m-%d")
        
        # Extract currency
        currency = None
        if "currency" in data:
            currency = str(data["currency"]).strip().upper()
        
        # Clean total amount
        if "total_amount" in data:
            try:
                amount_str = str(data["total_amount"])
                # Remove common currency symbols and text
                amount_str = re.sub(r'[₹$€£¥,rsRS]', '', amount_str, flags=re.IGNORECASE)
                amount = float(amount_str.replace(",", ""))
                cleaned["total_amount"] = abs(amount)  # Store original amount
                cleaned["currency"] = currency or "INR"  # Store detected currency
            except ValueError:
                cleaned["total_amount"] = 0.0
                cleaned["currency"] = currency or "INR"
        
        # Clean items
        if "items" in data and isinstance(data["items"], list):
            cleaned["items"] = []
            for item in data["items"]:
                if isinstance(item, dict):
                    cleaned_item = {}
                    if "description" in item:
                        cleaned_item["description"] = str(item["description"]).strip()
                    if "amount" in item:
                        try:
                            amount_str = str(item["amount"])
                            # Remove common currency symbols and text
                            amount_str = re.sub(r'[₹$€£¥,rsRS]', '', amount_str, flags=re.IGNORECASE)
                            amount = float(amount_str.replace(",", ""))
                            cleaned_item["amount"] = abs(amount)
                        except ValueError:
                            cleaned_item["amount"] = 0.0
                    cleaned["items"].append(cleaned_item)
        
        # Clean category
        if "category" in data:
            cleaned["category"] = str(data["category"]).strip().lower()
        
        # Clean confidence
        if "confidence" in data:
            try:
                confidence = float(data["confidence"])
                cleaned["confidence"] = max(0.0, min(1.0, confidence))
            except (ValueError, TypeError):
                cleaned["confidence"] = 0.8  # Default confidence
        
        return cleaned
    
    def _extract_with_regex(self, text: str) -> Dict[str, Any]:
        """Fallback method to extract data using regex patterns"""
        cleaned_data = {}
        
        # Extract merchant (look for common patterns)
        merchant_patterns = [
            r"merchant[:\s]+([^\n]+)",
            r"store[:\s]+([^\n]+)",
            r"company[:\s]+([^\n]+)"
        ]
        
        for pattern in merchant_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                cleaned_data["merchant"] = match.group(1).strip()
                break
        
        # Extract date
        date_patterns = [
            r"(\d{4}-\d{2}-\d{2})",        # YYYY-MM-DD
            r"(\d{2}/\d{2}/\d{4})",        # MM/DD/YYYY
            r"(\d{1,2}/\d{1,2}/\d{4})",    # M/D/YYYY
            r"(\d{2}-\d{2}-\d{4})",        # DD-MM-YYYY
            r"(\d{1,2}-\d{1,2}-\d{4})"     # D-M-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                cleaned_data["date"] = match.group(1)
                break
        
        # Extract total amount and currency
        amount_patterns = [
            (r"total[:\s]+(?:rs\.?\s*|₹\s*|\$\s*|€\s*|£\s*|USD\s*|EUR\s*|GBP\s*)?([\d,]+\.?\d*)", r"(?:rs\.?\s*|₹|INR)"),
            (r"amount[:\s]+(?:rs\.?\s*|₹\s*|\$\s*|€\s*|£\s*|USD\s*|EUR\s*|GBP\s*)?([\d,]+\.?\d*)", r"(?:rs\.?\s*|₹|INR)"),
            (r"₹\s*([\d,]+\.?\d*)", "INR"),
            (r"\$\s*([\d,]+\.?\d*)", "USD"),
            (r"€\s*([\d,]+\.?\d*)", "EUR"),
            (r"£\s*([\d,]+\.?\d*)", "GBP"),
            (r"rs\.?\s*([\d,]+\.?\d*)", "INR"),
            (r"USD\s*([\d,]+\.?\d*)", "USD"),
            (r"EUR\s*([\d,]+\.?\d*)", "EUR"),
            (r"GBP\s*([\d,]+\.?\d*)", "GBP"),
        ]
        
        currency_detected = "INR"  # Default
        for pattern, currency in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount = float(match.group(1).replace(",", ""))
                    cleaned_data["total_amount"] = abs(amount)
                    currency_detected = currency if isinstance(currency, str) else "INR"
                    break
                except ValueError:
                    continue
        
        cleaned_data["currency"] = currency_detected
        
        # Default values
        if "merchant" not in cleaned_data:
            cleaned_data["merchant"] = "Unknown Merchant"
        if "date" not in cleaned_data:
            cleaned_data["date"] = datetime.now().strftime("%Y-%m-%d")
        if "total_amount" not in cleaned_data:
            cleaned_data["total_amount"] = 0.0
        if "category" not in cleaned_data:
            cleaned_data["category"] = "other"
        if "confidence" not in cleaned_data:
            cleaned_data["confidence"] = 0.6
        
        return cleaned_data
