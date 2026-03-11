ALTER TABLE marketplace_skill_files
  ADD COLUMN storage_backend TEXT NOT NULL DEFAULT 'd1-inline'
  CHECK (storage_backend IN ('d1-inline', 'r2'));

ALTER TABLE marketplace_skill_files
  ADD COLUMN r2_key TEXT;

ALTER TABLE marketplace_skill_files
  ADD COLUMN size_bytes INTEGER;

CREATE INDEX IF NOT EXISTS idx_marketplace_skill_files_r2_key
  ON marketplace_skill_files(r2_key);

CREATE INDEX IF NOT EXISTS idx_marketplace_skill_files_backend
  ON marketplace_skill_files(storage_backend);
