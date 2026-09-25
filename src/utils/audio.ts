export class VoiceRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;

  public async startRecording(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(200);
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('[VoiceRecorder] Microphone access error:', err);
      return false;
    }
  }

  public async stopRecording(): Promise<string> {
    if (!this.mediaRecorder || !this.isRecording) return '';

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }

        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          try {
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Data, mimeType })
            });
            const data = await res.json();
            const text = data.text || data.transcript || '';
            resolve(text);
          } catch (err) {
            console.error('[VoiceRecorder] Transcribe fetch error:', err);
            resolve('');
          }
        };
      };

      this.mediaRecorder!.stop();
      this.isRecording = false;
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const voiceRecorder = new VoiceRecorderService();
