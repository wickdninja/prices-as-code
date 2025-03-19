// Main JavaScript for Prices as Code documentation

// Add copy code button to all code blocks
function setupCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre');
  
  codeBlocks.forEach(block => {
    // Skip if already has a button
    if (block.querySelector('.copy-code-button')) return;
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-button';
    copyButton.textContent = 'Copy';
    
    // Add language label if possible
    const code = block.querySelector('code');
    if (code && code.className) {
      const langMatch = code.className.match(/language-(\w+)/);
      if (langMatch && langMatch[1]) {
        const langLabel = document.createElement('div');
        langLabel.className = 'language-header';
        langLabel.textContent = langMatch[1];
        block.appendChild(langLabel);
      }
    }
    
    // Append button to code block
    block.style.position = 'relative';
    block.appendChild(copyButton);
    
    // Add click event to copy button
    copyButton.addEventListener('click', () => {
      const code = block.querySelector('code')?.innerText || block.innerText;
      
      navigator.clipboard.writeText(code)
        .then(() => {
          copyButton.textContent = 'Copied!';
          copyButton.style.backgroundColor = 'var(--success-color)';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
            copyButton.style.backgroundColor = '';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy code: ', err);
          copyButton.textContent = 'Failed';
          copyButton.style.backgroundColor = 'var(--danger-color)';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
            copyButton.style.backgroundColor = '';
          }, 2000);
        });
    });
  });
}

// Add smooth scrolling for anchor links
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      if (targetId !== '#' && document.querySelector(targetId)) {
        e.preventDefault();
        
        document.querySelector(targetId).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// Setup pricing calculator
function setupPricingCalculator() {
  const calculator = document.getElementById('pricing-calculator');
  
  if (calculator) {
    const priceOptions = calculator.querySelectorAll('input[type="radio"]');
    const quantityInput = calculator.querySelector('input[type="number"]');
    const totalPrice = calculator.querySelector('.total-price');
    
    function calculatePrice() {
      const selectedPrice = document.querySelector('input[name="price-option"]:checked');
      const quantity = parseInt(quantityInput.value, 10) || 1;
      
      if (selectedPrice) {
        const priceValue = parseFloat(selectedPrice.value);
        const total = priceValue * quantity;
        
        totalPrice.textContent = `$${total.toFixed(2)}`;
        
        // Animate the price change
        totalPrice.animate([
          { transform: 'scale(1.1)', color: 'white' },
          { transform: 'scale(1)', color: 'white' }
        ], {
          duration: 300,
          easing: 'ease-out'
        });
      }
    }
    
    // Add event listeners
    priceOptions.forEach(option => {
      option.addEventListener('change', calculatePrice);
    });
    
    if (quantityInput) {
      quantityInput.addEventListener('input', calculatePrice);
    }
    
    // Calculate initial price
    calculatePrice();
  }
}

// Setup dark mode toggle
function setupDarkMode() {
  const storedTheme = localStorage.getItem('theme') || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  }
  
  // Create toggle button
  const header = document.querySelector('.header-content');
  
  if (header) {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<span class="dark-icon">🌙</span><span class="light-icon">☀️</span>';
    themeToggle.title = 'Toggle dark mode';
    
    // Add click event
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Animate the transition
      document.body.style.transition = 'opacity 0.3s ease';
      document.body.style.opacity = '0.8';
      
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        setTimeout(() => {
          document.body.style.opacity = '1';
          setTimeout(() => {
            document.body.style.transition = '';
          }, 300);
        }, 50);
      }, 100);
    });
    
    // Add to header
    header.appendChild(themeToggle);
  }
}

