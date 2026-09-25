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
        p.arguments = ["-l", "-c", "npm run dev"]

        var env = ProcessInfo.processInfo.environment
        let extraPaths = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        env["PATH"] = "\(extraPaths):\(env[\"PATH\"] ?? \"\")"
        env["HOST"] = "127.0.0.1"
        env["PORT"] = "3000"
        p.environment = env

        do {
            try p.run()
            self.process = p
            print("[BackendManager] Backend process started via zsh environment.")
        } catch {
            print("[BackendManager] Error: \(error.localizedDescription)")
        }
    }

    func stopBackend() {
        guard let p = process, p.isRunning else { return }
        p.terminate()
        p.waitUntilExit()
        process = nil
        print("[BackendManager] Backend process terminated.")
    }
}
