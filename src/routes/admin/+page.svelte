<script lang="ts">
  import '../global.css';
	import { targetLang } from '$lib/stores';
	import { backendPost } from '$lib/components/backend';
	import { goto } from '$app/navigation';

  let title = '';
  let body = '';
  let question = '';

  async function onSubmit(event: SubmitEvent) {
    const formDataEntries = new FormData(event.target as HTMLFormElement);
    const payload = {};
    for (const [key, value] of formDataEntries.entries()) {
      payload[key] = value as string;
    }
    
    let json = await backendPost('/new_document/'+$targetLang, payload)
    var link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(json.csv));
    link.setAttribute('download', "new_document");
    link.hidden = true;
    document.body.appendChild(link);
    link.click();            
    document.body.removeChild(link);
    
    // display that document now
    goto('/?doc=' + json.docId)
  }

  function onTitleInput() {    
    var paragraphs = title.split('\n');
    console.log(paragraphs);
    title = paragraphs[0];
    if (paragraphs.length > 1) {
        body = paragraphs.slice(1, paragraphs.length -1).join("\n").trim();
    }
    if (paragraphs.length > 2) {
        question = paragraphs[paragraphs.length - 1];
        console.log(question);
        
    }
  }
</script>

<svelte:head>
	<title>Admin View - Automated Language Learning AI</title>
</svelte:head>

<form class="boxBig" on:submit|preventDefault={onSubmit}>
  <h1>Admin View</h1>
  <textarea name="title" placeholder="Paste your text here..." on:input={onTitleInput} bind:value={title} required></textarea>
  <textarea name="text" rows="20" placeholder="" bind:value={body} required></textarea>
  <textarea name="question" placeholder="" bind:value={question}></textarea>
  <input type="text" name="topic" placeholder="Topic">
  <input type="text" name="type" placeholder="Type" required>
  <input type="text" name="difficulty" placeholder="Difficulty">
  <input type="submit">
</form>