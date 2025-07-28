declare const umami: any; // imported from script tag

export function setupGlobalErrorTracking() {
    if (typeof window === 'undefined') return; // Prevent SSR errors    

    window.addEventListener('error', (event) => {
        try {
            umami?.track('error', {
                message: event.error?.message,
                stack: event.error?.stack,
                url: window.location.href
            });
        } catch (err) {
            console.warn('Error tracking failed:', err);
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        try {
            umami?.track('error', {
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack,
                url: window.location.href
            });
        } catch (err) {
            console.warn('Unhandled rejection tracking failed:', err);
        }
    });
}
