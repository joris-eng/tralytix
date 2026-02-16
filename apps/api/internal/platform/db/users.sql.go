package db

import "context"

type CreateUserParams struct {
	ID    string
	Email string
}

const createUser = `-- name: CreateUser :one
INSERT INTO users (id, email)
VALUES ($1, $2)
RETURNING id, email, created_at
`

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, createUser, arg.ID, arg.Email)
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.CreatedAt)
	return u, err
}

const getUserByEmail = `-- name: GetUserByEmail :one
SELECT id, email, created_at
FROM users
WHERE email = $1
`

func (q *Queries) GetUserByEmail(ctx context.Context, email string) (User, error) {
	row := q.db.QueryRow(ctx, getUserByEmail, email)
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.CreatedAt)
	return u, err
}
