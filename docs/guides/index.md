---
layout: default
title: Guides
nav_order: 2
has_children: true
permalink: /guides
---

# Guides

Welcome to the Prices as Code guides section. Here you'll find detailed tutorials and how-to guides for common tasks.

{: .note }
These guides are designed to help you get the most out of Prices as Code. If you're new to the library, start with the [Getting Started](getting-started.html) guide.

<div class="guide-categories">
  <div class="guide-category">
    <h2><i class="fa-solid fa-rocket"></i> Getting Started</h2>
    <ul class="guide-list">
      <li>
        <a href="getting-started.html">
          <span class="guide-title">Getting Started with Prices as Code</span>
          <span class="guide-description">Quick start guide to set up your pricing configuration</span>
        </a>
      </li>
      <li>
        <a href="configuration-file.html">
          <span class="guide-title">Configuration File Format</span>
          <span class="guide-description">Learn about the different configuration file formats</span>
        </a>
      </li>
      <li>
        <a href="cli.html">
          <span class="guide-title">Command Line Interface</span>
          <span class="guide-description">Using the PaC CLI tool</span>
        </a>
      </li>
    </ul>
  </div>
  
  <div class="guide-category">
    <h2><i class="fa-solid fa-graduation-cap"></i> Advanced Topics</h2>
    <ul class="guide-list">
      <li>
        <a href="metadata.html">
          <span class="guide-title">Working with Metadata</span>
          <span class="guide-description">How to use metadata for extended functionality</span>
        </a>
      </li>
      <li>
        <a href="custom-pricing.html">
          <span class="guide-title">Custom Pricing Logic</span>
          <span class="guide-description">Implementing complex pricing structures</span>
        </a>
      </li>
      <li>
        <a href="custom-providers.html">
          <span class="guide-title">Adding Custom Providers</span>
          <span class="guide-description">Extending PaC with your own billing provider</span>
        </a>
      </li>
      <li>
        <a href="ci-cd.html">
          <span class="guide-title">CI/CD Integration</span>
          <span class="guide-description">Integrating Prices as Code into your workflow</span>
        </a>
      </li>
    </ul>
  </div>
</div>

<div class="video-tutorial">
  <h2>Video Tutorial</h2>
  <p>Watch our comprehensive video tutorial on using Prices as Code:</p>
  <div class="video-container">
    <!-- Replace with actual video embed when available -->
    <div class="video-placeholder">
      <i class="fa-solid fa-play"></i>
      <span>Prices as Code Tutorial (Coming Soon)</span>
    </div>
  </div>
</div>

<style>
.guide-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.guide-category h2 {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.guide-category h2 i {
  margin-right: 0.5rem;
  color: #0366d6;
}

.guide-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-list li {
  margin-bottom: 1rem;
}

.guide-list a {
  display: block;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.2s;
  text-decoration: none;
}

.guide-list a:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #0366d6;
}

.guide-title {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #24292e;
}

.guide-description {
  display: block;
  font-size: 0.875rem;
  color: #6c757d;
}

.video-tutorial {
  margin: 3rem 0;
}

.video-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 4rem 2rem;
  text-align: center;
}

.video-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #0366d6;
}

.video-placeholder span {
  font-size: 1.25rem;
  color: #6c757d;
}
</style>