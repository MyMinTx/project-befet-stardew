package handlers

import (
	"errors"
	"net/http"
	"slices"
	"strings"
	"unicode/utf8"

	"stardew-be/repository"
	"stardew-be/utils"
)

// ค่าที่ใช้ได้ ตามสัญญาข้อ 2 (ต้องตรงกับ CHECK ใน schema.sql)
var (
	roles           = []string{"member", "admin"}
	seasonList      = []string{"spring", "summer", "fall", "winter"}
	itemCategories  = []string{"crop", "forage", "fish", "mineral", "artisan", "cooking", "resource", "other"}
	preferences     = []string{"love", "like", "neutral", "dislike", "hate"}
	guideCategories = []string{"beginner", "farming", "fishing", "mining", "relationships", "money", "community-center"}
)

func runeLen(s string) int { return utf8.RuneCountInString(s) }

// oneOf เช็กว่า v อยู่ในรายการที่อนุญาตไหม
func oneOf(list []string, v string) bool {
	return slices.Contains(list, v)
}

// cleanOptional ตัดช่องว่าง ถ้าว่างเปล่าให้กลายเป็น nil (= NULL ใน DB)
func cleanOptional(p *string) *string {
	if p == nil {
		return nil
	}
	s := strings.TrimSpace(*p)
	if s == "" {
		return nil
	}
	return &s
}

// tooLong ใช้กับช่องที่เป็น null ได้: nil ถือว่าผ่าน
func tooLong(p *string, max int) bool {
	return p != nil && runeLen(*p) > max
}

// badURL ใช้กับช่องลิงก์รูป: nil ผ่าน, มีค่าต้องขึ้นต้นด้วย http(s) และยาวไม่เกิน 500
func badURL(p *string) bool {
	if p == nil {
		return false
	}
	u := *p
	return len(u) > 500 || !(strings.HasPrefix(u, "http://") || strings.HasPrefix(u, "https://"))
}

// writeRepoError แปลง error จาก repository เป็นคำตอบ HTTP ที่เหมาะสม
func writeRepoError(w http.ResponseWriter, err error, what string) {
	switch {
	case errors.Is(err, repository.ErrNotFound):
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "ไม่พบ"+what+"นี้")
	case errors.Is(err, repository.ErrDuplicate):
		utils.WriteError(w, http.StatusConflict, "DUPLICATE", "มี"+what+"ชื่อนี้อยู่แล้ว")
	case errors.Is(err, repository.ErrBadReference):
		utils.WriteError(w, http.StatusBadRequest, "BAD_FIELD", "มีการอ้างถึงข้อมูลที่ไม่มีอยู่จริง")
	default:
		utils.ServerError(w, err)
	}
}