/**
 * Exportador de vídeo profissional para simulações
 */
class VideoExporter {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.options = {
            fps: 30,
            quality: 0.92,
            resolution: '1080p',
            duration: 60, // segundos
            cameraPaths: [],
            timeLapse: false,
            timeLapseSpeed: 24,
            includeAudio: true,
            audioTrack: null,
            watermark: null,
            ...options
        };
        
        this.recorder = null;
        this.chunks = [];
        this.isRecording = false;
        this.startTime = 0;
        this.frameCount = 0;
        
        this.initRecorder();
    }

    initRecorder() {
        // Obter stream do canvas
        const canvasStream = this.renderer.domElement.captureStream(this.options.fps);
        
        // Configurar MediaRecorder
        const mimeType = 'video/webm;codecs=h264';
        
        if (MediaRecorder.isTypeSupported(mimeType)) {
            this.recorder = new MediaRecorder(canvasStream, {
                mimeType: mimeType,
                videoBitsPerSecond: this.getBitrate()
            });
        } else {
            this.recorder = new MediaRecorder(canvasStream);
        }
        
        // Configurar eventos
        this.recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.chunks.push(event.data);
            }
        };
        
        this.recorder.onstop = () => {
            this.onRecordingComplete();
        };
    }

    async startRecording() {
        this.isRecording = true;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.chunks = [];
        
        // Iniciar captura
        this.recorder.start(1000); // Coletar dados a cada 1 segundo
        
        // Adicionar trilha de áudio se especificado
        if (this.options.includeAudio && this.options.audioTrack) {
            await this.addAudioTrack();
        }
        
        // Iniciar captura de câmera automática
        if (this.options.cameraPaths.length > 0) {
            this.startCameraAnimation();
        }
        
        console.log('🎥 Gravação iniciada');
    }

    stopRecording() {
        this.isRecording = false;
        this.recorder.stop();
    }

    onRecordingComplete() {
        // Combinar chunks em blob
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        
        // Processar vídeo se necessário
        if (this.options.timeLapse) {
            this.createTimeLapse(blob);
        } else {
            this.downloadVideo(blob);
        }
    }

    createTimeLapse(sourceBlob) {
        // Criar timelapse do vídeo
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(sourceBlob);
        
        videoElement.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Configurar canvas
            canvas.width = this.getResolution().width;
            canvas.height = this.getResolution().height;
            
            // Criar timelapse
            this.processTimeLapseFrames(videoElement, canvas, ctx);
        };
    }

    getBitrate() {
        const resolutions = {
            '480p': 500000,
            '720p': 1500000,
            '1080p': 4000000,
            '2K': 8000000,
            '4K': 16000000
        };
        
        return resolutions[this.options.resolution] || 4000000;
    }

    getResolution() {
        const resolutions = {
            '480p': { width: 854, height: 480 },
            '720p': { width: 1280, height: 720 },
            '1080p': { width: 1920, height: 1080 },
            '2K': { width: 2560, height: 1440 },
            '4K': { width: 3840, height: 2160 }
        };
        
        return resolutions[this.options.resolution] || { width: 1920, height: 1080 };
    }

    addWatermark(frameCanvas) {
        if (!this.options.watermark) return;
        
        const ctx = frameCanvas.getContext('2d');
        
        // Adicionar logo
        const logo = new Image();
        logo.src = this.options.watermark.image;
        
        logo.onload = () => {
            ctx.drawImage(
                logo,
                frameCanvas.width - logo.width - 20,
                frameCanvas.height - logo.height - 20
            );
            
            // Adicionar texto
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '16px Arial';
            ctx.fillText(
                `StructuralCAD Pro - ${new Date().toLocaleDateString()}`,
                20,
                frameCanvas.height - 20
            );
        };
    }
}