package models

import "time"

type Member struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"displayName"`
	AvatarURL    *string   `json:"avatarUrl"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	PasswordHash string    `json:"-"` // "-" = ไม่มีวันถูกส่งออกไปใน JSON
}