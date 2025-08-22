<svelte:head>
  <title>Langam CYOA - Learn {$page.data?.targetLang.nameEN ?? 'Languages'} Through Adventure</title>
</svelte:head>

<svelte:window bind:scrollY={y} />

<script lang="ts">
	import { page } from '$app/stores';
  import FooterWithBackgroundImageComponent from '$lib/components/FooterWithBackgroundImageComponent.svelte';
  import './global.css';

	let y = 0;
  let footerOpacity = 0.5; // Initial opacity for the footer
  let hasBeenScrolledToBottom = false;

  $: onScroll(y)

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
    <h1>Learn {$page.data?.targetLang.nameEN ?? 'a Language'} by Living the Story</h1>
    <p>Immerse yourself in AI-powered adventures where your word shapes the story. Your journey begins now.</p>
    <a href="/game"><button data-umami-event="Landing Hero CTA" class="highlighted primary-cta">Start Your Adventure</button></a>
  </header>

  <!-- 
    Video Proof
    - Placed after the primary CTA to demonstrate the experience for users who want to learn more.
    - Autoplays silently to engage without being intrusive.
  -->
  <section class="video-container card">
    <video width="100%" autoplay loop muted playsinline controls>
      <source src="/videos/demo.mp4" type="video/mp4">
      Your browser does not support the video tag.
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
        <h4>📖 Choose Your Adventure</h4>
        <p>Your decisions drive the story, making each learning session unique and engaging.</p>
      </div>
    </div>
    <div class="card">
      <div class="flex-column">
        <h4>🤖 AI-Powered Chat</h4>
        <p>Talk with characters in {$page.data?.targetLang.nameEN ?? 'your target language'} and get instant feedback to improve your skills.</p>
      </div>
    </div>
    <div class="card">
      <div class="flex-column">
        <h4>🧠 Learn in Context</h4>
        <p>Acquire {$page.data?.targetLang.nameEN ?? 'language'} skills intuitively, just like you learned your native tongue.</p>
      </div>
    </div>
    <div class="card">
        <div class="flex-column">
            <h4>📈 Track Your Progress</h4>
            <p>Watch your vocabulary and skills grow as you conquer new challenges and complete stories.</p>
        </div>
    </div>
  </div>

  <!-- 
    Final CTA Section
    - Gives users a second opportunity to convert after they've learned more.
    - Reinforces the main message.
  -->
  <section class="card cta-section">
    <h2>Ready to Stop Memorizing and Start Exploring?</h2>
    <p>A new world of language awaits. Your story begins with a single tap.</p>
    <a href="/game"><button data-umami-event="Landing Footer CTA" class="highlighted">Start Learning Now</button></a>
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
