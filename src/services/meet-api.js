// travel-tour-frontend/src/services/meet-api.js
import { MEET_API_BASE_URL } from './api';

// 🆕 USE REACT ENV VARIABLE AS FALLBACK
const API_BASE_URL = MEET_API_BASE_URL || process.env.REACT_APP_MEET_API_BASE_URL || 'https://travel-tour-academy-backend.onrender.com/api/meet';

console.log('🔗 Meet API Base URL:', API_BASE_URL);

class MeetApiService {
  // 🆕 ADD MISSING BASE URL PROPERTY
  static baseUrl = API_BASE_URL;

  // 🆕 ADD MISSING updateMeetingStatus FUNCTION
  static async updateMeetingStatus(meetingId, status) {
    try {
      console.log('🔄 Updating meeting status:', { meetingId, status });
      
      const response = await fetch(`${this.baseUrl}/${meetingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        console.warn('⚠️ Meeting status update failed, but continuing...');
        return { success: false, error: 'Status update not supported' };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('⚠️ Meeting status update error (non-critical):', error);
      return { success: false, error: error.message };
    }
  }

  // 🆕 FIXED uploadFileResource FUNCTION
  static async uploadFileResource(meetingId, file, title, description, userData) {
    try {
      console.log('📤 Uploading actual file via service:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('meetingId', meetingId);
      formData.append('resourceType', 'document'); // Changed from 'type'
      formData.append('title', title || file.name);
      formData.append('content', description || `File: ${file.name}`);
      formData.append('fileName', file.name);
      formData.append('uploadedBy', userData?.id || 'admin'); // Changed from 'sharedBy'
      formData.append('uploadedByName', userData?.name || userData?.username || 'Admin'); // Changed from 'sharedByName'
      formData.append('createdAt', new Date().toISOString());

      console.log('📤 Uploading file resource with FormData...');
      
      const response = await fetch(`${this.baseUrl}/resources/share`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it automatically
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ File upload response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Meet API upload file resource error:', error);
      throw error;
    }
  }

  // 🆕 KEEP EXISTING uploadFileResource AS ALIAS FOR COMPATIBILITY
  static async uploadFileResourceOld(formData) {
    try {
      console.log('📤 Uploading file resource with FormData...');
      
      const response = await fetch(`${this.baseUrl}/resources/share`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ File upload response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API upload file resource error:', error);
      return { 
        success: false, 
        error: 'Failed to upload file',
        details: error.message 
      };
    }
  }

  // KEEP ALL YOUR EXISTING FUNCTIONS EXACTLY AS THEY ARE
  static async createMeeting(adminId, title, description = '', adminName = '') {
    try {
      console.log('🎯 Creating meeting with:', { adminId, title, description, adminName });
      const response = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, title, description, adminName })
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
      const response = await fetch(`${API_BASE_URL}/active`);
      
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
      const response = await fetch(`${API_BASE_URL}/${meetingId}/extend`, {
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
      const response = await fetch(`${API_BASE_URL}/${meetingId}/end`, {
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
      const response = await fetch(`${API_BASE_URL}/resources/share-json`, {
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
      const response = await fetch(`${API_BASE_URL}/resources/meeting/${meetingId}`);
      
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
      const response = await fetch(`${API_BASE_URL}/uploads/upload`, {
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
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/access`, {
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

  static async recordResourceAccess(resourceId, userId, action = 'view') {
    try {
      console.log('🎯 Recording resource access:', { resourceId, userId, action });
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Resource access recorded:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API record resource access error:', error);
      return { 
        success: false, 
        error: 'Failed to record access',
        details: error.message 
      };
    }
  }

  static async getMeetingHistory(adminId) {
    try {
      console.log('🎯 Fetching meeting history for admin:', adminId);
      const response = await fetch(`${API_BASE_URL}/history/${adminId}`);
      
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
      const response = await fetch(`${API_BASE_URL}/${meetingId}/participants`);
      
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

  static async joinMeeting(meetingId, userData) {
    try {
      console.log('🎯 Enhanced join meeting:', { meetingId, userData });
      
      const userId = typeof userData === 'object' ? (userData?.id || userData?.userId) : userData;
      const userName = typeof userData === 'object' ? (userData?.name || userData?.username || 'Participant') : 'Participant';
      
      const response = await fetch(`${API_BASE_URL}/${meetingId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Enhanced join meeting response:', result);
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
      const response = await fetch(`${API_BASE_URL}/${meetingId}/leave`, {
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
      const response = await fetch(`${API_BASE_URL}/health`);
      
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

  static async clearAllMeetings() {
    try {
      console.log('🧹 Clearing all meetings...');
      const response = await fetch(`${API_BASE_URL}/clear-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Clear meetings response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API clear meetings error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async getAllMeetings() {
    try {
      console.log('🎯 Fetching all meetings for debugging...');
      const response = await fetch(`${API_BASE_URL}/debug/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ All meetings response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API get all meetings error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async getAllMeetingResources(meetingId) {
    try {
      console.log('🎯 Fetching ALL resources for meeting:', meetingId);
      const response = await fetch(`${API_BASE_URL}/resources/meeting/${meetingId}/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ All meeting resources response:', result);
      return result;
    } catch (error) {
      console.error('❌ Meet API get all meeting resources error:', error);
      return { 
        success: false, 
        error: 'Meet service unavailable',
        details: error.message 
      };
    }
  }

  static async deleteResource(resourceId, adminId) {
    try {
      console.log('🗑️ API: Deleting resource with admin ID:', resourceId, adminId);
      
      const response = await fetch(`${this.baseUrl}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId })
      });

      const data = await response.json();
      console.log('🗑️ API Delete response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ API Error deleting resource:', error);
      return { success: false, error: error.message };
    }
  }
}

export default MeetApiService;