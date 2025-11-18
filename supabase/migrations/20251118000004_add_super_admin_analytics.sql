-- Super Admin Analytics System
-- Comprehensive analytics views and functions for super admin dashboard

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Daily metrics view for time series charts
CREATE OR REPLACE VIEW super_admin_daily_metrics AS
SELECT
  date_trunc('day', created_at)::date as date,
  'agencies' as metric_type,
  COUNT(*) as count
FROM agencies
GROUP BY date_trunc('day', created_at)::date

UNION ALL

SELECT
  date_trunc('day', created_at)::date as date,
  'clients' as metric_type,
  COUNT(*) as count
FROM clients
GROUP BY date_trunc('day', created_at)::date

UNION ALL

SELECT
  date_trunc('day', created_at)::date as date,
  'content_items' as metric_type,
  COUNT(*) as count
FROM content_items
GROUP BY date_trunc('day', created_at)::date

UNION ALL

SELECT
  date_trunc('day', created_at)::date as date,
  'subscriptions' as metric_type,
  COUNT(*) as count
FROM client_subscriptions
WHERE status = 'active'
GROUP BY date_trunc('day', created_at)::date

UNION ALL

SELECT
  date_trunc('day', created_at)::date as date,
  'voice_agents' as metric_type,
  COUNT(*) as count
FROM voice_agents
GROUP BY date_trunc('day', created_at)::date

UNION ALL

SELECT
  date_trunc('day', created_at)::date as date,
  'voice_calls' as metric_type,
  COUNT(*) as count
FROM voice_calls
GROUP BY date_trunc('day', created_at)::date;

-- Grant access
GRANT SELECT ON super_admin_daily_metrics TO authenticated;

-- Content type breakdown view
CREATE OR REPLACE VIEW super_admin_content_breakdown AS
SELECT
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
  COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count
FROM content_items
GROUP BY type;

GRANT SELECT ON super_admin_content_breakdown TO authenticated;

-- Top agencies view
CREATE OR REPLACE VIEW super_admin_top_agencies AS
SELECT
  a.id,
  a.business_name,
  a.created_at,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT ci.id) as total_content,
  COUNT(DISTINCT va.id) as total_voice_agents,
  COUNT(DISTINCT cs.id) FILTER (WHERE cs.status = 'active') as active_subscriptions,
  SUM(CASE WHEN vc.call_duration IS NOT NULL THEN vc.call_duration ELSE 0 END) as total_call_minutes
FROM agencies a
LEFT JOIN clients c ON c.agency_id = a.id
LEFT JOIN content_items ci ON ci.client_id = c.id
LEFT JOIN voice_agents va ON va.client_id = c.id
LEFT JOIN client_subscriptions cs ON cs.client_id = c.id
LEFT JOIN voice_calls vc ON vc.voice_agent_id = va.id
GROUP BY a.id, a.business_name, a.created_at
ORDER BY total_clients DESC;

GRANT SELECT ON super_admin_top_agencies TO authenticated;

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to get overview statistics
CREATE OR REPLACE FUNCTION get_super_admin_overview_stats(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  total_agencies BIGINT,
  new_agencies_period BIGINT,
  total_clients BIGINT,
  new_clients_period BIGINT,
  total_content BIGINT,
  new_content_period BIGINT,
  total_articles BIGINT,
  total_gmb_posts BIGINT,
  total_social_posts BIGINT,
  total_voice_agents BIGINT,
  new_voice_agents_period BIGINT,
  total_voice_calls BIGINT,
  total_call_minutes NUMERIC,
  active_subscriptions BIGINT,
  total_revenue_monthly NUMERIC
) AS $$
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT
    -- Agencies
    (SELECT COUNT(*) FROM agencies)::BIGINT,
    (SELECT COUNT(*) FROM agencies WHERE created_at >= COALESCE(p_start_date, created_at) AND created_at <= p_end_date)::BIGINT,

    -- Clients
    (SELECT COUNT(*) FROM clients)::BIGINT,
    (SELECT COUNT(*) FROM clients WHERE created_at >= COALESCE(p_start_date, created_at) AND created_at <= p_end_date)::BIGINT,

    -- Content total
    (SELECT COUNT(*) FROM content_items)::BIGINT,
    (SELECT COUNT(*) FROM content_items WHERE created_at >= COALESCE(p_start_date, created_at) AND created_at <= p_end_date)::BIGINT,

    -- Content by type
    (SELECT COUNT(*) FROM content_items WHERE type = 'blog_article')::BIGINT,
    (SELECT COUNT(*) FROM content_items WHERE type = 'gmb_post')::BIGINT,
    (SELECT COUNT(*) FROM content_items WHERE type = 'social_post')::BIGINT,

    -- Voice agents
    (SELECT COUNT(*) FROM voice_agents)::BIGINT,
    (SELECT COUNT(*) FROM voice_agents WHERE created_at >= COALESCE(p_start_date, created_at) AND created_at <= p_end_date)::BIGINT,

    -- Voice calls
    (SELECT COUNT(*) FROM voice_calls)::BIGINT,
    (SELECT COALESCE(SUM(call_duration), 0) / 60.0 FROM voice_calls)::NUMERIC, -- Convert seconds to minutes

    -- Subscriptions
    (SELECT COUNT(*) FROM client_subscriptions WHERE status = 'active')::BIGINT,

    -- Revenue (monthly recurring)
    (SELECT COALESCE(SUM(price_monthly), 0) FROM client_subscriptions WHERE status = 'active')::NUMERIC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get time series data for charts
