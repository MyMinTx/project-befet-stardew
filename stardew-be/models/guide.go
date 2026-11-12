package models

import "time"

// GuideSummary ใช้ในหน้ารายการ (ไม่มี content เพราะยาว)
type GuideSummary struct {
	ID         int64     `json:"id"`
	Title      string    `json:"title"`
	Category   string    `json:"category"`
	Summary    *string   `json:"summary"`
	CoverURL   *string   `json:"coverUrl"`
	Published  bool      `json:"published"`
	AuthorName *string   `json:"authorName"` // null ได้ ถ้าบัญชีผู้เขียนถูกลบ
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Guide ใช้ในหน้ารายละเอียด = GuideSummary + content
type Guide struct {
	GuideSummary
	Content string `json:"content"`
}