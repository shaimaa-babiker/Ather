import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useData, useSettings, useToast } from './store';
import { CITIES, getCity, type City } from './data';
import { METHODS, tzOffset, type Method } from './util';

/**
 * Device location for prayer times and qibla.
 *
 * The user's GPS position, once granted, is the source of truth for coordinates.
 * The device time zone provides the clock offset (GPS itself carries no time zone).
 * If permission is denied or unavailable, everything falls back to the city preset
 * chosen in Settings, so the app keeps working without location access.
 */

export type GeoStatus = 'idle' | 'checking' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number | null;
  at: number;
}

interface LocationApi {
  coords: GeoCoords | null;
  status: GeoStatus;
  /** Request permission (if needed) and get a fresh position. Returns null on failure. */
  refresh: () => Promise<GeoCoords | null>;
}

const Ctx = createContext<LocationApi | null>(null);

export function deviceTzOffset(date: Date = new Date()): number {
  // The device offset already accounts for the current time zone and DST.
  const off = -date.getTimezoneOffset() / 60;
  if (isFinite(off)) return off;
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const alt = zone ? tzOffset(zone, date) : null;
    if (alt != null && isFinite(alt)) return alt;
  } catch {
    // Intl may be incomplete on some engines.
  }
  return 0;
}

/** Nearest preset city — used for the automatic calculation method and a friendly label. */
export function nearestCity(lat: number, lng: number): City {
  let best = CITIES[0];
  let bestD = Infinity;
  for (const c of CITIES) {
    const dLat = (c.lat - lat) * Math.PI / 180;
    const dLng = (c.lng - lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

function toCoords(pos: Location.LocationObject): GeoCoords {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
    at: Date.now(),
  };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { settings, setSettings } = useSettings();
  const { hydrated } = useData();
  const { show } = useToast();

  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const coordsRef = useRef<GeoCoords | null>(null);
  coordsRef.current = coords;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const apply = useCallback((next: GeoCoords) => {
    coordsRef.current = next;
    setCoords(next);
    setSettings({ geoLat: next.lat, geoLng: next.lng, geoAt: next.at });
  }, [setSettings]);

  const refresh = useCallback(async (): Promise<GeoCoords | null> => {
    setStatus('checking');

    // Some browsers do not expose the Permissions API. In that case skip the
    // permission helpers entirely and let the geolocation call prompt the user.
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted) {
        if (perm.canAskAgain === false) {
          setStatus('denied');
          setSettings({ geo: false });
          show('الوصول إلى الموقع غير مسموح — اختر مدينتك من الإعدادات', 'info');
          return null;
        }
        setStatus('requesting');
        perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          setStatus('denied');
          setSettings({ geo: false });
          show('لم يُسمح بالوصول إلى الموقع — يمكنك اختيار مدينتك يدوياً', 'info');
          return null;
        }
      }
    } catch {
      // No Permissions API (or the prompt cannot be queried) — continue and let
      // getCurrentPositionAsync trigger the native/browser prompt.
    }

    try {
      // Show a cached fix immediately when one is fresh enough, then refine it.
      try {
        const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000, requiredAccuracy: 5000 });
        if (last) apply(toCoords(last));
      } catch {
        // No cached fix — fine, request a fresh one below.
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = toCoords(pos);
      apply(next);
      setStatus('granted');
      return next;
    } catch (e: any) {
      if (Platform.OS === 'web' && (e?.code === 1 || /denied/i.test(String(e?.message || '')))) {
        setStatus('denied');
        setSettings({ geo: false });
        show('لم يُسمح بالوصول إلى الموقع — يمكنك اختيار مدينتك يدوياً', 'info');
        return null;
      }
      setStatus('unavailable');
      show('تعذّر تحديد الموقع — تأكد من تشغيل خدمة الموقع ثم أعد المحاولة', 'error');
      return null;
    }
  }, [apply, setSettings, show]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Restore the last saved fix and, on first run, ask for permission once when
  // location-based prayer times are enabled (the default).
  const bootRef = useRef(false);
  useEffect(() => {
    if (!hydrated || bootRef.current) return;
    bootRef.current = true;

    const s = settingsRef.current;
    if (typeof s.geoLat === 'number' && typeof s.geoLng === 'number') {
      const saved = {
        lat: s.geoLat,
        lng: s.geoLng,
        accuracy: null,
        at: s.geoAt || 0,
      };
      coordsRef.current = saved;
      setCoords(saved);
    }

    if (!s.geo) return;

    Location.getForegroundPermissionsAsync()
      .then((perm) => {
        if (perm.granted) {
          refreshRef.current();
        } else if (perm.canAskAgain !== false && !s.geoAsked) {
          // Ask once automatically; later attempts come from an explicit user action.
          setSettings({ geoAsked: true });
          refreshRef.current();
        } else {
          setStatus('denied');
        }
      })
      .catch(() => {
        // Permissions API unavailable (notably some browsers): ask by requesting
        // a position directly, which triggers the browser's own prompt — once.
        if (s.geoAsked) {
          setStatus('denied');
          return;
        }
        setSettings({ geoAsked: true });
        refreshRef.current();
      });
  }, [hydrated]);

  // Refresh silently when the app returns to the foreground with a stale fix.
  useEffect(() => {
    if (Platform.OS === 'web' || !settings.geo) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const c = coordsRef.current;
      if (!c || Date.now() - c.at > 10 * 60 * 1000) refreshRef.current();
    });
    return () => sub.remove();
  }, [settings.geo]);

  const api = useMemo<LocationApi>(() => ({ coords, status, refresh }), [coords, status, refresh]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useLocation(): LocationApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('LocationProvider missing');
  return c;
}

export interface PrayerLocation {
  lat: number;
  lng: number;
  /** Time-zone offset in hours for the calculated date. */
  tz: number;
  method: Method;
  methodKey: string;
  /** Primary label: "موقعي الحالي" or "دبي، الإمارات". */
  label: string;
  /** Secondary label: nearest city when using GPS. */
  sub: string;
  isGeo: boolean;
  city: City;
  near: City;
  accuracy: number | null;
  at: number | null;
  status: GeoStatus;
}

/**
 * Resolves the coordinates, time zone, and calculation method for prayer times.
 * With GPS enabled, the position is used directly and the method follows the
 * nearest preset city when the setting is "auto". Otherwise the selected city
 * preset is used, exactly as before.
 */
export function usePrayerLocation(date: Date = new Date()): PrayerLocation {
  const { settings } = useSettings();
  const { coords, status } = useLocation();

  const city = getCity(settings.city);
  const useGeo = settings.geo && coords != null;
  const near = useGeo ? nearestCity(coords!.lat, coords!.lng) : city;
  const methodKey = settings.method === 'auto' ? (useGeo ? near.method : city.method) : settings.method;
  const method = METHODS[methodKey] || METHODS.umm;
  const tz = useGeo ? deviceTzOffset(date) : (tzOffset(city.tz, date) ?? city.off);

  return {
    lat: useGeo ? coords!.lat : city.lat,
    lng: useGeo ? coords!.lng : city.lng,
    tz,
    method,
    methodKey,
    label: useGeo ? 'موقعي الحالي' : city.ar + '، ' + city.country,
    sub: useGeo ? 'أقرب مدينة: ' + near.ar + ' · ' + near.country : city.ar + ' · ' + city.country,
    isGeo: useGeo,
    city,
    near,
    accuracy: useGeo ? coords!.accuracy : null,
    at: useGeo ? coords!.at : null,
    status,
  };
}
