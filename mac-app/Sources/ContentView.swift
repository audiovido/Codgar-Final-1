import SwiftUI

public struct ContentView: View {
    public init() {}

    public var body: some View {
        WebView(url: URL(string: "http://127.0.0.1:3000")!)
            .ignoresSafeArea()
            .frame(minWidth: 1100, minHeight: 750)
    }
}
