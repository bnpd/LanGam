<script lang="ts">
    export let value: string = '';
    export let languages: any[] = [];
    export let placeholder: string = '';
    export let name: string = '';
    export let id: string = '';
    export let disabled: boolean = false;

    let isOpen = false;
    let dropdownContainer: HTMLDivElement;
    let selectedOption: HTMLButtonElement;

    function toggleDropdown() {
        if (disabled) return;
        isOpen = !isOpen;
    }

    function selectLanguage(langId: string) {
        value = langId;
        isOpen = false;
        selectedOption?.focus();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (disabled) return;
        
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleDropdown();
        } else if (event.key === 'Escape') {
            isOpen = false;
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const options = dropdownContainer.querySelectorAll('.dropdown-option');
            const currentIndex = Array.from(options).findIndex(option => option === document.activeElement);
            let nextIndex;
            
            if (event.key === 'ArrowDown') {
                nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
            } else {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
            }
            
            (options[nextIndex] as HTMLElement)?.focus();
        }
    }

    function handleClickOutside(event: MouseEvent) {
        if (dropdownContainer && !dropdownContainer.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    // Close dropdown when clicking outside
    $: if (typeof window !== 'undefined') {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        } else {
            document.removeEventListener('click', handleClickOutside);
        }
    }

    // Get the display name for the selected language
    $: selectedLanguage = languages.find(lang => lang.id === value);
    $: displayValue = selectedLanguage ? selectedLanguage.name_en : (value || placeholder);
</script>

<div class="language-dropdown" bind:this={dropdownContainer}>
    <button
        type="button"
        class="dropdown-trigger"
        class:disabled
        class:open={isOpen}
        bind:this={selectedOption}
        on:click={toggleDropdown}
        on:keydown={handleKeydown}
        {disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select language"
    >
        <span class="dropdown-value">{displayValue}</span>
        <span class="dropdown-arrow" aria-hidden="true">▼</span>
    </button>

    {#if isOpen}
        <div class="dropdown-menu" role="listbox">
            {#each languages.filter(lang => lang.native) as language}
                <button
                    type="button"
                    class="dropdown-option"
                    class:selected={language.id === value}
                    role="option"
                    aria-selected={language.id === value}
                    on:click={() => selectLanguage(language.id)}
                    on:keydown={handleKeydown}
                >
                    {language.name_en}
                </button>
            {/each}
        </div>
    {/if}

    <!-- Hidden input to maintain form compatibility -->
    <input type="hidden" {name} {id} bind:value />
</div>

<style>
    .language-dropdown {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 300px;
    }

    .dropdown-trigger {
        width: 100%;
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 0.375rem;
        background-color: white;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1rem;
        line-height: 1.5;
        text-align: left;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .dropdown-trigger:hover:not(.disabled) {
        border-color: #999;
    }

    .dropdown-trigger:focus {
        outline: none;
        border-color: #4a90e2;
        box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
    }

    .dropdown-trigger.disabled {
        background-color: #f5f5f5;
        color: #999;
        cursor: not-allowed;
    }

    .dropdown-value {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dropdown-arrow {
        margin-left: 0.5rem;
        transition: transform 0.2s;
        font-size: 0.8rem;
    }

    .dropdown-trigger.open .dropdown-arrow {
        transform: rotate(180deg);
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 1000;
        margin-top: 0.125rem;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 200px;
        overflow-y: auto;
    }

    .dropdown-option {
        width: 100%;
        padding: 0.5rem 1rem;
        border: none;
        background-color: transparent;
        cursor: pointer;
        text-align: left;
        font-size: 1rem;
        line-height: 1.5;
        transition: background-color 0.2s;
    }

    .dropdown-option:hover,
    .dropdown-option:focus {
        background-color: #f0f0f0;
        outline: none;
    }

    .dropdown-option.selected {
        background-color: #4a90e2;
        color: white;
    }

    .dropdown-option.selected:hover,
    .dropdown-option.selected:focus {
        background-color: #357abd;
    }
</style>
