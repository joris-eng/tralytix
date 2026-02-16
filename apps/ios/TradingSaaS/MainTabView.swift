import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            ChartView()
                .tabItem {
                    Label("Chart", systemImage: "chart.xyaxis.line")
                }

            StatsView()
                .tabItem {
                    Label("Stats", systemImage: "chart.bar.doc.horizontal")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}

#Preview {
    MainTabView()
}
