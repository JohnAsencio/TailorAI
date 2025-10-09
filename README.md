# 🤖 Resume Tailor AI (Web Application)
A smart, browser-based AI software powered by the OpenAI API designed to automatically customize a master resume and output a ready-to-use PDF document.

The Resume Tailor AI provides an intuitive interface where users paste or upload their master resume and a target job description (JD). It uses advanced language model capabilities to identify crucial keywords, required skills, and core responsibilities from the JD, generating a refined, tailored version of the resume that significantly boosts relevance for Applicant Tracking Systems (ATS) and human reviewers.

## ✨ Core Features
 * Web Interface: Easy-to-use interface for pasting or uploading resume and job description text.
 * Intelligent Keyword Extraction: Identifies and prioritizes specific technical, soft, and industry-related keywords from the job description.
 * Relevance Scoring: Provides a real-time match score between the content of the resume and the demands of the JD.
 * Content Rewriting Suggestions: Suggests refined, results-oriented bullet points and phrases based on the JD's language.
 * PDF Output: Generates the final, optimized resume as a professional, submission-ready PDF file.
 * ATS Optimization: Ensures the tailored output is structured and keyword-rich for maximum compatibility with automated screening tools.

## 🚀 Getting Started
Follow these steps to set up and run the web server for the project locally.

### Prerequisites
You need Python 3.8 or newer and a valid OpenAI API key. This project is built using a Python backend (e.g., Flask) and requires a library for HTML-to-PDF conversion.

Python 3.8+

pip (Python package installer)

OpenAI API Key

Web and PDF dependencies (e.g., Flask, requests, WeasyPrint)

Setup & Running the Server
Clone the repository:

git clone [https://github.com/YourUsername/resume-tailor-ai.git](https://github.com/YourUsername/resume-tailor-ai.git)
cd resume-tailor-ai

Create and activate a virtual environment (highly recommended):

## On macOS/Linux
python3 -m venv venv
source venv/bin/activate

## On Windows
python -m venv venv
.\venv\Scripts\activate

Install the dependencies:
This assumes your requirements.txt includes necessary libraries like openai, flask, and a PDF generation tool.

pip install -r requirements.txt

OpenAI API Key Setup
The project requires your OpenAI API key to function. We recommend setting it as an environment variable, which your server will read upon startup.

Option 1: Using a .env file (Recommended)

Create a file named .env in the root directory of the project.

Add your key inside the file:

OPENAI_API_KEY="sk-YOUR_SECRET_API_KEY_HERE"

Ensure your application code loads this key (e.g., using python-dotenv).

Option 2: Direct Shell Export

You can also export the variable directly in your terminal session before starting the server:

# On macOS/Linux
export OPENAI_API_KEY="sk-YOUR_SECRET_API_KEY_HERE"

# On Windows (Command Prompt)
set OPENAI_API_KEY="sk-YOUR_SECRET_API_KEY_HERE"

Starting the Web App
Assuming your main application file is named app.py (which uses a framework like Flask):

# Run the development server
python app.py

The application will typically be accessible at http://127.0.0.1:5000 or a similar local address.

🛠️ Web Application Usage
Access the App: Open your web browser and navigate to the address shown when the server starts (e.g., http://127.0.0.1:5000).

Input Resume: Paste your master resume text into the designated field or upload a file (.txt, .doc, etc., depending on supported formats).

Input Job Description: Paste the target job description text into its field.

Generate: Click the "Tailor and Generate PDF" button.

Download: The application will process the request using the OpenAI API, generate the tailored text, format it, and automatically download the final tailored resume as a PDF file.

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

📞 Contact
John Asencio - johnaasencio@gmail.com

Project Link: https://github.com/johnasencio/tailorai
