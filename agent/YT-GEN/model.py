from youtube_transcript_api import YouTubeTranscriptApi
from langchain.text_splitter import TokenTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.summarize import load_summarize_chain
from langchain.docstore.document import Document
from dotenv import load_dotenv
import os
import re
from urllib.parse import urlparse, parse_qs
import google.generativeai as genai


load_dotenv()

g_api_key = os.getenv("GOOGLE_API_KEY")

video_id = "eMlx5fFNoYc"


def summarize_video(readable_text):
    try:
        genai.configure(api_key=g_api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"Summarize the following text in relevant points such that they would be important for someone with a research background \n\n{readable_text}"
        
        response = model.generate_content(prompt)
        
        
        if response.prompt_feedback.block_reason:
            print("Response was blocked by safety filters.")
            print(f"Block Reason: {response.prompt_feedback.block_reason}")
            
            return None
        
        
        if not response.text:
            print("Response text is empty, but not blocked. There may be another issue.")
            return None
        
       
        print(response.text)
        return response.text
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
      
       
        
    except Exception as e:
        return f"An error occurred: {e}"

def convert_to_text(transcript):
    full_text_list = []
    for snippet in transcript:
    
      full_text_list.append(snippet.text)
    readable_text = ' '.join(full_text_list)
    print(readable_text)
    summarize_video(readable_text)
    
    

def extract_yt_id(url):

    parsed_url = urlparse(url)
    
    if parsed_url.hostname in ['www.youtube.com', 'youtube.com']:
        query = parse_qs(parsed_url.query)
        return query.get('v', [None])[0]
    
    
    elif parsed_url.hostname == 'youtu.be':
        return parsed_url.path[1:] 
    
    
    elif parsed_url.path.startswith('/embed/'):
        return parsed_url.path.split('/')[2]
    
    return None


 


try:
   
    
    ytt_api = YouTubeTranscriptApi()
    transcript=ytt_api.fetch(video_id,languages=['en'])
    print(convert_to_text(transcript))
   

except Exception as e:
    print(f"An error occurred: {e}")




