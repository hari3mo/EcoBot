from flask import Flask, render_template, request, session, redirect, jsonify, url_for
from google.oauth2.service_account import Credentials
from gspread_dataframe import set_with_dataframe
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import pandas as pd
import gspread
import tiktoken
import json
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
@app.errorhandler(404)
def not_found(e):
    return redirect(url_for('index'))

@app.route("/")
def index():
    session['id'] = None
    session['previous_id'] = None
    session['total_WH'] = 0
    session['total_ML'] = 0
    session['total_CO2'] = 0
    session['total_usd'] = 0
    session['total_tokens'] = 0
    return render_template('index.html')

@app.route("/chat", methods=["POST"])
def chat():
    prompt = request.form["prompt"]
    if prompt == "admin":
        session['admin'] = True if not session['admin'] else False
        return jsonify({'redirect': url_for('index')})
    
    elif prompt in ["exit", "quit"]:
        session['admin'] = False
        return jsonify({'redirect': url_for('index')})
    
    if session.get('admin'):
        admin_commands = {
            # command: {url_endpoint, allowed_in_prod}
            "pull": {"endpoint": "pull", "prod": False},
            "push": {"endpoint": "push", "prod": True},
            "logs": {"endpoint": "logs", "prod": True},
            "logs-dev": {"endpoint": "logs_dev", "prod": False},
            "prompts": {"endpoint": "prompts", "prod": True},
            "prompts-dev": {"endpoint": "prompts_dev", "prod": False}
        }

        if prompt in admin_commands:
            command = admin_commands[prompt]
            if PROD and not command["prod"]:
                return jsonify({'redirect': url_for('index')})
            return jsonify({'redirect': url_for(command["endpoint"])})
    
    response_data = query(prompt)
    return jsonify(response_data)

@app.route("/push", methods=["GET"])
def push():
    if not session.get('admin'):
        return redirect(url_for('index'))
    try:
        push_sheets()
        logging.info("All sheets updated successfully.")
    except Exception as e:
        logging.error(f"Error pushing to Google Sheets: {e}")
        return render_template("push.html", success=False)

    return render_template("push.html", success=True)

@app.route("/pull", methods=["GET"])
def pull():
    if PROD or not session.get('admin'):
        return redirect(url_for('index'))
    
    try:
        pull_db()
        logging.info("Database pulled successfully to local CSV files.")
    except Exception as e:
        logging.error(f"Error pulling database: {e}")
        return render_template("pull.html", success=False)

    return render_template("pull.html", success=True)

@app.route("/logs", methods=["GET"])
def logs():
    if not session.get('admin'):
        return redirect(url_for('index'))
    logs = pd.read_sql_table('logs', con=engine)\
        .sort_values(by='datetime', ascending=False)
    return render_template("logs.html", logs=logs)

@app.route("/logs-dev", methods=["GET"])
def logs_dev():
    if not session.get('admin'):
        return redirect(url_for('index'))
    logs_dev = pd.read_sql_table('logs-dev', con=engine)\
        .sort_values(by='datetime', ascending=False)
    return render_template("logs_dev.html", logs_dev=logs_dev)

@app.route("/prompts", methods=["GET"])
def prompts():
    if not session.get('admin'):
        return redirect(url_for('index'))
    prompts = pd.read_sql_table('prompts', con=engine)\
        .sort_values(by='datetime', ascending=False)
    return render_template("prompts.html", prompts=prompts)

@app.route("/prompts-dev", methods=["GET"])
def prompts_dev():
    if not session.get('admin'):
        return redirect(url_for('index'))
    prompts_dev = pd.read_sql_table('prompts-dev', con=engine)\
        .sort_values(by='datetime', ascending=False)
    return render_template("prompts_dev.html", prompts_dev=prompts_dev)


def query(prompt):
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

    df = pd.DataFrame([log_data]).astype({'datetime': 'datetime64[ns]'})\
        .sort_values(by='datetime', ascending=False)

    log_columns = [
        'id', 'previous_id', 'datetime', 'wh', 'ml', 'g_co2', 'usd_in', 'usd_cache', 'usd_out',
        'tokens', 'input_tokens', 'input_tokens_tokenizer', 'output_tokens',
        'output_tokens_tokenizer', 'cached_tokens', 'total_wh', 'total_ml',
        'total_co2', 'total_usd', 'total_tokens']
    
    prompt_columns = ['id', 'previous_id', 'datetime', 'prompt', 'response']

    logs_df = df[log_columns]
    prompt_df = df[prompt_columns]
    
    with engine.connect() as connection:
        if PROD:
            try:
                logs_df.to_sql('logs', con=connection, if_exists='append', index=False)
                prompt_df.to_sql('prompts', con=connection, if_exists='append', index=False)
            except Exception as e:
                logging.error(f"Error writing to production database: {e}")
        else:
            try:
                logs_df.to_sql('logs-dev', con=connection, if_exists='append', index=False)
                prompt_df.to_sql('prompts-dev', con=connection, if_exists='append', index=False)
            except Exception as e:
                logging.error(f"Error writing to development database: {e}")

        connection.commit()

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

def push_sheets():
    worksheet_map = {
        'logs': ('logs.csv', 'prod'),
        'logs-dev': ('logs.csv', 'dev'),
        'prompts': ('prompts.csv', 'prod'),
        'prompts-dev': ('prompts.csv', 'dev')
    }
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    creds_json = json.loads(os.getenv('GOOGLE_API_CREDENTIALS'))
    creds = Credentials.from_service_account_info(creds_json, scopes=scopes)
    gc = gspread.authorize(creds)

    for table_name, (sheet_name, worksheet_name) in worksheet_map.items():
        logging.info(f"Processing table: {table_name} -> {sheet_name}, {worksheet_name}")

        df = pd.read_sql_table(table_name, con=engine).sort_values(by='datetime', ascending=False)
        df['datetime'] = df['datetime'].astype(str)

        sheet = gc.open(sheet_name)
        worksheet = sheet.worksheet(worksheet_name)
        set_with_dataframe(worksheet, df, resize=True, include_index=False)

        logging.info(f"Updated {worksheet_name} in {sheet_name}")

def pull_db():
    logs = pd.read_sql_table('logs', con=engine).sort_values(by='datetime', ascending=False)
    logs_dev = pd.read_sql_table('logs-dev', con=engine).sort_values(by='datetime', ascending=False)
    prompts = pd.read_sql_table('prompts', con=engine).sort_values(by='datetime', ascending=False)
    prompts_dev = pd.read_sql_table('prompts-dev', con=engine).sort_values(by='datetime', ascending=False)

    logs.to_csv('../logs/logs.csv', index=False)
    logs_dev.to_csv('../logs/logs_dev.csv', index=False)
    prompts.to_csv('../logs/prompts.csv', index=False)
    prompts_dev.to_csv('../logs/prompts_dev.csv', index=False)

    
if __name__ == '__main__':
    app.run(debug=True)