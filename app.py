from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # Add this import
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

API_KEY = os.getenv("API_KEY")

# Initialize the Google Gemini client
client = genai.Client(api_key=API_KEY)

# Route to serve the HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Route to handle the API request
@app.route('/api/ask', methods=['POST'])
def ask():
    try:
        data = request.json
        user_message = data['message']

        # Call Google Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash",  # Make sure this is the correct model
            contents=user_message,
        )

        # Return the response to the frontend
        return jsonify({"reply": response.text})

    except Exception as e:
        return jsonify({"reply": f"Error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=False,host='0.0.0.0')
