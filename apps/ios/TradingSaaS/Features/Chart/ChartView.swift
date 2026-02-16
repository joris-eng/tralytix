import SwiftUI
import WebKit

struct ChartView: View {
    var body: some View {
        NavigationStack {
            ChartWebView(url: AppConfig.webBaseURL.appendingPathComponent("chart"))
                .navigationTitle("Chart")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct ChartWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        return WKWebView(frame: .zero, configuration: config)
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: url))
    }
}

#Preview {
    ChartView()
}