CREATE OR REPLACE FUNCTION get_super_admin_time_series(
  p_metric_type TEXT,
  p_start_date DATE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  date DATE,
  count BIGINT
) AS $$
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  IF p_metric_type = 'agencies' THEN
    RETURN QUERY
    SELECT
      date_trunc('day', a.created_at)::date as date,
      COUNT(*)::BIGINT as count
    FROM agencies a
    WHERE a.created_at >= p_start_date AND a.created_at <= p_end_date
    GROUP BY date_trunc('day', a.created_at)::date
    ORDER BY date;

  ELSIF p_metric_type = 'clients' THEN
    RETURN QUERY
    SELECT
      date_trunc('day', c.created_at)::date as date,
      COUNT(*)::BIGINT as count
    FROM clients c
    WHERE c.created_at >= p_start_date AND c.created_at <= p_end_date
    GROUP BY date_trunc('day', c.created_at)::date
    ORDER BY date;

  ELSIF p_metric_type = 'content' THEN
    RETURN QUERY
    SELECT
      date_trunc('day', ci.created_at)::date as date,
      COUNT(*)::BIGINT as count
    FROM content_items ci
    WHERE ci.created_at >= p_start_date AND ci.created_at <= p_end_date
    GROUP BY date_trunc('day', ci.created_at)::date
    ORDER BY date;

  ELSIF p_metric_type = 'voice_calls' THEN
    RETURN QUERY
    SELECT
      date_trunc('day', vc.created_at)::date as date,
      COUNT(*)::BIGINT as count
    FROM voice_calls vc
    WHERE vc.created_at >= p_start_date AND vc.created_at <= p_end_date
    GROUP BY date_trunc('day', vc.created_at)::date
    ORDER BY date;

  ELSIF p_metric_type = 'subscriptions' THEN
    RETURN QUERY
    SELECT
      date_trunc('day', cs.created_at)::date as date,
      COUNT(*)::BIGINT as count
    FROM client_subscriptions cs
    WHERE cs.created_at >= p_start_date AND cs.created_at <= p_end_date AND cs.status = 'active'
    GROUP BY date_trunc('day', cs.created_at)::date
    ORDER BY date;

  ELSE
    RAISE EXCEPTION 'Invalid metric type: %', p_metric_type;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get call duration analytics
CREATE OR REPLACE FUNCTION get_super_admin_call_analytics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  total_calls BIGINT,
  total_minutes NUMERIC,
  avg_duration_seconds NUMERIC,
  successful_calls BIGINT,
  failed_calls BIGINT,
  calls_by_day JSONB
) AS $$
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    (COALESCE(SUM(vc.call_duration), 0) / 60.0)::NUMERIC,
    AVG(vc.call_duration)::NUMERIC,
    COUNT(*) FILTER (WHERE vc.status = 'completed')::BIGINT,
    COUNT(*) FILTER (WHERE vc.status = 'failed')::BIGINT,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date_trunc('day', created_at)::date,
          'calls', call_count,
          'minutes', minutes
        )
      )
      FROM (
        SELECT
          date_trunc('day', created_at)::date,
          COUNT(*) as call_count,
          SUM(call_duration) / 60.0 as minutes
        FROM voice_calls
        WHERE created_at >= COALESCE(p_start_date, created_at) AND created_at <= p_end_date
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date_trunc('day', created_at)::date DESC
        LIMIT 30
      ) daily_calls
    ) as calls_by_day
  FROM voice_calls vc
  WHERE vc.created_at >= COALESCE(p_start_date, vc.created_at) AND vc.created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agency growth metrics
