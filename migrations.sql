-- 2026-09-14 start
-- New picture puzzle image table. SMALLINT is used for deleted because Postgres has no TINYINT.
CREATE TABLE IF NOT EXISTS tblpicture_puzzle_image (
	id SERIAL PRIMARY KEY,
	blob BYTEA NOT NULL,
	user_id INTEGER NOT NULL,
	created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	deleted SMALLINT NOT NULL DEFAULT 0
);

COMMENT ON COLUMN tblpicture_puzzle_image.deleted IS '0 == not deleted, 1 == deleted';

CREATE INDEX IF NOT EXISTS tblpicture_puzzle_image_user_id ON tblpicture_puzzle_image (user_id);
-- 2026-09-14 end
