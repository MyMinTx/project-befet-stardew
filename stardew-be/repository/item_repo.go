package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"stardew-be/models"
)

type ItemRepo struct {
	DB *pgxpool.Pool
}

type ItemFilter struct {
	Q        string
	Category string
	Season   string
}

const itemColumns = `id, name, category, description, image_url, sell_price, seasons, source, updated_at`

// scanItem แปลงหนึ่งแถวเป็น models.Item (ใช้ซ้ำทั้ง List และ FindByID)
func scanItem(row pgx.Row) (models.Item, error) {
	var it models.Item
	err := row.Scan(&it.ID, &it.Name, &it.Category, &it.Description, &it.ImageURL,
		&it.SellPrice, &it.Seasons, &it.Source, &it.UpdatedAt)
	if it.Seasons == nil {
		it.Seasons = []string{} // กันไม่ให้ JSON ออกมาเป็น null
	}
	it.UpdatedAt = it.UpdatedAt.UTC() // สัญญากำหนดให้เวลาเป็น UTC
	return it, err
}

func (r *ItemRepo) List(ctx context.Context, f ItemFilter) ([]models.Item, error) {
	// ตัวกรองไหนเป็นค่าว่าง เงื่อนไขนั้นจะเป็นจริงเสมอ = ไม่กรอง
	rows, err := r.DB.Query(ctx, `
		SELECT `+itemColumns+`
		FROM items
		WHERE ($1 = '' OR lower(name) LIKE '%' || lower($1) || '%')
		  AND ($2 = '' OR category = $2)
		  AND ($3 = '' OR $3 = ANY(seasons))
		ORDER BY name`, f.Q, f.Category, f.Season)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.Item{} // เริ่มเป็น array ว่าง ไม่ใช่ nil
	for rows.Next() {
		it, err := scanItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *ItemRepo) FindByID(ctx context.Context, id int64) (models.Item, error) {
	row := r.DB.QueryRow(ctx, `SELECT `+itemColumns+` FROM items WHERE id = $1`, id)
	it, err := scanItem(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Item{}, ErrNotFound
	}
	return it, err
}

// NpcsForItem บอกว่า NPC คนไหนรู้สึกยังไงกับไอเทมนี้ (เรียง love ขึ้นก่อน)
func (r *ItemRepo) NpcsForItem(ctx context.Context, itemID int64) ([]models.GiftNPC, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT n.id, n.name, g.preference
		FROM npc_gifts g
		JOIN npcs n ON n.id = g.npc_id
		WHERE g.item_id = $1
		ORDER BY array_position(ARRAY['love','like','neutral','dislike','hate'], g.preference::text), n.name`,
		itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.GiftNPC{}
	for rows.Next() {
		var g models.GiftNPC
		if err := rows.Scan(&g.NpcID, &g.Name, &g.Preference); err != nil {
			return nil, err
		}
		list = append(list, g)
	}
	return list, rows.Err()
}
