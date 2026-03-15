import axios from "axios";
import { StorageHelper } from "../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";

// export const host = 'https://getclevernote.app/api/';
export const host =
  "https://8645-2804-56c-a5bc-cf00-c9f1-2700-769b-3b68.ngrok-free.app/healthlyst/public/api/";

const axiosErrorsInterceptor = async (req) => {
  if (req?.response?.status === 401) {
    await AsyncStorage.multiRemove([
      "auth-store",
      "notifications-store",
      "rides-store",
    ]);
    // Optionally redirect to login
  }
  return Promise.reject(req);
};

export const api = axios.create({
  baseURL: host,
  timeout: 20000,
  maxRedirects: 5, // Handle redirects automatically
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.response.use(
  (response) => {
    console.log(
      "✅ API Response:",
      response.status,
      response.config.url,
      response.data
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.log(
        "❌ API Error:",
        error.response.status,
        error.config?.url,
        error.response.data
      );
    } else if (error.request) {
      console.log("🔌 Network Error:", error.config?.url, error.message);
    } else {
      console.log("⚠️ Request Error:", error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config) => {
  const newConfig = { ...config };

  // Add ngrok-specific headers
  newConfig.headers["ngrok-skip-browser-warning"] = "true";

  if (config.withCredentials) {
    const token = await StorageHelper.getAccessToken();
    newConfig.headers.Authorization = `Bearer ${token}`;
  }

  delete newConfig.withCredentials;

  return newConfig;
}, axiosErrorsInterceptor);

// Add response interceptor to handle redirects
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 302) {
      console.log("Handling 302 redirect:", error.response.headers.location);
      // You can handle the redirect manually here if needed
    }
    return Promise.reject(error);
  }
);

const auth = {
  login: (user) => {
    return api.post("login", user);
  },
  signup: (user) =>
    api.post("/register", user, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      mimeType: "multipart/form-data",
      withCredentials: false,
    }),
  appleLogin: (credential) => {
    return api.post(
      "/auth/apple/callback",
      {
        identity_token: credential.identityToken,
        user_identifier: credential.user,
        full_name: credential.fullName,
        email: credential.email,
      },
      {
        withCredentials: false,
      }
    );
  },
  googleLogin: (googleData) => {
    return api.post(
      "/auth/google/callback",
      {
        id_token: googleData.id_token,
        access_token: googleData.access_token,
      },
      {
        withCredentials: false,
      }
    );
  },
  refreshToken: (user) =>
    api.post("/api-token-refresh/", user, {
      withCredentials: false,
    }),
  signOut: (data) => {
    api.post("/logout/", data);
    delete api.defaults.headers.Authorization;
  },
  forgotPassword: (email) => api.post("/password_reset/", { email }),
};

const user = {
  get: () =>
    api.get(`/user`, {
      withCredentials: true,
    }),
  update: (usr, id) =>
    api.patch(`/patients/${id}/`, usr, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      mimeType: "multipart/form-data",
      withCredentials: true,
    }),
  changePassword: (passwords, id) =>
    api.patch(`/patients/${id}/`, passwords, {
      withCredentials: true,
    }),
  destroy: () =>
    api.delete(`/settings/profile`, {
      withCredentials: true,
    }),
};

const products = {
  index: (filters) => {
    return api
      .get(`https://dummyjson.com/posts/search`, {
        // withCredentials: true,
        params: filters,
      })
      .then((res) => res.data);
  },

  get: (id) =>
    api
      .get("https://dummyjson.com/products/" + id, {
        // withCredentials: true,
      })
      .then((res) => res.data),
  update: (id, data) => {
    return api.patch(`/products/${id}`, data, {
      withCredentials: true,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      mimeType: "multipart/form-data",
    });
  },
  store: (data) => {
    return api.post(`/products`, data, {
      withCredentials: true,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      mimeType: "multipart/form-data",
    });
  },
  delete: (id) =>
    api.delete(`/products/${id}`, {
      withCredentials: true,
    }),
};

const flashcards = {
  // Flashcard CRUD operations
  index: (filters) => {
    return api.get("/flashcards", {
      withCredentials: true,
      params: filters,
    });
  },
  get: (id) => {
    return api.get(`/flashcards/${id}`, {
      withCredentials: true,
    });
  },
  store: (data) => {
    return api.post("/flashcards", data, {
      withCredentials: true,
    });
  },
  update: (id, data) => {
    return api.patch(`/flashcards/${id}`, data, {
      withCredentials: true,
    });
  },
  delete: (id) => {
    return api.delete(`/flashcards/${id}`, {
      withCredentials: true,
    });
  },

  // Folder flashcards
  getFolderFlashcards: (folderId, filters) => {
    return api.get(`/folders/${folderId}/flashcards`, {
      withCredentials: true,
      params: filters,
    });
  },
  storeFolderFlashcard: (folderId, data) => {
    return api.post(`/folders/${folderId}/flashcards`, data, {
      withCredentials: true,
    });
  },
  updateFolderFlashcard: (folderId, flashcardId, data) => {
    return api.patch(`/folders/${folderId}/flashcards/${flashcardId}`, data, {
      withCredentials: true,
    });
  },
  deleteFolderFlashcard: (folderId, flashcardId) => {
    return api.delete(`/folders/${folderId}/flashcards/${flashcardId}`, {
      withCredentials: true,
    });
  },
};

