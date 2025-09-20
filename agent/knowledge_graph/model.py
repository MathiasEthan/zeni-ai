import os 
from langchain_community.graphs import Neo4jGraph
from langchain_experimental.graph_transformers import LLMGraphTransformer   
from langchain.document_loaders import PyPDFLoader
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_google_genai import ChatGoogleGenerativeAI
import asyncio
from pyvis.network import Network
import google.generativeai as genai
load_dotenv()

Neo4j_User=os.getenv("NEO4J_USERNAME")
Neo4j_Password=os.getenv("NEO4J_PASSWORD")
Neo4j_Url=os.getenv("NEO4J_URL")

llm=ChatGoogleGenerativeAI(model="gemini-2.5-flash")

llm_transformer=LLMGraphTransformer(llm=llm)

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
pdf_path = os.path.join(BASE_DIR, "16x16-words.pdf") 

g_api_key = os.getenv("GOOGLE_API_KEY")

def summarize_pdf(readable_text):
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

def load_and_preprocess_pdf(pdf_path, keywords=None):
    
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()   
    
   
    full_text = " ".join([doc.page_content for doc in documents])
    
   
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
    docs = text_splitter.create_documents([full_text])
    
    
    if keywords:
        docs = [doc for doc in docs if any(k.lower() in doc.page_content.lower() for k in keywords)]
    
    return docs

async def scrape_pdf(pdf_path):
    # Step 1: Load + preprocess
    processed_docs = load_and_preprocess_pdf(pdf_path)

    # Step 2: Concatenate docs into plain text
    combined_text = " ".join([doc.page_content for doc in processed_docs])

    # Step 3: Use Gemini to filter for research-relevant text
    summarized_text = summarize_pdf(combined_text)

    if not summarized_text:
        print("No summarized text returned. Exiting.")
        return

    # Step 4: Wrap back into Document for graph transformer
    summarized_docs = [Document(page_content=summarized_text)]

    # Step 5: Build graph
    graph_documents = await llm_transformer.aconvert_to_graph_documents(summarized_docs)
    visualize_graph(graph_documents)


def visualize_graph(graph_documents):
    net = Network(height="1200px", width="100%", directed=True,
                      notebook=False, bgcolor="#222222", font_color="white", filter_menu=True, cdn_resources='remote') 

    nodes = graph_documents[0].nodes
    relationships = graph_documents[0].relationships

    
    node_dict = {node.id: node for node in nodes}
    
   
    valid_edges = []
    valid_node_ids = set()
    for rel in relationships:
        if rel.source.id in node_dict and rel.target.id in node_dict:
            valid_edges.append(rel)
            valid_node_ids.update([rel.source.id, rel.target.id])

    # Track which nodes are part of any relationship
    connected_node_ids = set()
    for rel in relationships:
        connected_node_ids.add(rel.source.id)
        connected_node_ids.add(rel.target.id)

    # Add valid nodes to the graph
    for node_id in valid_node_ids:
        node = node_dict[node_id]
        try:
            net.add_node(node.id, label=node.id, title=node.type, group=node.type)
        except:
            continue  # Skip node if error occurs

    # Add valid edges to the graph
    for rel in valid_edges:
        try:
            net.add_edge(rel.source.id, rel.target.id, label=rel.type.lower())
        except:
            continue  # Skip edge if error occurs

    # Configure graph layout and physics
    net.set_options("""
        {
            "physics": {
                "forceAtlas2Based": {
                    "gravitationalConstant": -100,
                    "centralGravity": 0.01,
                    "springLength": 200,
                    "springConstant": 0.08
                },
                "minVelocity": 0.75,
                "solver": "forceAtlas2Based"
            }
        }
    """)

   
    try:
        output_file = os.path.join(os.getcwd(), "knowledge_graph.html")
        net.save_graph(output_file)
        print(f"Graph saved to {os.path.abspath(output_file)}")
        return net
    except Exception as e:
        print(f"Error saving graph: {e}")
        return None

asyncio.run(scrape_pdf(pdf_path))
# text_splitter = RecursiveCharacterTextSplitter(
#     chunk_size=1000,
#     chunk_overlap=50
# )
# docs = text_splitter.split_documents(documents)


# kg = KnowledgeGraph()

# for doc in docs:
#     kg.add_text(doc.page_content, graph=graph)

# print("Knowledge Graph created in Neo4j!")

