import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Car, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Accessibility, 
  CheckCircle2, 
  Loader2,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { ParkingSpot } from '../services/parkingService';

interface AddFacilityModalProps {
  onClose: () => void;
  onFacilityAdded: (newSpot: ParkingSpot) => void;
}

export const AddFacilityModal: React.FC<AddFacilityModalProps> = ({
  onClose,
  onFacilityAdded,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalSpaces, setTotalSpaces] = useState(60);
  const [pricePerHour, setPricePerHour] = useState(2.00);
  const [evCharging, setEvCharging] = useState(false);
  const [covered, setCovered] = useState(false);
  const [accessible, setAccessible] = useState(true);
  const [security, setSecurity] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      address: address.trim(),
      lat: -17.8252 + (Math.random() - 0.5) * 0.04,
      lng: 31.0335 + (Math.random() - 0.5) * 0.04,
      totalSpaces: Number(totalSpaces) || 50,
      availableSpaces: Number(totalSpaces) || 50,
      pricePerHour: Number(pricePerHour) || 2.0,
      rating: 4.5,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name.trim())}`,
      evCharging: evCharging ? 1 : 0,
      covered: covered ? 1 : 0,
      accessible: accessible ? 1 : 0,
      security: security ? 1 : 0,
      distanceKm: +(Math.random() * 3 + 0.5).toFixed(1),
    };

    try {
      const response = await fetch('/api/parkings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const created = await response.json();
        onFacilityAdded(created);
        onClose();
      } else {
        setErrorMessage('Failed to register parking facility.');
      }
    } catch {
      setErrorMessage('Unable to connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none">Register Parking Facility</h2>
              <span className="text-[11px] text-slate-300">Operator Portal • Add New Parking Lot</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Facility Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Meikles Hotel Underground Bay"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Location / Street Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jason Moyo Ave, Harare CBD"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Bays / Spaces
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                value={totalSpaces}
                onChange={(e) => setTotalSpaces(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rate Per Hour ($ USD)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Facility Features & Amenities
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={evCharging}
                  onChange={(e) => setEvCharging(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>EV Charging</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={covered}
                  onChange={(e) => setCovered(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Covered / Roof</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={accessible}
                  onChange={(e) => setAccessible(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Accessibility className="w-3.5 h-3.5 text-blue-500" />
                <span>Accessible Bays</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={security}
                  onChange={(e) => setSecurity(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>24/7 CCTV & Guards</span>
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Facility...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish New Parking Facility</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
