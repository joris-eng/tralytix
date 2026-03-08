package middleware

import (
	"net/http"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	billingports "github.com/joris-eng/tralytix/apps/api/internal/modules/billing/ports"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
)

// RequirePlan returns middleware that allows access when the authenticated user
// holds any of the provided plans. Plan hierarchy: free(0) < pro(1) < elite(2).
// A user with a higher plan level is always granted access to lower-tier routes.
func RequirePlan(repo billingports.SubscriptionRepository, allowedPlans ...domain.Plan) func(http.Handler) http.Handler {
	// Compute the minimum required level from the allowed list.
	minLevel := planLevel(domain.PlanElite) // start high
	for _, p := range allowedPlans {
		if l := planLevel(p); l < minLevel {
			minLevel = l
		}
	}

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

			if planLevel(userPlan) < minLevel {
				writePlanRequired(w, minLevel)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func planLevel(p domain.Plan) int {
	switch p {
	case domain.PlanElite:
		return 2
	case domain.PlanPro:
		return 1
	default:
		return 0
	}
}

func writePlanRequired(w http.ResponseWriter, minLevel int) {
	if minLevel >= planLevel(domain.PlanElite) {
		platformerrors.WriteError(w, nil, http.StatusForbidden, "elite_required", "Upgrade to Elite to access this feature", nil)
		return
	}
	platformerrors.WriteError(w, nil, http.StatusForbidden, "pro_required", "Upgrade to Pro to access this feature", nil)
}
