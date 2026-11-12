package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

var ErrEmailTaken = errors.New("email taken")

type MemberRepo struct {
	DB *pgxpool.Pool
}

const memberColumns = `id, email, display_name, avatar_url, role, created_at, password_hash`

func scanMember(row pgx.Row) (models.Member, error) {
	var m models.Member
	err := row.Scan(&m.ID, &m.Email, &m.DisplayName, &m.AvatarURL, &m.Role, &m.CreatedAt, &m.PasswordHash)
	m.CreatedAt = m.CreatedAt.UTC()
	return m, err
}

// Create เพิ่มสมาชิกใหม่ ถ้าอีเมลซ้ำคืน ErrEmailTaken
func (r *MemberRepo) Create(ctx context.Context, email, passwordHash, displayName string) (models.Member, error) {
	row := r.DB.QueryRow(ctx, `
		INSERT INTO members (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING `+memberColumns, email, passwordHash, displayName)
	m, err := scanMember(row)

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" { // 23505 = unique_violation
		return models.Member{}, ErrEmailTaken
	}
	return m, err
}

func (r *MemberRepo) FindByEmail(ctx context.Context, email string) (models.Member, error) {
	row := r.DB.QueryRow(ctx, `SELECT `+memberColumns+` FROM members WHERE lower(email) = lower($1)`, email)
	m, err := scanMember(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Member{}, ErrNotFound
	}
	return m, err
}

func (r *MemberRepo) FindByID(ctx context.Context, id int64) (models.Member, error) {
	row := r.DB.QueryRow(ctx, `SELECT `+memberColumns+` FROM members WHERE id = $1`, id)
	m, err := scanMember(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Member{}, ErrNotFound
	}
	return m, err
}