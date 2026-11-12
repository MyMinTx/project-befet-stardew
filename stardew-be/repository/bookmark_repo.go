package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type BookmarkRepo struct {
	DB *pgxpool.Pool
}

// List ไกด์ที่สมาชิกคนนี้ bookmark ไว้ (เฉพาะที่ยัง published) ล่าสุดก่อน
func (r *BookmarkRepo) List(ctx context.Context, memberID int64) ([]models.GuideSummary, error) {
	rows, err := r.DB.Query(ctx, guideSummarySelect+`
		JOIN bookmarks b ON b.guide_id = g.id
		WHERE b.member_id = $1 AND g.published = true
		ORDER BY b.added_at DESC`, memberID)
	if err != nil {
		return nil, err
	}
	return collectGuideSummaries(rows)
}

// Add ถ้าเคย bookmark ไว้แล้ว ON CONFLICT DO NOTHING = ไม่ทำอะไร ไม่ error
func (r *BookmarkRepo) Add(ctx context.Context, memberID, guideID int64) error {
	_, err := r.DB.Exec(ctx, `
		INSERT INTO bookmarks (member_id, guide_id) VALUES ($1, $2)
		ON CONFLICT (member_id, guide_id) DO NOTHING`, memberID, guideID)
	return err
}

func (r *BookmarkRepo) Remove(ctx context.Context, memberID, guideID int64) error {
	_, err := r.DB.Exec(ctx, `DELETE FROM bookmarks WHERE member_id = $1 AND guide_id = $2`, memberID, guideID)
	return err
}