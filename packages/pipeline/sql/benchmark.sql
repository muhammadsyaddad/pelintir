-- Price benchmarks per (canonical category x fiscal year x unit).
--
-- Expects a view or table named `normalized_items` with at least:
--   canonical_category, canonical_unit, fiscal_year, unit_price
-- `pipeline.benchmark.run()` registers it from Parquet.
--
-- Parameters: $min_group_size — groups smaller than this are not published.
-- A median over three rows is not a benchmark, it is an anecdote.

WITH base AS (
    SELECT
        canonical_category,
        canonical_unit,
        fiscal_year,
        unit_price
    FROM normalized_items
    WHERE unit_price IS NOT NULL
      AND unit_price > 0
      AND canonical_category IS NOT NULL
),

stats AS (
    SELECT
        canonical_category,
        canonical_unit,
        fiscal_year,
        count(*)                                AS n,
        quantile_cont(unit_price, 0.25)         AS p25,
        quantile_cont(unit_price, 0.50)         AS median_price,
        quantile_cont(unit_price, 0.75)         AS p75,
        min(unit_price)                         AS min_price,
        max(unit_price)                         AS max_price
    FROM base
    GROUP BY 1, 2, 3
),

-- Median absolute deviation, not standard deviation: procurement prices are
-- heavily skewed and a single 100x outlier would inflate a stddev enough to
-- hide every other outlier behind it.
deviation AS (
    SELECT
        b.canonical_category,
        b.canonical_unit,
        b.fiscal_year,
        quantile_cont(abs(b.unit_price - s.median_price), 0.50) AS mad
    FROM base b
    JOIN stats s
      ON  b.canonical_category = s.canonical_category
      AND b.canonical_unit     = s.canonical_unit
      AND b.fiscal_year        = s.fiscal_year
    GROUP BY 1, 2, 3
)

SELECT
    s.canonical_category,
    s.canonical_unit,
    s.fiscal_year,
    s.n,
    s.min_price,
    s.p25,
    s.median_price,
    s.p75,
    s.max_price,
    d.mad,
    -- Scaled MAD, comparable to a standard deviation for normal data.
    d.mad * 1.4826 AS mad_scaled
FROM stats s
JOIN deviation d
  ON  s.canonical_category = d.canonical_category
  AND s.canonical_unit     = d.canonical_unit
  AND s.fiscal_year        = d.fiscal_year
WHERE s.n >= $min_group_size
ORDER BY s.n DESC, s.canonical_category;
