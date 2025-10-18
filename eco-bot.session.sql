--@block--
CREATE TABLE logs (
    id VARCHAR(255) PRIMARY KEY,
    previous_id VARCHAR(255),
    datetime DATETIME,
    conversation_index: INT,
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
    total_tokens INT,
    total_wh DECIMAL(18, 9),
    total_ml DECIMAL(18, 9),
    total_co2 DECIMAL(18, 9),
    total_usd DECIMAL(18, 9)
);

--@block--
CREATE TABLE prompts (
    id VARCHAR(255) PRIMARY KEY,
    previous_id VARCHAR(255),
    datetime DATETIME,
    prompt TEXT,
    response TEXT,
    FOREIGN KEY (id) REFERENCES logs(id)
);

--@block--
CREATE TABLE `logs-dev` (
    id VARCHAR(255) PRIMARY KEY,
    previous_id VARCHAR(255),
    datetime DATETIME,
    conversation_index INT,
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
    total_tokens INT,
    total_wh DECIMAL(18, 9),
    total_ml DECIMAL(18, 9),
    total_co2 DECIMAL(18, 9),
    total_usd DECIMAL(18, 9)
);

--@block--
CREATE TABLE `prompts-dev` (
    id VARCHAR(255) PRIMARY KEY,
    previous_id VARCHAR(255),
    datetime DATETIME,
    prompt TEXT,
    response TEXT,
    FOREIGN KEY (id) REFERENCES `logs-dev`(id)
);

--@block--
-- DELETE FROM prompts;
-- DELETE FROM logs;
-- DELETE FROM `prompts-dev`;
-- DELETE FROM `logs-dev`;

--@block--
-- DROP TABLE prompts;
-- DROP TABLE logs;
-- DROP TABLE `prompts-dev`;
-- DROP TABLE `logs-dev`;