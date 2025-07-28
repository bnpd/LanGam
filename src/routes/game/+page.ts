import type { PageLoad } from './$types';
import { getGamesByLang, getLevel } from '$lib/components/backend';
import { PUBLIC_LANG } from '$env/static/public';
import DocumentC from '$lib/DocumentC';

export const prerender = true;

export const load: PageLoad = async () => {
    if (!PUBLIC_LANG) {
        throw new Error('PUBLIC_LANG is not defined. Please set it in your environment variables.');
    }

    let games = [];
    try {
        games = await getGamesByLang(PUBLIC_LANG);
    } catch (e) {
        throw new Error(`Error fetching games for language ${PUBLIC_LANG}:` + e);
    }

    const game = games[0];
    if (!game) {
        throw new Error(`No games found for language: ${PUBLIC_LANG}`);
    }

    const firstLevelParagraphs = DocumentC.fromJson(await getLevel(game.id, 1, PUBLIC_LANG, '_simple') as any).makeTask();

    const gameId = game.id;
    const collectionId = game.collectionId;

    return {
        gameId,
        collectionId,
        firstLevelParagraphs
    };
};
