/*
 * Copyright (C) 2024-present Semantest, rydnr
 *
 * This file is part of @semantest/wikipedia.org.
 *
 * @semantest/wikipedia.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @semantest/wikipedia.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @semantest/wikipedia.org. If not, see <https://www.gnu.org/licenses/>.
 */

// Main client exports
export { WikipediaClient } from './wikipedia-client';
export { WikipediaBuddyClient } from './wikipedia-buddy-client';

// Domain entities
export { WikiArticle } from './domain/entities/wiki-article';
export { WikiSection } from './domain/entities/wiki-section';

// Value objects
export { ArticleId } from './domain/value-objects/article-id';
export { WikiURL } from './domain/value-objects/wiki-url';

// Domain events
export { ArticleRequestedEvent } from './domain/events/article-requested-event';
export { ArticleLoadedEvent } from './domain/events/article-loaded-event';

// Application layer
export { WikipediaApplication } from './application/wikipedia-application';

// Infrastructure adapters
export { WikipediaDOMAdapter } from './infrastructure/adapters/wikipedia-dom-adapter';
export { WikipediaCommunicationAdapter } from './infrastructure/adapters/wikipedia-communication-adapter';

// Default export for convenience
export default WikipediaClient;