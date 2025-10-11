# SYMBI Trust Protocol - Dune Analytics Workspace Setup

## Overview
This document provides step-by-step instructions for setting up a Dune Analytics workspace to monitor and analyze the SYMBI Trust Protocol governance and trust metrics.

## Prerequisites
- Dune Analytics account (Team or Pro plan recommended for private queries)
- Access to SYMBI Trust Protocol blockchain data
- Understanding of SQL and blockchain data structures

## Workspace Configuration

### 1. Account Setup
1. Create a Dune Analytics account at https://dune.com
2. Upgrade to Team plan for private queries and advanced features
3. Set up team workspace: "SYMBI Trust Protocol Analytics"

### 2. Data Source Configuration
The SYMBI Trust Protocol data should be available through these tables:
- `symbi_trust_declarations` - Trust declarations and compliance scores
- `symbi_governance_events` - Governance activities and voting
- `symbi_audit_log` - Comprehensive audit trail
- `symbi_ciq_metrics` - Clarity, Integrity, Quality metrics

### 3. Query Setup

#### Query 1: Trust Declarations Analytics
- **File**: `trust-declarations.sql`
- **Purpose**: Monitor trust declaration trends and compliance metrics
- **Key Metrics**:
  - Daily trust declarations count
  - Average compliance and guilt scores
  - Trust articles adoption rates
  - High/low compliance agent counts

#### Query 2: Governance Events Analytics  
- **File**: `governance-events.sql`
- **Purpose**: Track bicameral governance activities
- **Key Metrics**:
  - Proposal creation and voting patterns
  - House of Work vs House of Stewardship activity
  - Voting weight distribution
  - Governance participation rates

#### Query 3: Trust Score Trends
- **File**: `trust-score-trends.sql`
- **Purpose**: Analyze trust score evolution and CIQ metrics
- **Key Metrics**:
  - Trust score percentiles and distribution
  - CIQ metrics trends (Clarity, Integrity, Quality)
  - Agent risk categorization
  - Moving averages and score changes

#### Query 4: Comprehensive Audit Trail
- **File**: `audit-trail.sql`
- **Purpose**: Complete audit trail for compliance and security
- **Key Metrics**:
  - Event categorization and risk assessment
  - Actor activity patterns
  - Compliance violations tracking
  - Governance integrity monitoring

## Dashboard Creation

### Dashboard 1: SYMBI Trust Protocol Overview
**Components**:
- Trust Score Distribution (Pie Chart)
- Daily Trust Declarations (Line Chart)
- Compliance Score Trends (Area Chart)
- Trust Articles Adoption Rates (Bar Chart)

**Filters**:
- Date range selector
- Agent ID filter
- Compliance score threshold

### Dashboard 2: Governance Analytics
**Components**:
- Bicameral Activity Comparison (Dual Bar Chart)
- Proposal Success Rates (Gauge Chart)
- Voting Participation Trends (Line Chart)
- Governance Body Activity Heatmap

**Filters**:
- Governance body selector
- Proposal status filter
- Time period selector

### Dashboard 3: Risk & Compliance Monitor
**Components**:
- Risk Level Distribution (Stacked Bar)
- Compliance Violations Timeline (Scatter Plot)
- Actor Risk Profiles (Table)
- Audit Event Categories (Donut Chart)

**Filters**:
- Risk level filter
- Event category selector
- Actor ID search

### Dashboard 4: CIQ Metrics Deep Dive
**Components**:
- CIQ Score Correlation Matrix
- Quality Trends by Agent Category
- Integrity Score Distribution
- Clarity Metrics Over Time

**Filters**:
- Metric type selector
- Agent category filter
- Score range slider

## Alert Configuration

### Critical Alerts
1. **Trust Score Degradation**: Alert when average trust score drops below 0.7
2. **Compliance Violations**: Immediate alert for any compliance score below 0.5
3. **Governance Anomalies**: Alert for unusual voting patterns or proposal volumes
4. **Audit Failures**: Alert for failed audits or security events

### Warning Alerts
1. **Low Participation**: Alert when governance participation drops below threshold
2. **Score Volatility**: Alert for significant trust score fluctuations
3. **Article Non-Compliance**: Alert for declining trust article adoption rates

## Data Refresh Schedule
- **Real-time**: Critical compliance and security metrics
- **Hourly**: Governance events and trust declarations
- **Daily**: Trend analysis and historical comparisons
- **Weekly**: Comprehensive audit reports

## Access Control
- **Admin Access**: Full dashboard editing and query modification
- **Governance Team**: Read access to all dashboards, limited query editing
- **Compliance Team**: Full access to risk and audit dashboards
- **Public Dashboards**: Selected metrics for transparency (compliance scores, governance activity)

## Integration Points

### API Endpoints
- Dune API for programmatic access to query results
- Webhook integration for real-time alerts
- Export capabilities for regulatory reporting

### External Systems
- Integration with SYMBI Trust Protocol backend
- Slack/Discord notifications for alerts
- Email reports for stakeholders

## Maintenance & Updates

### Regular Tasks
- Monthly query optimization review
- Quarterly dashboard UX improvements
- Semi-annual data retention policy review
- Annual access control audit

### Version Control
- All queries stored in Git repository
- Dashboard configurations backed up monthly
- Change log maintained for all modifications

## Security Considerations
- Private queries for sensitive governance data
- IP whitelisting for admin access
- Audit logging for all dashboard access
- Data anonymization for public dashboards

## Cost Optimization
- Query result caching for frequently accessed data
- Efficient query design to minimize compute costs
- Regular review of unused queries and dashboards
- Data retention policies to manage storage costs

## Support & Documentation
- Internal wiki for query documentation
- Training materials for dashboard users
- Troubleshooting guides for common issues
- Contact information for technical support

---

## Next Steps
1. Set up Dune Analytics workspace
2. Import and test all SQL queries
3. Create initial dashboards
4. Configure alerts and notifications
5. Set up data refresh schedules
6. Train team members on dashboard usage
7. Implement monitoring and maintenance procedures