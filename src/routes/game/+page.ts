import type { PageLoad } from './$types';
import { getLang, getGamesByLang, getLevel } from '$lib/components/backend';
import { PUBLIC_LANG } from '$env/static/public';
import { simplificationLevel } from '$lib/stores';
import DocumentC from '$lib/DocumentC';

export const prerender = true;

export const load: PageLoad = async () => {
    if (!PUBLIC_LANG) {
        throw new Error('PUBLIC_LANG is not defined. Please set it in your environment variables.');
    }
    const langShortcode = PUBLIC_LANG;

    let lang;
    try {
        lang = await getLang(langShortcode);
    } catch (e) {
        throw new Error(`Error fetching language for shortcode ${langShortcode}:` + e);
    }

    let games = [];
    try {
        games = await getGamesByLang(lang.id);
    } catch (e) {
        throw new Error(`Error fetching games for language ${langShortcode}:` + e);
    }

    const game = games[0];
    if (!game) {
        throw new Error(`No games found for language: ${langShortcode}`);
    }

    const firstLevelParagraphs = DocumentC.fromJson((await getLevel(game.id, 1, '_simple'))['level']).makeTask();

    const gameId = game.id;
    const collectionId = game.collectionId;

    return {
        gameId,
        collectionId,
        lang,
        firstLevelParagraphs
    };
};
