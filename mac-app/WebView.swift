import SwiftUI
import WebKit

struct LocalWebView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}

struct ContentView: View {
    private let targetURL = URL(string: "http://127.0.0.1:3000")!

    var body: some View {
        LocalWebView(url: targetURL)
            .frame(minWidth: 1100, minHeight: 750)
            .background(Color.black)
    }
}
