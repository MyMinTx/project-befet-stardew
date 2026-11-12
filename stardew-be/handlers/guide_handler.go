package handlers

import (
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"stardew-be/middleware"
	"stardew-be/repository"
	"stardew-be/utils"
)

type GuideHandler struct {
	Guides   *repository.GuideRepo
	Comments *repository.CommentRepo
}

// GET /api/guides?q=&category=
func (h *GuideHandler) List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	guides, err := h.Guides.List(r.Context(), repository.GuideFilter{
		Q:             query.Get("q"),
		Category:      query.Get("category"),
		OnlyPublished: true,
	})
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": guides})
}

// GET /api/guides/{id}
func (h *GuideHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	guide, err := h.Guides.FindByID(r.Context(), id, true)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบไกด์นี้")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, guide)
}

// GET /api/guides/{id}/comments
func (h *GuideHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	// ไกด์ที่ไม่มีหรือยังไม่ published → 404 เหมือนข้อ 11
	if _, err := h.Guides.FindByID(r.Context(), id, true); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบไกด์นี้")
			return
		}
		utils.ServerError(w, err)
		return
	}
	comments, err := h.Comments.ListByGuide(r.Context(), id)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": comments})
}

type commentRequest struct {
	Text string `json:"text"`
}

// POST /api/guides/{id}/comments  (👤)
func (h *GuideHandler) AddComment(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	var req commentRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	text := strings.TrimSpace(req.Text)
	switch n := utf8.RuneCountInString(text); {
	case n < 10:
		utils.WriteError(w, http.StatusBadRequest, "TEXT_TOO_SHORT", "ความคิดเห็นต้องยาวอย่างน้อย 10 ตัวอักษร")
		return
	case n > 2000:
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "ความคิดเห็นยาวได้ไม่เกิน 2000 ตัวอักษร")
		return
	}

	user := middleware.CurrentUserFrom(r.Context())
	comment, err := h.Comments.Create(r.Context(), id, user.ID, text)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบไกด์นี้")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusCreated, comment)
}

// DELETE /api/comments/{commentId}  (👤 เจ้าของ หรือ 🛡️ admin)
func (h *GuideHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	commentID, ok := utils.IDFromPath(r, "commentId")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	ownerID, err := h.Comments.OwnerOf(r.Context(), commentID)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบความคิดเห็นนี้")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}

	user := middleware.CurrentUserFrom(r.Context())
	if ownerID != user.ID && user.Role != "admin" {
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "ลบได้เฉพาะความคิดเห็นของตัวเอง")
		return
	}

	if err := h.Comments.Delete(r.Context(), commentID); err != nil {
		utils.ServerError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
