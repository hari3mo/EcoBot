from sqlalchemy import create_engine
from dotenv import load_dotenv
import pandas as pd
import os
import logging
logging.basicConfig(level=logging.INFO)

load_dotenv()
engine = create_engine(os.getenv('MYSQL_URI')).connect()

print("Pulling latest from database..")
logging.info("Connecting to database at %s", os.getenv('MYSQL_URI'))

logs = pd.read_sql_table('logs', con=engine).sort_values(by='datetime', ascending=False)
logs_dev = pd.read_sql_table('logs-dev', con=engine).sort_values(by='datetime', ascending=False)
prompts = pd.read_sql_table('prompts', con=engine).sort_values(by='datetime', ascending=False)
prompts_dev = pd.read_sql_table('prompts-dev', con=engine).sort_values(by='datetime', ascending=False)

logs.to_csv('/Users/harissaif/Library/Mobile Documents/com~apple~CloudDocs/School/UCSD/Fall 2025/SYN 100/EcoGPT/logs/logs.csv', index=False)
logs_dev.to_csv('/Users/harissaif/Library/Mobile Documents/com~apple~CloudDocs/School/UCSD/Fall 2025/SYN 100/EcoGPT/logs/logs-dev.csv', index=False)
prompts.to_csv('/Users/harissaif/Library/Mobile Documents/com~apple~CloudDocs/School/UCSD/Fall 2025/SYN 100/EcoGPT/logs/prompts.csv', index=False)
prompts_dev.to_csv('/Users/harissaif/Library/Mobile Documents/com~apple~CloudDocs/School/UCSD/Fall 2025/SYN 100/EcoGPT/logs/prompts-dev.csv', index=False)

print("Pulled latest from database and saved to CSV files.")