const flashcardSets = {
  // Flashcard Sets CRUD operations
  index: (filters) => {
    return api.get("/flashcard-sets", {
      withCredentials: true,
      params: filters,
    });
  },
  get: (id) => {
    return api.get(`/flashcard-sets/${id}`, {
      withCredentials: true,
    });
  },
  store: (data) => {
    return api.post("/flashcard-sets", data, {
      withCredentials: true,
    });
  },
  update: (id, data) => {
    return api.patch(`/flashcard-sets/${id}`, data, {
      withCredentials: true,
    });
  },
  delete: (id) => {
    return api.delete(`/flashcard-sets/${id}`, {
      withCredentials: true,
    });
  },

  // Study and progress
  study: (flashcardSetId) => {
    return api.get(`/flashcard-sets/${flashcardSetId}/study`, {
      withCredentials: true,
    });
  },
  saveProgress: (flashcardSetId, progressData) => {
    return api.post(
      `/flashcard-sets/${flashcardSetId}/progress`,
      progressData,
      {
        withCredentials: true,
      }
    );
  },
};

const notes = {
  generateFlashcards: (noteId, data) => {
    return api.post(`/notes/${noteId}/generate-flashcards`, data, {
      withCredentials: true,
      timeout: 60000,
    });
  },
  index: (filters) => {
    return api.get("/notes", {
      withCredentials: true,
      params: filters,
    });
  },
  get: (id) => {
    return api.get(`/notes/${id}`, {
      withCredentials: true,
    });
  },
  store: (data) => {
    console.log(data);

    return api.post("/notes", data, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  storeWithFile: (formData) => {
    return api.post("/notes", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  update: (id, data) => {
    return api.patch(`/notes/${id}`, data, {
      withCredentials: true,
    });
  },
  delete: (id) => {
    return api.delete(`/notes/${id}`, {
      withCredentials: true,
    });
  },
};

const quizzes = {
  // Quiz CRUD operations
  index: (filters) => {
    return api.get("/quizzes", {
      withCredentials: true,
      params: filters,
    });
  },
  get: (id) => {
    return api.get(`/quizzes/${id}`, {
      withCredentials: true,
    });
  },
  store: (data) => {
    return api.post("/quizzes", data, {
      withCredentials: true,
    });
  },
  update: (id, data) => {
    return api.patch(`/quizzes/${id}`, data, {
      withCredentials: true,
    });
  },
  delete: (id) => {
    return api.delete(`/quizzes/${id}`, {
      withCredentials: true,
    });
  },

  // Quiz attempts and generation
  submitAttempt: (quizId, attemptData) => {
    return api.post(`/quizzes/${quizId}/attempt`, attemptData, {
      withCredentials: true,
    });
  },
  generateFromNote: (noteId, data) => {
    return api.post(`/quizzes/generate-from-note/${noteId}`, data, {
      withCredentials: true,
      timeout: 60000,
    });
  },

  // Quiz sharing and leaderboard
  getShared: (filters) => {
    return api.get("/quizzes/shared", {
      withCredentials: true,
      params: filters,
    });
  },
  getSharedQuiz: (quizId) => {
    return api.get(`/quizzes/shared/${quizId}`, {
      withCredentials: true,
    });
  },
  toggleSharing: (quizId, data) => {
    return api.post(`/quizzes/${quizId}/toggle-sharing`, data, {
      withCredentials: true,
    });
  },
  getLeaderboard: (quizId) => {
    return api.get(`/quizzes/${quizId}/leaderboard`, {
      withCredentials: true,
    });
  },
};

const onboarding = {
  store: (data) => {
    return api.post("/onboarding", data, {
      withCredentials: true,
    });
  },
};

const mindmaps = {
  generate: (noteId, data) => {
    return api.post(`/notes/${noteId}/generate-mindmap`, data, {
      withCredentials: true,
      timeout: 60000,
    });
  },
  get: (mindmapId) => {
    return api.get(`/mindmaps/${mindmapId}`, {
      withCredentials: true,
    });
  },
  update: (mindmapId, data) => {
    return api.patch(`/mindmaps/${mindmapId}`, data, {
      withCredentials: true,
    });
  },
};

const statistics = {
  get: () => {
    return api.get(`/statistics`, {
      withCredentials: true,
    });
  },
};

const folders = {
  // Folder CRUD operations
  index: (filters) => {
    return api.get("/folders", {
      withCredentials: true,
      params: filters,
    });
  },
  get: (id) => {
    return api.get(`/folders/${id}`, {
      withCredentials: true,
    });
  },
  store: (data) => {
    return api.post("/folders", data, {
      withCredentials: true,
    });
  },
  update: (id, data) => {
    return api.patch(`/folders/${id}`, data, {
      withCredentials: true,
    });
  },
  delete: (id) => {
    return api.delete(`/folders/${id}`, {
      withCredentials: true,
    });
  },
};

const subscriptions = {
  resume: (subscriptionId, data) => {
    return api.post(`/subscriptions/resume/${subscriptionId}`, data, {
      withCredentials: true,
    });
  },
  list: (filters) => {
    return api.get("/subscriptions/list", {
      withCredentials: true,
      params: filters,
    });
  },
  cancel: (subscriptionId, data) => {
    return api.post(`/subscriptions/cancel/${subscriptionId}`, data, {
      withCredentials: true,
    });
  },
};

const Api = {
  auth,
  user,
  products,
  flashcards,
  flashcardSets,
  notes,
  quizzes,
  onboarding,
  mindmaps,
  statistics,
  folders,
  api,
  subscriptions,
};

export default Api;
