import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { Camera, CameraOff, X } from 'lucide-react';

interface AgentQrScannerProps {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onScan: (token: string) => void;
}

export default function AgentQrScanner({ open, disabled, onClose, onScan }: AgentQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || disabled) return;
    scannedRef.current = false;
    setError('');
    let cancelled = false;

    void import('@zxing/browser').then(({ BrowserQRCodeReader }) => {
      const reader = new BrowserQRCodeReader();
      return reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current!,
        (result) => {
          if (!result || cancelled || scannedRef.current) return;
          scannedRef.current = true;
          controlsRef.current?.stop();
          onScan(result.getText().trim());
        },
      );
    })
      .then((controls) => {
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => {
        setError('Camera unavailable. Allow camera access or use the ticket number instead.');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [disabled, onScan, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Agent check-in</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">Scan appointment QR</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close scanner" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="relative aspect-square max-h-[55vh] overflow-hidden rounded-3xl bg-slate-950">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-[15%] border-4 border-white rounded-3xl shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
            <div className="absolute left-[18%] right-[18%] top-1/2 h-0.5 bg-indigo-400 shadow-[0_0_12px_#818cf8]" />
          </div>
          {error ? (
            <div className="mt-4 flex gap-3 rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
              <CameraOff className="w-5 h-5 shrink-0" /><p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="mt-4 flex gap-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-4 text-indigo-700 dark:text-indigo-300">
              <Camera className="w-5 h-5 shrink-0" /><p className="text-sm">Ask the visitor to present the QR ticket and keep it inside the frame.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
