CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE laws (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(30) UNIQUE NOT NULL,    -- 'A-1', 'C-46', 'SOR-97-175'
    type            VARCHAR(20) NOT NULL,           -- 'act' or 'regulation'
    short_title_en  TEXT NOT NULL,
    short_title_fr  TEXT,
    long_title_en   TEXT,
    in_force        BOOLEAN DEFAULT TRUE,
    pit_date        DATE,
    last_amended    DATE,
    enabling_act_code VARCHAR(30),                  -- regulations: which act enables them
    xml_path        TEXT,
    ingested_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sections (
    id              SERIAL PRIMARY KEY,
    law_id          INTEGER NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
    lims_id         VARCHAR(50),                    -- unique within repo
    label           VARCHAR(50),                    -- '37', '2(1)', 'A.01.010'
    marginal_note   TEXT,                           -- human-readable section summary
    heading         TEXT,                           -- nearest parent Heading
    part_label      TEXT,
    part_title      TEXT,
    content_text    TEXT NOT NULL,                  -- flattened readable text
    content_xml     TEXT,                           -- raw XML for auditor pane
    chunk_type      VARCHAR(20) DEFAULT 'section',  -- section, definition, schedule
    definitions     JSONB DEFAULT '[]',
    cross_refs      JSONB DEFAULT '[]',
    embedding       vector(384),
    language        VARCHAR(3) DEFAULT 'en',
    token_count     INTEGER,
    ingested_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lims_id, language)
);

CREATE INDEX idx_sections_embedding ON sections
    USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
ALTER TABLE sections ADD COLUMN content_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content_text)) STORED;
CREATE INDEX idx_sections_fts ON sections USING gin(content_tsv);
CREATE INDEX idx_sections_law_id ON sections(law_id);
CREATE INDEX idx_sections_lims_id ON sections(lims_id);
CREATE INDEX idx_sections_language ON sections(language);

CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id              SERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL,           -- 'user' or 'assistant'
    content         TEXT NOT NULL,
    citations       JSONB DEFAULT '[]',
    confidence      VARCHAR(10),
    retrieved_ids   INTEGER[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
