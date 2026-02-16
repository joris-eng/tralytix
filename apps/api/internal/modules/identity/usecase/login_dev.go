package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/yourname/trading-saas/apps/api/internal/modules/identity/domain"
	platformtime "github.com/yourname/trading-saas/apps/api/internal/platform/time"
)

var (
	ErrInvalidEmail = errors.New("invalid email")
	ErrInvalidToken = errors.New("invalid token")
	ErrUserNotFound = errors.New("user not found")
)

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	CreateUser(ctx context.Context, email string) (domain.User, error)
}

type SessionRepository interface {
	CreateSession(ctx context.Context, userID string, tokenHash string, expiresAt time.Time) (domain.Session, error)
	GetByTokenHash(ctx context.Context, tokenHash string) (domain.Session, error)
}

type LoginDevUseCase struct {
	users      UserRepository
	sessions   SessionRepository
	clock      platformtime.Clock
	sessionTTL time.Duration
}

func NewLoginDevUseCase(users UserRepository, sessions SessionRepository, clock platformtime.Clock, sessionTTL time.Duration) *LoginDevUseCase {
	return &LoginDevUseCase{
		users:      users,
		sessions:   sessions,
		clock:      clock,
		sessionTTL: sessionTTL,
	}
}

func (uc *LoginDevUseCase) LoginDev(ctx context.Context, email string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if _, err := mail.ParseAddress(email); err != nil {
		return "", ErrInvalidEmail
	}

	user, err := uc.users.GetByEmail(ctx, email)
	if err != nil {
		if !errors.Is(err, ErrUserNotFound) {
			return "", fmt.Errorf("get user by email: %w", err)
		}
		user, err = uc.users.CreateUser(ctx, email)
		if err != nil {
			return "", fmt.Errorf("create user: %w", err)
		}
	}

	rawToken, err := generateToken()
	if err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	tokenHash := hashToken(rawToken)

	_, err = uc.sessions.CreateSession(ctx, user.ID, tokenHash, uc.clock.Now().Add(uc.sessionTTL))
	if err != nil {
		return "", fmt.Errorf("create session: %w", err)
	}

	return rawToken, nil
}

func (uc *LoginDevUseCase) Authenticate(ctx context.Context, rawToken string) (domain.Session, error) {
	rawToken = strings.TrimSpace(rawToken)
	if rawToken == "" {
		return domain.Session{}, ErrInvalidToken
	}

	session, err := uc.sessions.GetByTokenHash(ctx, hashToken(rawToken))
	if err != nil {
		return domain.Session{}, fmt.Errorf("get session by token: %w", err)
	}
	if session.ExpiresAt.Before(uc.clock.Now()) {
		return domain.Session{}, ErrInvalidToken
	}
	return session, nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func generateToken() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}
