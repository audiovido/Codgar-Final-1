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

                // تزریق ریکوردر با کیفیت بالا و تایپ همزمان در کادر ویس و کادر پیام
                let js = """
                window.setupNativeAudioBridge = function() {
                  let mediaRecorder = null;
                  let audioChunks = [];
                  let isRecording = false;

                  const micButtons = document.querySelectorAll('button:has(svg), .mic-button, [aria-label*="voice"], [aria-label*="mic"]');
                  
                  window.handleVoiceToggle = async function() {
                    if (!isRecording) {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioChunks = [];
                        mediaRecorder = new MediaRecorder(stream);
                        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
                        mediaRecorder.onstop = async () => {
                          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                          const reader = new FileReader();
                          reader.readAsDataURL(audioBlob);
                          reader.onloadend = async () => {
                            const base64Data = reader.result;
                            try {
                              const res = await fetch('/api/transcribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ audio: base64Data, mimeType: 'audio/webm' })
                              });
                              const data = await res.json();
                              const transcribed = data.text || data.transcript || '';
                              if (transcribed) {
                                // ۱. درج در کادر اصلی پیام پایین
                                const chatInput = document.querySelector('input[placeholder*="Type your message"], textarea[placeholder*="Type your message"]');
                                if (chatInput) {
                                  chatInput.value = transcribed;
                                  chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                                  chatInput.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                                // ۲. درج در کادر داخل ویس ریکوردر
                                const voiceBox = document.querySelector('[data-voice-transcript], .voice-transcript, .recording-box');
                                if (voiceBox) {
                                  voiceBox.textContent = transcribed;
                                }
                              }
                            } catch (err) {
                              console.error('Transcription error:', err);
                            }
                          };
                        };
                        mediaRecorder.start();
                        isRecording = true;
                      } catch (err) {
                        console.error('Microphone access denied:', err);
                      }
                    } else {
                      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                        mediaRecorder.stop();
                      }
                      isRecording = false;
                    }
                  };
                };
                window.setupNativeAudioBridge();
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
