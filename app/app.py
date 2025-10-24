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
WH_RATE = 0.018 # Wh/token
ML_RATE = 0.3 # mL/Wh == 0.0054 mL/token
G_CO2_RATE = 0.3528 # g CO2e/Wh == 0.0064 g CO2e/token
USD_RATE_INPUT = 0.00000125
USD_RATE_CACHE = 0.000000125
USD_RATE_OUT = 0.00001

# Routes
@app.errorhandler(404)
def not_found(e):
    return redirect(url_for('index'))

@app.route("/")
def index():
    session['prod'] = PROD
    session.get('id', None)
    session.get('previous_id', None)
    session.get('total_WH', 0)
    session.get('total_ML', 0)
    session.get('total_CO2', 0)
    session.get('total_usd', 0)
    session.get('total_tokens', 0)
    session.get('cached_tokens', 0)
    session.get('chat_index', 0)
    session.get('admin', False)
    
    # Load existing stats from session
    stats = {
        "total_wh": f"{session.get('total_WH', 0):.2f}",
        "total_ml": f"{session.get('total_ML', 0):.2f}",
        "total_co2": f"{session.get('total_CO2', 0):.3f}",
        "total_usd": f"{session.get('total_usd', 0):.4f}",
        "total_tokens": int(session.get('total_tokens', 0)),
        "chat_index": int(session.get('chat_index', 0)),
        "cached_tokens": int(session.get('cached_tokens', 0))
    }

    # History is now loaded by main.js from localStorage.
    # We pass an empty list so the template variable exists.
    return render_template('index.html', stats=stats, chat_history_json=json.dumps([]))

