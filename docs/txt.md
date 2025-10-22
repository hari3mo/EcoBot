## 📈 Metrics

AI models interpet lanauge through a unit known as a token. We can think of tokens as pieces of words.

It's the vocabulary the AI actually understands.

While OpenAI does not release official figures for their models, we do know they use Microsoft Azure's cloud computing and database servers. Microsoft, however, publically releases water consumption/emissions analytics from their data centers.

---
#### ⚡ Watt Hours of Energy (Wh)

The University of Rhode Island's AI lab estimates resources used by OpenAI's GPT-5 & GPT-4o models to be approximately 18 Wh/query & 0.6Wh/query. If we assume a query to be 1000 tokens, we are left with the following rates per token:

- **ChatGPT-5**: $18 \frac{Wh}{query} \times 1000 \frac{tokens}{query} = \boxed{0.0018 \frac{Wh}{token}}$
> Model for which stats are estimated

- **GPT-4o**: $0.6 \frac{Wh}{query} \times 1000 \frac{token}{query} = \boxed{0.0006 {\frac{Wh}{token}}}$
> Actual backend to conserve resources (30x more efficient)

---
#### 💧 Milliliters of Water (m)  

**Water Use Effectiveness (WUE)**: Standard metric that measures the relationship between a facility's water consumption and the energy consumed by its IT equipment.

- **Microsoft Azure WUE**:  $0.30 \frac{L}{kWh} = \boxed{0.30 \frac{mL}{Wh}}$  
---

#### 🌎 CO2 Emissions (g CO2)

**Carbon Intensity Factor (CIF)**: Standard metric that measures the amount of greenhouse gas emissions produced relative to a specific unit of activity.

- **Microsoft Azure CIF**: $0.3528 \frac{kg CO_{2}e}{kWh} = \boxed{0.3528 \frac{g CO_{2}}{Wh}}$

  
---
#### 💵 USD Cost per Token ($)

The pricing per token for the ChatGPT 5 API is publicly available on the OpenAI API website.

- **Input**: $\$1.250 / 1\text{M tokens} = \fbox{\$0.00000125/\text{token}}$

- **Cached input**: $\$0.125 / 1\text{M tokens} = \fbox{\$0.000000125/\text{token}}$

- **Output**: $\$10.000 / 1\text{M tokens} = \fbox{\$0.00001/\text{token}}$

---
#### 📚 Sources:
1. (https://github.com/hari3mo/EcoGPT/blob/fd3fc5ee7c3d727a3ca5301d5647ac88e7afcad8/docs/benchmarks.pdf)
2. (https://app.powerbi.com/view?r=eyJrIjoiZjVmOTI0MmMtY2U2Mi00ZTE2LTk2MGYtY2ZjNDMzODZkMjlmIiwidCI6IjQyNmQyYThkLTljY2QtNDI1NS04OTNkLTA2ODZhMzJjMTY4ZCIsImMiOjF9)
3. (https://www.theguardian.com/technology/2025/aug/09/open-ai-chat-gpt5-energy-use)
4. (https://datacenters.microsoft.com/sustainability/efficiency/)
5. (https://www.eia.gov/tools/faqs/faq.php?id=74&t=11)
6. (https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/2024-Environmental-Sustainability-Report-Data-Fact.pdf)
7. (https://openai.com/api/pricing/)
