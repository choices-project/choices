// Real-time News Service for Trending Awareness
// Focuses on gathering reputable data and presenting it as breaking news stories

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { devLog } from '@/lib/utils/logger';
// ============================================================================
// CORE INTERFACES
// ============================================================================

export type BreakingNewsStory = {
  id: string;
  headline: string;
  summary: string;
  fullStory: string;
  sourceUrl: string;
  sourceName: string;
  sourceReliability: number; // 0-1 scale
  category: string[];
  urgency: 'low' | 'medium' | 'high' | 'breaking';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  entities: NewsEntity[];
  metadata: {
    keywords: string[];
    controversy: number; // 0-1 scale
    timeSensitivity: 'low' | 'medium' | 'high';
    geographicScope: 'local' | 'national' | 'international' | 'global';
    politicalImpact: number; // 0-1 scale
    publicInterest: number; // 0-1 scale
    complexity?: 'low' | 'medium' | 'high';
  };
  createdAt: Date;
  updatedAt: Date;
}

export type NewsEntity = {
  name: string;
  type: 'person' | 'organization' | 'location' | 'event' | 'policy' | 'concept';
  confidence: number;
  role?: string;
  stance?: 'support' | 'oppose' | 'neutral' | 'unknown';
  metadata?: Record<string, string | number | boolean>;
}

export type NewsSource = {
  id: string;
  name: string;
  domain: string;
  reliability: number; // 0-1 scale
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  type: 'mainstream' | 'wire' | 'digital' | 'international';
  apiEndpoint?: string | null;
  apiKey?: string | null;
  rateLimit: number;
  isActive: boolean;
  lastUpdated: Date;
  errorCount: number;
  successRate: number;
}

export type PollContext = {
  storyId: string;
  question: string;
  context: string;
  whyImportant: string;
  stakeholders: NewsEntity[];
  options: PollOption[];
  votingMethod: 'single' | 'multiple' | 'ranked' | 'approval' | 'range';
  estimatedControversy: number;
  timeToLive: number; // hours
}

export type PollOption = {
  id: string;
  text: string;
  description?: string;
  stance?: 'support' | 'oppose' | 'neutral' | 'nuanced';
  metadata?: Record<string, string | number | boolean>;
}

// ============================================================================
// REPUTABLE NEWS SOURCES CONFIGURATION
// ============================================================================

export const REPUTABLE_SOURCES: NewsSource[] = [
  // Mainstream News
  {
    id: 'reuters',
    name: 'Reuters',
    domain: 'reuters.com',
    reliability: 0.95,
    bias: 'center',
    type: 'mainstream',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  },
  {
    id: 'ap',
    name: 'Associated Press',
    domain: 'ap.org',
    reliability: 0.94,
    bias: 'center',
    type: 'wire',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  },
  {
    id: 'bbc',
    name: 'BBC News',
    domain: 'bbc.com',
    reliability: 0.92,
    bias: 'center-left',
    type: 'mainstream',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  },
  {
    id: 'cnn',
    name: 'CNN',
    domain: 'cnn.com',
    reliability: 0.88,
    bias: 'center-left',
    type: 'mainstream',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  },
  {
    id: 'fox',
    name: 'Fox News',
    domain: 'foxnews.com',
    reliability: 0.85,
    bias: 'center-right',
    type: 'mainstream',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  },
  {
    id: 'npr',
    name: 'NPR',
    domain: 'npr.org',
    reliability: 0.90,
    bias: 'center-left',
    type: 'mainstream',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  },
  {
    id: 'politico',
    name: 'Politico',
    domain: 'politico.com',
    reliability: 0.87,
    bias: 'center',
    type: 'digital',
    apiEndpoint: 'https://newsapi.org/v2/everything',
    rateLimit: 1000,
    isActive: true,
    lastUpdated: new Date(),
    errorCount: 0,
    successRate: 100
  }
];

// ============================================================================
// GAVIN NEWSOM VS TRUMP TEST CASE DATA
// ============================================================================

