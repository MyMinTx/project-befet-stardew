package models

import "time"

type CommentAuthor struct {
	ID          int64   `json:"id"`
	DisplayName string  `json:"displayName"`
	AvatarURL   *string `json:"avatarUrl"`
}

type Comment struct {
	ID        int64         `json:"id"`
	GuideID   int64         `json:"guideId"`
	Text      string        `json:"text"`
	CreatedAt time.Time     `json:"createdAt"`
	Member    CommentAuthor `json:"member"`
}