## 📈 Metrics

AI models interpret language through units called tokens. Tokens can be thought of as pieces of words. To estimate the environmental impact of a model like GPT-5, we first must derive a figure that represents its energy consumption per token.

Since OpenAI uses Microsoft Azure data centers, we can use our energy cost per token and use Microsoft's public data on water consumption and greenhouse emissions to calculate the full environmental cost.

---
### ⚡ Watt Hours of Energy (Wh)

The University of Rhode Island's AI lab provides query resource estimates for OpenAI models GPT-5 & GPT-4o. Assuming a standard query is 1,000 tokens, we can derive the energy cost per token as follows:

-   **ChatGPT-5**: $18 \frac{\text{Wh}}{\text{query}} \times \frac{\text{query}}{1000 \text{\ tokens}}= \fbox{0.018 \text{\ Wh/token}}$

-   **GPT-4o**: $0.60 \frac{\text{Wh}}{\text{query}} \times \frac{\text{query}}{1000 \text{\ tokens}} = \fbox{0.0006 \text{\ Wh/token}}$

The app will use GPT-5's energy estimate to calculate statistics, but will actually be running GPT-4o on the backend to conserve resources (30x more efficient)

---
### 💧 Milliliters of Water (mL)

The Water Use Effectiveness (WUE) is an industry metric measuring a facilities rate of water consumed (L) relative to energy consumed (kWh).

**Microsoft Azure WUE**: $0.30 \frac{\text{L}}{\text{kWh}} \times \frac{kWh}{1000 \text{mL}} \times \frac{\text{kWh}}{1000 \text{Wh}} = \fbox{0.30 mL/Wh}$


---
### 🌎 Emissions (g CO₂e)

The Carbon Intensity Factor (CIF) is an industry metric measuring a facilities greenhouse gas emissions (kg CO₂e) relative to energy consumed (kWh).

**Microsoft Azure CIF**: $0.3528 \frac{\text{kg CO₂e}}{\text{kWh}} \times \frac{1000 \text{g}}{\text{kg}} \times \frac{\text{kWh}}{1000\text{Wh}} = \fbox{0.3528 \text{\ g CO₂e/Wh}}$

---
### 💵 USD Cost per Token ($)

The API pricing by model are available from OpenAI:

$\$1.250 / \text{1M tokens}$

1. **GPT-5**:
     -   **Input**: $\frac{\$1.250}{1\text{M tokens}} \times \frac{\text{tokens}}{1000000} = \fbox{\$0.00000125/\text{token}}$
     -   **Cached input**: $\$0.125 / \text{1M tokens} = \fbox{\$0.000000125/\text{token}}$
     -   **Output**: $\$10.000 / 1\text{M tokens} = \fbox{\$0.00001/\text{token}}$

2.  **GPT-4o**:
      -   **Input**: 
      -   **Cached input**: \$1.250 / 1M tokens = $\fbox{\$0.00000125/\text{token}}$
      -   **Output**: \$10.000 / 1M tokens = $\fbox{\$0.00001/\text{token}}$


|   Model    |    Input   |    Output    | Cached |
| :--------: | :--------: | :----------: | :----: |
| **GPT-5**  | $0.00000125 | $0.00001  | $0.000000125
| **GPT-4o** | $0.0000025 | $0.00001 | $0.00000125 | 

---
### ⭐ Impact per Token

| Metric       | High-End Model (GPT-5) | High-Efficiency Model (GPT-4o) |
| :----------- | :--------------------- | :----------------------------- |
| **⚡ Energy** | 0.018 Wh           | 0.0006 Wh                   |
| **💧 Water**  | 0.0054 mL          | 0.00018 mL                 |
| **🌎 Emissions**    | 0.0064 g CO₂e          | 0.00021 g CO₂e                 |
| **💵 Cost**    | 0.0064 g CO₂e          | 0.00021 g CO₂e                  |

---
#### 📚 Sources:
1.  [How Hungry is Al? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference](https://github.com/hari3mo/EcoGPT/blob/fd3fc5ee7c3d727a3ca5301d5647ac88e7afcad8/docs/benchmarks.pdf)
2.  [Model Consumption & Comparison Dashboard](https://app.powerbi.com/view?r=eyJrIjoiZjVmOTI0MmMtY2U2Mi00ZTE2LTk2MGYtY2ZjNDMzODZkMjlmIiwidCI6IjQyNmQyYThkLTljY2QtNDI1NS04OTNkLTA2ODZhMzJjMTY4ZCIsImMiOjF9)
3.  [OpenAI will not disclose GPT-5’s energy use. It could be higher than past models](https://www.theguardian.com/technology/2025/aug/09/open-ai-chat-gpt5-energy-use)
4.  [Measuring datacenter energy and water use to improve Microsoft Cloud sustainability](https://datacenters.microsoft.com/sustainability/efficiency/)
5.  [How much carbon dioxide is produced per kilowatthour of U.S. electricity generation?](https://www.eia.gov/tools/faqs/faq.php?id=74&t=11)
6.  [Microsoft 2024 Environmental Sustainability Report](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/presentations/CSR/2024-Environmental-Sustainability-Report-Data-Fact.pdf)
7.  [OpenAI API Pricing](https://platform.openai.com/docs/pricing)

This video explains how researchers are working to understand and benchmark the energy consumption of these large-scale AI models.
[How GPT-5 "Thinks"](https://www.youtube.com/watch?v=RqWIvvv3SnQ)