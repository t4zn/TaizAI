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

load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up Google Cloud credentials
if 'GOOGLE_APPLICATION_CREDENTIALS_JSON' in os.environ:
    # Create a temporary credentials file
    credentials_json = os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON']
    credentials_path = '/tmp/google-credentials.json'
    with open(credentials_path, 'w') as f:
        f.write(credentials_json)
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

API_KEY = os.getenv("API_KEY")

# Configure API key
genai.configure(api_key=API_KEY)

# Create a Generative Model instance
model = genai.GenerativeModel('gemini-1.5-flash')  # or 'gemini-pro'

# Initialize Google Vision client
vision_client = vision.ImageAnnotatorClient()

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

        if image_data:
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

            # Combine all information
            image_analysis = {
                "ocr_text": ocr_text,
                "detected_objects": detected_objects,
                "detected_labels": detected_labels
            }

            # Add image analysis to user message
            user_message = f"Image Analysis:\nOCR Text: {ocr_text}\nDetected Objects: {', '.join(detected_objects)}\nDetected Labels: {', '.join(detected_labels)}\n\nUser Question: {user_message}"

        # Generate response using model
        response = model.generate_content(user_message)
        return jsonify({"reply": response.text})

    except Exception as e:
        return jsonify({"reply": f"Error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0')
