-- name: UpsertInstrument :one
INSERT INTO instruments (id, symbol, asset_class, exchange, currency)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (symbol, exchange, asset_class)
DO UPDATE SET
    currency = EXCLUDED.currency
RETURNING id, symbol, asset_class, exchange, currency, created_at;

-- name: GetInstrumentBySymbolExchangeAssetClass :one
SELECT id, symbol, asset_class, exchange, currency, created_at
FROM instruments
WHERE symbol = $1
  AND (
    exchange = $2
    OR (exchange IS NULL AND $2::text IS NULL)
  )
  AND asset_class = $3;
