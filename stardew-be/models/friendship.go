package models

import "time"

type Friendship struct {
	NpcID     int64     `json:"npcId"`
	NpcName   string    `json:"npcName"`
	ImageURL  *string   `json:"imageUrl"`
	Hearts    int16     `json:"hearts"`
	UpdatedAt time.Time `json:"updatedAt"`
}
