package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type CommentRepo struct {
	DB *pgxpool.Pool
}

// JOIN members เพื่อเอาชื่อและรูปของคนเขียนมาด้วย
const commentSelect = `
	SELECT c.id, c.guide_id, c.text, c.created_at, m.id, m.display_name, m.avatar_url
	FROM comments c
	JOIN members m ON m.id = c.member_id`

func scanComment(row pgx.Row) (models.Comment, error) {
	var c models.Comment
	err := row.Scan(&c.ID, &c.GuideID, &c.Text, &c.CreatedAt, &c.Member.ID, &c.Member.DisplayName, &c.Member.AvatarURL)
	c.CreatedAt = c.CreatedAt.UTC()
	return c, err
}

// ListByGuide เรียงใหม่สุดก่อนตามสัญญาข้อ 12
func (r *CommentRepo) ListByGuide(ctx context.Context, guideID int64) ([]models.Comment, error) {
	rows, err := r.DB.Query(ctx, commentSelect+`
		WHERE c.guide_id = $1
		ORDER BY c.created_at DESC, c.id DESC`, guideID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.Comment{}
	for rows.Next() {
		c, err := scanComment(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *CommentRepo) FindByID(ctx context.Context, id int64) (models.Comment, error) {
	c, err := scanComment(r.DB.QueryRow(ctx, commentSelect+` WHERE c.id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Comment{}, ErrNotFound
	}
	return c, err
}

// Create เพิ่มคอมเมนต์ได้เฉพาะไกด์ที่ published แล้ว ถ้าไม่มีไกด์นี้คืน ErrNotFound
func (r *CommentRepo) Create(ctx context.Context, guideID, memberID int64, text string) (models.Comment, error) {
	// INSERT ... SELECT ... WHERE: ถ้าไม่เจอไกด์ที่ published จะไม่มีแถวถูกเพิ่มเลย
	var newID int64
	err := r.DB.QueryRow(ctx, `
		INSERT INTO comments (guide_id, member_id, text)
		SELECT id, $2, $3 FROM guides WHERE id = $1 AND published = true
		RETURNING id`, guideID, memberID, text).Scan(&newID)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Comment{}, ErrNotFound
	}
	if err != nil {
		return models.Comment{}, err
	}
	return r.FindByID(ctx, newID)
}

// OwnerOf บอกว่าคอมเมนต์นี้เป็นของสมาชิกคนไหน
func (r *CommentRepo) OwnerOf(ctx context.Context, commentID int64) (int64, error) {
	var memberID int64
	err := r.DB.QueryRow(ctx, `SELECT member_id FROM comments WHERE id = $1`, commentID).Scan(&memberID)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	return memberID, err
}

func (r *CommentRepo) Delete(ctx context.Context, commentID int64) error {
	_, err := r.DB.Exec(ctx, `DELETE FROM comments WHERE id = $1`, commentID)
	return err
}
