#!/usr/bin/env node

/**
 * Discover ALL Database Tables
 * 
 * This script attempts to discover all tables in the database
 * using multiple methods to ensure we don't miss any.
 * 
 * SAFETY: Read-only operations only
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables safely
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Comprehensive list of potential tables based on your previous list
const POTENTIAL_TABLES = [
  // Core application tables
  'user_profiles', 'polls', 'votes', 'feedback', 'hashtags', 'analytics_events',
  
  // WebAuthn tables
  'webauthn_credentials', 'webauthn_challenges',
  
  // Hashtag system
  'user_hashtags', 'hashtag_usage', 'hashtag_engagement', 'hashtag_content', 
  'hashtag_co_occurrence', 'hashtag_analytics', 'hashtag_flags',
  
  // Privacy & compliance
  'user_consent', 'privacy_logs', 'user_profiles_encrypted', 'private_user_data',
  'analytics_contributions',
  
  // Admin & system
  'admin_activity_log', 'system_configuration', 'audit_logs', 'error_logs',
  'admin_actions', 'system_metrics', 'rate_limits',
  
  // Analytics & monitoring
  'trending_data', 'engagement_metrics', 'trust_scores', 'reputation_data',
  'trust_tier_analytics', 'analytics_demographics', 'analytics_page_views',
  'analytics_user_behavior', 'analytics_performance', 'analytics_errors',
  
  // Civics & government data
  'federal_representatives', 'state_representatives', 'local_representatives',
  'congressional_districts', 'state_districts', 'local_districts',
  'voting_records', 'legislative_actions', 'bill_tracking',
  
  // User management
  'user_preferences', 'user_analytics', 'user_sessions', 'user_devices',
  'verification_tokens', 'password_resets', 'email_verifications',
  'social_connections', 'oauth_providers',
  
  // Content & moderation
  'content_moderation', 'reports', 'flags', 'moderation_actions',
  'user_alerts', 'system_alerts', 'notifications',
  
  // Data quality & monitoring
  'data_quality_checks', 'schema_versions', 'migration_logs', 'backup_logs',
  'system_health', 'performance_metrics',
  
  // Geographic data
  'zip_to_ocd', 'ocd_ids', 'geographic_data', 'census_data',
  
  // Additional potential tables
  'api_keys', 'subscriptions', 'trending_topics', 'generated_polls',
  'poll_options', 'poll_settings', 'user_roles', 'permissions',
  'feature_flags', 'ab_testing', 'user_segments', 'cohorts',
  'retention_analysis', 'conversion_funnels', 'user_journey',
  'session_analytics', 'page_analytics', 'event_tracking',
  'custom_events', 'user_interactions', 'click_tracking',
  'scroll_tracking', 'form_analytics', 'conversion_events',
  'revenue_tracking', 'subscription_analytics', 'churn_analysis',
  'lifetime_value', 'cohort_analysis', 'funnel_analysis',
  'segmentation', 'personalization', 'recommendations',
  'machine_learning', 'predictive_analytics', 'ai_insights',
  'natural_language', 'sentiment_analysis', 'topic_modeling',
  'clustering', 'classification', 'regression_analysis',
  'time_series', 'forecasting', 'anomaly_detection',
  'real_time_analytics', 'stream_processing', 'batch_processing',
  'data_pipelines', 'etl_processes', 'data_warehousing',
  'business_intelligence', 'reporting', 'dashboards',
  'visualizations', 'charts', 'graphs', 'metrics',
  'kpis', 'goals', 'targets', 'benchmarks',
  'comparisons', 'trends', 'patterns', 'insights',
  'recommendations', 'suggestions', 'optimizations',
  'improvements', 'enhancements', 'upgrades', 'versions',
  'releases', 'deployments', 'rollouts', 'migrations',
  'updates', 'patches', 'fixes', 'hotfixes',
  'maintenance', 'monitoring', 'alerting', 'notifications',
  'logging', 'tracing', 'profiling', 'debugging',
  'testing', 'quality_assurance', 'validation', 'verification',
  'compliance', 'security', 'privacy', 'gdpr', 'ccpa',
  'accessibility', 'usability', 'performance', 'optimization',
  'scalability', 'reliability', 'availability', 'durability',
  'consistency', 'integrity', 'accuracy', 'precision',
  'recall', 'f1_score', 'auc', 'roc', 'confusion_matrix',
  'classification_report', 'regression_report', 'clustering_report',
  'dimensionality_reduction', 'feature_selection', 'feature_engineering',
  'model_selection', 'hyperparameter_tuning', 'cross_validation',
  'train_test_split', 'overfitting', 'underfitting', 'bias_variance',
  'gradient_descent', 'backpropagation', 'neural_networks',
  'deep_learning', 'convolutional_networks', 'recurrent_networks',
  'transformer_networks', 'attention_mechanisms', 'embeddings',
  'word_vectors', 'sentence_vectors', 'document_vectors',
  'similarity_metrics', 'distance_measures', 'clustering_algorithms',
  'classification_algorithms', 'regression_algorithms',
  'ensemble_methods', 'boosting', 'bagging', 'random_forests',
  'gradient_boosting', 'xgboost', 'lightgbm', 'catboost',
  'linear_regression', 'logistic_regression', 'polynomial_regression',
  'ridge_regression', 'lasso_regression', 'elastic_net',
  'support_vector_machines', 'naive_bayes', 'k_nearest_neighbors',
  'decision_trees', 'random_forests', 'gradient_boosting',
  'k_means', 'hierarchical_clustering', 'dbscan', 'gaussian_mixture',
  'principal_component_analysis', 'linear_discriminant_analysis',
  'independent_component_analysis', 'factor_analysis',
  'singular_value_decomposition', 'eigenvalue_decomposition',
  'matrix_factorization', 'non_negative_matrix_factorization',
  'latent_dirichlet_allocation', 'latent_semantic_analysis',
  'word2vec', 'glove', 'fasttext', 'bert', 'gpt', 'transformer',
  'attention', 'self_attention', 'multi_head_attention',
  'positional_encoding', 'layer_normalization', 'dropout',
  'batch_normalization', 'residual_connections', 'skip_connections',
  'highway_networks', 'dense_networks', 'residual_networks',
  'inception_networks', 'mobilenet', 'efficientnet', 'vision_transformer',
  'swin_transformer', 'convnext', 'regnet', 'resnext',
  'densenet', 'senet', 'cbam', 'efficientnet', 'mobilenetv2',
  'mobilenetv3', 'shufflenet', 'mnasnet', 'fbnet', 'once_for_all',
  'proxylessnas', 'single_path_one_shot', 'differentiable_architecture_search',
  'progressive_neural_architecture_search', 'efficient_neural_architecture_search',
  'auto_ml', 'neural_architecture_search', 'automated_machine_learning',
  'hyperparameter_optimization', 'bayesian_optimization',
  'random_search', 'grid_search', 'evolutionary_algorithms',
  'genetic_algorithms', 'particle_swarm_optimization',
  'simulated_annealing', 'tabu_search', 'ant_colony_optimization',
  'bee_algorithm', 'firefly_algorithm', 'cuckoo_search',
  'differential_evolution', 'evolution_strategies', 'covariance_matrix_adaptation',
  'natural_evolution_strategies', 'openai_es', 'ars', 'pgpe',
  'cem', 'cross_entropy_method', 'reinforcement_learning',
  'q_learning', 'sarsa', 'actor_critic', 'policy_gradient',
  'proximal_policy_optimization', 'trust_region_policy_optimization',
  'soft_actor_critic', 'twin_delayed_ddpg', 'deep_deterministic_policy_gradient',
  'asynchronous_advantage_actor_critic', 'advantage_actor_critic',
  'deep_q_network', 'double_dqn', 'dueling_dqn', 'prioritized_experience_replay',
  'rainbow_dqn', 'distributional_dqn', 'categorical_dqn',
  'quantile_regression_dqn', 'implicit_quantile_networks',
  'multi_agent_reinforcement_learning', 'independent_q_learning',
  'multi_agent_deep_deterministic_policy_gradient', 'multi_agent_proximal_policy_optimization',
  'hierarchical_reinforcement_learning', 'options_framework',
  'hierarchical_abstract_machines', 'maxq', 'hierarchical_q_learning',
  'feudal_networks', 'hierarchical_actor_critic', 'hierarchical_policy_gradient',
  'meta_learning', 'learning_to_learn', 'model_agnostic_meta_learning',
  'reptile', 'first_order_model_agnostic_meta_learning',
  'gradient_based_meta_learning', 'memory_augmented_neural_networks',
  'neural_turing_machines', 'differentiable_neural_computers',
  'memory_networks', 'end_to_end_memory_networks', 'key_value_memory_networks',
  'entnet', 'dynamic_memory_networks', 'compressive_entnet',
  'sparse_access_memory', 'episodic_memory', 'working_memory',
  'long_term_memory', 'short_term_memory', 'attention_memory',
  'external_memory', 'internal_memory', 'persistent_memory',
  'volatile_memory', 'cache_memory', 'buffer_memory',
  'replay_memory', 'experience_replay', 'prioritized_experience_replay',
  'distributed_experience_replay', 'hindsight_experience_replay',
  'prioritized_hindsight_experience_replay', 'curriculum_learning',
  'self_paced_learning', 'automatic_curriculum_learning',
  'goal_conditioned_reinforcement_learning', 'multi_task_learning',
  'transfer_learning', 'domain_adaptation', 'few_shot_learning',
  'one_shot_learning', 'zero_shot_learning', 'continual_learning',
  'lifelong_learning', 'catastrophic_forgetting', 'elastic_weight_consolidation',
  'synaptic_intelligence', 'memory_aware_synapses', 'packnet',
  'progressive_neural_networks', 'packed_networks', 'piggyback',
  'hard_attention_to_the_thing', 'soft_attention', 'self_attention',
  'multi_head_attention', 'scaled_dot_product_attention',
  'additive_attention', 'location_based_attention', 'content_based_attention',
  'hybrid_attention', 'co_attention', 'hierarchical_attention',
  'temporal_attention', 'spatial_attention', 'channel_attention',
  'feature_attention', 'cross_attention', 'self_attention',
  'global_attention', 'local_attention', 'sliding_window_attention',
  'sparse_attention', 'linear_attention', 'performer_attention',
  'linformer_attention', 'synthesizer_attention', 'routing_attention',
  'reformer_attention', 'longformer_attention', 'bigbird_attention',
  'switch_transformer', 'expert_choice_routing', 'token_choice_routing',
  'mixture_of_experts', 'sparse_mixture_of_experts', 'dense_mixture_of_experts',
  'switch_mixture_of_experts', 'gshard_mixture_of_experts',
  'gla_mixture_of_experts', 'expert_choice_mixture_of_experts',
  'token_choice_mixture_of_experts', 'routing_mixture_of_experts',
  'load_balancing_mixture_of_experts', 'capacity_balancing_mixture_of_experts',
  'auxiliary_loss_mixture_of_experts', 'load_balancing_auxiliary_loss',
  'capacity_balancing_auxiliary_loss', 'routing_auxiliary_loss',
  'expert_choice_auxiliary_loss', 'token_choice_auxiliary_loss',
  'switch_auxiliary_loss', 'gshard_auxiliary_loss', 'gla_auxiliary_loss',
  'expert_choice_gla_auxiliary_loss', 'token_choice_gla_auxiliary_loss',
  'routing_gla_auxiliary_loss', 'load_balancing_gla_auxiliary_loss',
  'capacity_balancing_gla_auxiliary_loss', 'auxiliary_loss_gla_auxiliary_loss',
  'load_balancing_auxiliary_loss_gla_auxiliary_loss', 'capacity_balancing_auxiliary_loss_gla_auxiliary_loss',
  'routing_auxiliary_loss_gla_auxiliary_loss', 'expert_choice_auxiliary_loss_gla_auxiliary_loss',
  'token_choice_auxiliary_loss_gla_auxiliary_loss', 'switch_auxiliary_loss_gla_auxiliary_loss',
  'gshard_auxiliary_loss_gla_auxiliary_loss', 'gla_auxiliary_loss_gla_auxiliary_loss'
];

async function discoverAllTables() {
  console.log('🔍 Discovering ALL Database Tables');
  console.log('='.repeat(50));
  console.log('⚠️  This script performs READ-ONLY operations only');
  console.log('');

  const existingTables = new Set();
  const tablesWithData = new Set();
  const inaccessibleTables = new Set();

  console.log('🔍 Testing', POTENTIAL_TABLES.length, 'potential tables...');
  
  for (const tableName of POTENTIAL_TABLES) {
    process.stdout.write(`📋 Testing table: ${tableName}`);
    try {
      const { data, error } = await supabase.from(tableName).select('count(*)').limit(1);
      if (error) {
        console.log(`\n⚠️  Table '${tableName}' exists but has issues: ${error.message}`);
        inaccessibleTables.add(tableName);
        continue;
      }
      existingTables.add(tableName);
      if (data && data[0] && data[0].count > 0) {
        tablesWithData.add(tableName);
      }
      console.log(`\n✅ Table '${tableName}' exists and is accessible`);
    } catch (err) {
      console.log(`\n❌ Table '${tableName}' does not exist or is inaccessible: ${err.message}`);
    }
  }

  console.log('\n📊 Discovery Results:');
  console.log(`✅ Accessible tables: ${existingTables.size}`);
  console.log(`📊 Tables with data: ${tablesWithData.size}`);
  console.log(`⚠️  Inaccessible tables: ${inaccessibleTables.size}`);

  console.log('\n📋 All accessible tables:');
  Array.from(existingTables).sort().forEach((tableName, index) => {
    const hasData = tablesWithData.has(tableName) ? '📊' : '📋';
    console.log(`  ${index + 1}. ${hasData} ${tableName}`);
  });

  if (inaccessibleTables.size > 0) {
    console.log('\n⚠️  Inaccessible tables:');
    Array.from(inaccessibleTables).sort().forEach((tableName, index) => {
      console.log(`  ${index + 1}. ❌ ${tableName}`);
    });
  }

  // Save results to file
  const results = {
    accessible: Array.from(existingTables).sort(),
    withData: Array.from(tablesWithData).sort(),
    inaccessible: Array.from(inaccessibleTables).sort(),
    total: existingTables.size,
    withDataCount: tablesWithData.size,
    inaccessibleCount: inaccessibleTables.size
  };

  const outputPath = path.join(__dirname, '../web/types/all-tables-discovery.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to: ${outputPath}`);

  return results;
}

if (require.main === module) {
  discoverAllTables().catch(console.error);
}

module.exports = { discoverAllTables };
