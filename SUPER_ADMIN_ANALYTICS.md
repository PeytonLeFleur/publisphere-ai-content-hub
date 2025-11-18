# Super Admin Analytics Dashboard
**Created**: November 18, 2025

## Overview

A comprehensive, real-time analytics dashboard for super admins with detailed insights across all platform metrics.

---

## Access

**URL**: `/super-admin` → Analytics Tab
**Login**: `/super-admin/login`

After logging in as super admin, you'll see two tabs:
1. **Analytics** - Comprehensive metrics and charts (default)
2. **Agencies** - Agency and client list

---

## Time Period Filters

Switch between different time periods to analyze data:
- **Today** - Current day metrics
- **7 Days** - Last week performance
- **30 Days** - Last month (default)
- **90 Days** - Quarterly view
- **All Time** - Complete historical data

All metrics and charts update automatically when you change the time period.

---

## Key Metrics Dashboard

### Primary Metrics (Row 1)
1. **Total Agencies**
   - Current total count
   - Growth rate vs previous period
   - New agencies added this period
   - Purple color-coded card

2. **Total Clients**
   - Current total count
   - Growth rate vs previous period
   - New clients added this period
   - Blue color-coded card

3. **Content Created**
   - Total content items generated
   - New content this period
   - Green color-coded card

4. **Active Subscriptions**
   - Count of active client subscriptions
   - Orange color-coded card

### Voice Agent Metrics (Row 2)
5. **Voice Agents**
   - Total voice agents created
   - New voice agents this period
   - Indigo color-coded card

6. **Total Calls**
   - Total voice calls handled
   - Cyan color-coded card

7. **Call Minutes**
   - Total minutes of voice calls
   - Average call duration
   - Teal color-coded card

8. **Monthly Revenue**
   - Total MRR from active subscriptions
   - Dollar amount
   - Emerald color-coded card

---

## Interactive Charts

### 1. Agency Signups (Area Chart)
- **Location**: Top left chart
- **Shows**: New agency signups over time
- **Type**: Gradient area chart in purple
- **X-Axis**: Dates
- **Y-Axis**: Number of signups per day
- **Use Case**: Track agency acquisition trends

### 2. Client Growth (Area Chart)
- **Location**: Top right chart
- **Shows**: New clients added over time
- **Type**: Gradient area chart in blue
- **X-Axis**: Dates
- **Y-Axis**: Number of clients per day
- **Use Case**: Monitor client base expansion

### 3. Content Generation (Bar Chart)
- **Location**: Bottom left chart
- **Shows**: Content created over time
- **Type**: Bar chart in green
- **X-Axis**: Dates
- **Y-Axis**: Number of content items per day
- **Use Case**: Track content production activity

### 4. Voice Call Activity (Line Chart)
- **Location**: Bottom right chart
- **Shows**: Voice calls handled over time
- **Type**: Line chart in orange
- **X-Axis**: Dates
- **Y-Axis**: Number of calls per day
- **Use Case**: Monitor voice agent usage

### 5. Content Type Distribution (Pie Chart)
- **Location**: Lower left section
- **Shows**: Breakdown by content type
  - Articles (purple)
  - GMB Posts (blue)
  - Social Posts (green)
- **Type**: Pie chart with percentage labels
- **Details Below**: Individual counts for each type
- **Use Case**: Understand content mix

### 6. Call Performance (Metrics Panel)
- **Location**: Lower right section
- **Shows**:
  - Success rate (percentage and progress bar)
  - Successful calls count
  - Failed calls count
  - Average call duration
  - Total calls
  - Total minutes
  - Total hours
- **Use Case**: Monitor voice agent quality and performance

---

## Growth Summary Section

Displays period-over-period comparison in a highlighted panel:

### Metrics Tracked
1. **Agencies Added**
   - Count for current period
   - % growth vs previous period
   - Purple highlight card

2. **Clients Added**
   - Count for current period
   - % growth vs previous period
   - Blue highlight card

3. **Content Created**
   - Count for current period
   - Green highlight card

4. **New Subscriptions**
   - Count for current period
   - Orange highlight card

### Growth Indicators
- Green text with "+" = Positive growth
- Red text with "-" = Negative growth
- Compares current period to equivalent previous period

---

## Detailed Analytics

### Content Analytics
- **Total Content**: All-time content generation count
- **By Type**:
  - Blog Articles
  - GMB Posts
  - Social Posts
- **Status Breakdown**: Published, Draft, Scheduled
- **Trends**: Daily content generation patterns

### Voice Agent Analytics
- **Total Voice Agents**: Active AI voice agents
- **Total Calls**: All-time call volume
- **Call Minutes**: Total conversation time
- **Average Duration**: Per-call average in seconds
- **Success Rate**: Completed vs failed calls percentage
- **Performance Metrics**:
  - Successful calls count
  - Failed calls count
  - Total hours of conversation

### Subscription Analytics
- **Active Subscriptions**: Currently active paid subscriptions
- **Monthly Revenue**: Total MRR from all active subs
- **Subscription Growth**: New subscriptions per period

