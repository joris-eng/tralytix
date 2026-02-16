import Foundation

enum AppConfig {
    // Point unique de configuration pour iOS.
    // Pour un iPhone physique, remplacez localhost par l'IP LAN de votre Mac.
    static let apiBaseURL = URL(string: "http://localhost:8080")!
    static let webBaseURL = URL(string: "http://localhost:3000")!
}
