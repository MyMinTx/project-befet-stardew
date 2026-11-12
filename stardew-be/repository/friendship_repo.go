package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type FriendshipRepo struct {
	DB *pgxpool.Pool
}

const friendshipSelect = `
	SELECT f.npc_id, n.name, n.image_url, f.hearts, f.updated_at
	FROM friendships f
	JOIN npcs n ON n.id = f.npc_id`

func scanFriendship(row pgx.Row) (models.Friendship, error) {
	var f models.Friendship
	err := row.Scan(&f.NpcID, &f.NpcName, &f.ImageURL, &f.Hearts, &f.UpdatedAt)
	f.UpdatedAt = f.UpdatedAt.UTC()
	return f, err
}

func (r *FriendshipRepo) List(ctx context.Context, memberID int64) ([]models.Friendship, error) {
	rows, err := r.DB.Query(ctx, friendshipSelect+`
		WHERE f.member_id = $1
		ORDER BY n.name`, memberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.Friendship{}
	for rows.Next() {
		f, err := scanFriendship(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	return list, rows.Err()
}

// Upsert = ถ้ายังไม่มีให้เพิ่ม ถ้ามีแล้วให้แก้จำนวนหัวใจ
func (r *FriendshipRepo) Upsert(ctx context.Context, memberID, npcID int64, hearts int16) (models.Friendship, error) {
	_, err := r.DB.Exec(ctx, `
		INSERT INTO friendships (member_id, npc_id, hearts) VALUES ($1, $2, $3)
		ON CONFLICT (member_id, npc_id)
		DO UPDATE SET hearts = EXCLUDED.hearts, updated_at = now()`, memberID, npcID, hearts)

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" { // 23503 = foreign_key_violation: ไม่มี NPC นี้
		return models.Friendship{}, ErrNotFound
	}
	if err != nil {
		return models.Friendship{}, err
	}
	return scanFriendship(r.DB.QueryRow(ctx, friendshipSelect+`
		WHERE f.member_id = $1 AND f.npc_id = $2`, memberID, npcID))
}

func (r *FriendshipRepo) Delete(ctx context.Context, memberID, npcID int64) error {
	_, err := r.DB.Exec(ctx, `DELETE FROM friendships WHERE member_id = $1 AND npc_id = $2`, memberID, npcID)
	return err
}
