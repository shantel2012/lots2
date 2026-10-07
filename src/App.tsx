import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ParkingCard } from './components/ParkingCard';
import { BookingModal } from './components/BookingModal';
import { ParkingPassModal, BookingRecord } from './components/ParkingPassModal';
import { FindMyCarModal } from './components/FindMyCarModal';
import { LiveSensorModal } from './components/LiveSensorModal';
import { AddFacilityModal } from './components/AddFacilityModal';
import { NavigationRouteModal } from './components/NavigationRouteModal';
import { PriceAlertModal, PriceAlertRecord } from './components/PriceAlertModal';
import { RateCalculatorBar } from './components/RateCalculatorBar';
import { findParkingNearby, ParkingSpot } from './services/parkingService';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  Map as MapIcon, 
  List, 
  Loader2, 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  X,
  Bell,
  Clock, 
  Car, 
  Calendar,
  AlertCircle,
  RotateCcw,
  Sparkles,
  QrCode,
  Zap,
  Layers,
  ShieldCheck,
  Accessibility,
  SlidersHorizontal,
  Compass,
  Building2,
  Radio,
  Check,
  Route,
  ChevronDown,
  ChevronUp,
  Tag,
  Copy,
  ExternalLink,
  Printer,
  History,
  Trash2,
  CornerUpRight,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary';

export interface NavHistoryItem {
  id: string;
  spotId: string;
  name: string;
  address: string;
  distanceKm?: number;
  pricePerHour?: number;
  availableSpaces?: number;
  mapsUrl: string;
  timestamp: string;
  spot: ParkingSpot;
}

