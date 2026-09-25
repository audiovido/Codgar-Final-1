import SwiftUI
import WebKit
import AppKit

class FocusableWKWebView: WKWebView {
    override var acceptsFirstResponder: Bool { true }
}

struct LocalWebView: NSViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsAirPlayForMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

        let webView = FocusableWKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        context.coordinator.webView = webView

        DispatchQueue.main.async {
            webView.window?.makeKeyAndOrderFront(nil)
            webView.window?.makeFirstResponder(webView)
        }

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let url: URL
        weak var webView: WKWebView?
        private var retryCount = 0
        private var popupWindows: [NSWindow] = []

        init(url: URL) {
            self.url = url
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.webView?.window?.makeKeyAndOrderFront(nil)
                self.webView?.window?.makeFirstResponder(self.webView)
            }
        }

        // تلاش مجدد خودکار بلافاصله پس از آماده شدن سرور (رفع سفیدی صفحه)
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            if nsError.code == NSURLErrorCannotConnectToHost && retryCount < 30 {
                retryCount += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    webView.load(URLRequest(url: self.url))
                }
            }
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let targetURL = navigationAction.request.url {
                if targetURL.absoluteString.contains("voice.html") || targetURL.host == "127.0.0.1" || targetURL.host == "localhost" {
                    let popupWindow = NSWindow(
                        contentRect: NSRect(x: 0, y: 0, width: 380, height: 280),
                        styleMask: [.titled, .closable],
                        backing: .buffered,
                        defer: false
                    )
                    popupWindow.title = "Voice Input"
                    popupWindow.center()
                    popupWindow.level = .floating

                    let popupWebView = WKWebView(frame: popupWindow.contentView!.bounds, configuration: configuration)
                    popupWebView.autoresizingMask = [.width, .height]
                    popupWebView.uiDelegate = self
                    popupWindow.contentView?.addSubview(popupWebView)
                    popupWindow.makeKeyAndOrderFront(nil)
                    self.popupWindows.append(popupWindow)
                    return popupWebView
                } else {
                    NSWorkspace.shared.open(targetURL)
                }
            }
            return nil
        }

        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
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
