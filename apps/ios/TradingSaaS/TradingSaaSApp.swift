import SwiftUI

@main
struct TradingSaaSApp: App {
    @State private var showLogin = !APIClient.shared.hasToken()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .sheet(isPresented: $showLogin) {
                    LoginView()
                }
        }
    }
}
