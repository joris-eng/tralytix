package errors

import (
	"encoding/json"
	"net/http"
)

type HTTPError struct {
	Error string `json:"error"`
	Code  string `json:"code"`
}

func WriteHTTP(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(HTTPError{
		Error: message,
		Code:  codeFromStatus(status),
	})
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
