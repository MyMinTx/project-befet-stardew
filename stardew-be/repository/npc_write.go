package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"stardew-be/models"
)

// ไฟล์นี้เป็น method เขียนข้อมูลของ NpcRepo (ใช้ในหลังบ้าน admin)

func (r *NpcRepo) Create(ctx context.Context, in models.NpcInput) (models.Npc, error) {
	row := r.DB.QueryRow(ctx, `
		INSERT INTO npcs (name, birthday_season, birthday_day, location, marriageable, description, image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING `+npcColumns,
		in.Name, in.BirthdaySeason, in.BirthdayDay, in.Location, in.Marriageable, in.Description, in.ImageURL)
	n, err := scanNpc(row)
	return n, mapWriteError(err)
}

func (r *NpcRepo) Update(ctx context.Context, id int64, in models.NpcInput) (models.Npc, error) {
	row := r.DB.QueryRow(ctx, `
		UPDATE npcs
		SET name = $2, birthday_season = $3, birthday_day = $4, location = $5,
		    marriageable = $6, description = $7, image_url = $8, updated_at = now()
		WHERE id = $1
		RETURNING `+npcColumns,
		id, in.Name, in.BirthdaySeason, in.BirthdayDay, in.Location, in.Marriageable, in.Description, in.ImageURL)
	n, err := scanNpc(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Npc{}, ErrNotFound
	}
	return n, mapWriteError(err)
}

func (r *NpcRepo) Delete(ctx context.Context, id int64) error {
	tag, err := r.DB.Exec(ctx, `DELETE FROM npcs WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ReplaceGifts ลบของขวัญเดิมของ NPC ทั้งชุด แล้วใส่ชุดใหม่ ทำใน transaction เดียว
// ถ้าพังกลางทาง (เช่น itemId ไม่มีจริง) ทุกอย่างจะถูกย้อนกลับ ของเดิมไม่หาย
func (r *NpcRepo) ReplaceGifts(ctx context.Context, npcID int64, gifts []models.GiftInput) error {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) // ถ้า Commit สำเร็จแล้ว บรรทัดนี้จะไม่มีผลอะไร

	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM npcs WHERE id = $1)`, npcID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}

	if _, err := tx.Exec(ctx, `DELETE FROM npc_gifts WHERE npc_id = $1`, npcID); err != nil {
		return err
	}
	for _, g := range gifts {
		_, err := tx.Exec(ctx, `
			INSERT INTO npc_gifts (npc_id, item_id, preference) VALUES ($1, $2, $3)`,
			npcID, g.ItemID, g.Preference)
		if err != nil {
			return mapWriteError(err)
		}
	}
	return tx.Commit(ctx)
}
