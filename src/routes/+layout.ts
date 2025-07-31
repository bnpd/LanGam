import { setupGlobalErrorTracking } from '$lib/errorTracking';
import type { LayoutLoad } from './$types';
import { getLangById } from '$lib/components/backend';
import { PUBLIC_LANG } from '$env/static/public';

setupGlobalErrorTracking();


export const prerender = true;

export const load: LayoutLoad = async () => {
    try {
        return {
            targetLang: await getLangById(PUBLIC_LANG)
        };
    } catch (e) {
        throw new Error(`Error fetching language ${PUBLIC_LANG}:` + e);
    }
};

