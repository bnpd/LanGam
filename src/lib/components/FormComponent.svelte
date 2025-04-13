<script lang="ts">
    export let fields: {id: string, name: string, type?: string, value?: string, hidden?: boolean, checked?: boolean, options?: { value: string; label: string }[]}[]
    export let sections: {title: string | undefined, fields: string[]}[] = []
    export let submitOptions: {text: string, handler: (formdata: { [x: string]: string | undefined; }, disableOnSubmit?: boolean, disabled?: boolean, cssClass?: string) => void}

    const ALLOWED_TYPES = ['text', 'checkbox', 'select']

    $: if (new Set(fields.map(field=>field.id)).size != fields.length) {
      console.error('Duplicate input ids used for form');
    } else if (fields.some(field => field.type && !ALLOWED_TYPES.includes(field.type))) {
      console.error('Unknown input type used for form');
    } else if (fields.some(field => field.type == 'checkbox' && field.value != undefined)) {
      console.error('Checkboxes should use checked instead of value');
    } else if (fields.some(field => field.type === 'select' && !field.options)) {
      console.error('Dropdown fields must include an options array');
    }

    $: if (!sections?.length && fields?.length) {
      sections = [{title: undefined, fields: fields.map(field => field.id)}]
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

    $: if (inputsById) {
      console.log(sections);
      console.log(inputsById);
      console.log(fields);
      
    }
</script>

{#if fields?.length && sections?.length}
    <form>
      {#each sections as section}
        {#if section.title}
          <h1>{section.title}</h1>
        {/if}
        
        <div class={section.title ? "card" : ""}>
          {#each section.fields as field_id}
          {@const field = fields.filter(field => field.id === field_id)[0]}
          <div class="input-container">
            {#if !field.type || field.type === 'text'}
              <label for={field.id} hidden={field.hidden}>{field.name}</label>
              <div contenteditable id={field.id} hidden={field.hidden} bind:this={inputsById[field.id]} on:focus={onFocusNode}>{field?.value ?? ''}</div>
            {:else if field.type === 'checkbox'}
              <input type="checkbox" id={field.id} hidden={field.hidden} bind:this={inputsById[field.id]} on:focus={onFocusNode} checked={field?.checked ?? false}>&nbsp;
              <label for={field.id} hidden={field.hidden}>{field.name}</label>
            {:else if field.type === 'select'}
              <label for={field.id} hidden={field.hidden}>{field.name}</label>
              <select id={field.id} hidden={field.hidden} bind:this={inputsById[field.id]} on:focus={onFocusNode}>
                {#each field.options as option}
                  <option value={option.value} selected={option.value === field.value}>{option.label}</option>
                {/each}
              </select>
            {/if}
          </div>
          {/each}
        </div>
      {/each}
      {#each submitOptions as submitOption}
          <input 
          type="submit" 
          value={submitOption.text} 
          on:click|preventDefault={()=>{
            submitOption.handler(fields.reduce((acc, field) => {acc[field.id] = inputsById[field.id] instanceof HTMLDivElement ? inputsById[field.id]?.innerText : field.type === 'checkbox' ? inputsById[field.id]?.checked : field.type === 'select' ? inputsById[field.id]?.value : new Error('this type should not be here: '+inputsById[field.id].type); return acc}, {}))
            if (submitOption.disableOnSubmit) submitOption.disabled = true
          }}
          disabled={submitOption.disabled}
          class={submitOption.cssClass}
          >
      {/each}
    </form>
{/if}
