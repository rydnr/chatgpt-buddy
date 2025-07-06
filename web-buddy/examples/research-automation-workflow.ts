/**
 * @fileoverview Research Automation Workflow Example
 * @description Demonstrates a comprehensive research workflow using multiple Web-Buddy domain implementations
 */

import { GoogleBuddyClient } from '../implementations/google-buddy/src/client';
import { ChatGPTBuddyClient } from '../implementations/chatgpt-buddy/src/client';
import { WikipediaBuddyClient } from '../implementations/wikipedia-buddy/src/client';
import { WebBuddyClient } from '../packages/core/src/client';

/**
 * Research workflow that combines Google search, Wikipedia research, and ChatGPT analysis
 * to generate comprehensive research reports on any topic
 */
export class ResearchAutomationWorkflow {
  private googleClient: GoogleBuddyClient;
  private chatgptClient: ChatGPTBuddyClient;
  private wikipediaClient: WikipediaBuddyClient;

  constructor(webBuddyServerUrl: string = 'ws://localhost:3001') {
    const coreClient = new WebBuddyClient({ serverUrl: webBuddyServerUrl });
    
    this.googleClient = new GoogleBuddyClient(coreClient);
    this.chatgptClient = new ChatGPTBuddyClient(coreClient);
    this.wikipediaClient = new WikipediaBuddyClient(coreClient);
  }

  /**
   * Performs comprehensive research on a topic and generates a structured report
   */
  async performResearch(topic: string): Promise<ResearchReport> {
    console.log(`🔍 Starting research workflow for topic: "${topic}"`);
    
    try {
      // Phase 1: Gather information from multiple sources
      const [googleResults, wikipediaInfo] = await Promise.all([
        this.gatherGoogleInformation(topic),
        this.gatherWikipediaInformation(topic)
      ]);

      // Phase 2: Analyze findings with ChatGPT
      const analysis = await this.analyzeWithChatGPT(topic, googleResults, wikipediaInfo);

      // Phase 3: Generate comprehensive report
      const report = this.generateReport(topic, googleResults, wikipediaInfo, analysis);
      
      console.log(`✅ Research workflow completed for "${topic}"`);
      return report;

    } catch (error) {
      console.error(`❌ Research workflow failed for "${topic}":`, error);
      throw new ResearchWorkflowError(`Failed to complete research for "${topic}": ${error.message}`);
    }
  }

  /**
   * Gathers information from Google search
   */
  private async gatherGoogleInformation(topic: string): Promise<GoogleResearchData> {
    console.log(`  📊 Gathering Google search data for "${topic}"`);
    
    // Perform comprehensive search
    await this.googleClient.enterSearchTerm(topic);
    await this.googleClient.submitSearch();
    
    const searchResults = await this.googleClient.getSearchResults({
      maxResults: 10
    });

    // Search for academic sources
    await this.googleClient.enterSearchTerm(`${topic} site:edu OR site:org research`);
    await this.googleClient.submitSearch();
    
    const academicResults = await this.googleClient.getSearchResults({
      maxResults: 5
    });

    // Search for recent news
    await this.googleClient.enterSearchTerm(`${topic} news 2024`);
    await this.googleClient.submitSearch();
    
    const newsResults = await this.googleClient.getSearchResults({
      maxResults: 5
    });

    return {
      generalResults: searchResults,
      academicSources: academicResults,
      recentNews: newsResults,
      totalSources: searchResults.length + academicResults.length + newsResults.length
    };
  }

  /**
   * Gathers information from Wikipedia
   */
  private async gatherWikipediaInformation(topic: string): Promise<WikipediaResearchData> {
    console.log(`  📚 Gathering Wikipedia data for "${topic}"`);
    
    try {
      // Search for main article
      await this.wikipediaClient.searchArticle(topic);
      
      const articleSummary = await this.wikipediaClient.getArticleSummary();
      const references = await this.wikipediaClient.getReferences();
      const relatedTopics = await this.wikipediaClient.getRelatedArticles();
      
      return {
        summary: articleSummary,
        references: references,
        relatedTopics: relatedTopics,
        hasDetailedArticle: true
      };
      
    } catch (error) {
      console.warn(`  ⚠️  Wikipedia article not found for "${topic}"`);
      return {
        summary: null,
        references: [],
        relatedTopics: [],
        hasDetailedArticle: false
      };
    }
  }

