package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"stardew-be/models"
)

// ไฟล์นี้เป็น method เขียนข้อมูลของ GuideRepo (ใช้ในหลังบ้าน admin)

func (r *GuideRepo) Create(ctx context.Context, in models.GuideInput, authorID int64) (models.Guide, error) {
	var id int64
	err := r.DB.QueryRow(ctx, `
		INSERT INTO guides (title, category, summary, cover_url, content, published, author_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`,
		in.Title, in.Category, in.Summary, in.CoverURL, in.Content, in.Published, authorID).Scan(&id)
	if err != nil {
		return models.Guide{}, mapWriteError(err)
	}
	return r.FindByID(ctx, id, false)
}

// Update ไม่เปลี่ยนผู้เขียน (author_id คงเดิม)
func (r *GuideRepo) Update(ctx context.Context, id int64, in models.GuideInput) (models.Guide, error) {
	err := r.DB.QueryRow(ctx, `
		UPDATE guides
		SET title = $2, category = $3, summary = $4, cover_url = $5,
		    content = $6, published = $7, updated_at = now()
		WHERE id = $1
		RETURNING id`,
		id, in.Title, in.Category, in.Summary, in.CoverURL, in.Content, in.Published).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Guide{}, ErrNotFound
	}
	if err != nil {
		return models.Guide{}, mapWriteError(err)
	}
	return r.FindByID(ctx, id, false)
}

func (r *GuideRepo) Delete(ctx context.Context, id int64) error {
	tag, err := r.DB.Exec(ctx, `DELETE FROM guides WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
