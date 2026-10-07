import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  DollarSign, 
  TrendingDown, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  Tag,
  ArrowRight,
  Loader2,
  Zap,
  Clock,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParkingSpot } from '../services/parkingService';

export interface PriceAlertRecord {
  id: string;
  userId: string;
  parkingId: string;
  parkingName: string;
  targetPrice: number;
  initialPrice: number;
  currentPrice?: number;
  address?: string;
  availableSpaces?: number;
  createdAt: string;
  notified: number;
  notifiedAt?: string;
}

interface PriceAlertModalProps {
  spot?: ParkingSpot | null;
  userId: string;
  allSpots: ParkingSpot[];
  onClose: () => void;
  onAlertCreated: (alert: PriceAlertRecord) => void;
  onPriceSimulated?: (parkingId: string, newPrice: number, triggeredAlerts: PriceAlertRecord[]) => void;
  onBookSpot?: (spot: ParkingSpot) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  spot: initialSpot,
  userId,
  allSpots,
  onClose,
  onAlertCreated,
  onPriceSimulated,
  onBookSpot,
}) => {
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(
    initialSpot || (allSpots.length > 0 ? allSpots[0] : null)
  );
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [targetPrice, setTargetPrice] = useState<number>(2.0);
  const [existingAlerts, setExistingAlerts] = useState<PriceAlertRecord[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync selectedSpot with current price
  const currentRate = selectedSpot ? (selectedSpot.pricePerHour || 2.5) : 2.5;

  useEffect(() => {
    if (selectedSpot) {
      // Set default target threshold to 20% below current rate
      const defaultTarget = Math.max(0.5, +(currentRate * 0.8).toFixed(2));
      setTargetPrice(defaultTarget);
    }
  }, [selectedSpot?.id]);

  // Fetch active alerts for this user
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`/api/price-alerts/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setExistingAlerts(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  // Percentage discount calculation
  const discountPercent = currentRate > 0 
    ? Math.max(0, Math.round(((currentRate - targetPrice) / currentRate) * 100))
    : 0;
  const savingsAmount = Math.max(0, +(currentRate - targetPrice).toFixed(2));

  const handlePresetSelect = (discountFactor: number) => {
    const calculated = +(currentRate * (1 - discountFactor)).toFixed(2);
    setTargetPrice(Math.max(0.5, calculated));
  };

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    if (targetPrice >= currentRate) {
      setStatusMessage({
        text: 'Target price threshold must be lower than the current hourly rate.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        userId,
        parkingId: selectedSpot.id,
        parkingName: selectedSpot.name,
        targetPrice,
        initialPrice: currentRate,
      };

      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        onAlertCreated(created);
        setStatusMessage({
          text: `Price alert set! We'll notify you when ${selectedSpot.name} drops below $${targetPrice.toFixed(2)}/hr.`,
          type: 'success'
        });
        fetchAlerts();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ text: 'Failed to save price alert.', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/price-alerts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExistingAlerts(prev => prev.filter(a => a.id !== id));
        setStatusMessage({ text: 'Alert removed.', type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  // Test simulation: Drop rate to $0.25 below target price to instantly trigger notification
  const handleSimulateRateDrop = async (parkingId: string, currentTargetPrice: number) => {
    setIsSimulating(true);
    setStatusMessage(null);

    // Calculate a discounted price below target
    const discountedRate = Math.max(0.5, +(currentTargetPrice - 0.25).toFixed(2));

    try {
      const res = await fetch(`/api/parkings/${parkingId}/update-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrice: discountedRate }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMessage({
          text: `Rate dropped to $${discountedRate.toFixed(2)}/hr! Price alert triggered.`,
          type: 'success'
        });
        fetchAlerts();
        onPriceSimulated?.(parkingId, discountedRate, data.triggeredAlerts || []);
      }
    } catch {
      setStatusMessage({ text: 'Simulation failed.', type: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] my-auto"
      >
        {/* Header - Unified Emerald Brand */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30 flex-shrink-0">
              <Bell className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold leading-none truncate">Parking Rate Price Alerts</h2>
              <span className="text-[11px] text-emerald-200 mt-1 block truncate">
                Get notified the moment hourly rates drop below your target
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 transition-all cursor-pointer relative ${
              activeTab === 'create'
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Set New Alert
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 transition-all cursor-pointer relative flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Active Alerts</span>
            {existingAlerts.length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {existingAlerts.length}
              </span>
            )}
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">
          {activeTab === 'create' ? (
            <form onSubmit={handleSaveAlert} className="space-y-4">
              {/* Select Facility */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Parking Facility
                </label>
                <select
                  value={selectedSpot?.id || ''}
                  onChange={(e) => {
                    const found = allSpots.find(s => s.id === e.target.value);
                    if (found) setSelectedSpot(found);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
                >
                  {allSpots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Current: ${Number(s.pricePerHour || 2.5).toFixed(2)}/hr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Rate Display */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Current Standard Rate</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    ${currentRate.toFixed(2)}/hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Open Spaces</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {selectedSpot?.availableSpaces ?? 12} bays available
                  </span>
                </div>
              </div>

              {/* Target Price Threshold Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Alert Threshold Rate (USD/hr)
                  </label>
                  <span className="text-xs font-bold text-emerald-700">
                    Target: ${targetPrice.toFixed(2)}/hr
                  </span>
                </div>

                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.05"
                    min="0.25"
                    max={currentRate - 0.05}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick discount targets:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(0.15)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                  >
                    -15% (${(currentRate * 0.85).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(0.25)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                  >
                    -25% (${(currentRate * 0.75).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(0.40)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                  >
                    -40% (${(currentRate * 0.60).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(0.50)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                  >
                    -50% (${(currentRate * 0.50).toFixed(2)})
                  </button>
                </div>
              </div>

              {/* Savings Breakdown Card */}
              {discountPercent > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-950 block">Potential Hourly Savings</span>
                      <span className="text-emerald-700 text-[11px]">
                        Save ${savingsAmount.toFixed(2)}/hr when rate drops to your target
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                    -{discountPercent}%
                  </span>
                </div>
              )}

              {/* Notification Details Note */}
              <div className="text-xs text-slate-500 space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Real-time in-app alert with instant 1-tap booking when triggered.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Monitors peak vs off-peak and promotional price adjustments.</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Alert...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Set Price Drop Alert (Below ${targetPrice.toFixed(2)}/hr)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Active Alerts Tab */
            <div className="space-y-3">
              {loadingAlerts ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading your price alerts...</p>
                </div>
              ) : existingAlerts.length > 0 ? (
                existingAlerts.map((alert) => {
                  const currentP = alert.currentPrice ?? 2.5;
                  const isTriggered = currentP <= alert.targetPrice;

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isTriggered
                          ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isTriggered
                                ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isTriggered ? '⚡ Target Reached!' : '🟢 Monitoring'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {alert.parkingName}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-semibold">Current Rate</span>
                              <span className="font-bold text-slate-900">${currentP.toFixed(2)}/hr</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-semibold">Target Threshold</span>
                              <span className="font-bold text-emerald-700">&lt; ${alert.targetPrice.toFixed(2)}/hr</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Simulation & Action Controls */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSimulateRateDrop(alert.parkingId, alert.targetPrice)}
                          disabled={isSimulating}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Simulate rate dropping below your target"
                        >
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Simulate Flash Discount</span>
                        </button>

                        {isTriggered && onBookSpot && (
                          <button
                            type="button"
                            onClick={() => {
                              const matchingSpot = allSpots.find(s => s.id === alert.parkingId);
                              if (matchingSpot) {
                                onClose();
                                onBookSpot(matchingSpot);
                              }
                            }}
                            className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Book Space</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Active Price Alerts</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Set a price alert on any parking lot to be notified when rates drop below your target.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    Set an Alert
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
