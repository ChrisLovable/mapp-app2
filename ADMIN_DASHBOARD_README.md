# Admin Dashboard - API Usage & Token Tracking

## Overview

A comprehensive admin dashboard system for tracking API usage and user token consumption in your application. The system provides real-time monitoring, detailed analytics, and administrative controls for managing user token allocations.

## Features

### 🎯 **Core Functionality**
- **Live Token Counter**: Real-time display of remaining tokens with visual progress bar
- **API Usage Tracking**: Comprehensive logging of all API calls with metadata
- **Cost Analysis**: Estimated costs per API call and total usage
- **Usage History**: Detailed logs with timestamps, response times, and status
- **Admin Controls**: Token reset, data export, and system management

### 📊 **Dashboard Components**
1. **Live Token Counter** - Prominent display showing tokens remaining/used
2. **API Usage Breakdown** - Cards showing usage per API with success/failure rates
3. **Usage History Table** - Detailed logs with filtering and pagination
4. **Quick Stats** - Summary cards for total requests, costs, and success rates
5. **Admin Actions** - Reset tokens, export data, and system controls

### 🔧 **Technical Features**
- **Real-time Updates**: Live token counter updates every 5 seconds
- **Automatic Logging**: All API calls are automatically tracked
- **Error Handling**: Graceful handling of API failures and network issues
- **Responsive Design**: Works on desktop and mobile devices
- **Export Functionality**: CSV export of usage data

## Database Schema

### Tables

