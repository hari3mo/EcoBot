from google.oauth2.service_account import Credentials
from gspread_dataframe import set_with_dataframe
from sqlalchemy import create_engine
from dotenv import load_dotenv
import pandas as pd
import gspread
import json
import os
import subprocess

subprocess.run(["echo", 'hi bro'])

load_dotenv()
engine = create_engine(os.getenv('MYSQL_URI')).connect()

print("Pulling latest from database..")

logs = pd.read_sql_table('logs', con=engine).sort_values(by='datetime', ascending=False)
logs_dev = pd.read_sql_table('logs-dev', con=engine).sort_values(by='datetime', ascending=False)
prompts = pd.read_sql_table('prompts', con=engine).sort_values(by='datetime', ascending=False)
prompts_dev = pd.read_sql_table('prompts-dev', con=engine).sort_values(by='datetime', ascending=False)

logs.to_csv('logs.csv', index=False)
logs_dev.to_csv('logs-dev.csv', index=False)
prompts.to_csv('prompts.csv', index=False)
prompts_dev.to_csv('prompts-dev.csv', index=False)

print("Pulled latest from database and saved to CSV files.")

print("--------------------------------")

print("Pushing logs to Google Sheets...")

scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

creds_file = json.loads(os.getenv('GOOGLE_API_CREDENTIALS'))
creds = Credentials.from_service_account_info(creds_file, scopes=scopes)
client = gspread.authorize(creds)

worksheet_map = {
    'logs': ('logs.csv', 'prod'),
    'logs-dev': ('logs.csv', 'dev'),
    'prompts': ('prompts.csv', 'prod'),
    'prompts-dev': ('prompts.csv', 'dev')
}

for table_name, (sheet_name, worksheet_name) in worksheet_map.items():
    print(f"Processing table: {table_name} -> {sheet_name}, {worksheet_name}")
    df = pd.read_sql_table(table_name, con=engine).sort_values(by='datetime', ascending=False)
    df['datetime'] = df['datetime'].astype(str)
    sheet = client.open(sheet_name)
    worksheet = sheet.worksheet(worksheet_name)
    worksheet.clear()
    set_with_dataframe(worksheet, df, resize=True, include_index=False)
    # worksheet.update([df.columns.values.tolist()] + df.values.tolist(), value_input_option='RAW')
    print(f"Updated {worksheet_name} in {sheet_name}")

print("All sheets updated successfully.")

subprocess.run(["git", "add", "logs-dev.csv", "logs.csv"])
subprocess.run(["git", "commit", "-m", "logs"])

subprocess.run(["echo", 'bye bro'])