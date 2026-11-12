package handlers

import (
	"errors"
	"net/http"

	"stardew-be/models"
	"stardew-be/repository"
	"stardew-be/utils"
)

type NpcHandler struct {
	Repo *repository.NpcRepo
}

// GET /api/npcs?q=&season=&marriageable=true
func (h *NpcHandler) List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	filter := repository.NpcFilter{
		Q:            query.Get("q"),
		Season:       query.Get("season"),
		Marriageable: query.Get("marriageable") == "true",
	}
	npcs, err := h.Repo.List(r.Context(), filter)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": npcs})
}

// GET /api/npcs/{id}
func (h *NpcHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	npc, err := h.Repo.FindByID(r.Context(), id)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบ NPC นี้")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	gifts, err := h.Repo.GiftsForNpc(r.Context(), id)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, models.NpcDetail{Npc: npc, Gifts: gifts})
}