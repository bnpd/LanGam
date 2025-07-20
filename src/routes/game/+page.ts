import type { PageLoad } from './$types';
import { getLangById, getGamesByLang, getLevel } from '$lib/components/backend';
import { PUBLIC_LANG } from '$env/static/public';
import DocumentC from '$lib/DocumentC';

export const prerender = true;

export const load: PageLoad = async () => {
    if (!PUBLIC_LANG) {
        throw new Error('PUBLIC_LANG is not defined. Please set it in your environment variables.');
    }
    const langId = PUBLIC_LANG;

    let games = [];
    try {
        games = await getGamesByLang(langId);
    } catch (e) {
        throw new Error(`Error fetching games for language ${langId}:` + e);
    }

    const game = games[0];
    if (!game) {
        throw new Error(`No games found for language: ${langId}`);
    }

    const firstLevelParagraphs = DocumentC.fromJson(await getLevel(game.id, 1, langId, '_simple') as any).makeTask();

    const gameId = game.id;
    const collectionId = game.collectionId;

    let lang;
    try {
        lang = await getLangById(langId);
    } catch (e) {
        throw new Error(`Error fetching language ${langId}:` + e);
    }

    return {
        gameId,
        collectionId,
        lang,
        firstLevelParagraphs
    };
};
