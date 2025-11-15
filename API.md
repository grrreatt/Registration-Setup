# API Documentation

Complete API reference for the Enterprise-Grade QR Check-in System.

## 🔗 Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## 🔐 Authentication

Most endpoints require proper authentication and authorization:

- **Rate Limiting**: All endpoints have rate limiting applied
- **Origin Validation**: Requests are validated against allowed origins
- **Input Validation**: All inputs are validated and sanitized

## 📊 Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "data": {}, // Response data (on success)
  "error": "Error message", // Error message (on failure)
  "details": {} // Additional error details (on validation errors)
}
```

## 🎯 Endpoints

### Registration

#### POST `/api/register`

Register a new attendee for an event.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "event_id": "uuid",
  "category": "delegate",
  "institution": "University of Example",
  "meal_entitled": true,
  "kit_entitled": false,
  "notes": "Optional notes"
}
```

**Response (Success):**
```json
{
  "success": true,
  "badge_uid": "REG123456789",
  "attendee_name": "John Doe",
  "event_name": "Medical Conference 2025"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "You are already registered for this event"
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

### Check-in

#### POST `/api/checkin`

Check in an attendee for a specific type.

**Request Body:**
```json
{
  "badge_uid": "REG123456789",
  "check_in_type": "meal",
  "location": "Main Hall",
  "notes": "Optional notes",
  "checked_in_by": "system"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendee_name": "John Doe",
    "check_in_type": "meal",
    "checked_in_at": "2024-01-15T14:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Already checked in for meal"
}
```

**Rate Limit:** 10 requests per minute per IP

#### GET `/api/checkin`

Get attendee information and check-in status.

**Query Parameters:**
- `badge_uid` (required): Badge UID to lookup

**Example:**
```
GET /api/checkin?badge_uid=REG123456789
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "badge_uid": "REG123456789",
    "full_name": "John Doe",
    "email": "john@example.com",
    "category": "delegate",
    "institution": "University of Example",
    "meal_entitled": true,
    "kit_entitled": false,
    "events": {
      "event_name": "Medical Conference 2025",
      "event_date": "2025-01-15"
    },
    "check_ins": [
      {
        "check_in_type": "meal",
        "checked_in_at": "2024-01-15T14:30:00Z",
        "location": "Main Hall"
      }
    ]
  }
}
```

**Rate Limit:** 30 requests per minute per IP

---

### Events

#### GET `/api/events`

Get list of events.

**Query Parameters:**
- `active` (optional): Filter for active events (`true`/`false`)
- `limit` (optional): Number of events to return (default: 50)

**Example:**
```
GET /api/events?active=true&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_code": "MEDCONF25",
      "event_name": "Medical Conference 2025",
      "event_date": "2025-01-15",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/events`

Create a new event (Admin only).

**Request Body:**
```json
{
  "event_code": "MEDCONF25",
  "event_name": "Medical Conference 2025",
  "event_date": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_code": "MEDCONF25",
    "event_name": "Medical Conference 2025",
    "event_date": "2025-01-15",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Rate Limit:** 100 requests per minute per IP

---

### Attendees

#### GET `/api/attendees`

Search attendees.

**Query Parameters:**
- `query` (required): Search query (name, email, or badge UID)
- `event_id` (optional): Filter by event ID
- `limit` (optional): Number of results (default: 20, max: 100)

**Example:**
```
GET /api/attendees?query=John&event_id=uuid&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "badge_uid": "REG123456789",
      "full_name": "John Doe",
      "email": "john@example.com",
      "category": "delegate",
      "institution": "University of Example",
      "meal_entitled": true,
      "kit_entitled": false,
      "created_at": "2024-01-01T00:00:00Z",
      "events": {
        "event_name": "Medical Conference 2025",
        "event_date": "2025-01-15"
      },
      "check_ins": [
        {
          "check_in_type": "meal",
          "checked_in_at": "2024-01-15T14:30:00Z"
        }
      ]
    }
  ]
}
```

**Rate Limit:** 30 requests per minute per IP

#### POST `/api/attendees`

Create a new attendee (Admin only).

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "institution": "University of Example",
  "event_id": "uuid",
  "category": "delegate",
  "meal_entitled": true,
  "kit_entitled": false,
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "badge_uid": "REG123456789",
    "full_name": "John Doe",
    "email": "john@example.com",
    "category": "delegate",
    "institution": "University of Example",
    "meal_entitled": true,
    "kit_entitled": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

### Admin Endpoints

#### GET `/api/admin/analytics`

Get system analytics and statistics.

**Query Parameters:**
- `event_id` (optional): Filter by event ID
- `period` (optional): Time period (`1d`, `7d`, `30d`, `90d`, `1y`)

**Example:**
```
GET /api/admin/analytics?period=7d&event_id=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAttendees": 150,
      "totalCheckIns": 120,
      "totalEvents": 5,
      "period": "7d"
    },
    "checkInBreakdown": {
      "meal": 45,
      "kit": 30,
      "general": 45
    },
    "categoryBreakdown": {
      "delegate": 100,
      "faculty": 30,
      "speaker": 20
    },
    "entitlementsBreakdown": {
      "mealEntitled": 80,
      "kitEntitled": 50,
      "bothEntitled": 30
    },
    "dailyStats": [
      {
        "date": "2024-01-15",
        "registrations": 10,
        "checkIns": 8
      }
    ],
    "topEvents": [
      {
        "id": "uuid",
        "name": "Medical Conference 2025",
        "date": "2025-01-15",
        "attendeeCount": 150
      }
    ]
  }
}
```

**Rate Limit:** 100 requests per minute per IP

#### GET `/api/admin/attendees`

Get attendees with filtering and pagination (Admin only).

**Query Parameters:**
- `event_id` (optional): Filter by event ID
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "badge_uid": "REG123456789",
      "full_name": "John Doe",
      "email": "john@example.com",
      "category": "delegate",
      "institution": "University of Example",
      "meal_entitled": true,
      "kit_entitled": false,
      "created_at": "2024-01-01T00:00:00Z",
      "events": {
        "event_name": "Medical Conference 2025",
        "event_date": "2025-01-15"
      },
      "check_ins": [
        {
          "check_in_type": "meal",
          "checked_in_at": "2024-01-15T14:30:00Z",
          "location": "Main Hall"
        }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

#### PUT `/api/admin/attendees`

Update attendee information (Admin only).

**Query Parameters:**
- `id` (required): Attendee ID

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "category": "faculty",
  "institution": "Updated University",
  "meal_entitled": false,
  "kit_entitled": true,
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "badge_uid": "REG123456789",
    "full_name": "John Doe Updated",
    "email": "john.updated@example.com",
    "category": "faculty",
    "institution": "Updated University",
    "meal_entitled": false,
    "kit_entitled": true,
    "notes": "Updated notes",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

#### DELETE `/api/admin/attendees`

Delete an attendee (Admin only).

**Query Parameters:**
- `id` (required): Attendee ID

**Response:**
```json
{
  "success": true,
  "message": "Attendee deleted successfully"
}
```

**Rate Limit:** 100 requests per minute per IP

---

### Health Check

#### GET `/api/health`

Check system health and status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T14:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "45ms"
    },
    "api": {
      "status": "healthy",
      "responseTime": "45ms"
    }
  },
  "uptime": 86400,
  "memory": {
    "used": 128,
    "total": 256,
    "unit": "MB"
  }
}
```

---

## 🔒 Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service down |

## 📝 Data Types

### Attendee Categories
- `delegate`
- `faculty`
- `chairperson`
- `exhibitor`
- `staff`
- `speaker`
- `organizer`

### Check-in Types
- `meal`
- `kit`
- `general`

### Date Formats
- All dates are in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Date-only fields: `YYYY-MM-DD`

## 🧪 Testing

### Test Endpoints

Use the following test data for development:

```json
{
  "test_event": {
    "id": "test-event-uuid",
    "event_code": "TEST2024",
    "event_name": "Test Event 2024",
    "event_date": "2024-12-31"
  },
  "test_attendee": {
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "institution": "Test University",
    "category": "delegate",
    "meal_entitled": true,
    "kit_entitled": false
  }
}
```

### Rate Limit Testing

Test rate limits with:
```bash
# Test registration rate limit (5 per 15 minutes)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/register \
    -H "Content-Type: application/json" \
    -d '{"full_name":"Test User","email":"test'$i'@example.com","phone":"+1234567890","event_id":"test-event-uuid","category":"delegate","institution":"Test University","meal_entitled":true,"kit_entitled":false}'
