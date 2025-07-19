<script lang="ts">
  import { goto } from '$app/navigation';
  import FormComponent from './FormComponent.svelte';
  import { createGame, isLoggedIn } from './backend';
  import '../../routes/global.css';

  import { onMount } from 'svelte';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';

  onMount(() => {
    // Check if the user is logged in
    if (!isLoggedIn()) {
      setTimeout(() => {
        // Wait for 0.5 second before redirecting
        goto('/login');
      }, 500);
    }
  });

  let fields = [
    { id: 'name', name: 'Name', type: 'text', value: '' },
    { id: 'lang', name: 'Language', type: 'select', value: '', options: [
      { value: 'en', label: 'English' },
      { value: 'pl', label: 'Polish' }
    ] },
    { id: 'img', name: 'Image URL', type: 'text', value: '' },
    { id: 'public', name: 'Public', type: 'checkbox', checked: false }
  ];
  let sections = [
    { title: 'Game Details', fields: ['name', 'lang', 'img', 'public'] }
  ];

  let submitOptions = [
    {
      text: 'Submit Game',
      handler: async (formData) => {
        try {
          const createdGame = await createGame({
            name: formData.name,
            lang: formData.lang,
            img: formData.img,
            public: formData.public
          });
          console.log('Game created:', createdGame);
          goto(`/chapters/new?game=${createdGame.id}`);
        } catch (error) {
          console.error('Error creating game:', error);
        }
      },
      disableOnSubmit: true
    }
  ];
</script>

<TitleWithBackgroundImageComponent>Add Game</TitleWithBackgroundImageComponent>
<FormComponent {fields} {sections} {submitOptions} />
