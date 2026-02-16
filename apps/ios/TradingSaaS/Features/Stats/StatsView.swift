import SwiftUI

struct StatsView: View {
    @State private var summary: StatsSummary?
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let api = APIClient.shared

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Button(action: loadSummary) {
                    if isLoading {
                        ProgressView()
                    } else {
                        Text("Recharger")
                    }
                }
                .buttonStyle(.borderedProminent)

                if let summary {
                    VStack(alignment: .leading, spacing: 12) {
                        StatCard(title: "Trades", value: "\(summary.tradesCount)")
                        StatCard(title: "Winrate", value: String(format: "%.2f%%", summary.winrate * 100))
                        StatCard(title: "Avg PnL", value: String(format: "%.4f", summary.avgPnL))
                        StatCard(title: "Profit Factor", value: String(format: "%.4f", summary.profitFactor))
                    }
                } else if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                } else {
                    Text("Aucune statistique chargee.")
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("Stats")
            .task {
                if summary == nil {
                    loadSummary()
                }
            }
        }
    }

    private func loadSummary() {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                summary = try await api.fetchSummary()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

private struct StatCard: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

#Preview {
    StatsView()
}
