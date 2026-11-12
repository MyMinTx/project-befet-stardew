package handlers

import (
	"net/http"
	"strings"

	"stardew-be/models"
	"stardew-be/utils"
)

// validateItem ทำความสะอาดและตรวจข้อมูลไอเทม คืนข้อความ error ("" = ผ่าน)
func validateItem(in *models.ItemInput) string {
	in.Name = strings.TrimSpace(in.Name)
	in.Description = cleanOptional(in.Description)
	in.ImageURL = cleanOptional(in.ImageURL)
	in.Source = cleanOptional(in.Source)

	// seasons: ตัดค่าซ้ำ และต้องไม่เป็น nil (คอลัมน์เป็น NOT NULL)
	seasons := []string{}
	for _, s := range in.Seasons {
		if !oneOf(seasonList, s) {
			return "seasons มีค่าที่ไม่ถูกต้อง: " + s
		}
		if !oneOf(seasons, s) {
			seasons = append(seasons, s)
		}
	}
	in.Seasons = seasons

	switch {
	case in.Name == "" || runeLen(in.Name) > 100:
		return "name ต้องยาว 1–100 ตัวอักษร"
	case !oneOf(itemCategories, in.Category):
		return "category ไม่ถูกต้อง"
	case in.SellPrice < 0:
		return "sellPrice ต้องไม่ติดลบ"
	case badURL(in.ImageURL):
		return "imageUrl ต้องขึ้นต้นด้วย http:// หรือ https:// และยาวไม่เกิน 500 ตัวอักษร"
	case tooLong(in.Source, 255):
		return "source ยาวได้ไม่เกิน 255 ตัวอักษร"
	}
	return ""
}

// readItem อ่าน body + ตรวจ ถ้าไม่ผ่านจะตอบ 400 ให้เลย และคืน ok = false
func readItem(w http.ResponseWriter, r *http.Request) (models.ItemInput, bool) {
	var in models.ItemInput
	if err := utils.ReadJSON(w, r, &in); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return in, false
	}
	if msg := validateItem(&in); msg != "" {
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", msg)
		return in, false
	}
	return in, true
}

// POST /api/admin/items
func (h *AdminHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	in, ok := readItem(w, r)
	if !ok {
		return
	}
	item, err := h.Items.Create(r.Context(), in)
	if err != nil {
		writeRepoError(w, err, "ไอเทม")
		return
	}
	utils.WriteJSON(w, http.StatusCreated, item)
}

// PUT /api/admin/items/{id}
func (h *AdminHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	in, ok := readItem(w, r)
	if !ok {
		return
	}
	item, err := h.Items.Update(r.Context(), id, in)
	if err != nil {
		writeRepoError(w, err, "ไอเทม")
		return
	}
	utils.WriteJSON(w, http.StatusOK, item)
}

// DELETE /api/admin/items/{id}
func (h *AdminHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	if err := h.Items.Delete(r.Context(), id); err != nil {
		writeRepoError(w, err, "ไอเทม")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
