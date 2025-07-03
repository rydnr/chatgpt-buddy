/**
 * Multi-Site Research Example
 * 
 * Demonstrates how to use Web-Buddy to automate research across
 * multiple websites (Google + Wikipedia) in a single workflow.
 */

import { WebBuddyClient } from '@web-buddy/core';
import { GoogleBuddyClient } from '@web-buddy/google-buddy';
import { WikipediaBuddyClient } from '@web-buddy/wikipedia-buddy';

export interface ResearchReport {
  topic: string;
  timestamp: string;
  sources: {
    google: {
      resultCount: number;
      topResults: Array<{
        title: string;
        url: string;
      }>;
    };
    wikipedia: {
      title: string;
      wordCount: number;
      summary: string;
    };
  };
  insights: string[];
}

export class MultiSiteResearchApp {
  private webClient: WebBuddyClient;
  private googleClient: GoogleBuddyClient;
  private wikipediaClient: WikipediaBuddyClient;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.webClient = new WebBuddyClient({ serverUrl });
    this.googleClient = new GoogleBuddyClient(this.webClient);
    this.wikipediaClient = new WikipediaBuddyClient(this.webClient);
  }

  /**
   * Conduct comprehensive research on a topic using multiple sources
   */
  async conductResearch(topic: string): Promise<ResearchReport> {
    console.log(`🔍 Starting research on: ${topic}`);

    // Phase 1: Google Search
    console.log('📊 Phase 1: Google Search');
    const searchResults = await this.googleClient.search(`${topic} overview`);
    console.log(`Found ${searchResults.length} Google results`);

    // Phase 2: Wikipedia Research
    console.log('📚 Phase 2: Wikipedia Research');
    const article = await this.wikipediaClient.getArticle(topic);
    console.log(`Wikipedia article: ${article.title} (${article.wordCount} words)`);

    // Phase 3: Cross-Reference
    console.log('🔗 Phase 3: Cross-Reference');
    const summary = await this.wikipediaClient.searchAndSummarize(topic, 150);
    
    // Compile research report
    const report: ResearchReport = {
      topic: topic,
      timestamp: new Date().toISOString(),
      sources: {
        google: {
          resultCount: searchResults.length,
          topResults: searchResults.slice(0, 3).map(r => ({
            title: r.title,
            url: r.url
          }))
        },
        wikipedia: {
          title: article.title,
          wordCount: article.wordCount,
          summary: summary
        }
      },
      insights: this.generateInsights(searchResults, article)
    };

    console.log('✅ Research completed!');
    return report;
  }

  /**
   * Research multiple topics in parallel
   */
  async batchResearch(topics: string[]): Promise<ResearchReport[]> {
    console.log(`🔍 Starting batch research on ${topics.length} topics`);
    
    const reports = await Promise.all(
      topics.map(topic => this.conductResearch(topic))
    );

    console.log('✅ Batch research completed!');
    return reports;
  }

  /**
   * Generate insights by analyzing data from multiple sources
   */
  private generateInsights(googleResults: any[], wikipediaArticle: any): string[] {
    const insights = [];

    // Analyze search result diversity
    const uniqueDomains = new Set(
      googleResults.map(r => new URL(r.url).hostname)
    );
    insights.push(`Found content from ${uniqueDomains.size} different domains`);

    // Analyze content depth
    if (wikipediaArticle.wordCount > 1000) {
      insights.push('Wikipedia article provides comprehensive coverage');
    } else {
      insights.push('Wikipedia article provides basic coverage');
    }

    // Cross-reference analysis
    const googleTitles = googleResults.map(r => r.title.toLowerCase()).join(' ');
    const wikipediaTitle = wikipediaArticle.title.toLowerCase();
    
    if (googleTitles.includes(wikipediaTitle)) {
      insights.push('Wikipedia article appears in Google search results');
    }

    return insights;
  }
}

// Example usage
async function main() {
  const app = new MultiSiteResearchApp();

  try {
    // Single topic research
    const report = await app.conductResearch('TypeScript');
    console.log('\n📋 Research Report:');
    console.log(JSON.stringify(report, null, 2));

    // Batch research
    const batchReports = await app.batchResearch(['React', 'Vue', 'Angular']);
    console.log('\n📋 Batch Research Summary:');
    batchReports.forEach((report, index) => {
      console.log(`${index + 1}. ${report.topic}: ${report.sources.google.resultCount} Google results, ${report.sources.wikipedia.wordCount} Wikipedia words`);
    });

  } catch (error) {
    console.error('❌ Research failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}