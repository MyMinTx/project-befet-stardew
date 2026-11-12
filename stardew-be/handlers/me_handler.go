package handlers

import (
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"stardew-be/middleware"
	"stardew-be/repository"
	"stardew-be/security"
	"stardew-be/utils"
)

type MeHandler struct {
	Members *repository.MemberRepo
}

// GET /api/me
func (h *MeHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := middleware.CurrentUserFrom(r.Context()) // id มาจาก token ไม่ใช่จากผู้ใช้ส่งมา
	member, err := h.Members.FindByID(r.Context(), user.ID)
	if errors.Is(err, repository.ErrNotFound) {
		// token ยังใช้ได้ แต่บัญชีถูกลบไปแล้ว
		utils.WriteError(w, http.StatusUnauthorized, "LOGIN_REQUIRED", "ไม่พบบัญชีนี้ กรุณาเข้าสู่ระบบใหม่")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, member)
}

type updateMeRequest struct {
	DisplayName string  `json:"displayName"`
	AvatarURL   *string `json:"avatarUrl"`
}

// PUT /api/me
func (h *MeHandler) Update(w http.ResponseWriter, r *http.Request) {
	var req updateMeRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}

	name := strings.TrimSpace(req.DisplayName)
	if name == "" || utf8.RuneCountInString(name) > 50 {
		utils.WriteError(w, http.StatusBadRequest, "BAD_NAME", "ชื่อที่แสดงต้องยาว 1–50 ตัวอักษร")
		return
	}

	// avatarUrl: ส่ง null หรือ "" มา = ไม่มีรูป
	var avatar *string
	if req.AvatarURL != nil {
		a := strings.TrimSpace(*req.AvatarURL)
		if a != "" {
			if len(a) > 500 || !(strings.HasPrefix(a, "http://") || strings.HasPrefix(a, "https://")) {
				utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "ลิงก์รูปต้องขึ้นต้นด้วย http:// หรือ https:// และยาวไม่เกิน 500 ตัวอักษร")
				return
			}
			avatar = &a
		}
	}

	user := middleware.CurrentUserFrom(r.Context())
	member, err := h.Members.UpdateProfile(r.Context(), user.ID, name, avatar)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusUnauthorized, "LOGIN_REQUIRED", "ไม่พบบัญชีนี้ กรุณาเข้าสู่ระบบใหม่")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, member)
}

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// PUT /api/me/password
func (h *MeHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req changePasswordRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	if msg := validatePassword(req.NewPassword); msg != "" {
		utils.WriteError(w, http.StatusBadRequest, "BAD_PASSWORD", msg)
		return
	}

	user := middleware.CurrentUserFrom(r.Context())
	member, err := h.Members.FindByID(r.Context(), user.ID)
	if errors.Is(err, repository.ErrNotFound) {
		utils.WriteError(w, http.StatusUnauthorized, "LOGIN_REQUIRED", "ไม่พบบัญชีนี้ กรุณาเข้าสู่ระบบใหม่")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}

	// ต้องยืนยันรหัสเดิมก่อน กันคนที่แอบใช้เครื่องที่ login ค้างไว้มาเปลี่ยนรหัส
	if !security.CheckPassword(member.PasswordHash, req.CurrentPassword) {
		utils.WriteError(w, http.StatusUnauthorized, "WRONG_PASSWORD", "รหัสผ่านปัจจุบันไม่ถูกต้อง")
		return
	}

	hash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	if err := h.Members.UpdatePassword(r.Context(), user.ID, hash); err != nil {
		utils.ServerError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}