CREATE OR REPLACE FUNCTION get_super_admin_growth_metrics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  period TEXT,
  agencies_added BIGINT,
  clients_added BIGINT,
  content_created BIGINT,
  subscriptions_added BIGINT,
  growth_rate_agencies NUMERIC,
  growth_rate_clients NUMERIC
) AS $$
DECLARE
  v_current_period_start DATE;
  v_previous_period_start DATE;
  v_previous_period_end DATE;
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  -- Calculate date ranges
  v_current_period_start := NOW() - (p_days || ' days')::INTERVAL;
  v_previous_period_end := v_current_period_start;
  v_previous_period_start := v_current_period_start - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  WITH current_period AS (
    SELECT
      'current' as period,
      COUNT(DISTINCT a.id) as agencies,
      COUNT(DISTINCT c.id) as clients,
      COUNT(DISTINCT ci.id) as content,
      COUNT(DISTINCT cs.id) as subscriptions
    FROM agencies a
    LEFT JOIN clients c ON c.agency_id = a.id AND c.created_at >= v_current_period_start
    LEFT JOIN content_items ci ON ci.created_at >= v_current_period_start
    LEFT JOIN client_subscriptions cs ON cs.created_at >= v_current_period_start AND cs.status = 'active'
    WHERE a.created_at >= v_current_period_start
  ),
  previous_period AS (
    SELECT
      'previous' as period,
      COUNT(DISTINCT a.id) as agencies,
      COUNT(DISTINCT c.id) as clients,
      COUNT(DISTINCT ci.id) as content,
      COUNT(DISTINCT cs.id) as subscriptions
    FROM agencies a
    LEFT JOIN clients c ON c.agency_id = a.id AND c.created_at >= v_previous_period_start AND c.created_at < v_previous_period_end
    LEFT JOIN content_items ci ON ci.created_at >= v_previous_period_start AND ci.created_at < v_previous_period_end
    LEFT JOIN client_subscriptions cs ON cs.created_at >= v_previous_period_start AND cs.created_at < v_previous_period_end AND cs.status = 'active'
    WHERE a.created_at >= v_previous_period_start AND a.created_at < v_previous_period_end
  )
  SELECT
    'Last ' || p_days || ' days',
    cp.agencies,
    cp.clients,
    cp.content,
    cp.subscriptions,
    CASE
      WHEN pp.agencies > 0 THEN ((cp.agencies - pp.agencies)::NUMERIC / pp.agencies * 100)
      ELSE 0
    END,
    CASE
      WHEN pp.clients > 0 THEN ((cp.clients - pp.clients)::NUMERIC / pp.clients * 100)
      ELSE 0
    END
  FROM current_period cp, previous_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing content
CREATE OR REPLACE FUNCTION get_super_admin_top_content(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  title TEXT,
  agency_name TEXT,
  client_name TEXT,
  created_at TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin(current_setting('request.jwt.claims', true)::json->>'email') THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT
    ci.id,
    ci.type,
    COALESCE(ci.title, LEFT(ci.content, 50)) as title,
    a.business_name as agency_name,
    c.business_name as client_name,
    ci.created_at,
    ci.status
  FROM content_items ci
  JOIN clients c ON c.id = ci.client_id
  JOIN agencies a ON a.id = c.agency_id
  ORDER BY ci.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining analytics functions
COMMENT ON FUNCTION get_super_admin_overview_stats IS 'Returns comprehensive overview statistics for super admin dashboard';
COMMENT ON FUNCTION get_super_admin_time_series IS 'Returns time series data for charts - supports agencies, clients, content, voice_calls, subscriptions';
COMMENT ON FUNCTION get_super_admin_call_analytics IS 'Returns detailed voice call analytics including duration and success rates';
COMMENT ON FUNCTION get_super_admin_growth_metrics IS 'Returns growth metrics comparing current period to previous period';
COMMENT ON FUNCTION get_super_admin_top_content IS 'Returns most recently created content items across all agencies';
