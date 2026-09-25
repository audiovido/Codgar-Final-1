import Foundation

final class BackendManager {
    static let shared = BackendManager()
    private var process: Process?

    private init() {}

    func startBackend(workingDirectory: String) {
        guard process == nil else { return }

        let p = Process()
        p.currentDirectoryURL = URL(fileURLWithPath: workingDirectory)
        p.executableURL = URL(fileURLWithPath: "/bin/zsh")
        // آزادسازی خودکار پورت ۳۰۰۰ قبل از ران کردن سرور
        p.arguments = ["-l", "-c", "lsof -ti:3000 | xargs kill -9 2>/dev/null || true; npm run dev"]

        var env = ProcessInfo.processInfo.environment
        let extraPaths = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        let existingPath = env["PATH"] ?? ""
        env["PATH"] = "\(extraPaths):\(existingPath)"
        env["HOST"] = "127.0.0.1"
        env["PORT"] = "3000"
        p.environment = env

        do {
            try p.run()
            self.process = p
            print("[BackendManager] Backend started cleanly on port 3000.")
        } catch {
            print("[BackendManager] Error: \(error.localizedDescription)")
        }
    }

    func stopBackend() {
        guard let p = process, p.isRunning else { return }
        p.terminate()
        p.waitUntilExit()
        process = nil
    }
}
