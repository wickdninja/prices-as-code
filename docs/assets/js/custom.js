// Custom JavaScript for the documentation site

// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
  // Find all tab containers
  const tabContainers = document.querySelectorAll('.tabs');
  
  tabContainers.forEach(container => {
    const labels = container.querySelectorAll('.tab-label');
    const contents = container.querySelectorAll('.tab-content');
    
    // Add click event to each tab label
    labels.forEach(label => {
      label.addEventListener('click', () => {
        // Remove active class from all labels and contents
        labels.forEach(l => l.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked label and corresponding content
        label.classList.add('active');
        const target = label.getAttribute('data-tab');
        document.getElementById(target).classList.add('active');
      });
    });
    
    // Activate the first tab by default
    if (labels.length > 0) {
      labels[0].click();
    }
  });
});

// Copy code button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Find all code blocks
  const codeBlocks = document.querySelectorAll('pre.highlight');
  
  codeBlocks.forEach(block => {
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-button';
    copyButton.textContent = 'Copy';
    
    // Append button to code block
    block.style.position = 'relative';
    block.appendChild(copyButton);
    
    // Add click event to copy button
    copyButton.addEventListener('click', () => {
      const code = block.querySelector('code').innerText;
      
      navigator.clipboard.writeText(code).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy code: ', err);
        copyButton.textContent = 'Failed to copy';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      });
    });
  });
});

// Add smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
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
});

// Add dark mode toggle (if supported by the theme)
document.addEventListener('DOMContentLoaded', function() {
  const storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  }
  
  // Look for an existing theme toggle or create one if needed
  let themeToggle = document.querySelector('.theme-toggle');
  
  if (!themeToggle) {
    const nav = document.querySelector('.site-nav, .aux-nav');
    
    if (nav) {
      themeToggle = document.createElement('button');
      themeToggle.className = 'theme-toggle';
      themeToggle.innerHTML = '<span>🌙</span><span>☀️</span>';
      themeToggle.title = 'Toggle dark mode';
      
      // Insert the toggle button
      nav.appendChild(themeToggle);
      
      // Add styles for the toggle button
      const style = document.createElement('style');
      style.textContent = `
        .theme-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
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
      `;
      document.head.appendChild(style);
    }
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
});

// Add interactive pricing calculator
document.addEventListener('DOMContentLoaded', function() {
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
});