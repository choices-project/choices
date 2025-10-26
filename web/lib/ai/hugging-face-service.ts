// web/lib/ai/hugging-face-service.ts
import { pipeline } from '@huggingface/transformers';

export class HuggingFaceService {
  private sentimentAnalyzer: any;
  private emotionAnalyzer: any;
  private toxicityDetector: any;
  private politicalAnalyzer: any;
  private biasDetector: any;
  private hfToken: string;
  
  constructor() {
    this.hfToken = process.env.HUGGING_FACE_TOKEN || '';
    this.initializeModels();
  }
  
  private async initializeModels() {
    try {
      // Initialize sentiment analysis with token for enhanced access
      this.sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'cardiffnlp/twitter-roberta-base-sentiment-latest',
        { token: this.hfToken }
      );
      
      // Initialize emotion analysis
      this.emotionAnalyzer = await pipeline(
        'text-classification',
        'j-hartmann/emotion-english-distilroberta-base',
        { token: this.hfToken }
      );
      
      // Initialize toxicity detection
      this.toxicityDetector = await pipeline(
        'text-classification',
        'unitary/toxic-bert',
        { token: this.hfToken }
      );
      
      // Initialize political sentiment analysis
      this.politicalAnalyzer = await pipeline(
        'text-classification',
        'microsoft/DialoGPT-medium',
        { token: this.hfToken }
      );
      
      // Initialize bias detection
      this.biasDetector = await pipeline(
        'text-classification',
        'unitary/toxic-bert',
        { token: this.hfToken }
      );
      
      console.log('✅ Hugging Face models initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Hugging Face models:', error);
      throw error;
    }
  }
  
  async analyzePollContent(text: string) {
    try {
      const [sentiment, emotions, toxicity, political, bias] = await Promise.all([
        this.sentimentAnalyzer(text),
        this.emotionAnalyzer(text),
        this.toxicityDetector(text),
        this.politicalAnalyzer(text),
        this.biasDetector(text)
      ]);
      
      return {
        sentiment: sentiment[0],
        emotions: emotions[0],
        toxicity: toxicity[0],
        political_sentiment: political[0],
        bias_indicators: bias[0],
        analysis_method: 'hugging_face_local',
        privacy: 'maximum',
        token_used: !!this.hfToken
      };
    } catch (error) {
      console.error('Error in Hugging Face analysis:', error);
      throw error;
    }
  }
  
  async analyzeVotingPatterns(votes: any[]) {
    try {
      // Analyze voting text patterns for sentiment
      const voteTexts = votes.map(vote => vote.vote_text || 'vote').join(' ');
      
      if (voteTexts.trim()) {
        const analysis = await this.analyzePollContent(voteTexts);
        return {
          ...analysis,
          vote_count: votes.length,
          analysis_type: 'voting_patterns'
        };
      }
      
      return {
        vote_count: votes.length,
        analysis_type: 'voting_patterns',
        message: 'No text content to analyze'
      };
    } catch (error) {
      console.error('Error analyzing voting patterns:', error);
      throw error;
    }
  }
  
  async detectManipulationSignals(pollData: any) {
    try {
      const pollText = pollData.question;
      const optionTexts = pollData.poll_options?.map((opt: any) => opt.text).join(' ') || '';
      const combinedText = `${pollText} ${optionTexts}`;
      
      const analysis = await this.analyzePollContent(combinedText);
      
      // Enhanced manipulation detection
      const manipulationScore = this.calculateManipulationScore(analysis);
      
      return {
        ...analysis,
        manipulation_score: manipulationScore,
        threat_level: this.determineThreatLevel(manipulationScore),
        analysis_type: 'manipulation_detection'
      };
    } catch (error) {
      console.error('Error detecting manipulation signals:', error);
      throw error;
    }
  }
  
  private calculateManipulationScore(analysis: any) {
    let score = 0;
    
    // Toxicity contributes to manipulation
    if (analysis.toxicity?.label === 'TOXIC') {
      score += 0.3;
    }
    
    // High emotion intensity
    if (analysis.emotions?.score > 0.8) {
      score += 0.2;
    }
    
    // Extreme sentiment
    if (Math.abs(analysis.sentiment?.score) > 0.8) {
      score += 0.2;
    }
    
    // Bias indicators
    if (analysis.bias_indicators?.label === 'TOXIC') {
      score += 0.3;
    }
    
    return Math.min(1, score);
  }
  
  private determineThreatLevel(score: number) {
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }
}
