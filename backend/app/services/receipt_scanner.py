import io
import json
import re
from PIL import Image, ImageEnhance
from fastapi import UploadFile
from loguru import logger
from app.core.ai_engine import ai_engine
from app.schemas.receipt_tracker import ExtractedReceiptData

class ReceiptScannerService:
    async def process_image(self, file: UploadFile) -> bytes:
        """Pre-processes the image using Pillow to optimize for vision models."""
        contents = await file.read()
        try:
            image = Image.open(io.BytesIO(contents))
            
            # Convert to RGB if not
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Resize if too large (max 1500px on longest side)
            max_size = 1500
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
            # Enhance contrast slightly to make text more readable
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # Save to bytes
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=85)
            return output.getvalue()
        except Exception as e:
            logger.error(f"Failed to process image: {e}")
            # Fallback to original bytes
            return contents

    async def extract_receipt_data(self, image_bytes: bytes) -> ExtractedReceiptData:
        """Uses LLM Vision to extract structured data from receipt image."""
        system_prompt = (
            "You are an expert OCR and data extraction AI. Extract the required fields from the receipt image. "
            "Respond ONLY with a valid JSON object matching the requested schema. "
            "Do not include markdown blocks, explanations, or any other text. "
            "Categorize the expense into one of these: Food, Transport, Shopping, Bills, Software, Entertainment, Other."
        )
        
        prompt = (
            "Extract the following information from this receipt:\n"
            "- vendor (string): The name of the store or vendor\n"
            "- amount (number): The total amount paid\n"
            "- currency (string): The currency code (e.g., USD, EUR). Default to USD if unknown.\n"
            "- date (string): The date of the receipt in YYYY-MM-DD format.\n"
            "- category (string): The most appropriate category.\n"
            "- items (array of objects): Each object should have 'name' (string) and 'price' (number).\n\n"
            "Respond with pure JSON."
        )
        
        # We try to use a vision model (like Llama 4 Scout on Groq)
        try:
            # We enforce model="meta-llama/llama-4-scout-17b-16e-instruct" to ensure vision capabilities.
            response_text = await ai_engine.generate_with_image(
                prompt=prompt,
                system=system_prompt,
                image_bytes=image_bytes,
                mime_type="image/jpeg",
                temperature=0.1, # Low temperature for factual extraction
                model="meta-llama/llama-4-scout-17b-16e-instruct"
            )
            
            # Clean response text to extract json if it contains markdown
            response_text = response_text.strip()
            if "```json" in response_text:
                json_match = re.search(r'```json(.*?)```', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(1).strip()
            elif "```" in response_text:
                json_match = re.search(r'```(.*?)```', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(1).strip()
                    
            data = json.loads(response_text)
            return ExtractedReceiptData(**data)
            
        except Exception as e:
            logger.error(f"Failed to extract receipt data: {e}")
            # Return empty/default object on failure
            from datetime import date
            return ExtractedReceiptData(
                vendor="Unknown Vendor",
                amount=0.0,
                currency="USD",
                date=date.today().strftime("%Y-%m-%d"),
                category="Other",
                items=[]
            )

receipt_scanner = ReceiptScannerService()
