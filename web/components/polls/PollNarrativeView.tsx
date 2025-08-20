'use client';

import React, { useState } from 'react';
import { PollNarrative } from '@/types';
import { 
  BookOpen, 
  Users, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Calendar,
  TrendingUp,
  Shield,
  Eye,
  Vote,
  FileText,
  User,
  Building,
  Globe,
  Target,
  Zap,
  Star,
  Flag,
  Edit3,
  Plus,
  Minus
} from 'lucide-react';
import { CommunityFact, Stakeholder } from '@/lib/poll-narrative-system'

interface PollNarrativeViewProps {
  narrative: PollNarrative;
  onVote?: (optionId: string) => void;
  onFactVote?: (factId: string, voteType: 'helpful' | 'notHelpful' | 'verified' | 'disputed') => void;
  onAddCommunityFact?: (fact: Omit<CommunityFact, 'id' | 'submittedAt' | 'status' | 'votes'>) => void;
  onRequestFactVerification?: (factId: string, reason: string, evidence: string[]) => void;
  isVotingEnabled?: boolean;
  showModerationTools?: boolean;
}

export default function PollNarrativeView({
  narrative,
  onVote,
  onFactVote,
  onAddCommunityFact,
  onRequestFactVerification,
  isVotingEnabled = true,
  showModerationTools = false
}: PollNarrativeViewProps) {
  const [activeTab, setActiveTab] = useState<'story' | 'facts' | 'sources' | 'timeline' | 'stakeholders' | 'community'>('story');
  const [expandedFacts, setExpandedFacts] = useState<Set<string>>(new Set());
  const [showAddFactForm, setShowAddFactForm] = useState(false);
  const [newFact, setNewFact] = useState({ statement: '', category: 'fact' as const, sources: [] as string[] });

  const toggleFactExpansion = (factId: string) => {
    const newExpanded = new Set(expandedFacts);
    if (newExpanded.has(factId)) {
      newExpanded.delete(factId);
    } else {
      newExpanded.add(factId);
    }
    setExpandedFacts(newExpanded);
  };

  const handleFactVote = (factId: string, voteType: 'helpful' | 'notHelpful' | 'verified' | 'disputed') => {
    onFactVote?.(factId, voteType);
  };

  const handleAddCommunityFact = () => {
    if (newFact.statement.trim()) {
      onAddCommunityFact?.({
        statement: newFact.statement,
        category: newFact.category,
        submittedBy: 'current-user', // This would come from auth context
        sources: newFact.sources,
        tags: [],
        parentFact: undefined,
        moderatorNotes: '',
        reviewedBy: '',
        reviewedAt: new Date()
      });
      setNewFact({ statement: '', category: 'fact', sources: [] });
      setShowAddFactForm(false);
    }
  };

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partially_verified': return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      case 'disputed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getControversyColor = (level: number) => {
    if (level > 0.7) return 'text-red-600';
    if (level > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStakeholderPositionColor = (position: string) => {
    switch (position) {
      case 'support': return 'text-green-600 bg-green-50';
      case 'oppose': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      case 'mixed': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'story', label: 'Story', icon: BookOpen },
    { id: 'facts', label: 'Verified Facts', icon: Shield, count: narrative.verifiedFacts.length },
    { id: 'sources', label: 'Sources', icon: FileText, count: narrative.sources.length },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: narrative.timeline.length },
    { id: 'stakeholders', label: 'Stakeholders', icon: Users, count: narrative.stakeholders.length },
    { id: 'community', label: 'Community', icon: MessageSquare, count: narrative.communityFacts.length }
  ];

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{narrative.title}</h1>
            <p className="text-blue-100 text-lg">{narrative.summary}</p>
            
            {/* Context Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500 bg-opacity-20">
                <Globe className="h-4 w-4 mr-1" />
                {narrative.context.geographicScope}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-500 bg-opacity-20">
                <Zap className="h-4 w-4 mr-1" />
                {narrative.context.timeSensitivity}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500 bg-opacity-20">
                <Target className="h-4 w-4 mr-1" />
                {narrative.context.complexity}
              </span>
              {narrative.controversy.level !== 'low' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-500 bg-opacity-20">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  High Controversy
                </span>
              )}
            </div>
          </div>
          
          {/* Moderation Status */}
          {showModerationTools && (
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                narrative.moderation.status === 'approved' ? 'bg-green-500 bg-opacity-20' :
                narrative.moderation.status === 'rejected' ? 'bg-red-500 bg-opacity-20' :
                'bg-yellow-500 bg-opacity-20'
              }`}>
                <Shield className="h-4 w-4 mr-1" />
                {narrative.moderation.status}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Story Tab */}
        {activeTab === 'story' && (
          <div className="space-y-6">
            {/* Full Story */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Full Story</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {narrative.fullStory}
                </p>
              </div>
            </div>

            {/* Context */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Background</h3>
                <p className="text-gray-600">{narrative.context.background}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Current Situation</h3>
                <p className="text-gray-600">{narrative.context.currentSituation}</p>
              </div>
            </div>

            {/* Key Issues */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Key Issues</h3>
              <ul className="space-y-2">
                {narrative.context.keyIssues.map((issue: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Impact Assessment */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Impact Assessment</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(narrative.context.politicalImpact * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Political Impact</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(narrative.context.economicImpact * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Economic Impact</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(narrative.context.socialImpact * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Social Impact</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verified Facts Tab */}
        {activeTab === 'facts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Verified Facts</h2>
              <button
                onClick={() => setShowAddFactForm(!showAddFactForm)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Community Fact
              </button>
            </div>

            {/* Add Community Fact Form */}
            {showAddFactForm && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">Submit a Community Fact</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statement
                    </label>
                    <textarea
                      value={newFact.statement}
                      onChange={(e) => setNewFact({ ...newFact, statement: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter your fact or observation..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newFact.category}
                      onChange={(e) => setNewFact({ ...newFact, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fact">Fact</option>
                      <option value="opinion">Opinion</option>
                      <option value="anecdote">Anecdote</option>
                      <option value="question">Question</option>
                      <option value="correction">Correction</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddCommunityFact}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowAddFactForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Verified Facts List */}
            <div className="space-y-4">
              {narrative.verifiedFacts.map((fact) => (
                <div key={fact.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getVerificationIcon(fact.verificationLevel)}
                        <span className="text-sm font-medium text-gray-600">
                          {fact.verificationLevel.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{fact.category}</span>
                        {fact.controversy > 0 && (
                          <>
                            <span className="text-sm text-gray-500">•</span>
                            <span className={`text-sm font-medium ${getControversyColor(fact.controversy)}`}>
                              {Math.round(fact.controversy * 100)}% controversial
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-gray-800 mb-2">{fact.statement}</p>
                      
                      {expandedFacts.has(fact.id) && (
                        <div className="mt-3 space-y-3">
                          {/* Sources */}
                          {fact.sources.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Sources:</h4>
                              <div className="space-y-1">
                                {fact.sources.map((source: any, index: number) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm">
                                    <ExternalLink className="h-3 w-3 text-gray-400" />
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {source.name}
                                    </a>
                                    <span className="text-gray-500">({source.reliability * 100}% reliable)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fact Checkers */}
                          {fact.factCheckers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Fact Checkers:</h4>
                              <div className="space-y-1">
                                {fact.factCheckers.map((checker: any, index: number) => (
                                  <div key={index} className="text-sm">
                                    <span className="font-medium">{checker.name}</span>
                                    <span className="text-gray-500"> ({checker.organization})</span>
                                    <span className="text-gray-500"> - {checker.conclusion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {fact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {fact.tags.map((tag: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleFactExpansion(fact.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedFacts.has(fact.id) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => onRequestFactVerification?.(fact.id, 'Requesting verification', [])}
                        className="text-gray-400 hover:text-gray-600"
                        title="Request verification"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Community Facts */}
            {narrative.communityFacts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Community Contributions</h3>
                <div className="space-y-3">
                  {narrative.communityFacts.map((fact) => (
                    <div key={fact.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              fact.status === 'approved' ? 'bg-green-100 text-green-800' :
                              fact.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {fact.status}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{fact.category}</span>
                          </div>
                          <p className="text-gray-800 mb-2">{fact.statement}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleFactVote(fact.id, 'helpful')}
                            className="flex items-center space-x-1 text-gray-400 hover:text-green-600"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-sm">{fact.votes.helpful}</span>
                          </button>
                          <button
                            onClick={() => handleFactVote(fact.id, 'notHelpful')}
                            className="flex items-center space-x-1 text-gray-400 hover:text-red-600"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span className="text-sm">{fact.votes.notHelpful}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Sources & References</h2>
            <div className="grid gap-4">
              {narrative.sources.map((source) => (
                <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">{source.type}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{source.source}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{source.bias}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{source.reliability * 100}% reliable</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{source.title}</h3>
                      {source.author && (
                        <p className="text-sm text-gray-600 mb-2">By {source.author}</p>
                      )}
                      {source.summary && (
                        <p className="text-gray-700 mb-2">{source.summary}</p>
                      )}
                      {source.keyQuotes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Key Quotes:</h4>
                          <div className="space-y-1">
                            {source.keyQuotes.map((quote: string, index: number) => (
                              <blockquote key={index} className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2">
                                "{quote}"
                              </blockquote>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{source.communityRating}</span>
                      </span>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Timeline of Events</h2>
            <div className="relative">
              {narrative.timeline.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    {index < narrative.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {event.date.toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.significance === 'critical' ? 'bg-red-100 text-red-800' :
                        event.significance === 'high' ? 'bg-orange-100 text-orange-800' :
                        event.significance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.significance}
                      </span>
                      {event.verified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
                    <p className="text-gray-700 mb-2">{event.description}</p>
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag: string, tagIndex: number) => (
                          <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders Tab */}
        {activeTab === 'stakeholders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Key Stakeholders</h2>
            <div className="grid gap-4">
              {narrative.stakeholders.map((stakeholder) => (
                <div key={stakeholder.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {stakeholder.type === 'individual' ? (
                          <User className="h-4 w-4 text-gray-400" />
                        ) : stakeholder.type === 'organization' ? (
                          <Building className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">{stakeholder.type}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{stakeholder.role}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStakeholderPositionColor(stakeholder.position)}`}>
                          {stakeholder.position}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{stakeholder.name}</h3>
                      <p className="text-gray-600 mb-2">{stakeholder.background}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Influence:</span>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${stakeholder.influence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{Math.round(stakeholder.influence * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Credibility:</span>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${stakeholder.credibility * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{Math.round(stakeholder.credibility * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      {stakeholder.statements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Key Statements:</h4>
                          <div className="space-y-2">
                            {stakeholder.statements.map((statement: any, index: number) => (
                              <blockquote key={index} className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2">
                                "{statement.quote}"
                                <div className="text-xs text-gray-500 mt-1">
                                  {statement.date.toLocaleDateString()} • {statement.context}
                                </div>
                              </blockquote>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Community Discussion</h2>
            <p className="text-gray-600">
              This is where community members can contribute facts, ask questions, and engage in discussion about this narrative.
            </p>
            
            {/* Add Community Fact Button */}
            <button
              onClick={() => setShowAddFactForm(!showAddFactForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Community Fact
            </button>

            {/* Community Facts */}
            {narrative.communityFacts.length > 0 ? (
              <div className="space-y-4">
                {narrative.communityFacts.map((fact) => (
                  <div key={fact.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            fact.status === 'approved' ? 'bg-green-100 text-green-800' :
                            fact.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fact.status}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{fact.category}</span>
                        </div>
                        <p className="text-gray-800 mb-2">{fact.statement}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleFactVote(fact.id, 'helpful')}
                          className="flex items-center space-x-1 text-gray-400 hover:text-green-600"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm">{fact.votes.helpful}</span>
                        </button>
                        <button
                          onClick={() => handleFactVote(fact.id, 'notHelpful')}
                          className="flex items-center space-x-1 text-gray-400 hover:text-red-600"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span className="text-sm">{fact.votes.notHelpful}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No community contributions yet. Be the first to add a fact or observation!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voting Section */}
      {isVotingEnabled && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Ready to Vote?</h3>
            <p className="text-gray-600 mb-4">
              Now that you've reviewed the full context, what's your opinion on this issue?
            </p>
            <button
              onClick={() => onVote?.('option-1')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Vote className="h-5 w-5 mr-2" />
              Cast Your Vote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
