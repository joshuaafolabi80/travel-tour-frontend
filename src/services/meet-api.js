// travel-tour-frontend/src/services/meet-api.js
const MEET_MODULE_BASE_URL = 'https://travel-tour-academy-backend.onrender.com';

class MeetApiService {
  static async createMeeting(adminId, title, description = '') {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, title, description })
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API create meeting error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async getActiveMeeting() {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/active`);
      return await response.json();
    } catch (error) {
      console.error('Meet API get active meeting error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async extendMeeting(meetingId, adminId) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/${meetingId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API extend meeting error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async endMeeting(meetingId, adminId) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/${meetingId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API end meeting error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async shareResource(resourceData) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/resources/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData)
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API share resource error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async getMeetingResources(meetingId) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/resources/meeting/${meetingId}`);
      return await response.json();
    } catch (error) {
      console.error('Meet API get resources error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async uploadFile(formData) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/uploads/upload`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API upload file error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async trackResourceAccess(resourceId, userId, device = 'web', action = 'view') {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/resources/${resourceId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, device, action })
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API track access error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async getMeetingHistory(adminId) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/history/${adminId}`);
      return await response.json();
    } catch (error) {
      console.error('Meet API get meeting history error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async getMeetingParticipants(meetingId) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/${meetingId}/participants`);
      return await response.json();
    } catch (error) {
      console.error('Meet API get participants error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async joinMeeting(meetingId, userId, userName) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/${meetingId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API join meeting error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }

  static async leaveMeeting(meetingId, userId) {
    try {
      const response = await fetch(`${MEET_MODULE_BASE_URL}/api/meet/${meetingId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await response.json();
    } catch (error) {
      console.error('Meet API leave meeting error:', error);
      return { success: false, error: 'Meet service unavailable' };
    }
  }
}

export default MeetApiService;