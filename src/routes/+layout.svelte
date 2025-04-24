<script>
  import '../app.css';
  import '@fontsource-variable/inter';
  import '@fontsource-variable/jetbrains-mono';
  import '@fontsource-variable/biorhyme';
</script>
<header class="pb-4 pt-6">
  <nav class="navbar bg-base-100 shadow-sm">
    <div class="navbar-start">
    </div>
    <div class="navbar-center">
      <a class="btn btn-circle text-xl" href="/">
        <img src="/icon-dark.svg" alt="Elela icon" height="100px" width="100px" />
      </a>
    </div>
    <div class="navbar-end">
    </div>
  </nav>
</header>
<main class="flex-grow pt-4">
  <slot/>
</main>
<footer class="footer sm:footer-horizontal footer-center text-base-content p-4">
  <div>
    <span>Made with ❤️ in Braamfontein, Johannesburg</span>
  </div>
</footer>