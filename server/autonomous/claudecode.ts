import { exec } from "child_process";

export class ClaudeCodeBridge {
  public static executeCommand(cmd: string): Promise<string> {
    return new Promise((resolve) => {
      exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) resolve(`Error: ${stderr || err.message}`);
        else resolve(stdout || "Executed successfully");
      });
    });
  }
}
