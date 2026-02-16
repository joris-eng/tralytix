package errors

import (
	"encoding/json"
	"net/http"
)

type HTTPError struct {
	Error string `json:"error"`
}

func WriteHTTP(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(HTTPError{Error: message})
}
