import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Car, 
  Clock, 
  Timer, 
  Trash2, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Sparkles,
  Compass,
  Plus,
  RotateCcw,
  Footprints
} from 'lucide-react';
import { motion } from 'motion/react';

export interface ParkedCarLocation {
  id?: string;
  facilityName: string;
  level: string;
  bayNumber: string;
  carPlate?: string;
  notes?: string;
  parkedAt: string;
  expiresAt?: string;
}

interface FindMyCarModalProps {
  userId: string;
  onClose: () => void;
  onPinSaved: () => void;
}

export const FindMyCarModal: React.FC<FindMyCarModalProps> = ({
  userId,
  onClose,
  onPinSaved,
}) => {
  const [currentPin, setCurrentPin] = useState<ParkedCarLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilityName, setFacilityName] = useState('');
  const [level, setLevel] = useState('Ground Floor');
  const [bayNumber, setBayNumber] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [notes, setNotes] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(120);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch saved pin
  const fetchCarLocation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/car-location/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.facilityName) {
          setCurrentPin(data);
        } else {
          const local = localStorage.getItem(`parkfinder_car_${userId}`);
          if (local) setCurrentPin(JSON.parse(local));
        }
      }
    } catch {
      const local = localStorage.getItem(`parkfinder_car_${userId}`);
      if (local) setCurrentPin(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarLocation();
  }, [userId]);

  // Live timer tick
  useEffect(() => {
    if (!currentPin?.expiresAt) {
      setRemainingTime('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(currentPin.expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTime('Meter Expired!');
        setIsExpiringSoon(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingTime(`${hours}h ${mins}m ${secs}s left`);
        setIsExpiringSoon(diff < 15 * 60 * 1000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentPin]);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim() || !bayNumber.trim()) return;

    setIsSaving(true);
    const newPin: ParkedCarLocation = {
      facilityName: facilityName.trim(),
      level: level.trim(),
      bayNumber: bayNumber.trim(),
      carPlate: carPlate.trim(),
      notes: notes.trim(),
      parkedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + timerMinutes * 60 * 1000).toISOString(),
    };

    try {
      await fetch('/api/car-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newPin }),
      });
      localStorage.setItem(`parkfinder_car_${userId}`, JSON.stringify(newPin));
      setCurrentPin(newPin);
      onPinSaved();
    } catch {
      localStorage.setItem(`parkfinder_car_${userId}`, JSON.stringify(newPin));
      setCurrentPin(newPin);
      onPinSaved();
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtendTimer = async (additionalMinutes: number) => {
    if (!currentPin) return;
    const baseTime = currentPin.expiresAt ? Math.max(Date.now(), new Date(currentPin.expiresAt).getTime()) : Date.now();
    const newExpiresAt = new Date(baseTime + additionalMinutes * 60 * 1000).toISOString();

    const updatedPin = {
      ...currentPin,
      expiresAt: newExpiresAt,
    };

    try {
      await fetch('/api/car-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updatedPin }),
      });
      localStorage.setItem(`parkfinder_car_${userId}`, JSON.stringify(updatedPin));
      setCurrentPin(updatedPin);
    } catch {
      localStorage.setItem(`parkfinder_car_${userId}`, JSON.stringify(updatedPin));
      setCurrentPin(updatedPin);
    }
  };

  const handleClearPin = async () => {
    try {
      await fetch(`/api/car-location/${userId}`, { method: 'DELETE' });
    } catch {}
    localStorage.removeItem(`parkfinder_car_${userId}`);
    setCurrentPin(null);
    onPinSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] my-auto"
      >
        {/* Header - Unified with Emerald & Slate Brand Theme */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30 flex-shrink-0">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold leading-none truncate">Find My Parked Car</h2>
              <span className="text-[11px] text-emerald-200 mt-1 block truncate">
                Bay Location Memory & Parking Meter Expiry Warning
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {currentPin ? (
            /* Active Car Pin View - Emerald Color Theme */
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-emerald-50/70 to-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-md">
                      Parked Location Pinned
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{currentPin.facilityName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {currentPin.level} • <strong className="text-emerald-800 font-mono text-sm">Bay {currentPin.bayNumber}</strong>
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200/60 flex-shrink-0">
                    <Car className="w-6 h-6" />
                  </div>
                </div>

                {currentPin.carPlate && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 shadow-2xs">
                    <span>Plate: {currentPin.carPlate}</span>
                  </div>
                )}

                {currentPin.notes && (
                  <div className="mt-3 p-2.5 bg-white/80 rounded-xl border border-slate-200/70 text-xs text-slate-600 italic">
                    "{currentPin.notes}"
                  </div>
                )}

                {/* Meter Expiry Clock */}
                {remainingTime && (
                  <div className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isExpiringSoon 
                      ? 'bg-rose-50 border-rose-300 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Timer className={`w-4 h-4 flex-shrink-0 ${isExpiringSoon ? 'text-rose-600 animate-spin' : 'text-emerald-600'}`} />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block">Parking Meter Status</span>
                        <span className="text-sm font-bold font-mono">{remainingTime}</span>
                      </div>
                    </div>

                    {/* Quick Extend Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExtendTimer(15)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                        title="Add 15 minutes to parking meter"
                      >
                        +15m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendTimer(30)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                        title="Add 30 minutes to parking meter"
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendTimer(60)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                        title="Add 1 hour to parking meter"
                      >
                        +1h
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${currentPin.facilityName} Harare`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Footprints className="w-4 h-4" />
                  <span>Walking Directions Back to Car</span>
                </a>

                <button
                  onClick={handleClearPin}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clear Car Pin"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Pin</span>
                </button>
              </div>
            </div>
          ) : (
            /* Pin Form - Emerald Theme */
            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Parking Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meikles Hotel Underground Bay"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Floor / Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Level P1 (Basement)">Level P1</option>
                    <option value="Level P2 (Basement)">Level P2</option>
                    <option value="Level P3 (Basement)">Level P3</option>
                    <option value="Rooftop Deck">Rooftop Deck</option>
                    <option value="Open Street Bay">Open Street</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bay # or Pillar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-14 / Pillar 3"
                    value={bayNumber}
                    onChange={(e) => setBayNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    License Plate (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC-1234"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Meter Timer
                  </label>
                  <select
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                    <option value={180}>3 Hours</option>
                    <option value={240}>4 Hours</option>
                    <option value={480}>8 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Location Note / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near lift lobby, next to security station"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Pin...' : 'Pin Car Location & Start Meter'}</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
