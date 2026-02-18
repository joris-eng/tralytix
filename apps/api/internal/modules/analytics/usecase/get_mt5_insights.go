package usecase

import (
	"context"
	"fmt"
	"math/big"

	"github.com/yourname/trading-saas/apps/api/internal/modules/analytics/domain"
)

type MT5SummaryReader interface {
	Execute(ctx context.Context, accountID string) (domain.MT5Summary, error)
}

type GetMT5InsightsUseCase struct {
	summaryUC MT5SummaryReader
}

func NewGetMT5InsightsUseCase(summaryUC MT5SummaryReader) *GetMT5InsightsUseCase {
	return &GetMT5InsightsUseCase{summaryUC: summaryUC}
}

func (uc *GetMT5InsightsUseCase) Execute(ctx context.Context, accountID string) (domain.InsightsResponse, error) {
	summary, err := uc.summaryUC.Execute(ctx, accountID)
	if err != nil {
		return domain.InsightsResponse{}, fmt.Errorf("load mt5 summary: %w", err)
	}
	return buildInsights(summary), nil
}

func buildInsights(s domain.MT5Summary) domain.InsightsResponse {
	if s.TotalTrades == 0 {
		return domain.InsightsResponse{
			Score: 0,
			Label: "No data",
			TopInsights: []domain.InsightItem{
				{
					Title:    "Aucune donnée exploitable",
					Detail:   "Importe ton historique MT5 pour lancer les analyses et obtenir un score fiable.",
					Severity: "med",
				},
			},
			RecommendedAction: domain.RecommendedAction{
				Title:  "Importer un historique",
				Detail: "Charge un export CSV MT5 avec suffisamment de trades pour démarrer une analyse pertinente.",
			},
		}
	}

	score := 50
	insights := make([]domain.InsightItem, 0, 6)

	totalProfit := ratFromString(s.TotalProfit)
	avgProfit := ratFromString(s.AvgProfit)
	maxProfit := ratFromString(s.MaxProfit)
	minProfit := ratFromString(s.MinProfit)
	winRate := ratFromString(s.WinRate)

	pf := (*big.Rat)(nil)
	if s.ProfitFactor != nil {
		pf = ratFromString(*s.ProfitFactor)
	}

	one := rat("1")
	pf12 := rat("1.2")
	pf09 := rat("0.9")
	winLow := rat("0.35")
	winMidLo := rat("0.45")
	winMidHi := rat("0.65")
	winHigh := rat("0.80")
	zero := rat("0")

	if pf == nil {
		insights = append(insights, domain.InsightItem{
			Title:    "Dataset biaisé",
			Detail:   "Aucune perte enregistrée pour l'instant : le profit factor n'est pas interprétable.",
			Severity: "low",
		})
	} else {
		switch {
		case pf.Cmp(pf12) >= 0:
			score += 10
		case pf.Cmp(one) >= 0:
			score += 5
		case pf.Cmp(pf09) < 0:
			score -= 15
			insights = append(insights, domain.InsightItem{
				Title:    "Profit factor faible",
				Detail:   "Tes gains ne compensent pas suffisamment tes pertes. Travaille le ratio gain/risque.",
				Severity: "high",
			})
		}
	}

	if totalProfit.Cmp(zero) > 0 {
		score += 10
	} else if totalProfit.Cmp(zero) < 0 {
		score -= 10
		insights = append(insights, domain.InsightItem{
			Title:    "Période négative",
			Detail:   "Ton résultat cumulé est négatif : réduis le risque unitaire et revalide ton plan d'exécution.",
			Severity: "high",
		})
	}

	if winRate.Cmp(winMidLo) >= 0 && winRate.Cmp(winMidHi) <= 0 {
		score += 8
	}
	if winRate.Cmp(winLow) < 0 {
		score -= 8
		insights = append(insights, domain.InsightItem{
			Title:    "Win rate faible",
			Detail:   "Filtre davantage tes setups et réduis la fréquence de prise de position.",
			Severity: "med",
		})
	}
	if winRate.Cmp(winHigh) > 0 {
		score -= 6
		insights = append(insights, domain.InsightItem{
			Title:    "Win rate très élevé",
			Detail:   "Vérifie que tes gains moyens ne sont pas trop petits par rapport à tes pertes.",
			Severity: "med",
		})
	}

	absMin := absRat(minProfit)
	if maxProfit.Cmp(zero) > 0 && absMin.Cmp(mulRat(maxProfit, rat("3"))) >= 0 {
		score -= 10
		insights = append(insights, domain.InsightItem{
			Title:    "Asymétrie gains/pertes",
			Detail:   "Tes pertes extrêmes dominent tes meilleurs gains. Renforce tes stops et coupe plus vite les trades invalides.",
			Severity: "high",
		})
	}

	if avgProfit.Cmp(zero) != 0 && absMin.Cmp(mulRat(absRat(avgProfit), rat("3"))) > 0 {
		insights = append(insights, domain.InsightItem{
			Title:    "Pertes extrêmes",
			Detail:   "Certaines pertes sont disproportionnées versus ton profit moyen. Mets un hard stop systématique.",
			Severity: "high",
		})
	}

	if s.TotalTrades > 200 {
		insights = append(insights, domain.InsightItem{
			Title:    "Overtrading potentiel",
			Detail:   "Volume de trades élevé. Fixe une limite de trades par jour pour préserver la qualité d'exécution.",
			Severity: "med",
		})
	}

	if len(insights) == 0 {
		insights = append(insights, domain.InsightItem{
			Title:    "Profil global stable",
			Detail:   "Les métriques ne montrent pas d'alerte majeure immédiate. Continue avec discipline et collecte de données.",
			Severity: "low",
		})
	}

	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	action := selectAction(s, totalProfit, pf, winRate)
	if len(insights) > 5 {
		insights = insights[:5]
	}

	return domain.InsightsResponse{
		Score:             score,
		Label:             labelForScore(score),
		TopInsights:       insights,
		RecommendedAction: action,
	}
}

