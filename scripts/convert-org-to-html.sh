#!/bin/bash
set -e

echo "🔄 Converting org-mode files to HTML for GitHub Pages..."

# Function to convert org file to HTML with Jekyll front matter
convert_org_file() {
    local org_file="$1"
    local html_file="${org_file%.org}.html"
    
    echo "Converting: $org_file -> $html_file"
    
    # Extract front matter from org file
    local title=$(grep "#+TITLE:" "$org_file" | sed 's/#+TITLE: //' || echo "")
    local subtitle=$(grep "#+SUBTITLE:" "$org_file" | sed 's/#+SUBTITLE: //' || echo "")
    local author=$(grep "#+AUTHOR:" "$org_file" | sed 's/#+AUTHOR: //' || echo "")
    local date=$(grep "#+DATE:" "$org_file" | sed 's/#+DATE: //' || echo "")
    local layout=$(grep "#+LAYOUT:" "$org_file" | sed 's/#+LAYOUT: //' || echo "default")
    local project=$(grep "#+PROJECT:" "$org_file" | sed 's/#+PROJECT: //' || echo "")
    
    # Create temporary org file without front matter for conversion
    local temp_org="/tmp/$(basename "$org_file")"
    grep -v "^#+\(TITLE\|SUBTITLE\|AUTHOR\|DATE\|LAYOUT\|PROJECT\):" "$org_file" > "$temp_org"
    
    # Convert to HTML using pandoc (more reliable than emacs in CI)
    local temp_html="/tmp/$(basename "${org_file%.org}.html")"
    pandoc "$temp_org" -f org -t html --no-highlight > "$temp_html"
    
    # Create Jekyll file with front matter
    cat > "$html_file" << EOF
---
title: "$title"
$([ -n "$subtitle" ] && echo "subtitle: \"$subtitle\"")
$([ -n "$author" ] && echo "author: \"$author\"")
$([ -n "$date" ] && echo "date: \"$date\"")
layout: $layout
$([ -n "$project" ] && echo "project: $project")
---

EOF
    
    # Append converted HTML content
    cat "$temp_html" >> "$html_file"
    
    # Clean up temporary files
    rm -f "$temp_org" "$temp_html"
}

# Convert all org files in docs directory
find docs -name "*.org" -type f | while read -r org_file; do
    convert_org_file "$org_file"
done

echo "✅ Org-mode to HTML conversion completed!"

# Create additional files for better GitHub Pages experience
echo "📝 Creating additional GitHub Pages files..."

# Create 404 page
cat > docs/404.html << 'EOF'
---
layout: default
title: Page Not Found
permalink: /404.html
---

<div style="text-align: center; padding: 4rem 2rem;">
  <h1 style="font-size: 4rem; margin-bottom: 1rem;">404</h1>
  <h2 style="margin-bottom: 2rem;">Page Not Found</h2>
  <p style="margin-bottom: 2rem; color: #666;">
    The page you're looking for doesn't exist in the TypeScript-EDA Ecosystem.
  </p>
  <a href="{{ site.baseurl }}/" style="
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
  ">← Return to Ecosystem Home</a>
</div>
EOF

# Create robots.txt
cat > docs/robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://rydnr.github.io/chatgpt-buddy/sitemap.xml
EOF

# Create .nojekyll to allow files starting with underscore
touch docs/.nojekyll

echo "✅ GitHub Pages setup completed!"

# Validate HTML files
echo "🔍 Validating generated HTML files..."
find docs -name "*.html" -type f | head -5 | while read -r html_file; do
    if [ -s "$html_file" ]; then
        echo "✅ $html_file ($(wc -l < "$html_file") lines)"
    else
        echo "❌ $html_file is empty!"
    fi
done

echo "🎉 All conversions completed successfully!"