DROP TABLE prompts;
DROP TABLE logs;

CREATE TABLE logs (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wh DECIMAL(18, 9),
    ml DECIMAL(18, 9),
    g_co2 DECIMAL(18, 9),
    usd_in DECIMAL(18, 9),
    usd_cache DECIMAL(18, 9),
    usd_out DECIMAL(18, 9),
    tokens INT,
    input_tokens INT,
    input_tokens_tokenizer INT,
    output_tokens INT,
    output_tokens_tokenizer INT,
    cached_tokens INT,
    total_wh DECIMAL(18, 9),
    total_ml DECIMAL(18, 9),
    total_co2 DECIMAL(18, 9),
    total_usd DECIMAL(18, 9),
    total_tokens INT,
    total_cached_tokens INT
);

-- Create prompts table (child table with foreign key)
CREATE TABLE prompts (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prompt TEXT,
    response TEXT,
    FOREIGN KEY (id) REFERENCES logs(id) ON DELETE CASCADE
);