export default function App() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'history'>('explore');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Navigation History State (stores last 5 destinations)
  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([]);

  // Rate Calculator State
  const [durationHours, setDurationHours] = useState(2);
  const [currency, setCurrency] = useState<'USD' | 'ZIG' | 'ECOCASH'>('USD');

  // Modals state
  const [selectedSpotForBooking, setSelectedSpotForBooking] = useState<ParkingSpot | null>(null);
  const [selectedBayForBooking, setSelectedBayForBooking] = useState<string | undefined>(undefined);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<BookingRecord | null>(null);
  const [selectedSpotForRoute, setSelectedSpotForRoute] = useState<ParkingSpot | null>(null);
  const [activeMapSpot, setActiveMapSpot] = useState<ParkingSpot | null>(null);
  const [showFindMyCar, setShowFindMyCar] = useState(false);
  const [sensorSpotForModal, setSensorSpotForModal] = useState<ParkingSpot | null>(null);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [hasActiveCarPin, setHasActiveCarPin] = useState(false);

  // Price Alert State
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [selectedSpotForPriceAlert, setSelectedSpotForPriceAlert] = useState<ParkingSpot | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertRecord[]>([]);
  const [triggeredBannerAlert, setTriggeredBannerAlert] = useState<{ alert: PriceAlertRecord; newPrice: number } | null>(null);

  // In-Card Expanded QR Code State for My Bookings
  const [expandedQrBookingId, setExpandedQrBookingId] = useState<string | null>(null);
  const [scanningBookingId, setScanningBookingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters & sorting
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<'all' | 'ev' | 'covered' | 'security' | 'accessible'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price' | 'spaces' | 'distance'>('recommended');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'checked_in' | 'cancelled'>('all');
  const [mapTheme, setMapTheme] = useState<'radar' | 'satellite' | 'streets'>('radar');

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check for active car pin
  const checkActiveCarPin = () => {
    const activeUserId = user?.uid || 'guest_user';
    const local = localStorage.getItem(`parkfinder_car_${activeUserId}`);
    setHasActiveCarPin(Boolean(local));
  };

  useEffect(() => {
    checkActiveCarPin();
  }, [user]);

  // Load Navigation History from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('parkfinder_nav_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNavHistory(parsed.slice(0, 5));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Record a destination to Navigation History (strictly maintains last 5, most recent first)
  const recordNavigationHistory = (spot: ParkingSpot) => {
    try {
      setNavHistory(prev => {
        const filtered = prev.filter(
          item => item.spotId !== spot.id && item.name.toLowerCase() !== spot.name.toLowerCase()
        );
        const newItem: NavHistoryItem = {
          id: `nav_${Date.now()}_${spot.id}`,
          spotId: spot.id,
          name: spot.name,
          address: spot.address,
          distanceKm: spot.distanceKm,
          pricePerHour: spot.pricePerHour,
          availableSpaces: spot.availableSpaces,
          mapsUrl: spot.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name} Harare`)}`,
          timestamp: new Date().toISOString(),
          spot,
        };
        const updated = [newItem, ...filtered].slice(0, 5);
        localStorage.setItem('parkfinder_nav_history', JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  };

  const clearNavigationHistory = () => {
    setNavHistory([]);
    localStorage.removeItem('parkfinder_nav_history');
    showToast('Navigation history cleared.', 'success');
  };

  const removeHistoryItem = (id: string, name: string) => {
    setNavHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('parkfinder_nav_history', JSON.stringify(updated));
      return updated;
    });
    showToast(`Removed "${name}" from history.`, 'success');
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  // Fetch bookings for logged-in user or guest sessions
  const fetchUserBookings = async () => {
    try {
      let targetId = user?.uid;
      if (!targetId) {
        const guestId = localStorage.getItem('parkfinder_guest_id');
        if (guestId) targetId = guestId;
      }

      if (targetId) {
        const response = await fetch(`/api/bookings/${targetId}`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } else {
        setBookings([]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  // Fetch price alerts for user or guest session
  const activePriceAlertUserId = user?.uid || localStorage.getItem('parkfinder_guest_id') || 'guest_user';

  const fetchPriceAlerts = async () => {
    try {
      const res = await fetch(`/api/price-alerts/${activePriceAlertUserId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPriceAlerts(data);
        }
      }
    } catch {
      // ignore
    }
  };

  // Check if any price alerts are triggered below the defined threshold
  const checkForTriggeredPriceAlerts = async () => {
    try {
      const res = await fetch(`/api/price-alerts/${activePriceAlertUserId}/check`);
      if (res.ok) {
        const triggered = await res.json();
        if (Array.isArray(triggered) && triggered.length > 0) {
          const first = triggered[0];
          setTriggeredBannerAlert({
            alert: first,
            newPrice: first.currentPrice ?? first.targetPrice
          });
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPriceAlerts();
    checkForTriggeredPriceAlerts();
  }, [user]);

  const handlePriceSimulated = (parkingId: string, newPrice: number, triggered: PriceAlertRecord[]) => {
    // Dynamically update parking spot price across the app
    setSpots(prev => prev.map(s => {
      if (s.id === parkingId) {
        return {
          ...s,
          pricePerHour: newPrice,
          price: `$${newPrice.toFixed(2)}/hr`
        };
      }
      return s;
    }));

    if (activeMapSpot && activeMapSpot.id === parkingId) {
      setActiveMapSpot(prev => prev ? {
        ...prev,
        pricePerHour: newPrice,
        price: `$${newPrice.toFixed(2)}/hr`
      } : null);
    }

    fetchPriceAlerts();

    const matchingSpot = spots.find(s => s.id === parkingId);
    const spotName = matchingSpot?.name || 'Parking facility';
    showToast(`⚡ Price alert notification! Rate for ${spotName} dropped to $${newPrice.toFixed(2)}/hr!`, 'success');

    if (triggered && triggered.length > 0) {
      setTriggeredBannerAlert({
        alert: triggered[0],
        newPrice
      });
    }
  };

  // Load parking spaces from server
  const loadParkings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/parkings');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setSpots(data);
          setActiveMapSpot(data[0]);
          setLoading(false);
          return;
        }
      }
      
      const harare = { lat: -17.8252, lng: 31.0335 };
      const results = await findParkingNearby(harare.lat, harare.lng);
      setSpots(results);
      if (results.length > 0) setActiveMapSpot(results[0]);
    } catch {
      const harare = { lat: -17.8252, lng: 31.0335 };
      const results = await findParkingNearby(harare.lat, harare.lng);
      setSpots(results);
      if (results.length > 0) setActiveMapSpot(results[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParkings();
  }, []);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      loadParkings();
      return;
    }
    setLoading(true);
    try {
      const harare = { lat: -17.8252, lng: 31.0335 };
      const results = await findParkingNearby(harare.lat, harare.lng);
      const filtered = results.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSpots(filtered.length > 0 ? filtered : results);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Filter and Sort parking spots
  const filteredSpots = useMemo(() => {
    let result = [...spots];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.address.toLowerCase().includes(q)
      );
    }

    // Amenity filter
    if (selectedAmenityFilter === 'ev') {
      result = result.filter(s => Boolean(s.evCharging));
    } else if (selectedAmenityFilter === 'covered') {
      result = result.filter(s => Boolean(s.covered));
    } else if (selectedAmenityFilter === 'security') {
      result = result.filter(s => Boolean(s.security));
    } else if (selectedAmenityFilter === 'accessible') {
      result = result.filter(s => s.accessible === undefined || Boolean(s.accessible));
    }

    // Sorting
    if (sortBy === 'price') {
      result.sort((a, b) => (a.pricePerHour || 2.5) - (b.pricePerHour || 2.5));
    } else if (sortBy === 'spaces') {
      result.sort((a, b) => (b.availableSpaces || 0) - (a.availableSpaces || 0));
    } else if (sortBy === 'distance') {
      result.sort((a, b) => (a.distanceKm || 1) - (b.distanceKm || 1));
    }

    return result;
  }, [spots, searchQuery, selectedAmenityFilter, sortBy]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'all') return bookings;
    return bookings.filter(b => b.status === bookingFilter);
  }, [bookings, bookingFilter]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenBookingModal = (spot: ParkingSpot, bayNumber?: string) => {
    setSelectedSpotForBooking(spot);
    setSelectedBayForBooking(bayNumber);
  };

  const handleOpenRouteModal = (spot: ParkingSpot) => {
    recordNavigationHistory(spot);
    setSelectedSpotForRoute(spot);
  };

  const handleConfirmBooking = async (details: {
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
  }): Promise<boolean> => {
    try {
      if (!user && details.userId.startsWith('guest_')) {
        localStorage.setItem('parkfinder_guest_id', details.userId);
      }

      const bookingPayload = {
        userId: details.userId,
        parkingId: details.spot.id,
        parkingName: details.spot.name,
        startTime: details.startTime,
        endTime: details.endTime,
        userName: details.userName,
        carPlate: details.carPlate,
        paymentMethod: details.paymentMethod || 'card',
        totalAmount: details.totalAmount,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        const newBooking = await response.json();
        setBookings(prev => [newBooking, ...prev]);

        // Decrement available spaces locally in spots
        setSpots(prev => prev.map(s => {
          if (s.id === details.spot.id) {
            const avail = s.availableSpaces !== undefined ? Math.max(0, s.availableSpaces - 1) : 11;
            return { ...s, availableSpaces: avail };
          }
          return s;
        }));

        showToast(`Space reserved at ${details.spot.name}! QR Code generated.`);
        setSelectedBookingForPass(newBooking);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleCheckInSuccess = (bookingId: string, checkedInAt: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'checked_in', checkedInAt } : b));
    showToast('Arrival scanned! Entry barrier opened.', 'success');
  };

  // Inline Quick Scan arrival directly from card in My Bookings
  const handleInlineQuickScan = async (booking: BookingRecord) => {
    if (booking.status === 'checked_in' || booking.status === 'cancelled') return;
    setScanningBookingId(booking.id);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/checkin`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        handleCheckInSuccess(booking.id, data.checkedInAt || new Date().toISOString());
      } else {
        showToast('Scanner handshake failed. Please try again.', 'error');
      }
    } catch {
      showToast('Could not reach barrier scanner.', 'error');
    } finally {
      setScanningBookingId(null);
    }
  };

  const handleCopyPassId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelBooking = async (bookingId: string, parkingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        
        setSpots(prev => prev.map(s => {
          if (s.id === parkingId) {
            const avail = (s.availableSpaces ?? 0) + 1;
            return { ...s, availableSpaces: avail };
          }
          return s;
        }));

        showToast('Reservation cancelled and space released.', 'success');
      }
    } catch {
      showToast('Could not cancel booking.', 'error');
    }
  };

  return (
    <ErrorBoundary>
      <Layout 
        user={user} 
        loading={authLoading}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        currentView={view}
        onViewChange={(v) => {
          setActiveTab('explore');
          setView(v);
        }}
        bookingCount={bookings.filter(b => b.status === 'active' || b.status === 'checked_in').length}
        navHistoryCount={navHistory.length}
        priceAlertCount={priceAlerts.length}
        hasActiveCarPin={hasActiveCarPin}
        onOpenFindMyCar={() => setShowFindMyCar(true)}
        onOpenAddFacility={() => setShowAddFacility(true)}
        onOpenPriceAlerts={() => {
          setSelectedSpotForPriceAlert(null);
          setShowPriceAlertModal(true);
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
          {/* Toast Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 font-medium text-xs sm:text-sm text-white max-w-[90vw] ${
                  notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                {notification.type === 'error' ? (
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                )}
                <span className="truncate">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Booking Modal */}
          <AnimatePresence>
            {selectedSpotForBooking && (
              <BookingModal
                spot={selectedSpotForBooking}
                user={user}
                currency={currency}
                initialBayNumber={selectedBayForBooking}
                onClose={() => {
                  setSelectedSpotForBooking(null);
                  setSelectedBayForBooking(undefined);
                }}
                onConfirmBooking={handleConfirmBooking}
              />
            )}
          </AnimatePresence>

          {/* Parking Pass & QR Entry Modal */}
          <AnimatePresence>
            {selectedBookingForPass && (
              <ParkingPassModal
                booking={selectedBookingForPass}
                onClose={() => setSelectedBookingForPass(null)}
                onCheckInSuccess={handleCheckInSuccess}
              />
            )}
          </AnimatePresence>

          {/* Navigation & Turn-by-Turn Route Modal */}
          <AnimatePresence>
            {selectedSpotForRoute && (
              <NavigationRouteModal
                spot={selectedSpotForRoute}
                onClose={() => setSelectedSpotForRoute(null)}
                onOpenBooking={(spot) => handleOpenBookingModal(spot)}
                onRecordHistory={(spot) => recordNavigationHistory(spot)}
              />
            )}
          </AnimatePresence>

          {/* Find My Car Modal */}
          <AnimatePresence>
            {showFindMyCar && (
              <FindMyCarModal
                userId={user?.uid || 'guest_user'}
                onClose={() => setShowFindMyCar(false)}
                onPinSaved={() => {
                  checkActiveCarPin();
                  showToast('Parked car location pinned!', 'success');
                }}
              />
            )}
          </AnimatePresence>

          {/* Live Sensor Bay Telemetry Modal */}
          <AnimatePresence>
            {sensorSpotForModal && (
              <LiveSensorModal
                spot={sensorSpotForModal}
                onClose={() => setSensorSpotForModal(null)}
                onSelectBayForBooking={(spot, bay) => {
                  handleOpenBookingModal(spot, bay);
                }}
              />
            )}
          </AnimatePresence>

          {/* Operator Add Facility Modal */}
          <AnimatePresence>
            {showAddFacility && (
              <AddFacilityModal
                onClose={() => setShowAddFacility(false)}
                onFacilityAdded={(newSpot) => {
                  setSpots(prev => [newSpot, ...prev]);
                  showToast(`Registered "${newSpot.name}" into live parking grid!`, 'success');
                }}
              />
            )}
          </AnimatePresence>

          {/* Price Alert Modal */}
          <AnimatePresence>
            {showPriceAlertModal && (
              <PriceAlertModal
                spot={selectedSpotForPriceAlert}
                userId={user?.uid || localStorage.getItem('parkfinder_guest_id') || 'guest_user'}
                allSpots={spots}
                onClose={() => {
                  setShowPriceAlertModal(false);
                  setSelectedSpotForPriceAlert(null);
                }}
                onAlertCreated={(alert) => {
                  setPriceAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);
                  showToast(`Price alert set for ${alert.parkingName}!`, 'success');
                }}
                onPriceSimulated={handlePriceSimulated}
                onBookSpot={(s) => handleOpenBookingModal(s)}
              />
            )}
          </AnimatePresence>

          {/* Triggered Price Alert Banner */}
          {triggeredBannerAlert && (
            <div className="mb-5 p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-2xl shadow-md border border-emerald-500/30 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30 flex-shrink-0 animate-bounce">
                  <Bell className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Price Alert Triggered
                    </span>
                    <span className="text-xs text-emerald-300 font-medium hidden sm:inline">Rate dropped below your target</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 truncate">
                    {triggeredBannerAlert.alert.parkingName} is now only ${Number(triggeredBannerAlert.newPrice).toFixed(2)}/hr!
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate">
                    Target threshold was &lt; ${Number(triggeredBannerAlert.alert.targetPrice).toFixed(2)}/hr. Reserve your bay before spaces fill up!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const found = spots.find(s => s.id === triggeredBannerAlert.alert.parkingId);
                    if (found) {
                      handleOpenBookingModal(found);
                    }
                    setTriggeredBannerAlert(null);
                  }}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Book Space</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTriggeredBannerAlert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'explore' ? (
            <>
              {/* Header Title Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                    Available Parking
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Live bay availability, ultrasonic sensors, instant QR entry passes & navigation.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button 
                      onClick={() => setView('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        view === 'list' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>List View</span>
                    </button>
                    <button 
                      onClick={() => setView('map')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        view === 'map' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Map View</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rate Calculator & Price Estimator Widget */}
              <RateCalculatorBar 
                durationHours={durationHours}
                currency={currency}
                spots={spots}
                onDurationChange={(h) => setDurationHours(h)}
                onCurrencyChange={(c) => setCurrency(c)}
              />

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative mb-4 sm:mb-5">
                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input 
                  type="text"
                  placeholder="Search parking lots, avenues, malls, or landmarks in Harare..."
                  className="w-full pl-10 sm:pl-12 pr-24 sm:pr-28 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Amenity Filter Chips & Sort Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                {/* Amenity Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setSelectedAmenityFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                      selectedAmenityFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Facilities ({spots.length})
                  </button>

                  <button
                    onClick={() => setSelectedAmenityFilter('ev')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                      selectedAmenityFilter === 'ev'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>EV Ready</span>
                  </button>

                  <button
                    onClick={() => setSelectedAmenityFilter('covered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                      selectedAmenityFilter === 'covered'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Covered</span>
                  </button>

                  <button
                    onClick={() => setSelectedAmenityFilter('security')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                      selectedAmenityFilter === 'security'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>24/7 CCTV</span>
                  </button>

                  <button
                    onClick={() => setSelectedAmenityFilter('accessible')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                      selectedAmenityFilter === 'accessible'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Accessibility className="w-3.5 h-3.5 text-blue-500" />
                    <span>Accessible</span>
                  </button>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="recommended">Featured / Rating</option>
                    <option value="price">Price: Low to High</option>
                    <option value="spaces">Most Open Bays</option>
                    <option value="distance">Nearest Distance</option>
                  </select>
                </div>
              </div>

              {/* Main Content Area */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200"
                  >
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                    <p className="text-slate-700 font-semibold text-sm">Querying real-time parking spaces...</p>
                    <p className="text-xs text-slate-400 mt-1">Grounding coordinates via Google Maps</p>
                  </motion.div>
                ) : view === 'list' ? (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {filteredSpots.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        {filteredSpots.map((spot) => (
                          <ParkingCard 
                            key={spot.id} 
                            spot={spot} 
                            durationHours={durationHours}
                            currency={currency}
                            onBook={(s) => handleOpenBookingModal(s)}
                            onViewSensors={(s) => setSensorSpotForModal(s)}
                            onViewRoute={(s) => handleOpenRouteModal(s)}
                            onDirectionsClick={(s) => recordNavigationHistory(s)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
                        <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No Parking Spaces Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                          No lots matched the current filter or search criteria.
                        </p>
                        <button
                          onClick={() => { 
                            setSearchQuery(''); 
                            setSelectedAmenityFilter('all'); 
                            loadParkings(); 
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Interactive Map View with Live Sensor Telemetry */
                  <motion.div 
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Simulated Map Canvas */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between shadow-inner min-h-[440px] sm:min-h-[520px]">
                      <div className={`absolute inset-0 opacity-20 pointer-events-none ${
                        mapTheme === 'satellite' 
                          ? 'bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]'
                          : mapTheme === 'streets'
                          ? 'bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] [background-size:32px_32px]'
                          : 'bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]'
                      }`} />
                      
                      {/* Top Map Bar */}
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="bg-slate-800/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-2 self-start">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Harare Parking Grid • Sensor Telemetry Active</span>
                        </div>

                        {/* Theme Switcher */}
                        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 self-start sm:self-auto text-[11px] font-semibold text-slate-300">
                          <button
                            onClick={() => setMapTheme('radar')}
                            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                              mapTheme === 'radar' ? 'bg-emerald-600 text-white' : 'hover:text-white'
                            }`}
                          >
                            Radar
                          </button>
                          <button
                            onClick={() => setMapTheme('satellite')}
                            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                              mapTheme === 'satellite' ? 'bg-emerald-600 text-white' : 'hover:text-white'
                            }`}
                          >
                            Satellite
                          </button>
                          <button
                            onClick={() => setMapTheme('streets')}
                            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                              mapTheme === 'streets' ? 'bg-emerald-600 text-white' : 'hover:text-white'
                            }`}
                          >
                            Streets
                          </button>
                        </div>
                      </div>

                      {/* Map Pins Grid */}
                      <div className="relative z-10 my-6 sm:my-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
                        {filteredSpots.map((spot, index) => {
                          const isSelected = activeMapSpot?.id === spot.id;
                          return (
                            <button
                              key={spot.id}
                              onClick={() => setActiveMapSpot(spot)}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-102 ring-2 ring-emerald-300/40'
                                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  isSelected ? 'bg-white text-emerald-800' : 'bg-slate-700 text-slate-300'
                                }`}>
                                  P{index + 1}
                                </span>
                                <div className="truncate min-w-0">
                                  <p className="text-xs font-bold truncate leading-tight">{spot.name}</p>
                                  <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {spot.availableSpaces ?? 10} bays free • {spot.distanceKm || 0.8} km
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Map Footer Bar */}
                      <div className="relative z-10 bg-slate-800/95 backdrop-blur-xs p-3 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="text-xs text-slate-300">
                          <span className="font-semibold text-white">Harare CBD Coordinates:</span> -17.8252° S, 31.0335° E
                        </div>
                        {activeMapSpot && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setSensorSpotForModal(activeMapSpot)}
                              className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Radio className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Live Sensors</span>
                            </button>
                            <button
                              onClick={() => handleOpenRouteModal(activeMapSpot)}
                              className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Route className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Route Guide</span>
                            </button>
                            <a
                              href={activeMapSpot.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => recordNavigationHistory(activeMapSpot)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Google Maps</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Spot Details Sidebar */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between shadow-xs text-left">
                      {activeMapSpot ? (
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              Selected Facility
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                              {activeMapSpot.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">{activeMapSpot.address}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Rate</span>
                              <span className="text-slate-900 font-bold text-sm">
                                {activeMapSpot.price || (activeMapSpot.pricePerHour ? `$${activeMapSpot.pricePerHour.toFixed(2)}/hr` : '$2.50/hr')}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Open Bays</span>
                              <span className="text-emerald-700 font-bold text-sm">
                                {activeMapSpot.availableSpaces ?? 12} Bays Free
                              </span>
                            </div>
                          </div>

                          {/* Amenity tags */}
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {Boolean(activeMapSpot.evCharging) && (
                              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold border border-amber-200 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-600" /> EV Ready
                              </span>
                            )}
                            {Boolean(activeMapSpot.covered) && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-semibold border border-indigo-200 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-indigo-600" /> Covered
                              </span>
                            )}
                            {Boolean(activeMapSpot.security) && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Guarded
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>24/7 Barrier Access Control</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                              <span>Instant QR pass issued on booking</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          Select a parking marker on the map to inspect details
                        </div>
                      )}

                      {activeMapSpot && (
                        <div className="pt-4 border-t border-slate-100 mt-6 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSensorSpotForModal(activeMapSpot)}
                              className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Radio className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sensors</span>
                            </button>
                            <button
                              onClick={() => handleOpenRouteModal(activeMapSpot)}
                              className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Route className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Route</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleOpenBookingModal(activeMapSpot)}
                            disabled={(activeMapSpot.availableSpaces ?? 1) <= 0}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {(activeMapSpot.availableSpaces ?? 1) <= 0 ? 'Lot Full' : 'Book Selected Space'}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : activeTab === 'bookings' ? (
            /* My Bookings Tab View with INLINE QR Codes and Arrival Scanner */
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    My Parking Reservations
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    View active parking sessions, display your digital entry QR code, or scan gate arrival.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Status Filter */}
                  <select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value as any)}
                    className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Bookings ({bookings.length})</option>
                    <option value="active">Active Passes</option>
                    <option value="checked_in">Checked In</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={fetchUserBookings}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Refresh Bookings"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredBookings.map((booking) => {
                    const isActive = booking.status === 'active';
                    const isCheckedIn = booking.status === 'checked_in';
                    const isCancelled = booking.status === 'cancelled';
                    const isQrExpanded = expandedQrBookingId === booking.id;
                    const isScanningThis = scanningBookingId === booking.id;

                    const inlineQrPayload = JSON.stringify({
                      passId: booking.id,
                      facility: booking.parkingName,
                      driver: booking.userName || 'Driver',
                      vehicle: booking.carPlate || 'Standard Vehicle',
                      validFrom: booking.startTime,
                      validUntil: booking.endTime || 'Open',
                      timestamp: booking.createdAt,
                      app: 'ParkFinder',
                    });

                    return (
                      <div 
                        key={booking.id} 
                        className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
                          isCheckedIn
                            ? 'border-emerald-300 ring-2 ring-emerald-100 bg-gradient-to-b from-white to-emerald-50/20'
                            : isActive 
                            ? 'border-emerald-200 ring-1 ring-emerald-100 hover:shadow-md' 
                            : 'border-slate-200 opacity-70 bg-slate-50/50'
                        }`}
                      >
                        <div>
                          {/* Card Header & Status */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                              isCheckedIn
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {isCheckedIn ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Checked In / Parked</span>
                                </>
                              ) : isActive ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Active Gate Pass</span>
                                </>
                              ) : (
                                <span>Cancelled</span>
                              )}
                            </span>

                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400 font-mono">
                                #{booking.id.slice(0, 8).toUpperCase()}
                              </span>
                              <button
                                onClick={() => handleCopyPassId(booking.id)}
                                className="p-1 hover:text-slate-900 text-slate-400 cursor-pointer"
                                title="Copy Pass ID"
                              >
                                {copiedId === booking.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Facility Name & Vehicle */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                                {booking.parkingName}
                              </h3>
                              {booking.userName && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">Driver: {booking.userName}</p>
                              )}
                              {booking.carPlate && (
                                <p className="text-xs text-slate-700 flex items-center gap-1 mt-1 font-mono font-medium">
                                  <Car className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Plate: {booking.carPlate}</span>
                                </p>
                              )}
                            </div>

                            {/* Mini QR Code visual button to toggle inline QR */}
                            <button
                              onClick={() => setExpandedQrBookingId(isQrExpanded ? null : booking.id)}
                              className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 ${
                                isQrExpanded 
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                                  : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700'
                              }`}
                              title={isQrExpanded ? 'Hide QR Code' : 'Display Entry QR Code'}
                            >
                              <QrCode className="w-5 h-5" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                {isQrExpanded ? 'Hide' : 'QR Code'}
                              </span>
                            </button>
                          </div>

                          {/* INLINE UNIQUE QR CODE DISPLAY FEATURE */}
                          <AnimatePresence>
                            {isQrExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-3 pt-3 border-t border-dashed border-slate-200"
                              >
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-sm relative">
                                    <QRCodeSVG
                                      value={inlineQrPayload}
                                      size={150}
                                      level="M"
                                      className="rounded"
                                    />
                                    {isCheckedIn && (
                                      <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-[1px] rounded flex flex-col items-center justify-center p-2 text-white">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                                        <span className="font-bold text-xs">Barrier Scanned</span>
                                      </div>
                                    )}
                                  </div>

                                  <span className="text-[10px] text-slate-500 font-mono mt-2">
                                    Pass ID: #{booking.id.slice(0, 12).toUpperCase()}
                                  </span>

                                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                                    Hold this code up to the barrier laser reader upon entry.
                                  </p>

                                  {!isCancelled && !isCheckedIn && (
                                    <button
                                      type="button"
                                      onClick={() => handleInlineQuickScan(booking)}
                                      disabled={isScanningThis}
                                      className="mt-3 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                                    >
                                      {isScanningThis ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>Scanning QR Arrival...</span>
                                        </>
                                      ) : (
                                        <>
                                          <QrCode className="w-3.5 h-3.5" />
                                          <span>Scan Arrival at Gate</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Reservation timing */}
                          <div className="text-xs text-slate-600 mt-3.5 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium">Reserved:</span>
                              <span className="font-semibold text-slate-800">
                                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {booking.endTime && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Valid Until:</span>
                                <span className="font-semibold text-slate-800">
                                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}

                            {booking.checkedInAt && (
                              <div className="pt-1.5 border-t border-slate-200/80 flex justify-between items-center text-emerald-800">
                                <span className="font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  Arrival Scanned:
                                </span>
                                <span className="font-bold">
                                  {new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons on card */}
                        <div className="pt-3 border-t border-slate-100 mt-4 space-y-2">
                          <button
                            onClick={() => setSelectedBookingForPass(booking)}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer ${
                              isCheckedIn
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isActive
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            <QrCode className="w-4 h-4" />
                            <span>
                              {isCheckedIn 
                                ? 'View Digital Pass (Checked In)' 
                                : isActive 
                                ? 'Full QR Pass & Scanner' 
                                : 'View Pass Record'}
                            </span>
                          </button>

                          {isActive && (
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <button
                                onClick={() => handleCancelBooking(booking.id, booking.parkingId)}
                                className="text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                              >
                                Cancel Reservation
                              </button>

                              <button
                                onClick={() => setExpandedQrBookingId(isQrExpanded ? null : booking.id)}
                                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isQrExpanded ? 'Close QR' : 'Show QR'}</span>
                                {isQrExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Reservations Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    {bookingFilter !== 'all' 
                      ? `No bookings with "${bookingFilter}" status.` 
                      : 'Find an open parking space in the Explore tab and reserve it instantly.'}
                  </p>
                  <button
                    onClick={() => {
                      setBookingFilter('all');
                      setActiveTab('explore');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    Find a Parking Space
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* NEW TAB: Navigation History (Stores & displays the last 5 destinations) */
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Navigation History
                    </h2>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      {navHistory.length} of 5 Saved Routes
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Your last 5 requested destinations. Quickly re-access turn-by-turn route guides or reserve bays.
                  </p>
                </div>

                {navHistory.length > 0 && (
                  <button
                    onClick={clearNavigationHistory}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
                    title="Clear All Navigation History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {navHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {navHistory.map((item, index) => {
                    const available = item.spot.availableSpaces ?? item.availableSpaces ?? 12;
                    const isFull = available <= 0;
                    const priceDisplay = item.spot.price || (item.pricePerHour ? `$${item.pricePerHour.toFixed(2)}/hr` : '$2.50/hr');

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header & Relative Time */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>Requested {formatRelativeTime(item.timestamp)}</span>
                            </div>

                            <button
                              onClick={() => removeHistoryItem(item.id, item.name)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove from history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Destination Title & Address */}
                          <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </p>

                          {/* Metric Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap my-3 pt-2 border-t border-slate-100 text-xs">
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                              {item.distanceKm ? `${item.distanceKm} km away` : '1.2 km away'}
                            </span>
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                              Rate: {priceDisplay}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                              isFull ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isFull ? 'Lot Full' : `${available} bays open`}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons to Re-access Route */}
                        <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
                          <button
                            onClick={() => handleOpenRouteModal(item.spot)}
                            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                          >
                            <Route className="w-4 h-4" />
                            <span>Re-access Turn-by-Turn Route Guide</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={item.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                            >
                              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="truncate">Google Maps</span>
                            </a>

                            <button
                              onClick={() => handleOpenBookingModal(item.spot)}
                              disabled={isFull}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center truncate ${
                                isFull 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              {isFull ? 'Sold Out' : 'Reserve Bay'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Empty Navigation History State */
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <History className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Navigation History Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                    Click <strong>"Route Guide"</strong> or the <strong>Navigation</strong> button on any parking facility to automatically save it here for instant 1-tap re-access!
                  </p>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Route className="w-3.5 h-3.5" />
                    <span>Browse & Navigate Parking Spaces</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ErrorBoundary>
  );
}
