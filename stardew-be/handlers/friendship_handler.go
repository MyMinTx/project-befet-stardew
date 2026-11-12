package handlers

import (
	"errors"
	"net/http"

	"stardew-be/middleware"
	"stardew-be/repository"
	"stardew-be/utils"
)

type FriendshipHandler struct {
	Friendships *repository.FriendshipRepo
}

// GET /api/me/friendships
func (h *FriendshipHandler) List(w http.ResponseWriter, r *http.Request) {
	user := middleware.CurrentUserFrom(r.Context())
	list, err := h.Friendships.List(r.Context(), user.ID)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": list})
}

type friendshipRequest struct {
	Hearts *int `json:"hearts"` // pointer: แยกได้ว่า "ไม่ส่งมา" กับ "ส่ง 0 มา"
}

// PUT /api/me/friendships/{npcId}  body { hearts: 0–14 }
func (h *FriendshipHandler) Put(w http.ResponseWriter, r *http.Request) {
	npcID, ok := utils.IDFromPath(r, "npcId")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	var req friendshipRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if req.Hearts == nil || *req.Hearts < 0 || *req.Hearts > 14 {
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "hearts ต้องเป็นตัวเลข 0–14")
		return
	}

	user := middleware.CurrentUserFrom(r.Context())
	f, err := h.Friendships.Upsert(r.Context(), user.ID, npcID, int16(*req.Hearts))
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบ NPC นี้")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, f)
}

// DELETE /api/me/friendships/{npcId}
func (h *FriendshipHandler) Delete(w http.ResponseWriter, r *http.Request) {
	npcID, ok := utils.IDFromPath(r, "npcId")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	user := middleware.CurrentUserFrom(r.Context())
	if err := h.Friendships.Delete(r.Context(), user.ID, npcID); err != nil {
		utils.ServerError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}