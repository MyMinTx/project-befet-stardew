package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"stardew-be/models"
	"stardew-be/utils"
)

func validateNpc(in *models.NpcInput) string {
	in.Name = strings.TrimSpace(in.Name)
	in.BirthdaySeason = cleanOptional(in.BirthdaySeason)
	in.Location = cleanOptional(in.Location)
	in.Description = cleanOptional(in.Description)
	in.ImageURL = cleanOptional(in.ImageURL)

	switch {
	case in.Name == "" || runeLen(in.Name) > 50:
		return "name ต้องยาว 1–50 ตัวอักษร"
	case (in.BirthdaySeason == nil) != (in.BirthdayDay == nil):
		return "ต้องใส่ birthdaySeason และ birthdayDay คู่กัน (หรือไม่ใส่ทั้งคู่)"
	case in.BirthdaySeason != nil && !oneOf(seasonList, *in.BirthdaySeason):
		return "birthdaySeason ไม่ถูกต้อง"
	case in.BirthdayDay != nil && (*in.BirthdayDay < 1 || *in.BirthdayDay > 28):
		return "birthdayDay ต้องอยู่ระหว่าง 1–28"
	case tooLong(in.Location, 100):
		return "location ยาวได้ไม่เกิน 100 ตัวอักษร"
	case badURL(in.ImageURL):
		return "imageUrl ต้องขึ้นต้นด้วย http:// หรือ https:// และยาวไม่เกิน 500 ตัวอักษร"
	}
	return ""
}

func readNpc(w http.ResponseWriter, r *http.Request) (models.NpcInput, bool) {
	var in models.NpcInput
	if err := utils.ReadJSON(w, r, &in); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return in, false
	}
	if msg := validateNpc(&in); msg != "" {
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", msg)
		return in, false
	}
	return in, true
}

// POST /api/admin/npcs
func (h *AdminHandler) CreateNpc(w http.ResponseWriter, r *http.Request) {
	in, ok := readNpc(w, r)
	if !ok {
		return
	}
	npc, err := h.Npcs.Create(r.Context(), in)
	if err != nil {
		writeRepoError(w, err, "ตัวละคร")
		return
	}
	utils.WriteJSON(w, http.StatusCreated, npc)
}

// PUT /api/admin/npcs/{id}
func (h *AdminHandler) UpdateNpc(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	in, ok := readNpc(w, r)
	if !ok {
		return
	}
	npc, err := h.Npcs.Update(r.Context(), id, in)
	if err != nil {
		writeRepoError(w, err, "ตัวละคร")
		return
	}
	utils.WriteJSON(w, http.StatusOK, npc)
}

// DELETE /api/admin/npcs/{id}
func (h *AdminHandler) DeleteNpc(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	if err := h.Npcs.Delete(r.Context(), id); err != nil {
		writeRepoError(w, err, "ตัวละคร")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type giftsRequest struct {
	Gifts []models.GiftInput `json:"gifts"`
}

// PUT /api/admin/npcs/{id}/gifts  แทนที่ของขวัญทั้งชุด
func (h *AdminHandler) ReplaceGifts(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	var req giftsRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}

	// ตรวจทุกแถวก่อนแตะ DB: preference ถูกต้อง และไอเทมเดียวกันห้ามซ้ำ
	seen := map[int64]bool{}
	for _, g := range req.Gifts {
		if g.ItemID <= 0 || !oneOf(preferences, g.Preference) {
			utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "ทุกแถวต้องมี itemId และ preference ที่ถูกต้อง")
			return
		}
		if seen[g.ItemID] {
			utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "itemId "+strconv.FormatInt(g.ItemID, 10)+" ซ้ำกัน")
			return
		}
		seen[g.ItemID] = true
	}

	if err := h.Npcs.ReplaceGifts(r.Context(), id, req.Gifts); err != nil {
		writeRepoError(w, err, "ตัวละคร")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
