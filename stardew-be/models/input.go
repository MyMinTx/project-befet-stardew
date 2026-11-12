package models

// ไฟล์นี้รวม "ข้อมูลขาเข้า" ที่ admin ส่งมาสร้าง/แก้ (ไม่มี id เพราะ DB เป็นคนสร้าง)

type ItemInput struct {
	Name        string   `json:"name"`
	Category    string   `json:"category"`
	Description *string  `json:"description"`
	ImageURL    *string  `json:"imageUrl"`
	SellPrice   int      `json:"sellPrice"`
	Seasons     []string `json:"seasons"`
	Source      *string  `json:"source"`
}

type NpcInput struct {
	Name           string  `json:"name"`
	BirthdaySeason *string `json:"birthdaySeason"`
	BirthdayDay    *int16  `json:"birthdayDay"`
	Location       *string `json:"location"`
	Marriageable   bool    `json:"marriageable"`
	Description    *string `json:"description"`
	ImageURL       *string `json:"imageUrl"`
}

type GiftInput struct {
	ItemID     int64  `json:"itemId"`
	Preference string `json:"preference"`
}

type GuideInput struct {
	Title     string  `json:"title"`
	Category  string  `json:"category"`
	Summary   *string `json:"summary"`
	CoverURL  *string `json:"coverUrl"`
	Content   string  `json:"content"`
	Published bool    `json:"published"`
}

type Stats struct {
	Members  int64 `json:"members"`
	Items    int64 `json:"items"`
	Npcs     int64 `json:"npcs"`
	Guides   int64 `json:"guides"`
	Comments int64 `json:"comments"`
}
