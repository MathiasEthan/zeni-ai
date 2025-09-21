from langchain_google_genai import ChatGoogleGenerativeAI
import requests
import feedparser
from dateutil import parser as date_parser
import urllib.parse
from dotenv import load_dotenv
import os
import datetime,timedelta
import pytz    

# cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=hours_back)
# now = datetime.datetime.now(datetime.UTC)

# --------------- CONFIG -----------------
HOURS_BACK = 300
QUERY = "transformer OR large language model OR neural networks OR deep learning OR attention mechanism OR GPT OR BERT OR machine learning"
MAX_RESULTS = 10
# -----------------------------------------

load_dotenv()
g_api_key = os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=g_api_key)

def generate_catchy_titles(papers):
    catchy_results = []
    for paper in papers[:10]:  # just top 10
        title = paper.get("title", "")
        summary = paper.get("summary", "")

        prompt = f"""
        You are a creative science communicator. 
        The paper title is: "{title}".
        The abstract/summary is: "{summary[:500]}".
        
        Task: Rewrite the title into a **catchy, curiosity-driven version** (like a YouTube headline, but still accurate).
        Return only one catchy title.
        """

        response = llm.invoke(prompt)
        catchy_results.append({
            "original": title,
            "catchy": response.content.strip()
        })
    return catchy_results

def fetch_arxiv(query=QUERY, max_results=MAX_RESULTS, hours_back=HOURS_BACK):
    encoded_query = urllib.parse.quote_plus(query)
    url = f"http://export.arxiv.org/api/query?search_query=all:{encoded_query}&start=0&max_results={max_results}&sortBy=submittedDate&sortOrder=descending"
    
    feed = feedparser.parse(url)
    
    utc = pytz.UTC
    cutoff = datetime.datetime.now(utc) - datetime.timedelta(hours=hours_back)
    results = []

    for entry in feed.entries:
        published = date_parser.parse(entry.published)
        published = published.replace(tzinfo=utc)  # make it timezone-aware
        if published > cutoff:
            results.append({
                "source": "arXiv",
                "title": entry.title,
                "authors": [a.name for a in entry.authors],
                "summary": entry.summary,
                "link": entry.link,
                "published": str(published)
            })
    return results




if __name__ == "__main__":
    try:
        print("Fetching papers from arXiv...")
        arxiv_papers = fetch_arxiv()
        print(f"Found {len(arxiv_papers)} arxiv papers")
        
        print("\nFetching papers from Semantic Scholar...")
        semscholar_papers = fetch_semantic_scholar()
        print(f"Found {len(semscholar_papers)} semantic scholar papers")
        
        print("\nFetching papers from PubMed...")
        pubmed_papers = fetch_pubmed()
        print(f"Found {len(pubmed_papers)} pubmed papers")

        all_papers = arxiv_papers + semscholar_papers + pubmed_papers
        print(f"\nTotal papers found: {len(all_papers)}")
        
        if len(all_papers) == 0:
            print("No papers found within the specified time window")
            exit()

        print("\n=== Research Papers Found ===\n")
        for p in all_papers:
            print(f"[{p['source']}] {p['title']}")
            print(f"Published: {p['published']}")
            print(f"Authors: {', '.join(p['authors'])}")
            print(f"Link: {p['link']}")
            print(f"Summary: {p['summary'][:300]}..." if p['summary'] else "No summary available")
            print("-" * 80 + "\n")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")