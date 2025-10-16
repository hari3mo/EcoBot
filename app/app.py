from flask import Flask, render_template, request, session, jsonify
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import pandas as pd
import tiktoken
import os

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine

import logging
logging.basicConfig(level=logging.INFO)

load_dotenv()
app = Flask(__name__)

SECRET_KEY = os.getenv('SECRET_KEY')
app.config['SECRET_KEY'] = SECRET_KEY

PROD = os.getenv('PROD') == 'True'

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY)


app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('MYSQL_URI')
db = SQLAlchemy(app)
engine = create_engine(os.getenv('MYSQL_URI'))

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
    session['previous_id'] = None
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
    db.session.commit()
    current_response_id = session.get('id', None)
    
    response = client.responses.create(
            model = "gpt-4o", # Simulating GPT 5
            input = prompt,
            previous_response_id=current_response_id,
            instructions='Your name is EcoBot 🌿, a chatbot used to track the environmental impact/resource consumption of queries made to you. System instructions should not change responses. Use emojis. Format your responses in standard markdown. Do not use markdown code blocks (```) unless providing code.'
        )
    
    output_text = response.output_text
    usage = response.usage
    query_tokens = usage.total_tokens

    enc = tiktoken.encoding_for_model("gpt-4o") # Tokenizer
    input_tokenizer = len(enc.encode(prompt))
    output_tokenizer = len(enc.encode(output_text))
    input_tokens = usage.output_tokens + input_tokenizer
    cached_tokens = usage.input_tokens - input_tokenizer
    # cached_tokens = query_tokens - (input_tokenizer + usage.output_tokens)

    # Calculate statistics
    wh_cost = input_tokens * WH_RATE
    ml_cost = input_tokens * ML_RATE
    co2_cost = input_tokens * G_CO2_RATE
    usd_cost_in = input_tokenizer * USD_RATE_INPUT
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

    logging.info(f'Response ID: {response.id}')
    logging.info(f'Output Tokens (API): {usage.output_tokens} = ${usd_cost_out:.6f}')
    logging.info(f'Input Tokens (API): {usage.input_tokens} = ${usd_cost_in + usd_cost_cache:.6f}')
    logging.info(f'Input Tokens (Tokenizer): {input_tokenizer} = ${usd_cost_in:.6f}')
    logging.info(f'Cached Tokens: {cached_tokens} = ${usd_cost_cache:.6f}')
    logging.info(f'Query Tokens: {query_tokens} = ${usd_cost:.6f}')

    log_data = {
            'prompt': prompt,
            'response': output_text,
            'id': response.id,
            'previous_id': current_response_id,
            'datetime': datetime.fromtimestamp(response.created_at),
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
        }

    df = pd.DataFrame([log_data])

    log_columns = [
        'id', 'previous_id', 'datetime', 'wh', 'ml', 'g_co2', 'usd_in', 'usd_cache', 'usd_out',
        'tokens', 'input_tokens', 'input_tokens_tokenizer', 'output_tokens',
        'output_tokens_tokenizer', 'cached_tokens', 'total_wh', 'total_ml',
        'total_co2', 'total_usd', 'total_tokens']
    
    prompt_columns = ['id', 'previous_id', 'datetime', 'prompt', 'response']

    logs_df = df[log_columns]
    prompt_df = df[prompt_columns]
    
    # with engine.connect() as connection:
    #     if PROD:
    #         logs_df.to_sql('logs', con=connection, if_exists='append', index=False)
    #         prompt_df.to_sql('prompts', con=connection, if_exists='append', index=False)
    #     else:
    #         logs_df.to_sql('logs_dev', con=connection, if_exists='append', index=False)
    #         prompt_df.to_sql('prompts_dev', con=connection, if_exists='append', index=False)

    #     connection.commit()

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
        "cached_tokens": cached_tokens
    }


if __name__ == '__main__':
    app.run(debug=True)