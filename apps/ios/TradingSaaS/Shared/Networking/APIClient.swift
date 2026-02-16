import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "URL invalide."
        case .invalidResponse:
            return "Reponse serveur invalide."
        case let .httpError(statusCode, message):
            return "Erreur HTTP \(statusCode): \(message)"
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let tokenStore: TokenStore
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init(
        session: URLSession = .shared,
        tokenStore: TokenStore = UserDefaultsTokenStore(),
        decoder: JSONDecoder = JSONDecoder(),
        encoder: JSONEncoder = JSONEncoder()
    ) {
        self.session = session
        self.tokenStore = tokenStore
        self.decoder = decoder
        self.encoder = encoder
    }

    func setToken(_ token: String) {
        tokenStore.setToken(token)
    }

    func clearToken() {
        tokenStore.clearToken()
    }

    func hasToken() -> Bool {
        !(tokenStore.getToken() ?? "").isEmpty
    }

    func devLogin(email: String) async throws -> String {
        struct Request: Encodable { let email: String }
        struct Response: Decodable { let token: String }

        let response: Response = try await send(
            path: "/v1/auth/dev-login",
            method: "POST",
            body: Request(email: email),
            requiresAuth: false
        )
        setToken(response.token)
        return response.token
    }

    func fetchSummary() async throws -> StatsSummary {
        try await send(path: "/v1/analytics/summary", method: "GET", requiresAuth: true)
    }

    @discardableResult
    private func send<T: Decodable, B: Encodable>(
        path: String,
        method: String,
        body: B? = nil,
        requiresAuth: Bool
    ) async throws -> T {
        guard let url = URL(string: path, relativeTo: AppConfig.apiBaseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if requiresAuth, let token = tokenStore.getToken(), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if (200..<300).contains(http.statusCode) {
            return try decoder.decode(T.self, from: data)
        }

        let message = (try? decoder.decode(APIErrorPayload.self, from: data).error) ?? "Erreur inconnue"
        throw APIError.httpError(statusCode: http.statusCode, message: message)
    }

    private struct APIErrorPayload: Decodable {
        let error: String
    }
}

struct StatsSummary: Decodable {
    let tradesCount: Int
    let winrate: Double
    let avgPnL: Double
    let profitFactor: Double

    enum CodingKeys: String, CodingKey {
        case tradesCount = "trades_count"
        case winrate
        case avgPnL = "avg_pnl"
        case profitFactor = "profit_factor"
    }
}

protocol TokenStore {
    func getToken() -> String?
    func setToken(_ token: String)
    func clearToken()
}

struct UserDefaultsTokenStore: TokenStore {
    private let key = "trading_saas_token"
    private let defaults = UserDefaults.standard

    func getToken() -> String? {
        defaults.string(forKey: key)
    }

    func setToken(_ token: String) {
        defaults.set(token, forKey: key)
    }

    func clearToken() {
        defaults.removeObject(forKey: key)
    }
}
