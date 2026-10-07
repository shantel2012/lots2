import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Car, 
  Clock, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  ArrowRight, 
  Loader2,
  ExternalLink,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BookingRecord {
  id: string;
  userId: string;
  parkingId: string;
  parkingName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'cancelled' | 'checked_in';
  createdAt: string;
  userName?: string;
  carPlate?: string;
  checkedInAt?: string;
}

interface ParkingPassModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onCheckInSuccess: (bookingId: string, checkedInAt: string) => void;
}

export const ParkingPassModal: React.FC<ParkingPassModalProps> = ({
  booking,
  onClose,
  onCheckInSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCheckedIn = booking.status === 'checked_in' || scanSuccess;
  const isCancelled = booking.status === 'cancelled';

  // Construct structured QR payload for gate arrival scanner
  const qrPayload = JSON.stringify({
    passId: booking.id,
    facility: booking.parkingName,
    driver: booking.userName || 'Driver',
    vehicle: booking.carPlate || 'Standard Vehicle',
    validFrom: booking.startTime,
    validUntil: booking.endTime || 'Open',
    timestamp: booking.createdAt,
    app: 'ParkFinder',
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateGateScan = async () => {
    if (isCheckedIn || isCancelled) return;
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/checkin`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setScanSuccess(true);
        onCheckInSuccess(booking.id, data.checkedInAt || new Date().toISOString());
      } else {
        const err = await response.json();
        setErrorMessage(err.error || 'Gate check-in failed.');
      }
    } catch {
      setErrorMessage('Unable to connect to gate arrival scanner.');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatShortTime = (isoString?: string) => {
    if (!isoString) return 'Flexible';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] my-auto"
      >
        {/* Pass Top Banner */}
        <div className={`px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-white flex-shrink-0 ${
          isCheckedIn ? 'bg-gradient-to-r from-emerald-700 to-teal-800' : isCancelled ? 'bg-slate-700' : 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900'
        }`}>
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2.5 py-0.5 rounded-full flex-shrink-0">
                Digital Entry Pass
              </span>
              {isCheckedIn && (
                <span className="text-[10px] font-bold tracking-widest uppercase bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Barrier Cleared
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 leading-snug truncate">{booking.parkingName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-center">
          {/* QR Code Container */}
          <div className="flex flex-col items-center">
            <div className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-md relative group max-w-[240px] w-full flex items-center justify-center">
              <QRCodeSVG
                value={qrPayload}
                size={180}
                level="M"
                includeMargin={false}
                className="w-full h-auto max-w-[180px] rounded-lg"
              />

              {/* Laser sweep animation when scanning */}
              {isScanning && (
                <div className="absolute inset-x-2 top-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_1.5s_infinite]" />
              )}

              {/* Barrier opened overlay */}
              {isCheckedIn && (
                <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-4 text-white">
                  <CheckCircle2 className="w-10 sm:w-12 h-10 sm:h-12 text-emerald-400 mb-1.5 animate-bounce" />
                  <span className="font-bold text-sm sm:text-base">Gate Barrier Opened</span>
                  <span className="text-[11px] text-emerald-200 mt-0.5">Arrival Verified & Docked</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span>Pass #{booking.id.slice(0, 10).toUpperCase()}</span>
              <button 
                onClick={handleCopyId} 
                className="hover:text-slate-900 transition-colors p-0.5 cursor-pointer"
                title="Copy Pass ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Present this QR code to the entrance optical reader at the boom barrier.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left">
              {errorMessage}
            </div>
          )}

          {/* Reservation Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Driver</span>
              <span className="font-bold text-slate-900">{booking.userName || 'Registered Driver'}</span>
            </div>

            {booking.carPlate && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Vehicle Plate</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {booking.carPlate}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Valid From</span>
              <span className="font-semibold text-slate-800">{formatShortTime(booking.startTime)}</span>
            </div>

            {booking.endTime && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Valid Until</span>
                <span className="font-semibold text-slate-800">{formatShortTime(booking.endTime)}</span>
              </div>
            )}

            {booking.checkedInAt && (
              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                <span className="font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Arrival Scanned
                </span>
                <span className="font-bold">{formatShortTime(booking.checkedInAt)}</span>
              </div>
            )}
          </div>

          {/* Gate Arrival Scan Button */}
          {!isCancelled && !isCheckedIn && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSimulateGateScan}
                disabled={isScanning}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optical Scanner Reading QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Scan Arrival at Gate Barrier</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                Simulates optical laser scan at the boom barrier to open gate.
              </p>
            </div>
          )}

          {isCheckedIn && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2.5 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Arrival Confirmed & Gate Opened</p>
                <p className="text-emerald-700 text-[11px]">Your parking space is marked active and reserved for your stay.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
