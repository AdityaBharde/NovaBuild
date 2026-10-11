INSERT INTO plan (id, name, stripe_price_id, max_projects, max_tokens_per_day, max_previews, unlimited_ai, active)
VALUES
    (1, 'Pro Plan', 'price_1TxWRkRtRKfmvNxlPXtP7g4f', 10, 1000000, 3, true, true),
    (2, 'Business Plan', 'price_1TxWZDRtRKfmvNxlQYerhkN2', 50, 10000000, 10, true, true)
    ON CONFLICT (id) DO NOTHING;