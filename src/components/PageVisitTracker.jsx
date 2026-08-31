import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  getOrCreateId,
  parseUTMParams,
  classifyReferrer,
  detectDeviceType,
  detectBrowser,
} from '@/lib/analytics';

// In-app page visit tracker for Roxsan Music.
// Fires on every route change and logs a PageVisit record via the logPageVisit backend function.
// Anonymous visitors are supported (the function uses the service role).
// Captures UTM parameters, referrer-based source classification, device/browser info,
// and session-level landing page attribution.

const ATTRIBUTION_KEY = 'roxsan-attribution';
const VISITOR_KEY = 'roxsan-visitor-id';
const SESSION_KEY = 'roxsan-session-id';

function getSessionAttribution() {
  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function storeSessionAttribution(data) {
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(data));
  } catch {}
}

export default function PageVisitTracker() {
  const location = useLocation();
  const { isAuthenticated, authChecked } = useAuth();

  useEffect(() => {
    // Skip admin pages — we only want fan traffic.
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/MusicAdmin')) return;

    // Don't track logged-in Base44 users (e.g. the site owner working on the app).
    if (!authChecked || isAuthenticated) return;

    const visitor_id = getOrCreateId(VISITOR_KEY, localStorage);
    const session_id = getOrCreateId(SESSION_KEY, sessionStorage);
    const ua = navigator.userAgent || '';
    const device_type = detectDeviceType(ua);
    const browser = detectBrowser(ua);

    // Session-level attribution — captured once on first visit, reused for all subsequent page views.
    let attribution = getSessionAttribution();
    if (!attribution) {
      const referrer_url = document.referrer || '';
      const utms = parseUTMParams(window.location.search);

      let source, medium, campaign;
      if (utms.utm_source) {
        source = utms.utm_source;
        medium = utms.utm_medium || '';
        campaign = utms.utm_campaign || '';
      } else {
        const classified = classifyReferrer(referrer_url);
        source = classified.source;
        medium = classified.medium;
        campaign = '';
      }

      attribution = {
        referrer_url,
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
        utm_content: utms.utm_content,
        utm_term: utms.utm_term,
        source,
        medium,
        campaign,
        landing_page: location.pathname,
      };
      storeSessionAttribution(attribution);
    }

    base44.functions.invoke('logPageVisit', {
      landing_page: attribution.landing_page,
      current_page: location.pathname,
      referrer_url: attribution.referrer_url,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      device_type,
      browser,
      visitor_id,
      session_id,
    }).catch(() => {});
  }, [location.pathname, authChecked, isAuthenticated]);

  return null;
}