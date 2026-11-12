package utils

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

// WriteJSON ส่งข้อมูลอะไรก็ได้กลับไปเป็น JSON พร้อม status code
func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// WriteError ส่ง error ตามรูปแบบในสัญญา { "error": { "code", "message" } }
func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteJSON(w, status, map[string]any{
		"error": map[string]string{"code": code, "message": message},
	})
}

// ServerError จด error จริงลง log ของเรา แต่บอกผู้ใช้แค่ว่าระบบขัดข้อง
func ServerError(w http.ResponseWriter, err error) {
	log.Println("ERROR:", err)
	WriteError(w, http.StatusInternalServerError, "INTERNAL", "ระบบขัดข้อง กรุณาลองใหม่")
}

// IDFromPath อ่านเลข id จาก path เช่น /api/items/{id}
func IDFromPath(r *http.Request, name string) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue(name), 10, 64)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}