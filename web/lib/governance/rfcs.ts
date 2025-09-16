/**
 * RFC (Request for Comments) Management System
 * 
 * Implements public RFC system for governance and transparency in the ranked choice
 * democracy platform, enabling community-driven decision making.
 */

import { logger } from '@/lib/logger';

export interface RFCData {
  title: string;
  summary: string;
  motivation: string;
  detailedDesign: string;
  alternatives: string;
  securityConsiderations: string;
  privacyConsiderations: string;
  authors: string[];
  status?: 'Draft' | 'Review' | 'Accepted' | 'Rejected';
  created?: string;
  updated?: string;
}

export interface RFC extends RFCData {
  id: string;
  status: 'Draft' | 'Review' | 'Accepted' | 'Rejected';
  created: string;
  updated: string;
  comments: RFCComment[];
  votes: RFCVote[];
  tags: string[];
  category: string;
}

export interface PublicRFC {
  id: string;
  title: string;
  status: 'Review' | 'Accepted' | 'Rejected';
  authors: string[];
  created: string;
  updated: string;
  summary: string;
  motivation: string;
  detailedDesign: string;
  alternatives: string;
  securityConsiderations: string;
  privacyConsiderations: string;
  commentCount: number;
  voteCount: number;
  tags: string[];
  category: string;
}

export interface RFCComment {
  id: string;
  rfcId: string;
  author: string;
  content: string;
  timestamp: number;
  parentId?: string;
  replies: RFCComment[];
}

export interface RFCVote {
  id: string;
  rfcId: string;
  voter: string;
  vote: 'support' | 'oppose' | 'abstain';
  reasoning?: string;
  timestamp: number;
}

export interface RFCNotification {
  id: string;
  rfcId: string;
  type: 'created' | 'updated' | 'status_changed' | 'comment_added' | 'vote_cast';
  message: string;
  timestamp: number;
  recipients: string[];
}

export class RFCManager {
  public static readonly RFC_TEMPLATE: RFCData = {
    title: "RFC-XXXX: [Title]",
    summary: "Brief description of the proposal",
    motivation: "Why this change is needed",
    detailedDesign: "Technical implementation details",
    alternatives: "Other approaches considered",
    securityConsiderations: "Security implications",
    privacyConsiderations: "Privacy implications",
    authors: ["Author Name"],
    status: "Draft"
  };

  private rfcStorage: Map<string, RFC> = new Map();
  private commentStorage: Map<string, RFCComment[]> = new Map();
  private voteStorage: Map<string, RFCVote[]> = new Map();
  private notificationStorage: Map<string, RFCNotification[]> = new Map();

  /**
   * Create a new RFC
   */
  static async createRFC(rfcData: RFCData): Promise<string> {
    const manager = new RFCManager();
    return await manager.createRFCInstance(rfcData);
  }

  /**
   * Create RFC instance
   */
  async createRFCInstance(rfcData: RFCData): Promise<string> {
    const rfcId = this.generateRFCId();
    const rfc: RFC = {
      ...RFCManager.RFC_TEMPLATE,
      ...rfcData,
      id: rfcId,
      status: 'Draft',
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      comments: [],
      votes: [],
      tags: this.extractTags(rfcData),
      category: this.categorizeRFC(rfcData)
    };
    
    await this.saveRFC(rfc);
    await this.notifyStakeholders(rfc);
    
    logger.info(`Created RFC ${rfcId}`, { title: rfc.title, authors: rfc.authors });
    
    return rfcId;
  }

  /**
   * Publish RFC for public review
   */
  static async publishRFC(rfcId: string): Promise<void> {
    const manager = new RFCManager();
    return await manager.publishRFCInstance(rfcId);
  }

