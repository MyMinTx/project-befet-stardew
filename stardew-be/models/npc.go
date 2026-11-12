package models

type Npc struct {
	ID             int64   `json:"id"`
	Name           string  `json:"name"`
	BirthdaySeason *string `json:"birthdaySeason"`
	BirthdayDay    *int16  `json:"birthdayDay"`
	Location       *string `json:"location"`
	Marriageable   bool    `json:"marriageable"`
	Description    *string `json:"description"`
	ImageURL       *string `json:"imageUrl"`
}

// GiftItem คือไอเทมหนึ่งชิ้นในรายการของขวัญของ NPC
type GiftItem struct {
	ItemID   int64   `json:"itemId"`
	Name     string  `json:"name"`
	ImageURL *string `json:"imageUrl"`
}

// NpcDetail = Npc ทุกช่อง + gifts แยกตามระดับความชอบ
type NpcDetail struct {
	Npc
	Gifts map[string][]GiftItem `json:"gifts"`
}