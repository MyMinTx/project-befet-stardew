package handlers

import (
	"net/http"

	"stardew-be/middleware"
	"stardew-be/repository"
	"stardew-be/utils"
)

// AdminHandler รวม endpoint หลังบ้านทั้งหมด
// method แยกอยู่หลายไฟล์: admin_handler.go, admin_item.go, admin_npc.go, admin_guide.go
type AdminHandler struct {
	Members *repository.MemberRepo
	Stats   *repository.StatsRepo
	Items   *repository.ItemRepo
	Npcs    *repository.NpcRepo
	Guides  *repository.GuideRepo
}

// GET /api/admin/stats
func (h *AdminHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	s, err := h.Stats.Get(r.Context())
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, s)
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

type roleRequest struct {
	Role string `json:"role"`
}

// PUT /api/admin/members/{id}/role
func (h *AdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id, ok := utils.IDFromPath(r, "id")
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "BAD_ID", "id ต้องเป็นตัวเลข")
		return
	}
	var req roleRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if !oneOf(roles, req.Role) {
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "role ต้องเป็น member หรือ admin")
		return
	}
	// กันไม่ให้ admin ลดสิทธิ์ตัวเอง (ถ้าเป็น admin คนเดียว ระบบจะไม่เหลือ admin เลย)
	me := middleware.CurrentUserFrom(r.Context())
	if id == me.ID && req.Role != "admin" {
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "ไม่สามารถลดสิทธิ์ของตัวเองได้")
		return
	}

	member, err := h.Members.UpdateRole(r.Context(), id, req.Role)
	if err != nil {
		writeRepoError(w, err, "สมาชิก")
		return
	}
	utils.WriteJSON(w, http.StatusOK, member)
}