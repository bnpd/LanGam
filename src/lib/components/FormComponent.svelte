<script lang="ts">
    export let fields: {id: string, name: string, type?: string, value?: string, hidden?: boolean, checked?: boolean}[]
    export let submitOptions: {text: string, handler: (formdata: { [x: string]: string | undefined; }, disableOnSubmit?: boolean, disabled?: boolean, cssClass?: string) => void}

    const ALLOWED_TYPES = ['text', 'checkbox']

    $: if (new Set(fields.map(field=>field.id)).size != fields.length) {
      console.error('Duplicate input ids used for form');
    } else if (fields.some(field => field.type && !ALLOWED_TYPES.includes(field.type))) {
      console.error('Unknown input type used for form');
    } else if (fields.some(field => field.type == 'checkbox' && field.value != undefined)) {
      console.error('Checkboxes should use checked instead of value');
    }

    let inputsById: {[id: string]: HTMLElement} = {}

    function onFocusNode(e: Event) {
      // re-activate all submit buttons
      for (const i in submitOptions) {
        submitOptions[i].disabled = false
      }

      // select the content
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
</script>

{#if fields}
    <form>
        {#each fields as field}
        <div class="input-container">
          {#if !field.type || field.type === 'text'}
            <label for={field.id} hidden={field.hidden}>{field.name}</label>
            <div contenteditable id={field.id} hidden={field.hidden} bind:this={inputsById[field.id]} on:focus={onFocusNode}>{field?.value ?? ''}</div>
          {:else if field.type === 'checkbox'}
            <input type="checkbox" id={field.id} hidden={field.hidden} bind:this={inputsById[field.id]} on:focus={onFocusNode} checked={field?.checked ?? false}>&nbsp;
            <label for={field.id} hidden={field.hidden}>{field.name}</label>
          {/if}
        </div>
        {/each}
        {#each submitOptions as submitOption}
            <input 
            type="submit" 
            value={submitOption.text} 
            on:click|preventDefault={()=>{
              submitOption.handler(fields.reduce((acc, field) => {acc[field.id] = inputsById[field.id] instanceof HTMLDivElement ? inputsById[field.id]?.innerText : inputsById[field.id].type === 'checkbox' ? inputsById[field.id]?.checked : new Error('this type should not be here'); return acc}, {}))
              if (submitOption.disableOnSubmit) submitOption.disabled = true
            }}
            disabled={submitOption.disabled}
            class={submitOption.cssClass}
            >
        {/each}
    </form>
{/if}
