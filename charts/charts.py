from sqlalchemy import create_engine
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import subprocess
import os

load_dotenv()
engine = create_engine(os.getenv('MYSQL_URI')).connect()

logs = pd.concat([pd.read_sql_table('logs-dev', engine), pd.read_sql_table('logs', engine)], ignore_index=True)

df = logs.copy()
df['usd'] = df['usd_in'] + df['usd_out'] + df['usd_cache']
df['datetime'] = pd.to_datetime(df['datetime'])
df = df.sort_values(['datetime', 'id']).reset_index(drop=True)

# Tokens vs. resource consumption
metrics = ['usd','wh','ml','g_co2']
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

for i, m in enumerate(metrics):
    ax = axes[i // 2, i % 2]
    df.plot.scatter(x='tokens', y=m, title=f'{m} vs tokens', ax=ax)

    mean_y = df[m].mean()
    med_y = df[m].median()
    ax.axhline(mean_y, color='r', linestyle='--', label='Mean = {:.5f}'.format(mean_y))
    ax.axhline(med_y, color='g', linestyle=':', label='Median = {:.5f}'.format(med_y))

    # Simple linear fit
    t = df['tokens'].to_numpy()
    y = df[m].to_numpy()
    if np.isfinite(t).all() and np.isfinite(y).all() and t.sum() > 0:
        b1, b0 = np.polyfit(t, y, 1)
        xs = np.linspace(t.min(), t.max(), 100)
        ax.plot(xs, b1*xs + b0)

    ax.legend()

plt.tight_layout()
plt.savefig('charts/charts.png')

print("Staging changes charts.png...")
subprocess.run(["git", "add", "charts/charts.png"])

print("Committing changes...")
subprocess.run(["git", "commit", "-m", "charts"])
print('Committed changes as "charts"')

plt.show()

# Data are clustered around smaller token values (x-axis) due to shorter queries during testing
# However, there is a clear linear fit for each variable (positive relationship between resource consumption and token usage)