### Agency/Client Analytics
- **Agency Count**: Total registered agencies
- **Client Count**: Total clients across all agencies
- **Growth Rates**: Period-over-period percentage change
- **New Signups**: New agencies/clients in selected period

---

## Database Functions Used

### 1. `get_super_admin_overview_stats(p_start_date, p_end_date)`
Returns comprehensive overview with all key metrics:
- Total and new counts for agencies, clients, content
- Content breakdown by type
- Voice agent and call statistics
- Active subscriptions and revenue

### 2. `get_super_admin_time_series(p_metric_type, p_start_date, p_end_date)`
Returns time series data for charts:
- Supports: 'agencies', 'clients', 'content', 'voice_calls', 'subscriptions'
- Returns daily counts for the specified period
- Used to power all area, bar, and line charts

### 3. `get_super_admin_call_analytics(p_start_date, p_end_date)`
Returns detailed voice call metrics:
- Total calls and minutes
- Average call duration
- Success/failure counts
- Daily breakdown with JSON aggregation

### 4. `get_super_admin_growth_metrics(p_days)`
Returns growth comparison:
- Current period stats
- Previous period stats
- Calculated growth rates
- Used for trend indicators

---

## Real-Time Updates

### How Data Updates
- Data refreshes when you change time period filters
- Charts and metrics update automatically
- All queries run directly against live database
- No caching (always current)

### Loading States
- Skeleton loaders while data fetches
- Smooth transitions when data loads
- Error handling with user-friendly messages

---

## Color Coding

### Metric Cards
- **Purple**: Agencies
- **Blue**: Clients
- **Green**: Content
- **Orange**: Subscriptions
- **Indigo**: Voice Agents
- **Cyan**: Calls
- **Teal**: Call Minutes
- **Emerald**: Revenue

### Charts
- **Purple**: Agency data
- **Blue**: Client data
- **Green**: Content data
- **Orange**: Voice call data

### Status Indicators
- **Green**: Positive trends, success rates
- **Red**: Negative trends, failures
- **Gray**: Neutral status

---

## Privacy & Security

### What You CAN See
✅ Aggregate statistics (counts, totals)
✅ Growth trends and rates
✅ Content generation patterns
✅ Voice agent usage metrics
✅ Revenue totals

### What You CANNOT See
❌ Individual client data
❌ Client contact information
❌ API keys or credentials
❌ Specific content text
❌ Financial details per client
❌ Voice call recordings or transcripts

All analytics are aggregated and anonymized. No personally identifiable information (PII) is accessible.

---

## Use Cases

### Business Intelligence
- Monitor platform growth trends
- Track user engagement
- Identify peak usage times
- Measure revenue growth

### Performance Monitoring
- Voice agent success rates
- Content generation volume
- System utilization
- Subscription health

### Strategic Planning
- Identify growth opportunities
- Spot declining metrics early
- Compare period performance
- Set data-driven goals

### Reporting
- Export metrics for stakeholders
- Track KPIs over time
- Demonstrate platform value
- Justify business decisions

---

## Tips for Best Results

### Analyzing Trends
1. Start with "All Time" to see big picture
2. Drill down to 30 days for recent trends
3. Use 7 days for weekly performance
4. Check "Today" for real-time activity

### Identifying Issues
- Sudden drops in any metric = investigate
- High failure rate in calls = check integrations
- Low content generation = user engagement issue
- Subscription churn = review pricing/value

### Growth Monitoring
- Compare week-over-week for consistency
- Look for seasonal patterns
- Track growth rate percentages
- Set benchmark goals

---

## Technical Details

### Performance
- Optimized SQL queries with indexes
- Database views for fast aggregation
- Efficient time series queries
- Lazy loading of chart data

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design (desktop, tablet, mobile)
- Chart interactivity with tooltips
- Smooth animations

### Data Refresh
- Manual refresh: Change time period
- Automatic: On component mount
- No polling (prevents server load)
- Consider adding auto-refresh if needed

---

## Future Enhancements (Roadmap)

### Potential Additions
1. **Export Functionality**
   - CSV download of metrics
   - PDF report generation
   - Email scheduled reports

2. **Advanced Filters**
   - Filter by specific agency
   - Filter by content type
   - Filter by date range picker

3. **Comparison Tools**
   - Side-by-side period comparison
   - Year-over-year analysis
   - Benchmark against goals

4. **Alerting**
   - Email alerts for anomalies
   - Threshold notifications
   - Daily/weekly digest emails

5. **Additional Metrics**
   - User engagement scores
   - Churn prediction
   - Revenue forecasting
   - Cost per acquisition

---

## Support

For questions about analytics:
- Check the data tooltips (hover over chart points)
- Verify time period selection
- Ensure database migrations are run
- Contact development team for custom metrics

---

**The analytics dashboard gives you complete visibility into platform performance while maintaining strict privacy and security for all user data.** 📊

Generated by Claude Code | November 18, 2025
