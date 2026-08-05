-- Initial application schema.
--
-- This is the *application* database: entities the site serves and humans
-- correct. Aggregate price benchmarks are computed by the pipeline in DuckDB
-- over Parquet and are not stored here.

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Instansi: ministries, provinces, regencies, cities, agencies.
CREATE TABLE agency (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            text UNIQUE,
    name            text NOT NULL,
    normalized_name text NOT NULL,
    level           text CHECK (level IN ('pusat', 'provinsi', 'kabupaten', 'kota', 'lainnya')),
    province        text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agency_normalized_name_idx ON agency (normalized_name);
CREATE INDEX agency_province_idx ON agency (province);

CREATE TRIGGER agency_set_updated_at
    BEFORE UPDATE ON agency
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- One row per real company, however many ways its name is written.
CREATE TABLE vendor (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    npwp            text UNIQUE,
    canonical_name  text NOT NULL,
    normalized_name text NOT NULL,
    entity_form     text CHECK (entity_form IN ('pt', 'cv', 'ud', 'koperasi', 'perorangan', 'lainnya')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vendor_normalized_name_idx ON vendor (normalized_name);

CREATE TRIGGER vendor_set_updated_at
    BEFORE UPDATE ON vendor
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- "PT. Anu Jaya", "PT ANU JAYA", "CV Anu Jaya Abadi" all point at one vendor.
-- normalized_name is unique so an alias can never resolve to two vendors.
CREATE TABLE vendor_alias (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vendor_id       bigint NOT NULL REFERENCES vendor (id) ON DELETE CASCADE,
    raw_name        text NOT NULL,
    normalized_name text NOT NULL UNIQUE,
    source          text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vendor_alias_vendor_id_idx ON vendor_alias (vendor_id);


-- Raw item text mapped to a canonical item. Rows written by the pipeline carry
-- source='auto'; corrections made in the admin dashboard carry source='manual'
-- and always win, so a re-run of the pipeline must never overwrite them.
CREATE TABLE item_normalization (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    raw_text           text NOT NULL UNIQUE,
    normalized_text    text NOT NULL,
    canonical_category text NOT NULL,
    brand              text,
    model              text,
    spec               jsonb NOT NULL DEFAULT '{}'::jsonb,
    unit               text,
    source             text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
    confidence         real CHECK (confidence >= 0 AND confidence <= 1),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX item_normalization_category_idx ON item_normalization (canonical_category);
CREATE INDEX item_normalization_source_idx ON item_normalization (source);

CREATE TRIGGER item_normalization_set_updated_at
    BEFORE UPDATE ON item_normalization
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- A procurement package as published by the source system.
CREATE TABLE package (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source             text NOT NULL,
    source_id          text NOT NULL,
    agency_id          bigint REFERENCES agency (id) ON DELETE SET NULL,
    vendor_id          bigint REFERENCES vendor (id) ON DELETE SET NULL,
    title              text NOT NULL,
    procurement_method text,
    fiscal_year        smallint NOT NULL,
    pagu_amount        numeric(20, 2) CHECK (pagu_amount >= 0),
    contract_amount    numeric(20, 2) CHECK (contract_amount >= 0),
    awarded_at         date,
    source_url         text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source, source_id)
);

CREATE INDEX package_agency_year_idx ON package (agency_id, fiscal_year);
CREATE INDEX package_vendor_year_idx ON package (vendor_id, fiscal_year);
CREATE INDEX package_fiscal_year_idx ON package (fiscal_year);

CREATE TRIGGER package_set_updated_at
    BEFORE UPDATE ON package
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Line items are where unit prices — and therefore benchmarks — come from.
CREATE TABLE line_item (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id      bigint NOT NULL REFERENCES package (id) ON DELETE CASCADE,
    normalization_id bigint REFERENCES item_normalization (id) ON DELETE SET NULL,
    line_no         integer,
    raw_description text NOT NULL,
    raw_unit        text,
    quantity        numeric(18, 4) CHECK (quantity > 0),
    unit_price      numeric(20, 2) CHECK (unit_price >= 0),
    total_price     numeric(20, 2) CHECK (total_price >= 0),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX line_item_package_id_idx ON line_item (package_id);
CREATE INDEX line_item_normalization_id_idx ON line_item (normalization_id);


CREATE TABLE app_user (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         text NOT NULL UNIQUE,
    display_name  text NOT NULL,
    password_hash text,
    role          text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'curator', 'viewer')),
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER app_user_set_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Findings reported by the public. Structure only for now; no endpoints yet.
CREATE TABLE report (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id  bigint REFERENCES package (id) ON DELETE CASCADE,
    line_item_id bigint REFERENCES line_item (id) ON DELETE CASCADE,
    reporter_id bigint REFERENCES app_user (id) ON DELETE SET NULL,
    reporter_email text,
    body        text NOT NULL,
    status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'valid', 'invalid', 'spam')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    CHECK (package_id IS NOT NULL OR line_item_id IS NOT NULL)
);

CREATE INDEX report_status_idx ON report (status);
CREATE INDEX report_package_id_idx ON report (package_id);