  /**
   * Analyzes gathered information using ChatGPT
   */
  private async analyzeWithChatGPT(
    topic: string, 
    googleData: GoogleResearchData, 
    wikipediaData: WikipediaResearchData
  ): Promise<ChatGPTAnalysis> {
    console.log(`  🤖 Analyzing data with ChatGPT for "${topic}"`);
    
    // Select appropriate project context
    await this.chatgptClient.selectProject('research-analysis');
    
    // Prepare comprehensive analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(topic, googleData, wikipediaData);
    
    // Send for analysis
    await this.chatgptClient.sendMessage(analysisPrompt);
    const analysis = await this.chatgptClient.waitForResponse();
    
    // Request additional insights
    await this.chatgptClient.sendMessage(
      'Please provide 3 key insights and 3 areas that need further research based on this analysis.'
    );
    const insights = await this.chatgptClient.waitForResponse();
    
    return {
      mainAnalysis: analysis,
      keyInsights: this.extractKeyInsights(insights),
      researchGaps: this.extractResearchGaps(insights),
      confidence: this.calculateConfidence(googleData, wikipediaData)
    };
  }

  /**
   * Builds comprehensive analysis prompt for ChatGPT
   */
  private buildAnalysisPrompt(
    topic: string, 
    googleData: GoogleResearchData, 
    wikipediaData: WikipediaResearchData
  ): string {
    let prompt = `Please analyze the following research data about "${topic}":\n\n`;
    
    // Add Google search findings
    prompt += `GOOGLE SEARCH RESULTS:\n`;
    prompt += `General sources (${googleData.generalResults.length} results):\n`;
    googleData.generalResults.forEach((result, index) => {
      prompt += `${index + 1}. ${result.title}: ${result.snippet}\n`;
    });
    
    prompt += `\nAcademic sources (${googleData.academicSources.length} results):\n`;
    googleData.academicSources.forEach((result, index) => {
      prompt += `${index + 1}. ${result.title}: ${result.snippet}\n`;
    });
    
    prompt += `\nRecent news (${googleData.recentNews.length} results):\n`;
    googleData.recentNews.forEach((result, index) => {
      prompt += `${index + 1}. ${result.title}: ${result.snippet}\n`;
    });
    
    // Add Wikipedia information
    if (wikipediaData.hasDetailedArticle) {
      prompt += `\nWIKIPEDIA INFORMATION:\n`;
      prompt += `Summary: ${wikipediaData.summary}\n`;
      prompt += `Related topics: ${wikipediaData.relatedTopics.join(', ')}\n`;
      prompt += `Number of references: ${wikipediaData.references.length}\n`;
    }
    
    prompt += `\nPlease provide a comprehensive analysis covering:
1. Current state of knowledge about ${topic}
2. Key developments and trends
3. Different perspectives or controversies
4. Practical applications and implications
5. Overall assessment of the information quality and completeness`;
    
    return prompt;
  }

  /**
   * Extracts key insights from ChatGPT response
   */
  private extractKeyInsights(response: string): string[] {
    // Simple extraction logic - in production, you might use more sophisticated NLP
    const lines = response.split('\n');
    const insights: string[] = [];
    
    let inInsightsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('key insights') || line.toLowerCase().includes('insights:')) {
        inInsightsSection = true;
        continue;
      }
      
