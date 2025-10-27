/**
 * Hugging Face AI Service
 * 
 * Service for interacting with Hugging Face AI models
 */

export interface HuggingFaceConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface HuggingFaceResponse {
  success: boolean
  data?: any
  error?: string
}

export class HuggingFaceService {
  private config: HuggingFaceConfig

  constructor(config: HuggingFaceConfig) {
    this.config = {
      baseUrl: 'https://api-inference.huggingface.co',
      timeout: 30000,
      ...config
    }
  }

  async analyzeText(text: string, model: string = 'sentiment-analysis'): Promise<HuggingFaceResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateText(prompt: string, model: string = 'gpt2'): Promise<HuggingFaceResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.7
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async analyzePollContent(pollData: any): Promise<HuggingFaceResponse> {
    try {
      const text = `${pollData.question} ${pollData.description || ''}`.trim()
      return await this.analyzeText(text, 'sentiment-analysis')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async analyzeVotingPatterns(votes: any[]): Promise<HuggingFaceResponse> {
    try {
      const patterns = votes.map(vote => vote.option_id).join(' ')
      return await this.analyzeText(patterns, 'text-classification')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async detectManipulationSignals(data: any): Promise<HuggingFaceResponse> {
    try {
      const signals = JSON.stringify(data)
      return await this.analyzeText(signals, 'text-classification')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const createHuggingFaceService = (config: HuggingFaceConfig) => {
  return new HuggingFaceService(config)
}
