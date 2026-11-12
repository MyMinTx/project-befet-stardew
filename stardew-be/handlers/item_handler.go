package handlers

import (
	"errors"
	"net/http"

	"stardew-be/models"
	"stardew-be/repository"
	"stardew-be/utils"
)

type ItemHandler struct {
	Repo *repository.ItemRepo
}

// GET /api/items?q=&category=&season=
func (h *ItemHandler) List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	filter := repository.ItemFilter{
		Q:        query.Get("q"),
		Category: query.Get("category"),
		Season:   query.Get("season"),
	}
	items, err := h.Repo.List(r.Context(), filter)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": items})
}

// GET /api/items/{id}
func (h *ItemHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	item, err := h.Repo.FindByID(r.Context(), id)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบไอเทมนี้")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	npcs, err := h.Repo.NpcsForItem(r.Context(), id)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, models.ItemDetail{Item: item, LovedBy: npcs})
}
