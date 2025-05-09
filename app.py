from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv
from google.cloud import vision
from PIL import Image
import io
import base64
import json
import tempfile
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

def setup_google_credentials():
    try:
        # First try to get credentials from environment variable
        if 'GOOGLE_APPLICATION_CREDENTIALS_JSON' in os.environ:
            credentials_json = os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON']
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
            temp_file.write(credentials_json.encode())
            temp_file.close()
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file.name
            return True
        
        # If not found in environment, try to load from .env file
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if credentials_path and os.path.exists(credentials_path):
            return True
            
        return False
    except Exception as e:
        logger.error(f"Error setting up credentials: {str(e)}")
        return False

# Set up credentials
if not setup_google_credentials():
    logger.error("Google Cloud credentials not found. Image analysis features will not work.")

API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable is not set")

# Configure API key
genai.configure(api_key=API_KEY)

# Create a Generative Model instance
model = genai.GenerativeModel('gemini-1.5-flash')  # or 'gemini-pro'

# Initialize Google Vision client
try:
    vision_client = vision.ImageAnnotatorClient()
    logger.info("Successfully initialized Vision client")
except Exception as e:
    logger.error(f"Failed to initialize Vision client: {str(e)}")
    vision_client = None

# Route to serve the HTML page
@app.route('/')
def index():
    return render_template('index.html')

# Route to handle user questions
@app.route('/api/ask', methods=['POST'])
def ask():
    try:
        data = request.json
        user_message = data['message']
        image_data = data.get('image')  # Base64 encoded image data

        if image_data and vision_client:
            try:
                # Decode base64 image
                image_bytes = base64.b64decode(image_data.split(',')[1])
                image = vision.Image(content=image_bytes)
                
                # Perform OCR
                response = vision_client.text_detection(image=image)
                texts = response.text_annotations
                ocr_text = texts[0].description if texts else ""

                # Perform object detection
                objects = vision_client.object_localization(image=image).localized_object_annotations
                detected_objects = [obj.name for obj in objects]

                # Perform label detection
                labels = vision_client.label_detection(image=image).label_annotations
                detected_labels = [label.description for label in labels]

                # Create a detailed image analysis prompt
                image_analysis = f"""I have analyzed this image and found:

Text in the image (OCR): {ocr_text}
Objects detected: {', '.join(detected_objects)}
Labels/Tags: {', '.join(detected_labels)}

Please analyze this image and provide a detailed response to the user's question: {user_message}

Consider all the detected elements and provide a comprehensive answer."""

                # Generate response using the image analysis
                response = model.generate_content(image_analysis)
                return jsonify({"reply": response.text})

            except Exception as e:
                logger.error(f"Error processing image: {str(e)}")
                return jsonify({
                    "reply": "I apologize, but I encountered an error while analyzing the image. Please make sure the image is clear and try again. If the problem persists, please try a different image or question."
                }), 500

        # If no image, just process the text message
        response = model.generate_content(user_message)
        return jsonify({"reply": response.text})

    except Exception as e:
        logger.error(f"Error in /api/ask: {str(e)}")
        return jsonify({
            "reply": "I apologize, but I encountered an error processing your request. Please try again."
        }), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0')
