import React from 'react';
import { 
  MapPin, 
  Navigation, 
  Star, 
  Clock, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Accessibility, 
  Radio,
  Car,
  Route,
  Tag,
  Bell
} from 'lucide-react';
import { ParkingSpot } from '../services/parkingService';
import { motion } from 'motion/react';

interface ParkingCardProps {
  spot: ParkingSpot;
  durationHours?: number;
  currency?: 'USD' | 'ZIG' | 'ECOCASH';
  onBook: (spot: ParkingSpot) => void;
  onViewSensors?: (spot: ParkingSpot) => void;
  onViewRoute?: (spot: ParkingSpot) => void;
  onDirectionsClick?: (spot: ParkingSpot) => void;
  onSetPriceAlert?: (spot: ParkingSpot) => void;
  hasPriceAlert?: boolean;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({ 
  spot, 
  durationHours = 2,
  currency = 'USD',
  onBook,
  onViewSensors,
  onViewRoute,
  onDirectionsClick,
  onSetPriceAlert,
  hasPriceAlert = false
}) => {
  const available = spot.availableSpaces !== undefined ? spot.availableSpaces : 12;
  const total = spot.totalSpaces !== undefined ? spot.totalSpaces : 50;
  const isFull = available <= 0;
  const isLow = available > 0 && available <= 5;
  
  const hourlyRate = spot.pricePerHour || 2.50;
  const estimatedTotal = hourlyRate * durationHours;

  const formatPrice = (usd: number) => {
    if (currency === 'ZIG') {
      return `ZiG ${(usd * 28).toFixed(0)}`;
    }
    if (currency === 'ECOCASH') {
      return `$${usd.toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const displayRate = `${formatPrice(hourlyRate)}/hr`;
  const displayEstTotal = formatPrice(estimatedTotal);

  const hasEv = Boolean(spot.evCharging);
  const isCovered = Boolean(spot.covered);
  const hasSecurity = Boolean(spot.security);
  const isAccessible = spot.accessible !== undefined ? Boolean(spot.accessible) : true;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 sm:p-5 hover:shadow-lg transition-all duration-200 group bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl flex flex-col justify-between text-left w-full min-w-0 overflow-hidden"
    >
      <div>
        {/* Top Header */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-base sm:text-lg leading-snug truncate">
              {spot.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{spot.address}</span>
            </p>
          </div>
          {spot.rating && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200/60 flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{typeof spot.rating === 'number' ? spot.rating.toFixed(1) : spot.rating}</span>
            </div>
          )}
        </div>

        {/* Status & Availability Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 my-2.5 flex-wrap">
          <div className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 flex-shrink-0 ${
            isFull 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : isLow 
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span>
              {isFull ? 'Lot Full' : `${available} of ${total} spaces open`}
            </span>
          </div>

          <div className="text-[11px] sm:text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>24/7 Access</span>
          </div>

          {spot.distanceKm && (
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium flex-shrink-0">
              • {spot.distanceKm} km
            </span>
          )}
        </div>

        {/* Feature & Amenity Tags */}
        <div className="flex items-center gap-1.5 flex-wrap my-3 pt-2 border-t border-slate-100">
          {hasEv && (
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600" />
              EV Ready
            </span>
          )}
          {isCovered && (
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              Covered
            </span>
          )}
          {hasSecurity && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              24/7 CCTV
            </span>
          )}
          {isAccessible && (
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Accessibility className="w-3 h-3 text-blue-600" />
              Accessible
            </span>
          )}
        </div>
      </div>
      
      {/* Card Action Controls */}
      <div className="pt-3 border-t border-slate-100 mt-2 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold leading-none">Rate & Estimate</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-bold text-slate-900">{displayRate}</span>
              {durationHours > 1 && (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  ~{displayEstTotal} for {durationHours}h
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onViewSensors && (
              <button
                onClick={() => onViewSensors(spot)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="View Live Bay Ultrasonic Telemetry"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Sensors</span>
              </button>
            )}

            {onViewRoute && (
              <button
                onClick={() => onViewRoute(spot)}
                className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Preview Route and Turn-by-Turn Directions"
              >
                <Route className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Route</span>
              </button>
            )}

            {onSetPriceAlert && (
              <button
                onClick={() => onSetPriceAlert(spot)}
                className={`text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  hasPriceAlert
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                }`}
                title={hasPriceAlert ? "Price Alert Active - Click to edit" : "Set Price Drop Alert"}
              >
                <Bell className={`w-3.5 h-3.5 ${hasPriceAlert ? 'text-amber-600 fill-amber-500' : 'text-slate-500'}`} />
                <span className="hidden xs:inline">{hasPriceAlert ? 'Alert Set' : 'Alert'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={spot.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onDirectionsClick?.(spot)}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 flex-shrink-0"
            title="Directions in Google Maps"
          >
            <Navigation className="w-4 h-4 text-emerald-600" />
          </a>
          <button 
            onClick={() => onBook(spot)}
            disabled={isFull}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all shadow-xs text-center cursor-pointer ${
              isFull 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            {isFull ? 'Sold Out' : 'Book Space'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
