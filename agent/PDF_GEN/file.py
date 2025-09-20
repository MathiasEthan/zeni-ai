import os
import io
import pypdf
import google.generativeai as genai
from flask import Flask, request, jsonify
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
import requests
from urllib.parse import urlparse

# Load environment variables from a .env file
load_dotenv()

# --- Configuration and Environment Setup ---
# It is highly recommended to use environment variables for sensitive information.
# You can set the variable in your terminal or in a .env file.
# export GOOGLE_API_KEY="your_api_key_here"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")


class PDFSummarizationAgent:
    """
    A class to encapsulate the PDF parsing, chunking, RAG, and summarization logic.
    """
    def __init__(self):
        # Initialize the embedding model using HuggingFaceEmbeddings from the new package
        # This will download the model on the first run, which might take a moment.
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Configure the Google API with your key from the environment variable.
        genai.configure(api_key=GOOGLE_API_KEY)
        # Use a powerful model for better summarization results.
        self.llm = genai.GenerativeModel('gemini-1.5-pro-latest')

    def parse_pdf(self, pdf_file_stream):
        """
        Parses a PDF file stream (a file-like object) and extracts all text.
        Raises pypdf.errors.PdfReadError if the file is not a valid PDF.
        """
        # FIX: Directly read from the stream. This is more efficient than
        # reading the whole file into memory and then wrapping it in another stream.
        pdf_reader = pypdf.PdfReader(pdf_file_stream)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""  # Ensure no NoneType is concatenated
        return text

    def chunk_text(self, text):
        """
        Splits text into chunks with overlap for better context.
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        # Langchain's splitter now typically returns Document objects.
        # This is compatible with FAISS.
        chunks = text_splitter.create_documents([text])
        return chunks

    def create_retriever(self, chunks):
        """
        Creates a FAISS vector store from text chunks and returns a retriever.
        FAISS is a library for efficient similarity search.
        """
        vector_store = FAISS.from_documents(chunks, self.embedding_model)
        return vector_store.as_retriever()

    def summarize_with_rag(self, retriever, query):
        """
        Generates a summary using a Retrieval-Augmented Generation (RAG) chain.
        It retrieves relevant documents first and then uses the LLM to summarize them.
        """
        try:
            retrieved_docs = retriever.get_relevant_documents(query)
            # Limit the context size to avoid exceeding model token limits
            # and to keep the summary focused.
            context = "\n\n".join([doc.page_content for doc in retrieved_docs[:4]]) # Use top 4 docs for richer context

            prompt = f"""
            Based on the following excerpts from a document, provide a concise and accurate summary.
            Focus on the main points, arguments, and key findings. Ensure the summary is comprehensive yet brief.

            Context:
            {context[:8000]}
            
            Summary:
            """

            response = self.llm.generate_content(
                prompt,
                generation_config={
                    "max_output_tokens": 1024,
                    "temperature": 0.3
                }
            )
            
            return response.text
        except genai.types.generation_types.BlockedPromptException as e:
            # Handle cases where the prompt or content is flagged by safety settings
            print(f"Error: Prompt blocked due to safety concerns. {str(e)}")
            raise e
        except Exception as e:
            # Print the detailed error to the console for debugging
            print(f"Error in summarization: {str(e)}")
            raise e

# --- Flask API Endpoints ---

app = Flask(__name__)
# Initialize the agent once when the application starts.
# This prevents re-loading the embedding model on every request.
agent = PDFSummarizationAgent()

@app.route('/summarize', methods=['POST'])
def summarize_pdf_endpoint():
    """
    API endpoint to receive a PDF file via form-data and return a summary.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        # Step 1: Parse the uploaded file stream
        pdf_text = agent.parse_pdf(file)
        if not pdf_text.strip():
            return jsonify({"error": "Could not extract text from PDF. The file might be empty, password-protected, or contain only images."}), 400
        
        # Step 2: Chunk the extracted text
        chunks = agent.chunk_text(pdf_text)
        
        # Step 3: Create a retriever from the chunks
        retriever = agent.create_retriever(chunks)
        
        # Step 4: Summarize with RAG
        # This query guides the LLM to produce a high-quality summary.
        query = "Provide a concise and accurate summary of the document, focusing on the main points, arguments, and key findings. Ensure the summary is comprehensive."
        summary = agent.summarize_with_rag(retriever, query)
        
        return jsonify({"summary": summary})
    except pypdf.errors.PdfReadError:
        return jsonify({"error": "Invalid or corrupted PDF file."}), 400
    except Exception as e:
        # Log the error for debugging purposes
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred. Please check the logs."}), 500


@app.route('/summarize_url', methods=['POST'])
def summarize_url_endpoint():
    """
    API endpoint to receive a PDF URL in a JSON body and return a summary.
    """
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({"error": "URL not provided in the request body"}), 400

    url = data['url']

    # Validate that the URL is a proper web address
    parsed_url = urlparse(url)
    if not all([parsed_url.scheme, parsed_url.netloc]):
        return jsonify({"error": "Invalid URL. Please provide a complete web address (e.g., https://example.com/file.pdf)."}), 400

    if not url.lower().endswith('.pdf'):
        return jsonify({"error": "The provided URL does not appear to link to a PDF file."}), 400

    try:
        # Download the PDF content from the URL
        response = requests.get(url)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        
        # Create a file-like object from the downloaded content
        pdf_file_stream = io.BytesIO(response.content)
        
        # Step 1: Parse the PDF stream
        pdf_text = agent.parse_pdf(pdf_file_stream)
        if not pdf_text.strip():
            return jsonify({"error": "Could not extract text from the PDF at the URL."}), 400
        
        # Step 2: Chunk the text
        chunks = agent.chunk_text(pdf_text)
        
        # Step 3: Create the retriever
        retriever = agent.create_retriever(chunks)
        
        # Step 4: Generate the summary
        query = "Provide a concise and accurate summary of the document, focusing on the main points, arguments, and key findings. Ensure the summary is comprehensive."
        summary = agent.summarize_with_rag(retriever, query)
        
        return jsonify({"summary": summary})
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to download the file from the URL: {str(e)}"}), 400
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # Note: For production, use a proper WSGI server like Gunicorn or Waitress
    # instead of Flask's built-in development server.
    app.run(debug=True, host='0.0.0.0', port=5000)

    