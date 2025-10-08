from flask import Flask, logging, render_template, request, session, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import logging
import tiktoken
import os

load_dotenv()
app = Flask(__name__)

SECRET_KEY = os.getenv('SECRET_KEY')
app.config['SECRET_KEY'] = SECRET_KEY

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY)

logging.basicConfig(level=logging.INFO)

# Constants
WH_RATE = 0.018
ML_RATE = 0.0324
KG_CO2_RATE = 0.00000594
USD_RATE_IN = 0.000001375
USD_RATE_OUT = 0.00001

# Routes
@app.route("/")
def index():
    session['id'] = None
    session['total_WH'] = 0
    session['total_ML'] = 0
    session['total_CO2'] = 0
    session['total_usd'] = 0
    session['total_tokens'] = 0
    return render_template('index.html')


@app.route("/chat", methods=["POST"])
def chat():
    prompt = request.form["prompt"]
    response_data = get_response(prompt)
    return jsonify(response_data)


def get_response(prompt):
    current_response_id = session.get('id')
    
    response = client.responses.create(
            model = "gpt-4o", # Simulating GPT 5
            input = prompt,
            previous_response_id=current_response_id
        )
    
    
    enc = tiktoken.encoding_for_model("gpt-4o") # Tokenizer
    input_tokenizer = len(enc.encode(prompt))
    
    output_text = response.output_text
    usage = response.usage
    query_tokens = usage.total_tokens

    # Log token usage
    logging.info(f'Input Tokens (Tokenizer): {input_tokenizer}')
    logging.info(f'Input Tokens (from API): {usage.input_tokens}')
    logging.info(f'Total Tokens (Tokenizer): {usage.output_tokens + input_tokenizer}')
    logging.info(f"Total Tokens: {query_tokens}")
    
    # Calculate metrics
    wh_cost = (input_tokenizer + usage.output_tokens) * WH_RATE
    ml_cost = (input_tokenizer + usage.output_tokens) * ML_RATE
    co2_cost = (input_tokenizer + usage.output_tokens) * KG_CO2_RATE
    usd_cost_in = usage.input_tokens * USD_RATE_IN
    usd_cost_out = usage.output_tokens * USD_RATE_OUT
    usd_cost = usd_cost_in + usd_cost_out
    
    # Update session totals
    session['total_WH'] = session.get('total_WH', 0) + wh_cost
    session['total_ML'] = session.get('total_ML', 0) + ml_cost
    session['total_CO2'] = session.get('total_CO2', 0) + co2_cost
    session['total_usd'] = session.get('total_usd', 0) + usd_cost
    session['total_tokens'] = session.get('total_tokens', 0) + query_tokens
    
    session['id'] = response.id

    return {
        "response_text": output_text,
        "total_wh": f"{session['total_WH']:.3f}",
        "total_ml": f"{session['total_ML']:.3f}",
        "total_co2": f"{session['total_CO2']:.5f}",
        "total_usd": f"{session['total_usd']:.5f}",
        "total_tokens": session['total_tokens'],
        # Add incremental values
        "inc_wh": f"{wh_cost:.3f}",
        "inc_ml": f"{ml_cost:.3f}",
        "inc_co2": f"{co2_cost:.5f}",
        "inc_usd": f"{usd_cost:.5f}",
        "inc_tokens": query_tokens
    }
    
if __name__ == '__main__':
    app.run(debug=True)