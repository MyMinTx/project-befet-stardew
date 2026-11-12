package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"stardew-be/models"
)

// ไฟล์นี้เป็น method เขียนข้อมูลของ ItemRepo (ใช้ในหลังบ้าน admin)

func (r *ItemRepo) Create(ctx context.Context, in models.ItemInput) (models.Item, error) {
	row := r.DB.QueryRow(ctx, `
		INSERT INTO items (name, category, description, image_url, sell_price, seasons, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING `+itemColumns,
		in.Name, in.Category, in.Description, in.ImageURL, in.SellPrice, in.Seasons, in.Source)
	it, err := scanItem(row)
	return it, mapWriteError(err)
}

func (r *ItemRepo) Update(ctx context.Context, id int64, in models.ItemInput) (models.Item, error) {
	row := r.DB.QueryRow(ctx, `
		UPDATE items
		SET name = $2, category = $3, description = $4, image_url = $5,
		    sell_price = $6, seasons = $7, source = $8, updated_at = now()
		WHERE id = $1
		RETURNING `+itemColumns,
		id, in.Name, in.Category, in.Description, in.ImageURL, in.SellPrice, in.Seasons, in.Source)
	it, err := scanItem(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Item{}, ErrNotFound
	}
	return it, mapWriteError(err)
}

func (r *ItemRepo) Delete(ctx context.Context, id int64) error {
	tag, err := r.DB.Exec(ctx, `DELETE FROM items WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}