// Setup search functionality
function setupSearch() {
  const heroSection = document.querySelector('.hero');
  
  if (heroSection) {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-box';
    searchInput.placeholder = 'Search documentation...';
    searchInput.setAttribute('aria-label', 'Search documentation');
    
    // Create search icon
    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.textContent = '🔍';
    
    // Create search results container
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    
    // Append elements
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchResults);
    
    // Insert after hero
    heroSection.parentNode.insertBefore(searchContainer, heroSection.nextSibling);
    
    // Initialize search index data
    const searchIndex = [];
    
    // Get page content
    const pageContent = document.querySelector('.content');
    if (pageContent) {
      // Extract headings as search entries
      const headings = pageContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        if (heading.textContent.trim()) {
          searchIndex.push({
            title: heading.textContent.trim(),
            url: '#' + heading.id,
            content: heading.nextElementSibling ? heading.nextElementSibling.textContent : '',
            element: heading
          });
        }
      });
      
      // Extract links as search entries
      const links = pageContent.querySelectorAll('a');
      links.forEach(link => {
        if (link.textContent.trim() && link.href.includes(window.location.hostname)) {
          searchIndex.push({
            title: link.textContent.trim(),
            url: link.href,
            content: '',
            element: link
          });
        }
      });
    }
    
    // Search function
    function performSearch(query) {
      if (!query) {
        searchResults.classList.remove('visible');
        return;
      }
      
      const results = searchIndex.filter(item => {
        return item.title.toLowerCase().includes(query.toLowerCase()) || 
               item.content.toLowerCase().includes(query.toLowerCase());
      });
      
      // Display results
      searchResults.innerHTML = '';
      
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
      } else {
        results.forEach(result => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          
          const resultLink = document.createElement('a');
          resultLink.href = result.url;
          
          const titleEl = document.createElement('div');
          titleEl.className = 'search-result-title';
          
          // Highlight matching text
          const titleText = result.title;
          const highlightedTitle = titleText.replace(
            new RegExp(query, 'gi'),
            match => `<span class="search-highlight">${match}</span>`
          );
          titleEl.innerHTML = highlightedTitle;
          
          const pathEl = document.createElement('div');
          pathEl.className = 'search-result-path';
          pathEl.textContent = result.url;
          
          resultLink.appendChild(titleEl);
          resultLink.appendChild(pathEl);
          resultItem.appendChild(resultLink);
          searchResults.appendChild(resultItem);
        });
      }
      
      searchResults.classList.add('visible');
    }
    
    // Add event listeners
    searchInput.addEventListener('input', () => {
      performSearch(searchInput.value);
    });
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value) {
        performSearch(searchInput.value);
      }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target)) {
        searchResults.classList.remove('visible');
      }
    });
  }
}

// Add interactive elements to features
function enhanceFeatures() {
  const features = document.querySelectorAll('.feature');
  
  // Add icons to features
  const featureIcons = [
    '🛡️', // Type-Safe
    '🔄', // Multi-Provider
    '📝', // Declarative
    '🔁', // Idempotent
    '🏷️'  // Metadata
  ];
  
  features.forEach((feature, index) => {
    const heading = feature.querySelector('h3');
    
    if (heading) {
      // Create icon
      const icon = document.createElement('div');
      icon.className = 'feature-icon';
      icon.textContent = featureIcons[index % featureIcons.length];
      
      // Insert before heading
      feature.insertBefore(icon, heading);
      
      // Add animation classes
      feature.classList.add('slide-in');
      feature.style.animationDelay = `${index * 0.1}s`;
    }
  });
}

// Add animation to section elements
function setupAnimations() {
  // Animate headings
  const headings = document.querySelectorAll('h2:not(.hero h2)');
  headings.forEach((heading, index) => {
    heading.classList.add('fade-in');
    heading.style.animationDelay = `${0.1 + index * 0.05}s`;
  });
  
  // Animate cards
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    card.classList.add('slide-in');
    card.style.animationDelay = `${0.2 + index * 0.1}s`;
  });
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  setupCodeCopyButtons();
  setupSmoothScrolling();
  setupPricingCalculator();
  setupDarkMode();
  setupSearch();
  enhanceFeatures();
  setupAnimations();
});