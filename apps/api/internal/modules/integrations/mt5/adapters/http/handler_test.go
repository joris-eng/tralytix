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

	identityhttp "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/application"
	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/domain"
)

type fakeService struct {
	importErr error
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

	h := NewHandler(fakeService{importErr: application.ErrInvalidCSV}, nil, 10*1024*1024, nil)
	req := httptest.NewRequest(http.MethodPost, "/v1/integrations/mt5/import", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req = req.WithContext(identityhttp.WithAuthUserID(req.Context(), "user-1"))
	rr := httptest.NewRecorder()

	h.importCSV(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode json response: %v", err)
	}
	if payload["code"] != "BAD_REQUEST" {
		t.Fatalf("expected code BAD_REQUEST, got %v", payload["code"])
	}
}
