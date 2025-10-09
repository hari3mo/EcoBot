from flask import Flask, render_template, request, session, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import pandas as pd
import tiktoken
import json
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
    session['cached_tokens'] += input_tokenizer + usage.output_tokens

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
    
    log_data = {
            'prompt': prompt,
            'response': output_text,
            'id': response.id,
            'timestamp': response.created_at,
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
    
    df = pd.DataFrame([log_data])
    logs = df.iloc[:, 2:]
    prompt = df[['id', 'timestamp', 'prompt', 'response']]
    
    if PROD:
        import gspread
        from google.oauth2.service_account import Credentials
        
        def append_to_gsheet(logs_df, prompts_df, sheet_name='logs.csv'):
            try:
                scopes = [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ]
                
                creds_json_str = os.getenv('GOOGLE_API_CREDENTIALS')
                if not creds_json_str:
                    return False

                creds_info = json.loads(creds_json_str)
                creds = Credentials.from_service_account_info(creds_info, scopes=scopes)
                client = gspread.authorize(creds)

                sheet = client.open(sheet_name)
                logs_sheet = sheet.worksheet('Logs')
                prompts_sheet = sheet.worksheet('Prompts')

                logs_row = logs_df.values.tolist()
                prompt_row = prompts_df.values.tolist()

                logs_sheet.append_rows(logs_row, value_input_option='RAW')
                prompts_sheet.append_rows(prompt_row, value_input_option='RAW')

                return True

            except Exception as e:
                return False

        append_to_gsheet(logs, prompt, sheet_name='logs.csv')
    
    else:
        import logging
        logging.basicConfig(level=logging.INFO)
        logging.info(f"Cached Tokens: {cached_tokens}, Aggregate Cached Tokens: {input_tokenizer + output_tokenizer}")
        
        logs.to_csv('logs/logs.csv', index=False, mode='a', header=not os.path.exists('logs/logs.csv'))
        prompt.to_csv('logs/prompts.csv', index=False, mode='a', header=not os.path.exists('logs/prompts.csv'))
    

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