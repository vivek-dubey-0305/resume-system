// services/integration.service.js
import axios from "axios";

class IntegrationService {
  constructor() {
    this.platforms = {
      github: {
        baseUrl: 'https://api.github.com',
        endpoints: {
          user: '/user',
          repos: '/user/repos'
        }
      },
      linkedin: {
        baseUrl: 'https://api.linkedin.com/v2',
        endpoints: {
          profile: '/me',
          positions: '/me/positions'
        }
      }
    };
  }

  // GitHub integration with pagination
  async syncGitHubData(user, accessToken) {
    try {
      let projects = [];
      let page = 1;
      let per_page = 50;
      let hasMore = true;
      while (hasMore) {
        const response = await axios.get(`${this.platforms.github.baseUrl}${this.platforms.github.endpoints.repos}?page=${page}&per_page=${per_page}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
        if (response.data.length === 0) {
          hasMore = false;
        } else {
          projects.push(...response.data.map(repo => ({
            title: repo.name,
            description: repo.description || '',
            projectUrl: repo.html_url,
            githubUrl: repo.html_url,
            startDate: repo.created_at,
            endDate: repo.updated_at,
            skills: repo.language ? [repo.language] : [],
            verified: true,
            verificationMethod: "github"
          })));
          page++;
        }
      }
      return { success: true, data: { projects } };
    } catch (error) {
      console.error("GitHub sync error:", error?.response?.data || error);
      return { success: false, error: error.message };
    }
  }

  // LinkedIn integration: fetch profile and positions
  async syncLinkedInData(user, accessToken) {
    try {
      // LinkedIn API requires OAuth 2.0 token with correct scopes
      const profileRes = await axios.get(`${this.platforms.linkedin.baseUrl}${this.platforms.linkedin.endpoints.profile}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      const positionsRes = await axios.get(`${this.platforms.linkedin.baseUrl}${this.platforms.linkedin.endpoints.positions}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      // Map LinkedIn positions to experience format
      const experience = (positionsRes.data.elements || []).map(pos => ({
        title: pos.title,
        company: pos.company?.name || '',
        startDate: pos.startDate,
        endDate: pos.endDate,
        verified: true,
        verificationMethod: "linkedin"
      }));
      return {
        success: true,
        data: {
          profile: profileRes.data,
          experience
        }
      };
    } catch (error) {
      console.error("LinkedIn sync error:", error?.response?.data || error);
      return { success: false, error: error.message };
    }
  }

  // Coursera integration (stub, replace with real API)
  async syncCourseraData(user, accessToken) {
    try {
      // Example: Coursera API endpoint for certificates (replace with real endpoint)
      // const response = await axios.get(`https://api.coursera.org/api/certificates.v1?userId=${user.courseraId}`, {
      //   headers: { 'Authorization': `Bearer ${accessToken}` }
      // });
      // const certificates = response.data.elements.map(cert => ({ ... }));
      // return { success: true, data: { certificates } };
      // DEMO ONLY:
      return {
        success: true,
        data: {
          certificates: [
            {
              title: "Machine Learning",
              issuer: "Coursera",
              issueDate: "2023-01-01",
              verified: true,
              verificationMethod: "coursera"
            }
          ]
        }
      };
    } catch (error) {
      console.error("Coursera sync error:", error?.response?.data || error);
      return { success: false, error: error.message };
    }
  }

  // Add more platform integration methods as needed
}

export const integrationService = new IntegrationService();