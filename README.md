# EcoBot 🌿

EcoBot is a Flask-based web application designed to track and visualize the environmental impact and resource consumption of AI queries of high-performace models like GPT-5. 

## 🚀 Features

* **Real-time Environmental Tracking**: Calculates the footprint of every chat interaction, including energy usage (Wh), water consumption (mL), and carbon emissions (g CO₂e) based on token usage.
* **Token-Based Cost Estimation**: Estimates USD costs for input, output, and cached tokens.
* **Usage Dashboard**: Provides analytics including daily time series stats, cost breakdowns, and token distributions.
* **Database Integration**: Logs all interactions and metrics to a MySQL databse.
* **Google Sheets Sync**: Integrated functionality to push database logs to Google Sheets.
* **Serverless Deployment**: Configured for seamless deployment on Vercel.

## 🛠️ Technical Stack

* **Backend**: Flask (Python)
* **AI Engine**: OpenAI API (simulating GPT-5 using a GPT-4o-mini backend)
* **Database**: MySQL with SQLAlchemy ORM
* **Data Processing**: Pandas, Tiktoken (for tokenization)
* **Frontend**: HTML, CSS, JavaScript (using Chart.js for dashboard visualizations)
