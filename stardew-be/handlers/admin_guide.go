package handlers

import (
	"net/http"
	"strings"

	"stardew-be/middleware"
	"stardew-be/models"
	"stardew-be/repository"
	"stardew-be/utils"
)

func validateGuide(in *models.GuideInput) string {
	in.Title = strings.TrimSpace(in.Title)
	in.Summary = cleanOptional(in.Summary)
	in.CoverURL = cleanOptional(in.CoverURL)
	in.Content = strings.TrimSpace(in.Content)

	switch {
	case in.Title == "" || runeLen(in.Title) > 150:
		return "title ต้องยาว 1–150 ตัวอักษร"
	case !oneOf(guideCategories, in.Category):
		return "category ไม่ถูกต้อง"
	case tooLong(in.Summary, 300):
		return "summary ยาวได้ไม่เกิน 300 ตัวอักษร"
	case badURL(in.CoverURL):
		return "coverUrl ต้องขึ้นต้นด้วย http:// หรือ https:// และยาวไม่เกิน 500 ตัวอักษร"
	case in.Content == "":
		return "content ห้ามว่าง"
	}
	return ""
}

func readGuide(w http.ResponseWriter, r *http.Request) (models.GuideInput, bool) {
	var in models.GuideInput
	if err := utils.ReadJSON(w, r, &in); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return in, false
	}
	if msg := validateGuide(&in); msg != "" {
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", msg)
		return in, false
	}
	return in, true
}

// GET /api/admin/guides  รวมไกด์ที่ยังไม่ published
func (h *AdminHandler) ListGuides(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	guides, err := h.Guides.List(r.Context(), repository.GuideFilter{
		Q:             query.Get("q"),
		Category:      query.Get("category"),
		OnlyPublished: false,
	})
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": guides})
}

// GET /api/admin/guides/{id}  ใช้โหลดไกด์ร่างมาแก้ในฟอร์ม (หน้าเว็บปกติมองไม่เห็นไกด์ร่าง)
func (h *AdminHandler) GetGuide(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	guide, err := h.Guides.FindByID(r.Context(), id, false)
	if err != nil {
		writeRepoError(w, err, "ไกด์")
		return
	}
	utils.WriteJSON(w, http.StatusOK, guide)
}

// POST /api/admin/guides  ผู้เขียน = admin ที่ login อยู่
func (h *AdminHandler) CreateGuide(w http.ResponseWriter, r *http.Request) {
	in, ok := readGuide(w, r)
	if !ok {
		return
	}
	me := middleware.CurrentUserFrom(r.Context())
	guide, err := h.Guides.Create(r.Context(), in, me.ID)
	if err != nil {
		writeRepoError(w, err, "ไกด์")
		return
	}
	utils.WriteJSON(w, http.StatusCreated, guide)
}

// PUT /api/admin/guides/{id}
func (h *AdminHandler) UpdateGuide(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	in, ok := readGuide(w, r)
	if !ok {
		return
	}
	guide, err := h.Guides.Update(r.Context(), id, in)
	if err != nil {
		writeRepoError(w, err, "ไกด์")
		return
	}
	utils.WriteJSON(w, http.StatusOK, guide)
}

// DELETE /api/admin/guides/{id}
func (h *AdminHandler) DeleteGuide(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	if err := h.Guides.Delete(r.Context(), id); err != nil {
		writeRepoError(w, err, "ไกด์")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}