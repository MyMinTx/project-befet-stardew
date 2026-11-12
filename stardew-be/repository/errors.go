package repository

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrDuplicate    = errors.New("duplicate")     // ชื่อซ้ำ (unique)
	ErrBadReference = errors.New("bad reference") // อ้างถึงของที่ไม่มีอยู่ (foreign key)
)

// mapWriteError แปลง error ของ Postgres ตอนเขียนข้อมูลให้เป็น error ของเรา
func mapWriteError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			return ErrDuplicate
		case "23503": // foreign_key_violation
			return ErrBadReference
		}
	}
	return err
}