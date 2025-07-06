"use strict";
/*
                       Wikipedia-Buddy

   Copyright (C) 2025-today  rydnr@acm-sl.org

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikipediaHandler = void 0;
/**
 * Wikipedia-specific DOM handlers
 * Contains the actual logic for interacting with Wikipedia's interface
 *
 * This represents the domain logic layer - specific to Wikipedia's UI structure
 */
class WikipediaHandler {
    /**
     * Search for articles on Wikipedia
     */
    async searchArticle(query, limit = 10) {
        const searchInput = document.querySelector('#searchInput');
        const searchButton = document.querySelector('#searchButton');
        if (!searchInput || !searchButton) {
            throw new Error('Wikipedia search elements not found');
        }
        // Clear previous search and enter new query
        searchInput.value = '';
        searchInput.value = query;
        // Trigger search
        searchButton.click();
        // Wait for results to load
        await this.waitForSearchResults();
        return this.extractSearchResults(limit);
    }
    /**
     * Get the content of the current article
     */
    async getArticleContent() {
        const titleElement = document.querySelector('.mw-page-title-main, h1.firstHeading');
        const contentElement = document.querySelector('#mw-content-text .mw-parser-output');
        if (!titleElement || !contentElement) {
            throw new Error('Article content elements not found');
        }
        const title = titleElement.textContent?.trim() || '';
        const url = window.location.href;
        return {
            title,
            url,
            content: this.extractTextContent(contentElement),
            summary: await this.extractSummary(),
            sections: await this.extractSections(),
            categories: await this.extractCategories(),
            links: await this.extractLinks(),
            references: await this.extractReferences(),
            infobox: await this.extractInfobox(),
            lastModified: await this.getLastModifiedDate(),
            viewCount: await this.getViewCount()
        };
    }
    /**
     * Get article summary (first paragraph)
     */
    async getArticleSummary() {
        return this.extractSummary();
    }
    /**
     * Get article sections structure
     */
    async getArticleSections() {
        return this.extractSections();
    }
    /**
     * Navigate to a specific section
     */
    async navigateToSection(sectionTitle) {
        const tocLinks = document.querySelectorAll('.toc a, .toctext');
        for (const link of Array.from(tocLinks)) {
            if (link.textContent?.trim().toLowerCase().includes(sectionTitle.toLowerCase())) {
                link.click();
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for scroll
                return true;
            }
        }
        // Try direct anchor navigation
        const anchor = document.querySelector(`#${this.createAnchor(sectionTitle)}`);
        if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth' });
            return true;
        }
        return false;
    }
    /**
     * Get article links (internal and external)
     */
    async getArticleLinks() {
        return this.extractLinks();
    }
    /**
     * Get article references
     */
    async getArticleReferences() {
        return this.extractReferences();
    }
    /**
     * Get article categories
     */
    async getArticleCategories() {
        return this.extractCategories();
    }
    /**
     * Get article infobox data
     */
    async getArticleInfobox() {
        return this.extractInfobox();
    }
    /**
     * Get a random article
     */
    async getRandomArticle() {
        const randomLink = document.querySelector('#n-randompage a');
        if (randomLink) {
            randomLink.click();
        }
        else {
            // Fallback: navigate to Special:Random
            window.location.href = '/wiki/Special:Random';
        }
    }
    /**
     * Get today's featured article
     */
    async getFeaturedArticle() {
        window.location.href = '/wiki/Main_Page';
        await new Promise(resolve => setTimeout(resolve, 1000));
        const featuredLink = document.querySelector('#mp-tfa a');
        if (featuredLink) {
            featuredLink.click();
        }
    }
    /**
     * Search within specific categories
     */
    async searchInCategories(categories, query) {
        // This would implement category-specific search
        // For now, perform a regular search and filter by categories
        const results = await this.searchArticle(query);
        // Filter results that belong to specified categories
        return results.filter(async (result) => {
            // Would need to check each result's categories
            // This is a simplified implementation
            return true;
        });
    }
    // Private helper methods
    async waitForSearchResults() {
        return new Promise((resolve) => {
            const checkResults = () => {
                const results = document.querySelector('.mw-search-results, .searchresults');
                if (results) {
                    resolve();
                }
                else {
                    setTimeout(checkResults, 100);
                }
            };
            checkResults();
        });
    }
    extractSearchResults(limit) {
        const results = [];
        const resultElements = document.querySelectorAll('.mw-search-result, .searchresult');
        for (let i = 0; i < Math.min(resultElements.length, limit); i++) {
            const element = resultElements[i];
            const titleLink = element.querySelector('.mw-search-result-heading a, h3 a');
            const snippet = element.querySelector('.searchresult-text, .mw-search-result-data');
            const thumbnail = element.querySelector('.mw-search-result-thumbnail img');
            if (titleLink) {
                results.push({
                    title: titleLink.textContent?.trim() || '',
                    url: titleLink.href,
                    snippet: snippet?.textContent?.trim() || '',
                    thumbnail: thumbnail ? {
                        url: thumbnail.src,
                        width: thumbnail.width,
                        height: thumbnail.height
                    } : undefined,
                    wordCount: this.estimateWordCount(snippet?.textContent || ''),
                    lastModified: new Date() // Would need to extract from page metadata
                });
            }
        }
        return results;
    }
    extractTextContent(element) {
        // Remove unwanted elements like edit links, templates, etc.
        const clone = element.cloneNode(true);
        const unwanted = clone.querySelectorAll('.mw-editsection, .navbox, .ambox, .hatnote');
        unwanted.forEach(el => el.remove());
        return clone.textContent?.trim() || '';
    }
    async extractSummary() {
        const firstParagraph = document.querySelector('#mw-content-text .mw-parser-output > p:not(.mw-empty-elt)');
        return firstParagraph?.textContent?.trim() || '';
    }
    async extractSections() {
        const sections = [];
        const headings = document.querySelectorAll('#mw-content-text h1, #mw-content-text h2, #mw-content-text h3, #mw-content-text h4, #mw-content-text h5, #mw-content-text h6');
        Array.from(headings).forEach((heading) => {
            const level = parseInt(heading.tagName.substring(1));
            const titleElement = heading.querySelector('.mw-headline');
            const title = titleElement?.textContent?.trim() || heading.textContent?.trim() || '';
            const anchor = titleElement?.id || this.createAnchor(title);
            sections.push({
                title,
                level,
                content: this.extractSectionContent(heading),
                anchor,
                subsections: [] // Would need recursive extraction
            });
        });
        return sections;
    }
    extractSectionContent(heading) {
        let content = '';
        let currentElement = heading.nextElementSibling;
        while (currentElement && !currentElement.matches('h1, h2, h3, h4, h5, h6')) {
            content += currentElement.textContent + '\n';
            currentElement = currentElement.nextElementSibling;
        }
        return content.trim();
    }
    async extractCategories() {
        const categories = [];
        const categoryLinks = document.querySelectorAll('#mw-normal-catlinks ul li a');
        Array.from(categoryLinks).forEach((link) => {
            const categoryName = link.textContent?.trim();
            if (categoryName) {
                categories.push(categoryName);
            }
        });
        return categories;
    }
    async extractLinks() {
        const links = [];
        const contentLinks = document.querySelectorAll('#mw-content-text a');
        Array.from(contentLinks).forEach((link) => {
            const href = link.getAttribute('href');
            const title = link.textContent?.trim() || '';
            if (href && title) {
                let type = 'external';
                let url = href;
                if (href.startsWith('/wiki/')) {
                    type = 'internal';
                    url = window.location.origin + href;
                }
                else if (href.startsWith('//')) {
                    type = 'interwiki';
                    url = 'https:' + href;
                }
                links.push({ title, url, type });
            }
        });
        return links;
    }
    async extractReferences() {
        const references = [];
        const refElements = document.querySelectorAll('.references li, .reflist li');
        Array.from(refElements).forEach((ref, index) => {
            const id = ref.id || `ref-${index}`;
            const content = ref.textContent?.trim() || '';
            const link = ref.querySelector('a[href^="http"]');
            references.push({
                id,
                title: content.substring(0, 100), // First 100 chars as title
                url: link?.href,
                type: 'web' // Would need better type detection
            });
        });
        return references;
    }
    async extractInfobox() {
        const infobox = document.querySelector('.infobox, .infobox-subbox');
        if (!infobox)
            return undefined;
        const fields = {};
        const rows = infobox.querySelectorAll('tr');
        Array.from(rows).forEach((row) => {
            const label = row.querySelector('th, .infobox-label');
            const value = row.querySelector('td, .infobox-data');
            if (label && value) {
                const labelText = label.textContent?.trim() || '';
                const valueText = value.textContent?.trim() || '';
                if (labelText && valueText) {
                    fields[labelText] = valueText;
                }
            }
        });
        const image = infobox.querySelector('img');
        return {
            type: this.detectInfoboxType(infobox),
            fields,
            image: image ? {
                url: image.src,
                caption: image.alt,
                alt: image.alt
            } : undefined
        };
    }
    detectInfoboxType(infobox) {
        const classes = Array.from(infobox.classList);
        const typeClass = classes.find(cls => cls.startsWith('infobox-'));
        return typeClass ? typeClass.replace('infobox-', '') : 'generic';
    }
    async getLastModifiedDate() {
        const lastModified = document.querySelector('#footer-info-lastmod');
        if (lastModified) {
            const text = lastModified.textContent || '';
            const match = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
            if (match) {
                return new Date(match[1]);
            }
        }
        return new Date();
    }
    async getViewCount() {
        // View count would typically require API call
        // This is a placeholder
        return undefined;
    }
    createAnchor(title) {
        return title.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
    }
    estimateWordCount(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }
}
exports.WikipediaHandler = WikipediaHandler;
//# sourceMappingURL=handlers.js.map