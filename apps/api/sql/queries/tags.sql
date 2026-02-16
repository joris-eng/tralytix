-- name: CreateTag :one
INSERT INTO tags (id, user_id, name)
VALUES ($1, $2, $3)
RETURNING id, user_id, name;

-- name: ListTagsByUser :many
SELECT id, user_id, name
FROM tags
WHERE user_id = $1
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: GetTagByID :one
SELECT id, user_id, name
FROM tags
WHERE id = $1;

-- name: DeleteTag :exec
DELETE FROM tags
WHERE id = $1
  AND user_id = $2;

-- name: AddTagToTrade :exec
INSERT INTO trade_tags (trade_id, tag_id)
VALUES ($1, $2)
ON CONFLICT (trade_id, tag_id) DO NOTHING;

-- name: RemoveTagFromTrade :exec
DELETE FROM trade_tags
WHERE trade_id = $1
  AND tag_id = $2;

-- name: ListTagsByTrade :many
SELECT t.id, t.user_id, t.name
FROM tags t
JOIN trade_tags tt ON tt.tag_id = t.id
WHERE tt.trade_id = $1
ORDER BY t.name ASC;
