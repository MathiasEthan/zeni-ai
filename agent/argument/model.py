import time
import textwrap
import json
import requests
import os
import urllib.parse
import fitz # PyMuPDF library for reading PDFs

# This script conducts a live debate between two LLM agents by making real API calls
# to the Gemini model. It maintains a chat history to give context to each agent.

# --- Configuration ---
# System prompts for the two agents
LLM1_SYSTEMPROMPT = (
    "You are a sophisticated debater arguing against the topic of the research paper. "
    "Your goal is to be polite and highlight logical flaws, unproven claims, and "
    "methodological weaknesses. You must provide exactly 5 distinct points before providing a conclusion. "
    "Focus solely on the provided chat history to form your arguments."
)

LLM2_SYSTEMPROMPT = (
    "You are a sophisticated debater arguing in support of the research paper. "
    "Your goal is to be polite and highlight the key strengths of the paper, "
    "such as its innovative approach, compelling data, and clear findings. "
    "Counter the other debater's arguments point by point. You must provide exactly 5 distinct "
    "points before concluding. Focus solely on the provided chat history."
)

# IMPORTANT: You must provide a valid API key here for the script to function.
# Do not share your API key publicly.
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# Fix: URL-encode the API key to handle any special characters, including quotes.
if GOOGLE_API_KEY:
    encoded_api_key = urllib.parse.quote_plus(GOOGLE_API_KEY.strip().replace('"', ''))
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={encoded_api_key}"
else:
    api_url = ""

# --- Helper Functions ---
def read_pdf(file_path):
    """
    Reads a PDF file and returns its content as a single string.
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except FileNotFoundError:
        return "ERROR: PDF file not found. Please ensure the file is in the same directory as the script."
    except Exception as e:
        return f"ERROR: An error occurred while reading the PDF: {e}"

def make_gemini_call(chat_history, system_prompt):
    """
    Makes a real API call to the Gemini model with the debate history and a
    system prompt. This function handles the request and response parsing.
    
    Args:
        chat_history (list): A list of message objects representing the conversation.
        system_prompt (str): The system instruction for the model's persona.
        
    Returns:
        str: The generated response text, or an error message if the call fails.
    """
    if not GOOGLE_API_KEY:
        return "ERROR: API key is not set. Please set the GOOGLE_API_KEY environment variable."
        
    headers = {
        "Content-Type": "application/json"
    }

    # The payload includes the system instruction and the full conversation history.
    payload = {
        "contents": chat_history,
        "systemInstruction": {
            "parts": [{ "text": system_prompt }]
        }
    }

    try:
        # Use a timeout to prevent the request from hanging indefinitely
        response = requests.post(api_url, headers=headers, data=json.dumps(payload), timeout=120)
        response.raise_for_status() # Raises an HTTPError for bad responses (4xx or 5xx)
        
        data = response.json()
        
        # Parse the JSON response to get the generated text.
        if "candidates" in data and len(data["candidates"]) > 0:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            return "ERROR: No candidate response found in the API call."

    except requests.exceptions.RequestException as e:
        return f"ERROR: An API request error occurred: {e}"

# --- Debate Simulation ---
def run_debate_simulation():
    """
    Main function to run the live debate.
    """
    # Specify the path to your PDF file here
    pdf_file_path = "c:\\Users\\LENOVO\\Downloads\\1706.03762v7.pdf"

    # Read the content from the PDF
    research_paper_content = read_pdf(pdf_file_path)
    if research_paper_content.startswith("ERROR"):
        print(research_paper_content)
        return # Exit the script if the PDF cannot be read
    
    print("--- Live Debate Simulation Starting ---")
    print("Topic: The Efficacy of Transfer Learning in Novel Domains")
    print("-" * 35)

    chat_history = []
    
    # Add the research paper content to the chat history for context
    chat_history.append({"role": "user", "parts": [{"text": f"Analyze the following research paper content:\n\n{research_paper_content}"}]})
    
    # Agent A gives all 5 against points
    print("Agent A (Opponent) is preparing their 5 points against the paper...")
    for i in range(1, 6):
        prompt = f"Provide point {i} against the research paper based on the content. Be succinct and logical."
        response_a = make_gemini_call(chat_history + [{"role": "user", "parts": [{"text": prompt}]}], LLM1_SYSTEMPROMPT)
        chat_history.append({"role": "model", "parts": [{"text": response_a}]})
        print(f"\n[Point {i}] Agent A (Opponent):\n{textwrap.fill(response_a, width=80)}\n")
        time.sleep(1) # Add a small delay between calls
        
    # Agent B gives all 5 for points, countering Agent A's points
    print("Agent B (Proponent) is preparing their 5 points in support of the paper...")
    for i in range(1, 6):
        prompt = f"Provide point {i} in support of the research paper, countering Agent A's previous points. Be succinct and logical."
        response_b = make_gemini_call(chat_history + [{"role": "user", "parts": [{"text": prompt}]}], LLM2_SYSTEMPROMPT)
        chat_history.append({"role": "model", "parts": [{"text": response_b}]})
        print(f"\n[Point {i}] Agent B (Proponent):\n{textwrap.fill(response_b, width=80)}\n")
        time.sleep(1) # Add a small delay between calls
        
    # Final conclusions
    print("-" * 35)
    print("\n--- Final Statements ---")
    
    print("Agent A is preparing their conclusion...")
    final_a = make_gemini_call(chat_history + [{"role": "user", "parts": [{"text": "Please provide your final conclusion summarizing your points against the paper."}]}], LLM1_SYSTEMPROMPT)
    print("\nAgent A's Final Statement:")
    print(textwrap.fill(final_a, width=80))

    print("\nAgent B is preparing their conclusion...")
    final_b = make_gemini_call(chat_history + [{"role": "user", "parts": [{"text": "Please provide your final conclusion summarizing your points in support of the paper."}]}], LLM2_SYSTEMPROMPT)
    print("\nAgent B's Final Statement:")
    print(textwrap.fill(final_b, width=80))
    
    print("-" * 35)
    print("--- Simulation Complete ---")

if __name__ == "__main__":
    run_debate_simulation()
