package models

import "time"

type Item struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	Description *string   `json:"description"` // pointer = เป็น null ได้
	ImageURL    *string   `json:"imageUrl"`
	SellPrice   int       `json:"sellPrice"`
	Seasons     []string  `json:"seasons"`
	Source      *string   `json:"source"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// GiftNPC คือ NPC หนึ่งคนกับความรู้สึกที่มีต่อไอเทมชิ้นนี้
type GiftNPC struct {
	NpcID      int64  `json:"npcId"`
	Name       string `json:"name"`
	Preference string `json:"preference"`
}

// ItemDetail = Item ทุกช่อง + lovedBy
type ItemDetail struct {
	Item
	LovedBy []GiftNPC `json:"lovedBy"`
}