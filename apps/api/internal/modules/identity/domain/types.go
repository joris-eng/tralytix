package domain

import "time"

type User struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

type Session struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}
