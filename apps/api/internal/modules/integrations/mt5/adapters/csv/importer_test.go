package csv

import (
	"context"
	"testing"
)

func TestImportCSV_SemicolonFormat(t *testing.T) {
	raw := []byte("Time;Ticket;Symbol;Type;Volume;Price;Commission;Swap;Profit\n2026.02.16 10:00:00;123;EURUSD;buy;1,20;1,1200;-2,5;0,0;15,2\n")
	imp := NewImporter()

	got, err := imp.ImportCSV(context.Background(), raw)
	if err != nil {
		t.Fatalf("ImportCSV() unexpected error: %v", err)
	}
	if len(got) != 1 {
		t.Fatalf("len(got) = %d, want 1", len(got))
	}
	if got[0].Ticket != "123" {
		t.Fatalf("Ticket = %q, want %q", got[0].Ticket, "123")
	}
	if got[0].Side != "LONG" {
		t.Fatalf("Side = %q, want LONG", got[0].Side)
	}
}

func TestImportCSV_CommaFormat(t *testing.T) {
	raw := []byte("Time,Ticket,Symbol,Type,Volume,Price\n2026-02-16 10:00:00,999,GBPUSD,sell,0.50,1.2500\n")
	imp := NewImporter()

	got, err := imp.ImportCSV(context.Background(), raw)
	if err != nil {
		t.Fatalf("ImportCSV() unexpected error: %v", err)
	}
	if len(got) != 1 {
		t.Fatalf("len(got) = %d, want 1", len(got))
	}
	if got[0].Side != "SHORT" {
		t.Fatalf("Side = %q, want SHORT", got[0].Side)
	}
}
