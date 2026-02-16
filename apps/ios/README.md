# TradingSaaS iOS

Fichiers SwiftUI ajoutes pour un projet Xcode `TradingSaaS`:
- `Shared/Config/AppConfig.swift`
- `Shared/Networking/APIClient.swift`
- `Features/Auth/LoginView.swift`
- `Features/Chart/ChartView.swift`
- `Features/Stats/StatsView.swift`
- `Features/Settings/SettingsView.swift`
- `MainTabView.swift`
- `TradingSaaSApp.swift`

## Configuration locale

Dans `AppConfig.swift`, remplacez:
- `http://localhost:8080`
- `http://localhost:3000`

par l'IP LAN de votre Mac pour tester sur iPhone physique (meme Wi-Fi), par exemple:
- `http://192.168.1.25:8080`
- `http://192.168.1.25:3000`

## ATS Debug

Un fichier `Config/Info-Debug.plist` est fourni avec:
- exception `localhost` HTTP
- `NSAllowsLocalNetworking = true`

Dans Xcode (target app):
1. Build Settings
2. `Info.plist File`
3. Pour la config `Debug`, pointer vers:
   `TradingSaaS/Config/Info-Debug.plist`
