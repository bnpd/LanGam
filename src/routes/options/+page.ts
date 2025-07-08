import type { PageLoad } from './$types';
import { getAllLanguages } from '$lib/components/backend';

export const prerender = true;

export const load: PageLoad = async () => {
    const languages = await getAllLanguages();
    console.log('Load function - languages:', languages);
    console.log('Load function - returning:', { languages });
        
    return {
        languages
    };
};
