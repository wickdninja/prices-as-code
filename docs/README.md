# Prices as Code - Static Documentation Site

This folder contains the static HTML documentation for the Prices as Code library. The site is built without any static site generator and can be deployed to any static hosting service.

## Local Development

### Testing Locally

To test the site locally, you can use the included Node.js server:

```bash
# Navigate to the static-docs directory
cd /path/to/prices-as-code/static-docs

# Run the server
node server.js
```

This will start a local server at http://localhost:3000

### Adding New Pages

1. Copy an existing HTML page as a template
2. Update the content
3. Link to it from other pages

### File Structure

- `index.html` - Homepage
- `assets/` - CSS, JavaScript, and image files
- `guides/` - Documentation guides
- `api/` - API reference
- `providers/` - Provider documentation
- `components/` - Reusable HTML components
- `server.js` - Local development server
- `deploy.js` - Deployment script

## Deployment

To deploy the site to GitHub Pages:

```bash
# Navigate to the static-docs directory
cd /path/to/prices-as-code/static-docs

# Run the deployment script
node deploy.js

# Follow the instructions provided by the script
```

For other hosting services, you can simply copy the contents of this directory (excluding `server.js`, `deploy.js`, and this `README.md`) to your hosting service.

## Updating the Site

1. Edit the HTML files directly
2. Test your changes locally with `node server.js`
3. Deploy using the `deploy.js` script or your preferred method