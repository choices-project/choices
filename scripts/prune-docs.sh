#!/bin/bash

# Core Documentation Pruning Script
# Run this to identify docs that can be safely pruned or consolidated

echo "=== CORE DOCS ANALYSIS ==="
echo ""

echo "✅ ESSENTIAL DOCS (Keep & Update):"
echo "  - docs/core/SYSTEM_ARCHITECTURE.md"
echo "  - docs/core/AUTHENTICATION_COMPREHENSIVE.md"
echo "  - docs/core/SECURITY_COMPREHENSIVE.md"
echo "  - docs/core/VOTING_ENGINE_COMPREHENSIVE.md"
echo "  - docs/core/CIVICS_COMPREHENSIVE.md"
echo "  - docs/core/FILE_REORGANIZATION_SUMMARY.md"
echo "  - docs/TESTING_GUIDE.md"
echo ""

echo "🗑️  CONSOLIDATED DOCS (Can be pruned - info moved to comprehensive docs):"
echo "  - AUTHENTICATION.md → AUTHENTICATION_COMPREHENSIVE.md"
echo "  - SECURITY.md → SECURITY_COMPREHENSIVE.md"
echo "  - VOTING_ENGINE.md → VOTING_ENGINE_COMPREHENSIVE.md"
echo "  - VOTING_ENGINE_COMPREHENSIVE_REVIEW.md → VOTING_ENGINE_COMPREHENSIVE.md"
echo "  - VOTING_ENGINE_TESTING_ROADMAP.md → VOTING_ENGINE_COMPREHENSIVE.md"
echo "  - CIVICS_*.md (13+ files) → CIVICS_COMPREHENSIVE.md"
echo ""

echo "🗑️  LEGACY/OUTDATED DOCS (Candidates for pruning):"
echo "  - TYPE_SAFETY_IMPROVEMENTS.md (completed work)"
echo "  - TYPESCRIPT_ERROR_RESOLUTION_ROADMAP.md (completed work)"
echo "  - VOTING_ENGINE_*.md (can be consolidated)"
echo "  - WORKFLOW_TROUBLESHOOTING_GUIDE.md (can be consolidated)"
echo ""

echo "📋 KEEP BUT DON'T PRIORITIZE:"
echo "  - SECURITY.md (important but separate from E2E)"
echo "  - DATABASE_OPTIMIZATION_TIGHT_CUT.md (performance docs)"
echo "  - AGENT_ONBOARDING_COMPREHENSIVE.md (superseded by playbook)"
echo ""

echo "📊 SUMMARY:"
total_docs=$(ls docs/core/*.md | wc -l)
essential_docs=7
consolidated_docs=18
legacy_docs=4

echo "  Total core docs: $total_docs"
echo "  Essential docs: $essential_docs"
echo "  Consolidated docs: $consolidated_docs"
echo "  Legacy docs: $legacy_docs"
echo "  Can be pruned: $((consolidated_docs + legacy_docs))"
echo ""

echo "🎯 RECOMMENDATION:"
echo "  Focus on the 7 essential docs only for E2E work."
echo "  Prune consolidated and legacy docs when you have time."
echo "  Monstrous docs are OK - parse later!"
echo "  Major features now have comprehensive single docs!"