      if (inInsightsSection && line.trim().match(/^\d+\./)) {
        insights.push(line.trim());
        if (insights.length >= 3) break;
      }
    }
    
    return insights.length > 0 ? insights : ['Analysis completed - see main analysis for insights'];
  }

  /**
   * Extracts research gaps from ChatGPT response
   */
  private extractResearchGaps(response: string): string[] {
    const lines = response.split('\n');
    const gaps: string[] = [];
    
    let inGapsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('further research') || line.toLowerCase().includes('research gaps')) {
        inGapsSection = true;
        continue;
      }
      
      if (inGapsSection && line.trim().match(/^\d+\./)) {
        gaps.push(line.trim());
        if (gaps.length >= 3) break;
      }
    }
    
    return gaps.length > 0 ? gaps : ['No specific research gaps identified'];
  }

  /**
   * Calculates confidence score based on available data
   */
  private calculateConfidence(googleData: GoogleResearchData, wikipediaData: WikipediaResearchData): number {
    let score = 0;
    
    // Google data quality
    score += Math.min(googleData.totalSources * 5, 40); // Max 40 points for sources
    score += googleData.academicSources.length * 10; // Extra points for academic sources
    
    // Wikipedia data quality
    if (wikipediaData.hasDetailedArticle) {
      score += 20; // Base score for having Wikipedia article
      score += Math.min(wikipediaData.references.length * 2, 20); // Max 20 points for references
    }
    
    return Math.min(score, 100); // Cap at 100%
  }

  /**
   * Generates final research report
   */
  private generateReport(
    topic: string,
    googleData: GoogleResearchData,
    wikipediaData: WikipediaResearchData,
    analysis: ChatGPTAnalysis
  ): ResearchReport {
    return {
      topic,
      timestamp: new Date(),
      summary: {
        totalSources: googleData.totalSources + (wikipediaData.hasDetailedArticle ? 1 : 0),
        confidence: analysis.confidence,
        hasWikipediaArticle: wikipediaData.hasDetailedArticle,
        academicSourcesFound: googleData.academicSources.length
      },
      findings: {
        googleResearch: googleData,
        wikipediaResearch: wikipediaData,
        aiAnalysis: analysis
      },
      keyInsights: analysis.keyInsights,
      researchGaps: analysis.researchGaps,
      recommendations: this.generateRecommendations(analysis),
      metadata: {
        workflowVersion: '1.0.0',
        executionTime: Date.now(), // Would be calculated properly in real implementation
        automationTools: ['Google Search', 'Wikipedia', 'ChatGPT']
      }
    };
  }

  /**
   * Generates actionable recommendations based on research
   */
  private generateRecommendations(analysis: ChatGPTAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.confidence < 60) {
      recommendations.push('Consider searching for additional sources to improve research confidence');
    }
    
    if (analysis.researchGaps.length > 0) {
      recommendations.push('Focus future research on identified gaps for deeper understanding');
    }
    
    recommendations.push('Cross-reference findings with primary sources when possible');
    recommendations.push('Consider reaching out to subject matter experts for additional insights');
    
    return recommendations;
  }
}

// Type definitions for the research workflow

export interface GoogleResearchData {
  generalResults: SearchResult[];
  academicSources: SearchResult[];
  recentNews: SearchResult[];
  totalSources: number;
}

export interface WikipediaResearchData {
  summary: string | null;
  references: string[];
  relatedTopics: string[];
  hasDetailedArticle: boolean;
}

export interface ChatGPTAnalysis {
  mainAnalysis: string;
  keyInsights: string[];
  researchGaps: string[];
  confidence: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchReport {
  topic: string;
  timestamp: Date;
  summary: {
    totalSources: number;
    confidence: number;
    hasWikipediaArticle: boolean;
    academicSourcesFound: number;
  };
  findings: {
    googleResearch: GoogleResearchData;
    wikipediaResearch: WikipediaResearchData;
    aiAnalysis: ChatGPTAnalysis;
  };
  keyInsights: string[];
  researchGaps: string[];
  recommendations: string[];
  metadata: {
    workflowVersion: string;
    executionTime: number;
    automationTools: string[];
  };
}

export class ResearchWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchWorkflowError';
  }
}

// Example usage
export async function demonstrateResearchWorkflow(): Promise<void> {
  const workflow = new ResearchAutomationWorkflow('ws://localhost:3001');
  
  try {
    // Research a technology topic
    const report = await workflow.performResearch('Quantum Computing Applications');
    
    console.log('Research Report Generated:');
    console.log(`Topic: ${report.topic}`);
    console.log(`Confidence: ${report.summary.confidence}%`);
    console.log(`Sources: ${report.summary.totalSources}`);
    console.log('\nKey Insights:');
    report.keyInsights.forEach((insight, index) => {
      console.log(`  ${index + 1}. ${insight}`);
    });
    
    console.log('\nResearch Gaps:');
    report.researchGaps.forEach((gap, index) => {
      console.log(`  ${index + 1}. ${gap}`);
    });
    
  } catch (error) {
    console.error('Research workflow demonstration failed:', error);
  }
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateResearchWorkflow();
}