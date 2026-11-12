package handlers

import (
	"net/http"

	"stardew-be/repository"
	"stardew-be/utils"
)

// AdminHandler รวม endpoint หลังบ้านทั้งหมด (บทที่ 7 จะเพิ่มต่อ)
type AdminHandler struct {
	Members *repository.MemberRepo
}

// GET /api/admin/members
func (h *AdminHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	members, err := h.Members.List(r.Context())
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"items": members})
}