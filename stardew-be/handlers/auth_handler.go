package handlers

import (
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"stardew-be/repository"
	"stardew-be/security"
	"stardew-be/utils"
)

type AuthHandler struct {
	Members *repository.MemberRepo
	Tokens  *security.TokenMaker
}

type registerRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// POST /api/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}

	// ทำความสะอาดข้อมูลก่อนตรวจ
	email := strings.ToLower(strings.TrimSpace(req.Email))
	name := strings.TrimSpace(req.DisplayName)

	// ตรวจตามกติกาในสัญญาข้อ 4.1 เจอข้อแรกที่ผิดก็ตอบเลย
	switch {
	case !strings.Contains(email, "@") || len(email) > 255:
		utils.WriteError(w, http.StatusBadRequest, "BAD_EMAIL", "รูปแบบอีเมลไม่ถูกต้อง")
		return
	case validatePassword(req.Password) != "":
		utils.WriteError(w, http.StatusBadRequest, "BAD_PASSWORD", validatePassword(req.Password))
		return
	case name == "" || utf8.RuneCountInString(name) > 50:
		utils.WriteError(w, http.StatusBadRequest, "BAD_NAME", "ชื่อที่แสดงต้องยาว 1–50 ตัวอักษร")
		return
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		utils.ServerError(w, err)
		return
	}

	member, err := h.Members.Create(r.Context(), email, hash, name)
	if errors.Is(err, repository.ErrEmailTaken) {
		utils.WriteError(w, http.StatusConflict, "EMAIL_TAKEN", "อีเมลนี้ถูกใช้สมัครแล้ว")
		return
	}
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusCreated, member)
}

// POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := utils.ReadJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลไม่ถูกต้อง")
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))

	member, err := h.Members.FindByEmail(r.Context(), email)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		utils.ServerError(w, err)
		return
	}
	// ไม่มีอีเมลนี้ หรือรหัสผิด ตอบข้อความเดียวกัน คนนอกจะเดาไม่ได้ว่าอีเมลไหนมีบัญชี
	if errors.Is(err, repository.ErrNotFound) || !security.CheckPassword(member.PasswordHash, req.Password) {
		utils.WriteError(w, http.StatusUnauthorized, "BAD_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
		return
	}

	token, err := h.Tokens.Create(member.ID, member.Role)
	if err != nil {
		utils.ServerError(w, err)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]any{"token": token, "member": member})
}

// validatePassword คืนข้อความ error ถ้ารหัสผ่านไม่ผ่านกติกา คืน "" ถ้าผ่าน
func validatePassword(p string) string {
	if utf8.RuneCountInString(p) < 8 || len(p) > 72 {
		return "รหัสผ่านต้องยาว 8–72 ตัวอักษร"
	}
	return ""
}
