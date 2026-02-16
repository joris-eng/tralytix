package twelvedata

import (
	"context"
	"errors"

	"github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/domain"
)

var ErrNotImplemented = errors.New("twelvedata provider not implemented")

type Client struct{}

func NewClient() *Client {
	return &Client{}
}

func (c *Client) FetchCandles(_ context.Context, _ string, _ string, _ string) ([]domain.Candle, error) {
	// TODO: call TwelveData HTTP API and map response to domain candles.
	return nil, ErrNotImplemented
}
