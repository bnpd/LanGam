<script lang="ts">
import DocumentC from "$lib/DocumentC";

//export let img: ; // included in DocumentC?
export let docId: number;
export let doc: DocumentC;
</script>

<h4>{doc.title.text}</h4>
{#if doc.img}
    <img src={doc.img} alt={doc.title.text + "Image"}>
{/if}