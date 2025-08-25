<svelte:head>
  <title>{m.page_title({ targetLang: targetLangLocalized ?? 'Languages' })}</title>
</svelte:head>

<svelte:window bind:scrollY={y} />

<script lang="ts">
	import { page } from '$app/stores';
  import { m } from '$lib/paraglide/messages.js';
  import FooterWithBackgroundImageComponent from '$lib/components/FooterWithBackgroundImageComponent.svelte';
  import './global.css';
	import { onMount } from 'svelte';

	let y = 0;
  let footerOpacity = 0.5; // Initial opacity for the footer
  let hasBeenScrolledToBottom = false;
  let targetLangLocalized = (m["lang_"+$page.data?.targetLang.id as keyof typeof m] as () => string)() ?? $page.data?.targetLang.nameEN;

  $: onScroll(y)

  onMount(()=>{
    window.umami?.track('Landing localized', {targetLangLocalized});
  })

  function onScroll(y: number) {
    if (typeof document === 'undefined' || !document.body) return;

    document.body?.style?.setProperty('--header-before-height', `${y / document.body?.scrollHeight * 150 + 15}dvh`);
    footerOpacity = (y / document.body?.scrollHeight)+0.5
    
    // scrolled around halfway -> umami event
    if (!hasBeenScrolledToBottom && y / document.body?.scrollHeight > 0.3) { 
      hasBeenScrolledToBottom = true;
      window.umami?.track('Landing scrolled');
    }
  }
</script>

<main>
  <!-- 
    Hero Section (Above the Fold)
    - Benefit-oriented headline and concise copy.
    - Prominent, thumb-friendly Call-to-Action (CTA) is immediately visible.
  -->
  <header class="card hero">
    <h1>{m.hero_title({ targetLang: targetLangLocalized ?? 'a Language' })}</h1>
    <p>{m.hero_subtitle()}</p>
    <a href="/game"><button data-umami-event="Landing Hero CTA" class="highlighted primary-cta">{m.hero_cta()}</button></a>
  </header>

  <!-- 
    Video Proof
    - Placed after the primary CTA to demonstrate the experience for users who want to learn more.
    - Autoplays silently to engage without being intrusive.
  -->
  <section class="video-container card">
    <video width="100%" autoplay loop muted playsinline controls>
      <source src="/videos/demo.mp4" type="video/mp4">
    </video>
  </section>

  <!-- 
    Features/Benefits Section
    - Uses a two-column layout that stacks on mobile for easy scanning.
    - Bullet-point style with clear headers and short descriptions.
  -->
  <div class="two-columns">
    <div class="card">
      <div class="flex-column">
        <h4>📖 {m.feature_1_title()}</h4>
        <p>{m.feature_1_desc()}</p>
      </div>
    </div>
    <div class="card">
      <div class="flex-column">
        <h4>🤖 {m.feature_2_title()}</h4>
        <p>{m.feature_2_desc({ targetLang: targetLangLocalized ?? 'your target language' })}</p>
      </div>
    </div>
    <div class="card">
      <div class="flex-column">
        <h4>🧠 {m.feature_3_title()}</h4>
        <p>{m.feature_3_desc({ targetLang: targetLangLocalized ?? 'language' })}</p>
      </div>
    </div>
    <div class="card">
        <div class="flex-column">
            <h4>📈 {m.feature_4_title()}</h4>
            <p>{m.feature_4_desc()}</p>
        </div>
    </div>
  </div>

  <!-- 
    Final CTA Section
    - Gives users a second opportunity to convert after they've learned more.
    - Reinforces the main message.
  -->
  <section class="card cta-section">
    <h2>{m.final_cta_title()}</h2>
    <p>{m.final_cta_subtitle()}</p>
    <a href="/game"><button data-umami-event="Landing Footer CTA" class="highlighted">{m.final_cta_button()}</button></a>
  </section>

  <div style="opacity: {footerOpacity}; z-index: -9999;">
    <FooterWithBackgroundImageComponent/>
  </div>

</main>

<style>
  .card h2, .card h3, .card h4, .card a {
    text-align: center;
    width: 100%;
    display: block;
  }

  main {
    display: flex;
    flex-direction: column;
    gap: 1em;
    font-size: large;
    text-align: justify;
  }

  .hero {
    display: flex;
    flex-direction: column;
    gap: 0.5em
  }
  
  /* Hero section is designed to grab attention immediately */
  .hero h1 {
    font-size: 1.8em;
    line-height: 1.2;
    color: darkblue;
  }

  /* Primary CTA is larger and impossible to miss */
  .primary-cta {
    width: 100%;
    max-width: 350px;
    padding: 0.8em 1em;
    font-size: 1.1em;
    line-height: 1.3em;
    height: auto;
  }

  .video-container {
    padding: 0 !important;
    overflow: hidden;
    width: fit-content;
    margin: 0 auto;
    border: outset 5px gray;
  }

  video {
    display: block;
    max-height: 60vh;
  }

  .cta-section {
    background-color: #A0D2EB; /* A nice light blue for the call to action */
  }

  .cta-section h2 {
    color: darkblue;
  }
  
  .cta-section button {
      margin: 1em auto 0;
  }

  .two-columns > div {
    min-width: 250px; /* Ensure cards don't get too squished on smaller screens */
  }

  /* Media query for slightly larger mobile screens to adjust hero text */
  @media only screen and (min-width: 400px) {
    .hero h1 {
      font-size: 2em;
    }
  }
</style>