#### `user_tokens`
```sql
CREATE TABLE user_tokens (
    user_id UUID PRIMARY KEY,
    tokens_allocated INT NOT NULL DEFAULT 1000,
    tokens_remaining INT NOT NULL DEFAULT 1000,
    tokens_used INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `api_usage_log`
```sql
CREATE TABLE api_usage_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    api_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    tokens_used INT NOT NULL,
    cost_usd NUMERIC(10,4) DEFAULT 0,
    request_data JSONB,
    response_status TEXT,
    response_time_ms INT,
    timestamp TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'success',
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES user_tokens(user_id)
);
```

#### `api_cost_config`
```sql
CREATE TABLE api_cost_config (
    id SERIAL PRIMARY KEY,
    api_name TEXT UNIQUE NOT NULL,
    tokens_per_request INT NOT NULL DEFAULT 1,
    cost_per_token_usd NUMERIC(10,6) DEFAULT 0.0001,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Backend API (Port 4002)

#### `GET /api/token-stats`
Returns comprehensive user statistics including token allocation, usage breakdown, and API-specific metrics.

**Response:**
```json
{
  "tokensAllocated": 1000,
  "tokensRemaining": 847,
  "tokensUsed": 153,
  "totalRequests": 25,
  "totalCostUsd": 0.0153,
  "apiUsage": [
    {
      "name": "image_generation",
      "requests": 5,
      "tokensUsed": 50,
      "estimatedCost": 0.005,
      "successCount": 4,
      "failureCount": 1
    }
  ]
}
```

#### `GET /api/token-usage`
Returns paginated usage history with detailed logs.

**Query Parameters:**
- `limit` (default: 50) - Number of records to return
- `offset` (default: 0) - Pagination offset

#### `POST /api/log-usage`
Logs a new API usage entry.

**Request Body:**
```json
{
  "apiName": "image_generation",
  "endpoint": "/api/replicate/predictions",
  "tokensUsed": 10,
  "requestData": { "prompt": "test" },
  "responseStatus": "200",
  "responseTimeMs": 2500,
  "status": "success"
}
```

#### `POST /api/reset-tokens`
Resets user tokens to specified allocation.

**Request Body:**
```json
{
  "tokensAllocated": 1000
}
```

#### `GET /api/export-usage`
Exports usage data in CSV or JSON format.

**Query Parameters:**
- `format` (default: "csv") - Export format
- `days` (default: 30) - Number of days to export

#### `GET /api/token-live`
Returns real-time token data for live updates.

#### `GET /api/health`
Health check endpoint.

## Frontend Components

### AdminDashboard.tsx
Main dashboard component with all monitoring features.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Close handler

### TokenTracker.ts
Utility service for automatic API usage logging.

**Key Functions:**
- `trackApiCall()` - Wraps API calls with automatic logging
- `logSuccess()` - Logs successful API calls
- `logFailure()` - Logs failed API calls
- `setEnabled()` - Enables/disables tracking

## Setup Instructions

### 1. Database Setup
```bash
# Run the database schema
psql -d your_database -f admin_dashboard_tables.sql

# Insert sample data (optional)
psql -d your_database -f admin_dashboard_sample_data.sql
```

### 2. Backend Setup
```bash
# Install dependencies
npm install express cors pg dotenv

# Start the admin API server
npm run dev:admin
```

### 3. Frontend Integration
```typescript
// Import the dashboard component
import AdminDashboard from '../components/AdminDashboard';

// Add to your main component
const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

// Add the modal
<AdminDashboard
  isOpen={isAdminDashboardOpen}
  onClose={() => setIsAdminDashboardOpen(false)}
/>
```

### 4. API Usage Tracking
```typescript
// Import the token tracker
import { tokenTracker, trackImageGeneration } from '../lib/TokenTracker';

// Automatic tracking for image generation
const result = await trackImageGeneration('a beautiful sunset');

// Manual tracking
await tokenTracker.logSuccess({
  apiName: 'custom_api',
  endpoint: '/api/custom',
  tokensUsed: 5,
  requestData: { custom: 'data' },
  responseStatus: '200',
  responseTimeMs: 1200
});
```

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Admin Dashboard API
ADMIN_API_PORT=4002
```

### API Cost Configuration
Default token costs per API call:
- **Image Generation**: 10 tokens
- **Text Generation**: 5 tokens
- **Text-to-Speech**: 2 tokens
- **Speech-to-Text**: 1 token
- **Translation**: 3 tokens
- **PDF Processing**: 5 tokens
- **Image-to-Text**: 4 tokens
- **Calendar Events**: 1 token
- **Diary Entries**: 1 token
- **Todo Management**: 1 token
- **Expense Tracking**: 1 token
- **Shopping List**: 1 token

## Usage Examples

### Basic Dashboard Access
1. Open your application
2. Navigate to the admin dashboard (via menu or direct access)
3. View live token counter and usage statistics
4. Monitor API usage breakdown
5. Review usage history

### Token Management
1. **Reset Tokens**: Click "Reset Tokens" button to restore allocation
2. **Export Data**: Click "Export Data" to download CSV report
3. **Monitor Usage**: Watch real-time token consumption

### API Integration
```typescript
// Wrap existing API calls with tracking
const originalApiCall = async () => {
  const response = await fetch('/api/some-endpoint');
  return response.json();
};

// With tracking
const trackedApiCall = () => tokenTracker.trackApiCall(
  'api_name',
  '/api/some-endpoint',
  originalApiCall,
  5, // tokens
  { custom: 'metadata' }
);
```

## Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check if admin API server is running on port 4002
   - Verify database connection
   - Check browser console for errors

2. **Token tracking not working**
   - Ensure TokenTracker is properly imported
   - Check if admin API is accessible
   - Verify database tables exist

3. **Real-time updates not working**
   - Check network connectivity
   - Verify API endpoints are responding
   - Check browser console for CORS issues

### Debug Mode
Enable debug logging by setting:
```typescript
tokenTracker.setEnabled(true);
console.log('Token tracking enabled:', tokenTracker.isTrackingEnabled());
```

## Security Considerations

1. **Authentication**: Implement proper user authentication for admin access
2. **Authorization**: Restrict admin dashboard to authorized users only
3. **Data Privacy**: Ensure sensitive request data is properly sanitized
4. **Rate Limiting**: Implement rate limiting on admin API endpoints
5. **Audit Logging**: Log all admin actions for security auditing

## Future Enhancements

- **Multi-user Support**: Admin dashboard for multiple users
- **Advanced Analytics**: Charts and graphs for usage patterns
- **Alert System**: Notifications for low tokens or high usage
- **Billing Integration**: Direct integration with payment systems
- **Usage Quotas**: Configurable usage limits per user
- **API Rate Limiting**: Built-in rate limiting based on token consumption

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database schema
3. Verify API endpoints are responding
4. Check browser console for errors
5. Ensure all dependencies are installed

---

**Note**: This admin dashboard is designed for development and testing. For production use, implement proper authentication, authorization, and security measures. 