  /**
   * Publish RFC instance
   */
  async publishRFCInstance(rfcId: string): Promise<void> {
    const rfc = await this.getRFC(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    if (rfc.status !== 'Draft') {
      throw new Error('Only draft RFCs can be published');
    }
    
    rfc.status = 'Review';
    rfc.updated = new Date().toISOString().split('T')[0];
    
    await this.saveRFC(rfc);
    await this.publishToPublicRepo(rfc);
    await this.notifyCommunity(rfc);
    
    logger.info(`Published RFC ${rfcId} for review`, { title: rfc.title });
  }

  /**
   * Get public RFCs
   */
  static async getPublicRFCs(): Promise<PublicRFC[]> {
    const manager = new RFCManager();
    return await manager.getPublicRFCsInstance();
  }

  /**
   * Get public RFCs instance
   */
  async getPublicRFCsInstance(): Promise<PublicRFC[]> {
    const rfcs = await this.getAllRFCs();
    return rfcs
      .filter(rfc => rfc.status !== 'Draft')
      .map(rfc => this.sanitizeForPublic(rfc));
  }

  /**
   * Add comment to RFC
   */
  static async addComment(rfcId: string, author: string, content: string, parentId?: string): Promise<string> {
    const manager = new RFCManager();
    return await manager.addCommentInstance(rfcId, author, content, parentId);
  }

  /**
   * Add comment instance
   */
  async addCommentInstance(rfcId: string, author: string, content: string, parentId?: string): Promise<string> {
    const rfc = await this.getRFC(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    const commentId = this.generateCommentId();
    const comment: RFCComment = {
      id: commentId,
      rfcId,
      author,
      content,
      timestamp: Date.now(),
      parentId,
      replies: []
    };
    
    const comments = this.commentStorage.get(rfcId) || [];
    comments.push(comment);
    this.commentStorage.set(rfcId, comments);
    
    // Update RFC comment count
    rfc.comments = comments;
    rfc.updated = new Date().toISOString().split('T')[0];
    await this.saveRFC(rfc);
    
    await this.notifyCommentAdded(rfc, comment);
    
    logger.info(`Added comment to RFC ${rfcId}`, { commentId, author });
    
    return commentId;
  }

  /**
   * Cast vote on RFC
   */
  static async castVote(rfcId: string, voter: string, vote: 'support' | 'oppose' | 'abstain', reasoning?: string): Promise<string> {
    const manager = new RFCManager();
    return await manager.castVoteInstance(rfcId, voter, vote, reasoning);
  }

  /**
   * Cast vote instance
   */
  async castVoteInstance(rfcId: string, voter: string, vote: 'support' | 'oppose' | 'abstain', reasoning?: string): Promise<string> {
    const rfc = await this.getRFC(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    if (rfc.status !== 'Review') {
      throw new Error('Votes can only be cast on RFCs in review');
    }
    
    const voteId = this.generateVoteId();
    const rfcVote: RFCVote = {
      id: voteId,
      rfcId,
      voter,
      vote,
      reasoning,
      timestamp: Date.now()
    };
    
    const votes = this.voteStorage.get(rfcId) || [];
    
    // Remove existing vote from same voter
    const existingVoteIndex = votes.findIndex(v => v.voter === voter);
    if (existingVoteIndex >= 0) {
      votes.splice(existingVoteIndex, 1);
    }
    
    votes.push(rfcVote);
    this.voteStorage.set(rfcId, votes);
    
    // Update RFC vote count
    rfc.votes = votes;
    rfc.updated = new Date().toISOString().split('T')[0];
    await this.saveRFC(rfc);
    
    await this.notifyVoteCast(rfc, rfcVote);
    
    logger.info(`Vote cast on RFC ${rfcId}`, { voteId, voter, vote });
    
    return voteId;
  }

  /**
   * Update RFC status
   */
  static async updateRFCStatus(rfcId: string, status: 'Accepted' | 'Rejected', reason?: string): Promise<void> {
    const manager = new RFCManager();
    return await manager.updateRFCStatusInstance(rfcId, status, reason);
  }

  /**
   * Update RFC status instance
   */
  async updateRFCStatusInstance(rfcId: string, status: 'Accepted' | 'Rejected', reason?: string): Promise<void> {
    const rfc = await this.getRFC(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    if (rfc.status !== 'Review') {
      throw new Error('Only RFCs in review can have their status updated');
    }
    
    const oldStatus = rfc.status;
    rfc.status = status;
    rfc.updated = new Date().toISOString().split('T')[0];
    
    await this.saveRFC(rfc);
    await this.notifyStatusChange(rfc, oldStatus, reason);
    
    logger.info(`Updated RFC ${rfcId} status`, { oldStatus, newStatus: status, reason });
  }

  /**
   * Get RFC by ID
   */
  async getRFC(rfcId: string): Promise<RFC | null> {
    return this.rfcStorage.get(rfcId) || null;
  }

  /**
   * Get all RFCs
   */
  async getAllRFCs(): Promise<RFC[]> {
    return Array.from(this.rfcStorage.values());
  }

  /**
   * Save RFC
   */
  private async saveRFC(rfc: RFC): Promise<void> {
    this.rfcStorage.set(rfc.id, rfc);
    // In production, this would save to database
  }

  /**
   * Sanitize RFC for public consumption
   */
  private sanitizeForPublic(rfc: RFC): PublicRFC {
    const comments = this.commentStorage.get(rfc.id) || [];
    const votes = this.voteStorage.get(rfc.id) || [];
    
    return {
      id: rfc.id,
      title: rfc.title,
      status: rfc.status as 'Review' | 'Accepted' | 'Rejected',
      authors: rfc.authors,
      created: rfc.created,
      updated: rfc.updated,
      summary: rfc.summary,
      motivation: rfc.motivation,
      detailedDesign: rfc.detailedDesign,
      alternatives: rfc.alternatives,
      securityConsiderations: rfc.securityConsiderations,
      privacyConsiderations: rfc.privacyConsiderations,
      commentCount: comments.length,
      voteCount: votes.length,
      tags: rfc.tags,
      category: rfc.category
    };
  }

  /**
   * Generate RFC ID
   */
  private generateRFCId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RFC-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate comment ID
   */
  private generateCommentId(): string {
    return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Generate vote ID
   */
  private generateVoteId(): string {
    return `vote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Extract tags from RFC data
   */
  private extractTags(rfcData: RFCData): string[] {
    const tags: string[] = [];
    
    // Extract tags from title and content
    const text = `${rfcData.title} ${rfcData.summary} ${rfcData.detailedDesign}`.toLowerCase();
    
    if (text.includes('security')) tags.push('security');
    if (text.includes('privacy')) tags.push('privacy');
    if (text.includes('performance')) tags.push('performance');
    if (text.includes('api')) tags.push('api');
    if (text.includes('database')) tags.push('database');
    if (text.includes('ui') || text.includes('interface')) tags.push('ui');
    if (text.includes('voting') || text.includes('poll')) tags.push('voting');
    if (text.includes('realtime')) tags.push('realtime');
    
    return tags;
  }

  /**
   * Categorize RFC
   */
  private categorizeRFC(rfcData: RFCData): string {
    const text = `${rfcData.title} ${rfcData.summary}`.toLowerCase();
    
    if (text.includes('security') || text.includes('auth')) return 'Security';
    if (text.includes('privacy') || text.includes('data protection')) return 'Privacy';
    if (text.includes('performance') || text.includes('scalability')) return 'Performance';
    if (text.includes('api') || text.includes('endpoint')) return 'API';
    if (text.includes('database') || text.includes('storage')) return 'Database';
    if (text.includes('ui') || text.includes('interface') || text.includes('ux')) return 'User Experience';
    if (text.includes('voting') || text.includes('poll') || text.includes('election')) return 'Voting System';
    if (text.includes('realtime') || text.includes('websocket')) return 'Realtime';
    if (text.includes('governance') || text.includes('policy')) return 'Governance';
    
    return 'General';
  }

  /**
   * Notify stakeholders of new RFC
   */
  private async notifyStakeholders(rfc: RFC): Promise<void> {
    const notification: RFCNotification = {
      id: `notif-${Date.now()}`,
      rfcId: rfc.id,
      type: 'created',
      message: `New RFC created: ${rfc.title}`,
      timestamp: Date.now(),
      recipients: ['admin', 'core-team']
    };
    
    await this.sendNotification(notification);
  }

  /**
   * Notify community of published RFC
   */
  private async notifyCommunity(rfc: RFC): Promise<void> {
    const notification: RFCNotification = {
      id: `notif-${Date.now()}`,
      rfcId: rfc.id,
      type: 'status_changed',
      message: `RFC published for review: ${rfc.title}`,
      timestamp: Date.now(),
      recipients: ['community', 'stakeholders']
    };
    
    await this.sendNotification(notification);
  }

  /**
   * Notify comment added
   */
  private async notifyCommentAdded(rfc: RFC, comment: RFCComment): Promise<void> {
    const notification: RFCNotification = {
      id: `notif-${Date.now()}`,
      rfcId: rfc.id,
      type: 'comment_added',
      message: `New comment on RFC: ${rfc.title}`,
      timestamp: Date.now(),
      recipients: ['rfc-authors', 'commenters']
    };
    
    await this.sendNotification(notification);
  }

  /**
   * Notify vote cast
   */
  private async notifyVoteCast(rfc: RFC, vote: RFCVote): Promise<void> {
    const notification: RFCNotification = {
      id: `notif-${Date.now()}`,
      rfcId: rfc.id,
      type: 'vote_cast',
      message: `Vote cast on RFC: ${rfc.title}`,
      timestamp: Date.now(),
      recipients: ['rfc-authors', 'voters']
    };
    
    await this.sendNotification(notification);
  }

  /**
   * Notify status change
   */
  private async notifyStatusChange(rfc: RFC, oldStatus: string, reason?: string): Promise<void> {
    const notification: RFCNotification = {
      id: `notif-${Date.now()}`,
      rfcId: rfc.id,
      type: 'status_changed',
      message: `RFC status changed from ${oldStatus} to ${rfc.status}: ${rfc.title}`,
      timestamp: Date.now(),
      recipients: ['community', 'stakeholders', 'rfc-authors']
    };
    
    await this.sendNotification(notification);
  }

  /**
   * Send notification
   */
  private async sendNotification(notification: RFCNotification): Promise<void> {
    const notifications = this.notificationStorage.get(notification.rfcId) || [];
    notifications.push(notification);
    this.notificationStorage.set(notification.rfcId, notifications);
    
    logger.info(`RFC notification sent`, { 
      rfcId: notification.rfcId, 
      type: notification.type,
      recipients: notification.recipients.length 
    });
  }

  /**
   * Publish to public repository
   */
  private async publishToPublicRepo(rfc: RFC): Promise<void> {
    // In production, this would publish to a public repository
    logger.info(`RFC published to public repo`, { rfcId: rfc.id, title: rfc.title });
  }
}
