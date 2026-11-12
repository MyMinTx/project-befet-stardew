package handlers

import (
	"errors"
	"net/http"

	"stardew-be/middleware"
	"stardew-be/repository"
	"stardew-be/utils"
)

type BookmarkHandler struct {
	Bookmarks *repository.BookmarkRepo
	Guides    *repository.GuideRepo
}

// GET /api/me/bookmarks
func (h *BookmarkHandler) List(w http.ResponseWriter, r *http.Request) {
	user := middleware.CurrentUserFrom(r.Context())
	guides, err := h.Bookmarks.List(r.Context(), user.ID)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": guides})
}

// PUT /api/me/bookmarks/{guideId}  กดซ้ำได้ ไม่ error (idempotent)
func (h *BookmarkHandler) Add(w http.ResponseWriter, r *http.Request) {
	guideID, ok := utils.IDFromPath(r, "guideId")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	// bookmark ได้เฉพาะไกด์ที่มีอยู่จริงและ published แล้ว
	if _, err := h.Guides.FindByID(r.Context(), guideID, true); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบไกด์นี้")
			return
		}
		utils.ServerError(w, err)
		return
	}
	user := middleware.CurrentUserFrom(r.Context())
	if err := h.Bookmarks.Add(r.Context(), user.ID, guideID); err != nil {
		utils.ServerError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DELETE /api/me/bookmarks/{guideId}  ไม่เคย bookmark ไว้ก็ตอบ 204 เหมือนกัน
func (h *BookmarkHandler) Remove(w http.ResponseWriter, r *http.Request) {
	guideID, ok := utils.IDFromPath(r, "guideId")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	user := middleware.CurrentUserFrom(r.Context())
	if err := h.Bookmarks.Remove(r.Context(), user.ID, guideID); err != nil {
		utils.ServerError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
