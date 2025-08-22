<script lang="ts">
	import { currentTask } from "$lib/stores";

  export let height: string | undefined = undefined
</script>

<style id="header-style">
    .header {
      position: relative;
      width: 100%;
    }
    
    .title {
      position: relative;
      text-align: center;
      z-index: 1; /* Ensure the title is on top */
      color: aliceblue;
    }
    
    /* Background image, starts with small version in ::after element, then big version is layed on top */
    .header::before {
      content: '';
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--header-before-height, 10dvh); /* Matches the height of the header */
      z-index: -1; /* Ensure it is behind the title */

      /* Transition to higher quality version */
      opacity: 0;
      transition: opacity 0.2s ease-in-out 1s; /* 1s fade-in after a 1s delay so that it has time to load */
    }

    .header.lazy-image::before {
        background: 
          linear-gradient(to top, rgba(255, 255, 255, 0) 0%, var(--body-background-color-half-opaque) 20%, var(--body-background-color) 100%),
          url('/images/Polish.avif') no-repeat center center;
        background-size: cover, cover; /* Apply cover to both layers */
        opacity: 1;
    }

    .header::after {
      content: "";
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--header-before-height, 10dvh); /* Matches the height of the header */
      z-index: -2; /* Ensure it is behind the title */
      /* Gradient overlay for fade effect as top layer, image as bottom layer */
      background: 
        linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, var(--body-background-color-half-opaque) 20%, var(--body-background-color) 100%),
        url('/images/Polish-small.avif') no-repeat center center;
      background-size: cover, cover; /* Apply cover to both layers */
      background-position: middle; /* Set the desired position */
    }
</style>

<div class="header" class:lazy-image={$currentTask} style={height ? `--header-before-height: ${height}` : ''}>
  <h1 class="title">
    <slot />
  </h1>
</div>