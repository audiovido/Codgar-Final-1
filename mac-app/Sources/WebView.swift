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

        init(url: URL) {
            self.url = url
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.webView?.window?.makeKeyAndOrderFront(nil)
                self.webView?.window?.makeFirstResponder(self.webView)

                // تزریق استایل‌های رفع لرزش منوها و همگام‌ساز ویس به هر دو کادر
                let js = """
                // رفع قطعی لرزش منوهای MCP
                const style = document.createElement('style');
                style.innerHTML = `
                  *, *::before, *::after {
                    -webkit-font-smoothing: antialiased;
                    -webkit-backface-visibility: hidden !important;
                    backface-visibility: hidden !important;
                  }
                  button, a, [role="button"], .cursor-pointer {
                    transform: translateZ(0) !important;
                    -webkit-transform: translateZ(0) !important;
                    will-change: auto !important;
                  }
                `;
                document.head.appendChild(style);

                // همگام‌سازی دائمی ویس در کادر ویس و کادر اصلی تایپ پیام
                window.syncVoiceToInputs = function(text) {
                  // کادر اصلی تایپ پیام پایین
                  const chatInput = document.querySelector('input[placeholder*="Type your message"], textarea[placeholder*="Type your message"]');
                  if (chatInput) {
                    chatInput.value = text;
                    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                    chatInput.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                  // کادر داخل ویس ریکوردر
                  const voiceBox = document.querySelector('[data-voice-transcript], .voice-transcript');
                  if (voiceBox) {
                    voiceBox.textContent = text;
                  }
                };
                """
                self.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let nsError = error as NSError
            if nsError.code == NSURLErrorCannotConnectToHost && retryCount < 20 {
                retryCount += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    webView.load(URLRequest(url: self.url))
                }
            }
        }

        // باز کردن لینک‌های اکانت و جیمیل در مرورگر اصلی سیستم
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let targetURL = navigationAction.request.url, targetURL.scheme == "http" || targetURL.scheme == "https" {
                if targetURL.host != "127.0.0.1" && targetURL.host != "localhost" {
                    NSWorkspace.shared.open(targetURL)
                    decisionHandler(.cancel)
                    return
                }
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let targetURL = navigationAction.request.url {
                NSWorkspace.shared.open(targetURL)
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
