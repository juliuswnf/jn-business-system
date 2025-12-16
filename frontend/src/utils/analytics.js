/**
 * Analytics Helper - Track Events & Conversions
 * Works with Plausible Analytics or Google Analytics
 */

/**
 * Track custom event
 * @param {string} eventName - Name of the event
 * @param {object} props - Event properties
 */
export const trackEvent = (eventName, props = {}) => {
  try {
    // Plausible Analytics
    if (window.plausible) {
      window.plausible(eventName, { props });
    }

    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', eventName, props);
    }

    // Console log in development
    if (import.meta.env.DEV) {
      // Analytics event tracked
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

/**
 * Track page view
 * @param {string} path - Page path
 */
export const trackPageView = (path) => {
  try {
    if (window.plausible) {
      window.plausible('pageview', { props: { path } });
    }

    if (window.gtag) {
      window.gtag('config', window.GA_MEASUREMENT_ID, {
        page_path: path
      });
    }
  } catch (error) {
    console.error('Page view tracking error:', error);
  }
};

/**
 * Pre-defined event trackers
 */
export const analytics = {
  // Booking events
  bookingStarted: (salonName) => {
    trackEvent('Booking Started', { salon: salonName });
  },

  bookingCompleted: (salonName, service, price) => {
    trackEvent('Booking Completed', {
      salon: salonName,
      service,
      price,
      value: price
    });
  },

  bookingCanceled: (reason) => {
    trackEvent('Booking Canceled', { reason });
  },

  // User events
  userRegistered: (role) => {
    trackEvent('User Registered', { role });
  },

  userLoggedIn: (role) => {
    trackEvent('User Logged In', { role });
  },

  // Subscription events
  subscriptionStarted: (plan) => {
    trackEvent('Subscription Started', { plan });
  },

  subscriptionUpgraded: (fromPlan, toPlan) => {
    trackEvent('Subscription Upgraded', {
      from_plan: fromPlan,
      to_plan: toPlan
    });
  },

  subscriptionCanceled: (plan) => {
    trackEvent('Subscription Canceled', { plan });
  },

  // Search & Discovery
  salonSearched: (query, resultsCount) => {
    trackEvent('Salon Searched', {
      query,
      results: resultsCount
    });
  },

  cityPageViewed: (city) => {
    trackEvent('City Page Viewed', { city });
  },

  // CTA clicks
  ctaClicked: (ctaName, location) => {
    trackEvent('CTA Clicked', {
      cta_name: ctaName,
      location
    });
  },

  // Demo requests
  demoRequested: () => {
    trackEvent('Demo Requested');
  },

  // Widget usage
  widgetInstalled: (salonName) => {
    trackEvent('Widget Installed', { salon: salonName });
  },

  widgetBookingCompleted: (salonSlug) => {
    trackEvent('Widget Booking Completed', { salon_slug: salonSlug });
  }
};

export default analytics;
