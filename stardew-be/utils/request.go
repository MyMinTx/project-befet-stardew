package utils

import (
	"encoding/json"
	"net/http"
)

// ReadJSON อ่าน body ที่เป็น JSON ใส่ลงใน dst (จำกัดขนาดไม่เกิน 1 MB)
func ReadJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	return json.NewDecoder(r.Body).Decode(dst)
}