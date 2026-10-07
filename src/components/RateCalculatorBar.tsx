import React, { useState } from 'react';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Tag, 
  ArrowUpDown,
  Coins
} from 'lucide-react';
import { ParkingSpot } from '../services/parkingService';

interface RateCalculatorBarProps {
  durationHours: number;
  currency: 'USD' | 'ZIG' | 'ECOCASH';
  spots: ParkingSpot[];
  onDurationChange: (hours: number) => void;
  onCurrencyChange: (currency: 'USD' | 'ZIG' | 'ECOCASH') => void;
}

export const RateCalculatorBar: React.FC<RateCalculatorBarProps> = ({
  durationHours,
  currency,
  spots,
  onDurationChange,
  onCurrencyChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Exchange rates for Zimbabwe realistic localization
  const ZIG_RATE = 28; // 1 USD = ~28 ZiG
  const formatCost = (usdAmount: number) => {
    if (currency === 'ZIG') {
      return `ZiG ${(usdAmount * ZIG_RATE).toFixed(0)}`;
    }
    if (currency === 'ECOCASH') {
      return `$${usdAmount.toFixed(2)} (EcoCash)`;
    }
    return `$${usdAmount.toFixed(2)}`;
  };

  // Find lowest price
  const lowestRateSpot = spots.length > 0 
    ? [...spots].sort((a, b) => (a.pricePerHour || 2.5) - (b.pricePerHour || 2.5))[0] 
    : null;

  const minCost = lowestRateSpot ? (lowestRateSpot.pricePerHour || 2.5) * durationHours : 2.5 * durationHours;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs mb-6 overflow-hidden transition-all text-left">
      {/* Top Header / Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex-shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">Live Parking Fee Estimator</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
              </span>
              {lowestRateSpot && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md hidden sm:inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Best rate from {formatCost(minCost)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Compare rates across {spots.length} Harare facilities in real time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            From {formatCost(minCost)}
          </span>
          <div className="text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Controls Panel */}
      {isOpen && (
        <div className="px-4 py-3.5 border-t border-slate-100 bg-slate-50/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Duration Selector Buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Expected Stay Duration
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 8, 24].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => onDurationChange(hours)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      durationHours === hours
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {hours === 24 ? 'All Day (24h)' : `${hours}h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Payment Currency
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => onCurrencyChange('USD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'USD' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  $ USD
                </button>
                <button
                  onClick={() => onCurrencyChange('ZIG')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'ZIG' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Zimbabwe Gold Currency"
                >
                  ZiG
                </button>
                <button
                  onClick={() => onCurrencyChange('ECOCASH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'ECOCASH' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EcoCash
                </button>
              </div>
            </div>
          </div>

          {/* Rate Insights Pill */}
          {lowestRateSpot && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>
                  Top Value: <strong className="text-slate-900">{lowestRateSpot.name}</strong> at {formatCost((lowestRateSpot.pricePerHour || 2.5) * durationHours)} for {durationHours}h
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Rate: ${(lowestRateSpot.pricePerHour || 2.5).toFixed(2)}/hr
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
