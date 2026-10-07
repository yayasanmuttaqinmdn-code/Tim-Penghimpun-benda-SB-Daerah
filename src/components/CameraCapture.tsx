import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, RefreshCw, Trash2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

interface CameraCaptureProps {
  label: string;
  photoDataUrl?: string;
  onPhotoCaptured: (base64Image: string | undefined) => void;
}

export default function CameraCapture({ label, photoDataUrl, onPhotoCaptured }: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load available cameras
  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
          const videoDevices = deviceInfos.filter(device => device.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        })
        .catch(err => {
          console.error("Error listing camera devices:", err);
        });
    }
  }, [isActive]);

  // Start video stream when camera is active or device changes
  useEffect(() => {
    if (!isActive) {
      stopStream();
      return;
    }

    stopStream();
    setError(null);

    const constraints: MediaStreamConstraints = {
      video: selectedDeviceId 
        ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        let msg = "Gagal mengakses kamera.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = "Izin kamera ditolak. Berikan izin akses kamera pada browser.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = "Perangkat kamera tidak ditemukan.";
        }
        setError(msg);
        setIsActive(false);
      });

    return () => {
      stopStream();
    };
  }, [isActive, selectedDeviceId]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCamera = () => {
    setIsActive(true);
  };

  const handleStopCamera = () => {
    setIsActive(false);
    stopStream();
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Get actual video dimensions
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame on the canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas image to base64 jpeg with moderate compression (0.75 quality)
        const photoBase64 = canvas.toDataURL('image/jpeg', 0.75);
        onPhotoCaptured(photoBase64);
        
        // Auto-turn off stream to save resources
        handleStopCamera();
      }
    } catch (err) {
      console.error("Error capturing photo:", err);
      setError("Gagal menangkap foto dari frame video.");
    }
  };

  const handleDeletePhoto = () => {
    onPhotoCaptured(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onPhotoCaptured(dataUrl);
    };
    reader.onerror = (err) => {
      console.error("Error reading file:", err);
      setError("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset to allow same file uploading if needed
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 font-sans">
      {/* Hidden fallback file/camera input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
          {label} <span className="text-rose-500">*</span>
        </span>
        {photoDataUrl && (
          <span className="text-[9px] text-sky-700 font-extrabold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Foto Tersimpan
          </span>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-semibold leading-normal">{error}</p>
        </div>
      )}

      {/* Captured Image Preview or Live Stream or Placeholder */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-slate-950">
        {photoDataUrl ? (
          // Captured Preview
          <img 
            src={photoDataUrl} 
            alt="Bukti Dokumentasi Kamera" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : isActive ? (
          // Live Video Stream
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]" // mirror effect is standard for user comfort
          />
        ) : (
          // Inactive / Placeholder Box
          <div className="text-center p-6 space-y-2 text-slate-400">
            <Camera className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kamera Mati</p>
            <p className="text-[10px] text-slate-550 max-w-[200px] mx-auto">
              Aktifkan kamera untuk mengambil foto dokumentasi fisik berkas secara langsung.
            </p>
          </div>
        )}

        {/* Action Controls Overlay inside Camera Frame */}
        {isActive && (
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-slate-950/85 backdrop-blur-md p-2 rounded-xl text-white">
            {/* Device Switcher */}
            {devices.length > 1 ? (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-800 text-white font-bold text-[9px] px-2 py-1 rounded-md border border-slate-700 outline-none max-w-[120px]"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 italic">Kamera Utama Aktif</span>
            )}

            <button
              type="button"
              onClick={handleCapture}
              className="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-[10px] uppercase font-black tracking-wide px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md"
            >
              <Camera className="w-3.5 h-3.5" /> Jepret Foto
            </button>
            
            <button
              type="button"
              onClick={handleStopCamera}
              className="bg-slate-800 hover:bg-slate-700 text-white text-[9px] uppercase font-bold tracking-wide px-2 py-1.5 rounded-md cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Outer Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {!photoDataUrl && !isActive && (
          <>
            <button
              type="button"
              onClick={handleStartCamera}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 border border-slate-950 text-white hover:text-amber-400 font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Camera className="w-4 h-4 text-amber-400" /> Buka Kamera (Webcam)
            </button>
            <button
              type="button"
              onClick={handleTriggerFileInput}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center shadow-sm"
            >
              <Camera className="w-4 h-4" /> Buka Kamera HP
            </button>
          </>
        )}

        {photoDataUrl && (
          <div className="flex w-full flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={handleStartCamera}
              className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold uppercase text-[9px] tracking-wide rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Kamera Web Baru
            </button>
            <button
              type="button"
              onClick={handleTriggerFileInput}
              className="flex-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-extrabold uppercase text-[9px] tracking-wide border border-sky-200 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Camera className="w-3.5 h-3.5" /> Kamera HP Baru
            </button>
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold uppercase text-[9px] tracking-wide rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
