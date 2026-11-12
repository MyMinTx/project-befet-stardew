package repository

import "errors"

// ErrNotFound ใช้บอกชั้นบนว่า "หาไม่เจอ" โดยไม่ต้องรู้จัก pgx
var ErrNotFound = errors.New("not found")