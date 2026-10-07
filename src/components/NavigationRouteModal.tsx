import React, { useState } from 'react';
import { 
  X, 
  Navigation, 
  MapPin, 
  Clock, 
  Compass, 
  Car, 
  ExternalLink, 
  CornerUpRight, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  LocateFixed,
  Route
} from 'lucide-react';
import { motion } from 'motion/react';
import { ParkingSpot } from '../services/parkingService';

interface NavigationRouteModalProps {
  spot: ParkingSpot;
  userCarPlate?: string;
  onClose: () => void;
  onOpenBooking?: (spot: ParkingSpot) => void;
  onRecordHistory?: (spot: ParkingSpot) => void;
}

export const NavigationRouteModal: React.FC<NavigationRouteModalProps> = ({
  spot,
  userCarPlate,
  onClose,
  onOpenBooking,
  onRecordHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'driving' | 'walking'>('driving');

  React.useEffect(() => {
    onRecordHistory?.(spot);
  }, [spot.id]);
  
  // Calculate simulated route metrics
  const distanceKm = spot.distanceKm || 1.2;
  const drivingTimeMin = Math.max(3, Math.round(distanceKm * 2.8));
  const walkingTimeMin = Math.max(5, Math.round(distanceKm * 12.5));

  const steps = activeTab === 'driving' ? [
    {
      instruction: "Head south on current street toward Samora Machel Ave",
      distance: "350 m",
      icon: Navigation,
      highlight: false
    },
    {
      instruction: `Turn right onto Nelson Mandela Ave toward ${spot.name}`,
      distance: "500 m",
      icon: CornerUpRight,
      highlight: false
    },
    {
      instruction: "Pass through First Street intersection; traffic is free-flowing",
      distance: "250 m",
      icon: Compass,
      highlight: false
    },
    {
      instruction: `Approach parking barrier gate at ${spot.name}. Keep your ParkFinder QR code ready`,
      distance: "100 m",
      icon: MapPin,
      highlight: true
    },
    {
      instruction: `Scan entry QR pass at barrier lane to enter bay area (${spot.availableSpaces || 12} bays available)`,
      distance: "Arrival",
      icon: CheckCircle2,
      highlight: true
    }
  ] : [
    {
      instruction: "Walk toward pedestrian egress lane near entrance",
      distance: "50 m",
      icon: Navigation,
      highlight: false
    },
    {
      instruction: "Follow sidewalk along Main Mall corridor toward facility gates",
      distance: "400 m",
      icon: CornerUpRight,
      highlight: false
    },
    {
      instruction: `Arrive at pedestrian lobby of ${spot.name}`,
      distance: "Arrival",
      icon: CheckCircle2,
      highlight: true
    }
  ];

  const googleMapsUrl = spot.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name} Harare`)}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${spot.location?.lat || -17.8252},${spot.location?.lng || 31.0335}&q=${encodeURIComponent(spot.name)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30 flex-shrink-0">
              <Route className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-none truncate">{spot.name}</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  Navigation
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 truncate">{spot.address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{activeTab === 'driving' ? `${drivingTimeMin} min` : `${walkingTimeMin} min`}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-600 font-medium">
              {distanceKm} km away
            </div>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Free Flow
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('driving')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'driving' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drive
            </button>
            <button
              onClick={() => setActiveTab('walking')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'walking' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Walk
            </button>
          </div>
        </div>

        {/* Turn-by-Turn Steps List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Step-by-Step Directions to Entrance Gate
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                    step.highlight 
                      ? 'bg-emerald-50/70 border-emerald-200 ring-1 ring-emerald-100' 
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    step.highlight ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      step.highlight ? 'font-bold text-slate-900' : 'text-slate-700'
                    }`}>
                      {step.instruction}
                    </p>
                    <span className="text-[11px] font-mono text-slate-400 font-medium mt-0.5 block">
                      {step.distance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Parking Availability Reminder */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-xs mt-4">
            <div>
              <span className="font-bold text-slate-800 block">Gate Access: Automated Barrier</span>
              <span className="text-slate-500 text-[11px]">
                {spot.availableSpaces ?? 12} spaces open • {spot.price || `$${(spot.pricePerHour || 2.5).toFixed(2)}/hr`}
              </span>
            </div>
            {onOpenBooking && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking(spot);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Reserve Bay
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center justify-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              title="Open in Apple Maps"
            >
              <span>Apple Maps</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Close Guide
          </button>
        </div>
      </motion.div>
    </div>
  );
};
