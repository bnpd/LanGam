import type { PageLoad } from './$types';
import { getAllLanguages } from '$lib/components/backend';

export const prerender = true;

export const load: PageLoad = async () => {
    const languages = await getAllLanguages();
    return {
        languages
    };
};
