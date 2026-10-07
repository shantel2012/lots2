import React, { useState, useEffect } from 'react';
import { 
  X, 
  Radio, 
  Activity, 
  CheckCircle2, 
  Car, 
  RefreshCw, 
  ShieldAlert, 
  Layers, 
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParkingSpot } from '../services/parkingService';

interface BaySensor {
  id: string;
  bayNumber: string;
  section: string;
  status: 'vacant' | 'occupied';
  signalStrength: string;
  sensorType: string;
  lastDetectionSec: number;
}

interface LiveSensorModalProps {
  spot: ParkingSpot;
  onClose: () => void;
  onSelectBayForBooking: (spot: ParkingSpot, bayNumber: string) => void;
}

export const LiveSensorModal: React.FC<LiveSensorModalProps> = ({
  spot,
  onClose,
  onSelectBayForBooking,
}) => {
  const [bays, setBays] = useState<BaySensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulatingLive, setIsSimulatingLive] = useState(true);
  const [recentEvent, setRecentEvent] = useState<string>('Sensor network online. Polling ultrasonic nodes...');
  const [selectedBay, setSelectedBay] = useState<string | null>(null);

  const fetchSensorData = async () => {
    try {
      const res = await fetch(`/api/parkings/${spot.id}/sensors`);
      if (res.ok) {
        const data = await res.json();
        setBays(data.bays || []);
      }
    } catch {
      generateFallbackBays();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackBays = () => {
    const fallback: BaySensor[] = [];
    const openCount = spot.availableSpaces || 10;
    for (let i = 1; i <= 24; i++) {
      const section = String.fromCharCode(65 + Math.floor((i - 1) / 6));
      const bayNumber = `${section}-${String((i - 1) % 6 + 1).padStart(2, '0')}`;
      fallback.push({
        id: `sensor-${spot.id}-${i}`,
        bayNumber,
        section,
        status: i > openCount ? 'occupied' : 'vacant',
        signalStrength: '98%',
        sensorType: 'Dual-Node Ultrasonic',
        lastDetectionSec: Math.floor(Math.random() * 180) + 10,
      });
    }
    setBays(fallback);
  };

  useEffect(() => {
    fetchSensorData();
  }, [spot.id]);

  // Real-time sensor simulation pulse
  useEffect(() => {
    if (!isSimulatingLive || bays.length === 0) return;

    const interval = setInterval(() => {
      setBays(prev => {
        if (prev.length === 0) return prev;
        const randomIndex = Math.floor(Math.random() * prev.length);
        const target = prev[randomIndex];
        const newStatus = target.status === 'vacant' ? 'occupied' : 'vacant';
        const updated = [...prev];
        updated[randomIndex] = {
          ...target,
          status: newStatus,
          lastDetectionSec: 2,
        };

        setRecentEvent(
          newStatus === 'occupied' 
            ? `Vehicle docked at Bay ${target.bayNumber} (Ultrasonic trigger)`
            : `Bay ${target.bayNumber} vacated and available for reservation`
        );

        return updated;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulatingLive, bays.length]);

  const vacantCount = bays.filter(b => b.status === 'vacant').length;
  const occupiedCount = bays.filter(b => b.status === 'occupied').length;
  const occupancyPct = bays.length > 0 ? Math.round((occupiedCount / bays.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] my-auto"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30 animate-pulse flex-shrink-0">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold leading-none truncate">{spot.name}</h2>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex-shrink-0">
                  Live Telemetry
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block truncate">{spot.address}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-left">
          {/* Telemetry Summary Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block truncate">Open Stalls</span>
              <span className="text-sm sm:text-xl font-bold text-emerald-600 flex items-center gap-1 sm:gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                <span className="truncate">{vacantCount} Bays</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block truncate">Occupied</span>
              <span className="text-sm sm:text-xl font-bold text-slate-800 mt-0.5 truncate block">
                {occupiedCount} Bays
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block truncate">Lot Load</span>
              <span className="text-sm sm:text-xl font-bold text-indigo-600 mt-0.5 truncate block">
                {occupancyPct}%
              </span>
            </div>
          </div>

          {/* Real-time Activity Wire */}
          <div className="bg-slate-900 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-mono flex items-center justify-between gap-2 border border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 animate-pulse" />
              <span className="truncate text-[11px] sm:text-xs">{recentEvent}</span>
            </div>
            <button
              onClick={() => setIsSimulatingLive(!isSimulatingLive)}
              className="text-[10px] sm:text-[11px] text-emerald-400 hover:text-emerald-300 font-bold uppercase flex-shrink-0 ml-2"
            >
              {isSimulatingLive ? 'Pause' : 'Resume'}
            </button>
          </div>

          {/* Interactive Stalls Grid */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ultrasonic Bay Floor Map
              </span>
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                  Vacant
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-rose-500" />
                  Occupied
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                  Selected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5 p-3 sm:p-4 bg-slate-100/80 rounded-2xl border border-slate-200">
              {bays.map((bay) => {
                const isVacant = bay.status === 'vacant';
                const isSelected = selectedBay === bay.bayNumber;

                return (
                  <button
                    key={bay.id}
                    disabled={!isVacant}
                    onClick={() => setSelectedBay(bay.bayNumber)}
                    className={`p-2 sm:p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400 scale-105'
                        : isVacant
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-950 border-emerald-300/80 shadow-2xs'
                        : 'bg-rose-50 text-rose-300 border-rose-200/60 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold leading-none">{bay.bayNumber}</span>
                    <Car className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mt-1 sm:mt-1.5 ${
                      isSelected ? 'text-white' : isVacant ? 'text-emerald-700' : 'text-rose-400'
                    }`} />
                    <span className={`text-[8px] sm:text-[9px] mt-1 font-semibold uppercase ${
                      isSelected ? 'text-indigo-100' : isVacant ? 'text-emerald-700' : 'text-rose-500'
                    }`}>
                      {isVacant ? 'Open' : 'Parked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Reserve Section */}
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {selectedBay ? `Selected Bay ${selectedBay}` : 'Instant Bay Reservation'}
              </span>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {selectedBay ? 'Lock this specific bay number for your vehicle arrival.' : 'Click on any green vacant stall above to select it.'}
              </p>
            </div>
            {selectedBay ? (
              <button
                onClick={() => {
                  onSelectBayForBooking(spot, selectedBay);
                  onClose();
                }}
                className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Reserve Bay {selectedBay}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const firstOpen = bays.find(b => b.status === 'vacant');
                  onSelectBayForBooking(spot, firstOpen?.bayNumber || 'A-01');
                  onClose();
                }}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                Auto-Select Nearest Open Bay
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
