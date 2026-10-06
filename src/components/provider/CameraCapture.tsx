import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, Aperture, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (file: File, preview: string) => void;
    onClose: () => void;
    label?: string;
}

type Phase = 'permission' | 'loading' | 'stream' | 'preview' | 'error';

const CameraCapture = ({ onCapture, onClose, label }: CameraCaptureProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [phase, setPhase] = useState<Phase>('permission');
    const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [flashActive, setFlashActive] = useState(false);

    // Stop all tracks helper
    const stopStream = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    };

    // Cleanup on unmount
    useEffect(() => () => stopStream(), []);

    // ─── Request camera permission & start stream ──────────────────────────────
    const startCamera = useCallback(async () => {
        setPhase('loading');
        setErrorMsg('');

        // Guard: getUserMedia API available?
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMsg(
                'Your browser does not support camera access.\n' +
                'Please use Chrome or Safari on your phone, and make sure the page is loaded over HTTPS.'
            );
            setPhase('error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' }, // rear camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to load before playing
                await new Promise<void>((resolve, reject) => {
                    const v = videoRef.current!;
                    v.onloadedmetadata = () => resolve();
                    v.onerror = () => reject(new Error('Video load failed'));
                    setTimeout(() => reject(new Error('Timeout')), 8000);
                });
                await videoRef.current.play();
            }

            setPhase('stream');
        } catch (err: unknown) {
            stopStream();

            const name = (err as { name?: string })?.name ?? '';
            const message = (err as { message?: string })?.message ?? '';

            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setErrorMsg(
                    'Camera permission was denied.\n\n' +
                    'To fix this:\n' +
                    '1. Tap the 🔒 lock icon in your browser address bar\n' +
                    '2. Set Camera → Allow\n' +
                    '3. Refresh the page and try again'
                );
            } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                setErrorMsg('No camera found on this device. Please use a device with a camera.');
            } else if (name === 'NotReadableError' || name === 'TrackStartError') {
                setErrorMsg(
                    'Camera is already in use by another app.\n' +
                    'Please close other apps using the camera and try again.'
                );
            } else if (name === 'OverconstrainedError') {
                // Retry with relaxed constraints
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    streamRef.current = fallbackStream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallbackStream;
                        await videoRef.current.play();
                    }
                    setPhase('stream');
                    return;
                } catch {
                    setErrorMsg('Could not access camera. Please try again.');
                }
            } else {
                setErrorMsg(`Could not start camera: ${message || name || 'Unknown error'}.`);
            }

            setPhase('error');
        }
    }, []);

    // ─── Shutter: capture current frame ────────────────────────────────────────
    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        // White flash
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 180);

        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedDataUrl(dataUrl);

        stopStream(); // release camera while previewing
        setPhase('preview');
    };

    // ─── Retake ─────────────────────────────────────────────────────────────────
    const retake = () => {
        setCapturedDataUrl(null);
        startCamera();
    };

    // ─── Confirm → create File object and hand back to parent ──────────────────
    const confirm = () => {
        if (!capturedDataUrl || !canvasRef.current) return;
        canvasRef.current.toBlob(blob => {
            if (!blob) return;
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file, capturedDataUrl);
            onClose();
        }, 'image/jpeg', 0.92);
    };

    const handleClose = () => {
        stopStream();
        onClose();
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">

            {/* Flash overlay */}
            {flashActive && (
                <div className="absolute inset-0 bg-white z-20 pointer-events-none" style={{ opacity: 0.85 }} />
            )}

            {/* Close button */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-30 w-11 h-11 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                aria-label="Close camera"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Label pill */}
            {label && phase === 'stream' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/60 rounded-full px-4 py-1.5 max-w-[70%]">
                    <p className="text-white text-sm font-medium text-center truncate">{label}</p>
                </div>
            )}

            {/* ── PERMISSION GATE ─────────────────────────────────────────────────── */}
            {phase === 'permission' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-12 h-12 text-blue-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-white text-xl font-bold mb-2">Camera Permission Required</h2>
                        <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                            To take a job photo, this app needs access to your camera.
                            Tap the button below and allow camera access when prompted.
                        </p>
                    </div>
                    <button
                        onClick={startCamera}
                        className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl transition-colors active:scale-95"
                    >
                        <Camera className="w-6 h-6" />
                        Allow Camera &amp; Open
                    </button>
                    <button
                        onClick={handleClose}
                        className="text-white/50 text-sm underline underline-offset-2 hover:text-white/80 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* ── LOADING ─────────────────────────────────────────────────────────── */}
            {phase === 'loading' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                    <p className="text-white/80 text-sm font-medium">Starting camera…</p>
                </div>
            )}

            {/* ── LIVE STREAM ─────────────────────────────────────────────────────── */}
            {(phase === 'stream' || phase === 'loading') && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`flex-1 w-full object-cover ${phase === 'loading' ? 'opacity-0 absolute' : 'opacity-100'}`}
                />
            )}

            {phase === 'stream' && (
                <>
                    {/* Viewfinder corners */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div className="w-60 h-60 relative">
                            <div className="absolute top-0 left-0  w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0  w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                        </div>
                    </div>

                    {/* Shutter bar */}
                    <div className="relative z-20 flex justify-center items-center py-8 bg-gradient-to-t from-black/80 to-transparent">
                        <button
                            onClick={takePhoto}
                            className="w-20 h-20 rounded-full bg-white border-[5px] border-gray-300 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
                            aria-label="Take photo"
                        >
                            <Aperture className="w-10 h-10 text-gray-700" />
                        </button>
                    </div>
                </>
            )}

            {/* ── PREVIEW ─────────────────────────────────────────────────────────── */}
            {phase === 'preview' && capturedDataUrl && (
                <>
                    <img
                        src={capturedDataUrl}
                        alt="captured"
                        className="flex-1 w-full object-cover"
                    />
                    <div className="z-20 flex justify-center items-center gap-10 py-8 bg-gradient-to-t from-black/80 to-transparent">
                        <button onClick={retake} className="flex flex-col items-center gap-1.5 text-white">
                            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center hover:bg-white/30 transition-colors active:scale-90">
                                <RefreshCw className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-xs font-semibold tracking-wide">RETAKE</span>
                        </button>
                        <button onClick={confirm} className="flex flex-col items-center gap-1.5 text-white">
                            <div className="w-16 h-16 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center hover:bg-green-600 transition-colors active:scale-90 shadow-lg shadow-green-500/40">
                                <Check className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-xs font-semibold tracking-wide">USE PHOTO</span>
                        </button>
                    </div>
                </>
            )}

            {/* ── ERROR ───────────────────────────────────────────────────────────── */}
            {phase === 'error' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                    <div className="text-center max-w-xs">
                        <p className="text-white font-semibold text-base mb-2">Camera Error</p>
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{errorMsg}</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={startCamera}
                            className="w-full py-3 bg-white rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors active:scale-95"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
