<style>
    .header {
      position: relative;
      width: 100%;
    }
    
    .title {
      position: relative;
      text-align: center;
      z-index: 1; /* Ensure the title is on top */
    }
    
    /* Background image */
    .header::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: var(--header-before-height, 10vh); /* Matches the height of the header */
      z-index: -1; /* Ensure it is behind the title */
      /* Gradient overlay for fade effect as top layer, image as bottom layer */
      background: 
        linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, var(--body-background-color-half-opaque) 66%, var(--body-background-color) 100%),
        url('/images/Polish.avif') no-repeat center center;
      background-size: cover, cover; /* Apply cover to both layers */
      background-position: middle; /* Set the desired position */
    }
</style>

<div class="header">
  <h1 class="title">
    <slot />
  </h1>
</div>