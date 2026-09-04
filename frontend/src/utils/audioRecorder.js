export class AudioRecorderError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'AudioRecorderError';
    }
}
const DEFAULT_AUDIO_CONFIG = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 44100
};
export class AudioRecorder {
    constructor() {
        this.recorder = null;
        this.stream = null;
        this.chunks = [];
        this.onDataCallback = null;
    }
    async start(onData) {
        try {
            this.onDataCallback = onData;
            this.chunks = [];
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: DEFAULT_AUDIO_CONFIG
            });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            this.recorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000
            });
            this.stream = stream;
            this.setupRecorderEvents();
            this.recorder.start();
        }
        catch (error) {
            this.cleanup();
            throw new AudioRecorderError('Failed to start recording: ' + (error instanceof Error ? error.message : 'Unknown error'), error);
        }
    }
    setupRecorderEvents() {
        if (!this.recorder)
            return;
        this.recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.chunks.push(event.data);
            }
        };
        this.recorder.onstop = () => {
            if (this.chunks.length === 0) {
                this.cleanup();
                throw new AudioRecorderError('No audio data recorded');
            }
            const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || 'audio/webm' });
            if (blob.size === 0) {
                this.cleanup();
                throw new AudioRecorderError('Empty audio recording');
            }
            if (this.onDataCallback) {
                this.onDataCallback(blob);
            }
            this.cleanup();
        };
    }
    stop() {
        try {
            if (this.recorder?.state === 'recording') {
                this.recorder.stop();
            }
        }
        catch (error) {
            this.cleanup();
            throw new AudioRecorderError('Failed to stop recording', error);
        }
    }
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.recorder = null;
        this.stream = null;
        this.chunks = [];
        this.onDataCallback = null;
    }
    isRecording() {
        return this.recorder?.state === 'recording';
    }
}
