<script lang="ts">
    import type { LayoutTranslations } from "$lib/types";

    interface Props {
        translations: LayoutTranslations;
    }

    let { translations: tr }: Props = $props();

    const currentYear = new Date().getFullYear();
</script>

<footer class="py-6 md:px-8 md:py-0 border-t border-border">
    <div
        class="flex flex-row items-center justify-center gap-2 md:gap-4 flex-wrap h-14"
    >
        <p
            class="text-sm leading-loose text-muted-foreground flex items-center gap-0.5 whitespace-nowrap"
        >
            <span>© {currentYear} AI Movie Consultant</span>
        </p>

        <p
            class="text-sm leading-loose text-muted-foreground whitespace-nowrap"
        >
            <span class="hidden sm:inline">{tr.builtWith}</span>
            <a
                href="https://svelte.dev"
                target="_blank"
                rel="noreferrer"
                class="font-medium underline underline-offset-4 hover:text-accent"
            >
                Svelte
            </a>
            <a
                href="https://github.com/angelospk/aimovie"
                target="_blank"
                rel="noreferrer"
                class="font-medium underline underline-offset-4 hover:text-accent"
            >
                GitHub→
            </a>
        </p>
    </div>
</footer>
