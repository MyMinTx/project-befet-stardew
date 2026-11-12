package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type GuideRepo struct {
	DB *pgxpool.Pool
}

type GuideFilter struct {
	Q             string
	Category      string
	OnlyPublished bool // หน้าเว็บ = true, หลังบ้าน admin (บทที่ 7) = false
}

// LEFT JOIN เพราะ author_id อาจเป็น NULL (ผู้เขียนถูกลบ) ไกด์ก็ยังต้องแสดงอยู่
const guideSummarySelect = `
	SELECT g.id, g.title, g.category, g.summary, g.cover_url, g.published, m.display_name, g.updated_at
	FROM guides g
	LEFT JOIN members m ON m.id = g.author_id`

func scanGuideSummary(row pgx.Row, extra ...any) (models.GuideSummary, error) {
	var s models.GuideSummary
	dest := []any{&s.ID, &s.Title, &s.Category, &s.Summary, &s.CoverURL, &s.Published, &s.AuthorName, &s.UpdatedAt}
	err := row.Scan(append(dest, extra...)...)
	s.UpdatedAt = s.UpdatedAt.UTC()
	return s, err
}

func collectGuideSummaries(rows pgx.Rows) ([]models.GuideSummary, error) {
	defer rows.Close()
	list := []models.GuideSummary{}
	for rows.Next() {
		s, err := scanGuideSummary(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *GuideRepo) List(ctx context.Context, f GuideFilter) ([]models.GuideSummary, error) {
	rows, err := r.DB.Query(ctx, guideSummarySelect+`
		WHERE ($1 = '' OR lower(g.title) LIKE '%' || lower($1) || '%')
		  AND ($2 = '' OR g.category = $2)
		  AND ($3 = false OR g.published = true)
		ORDER BY g.updated_at DESC`, f.Q, f.Category, f.OnlyPublished)
	if err != nil {
		return nil, err
	}
	return collectGuideSummaries(rows)
}

// FindByID onlyPublished = true จะมองไม่เห็นไกด์ที่ยังไม่ published (ตอบเหมือนไม่มี)
func (r *GuideRepo) FindByID(ctx context.Context, id int64, onlyPublished bool) (models.Guide, error) {
	row := r.DB.QueryRow(ctx, `
		SELECT g.id, g.title, g.category, g.summary, g.cover_url, g.published, m.display_name, g.updated_at, g.content
		FROM guides g
		LEFT JOIN members m ON m.id = g.author_id
		WHERE g.id = $1 AND ($2 = false OR g.published = true)`, id, onlyPublished)
	var g models.Guide
	s, err := scanGuideSummary(row, &g.Content)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Guide{}, ErrNotFound
	}
	g.GuideSummary = s
	return g, err
}