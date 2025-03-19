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
    
    // Append button to code block
    block.style.position = 'relative';
    block.appendChild(copyButton);
    
    // Add click event to copy button
    copyButton.addEventListener('click', () => {
      const code = block.querySelector('code')?.innerText || block.innerText;
      
      navigator.clipboard.writeText(code)
        .then(() => {
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy code: ', err);
          copyButton.textContent = 'Failed';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
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
    themeToggle.innerHTML = '<span>🌙</span><span>☀️</span>';
    themeToggle.title = 'Toggle dark mode';
    
    // Add styles for the toggle
    const style = document.createElement('style');
    style.textContent = `
      .theme-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        margin-left: 1rem;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
      }
      
      .theme-toggle span {
        display: none;
      }
      
      [data-theme="dark"] .theme-toggle span:first-child,
      :not([data-theme="dark"]) .theme-toggle span:last-child {
        display: block;
      }
      
      [data-theme="dark"] {
        --background-color: #1e2124;
        --text-color: #e6e6e6;
        --light-bg: #2d3033;
        --border-color: #41454a;
      }
    `;
    document.head.appendChild(style);
    
    // Add click event
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
    
    // Add to header
    header.appendChild(themeToggle);
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  setupCodeCopyButtons();
  setupSmoothScrolling();
  setupPricingCalculator();
  setupDarkMode();
});