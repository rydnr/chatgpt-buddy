# @semantest/wikipedia.org

Wikipedia.org integration for Web Buddy using TypeScript-EDA architecture.

## Installation

```bash
npm install @semantest/wikipedia.org
```

## Usage

### Using the modern WikipediaClient

```typescript
import { WikipediaClient } from '@semantest/wikipedia.org';

const client = new WikipediaClient();
await client.initialize();

// Navigate to an article
await client.navigateToArticle('Albert Einstein');

// Search Wikipedia
await client.search('quantum physics');

// Extract current article
const article = await client.extractCurrentArticle();
if (article) {
  console.log(article.title);
  console.log(article.sections.map(s => s.title));
}

// Get specific section
const section = client.getSection('section-1');
```

### Using the backward-compatible WikipediaBuddyClient

```typescript
import { WikipediaBuddyClient } from '@semantest/wikipedia.org';

const client = new WikipediaBuddyClient();
await client.initialize();

// Legacy methods
await client.goToArticle('Albert Einstein');
const content = await client.getArticleContent();
const sections = await client.getArticleSections();
```

## Architecture

This package follows TypeScript-EDA (Event-Driven Architecture) patterns:

- **Domain Layer**: Entities (WikiArticle, WikiSection), Value Objects (ArticleId, WikiURL), and Events
- **Application Layer**: WikipediaApplication with event listeners
- **Infrastructure Layer**: DOM and Communication adapters
- **Client Layer**: WikipediaClient for API access

## License

GPL-3.0