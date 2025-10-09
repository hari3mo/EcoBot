from flask import Flask, render_template, request, session, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import tiktoken
import os

load_dotenv()
app = Flask(__name__)

PROD = os.getenv('PROD') == 'True'

SECRET_KEY = os.getenv('SECRET_KEY')
app.config['SECRET_KEY'] = SECRET_KEY

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY)

# Constants
WH_RATE = 0.018
ML_RATE = 0.0324
G_CO2_RATE = 0.00594
USD_RATE_INPUT = 0.00000125
USD_RATE_CACHE = 0.000000125
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
    session['cached_tokens'] = 0
    return render_template('index.html')


@app.route("/chat", methods=["POST"])
def chat():
    prompt = request.form["prompt"]
    response_data = get_response(prompt)
    return jsonify(response_data)


def get_response(prompt):
    current_response_id = session.get('id', None)
    
    response = client.responses.create(
            model = "gpt-4o", # Simulating GPT 5
            input = prompt,
            previous_response_id=current_response_id
        )
    
    output_text = response.output_text
    usage = response.usage
    query_tokens = usage.total_tokens
    
    enc = tiktoken.encoding_for_model("gpt-4o") # Tokenizer
    input_tokenizer = len(enc.encode(prompt))
    output_tokenizer = len(enc.encode(output_text))
    
    cached_tokens = query_tokens - (input_tokenizer + usage.output_tokens)
    session['cached_tokens'] += input_tokenizer + usage.output_tokens if current_response_id else cached_tokens
    
    # import logging
    # logging.basicConfig(level=logging.INFO)
    # logging.info(f"Cached Tokens: {cached_tokens}, Aggregate Cached Tokens: {input_tokenizer + output_tokenizer}")

    # Calculate metrics
    wh_cost = (input_tokenizer + usage.output_tokens) * WH_RATE
    ml_cost = (input_tokenizer + usage.output_tokens) * ML_RATE
    co2_cost = (input_tokenizer + usage.output_tokens) * G_CO2_RATE
    usd_cost_in = usage.input_tokens * USD_RATE_INPUT
    usd_cost_cache = cached_tokens * USD_RATE_CACHE
    usd_cost_out = usage.output_tokens * USD_RATE_OUT
    usd_cost = usd_cost_in + usd_cost_out + usd_cost_cache
    
    # Update session totals
    session['total_WH'] = session.get('total_WH', 0) + wh_cost
    session['total_ML'] = session.get('total_ML', 0) + ml_cost
    session['total_CO2'] = session.get('total_CO2', 0) + co2_cost
    session['total_usd'] = session.get('total_usd', 0) + usd_cost
    session['total_tokens'] = session.get('total_tokens', 0) + query_tokens
    
    session['id'] = response.id
    
    if not PROD:
        import csv
        def log_csv(log_data):
            log_dir = 'logs'
            os.makedirs(log_dir, exist_ok=True)
            log_file = os.path.join(log_dir, 'logs.csv')
            prompt_file = os.path.join(log_dir, 'prompts.csv')
            file_exists = os.path.isfile(log_file)
            prompt_exists = os.path.isfile(prompt_file)

            with open(log_file, 'a', newline='', encoding='utf-8') as csvfile:
                fieldnames = [
                    'id', 'timestamp', 'wh', 'ml', 'g_co2', 'usd_in', 'usd_cache', 'usd_out', 'tokens',
                    'input_tokens', 'input_tokens_tokenizer', 'output_tokens', 'output_tokens_tokenizer', 'cached_tokens',
                    'total_wh', 'total_ml', 'total_co2', 'total_usd', 'total_tokens', 'total_cached_tokens'
                ]
                writer_log = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')

                if not file_exists:
                    writer_log.writeheader()

                writer_log.writerow(log_data)
                
            with open(prompt_file, 'a', newline='', encoding='utf-8') as csvfile:
                fieldnames_prompt = ['id', 'timestamp', 'prompt', 'response']
                writer_prompt = csv.DictWriter(csvfile, fieldnames=fieldnames_prompt)

                if not prompt_exists:
                    writer_prompt.writeheader()

                writer_prompt.writerow({
                    'id': log_data['id'],
                    'timestamp': log_data['timestamp'],
                    'prompt': log_data['prompt'],
                    'response': log_data['response']
                })

        log_data = {
            'id': response.id,
            'timestamp': response.created_at,
            'prompt': prompt,
            'response': output_text,
            'wh': wh_cost,
            'ml': ml_cost,
            'g_co2': co2_cost,
            'usd_in': usd_cost_in,
            'usd_cache': usd_cost_cache,
            'usd_out': usd_cost_out,
            'tokens': query_tokens,
            'input_tokens': usage.input_tokens,
            'input_tokens_tokenizer': input_tokenizer,
            'output_tokens': usage.output_tokens,
            'output_tokens_tokenizer': output_tokenizer,
            'cached_tokens': cached_tokens,
            'total_wh': session['total_WH'],
            'total_ml': session['total_ML'],
            'total_co2': session['total_CO2'],
            'total_usd': session['total_usd'],
            'total_tokens': session['total_tokens'],
            'total_cached_tokens': session['cached_tokens']
        }
    
        log_csv(log_data)

    return {
        "response_text": output_text,
        
        # Cumulative totals
        "total_wh": f"{session['total_WH']:.3f}",
        "total_ml": f"{session['total_ML']:.3f}",
        "total_co2": f"{session['total_CO2']:.4f}",
        "total_usd": f"{session['total_usd']:.5f}",
        "total_tokens": session['total_tokens'],
        
        # Marginal costs
        "inc_wh": f"{wh_cost:.3f}",
        "inc_ml": f"{ml_cost:.3f}",
        "inc_co2": f"{co2_cost:.4f}",
        "inc_usd": f"{usd_cost:.5f}",
        "inc_tokens": query_tokens,
        
        "input_tokens": input_tokenizer,
        "output_tokens": usage.output_tokens,
        "cached_tokens": session['cached_tokens']
    }
    
if __name__ == '__main__':
    app.run(debug=True)