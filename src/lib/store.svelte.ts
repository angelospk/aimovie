import type { Language, Theme } from './types';

export const settings = $state<{
    theme: Theme;
    lang: Language;
    systemConfig: any;
    activeDatabaseIndex: number | null;
}>({
    theme: (typeof window !== 'undefined'
        ? localStorage.getItem('theme') || 'dark'
        : 'dark') as Theme,
    lang: (typeof window !== 'undefined' ? localStorage.getItem('lang') || 'el' : 'el') as Language,
    systemConfig: null,
    activeDatabaseIndex: null
});
