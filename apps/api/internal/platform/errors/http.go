package errors

import (
	"encoding/json"
	"net/http"
)

type ErrorBody struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	Details   any    `json:"details,omitempty"`
	RequestID string `json:"requestId,omitempty"`
}

type ErrorResponse struct {
	Error ErrorBody `json:"error"`
}

func WriteHTTP(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorResponse{
		Error: ErrorBody{
			Code:      codeFromStatus(status),
			Message:   message,
			RequestID: requestIDFromResponse(w),
		},
	})
}

func WriteRequestError(w http.ResponseWriter, r *http.Request, status int, message string) {
	WriteError(w, r, status, codeFromStatus(status), message, nil)
}

func WriteError(w http.ResponseWriter, r *http.Request, status int, code string, message string, details any) {
	if code == "" {
		code = codeFromStatus(status)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ErrorResponse{
		Error: ErrorBody{
			Code:      code,
			Message:   message,
			Details:   details,
			RequestID: requestIDFromRequestOrResponse(r, w),
		},
	})
}

func requestIDFromRequestOrResponse(r *http.Request, w http.ResponseWriter) string {
	if r != nil {
		if v := r.Header.Get("X-Request-ID"); v != "" {
			return v
		}
	}
	return requestIDFromResponse(w)
}

func requestIDFromResponse(w http.ResponseWriter) string {
	if w == nil {
		return ""
	}
	return w.Header().Get("X-Request-ID")
}

func codeFromStatus(status int) string {
	switch status {
	case http.StatusBadRequest:
		return "BAD_REQUEST"
	case http.StatusUnauthorized:
		return "UNAUTHORIZED"
	case http.StatusForbidden:
		return "FORBIDDEN"
	case http.StatusNotFound:
		return "NOT_FOUND"
	case http.StatusTooManyRequests:
		return "RATE_LIMITED"
	default:
		if status >= http.StatusInternalServerError {
			return "INTERNAL_ERROR"
		}
		return "ERROR"
	}
}
