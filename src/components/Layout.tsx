import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CreditCard, 
  Search, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Loader2, 
  AlertCircle,
  Compass,
  PlusCircle,
  Car,
  List,
  Map as MapIcon,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  History,
  Bell
} from 'lucide-react';
import { auth, signInWithGoogleSafe } from '../firebase';
import { signOut, User as FirebaseUser } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  user: FirebaseUser | null;
  loading: boolean;
  activeTab?: 'explore' | 'bookings' | 'history';
  onTabChange?: (tab: 'explore' | 'bookings' | 'history') => void;
  currentView?: 'list' | 'map';
  onViewChange?: (view: 'list' | 'map') => void;
  bookingCount?: number;
  navHistoryCount?: number;
  priceAlertCount?: number;
  hasActiveCarPin?: boolean;
  onOpenFindMyCar?: () => void;
  onOpenAddFacility?: () => void;
  onOpenPriceAlerts?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  loading, 
  activeTab = 'explore', 
  onTabChange, 
  currentView = 'list',
  onViewChange,
  bookingCount = 0,
  navHistoryCount = 0,
  priceAlertCount = 0,
  hasActiveCarPin = false,
  onOpenFindMyCar,
  onOpenAddFacility,
  onOpenPriceAlerts
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthNotice(null);

    const result = await signInWithGoogleSafe();
    setIsSigningIn(false);

    if (result.error) {
      setAuthNotice(result.error);
      setTimeout(() => setAuthNotice(null), 5000);
    } else if (result.cancelled) {
      setAuthNotice('Sign-in cancelled. You can also book as a guest.');
      setTimeout(() => setAuthNotice(null), 4000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // silent catch
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-0">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0" 
            onClick={() => onTabChange?.('explore')}
          >
            <div className="bg-emerald-600 p-2 rounded-xl shadow-xs text-white flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none truncate">
                ParkFinder
              </h1>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate block">
                Harare Smart Parking & Gate Passes
              </span>
            </div>
          </div>
          
          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-3">
            <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => onTabChange?.('explore')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Find Parking
              </button>
              <button
                onClick={() => onTabChange?.('bookings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>My Bookings</span>
                {bookingCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {bookingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onTabChange?.('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Nav History</span>
                {navHistoryCount > 0 && (
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {navHistoryCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Find My Car Quick Action */}
            {onOpenFindMyCar && (
              <button
                onClick={onOpenFindMyCar}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  hasActiveCarPin 
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${hasActiveCarPin ? 'text-emerald-600 animate-pulse' : 'text-slate-500'}`} />
                <span>{hasActiveCarPin ? 'Parked Car' : 'Find My Car'}</span>
              </button>
            )}

            {/* Operator Add Facility Button */}
            {onOpenAddFacility && (
              <button
                onClick={onOpenAddFacility}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-200"
                title="Register New Facility"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Lot</span>
              </button>
            )}

            {/* Price Alerts Quick Action */}
            {onOpenPriceAlerts && (
              <button
                onClick={onOpenPriceAlerts}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200"
                title="Manage Rate Price Alerts"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">Price Alerts</span>
                {priceAlertCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {priceAlertCount}
                  </span>
                )}
              </button>
            )}

            <div className="h-5 w-px bg-slate-200" />
            
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                    {user.displayName || user.email}
                  </p>
                  <button 
                    onClick={handleLogout} 
                    className="text-[10px] text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 mt-1 font-medium cursor-pointer"
                  >
                    <LogOut className="w-2.5 h-2.5" />
                    Sign Out
                  </button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs border border-emerald-200">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={isSigningIn}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
              </button>
            )}
          </div>
          
          {/* Mobile Profile or Menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs border border-emerald-200">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLogin}
                  disabled={isSigningIn}
                  className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSigningIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <User className="w-3 h-3" />}
                  <span>Sign In</span>
                </button>
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-left">
            <button
              onClick={() => { onTabChange?.('explore'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'explore' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Find Parking Facilities</span>
              <MapPin className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => { onTabChange?.('bookings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'bookings' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>My Bookings & QR Passes</span>
                {bookingCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {bookingCount}
                  </span>
                )}
              </div>
              <CalendarCheck className="w-4 h-4 text-slate-400" />
            </button>

            {/* Navigation History in Mobile Drawer */}
            <button
              onClick={() => { onTabChange?.('history'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'history' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Navigation History (Last 5)</span>
                {navHistoryCount > 0 && (
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {navHistoryCount}
                  </span>
                )}
              </div>
              <History className="w-4 h-4 text-slate-400" />
            </button>

            {onOpenFindMyCar && (
              <button
                onClick={() => { onOpenFindMyCar(); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                  hasActiveCarPin 
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>{hasActiveCarPin ? 'Parked Car (Active Pin)' : 'Find My Car & Meter Timer'}</span>
                </div>
                {hasActiveCarPin && <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />}
              </button>
            )}

            {onOpenAddFacility && (
              <button
                onClick={() => { onOpenAddFacility(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-slate-500" />
                <span>+ Register New Facility</span>
              </button>
            )}

            {onOpenPriceAlerts && (
              <button
                onClick={() => { onOpenPriceAlerts(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Price Drop Alerts</span>
                </div>
                {priceAlertCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {priceAlertCount}
                  </span>
                )}
              </button>
            )}

            {user && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 truncate max-w-[180px]">{user.displayName || user.email}</span>
                <button 
                  onClick={handleLogout} 
                  className="text-xs text-rose-600 font-bold px-2 py-1 rounded bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notification Toast for auth banner */}
        {authNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{authNotice}</span>
            <button onClick={() => setAuthNotice(null)} className="ml-2 font-bold hover:underline cursor-pointer">Dismiss</button>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Mobile Sticky Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-2 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Explore List Button */}
          <button
            onClick={() => {
              onTabChange?.('explore');
              onViewChange?.('list');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'explore' && currentView === 'list'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="text-[10px] leading-none">Explore</span>
          </button>

          {/* Map View Button */}
          <button
            onClick={() => {
              onTabChange?.('explore');
              onViewChange?.('map');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'explore' && currentView === 'map'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="text-[10px] leading-none">Map</span>
          </button>

          {/* My Bookings Button */}
          <button
            onClick={() => onTabChange?.('bookings')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'bookings'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <CalendarCheck className="w-4 h-4" />
              {bookingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {bookingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">Bookings</span>
          </button>

          {/* Navigation History Button */}
          <button
            onClick={() => onTabChange?.('history')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'history'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <History className="w-4 h-4" />
              {navHistoryCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-slate-700 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {navHistoryCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">History</span>
          </button>

          {/* Find My Car Button */}
          {onOpenFindMyCar && (
            <button
              onClick={onOpenFindMyCar}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative cursor-pointer ${
                hasActiveCarPin ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Compass className="w-4 h-4" />
                {hasActiveCarPin && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] leading-none">{hasActiveCarPin ? 'My Car' : 'Car Pin'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 ParkFinder • Harare & Global Real-Time Parking Grid</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by Google Maps & Dual-Node Ultrasonic Sensors</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
