document.addEventListener('DOMContentLoaded', function() {
  // Get all nav links
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Add active class to current page's nav link
  navLinks.forEach(link => {
    const currentPath = window.location.pathname;
    const linkPath = link.getAttribute('href');
    
    // For normal page links (not hash links)
    if (!linkPath.startsWith('#')) {
      // Check if the current path ends with the link's path
      if (currentPath.endsWith(linkPath)) {
        link.classList.add('active');
      } else if (currentPath.endsWith('/index.html') && linkPath === 'index.html') {
        link.classList.add('active');
      } else if (currentPath.endsWith('/') && linkPath === 'index.html') {
        link.classList.add('active');
      }
    } else {
      // For hash links within the same page
      // Add click event listeners
      link.addEventListener('click', function(e) {
        // Remove active class from other links
        navLinks.forEach(nav => {
          if (nav.getAttribute('href').startsWith('#')) {
            nav.classList.remove('active');
          }
        });
        
        // Add active class to clicked link
        this.classList.add('active');

        // No need to prevent default - let the browser handle the hash navigation
      });
      
      // Check if this hash link matches the current hash
      if (window.location.hash === linkPath) {
        link.classList.add('active');
      }
    }
  });
  
  // Scroll to the hash element on page load if there is a hash in the URL
  if (window.location.hash) {
    const targetElement = document.querySelector(window.location.hash);
    if (targetElement) {
      // Slight delay to ensure page is ready
      setTimeout(() => {
        targetElement.scrollIntoView({behavior: 'smooth'});
      }, 100);
    }
  }
});