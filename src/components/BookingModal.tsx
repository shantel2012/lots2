import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Car, 
  ShieldCheck, 
  CheckCircle2, 
  User, 
  Loader2, 
  Calendar, 
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  DollarSign,
  Plus,
  Check
} from 'lucide-react';
import { ParkingSpot } from '../services/parkingService';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGoogleSafe } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface SavedVehicle {
  plate: string;
  name: string;
}

interface BookingModalProps {
  spot: ParkingSpot;
  user: FirebaseUser | null;
  initialBayNumber?: string;
  currency?: 'USD' | 'ZIG' | 'ECOCASH';
  onClose: () => void;
  onConfirmBooking: (bookingDetails: {
    spot: ParkingSpot;
    userId: string;
    userName: string;
    userEmail?: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
    carPlate?: string;
    paymentMethod?: string;
    bayNumber?: string;
  }) => Promise<boolean>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  spot,
  user,
  initialBayNumber,
  currency = 'USD',
  onClose,
  onConfirmBooking,
}) => {
  const [durationHours, setDurationHours] = useState(2);
  const [carPlate, setCarPlate] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ecocash' | 'apple_pay' | 'cash'>('card');
  const [authMethod, setAuthMethod] = useState<'google' | 'guest'>(user ? 'google' : 'guest');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved vehicles
  useEffect(() => {
    try {
      const stored = localStorage.getItem('parkfinder_vehicles');
      if (stored) {
        setSavedVehicles(JSON.parse(stored));
      } else {
        // default template
        const defaults: SavedVehicle[] = [
          { plate: 'ABC-1234', name: 'Sedan / Daily' }
        ];
        setSavedVehicles(defaults);
      }
    } catch {}
  }, []);

  const handleSaveCurrentVehicle = () => {
    if (!carPlate.trim()) return;
    const newVeh: SavedVehicle = {
      plate: carPlate.trim().toUpperCase(),
      name: vehicleName.trim() || 'Vehicle'
    };
    const updated = [newVeh, ...savedVehicles.filter(v => v.plate !== newVeh.plate)];
    setSavedVehicles(updated);
    localStorage.setItem('parkfinder_vehicles', JSON.stringify(updated));
    setShowAddVehicle(false);
    setVehicleName('');
  };

  const handleSelectVehicle = (veh: SavedVehicle) => {
    setCarPlate(veh.plate);
  };

  const priceRate = spot.pricePerHour || 2.50;
  const subtotal = priceRate * durationHours;
  const serviceFee = 0.25;
  const totalAmount = subtotal + serviceFee;

  const formatPrice = (usd: number) => {
    if (currency === 'ZIG') {
      return `ZiG ${(usd * 28).toFixed(0)}`;
    }
    if (currency === 'ECOCASH') {
      return `$${usd.toFixed(2)} (EcoCash)`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const result = await signInWithGoogleSafe();
    setIsSigningIn(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else if (result.cancelled) {
      setErrorMessage('Sign-in cancelled. You can also complete your reservation as a guest below.');
      setAuthMethod('guest');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();

    let bookingUserId = '';
    let bookingUserName = '';
    let bookingUserEmail = '';

    if (user) {
      bookingUserId = user.uid;
      bookingUserName = user.displayName || user.email || 'Registered Driver';
      bookingUserEmail = user.email || '';
    } else if (authMethod === 'guest') {
      if (!guestName.trim()) {
        setErrorMessage('Please provide your name for the parking reservation.');
        return;
      }
      bookingUserId = `guest_${Date.now()}`;
      bookingUserName = guestName.trim();
      bookingUserEmail = guestEmail.trim();
    } else {
      setErrorMessage('Please sign in with Google or choose "Continue as Guest".');
      return;
    }

    setIsSubmitting(true);
    const success = await onConfirmBooking({
      spot,
      userId: bookingUserId,
      userName: bookingUserName,
      userEmail: bookingUserEmail,
      startTime,
      endTime,
      durationHours,
      totalAmount,
      carPlate: carPlate.trim(),
      paymentMethod,
      bayNumber: initialBayNumber,
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      setErrorMessage('Could not reserve spot at this moment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] my-auto"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                Reserve Parking Space
              </h2>
              {initialBayNumber && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-mono flex-shrink-0">
                  Bay {initialBayNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{spot.name} • {spot.address}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-left">
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Parking Duration
              </label>
              <span className="text-xs text-emerald-700 font-bold">
                Rate: {formatPrice(priceRate)}/hr
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 4, 8].map((hours) => (
                <button
                  type="button"
                  key={hours}
                  onClick={() => setDurationHours(hours)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                    durationHours === hours
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {hours === 1 ? '1 Hour' : `${hours} Hours`}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Info & Saved Garage Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Vehicle Plate Number
              </label>
              {savedVehicles.length > 0 && (
                <span className="text-[11px] text-slate-400">Quick garage select</span>
              )}
            </div>

            {/* Quick Saved Vehicles Chips */}
            {savedVehicles.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
                {savedVehicles.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectVehicle(v)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                      carPlate === v.plate
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Car className="w-3 h-3" />
                    <span>{v.plate}</span>
                    {v.name && <span className="opacity-70 font-sans">({v.name})</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. ABC-1234"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
              />
            </div>

            {/* Save Vehicle toggle */}
            {carPlate && !savedVehicles.some(v => v.plate === carPlate) && (
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentVehicle}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save "{carPlate}" to Garage for 1-tap future booking</span>
                </button>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="truncate">Card (Visa/MC)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ecocash')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'ecocash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600 mb-1" />
                <span className="truncate">EcoCash / Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('apple_pay')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'apple_pay'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 text-slate-800 mb-1" />
                <span className="truncate">Digital Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="truncate">Pay at Barrier</span>
              </button>
            </div>
          </div>

          {/* Identity Section */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Driver Details
            </span>

            {user ? (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || 'Signed-in Driver'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1 flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('guest')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authMethod === 'guest' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Guest Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('google')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authMethod === 'google' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Google Account
                  </button>
                </div>

                {authMethod === 'guest' ? (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tendai Moyo"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Email or Phone for QR Pass (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. tendai@example.com or +263 77..."
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-600 mb-3">Sign in with Google to sync your bookings across devices.</p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSigningIn}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <User className="w-4 h-4" />}
                      <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Parking ({durationHours}h @ {formatPrice(priceRate)}/hr)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sensor telemetry & gate system fee</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
              <span>Total Payable</span>
              <span className="text-emerald-700">{formatPrice(totalAmount)}</span>
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
                  <span>Generating Gate Pass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Reservation ({formatPrice(totalAmount)})</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Instant QR access pass will be generated upon confirmation.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
