package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type StatsRepo struct {
	DB *pgxpool.Pool
}

// Get นับจำนวนของแต่ละตารางในคำสั่งเดียว
func (r *StatsRepo) Get(ctx context.Context) (models.Stats, error) {
	var s models.Stats
	err := r.DB.QueryRow(ctx, `
		SELECT (SELECT count(*) FROM members),
		       (SELECT count(*) FROM items),
		       (SELECT count(*) FROM npcs),
		       (SELECT count(*) FROM guides),
		       (SELECT count(*) FROM comments)`).
		Scan(&s.Members, &s.Items, &s.Npcs, &s.Guides, &s.Comments)
	return s, err
}

// UpdateRole เปลี่ยน role ของสมาชิก
func (r *MemberRepo) UpdateRole(ctx context.Context, id int64, role string) (models.Member, error) {
	row := r.DB.QueryRow(ctx, `
		UPDATE members SET role = $2, updated_at = now()
		WHERE id = $1
		RETURNING `+memberColumns, id, role)
	m, err := scanMember(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Member{}, ErrNotFound
	}
	return m, err
}