func selectAction(s domain.MT5Summary, totalProfit *big.Rat, pf *big.Rat, winRate *big.Rat) domain.RecommendedAction {
	if totalProfit.Cmp(rat("0")) < 0 || (pf != nil && pf.Cmp(rat("1")) < 0) {
		return domain.RecommendedAction{
			Title:  "Priorité Risk Management",
			Detail: "Réduis le risque par trade, impose un stop dur, et valide un ratio gain/risque minimum avant chaque entrée.",
		}
	}
	if s.TotalTrades > 200 {
		return domain.RecommendedAction{
			Title:  "Limiter la fréquence",
			Detail: "Définis un quota quotidien de trades pour éviter l'overtrading et améliorer la sélection des setups.",
		}
	}
	if winRate.Cmp(rat("0.80")) > 0 || winRate.Cmp(rat("0.35")) < 0 {
		return domain.RecommendedAction{
			Title:  "Recalibrer TP/SL",
			Detail: "Revois la structure take-profit/stop-loss pour équilibrer taux de réussite et qualité des gains.",
		}
	}
	return domain.RecommendedAction{
		Title:  "Augmenter l'échantillon",
		Detail: "Importe davantage d'historique et continue à journaliser les trades pour stabiliser les conclusions.",
	}
}

func labelForScore(score int) string {
	switch {
	case score >= 80:
		return "Strong edge"
	case score >= 60:
		return "Promising"
	case score >= 40:
		return "Unstable"
	case score >= 1:
		return "High risk"
	default:
		return "No data"
	}
}

func ratFromString(v string) *big.Rat {
	r := new(big.Rat)
	if _, ok := r.SetString(v); ok {
		return r
	}
	return rat("0")
}

func rat(v string) *big.Rat {
	r, _ := new(big.Rat).SetString(v)
	return r
}

func absRat(v *big.Rat) *big.Rat {
	if v == nil {
		return rat("0")
	}
	if v.Sign() >= 0 {
		return new(big.Rat).Set(v)
	}
	return new(big.Rat).Neg(v)
}

func mulRat(a, b *big.Rat) *big.Rat {
	return new(big.Rat).Mul(a, b)
}
