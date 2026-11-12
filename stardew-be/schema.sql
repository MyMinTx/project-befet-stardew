
CREATE UNIQUE INDEX uq_members_email ON members (lower(email));

CREATE TABLE items (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    category     VARCHAR(20)  NOT NULL CHECK (category IN ('crop','forage','fish','mineral','artisan','cooking','resource','other')),
    description  TEXT,
    image_url    VARCHAR(500),
    sell_price   INTEGER      NOT NULL DEFAULT 0 CHECK (sell_price >= 0),
    seasons      TEXT[]       NOT NULL DEFAULT '{}',    -- {'spring','summer'}
    source       VARCHAR(255),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_name_lower ON items (lower(name));

CREATE TABLE npcs (
    id               BIGSERIAL    PRIMARY KEY,
    name             VARCHAR(50)  NOT NULL UNIQUE,
    birthday_season  VARCHAR(10)  CHECK (birthday_season IN ('spring','summer','fall','winter')),
    birthday_day     SMALLINT     CHECK (birthday_day BETWEEN 1 AND 28),
    location         VARCHAR(100),
    marriageable     BOOLEAN      NOT NULL DEFAULT FALSE,
    description      TEXT,
    image_url        VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- NPC ชอบ/ไม่ชอบของขวัญชิ้นไหน (many-to-many)
CREATE TABLE npc_gifts (
    npc_id      BIGINT      NOT NULL REFERENCES npcs (id)  ON DELETE CASCADE,
    item_id     BIGINT      NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    preference  VARCHAR(10) NOT NULL CHECK (preference IN ('love','like','neutral','dislike','hate')),
    PRIMARY KEY (npc_id, item_id)
);
CREATE INDEX idx_npc_gifts_item ON npc_gifts (item_id);

CREATE TABLE guides (
    id          BIGSERIAL    PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    category    VARCHAR(30)  NOT NULL CHECK (category IN ('beginner','farming','fishing','mining','relationships','money','community-center')),
    summary     VARCHAR(300),
    cover_url   VARCHAR(500),
    content     TEXT         NOT NULL,
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    author_id   BIGINT       REFERENCES members (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE comments (
    id          BIGSERIAL   PRIMARY KEY,
    guide_id    BIGINT      NOT NULL REFERENCES guides (id)  ON DELETE CASCADE,
    member_id   BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    text        TEXT        NOT NULL CHECK (char_length(btrim(text)) >= 10),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_guide_created ON comments (guide_id, created_at DESC);

CREATE TABLE bookmarks (
    member_id  BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    guide_id   BIGINT      NOT NULL REFERENCES guides (id)  ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, guide_id)
);

CREATE TABLE friendships (
    member_id   BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    npc_id      BIGINT      NOT NULL REFERENCES npcs (id)    ON DELETE CASCADE,
    hearts      SMALLINT    NOT NULL CHECK (hearts BETWEEN 0 AND 14),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, npc_id)
);

COMMIT;