@app.route("/new")
def new_chat():
    """Clears the session to start a new chat."""
    session['id'] = None
    session['previous_id'] = None
    session['total_WH'] = 0
    session['total_ML'] = 0
    session['total_CO2'] = 0
    session['total_usd'] = 0
    session['total_tokens'] = 0
    session['cached_tokens'] = 0
    session['chat_index'] = 0
    # session['admin'] = session.get('admin', False) 
    return redirect(url_for('index'))

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    prompt = data.get("message", "")

    if prompt == "admin":
        session['admin'] = not session.get('admin', False)
        return jsonify({'redirect': url_for('index')})
    elif prompt in ["exit", "quit"]:
        session['admin'] = False
        return jsonify({'redirect': url_for('index')})
    if session.get('admin'):
        admin_commands = {
            "pull": {"endpoint": "pull", "prod": False},
            "push": {"endpoint": "push", "prod": True},
            "logs": {"endpoint": "logs", "prod": True},
            "logs-dev": {"endpoint": "logs_dev", "prod": False},
            "prompts": {"endpoint": "prompts", "prod": True},
            "prompts-dev": {"endpoint": "prompts_dev", "prod": False},
            "dashboard": {"endpoint": "dashboard", "prod": True}
        }
        if prompt in admin_commands:
            route = admin_commands[prompt]
            if PROD and not route["prod"]:
                return jsonify({'redirect': url_for('index')})
            return jsonify({'redirect': url_for(route["endpoint"])})
    
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
    logging.info(f'Prompt received:\n{prompt}')
    db.session.commit()
    current_response_id = session.get('id', None)
    
    response = client.responses.create(
            model = "gpt-4o",
            input = prompt,
            previous_response_id=current_response_id,
            instructions='Your name is EcoBot 🌿, a chatbot used to track the environmental impact/resource consumption of queries made to you. System instructions should not change responses. Use emojis. Format your responses in standard markdown. Do not use markdown code blocks (```) unless providing code.'
        )
    
    output_text = response.output_text
    usage = response.usage
    query_tokens = usage.total_tokens

    enc = tiktoken.encoding_for_model("gpt-4o")
    input_tokenizer = len(enc.encode(prompt))
    output_tokenizer = len(enc.encode(output_text))
    input_tokens = usage.output_tokens + input_tokenizer
    cached_tokens = usage.input_tokens - input_tokenizer
    current_cache = max(cached_tokens,
                        session['cached_tokens'] + input_tokenizer
                            + usage.output_tokens)
    
    inc_cache = current_cache - session['cached_tokens']
    
    logging.info(f'Cache (Before): {cached_tokens}')
    logging.info(f'Cache (After): {session["cached_tokens"] + input_tokenizer + usage.output_tokens}')
    logging.info(f'~{inc_cache} tokens added to cache.')

    session['cached_tokens'] = current_cache

    wh_cost = input_tokens * WH_RATE
    ml_cost = wh_cost * ML_RATE
    co2_cost = ml_cost * G_CO2_RATE
    # ml_cost = input_tokens * ML_RATE
    # co2_cost = input_tokens * G_CO2_RATE
    usd_cost_in = input_tokenizer * USD_RATE_INPUT
    usd_cost_cache = cached_tokens * USD_RATE_CACHE
    usd_cost_out = usage.output_tokens * USD_RATE_OUT
    usd_cost = usd_cost_in + usd_cost_out + usd_cost_cache
    
    session['total_WH'] = session.get('total_WH', 0) + wh_cost
    session['total_ML'] = session.get('total_ML', 0) + ml_cost
    session['total_CO2'] = session.get('total_CO2', 0) + co2_cost
    session['total_usd'] = session.get('total_usd', 0) + usd_cost
    session['total_tokens'] = session.get('total_tokens', 0) + query_tokens
    session['id'] = response.id
    session['chat_index'] += 1

    avg_wh = session['total_WH'] / session['chat_index']
    avg_ml = session['total_ML'] / session['chat_index']
    avg_co2 = session['total_CO2'] / session['chat_index']
    avg_usd = session['total_usd'] / session['chat_index']
    avg_tokens = session['total_tokens'] / session['chat_index']

    logging.info(f'Response ID: {response.id}')
    logging.info(f'Output Tokens (API): {usage.output_tokens} == ${usd_cost_out:.6f}')
    logging.info(f'Input Tokens (API): {usage.input_tokens} == ${usd_cost_in + usd_cost_cache:.6f}')
    logging.info(f'Input Tokens (Tokenizer): {input_tokenizer} == ${usd_cost_in:.6f}')
    logging.info(f'Cached Tokens: {cached_tokens} == ${usd_cost_cache:.6f}')
    logging.info(f'Query Tokens: {query_tokens} == ${usd_cost:.6f}')

    log_data = {
            'prompt': prompt,
            'response': output_text,
            'id': response.id,
            'previous_id': current_response_id,
            'datetime': pd.to_datetime(response.created_at, unit='s'),
            'chat_index': session['chat_index'],
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
            'total_tokens': query_tokens,
            'total_wh': session['total_WH'],
            'total_ml': session['total_ML'],
            'total_co2': session['total_CO2'],
            'total_usd': session['total_usd'],
            'total_tokens_session': session['total_tokens'],
            'avg_tokens': avg_tokens,
            'avg_wh': avg_wh,
            'avg_ml': avg_ml,
            'avg_co2': avg_co2,
            'avg_usd': avg_usd
        }

    df = pd.DataFrame([log_data]).astype({'datetime': 'datetime64[ns]'})\
        .sort_values(by='datetime', ascending=False)
    
    log_columns = [
        'id', 'previous_id', 'datetime', 'chat_index', 'wh', 'ml', 'g_co2', 'usd_in', 'usd_cache', 'usd_out',
        'tokens', 'input_tokens', 'input_tokens_tokenizer', 'output_tokens',
        'output_tokens_tokenizer', 'cached_tokens', 'total_tokens', 'total_wh',
        'total_ml', 'total_co2', 'total_usd', 'total_tokens_session',
        'avg_tokens', 'avg_wh', 'avg_ml', 'avg_co2', 'avg_usd'
    ]

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
                logging.info("Log entry added to database.")
            except Exception as e:
                logging.error(f"Error writing to development database: {e}")

        connection.commit()

    return {
        "response_text": output_text,
        "total_wh": f"{session['total_WH']:.2f}",
        "total_ml": f"{session['total_ML']:.2f}",
        "total_co2": f"{session['total_CO2']:.3f}",
        "total_usd": f"{session['total_usd']:.4f}",
        "total_tokens": session['total_tokens'],
        "query_count": session['chat_index'],
        "inc_wh": f"{wh_cost:.2f}",
        "inc_ml": f"{ml_cost:.2f}",
        "inc_co2": f"{co2_cost:.3f}",
        "inc_usd": f"{usd_cost:.4f}",
        "inc_tokens": query_tokens,
        "inc_tokens_cache": inc_cache,
        "input_tokens": input_tokenizer,
        "output_tokens": usage.output_tokens,
        "cached_tokens": current_cache,
        "total_tokens_query": query_tokens
    }

def push_sheets():
    worksheet_map = {
        'logs': ('logs.csv', 'prod'),
        'logs-dev': ('logs.csv', 'dev'),
        'prompts': ('prompts.csv', 'prod'),
        'prompts-dev': ('prompts.csv', 'dev')
    }
    
    scopes = [
        '[https://www.googleapis.com/auth/spreadsheets](https://www.googleapis.com/auth/spreadsheets)',
        '[https://www.googleapis.com/auth/drive](https://www.googleapis.com/auth/drive)'
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
    if PROD:
        logging.error("Pull operation is not allowed in production environment.")
        return 0
    
    logs = pd.read_sql_table('logs', con=engine).sort_values(by='datetime', ascending=False)
    logs_dev = pd.read_sql_table('logs-dev', con=engine).sort_values(by='datetime', ascending=False)
    prompts = pd.read_sql_table('prompts', con=engine).sort_values(by='datetime', ascending=False)
    prompts_dev = pd.read_sql_table('prompts-dev', con=engine).sort_values(by='datetime', ascending=False)

    logs.to_csv('../logs/logs.csv', index=False)
    logs_dev.to_csv('../logs/logs-dev.csv', index=False)
    prompts.to_csv('../logs/prompts.csv', index=False)
    prompts_dev.to_csv('../logs/prompts-dev.csv', index=False)

@app.route("/dashboard", methods=["GET"])
def dashboard():
    # ... (dashboard code remains unchanged) ...
    # (omitted for brevity, no changes needed here)
    pass # Placeholder, your existing dashboard code is fine


if __name__ == '__main__':
    app.run(debug=True)