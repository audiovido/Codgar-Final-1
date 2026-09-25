import SwiftUI
import WebKit

struct LocalWebView: NSViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        context.coordinator.webView = webView
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKNavigationDelegate {
        let url: URL
        weak var webView: WKWebView?
        private var retryCount = 0

        init(url: URL) {
            self.url = url
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            if nsError.code == NSURLErrorCannotConnectToHost && retryCount < 15 {
                retryCount += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    webView.load(URLRequest(url: self.url))
                }
            }
        }
    }
}

struct ContentView: View {
    private let targetURL = URL(string: "http://127.0.0.1:3000")!

    var body: some View {
        LocalWebView(url: targetURL)
            .frame(minWidth: 1100, minHeight: 750)
            .background(Color.black)
    }
}