done
```

## 🔧 SDK Examples

### JavaScript/TypeScript

```typescript
class QRCheckInAPI {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async register(attendeeData: any) {
    const response = await fetch(`${this.baseURL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendeeData)
    });
    return response.json();
  }
  
  async checkIn(badgeUID: string, checkInType: string) {
    const response = await fetch(`${this.baseURL}/api/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badge_uid: badgeUID,
        check_in_type: checkInType
      })
    });
    return response.json();
  }
  
  async getAttendee(badgeUID: string) {
    const response = await fetch(`${this.baseURL}/api/checkin?badge_uid=${badgeUID}`);
    return response.json();
  }
}

// Usage
const api = new QRCheckInAPI('https://yourdomain.com');
const result = await api.register({
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  event_id: 'event-uuid',
  category: 'delegate',
  institution: 'University',
  meal_entitled: true,
  kit_entitled: false
});
```

### Python

```python
import requests
import json

class QRCheckInAPI:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def register(self, attendee_data):
        response = requests.post(
            f"{self.base_url}/api/register",
            headers={"Content-Type": "application/json"},
            data=json.dumps(attendee_data)
        )
        return response.json()
    
    def check_in(self, badge_uid, check_in_type):
        response = requests.post(
            f"{self.base_url}/api/checkin",
            headers={"Content-Type": "application/json"},
            data=json.dumps({
                "badge_uid": badge_uid,
                "check_in_type": check_in_type
            })
        )
        return response.json()
    
    def get_attendee(self, badge_uid):
        response = requests.get(
            f"{self.base_url}/api/checkin",
            params={"badge_uid": badge_uid}
        )
        return response.json()

# Usage
api = QRCheckInAPI("https://yourdomain.com")
result = api.register({
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "event_id": "event-uuid",
    "category": "delegate",
    "institution": "University",
    "meal_entitled": True,
    "kit_entitled": False
})
```

---

This API documentation provides complete reference for integrating with the QR Check-in System. For additional support, please refer to the main documentation or contact the development team.