export const NEWSOM_TRUMP_TEST_DATA: BreakingNewsStory[] = [
  {
    id: 'newsom-trump-1',
    headline: "Gavin Newsom Challenges Trump to Presidential Debate",
    summary: "California Governor Gavin Newsom has publicly challenged former President Donald Trump to a one-on-one presidential debate, escalating their ongoing political feud ahead of the 2024 election cycle.",
    fullStory: `California Governor Gavin Newsom has issued a direct challenge to former President Donald Trump for a presidential debate, marking a significant escalation in their ongoing political rivalry. The challenge comes as both political figures position themselves for potential 2024 presidential campaigns.

Newsom, a prominent Democratic governor, has been increasingly vocal about his opposition to Trump's policies and rhetoric. The debate challenge was made during a recent interview where Newsom criticized Trump's handling of various national issues.

"This is about the future of our democracy," Newsom stated. "The American people deserve to see a real debate about the issues that matter most to them."

Trump's campaign team has yet to formally respond to the challenge, but sources close to the former president indicate he is considering the proposal. Political analysts suggest this could be a defining moment in the early stages of the 2024 election cycle.

The potential debate would focus on key issues including:
- Economic policy and job creation
- Healthcare and social programs
- Immigration and border security
- Climate change and environmental policy
- Foreign relations and national security

Both figures have significant followings and this debate could draw unprecedented viewership, potentially reshaping the political landscape for the upcoming election.`,
    sourceUrl: "https://example.com/news/politics/newsom-trump-debate-challenge",
    sourceName: "Political Analysis",
    sourceReliability: 0.92,
    category: ["politics", "election", "presidential", "debate"],
    urgency: "high",
    sentiment: "mixed",
    entities: [
      {
        name: "Gavin Newsom",
        type: "person",
        confidence: 0.98,
        role: "California Governor",
        stance: "oppose",
        metadata: { party: "Democratic", position: "Governor" }
      },
      {
        name: "Donald Trump",
        type: "person",
        confidence: 0.98,
        role: "Former President",
        stance: "oppose",
        metadata: { party: "Republican", position: "Former President" }
      },
      {
        name: "2024 Election",
        type: "event",
        confidence: 0.95,
        metadata: { type: "Presidential Election" }
      },
      {
        name: "California",
        type: "location",
        confidence: 0.90,
        metadata: { type: "State" }
      }
    ],
    metadata: {
      keywords: ["newsom", "trump", "debate", "election", "presidential", "california", "governor"],
      controversy: 0.85,
      timeSensitivity: "high",
      geographicScope: "national",
      politicalImpact: 0.90,
      publicInterest: 0.88
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "newsom-trump-2",
    headline: "Newsom's California Policies Face Trump's 'America First' Criticism",
    summary: "Former President Trump has intensified his criticism of Governor Newsom's California policies, calling them 'failed experiments' while Newsom defends his progressive governance approach.",
    fullStory: `Former President Donald Trump has launched a new round of criticism against California Governor Gavin Newsom's policies, calling the state's progressive governance approach "failed experiments" that shouldn't be replicated nationally.

In a series of social media posts and public statements, Trump has specifically targeted California's policies on:
- Climate change and environmental regulations
- Healthcare and social welfare programs
- Immigration and sanctuary city policies
- Business regulations and tax policies
- Education and school choice

"California is a perfect example of what happens when you let radical left policies take over," Trump stated during a recent rally. "We can't let this happen to the rest of America."

Newsom has responded by defending his record, pointing to California's economic growth, job creation, and leadership in renewable energy. "California continues to lead the nation in innovation, economic growth, and progressive solutions to our biggest challenges," Newsom said in a statement.

The policy debate highlights fundamental differences between the two political approaches:
- Progressive governance vs. conservative principles
- Federal vs. state authority
- Environmental regulation vs. business deregulation
- Social welfare expansion vs. fiscal conservatism

Political analysts note that this exchange represents a preview of potential 2024 campaign themes, with both figures positioning themselves as representatives of their respective political philosophies.`,
    sourceUrl: "https://example.com/news/politics/california-policies-debate",
    sourceName: "Policy Analysis",
    sourceReliability: 0.89,
    category: ["politics", "policy", "governance", "california"],
    urgency: "medium",
    sentiment: "negative",
    entities: [
      {
        name: "Gavin Newsom",
        type: "person",
        confidence: 0.95,
        role: "California Governor",
        stance: "support",
        metadata: { party: "Democratic" }
      },
      {
        name: "Donald Trump",
        type: "person",
        confidence: 0.95,
        role: "Former President",
        stance: "oppose",
        metadata: { party: "Republican" }
      },
      {
        name: "California",
        type: "location",
        confidence: 0.92,
        metadata: { type: "State" }
      },
      {
        name: "Progressive Policies",
        type: "concept",
        confidence: 0.85,
        stance: "support",
        metadata: { category: "Political Philosophy" }
      }
    ],
    metadata: {
      keywords: ["california", "policies", "progressive", "conservative", "governance", "trump", "newsom"],
      controversy: 0.75,
      timeSensitivity: "medium",
      geographicScope: "national",
      politicalImpact: 0.80,
      publicInterest: 0.75
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "newsom-trump-3",
    headline: "Social Media Explodes Over Newsom-Trump Political Exchanges",
    summary: "Viral clips and heated exchanges between Gavin Newsom and Donald Trump have dominated social media platforms, generating millions of views and sparking intense online debates.",
    fullStory: `Social media platforms have been flooded with viral content featuring political exchanges between California Governor Gavin Newsom and former President Donald Trump, creating unprecedented online engagement and debate.

The viral clips, which have collectively garnered over 50 million views across platforms including Twitter, TikTok, and YouTube, feature:
- Newsom's debate challenge to Trump
- Trump's criticism of California policies
- Heated exchanges during media interviews
- Supporters and opponents of both figures engaging in online debates

The social media frenzy has highlighted the intense polarization in American politics, with users taking strong positions on both sides of the political spectrum. Hashtags like #NewsomVsTrump, #DebateChallenge, and #CaliforniaPolicies have trended nationally.

Key viral moments include:
- Newsom's direct challenge to Trump during a CNN interview
- Trump's response calling Newsom's policies "disastrous"
- Compilation videos comparing their policy approaches
- User-generated content analyzing their political records

Social media analysts note that this level of engagement is unusual for political content and suggests high public interest in a potential 2024 matchup between the two figures.

The online discourse has also revealed:
- Geographic patterns in support (coastal vs. heartland)
- Age demographics of engagement (younger users more active)
- International interest in American political dynamics
- Impact on voter registration and political participation

Experts suggest this social media activity could influence traditional media coverage and potentially shape public opinion ahead of the 2024 election cycle.`,
    sourceUrl: "https://example.com/social/viral-political-content",
    sourceName: "Social Media Analysis",
    sourceReliability: 0.82,
    category: ["social_media", "viral", "politics", "election"],
    urgency: "high",
    sentiment: "mixed",
    entities: [
      {
        name: "Social Media",
        type: "concept",
        confidence: 0.90,
        metadata: { platforms: "Twitter,TikTok,YouTube" }
      },
      {
        name: "Viral Content",
        type: "concept",
        confidence: 0.85,
        metadata: { views: "50M+" }
      },
      {
        name: "Gavin Newsom",
        type: "person",
        confidence: 0.88,
        role: "California Governor"
      },
      {
        name: "Donald Trump",
        type: "person",
        confidence: 0.88,
        role: "Former President"
      }
    ],
    metadata: {
      keywords: ["viral", "social media", "politics", "debate", "trending", "engagement"],
      controversy: 0.80,
      timeSensitivity: "high",
      geographicScope: "national",
      politicalImpact: 0.75,
      publicInterest: 0.90
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ============================================================================
// REAL-TIME NEWS SERVICE
// ============================================================================

export class RealTimeNewsService {
  constructor() {
    // No initialization needed - we'll get the client in each method
  }

  // ============================================================================
  // BREAKING NEWS METHODS
  // ============================================================================

  async getBreakingNews(limit: number = 10): Promise<BreakingNewsStory[]> {
    try {
      const supabaseClient = await getSupabaseServerClient();
      const { data, error } = await (supabaseClient as any)
        .from('breaking_news')
        .select('id, title, content, source, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data as any[])?.map((d: any) => this.mapBreakingNewsFromDB(d)) || [];
    } catch (error) {
      devLog('Error fetching breaking news:', error);
      return [];
    }
  }

  async getBreakingNewsById(id: string): Promise<BreakingNewsStory | null> {
    try {
      const supabaseClient = await getSupabaseServerClient();
      const { data, error } = await (supabaseClient as any)
        .from('breaking_news')
        .select('id, title, content, source, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data ? this.mapBreakingNewsFromDB(data) : null;
    } catch (error) {
      devLog('Error fetching breaking news:', error);
      return null;
    }
  }

  async createBreakingNews(story: Omit<BreakingNewsStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BreakingNewsStory | null> {
    try {
      const supabaseClient = await getSupabaseServerClient();
      const { data, error } = await (supabaseClient as any)
        .from('breaking_news')
        .insert([this.mapBreakingNewsToDB(story as any)])
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapBreakingNewsFromDB(data) : null;
    } catch (error) {
      devLog('Error creating breaking news:', error);
      return null;
    }
  }

  // ============================================================================
  // NEWS SOURCE MANAGEMENT
  // ============================================================================

  async getNewsSources(): Promise<NewsSource[]> {
    try {
      const supabaseClient = await getSupabaseServerClient();
      const { data, error } = await (supabaseClient as any)
        .from('news_sources')
        .select('id, title, content, source, created_at')
        .eq('is_active', true)
        .order('reliability', { ascending: false });

      if (error) throw error;

      return (data as any[])?.map((d: any) => this.mapNewsSourceFromDB(d)) || [];
    } catch (error) {
      devLog('Error fetching news sources:', error);
      return [];
    }
  }

  async updateNewsSource(id: string, updates: Partial<NewsSource>): Promise<NewsSource | null> {
    try {
      const supabaseClient = await getSupabaseServerClient();
      const { data, error } = await (supabaseClient as any)
        .from('news_sources')
        .update(this.mapNewsSourceToDB(updates as any))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapNewsSourceFromDB(data) : null;
    } catch (error) {
      devLog('Error updating news source:', error);
      return null;
    }
  }

  // ============================================================================
  // POLL CONTEXT GENERATION
  // ============================================================================

  async generatePollContext(storyId: string): Promise<PollContext | null> {
    try {
      const story = await this.getBreakingNewsById(storyId);
      if (!story) return null;

      const context = this.analyzeStoryForPollContext(story);
      return context;
    } catch (error) {
      devLog('Error generating poll context:', error);
      return null;
    }
  }

  private analyzeStoryForPollContext(story: BreakingNewsStory): PollContext {
    const { entities, metadata } = story;
    
    // Generate poll question based on story content
    const question = this.generatePollQuestion(story.headline, story.summary);
    
    // Create context explaining why this matters
    const context = this.generateContext(story);
    
    // Identify why this is important
    const whyImportant = this.generateWhyImportant(story);
    
    // Generate poll options based on entities and story content
    const options = this.generatePollOptions(story);
    
    // Determine voting method based on complexity
    const votingMethod = this.determineVotingMethod(story);
    
    return {
      storyId: story.id,
      question,
      context,
      whyImportant,
      stakeholders: entities.filter(e => e.type === 'person' || e.type === 'organization'),
      options,
      votingMethod,
      estimatedControversy: metadata.controversy,
      timeToLive: this.calculateTimeToLive(story.urgency)
    };
  }

  private generatePollQuestion(headline: string, summary: string): string {
    // Extract key themes and create a question
    const themes = this.extractThemes(headline, summary);
    
    if (themes.includes('debate') || themes.includes('challenge')) {
      return "Should Gavin Newsom and Donald Trump participate in a presidential debate?";
    } else if (themes.includes('policy') || themes.includes('governance')) {
      return "Which approach to governance do you prefer: Newsom's progressive policies or Trump's conservative principles?";
    } else if (themes.includes('social media') || themes.includes('viral')) {
      return "How important is social media engagement in shaping political discourse?";
    }
    
    return "What's your opinion on this developing political situation?";
  }

  private generateContext(story: BreakingNewsStory): string {
    const { metadata } = story;
    
    return `This breaking news story involves ${metadata.geographicScope} implications and has generated significant public interest. The situation is ${metadata.timeSensitivity} priority and could have lasting political impact.`;
  }

  private generateWhyImportant(story: BreakingNewsStory): string {
    const { metadata } = story;
    
    return `This story matters because it involves ${metadata.politicalImpact > 0.8 ? 'high-stakes political decisions' : 'important policy discussions'} that could affect millions of Americans. The ${metadata.controversy > 0.7 ? 'controversial nature' : 'public interest'} of this issue makes it crucial to understand public opinion.`;
  }

  private generatePollOptions(story: BreakingNewsStory): PollOption[] {
    const { entities, metadata } = story;
    
    const options: PollOption[] = [];
    
    // Add support/oppose options
    options.push({
      id: 'support',
      text: 'Strongly support',
      description: 'Fully agree with the position presented',
      stance: 'support'
    });
    
    options.push({
      id: 'oppose',
      text: 'Strongly oppose',
      description: 'Completely disagree with the position presented',
      stance: 'oppose'
    });
    
    // Add nuanced options for complex topics
    if (metadata.controversy > 0.6) {
      options.push({
        id: 'nuanced',
        text: 'Support with reservations',
        description: 'Generally agree but have some concerns',
        stance: 'nuanced'
      });
      
      options.push({
        id: 'neutral',
        text: 'Neutral/Undecided',
        description: 'Need more information to form an opinion',
        stance: 'neutral'
      });
    }
    
    // Add entity-specific options if we have significant entities
    if (entities && entities.length > 0) {
      const topEntities = entities.slice(0, 2); // Use top 2 entities
      topEntities.forEach((entity, index) => {
        options.push({
          id: `entity_${index}`,
          text: `Focus on ${entity.name || entity.type}`,
          description: `Prioritize ${entity.name || entity.type} in this discussion`,
          stance: 'neutral'
        });
      });
    }
    
    return options;
  }

  private determineVotingMethod(story: BreakingNewsStory): PollContext['votingMethod'] {
    const { metadata, entities } = story;
    
    if (metadata.controversy > 0.8) return 'ranked';
    if (entities.length > 4) return 'approval';
    if (metadata.complexity && metadata.complexity === 'high') return 'range';
    return 'single';
  }

  private calculateTimeToLive(urgency: BreakingNewsStory['urgency']): number {
    switch (urgency) {
      case 'breaking': return 2; // 2 hours
      case 'high': return 6; // 6 hours
      case 'medium': return 24; // 24 hours
      case 'low': return 72; // 72 hours
      default: return 24;
    }
  }

  private extractThemes(headline: string, summary: string): string[] {
    const text = `${headline} ${summary}`.toLowerCase();
    const themes: string[] = [];
    
    if (text.includes('debate') || text.includes('challenge')) themes.push('debate');
    if (text.includes('policy') || text.includes('governance')) themes.push('policy');
    if (text.includes('social media') || text.includes('viral')) themes.push('social media');
    if (text.includes('election') || text.includes('presidential')) themes.push('election');
    
    return themes;
  }

  // ============================================================================
  // DATA MAPPING METHODS
  // ============================================================================

  private mapBreakingNewsFromDB(data: Record<string, unknown>): BreakingNewsStory {
    return {
      id: data.id as string,
      headline: data.headline as string,
      summary: data.summary as string,
      fullStory: data.full_story as string,
      sourceUrl: data.source_url as string,
      sourceName: data.source_name as string,
      sourceReliability: data.source_reliability as number,
      category: (data.category as string[]) || [],
      urgency: data.urgency as BreakingNewsStory['urgency'],
      sentiment: data.sentiment as BreakingNewsStory['sentiment'],
      entities: (data.entities as NewsEntity[]) || [],
      metadata: (data.metadata as BreakingNewsStory['metadata']) || {
        keywords: [],
        controversy: 0,
        timeSensitivity: 'low' as const,
        geographicScope: 'local' as const,
        politicalImpact: 0,
        publicInterest: 0
      },
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string)
    };
  }

  private mapBreakingNewsToDB(story: Partial<BreakingNewsStory>): Record<string, unknown> {
    return {
      headline: story.headline,
      summary: story.summary,
      full_story: story.fullStory,
      source_url: story.sourceUrl,
      source_name: story.sourceName,
      source_reliability: story.sourceReliability,
      category: story.category,
      urgency: story.urgency,
      sentiment: story.sentiment,
      entities: story.entities,
      metadata: story.metadata
    };
  }

  private mapNewsSourceFromDB(data: Record<string, unknown>): NewsSource {
    return {
      id: data.id as string,
      name: data.name as string,
      domain: data.domain as string,
      reliability: data.reliability as number,
      bias: data.bias as NewsSource['bias'],
      type: data.type as NewsSource['type'],
      apiEndpoint: data.api_endpoint as string | null,
      apiKey: data.api_key as string | null,
      rateLimit: data.rate_limit as number,
      isActive: data.is_active as boolean,
      lastUpdated: new Date(data.last_updated as string),
      errorCount: data.error_count as number,
      successRate: data.success_rate as number
    };
  }

  private mapNewsSourceToDB(source: Partial<NewsSource>): Record<string, unknown> {
    return {
      name: source.name,
      domain: source.domain,
      reliability: source.reliability,
      bias: source.bias,
      type: source.type,
      api_endpoint: source.apiEndpoint,
      api_key: source.apiKey,
      rate_limit: source.rateLimit,
      is_active: source.isActive,
      last_updated: source.lastUpdated?.toISOString(),
      error_count: source.errorCount,
      success_rate: source.successRate
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateNewsReliability(source: NewsSource, content: { hasQuotes?: boolean; hasMultipleSources?: boolean; hasFactChecking?: boolean }): number {
  // Base reliability on source reputation
  let reliability = source.reliability;
  
  // Adjust based on content quality indicators
  if (content.hasQuotes) reliability += 0.05;
  if (content.hasMultipleSources) reliability += 0.05;
  if (content.hasFactChecking) reliability += 0.05;
  
  return Math.min(reliability, 1.0);
}

export function determineUrgency(story: BreakingNewsStory): BreakingNewsStory['urgency'] {
  const { metadata, sentiment } = story;
  
  // Base urgency on political impact and public interest
  let urgency: BreakingNewsStory['urgency'] = 'low';
  
  if (metadata.politicalImpact > 0.9 && metadata.publicInterest > 0.9) urgency = 'breaking';
  else if (metadata.politicalImpact > 0.7 || metadata.publicInterest > 0.8) urgency = 'high';
  else if (metadata.politicalImpact > 0.5 || metadata.publicInterest > 0.6) urgency = 'medium';
  
  // Adjust urgency based on sentiment
  if (sentiment === 'negative' && urgency !== 'breaking') {
    // Negative sentiment can increase urgency
    if (urgency === 'low') urgency = 'medium';
    else if (urgency === 'medium') urgency = 'high';
  }
  
  return urgency;
}

export function analyzeSentiment(text: string): BreakingNewsStory['sentiment'] {
  // Simplified sentiment analysis
  const positiveWords = ['success', 'achievement', 'progress', 'positive', 'good'];
  const negativeWords = ['failure', 'crisis', 'problem', 'negative', 'bad'];
  
  const words = text.toLowerCase().split(' ');
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
