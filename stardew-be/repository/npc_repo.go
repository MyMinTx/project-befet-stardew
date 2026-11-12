package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type NpcRepo struct {
	DB *pgxpool.Pool
}

type NpcFilter struct {
	Q            string
	Season       string
	Marriageable bool
}

const npcColumns = `id, name, birthday_season, birthday_day, location, marriageable, description, image_url`

func scanNpc(row pgx.Row) (models.Npc, error) {
	var n models.Npc
	err := row.Scan(&n.ID, &n.Name, &n.BirthdaySeason, &n.BirthdayDay,
		&n.Location, &n.Marriageable, &n.Description, &n.ImageURL)
	return n, err
}

func (r *NpcRepo) List(ctx context.Context, f NpcFilter) ([]models.Npc, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT `+npcColumns+`
		FROM npcs
		WHERE ($1 = '' OR lower(name) LIKE '%' || lower($1) || '%')
		  AND ($2 = '' OR birthday_season = $2)
		  AND ($3 = false OR marriageable = true)
		ORDER BY name`, f.Q, f.Season, f.Marriageable)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	npcs := []models.Npc{}
	for rows.Next() {
		n, err := scanNpc(rows)
		if err != nil {
			return nil, err
		}
		npcs = append(npcs, n)
	}
	return npcs, rows.Err()
}

func (r *NpcRepo) FindByID(ctx context.Context, id int64) (models.Npc, error) {
	row := r.DB.QueryRow(ctx, `SELECT `+npcColumns+` FROM npcs WHERE id = $1`, id)
	n, err := scanNpc(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Npc{}, ErrNotFound
	}
	return n, err
}

// GiftsForNpc จัดของขวัญของ NPC คนนี้ออกเป็น 5 กลุ่มตามระดับความชอบ
func (r *NpcRepo) GiftsForNpc(ctx context.Context, npcID int64) (map[string][]models.GiftItem, error) {
	// เตรียมครบ 5 กลุ่มไว้ก่อน กลุ่มที่ไม่มีของจะได้เป็น [] ไม่ใช่หายไป
	gifts := map[string][]models.GiftItem{
		"love": {}, "like": {}, "neutral": {}, "dislike": {}, "hate": {},
	}

	rows, err := r.DB.Query(ctx, `
		SELECT g.preference, i.id, i.name, i.image_url
		FROM npc_gifts g
		JOIN items i ON i.id = g.item_id
		WHERE g.npc_id = $1
		ORDER BY i.name`, npcID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var pref string
		var g models.GiftItem
		if err := rows.Scan(&pref, &g.ItemID, &g.Name, &g.ImageURL); err != nil {
			return nil, err
		}
		gifts[pref] = append(gifts[pref], g)
	}
	return gifts, rows.Err()
}
