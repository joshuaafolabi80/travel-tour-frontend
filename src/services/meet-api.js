// travel-tour-frontend/src/services/meet-api.js
import { MEET_API_BASE_URL } from './api';

class MeetApiService {
  static async createMeeting(adminId, title, description = '') {
    try {
      console.log('🎯 Creating meeting with:', { adminId, title, description });
      const response = await fetch(`${MEET_API_BASE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, title, description })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meeting creation response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API create meeting error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async getActiveMeeting() {
    try {
      console.log('🎯 Fetching active meeting...');
      const response = await fetch(`${MEET_API_BASE_URL}/active`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Active meeting response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API get active meeting error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async extendMeeting(meetingId, adminId) {
    try {
      console.log('🎯 Extending meeting:', { meetingId, adminId });
      const response = await fetch(`${MEET_API_BASE_URL}/${meetingId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meeting extension response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API extend meeting error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async endMeeting(meetingId, adminId) {
    try {
      console.log('🎯 Ending meeting:', { meetingId, adminId });
      const response = await fetch(`${MEET_API_BASE_URL}/${meetingId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meeting end response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API end meeting error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async shareResource(resourceData) {
    try {
      console.log('🎯 Sharing resource:', resourceData);
      const response = await fetch(`${MEET_API_BASE_URL}/resources/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Resource share response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API share resource error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async getMeetingResources(meetingId) {
    try {
      console.log('🎯 Fetching meeting resources for:', meetingId);
      const response = await fetch(`${MEET_API_BASE_URL}/resources/meeting/${meetingId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meeting resources response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API get resources error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async uploadFile(formData) {
    try {
      console.log('🎯 Uploading file...');
      const response = await fetch(`${MEET_API_BASE_URL}/uploads/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ File upload response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API upload file error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async trackResourceAccess(resourceId, userId, device = 'web', action = 'view') {
    try {
      console.log('🎯 Tracking resource access:', { resourceId, userId, device, action });
      const response = await fetch(`${MEET_API_BASE_URL}/resources/${resourceId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, device, action })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Resource access tracking response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API track access error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async getMeetingHistory(adminId) {
    try {
      console.log('🎯 Fetching meeting history for admin:', adminId);
      const response = await fetch(`${MEET_API_BASE_URL}/history/${adminId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meeting history response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API get meeting history error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async getMeetingParticipants(meetingId) {
    try {
      console.log('🎯 Fetching meeting participants for:', meetingId);
      const response = await fetch(`${MEET_API_BASE_URL}/${meetingId}/participants`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meeting participants response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API get participants error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async joinMeeting(meetingId, userId, userName) {
    try {
      console.log('🎯 Joining meeting:', { meetingId, userId, userName });
      const response = await fetch(`${MEET_API_BASE_URL}/${meetingId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Join meeting response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API join meeting error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async leaveMeeting(meetingId, userId) {
    try {
      console.log('🎯 Leaving meeting:', { meetingId, userId });
      const response = await fetch(`${MEET_API_BASE_URL}/${meetingId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Leave meeting response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API leave meeting error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async healthCheck() {
    try {
      console.log('🎯 Performing meet service health check...');
      const response = await fetch(`${MEET_API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Meet service health check:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API health check error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }
}

export default MeetApiService;