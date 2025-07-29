const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_API_PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.VITE_SUPABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to get current user ID (mock for now)
const getCurrentUserId = () => {
  // In a real app, this would come from JWT token or session
  return '00000000-0000-0000-0000-000000000000'; // Default user ID
};

// API Routes

// Get user token statistics
app.get('/api/token-stats', async (req, res) => {
  try {
    const userId = getCurrentUserId();
    
    // Get user stats
    const statsQuery = `
      SELECT * FROM get_user_stats($1)
    `;
    const statsResult = await pool.query(statsQuery, [userId]);
    
    if (statsResult.rows.length === 0) {
      // Create user if doesn't exist
      await pool.query(`
        INSERT INTO user_tokens (user_id, tokens_allocated, tokens_remaining, tokens_used)
        VALUES ($1, 1000, 1000, 0)
        ON CONFLICT (user_id) DO NOTHING
      `, [userId]);
      
      // Get stats again
      const newStatsResult = await pool.query(statsQuery, [userId]);
      return res.json(newStatsResult.rows[0]);
    }
    
    // Get API usage breakdown
    const breakdownQuery = `
      SELECT * FROM get_api_usage_breakdown($1, 30)
    `;
    const breakdownResult = await pool.query(breakdownQuery, [userId]);
    
    const stats = statsResult.rows[0];
    const apiUsage = breakdownResult.rows.map(row => ({
      name: row.api_name,
      requests: parseInt(row.requests_count),
      tokensUsed: parseInt(row.tokens_used),
      estimatedCost: parseFloat(row.total_cost_usd),
      successCount: parseInt(row.success_count),
      failureCount: parseInt(row.failure_count)
    }));
    
    res.json({
      tokensAllocated: stats.tokens_allocated,
      tokensRemaining: stats.tokens_remaining,
      tokensUsed: stats.tokens_used,
      totalRequests: parseInt(stats.total_requests),
      totalCostUsd: parseFloat(stats.total_cost_usd),
      apiUsage
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({ error: 'Failed to fetch token statistics' });
  }
});

// Get usage history
app.get('/api/token-usage', async (req, res) => {
  try {
    const userId = getCurrentUserId();
    const { limit = 50, offset = 0 } = req.query;
    
    const query = `
      SELECT 
        id,
        api_name,
        endpoint,
        tokens_used,
        cost_usd,
        response_status,
        response_time_ms,
        timestamp,
        status,
        error_message
      FROM api_usage_log 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    const usage = result.rows.map(row => ({
      id: row.id,
      api: row.api_name,
      endpoint: row.endpoint,
      tokens: row.tokens_used,
      costUsd: parseFloat(row.cost_usd),
      responseStatus: row.response_status,
      responseTimeMs: row.response_time_ms,
      timestamp: row.timestamp,
      status: row.status,
      errorMessage: row.error_message
    }));
    
    res.json(usage);
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

// Log API usage
app.post('/api/log-usage', async (req, res) => {
  try {
    const userId = getCurrentUserId();
    const {
      apiName,
      endpoint,
      sourceModal,
      tokensUsed,
      requestData,
      responseStatus,
      responseTimeMs,
      status,
      errorMessage
    } = req.body;

    // Use the log_api_usage function
    const result = await pool.query(`
      SELECT log_api_usage($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      userId,
      apiName,
      endpoint,
      sourceModal,
      tokensUsed,
      responseStatus,
      responseTimeMs,
      status,
      errorMessage,
      requestData ? JSON.stringify(requestData) : null,
      null // responseData
    ]);

    res.json({ 
      success: true, 
      logId: result.rows[0].log_api_usage,
      message: 'API usage logged successfully' 
    });
  } catch (error) {
    console.error('Error logging API usage:', error);
    res.status(500).json({ error: 'Failed to log API usage' });
  }
});

// Reset user tokens
app.post('/api/reset-tokens', async (req, res) => {
  try {
    const userId = getCurrentUserId();
    const { tokensAllocated = 1000 } = req.body;
    
    const query = `
      INSERT INTO user_tokens (user_id, tokens_allocated, tokens_remaining, tokens_used)
      VALUES ($1, $2, $2, 0)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        tokens_allocated = $2,
        tokens_remaining = $2,
        tokens_used = 0,
        updated_at = NOW()
    `;
    
    await pool.query(query, [userId, tokensAllocated]);
    
    res.json({ success: true, message: 'Tokens reset successfully' });
  } catch (error) {
    console.error('Error resetting tokens:', error);
    res.status(500).json({ error: 'Failed to reset tokens' });
  }
});

// Export usage data
app.get('/api/export-usage', async (req, res) => {
  try {
    const userId = getCurrentUserId();
    const { format = 'csv', days = 30 } = req.query;
    
    const query = `
      SELECT 
        timestamp,
        api_name,
        endpoint,
        tokens_used,
        cost_usd,
        response_status,
        response_time_ms,
        status,
        error_message
      FROM api_usage_log 
      WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '1 day' * $2
      ORDER BY timestamp DESC
    `;
    
    const result = await pool.query(query, [userId, days]);
    
    if (format === 'json') {
      res.json(result.rows);
    } else {
      // CSV format
      const csvHeader = 'Timestamp,API Name,Endpoint,Tokens Used,Cost USD,Response Status,Response Time (ms),Status,Error Message\n';
      const csvData = result.rows.map(row => 
        `"${row.timestamp}","${row.api_name}","${row.endpoint}",${row.tokens_used},${row.cost_usd},"${row.response_status}",${row.response_time_ms},"${row.status}","${row.error_message || ''}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="usage-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    }
  } catch (error) {
    console.error('Error exporting usage data:', error);
    res.status(500).json({ error: 'Failed to export usage data' });
  }
});

// Get real-time token updates (for WebSocket or polling)
app.get('/api/token-live', async (req, res) => {
  try {
    const userId = getCurrentUserId();
    
    const query = `
      SELECT tokens_remaining, tokens_used, updated_at
      FROM user_tokens 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ tokensRemaining: 1000, tokensUsed: 0, updatedAt: new Date() });
    }
    
    const data = result.rows[0];
    res.json({
      tokensRemaining: data.tokens_remaining,
      tokensUsed: data.tokens_used,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Error fetching live token data:', error);
    res.status(500).json({ error: 'Failed to fetch live token data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Admin Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Admin Dashboard API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 