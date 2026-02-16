import SwiftUI

struct LoginView: View {
    @State private var email: String = "dev@example.com"
    @State private var isLoading = false
    @State private var token: String = ""
    @State private var errorMessage: String?

    private let api = APIClient.shared

    var body: some View {
        NavigationStack {
            Form {
                Section("Dev Login") {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()

                    Button(action: login) {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Dev Login")
                        }
                    }
                    .disabled(isLoading || email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }

                if !token.isEmpty {
                    Section("Session") {
                        Text("Token sauvegarde localement.")
                            .foregroundStyle(.secondary)
                    }
                }

                if let errorMessage {
                    Section("Erreur") {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Login")
        }
    }

    private func login() {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                token = try await api.devLogin(email: email)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    LoginView()
}
