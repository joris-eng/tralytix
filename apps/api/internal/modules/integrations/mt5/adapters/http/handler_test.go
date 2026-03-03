package http

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/application"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
)

type fakeService struct {
	importErr error
	listResp  application.TradesResponse
	listErr   error
	listCall  *listCall
}

type listCall struct {
	called    bool
	accountID string
	limit     int
	offset    int
}

func (f fakeService) ImportCSV(_ context.Context, _ string, _ []byte) (application.ImportResult, error) {
	return application.ImportResult{
		ImportedAt: time.Now(),
	}, f.importErr
}

func (f fakeService) Status(_ context.Context, _ string) (domain.AccountSnapshot, error) {
	return domain.AccountSnapshot{}, nil
}

func TestImportCSV_InvalidCSV_ReturnsBadRequest(t *testing.T) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", "invalid.csv")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := part.Write([]byte("not,a,valid,csv")); err != nil {
		t.Fatalf("write form file: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close writer: %v", err)
	}

	h := NewHandler(fakeService{importErr: application.ErrInvalidCSV}, nil, 10*1024*1024, nil, nil)
	req := httptest.NewRequest(http.MethodPost, "/v1/integrations/mt5/import", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req = req.WithContext(authctx.WithAuthUserID(req.Context(), "user-1"))
	rr := httptest.NewRecorder()

	h.importCSV(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode json response: %v", err)
	}
	errorPayload, ok := payload["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected nested error payload, got %v", payload)
	}
	if errorPayload["code"] != "BAD_REQUEST" {
		t.Fatalf("expected code BAD_REQUEST, got %v", errorPayload["code"])
	}
}

func (f fakeService) ListTrades(ctx context.Context, accountID string, limit, offset int) (application.TradesResponse, error) {
	if f.listCall != nil {
		f.listCall.called = true
		f.listCall.accountID = accountID
		f.listCall.limit = limit
		f.listCall.offset = offset
	}
	return f.listResp, f.listErr
}

func TestListTrades_OK(t *testing.T) {
	closePriceA := 1.2356
	closePriceB := 2644.20
	closedAtA := time.Date(2026, 2, 24, 10, 10, 0, 0, time.UTC)
	closedAtB := time.Date(2026, 2, 24, 10, 40, 0, 0, time.UTC)

	service := fakeService{
		listResp: application.TradesResponse{
			Trades: []domain.Trade{
				{
					ID:         "id-1",
					AccountID:  "user-1",
					Ticket:     "1001",
					Symbol:     "EURUSD",
					Side:       "LONG",
					Volume:     1.2,
					OpenPrice:  1.2345,
					ClosePrice: &closePriceA,
					OpenedAt:   time.Date(2026, 2, 24, 9, 30, 0, 0, time.UTC),
					ClosedAt:   &closedAtA,
					Commission: -2.5,
					Swap:       0.2,
					Profit:     45.6,
				},
				{
					ID:         "id-2",
					AccountID:  "user-1",
					Ticket:     "1002",
					Symbol:     "XAUUSD",
					Side:       "SHORT",
					Volume:     0.5,
					OpenPrice:  2648.10,
					ClosePrice: &closePriceB,
					OpenedAt:   time.Date(2026, 2, 24, 10, 0, 0, 0, time.UTC),
					ClosedAt:   &closedAtB,
					Commission: -1.1,
					Swap:       -0.3,
					Profit:     -12.4,
				},
			},
			Total: 2,
		},
	}

	h := NewHandler(service, nil, 10*1024*1024, nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/v1/integrations/mt5/trades?limit=2&offset=0", nil)
	req = req.WithContext(authctx.WithAuthUserID(req.Context(), "user-1"))
	rr := httptest.NewRecorder()

	h.listTrades(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode json response: %v", err)
	}

	total, ok := payload["total"].(float64)
	if !ok || int(total) != 2 {
		t.Fatalf("expected total=2, got %v", payload["total"])
	}

	trades, ok := payload["trades"].([]any)
	if !ok {
		t.Fatalf("expected trades array, got %T", payload["trades"])
	}
	if len(trades) != 2 {
		t.Fatalf("expected 2 trades, got %d", len(trades))
	}

	requiredFields := []string{
		"ticket", "symbol", "side", "volume", "open_price",
		"close_price", "profit", "opened_at", "closed_at", "commission", "swap",
	}
	for i, raw := range trades {
		item, ok := raw.(map[string]any)
		if !ok {
			t.Fatalf("expected trade item object at index %d, got %T", i, raw)
		}
		for _, field := range requiredFields {
			if _, exists := item[field]; !exists {
				t.Fatalf("expected field %q in trade item at index %d", field, i)
			}
		}
	}
}

func TestListTrades_Unauthenticated(t *testing.T) {
	h := NewHandler(fakeService{}, nil, 10*1024*1024, nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/v1/integrations/mt5/trades?limit=2&offset=0", nil)
	rr := httptest.NewRecorder()

	h.listTrades(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

func TestListTrades_DefaultPagination(t *testing.T) {
	calls := &listCall{}
	h := NewHandler(fakeService{
		listCall: calls,
		listResp: application.TradesResponse{
			Trades: []domain.Trade{},
			Total:  0,
		},
	}, nil, 10*1024*1024, nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/v1/integrations/mt5/trades", nil)
	req = req.WithContext(authctx.WithAuthUserID(req.Context(), "user-1"))
	rr := httptest.NewRecorder()

	h.listTrades(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
	if !calls.called {
		t.Fatalf("expected ListTrades to be called")
	}
	if calls.limit != 50 {
		t.Fatalf("expected default limit 50, got %d", calls.limit)
	}
	if calls.offset != 0 {
		t.Fatalf("expected default offset 0, got %d", calls.offset)
	}
}
