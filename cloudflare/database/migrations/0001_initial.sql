CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instagram_posts (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS works_public_order ON works (is_published, sort_order, created_at);
CREATE INDEX IF NOT EXISTS instagram_public_order ON instagram_posts (is_published, sort_order, created_at);

INSERT OR IGNORE INTO works (id, title, description, image_url, image_alt, sort_order) VALUES
  ('kitchen', 'キッチンリフォーム', '明るく使いやすい、家族が集まるキッチンに。', 'assets/work-kitchen.webp', 'キッチンリフォームの事例', 4),
  ('bath', '洗面所リフォーム', '清潔感のある、快適な洗面空間に。', 'assets/work-bath.webp', '洗面所リフォームの施工前と施工後', 3),
  ('living', 'リビングコーディネート', 'ナチュラルで心地よい、家族のくつろぎ空間。', 'assets/work-living.webp', 'リビングコーディネートの事例', 2),
  ('bedroom', '寝室コーディネート', 'やすらぎを感じる、ホテルライクな空間に。', 'assets/work-bedroom.webp', '寝室コーディネートの事例', 1);

INSERT OR IGNORE INTO instagram_posts (id, url, caption, sort_order) VALUES
  ('instagram-1', 'https://www.instagram.com/stories/jyobu0120181147/3996762371091536031?utm_source=ig_story_item_share&stkn=MWZpOXM1amtsd2Fycg==', '', 1),
  ('instagram-2', 'https://www.instagram.com/reel/DdTK7YqBXXo/?stkn=dHE5ZXBmc2lrbG84', '', 2);
