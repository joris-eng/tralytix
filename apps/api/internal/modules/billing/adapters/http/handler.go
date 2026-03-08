package http

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
)

type authMiddleware interface {
	RequireAuth(http.Handler) http.Handler
}

type service interface {
	CreateCheckoutSession(ctx context.Context, userID, priceID, successURL, cancelURL string) (string, error)
	HandleWebhook(ctx context.Context, payload []byte, sigHeader string) error
	GetUserPlan(ctx context.Context, userID string) (domain.Plan, error)
	IsAllowedPriceID(priceID string) bool
}

type Handler struct {
	svc        service
	authMW     authMiddleware
	appBaseURL string
}

func NewHandler(svc service, authMW authMiddleware, appBaseURL string) *Handler {
	return &Handler{
		svc:        svc,
		authMW:     authMW,
		appBaseURL: strings.TrimRight(appBaseURL, "/"),
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/webhooks/stripe", h.webhook)

	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		sr.Post("/billing/checkout", h.checkout)
		sr.Get("/billing/plan", h.plan)
	})
}

type checkoutRequest struct {
	PriceID string `json:"price_id"`
	Billing string `json:"billing"`
}

type checkoutResponse struct {
	CheckoutURL string `json:"checkout_url"`
}

type planResponse struct {
	Plan string `json:"plan"`
}

func (h *Handler) checkout(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil || r.Body == http.NoBody {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "request body is required")
		return
	}
	if ct := strings.ToLower(strings.TrimSpace(r.Header.Get("Content-Type"))); !strings.HasPrefix(ct, "application/json") {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "content-type must be application/json")
		return
	}

	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req checkoutRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid json body")
		return
	}

	req.Billing = strings.ToLower(strings.TrimSpace(req.Billing))
	if req.Billing != "" && req.Billing != "monthly" && req.Billing != "yearly" {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "billing must be monthly or yearly")
		return
	}
	req.PriceID = strings.TrimSpace(req.PriceID)
	if !h.svc.IsAllowedPriceID(req.PriceID) {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid price_id")
		return
	}

	successURL := h.appBaseURL + "/plans?success=true"
	cancelURL := h.appBaseURL + "/plans?canceled=true"
	checkoutURL, err := h.svc.CreateCheckoutSession(r.Context(), userID, req.PriceID, successURL, cancelURL)
	if err != nil {
		if strings.Contains(err.Error(), domain.ErrInvalidPlan.Error()) {
			platformerrors.WriteHTTP(w, http.StatusBadRequest, domain.ErrInvalidPlan.Error())
			return
		}
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.JSON(w, http.StatusOK, checkoutResponse{CheckoutURL: checkoutURL})
}

func (h *Handler) webhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[billing/webhook] failed to read request body: %v", err)
		httpx.JSON(w, http.StatusOK, map[string]bool{"received": true})
		return
	}

	sigHeader := strings.TrimSpace(r.Header.Get("Stripe-Signature"))
	log.Printf("[billing/webhook] incoming webhook: body_len=%d sig_header_present=%v", len(body), sigHeader != "")

	if err := h.svc.HandleWebhook(r.Context(), body, sigHeader); err != nil {
		// Always return 200 to Stripe, but log the failure so it's visible in Render logs.
		log.Printf("[billing/webhook] HandleWebhook error (plan NOT updated): %v", err)
	}

	httpx.JSON(w, http.StatusOK, map[string]bool{"received": true})
}

func (h *Handler) plan(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	plan, err := h.svc.GetUserPlan(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.JSON(w, http.StatusOK, planResponse{Plan: string(plan)})
}
