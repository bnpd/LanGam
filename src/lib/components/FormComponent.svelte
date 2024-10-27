<script lang="ts">
    export let fields: {id: string, name: string, value?: string, hidden?: string}[]
    export let submitOptions: {text: string, handler: (formdata: { [x: string]: string | undefined; }) => void}

    let divFieldsById: {[id: string]: HTMLDivElement} = {}

    function onFocusNodeSelectContent(e: Event) {
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
</script>

<style>
.input-container {
  position: relative;
  display: block;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

label {
  position: absolute;
  top: -0.5em; 
  left: 0; 
  background-color: aliceblue; 
  padding: 0.4em 1.6em 0.4em 1.5em; 
  border-radius: 1em 1em 1em 0;
  font-size: x-small; 
  pointer-events: none; 
  font-style: italic;
  
}

div[contenteditable] {
  padding: 0.8em;
  font-size: 1em;
  width: 100%;
  box-sizing: border-box; 
}
</style>

{#if fields}
    <form>
        {#each fields as field}
        <div class="input-container">
            <label for={field.id} hidden={field.hidden}>{field.name}</label>
            <div contenteditable id={field.id} hidden={field.hidden} bind:this={divFieldsById[field.id]} on:focus={onFocusNodeSelectContent}>{field?.value ?? ''}</div>
        </div>
        {/each}
        {#each submitOptions as submitOption}
            <input type="submit" value={submitOption.text} on:click|preventDefault={()=>{submitOption.handler(fields.reduce((acc, field) => {acc[field.id] = divFieldsById[field.id]?.innerText; return acc}, {}))}}>
        {/each}
    </form>
{/if}
