// Local storage based client for A Wrinkle In Time
// No external dependencies needed

export const appClient = {
  auth: {
    me: async () => {
      const profile = localStorage.getItem('userProfile');
      if (profile) {
        return JSON.parse(profile);
      }
      return null;
    },
    isAuthenticated: async () => {
      const profile = localStorage.getItem('userProfile');
      return !!profile;
    },
    logout: () => {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('myFriends');
    }
  },
  entities: {
    UserProfile: {
      list: async () => {
        const profile = localStorage.getItem('userProfile');
        return profile ? [JSON.parse(profile)] : [];
      },
      filter: async () => {
        const profile = localStorage.getItem('userProfile');
        return profile ? [JSON.parse(profile)] : [];
      },
      create: async (data) => {
        localStorage.setItem('userProfile', JSON.stringify(data));
        return data;
      },
      update: async (id, data) => {
        localStorage.setItem('userProfile', JSON.stringify(data));
        return data;
      }
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Convert file to data URL for local storage
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ file_url: reader.result });
          };
          reader.readAsDataURL(file);
        });
      }
    }
  },
  appLogs: {
    logUserInApp: async () => {
      // No-op for local version
    }
  }
};
