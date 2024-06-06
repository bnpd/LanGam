<script lang="ts">
	import { onMount } from "svelte";
	import { getTopTasks } from "./backend";
	import { user } from "$lib/stores";
	import DocPreviewListComponent from "./DocPreviewListComponent.svelte";

    let filters: Array<{title: string; filter: {[filter: string]: string}}> = [
        {title: 'Short Stories', filter: {content_type: 'Story'}},
        {title: 'Long Stories', filter: {content_type: 'Long Sotry'}},
        {title: 'Articles', filter: {content_type: 'Article'}},
        {title: 'Adventures', filter: {topic: 'Adventure'}},
        {title: 'About Friendship', filter: {topic: 'Friendship'}},
        {title: 'About Work', filter: {topic: 'Work'}},
        {title: 'Polish Culture', filter: {topic: 'Culture'}},
    ]

</script>

{#each filters as filter}
    <h2>{filter.title}</h2>
    <DocPreviewListComponent filter={filter.filter}/>    
{/each}