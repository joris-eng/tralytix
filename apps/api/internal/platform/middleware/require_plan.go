package middleware

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	billingports "github.com/joris-eng/tralytix/apps/api/internal/modules/billing/ports"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
)

func RequirePlan(repo billingports.SubscriptionRepository, plan domain.Plan) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := authctx.AuthUserID(r.Context())
			if !ok || userID == "" {
				platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			userPlan, err := repo.GetUserPlan(r.Context(), userID)
			if err != nil {
				platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
				return
			}

			if planLevel(userPlan) < planLevel(plan) {
				writeProRequired(w, r.Context())
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func planLevel(p domain.Plan) int {
	if p == domain.PlanPro {
		return 1
	}
	return 0
}

func writeProRequired(w http.ResponseWriter, _ context.Context) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error":   "pro_required",
		"message": "Upgrade to Pro to access this feature",
	})
}
