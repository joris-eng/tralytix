import SwiftUI

struct SettingsView: View {
    private let hostInput = AppConfig.apiBaseURL.absoluteString

    var body: some View {
        NavigationStack {
            Form {
                Section("Configuration locale") {
                    Text("API Base URL")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(hostInput)
                        .font(.footnote.monospaced())
                }

                Section("Session") {
                    Button("Logout") {
                        APIClient.shared.clearToken()
                    }
                    .foregroundStyle(.red)
                }

                Section("Info") {
                    Text("Pour iPhone physique, remplacez localhost par l'IP LAN du Mac dans AppConfig.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    SettingsView()
}
