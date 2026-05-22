import React, { useState, useEffect, createContext, useContext, useReducer, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Webcam from "react-webcam";

// --- API Configuration ---
// STEP 1: Set this to false to use your REAL backend
const USE_MOCK_API = false; 

// STEP 2: Set this to your running Flask server address
const API_BASE_URL = window.__API_URL__ || 'https://proctorxanalyser-1.onrender.com';
// -------------------------

// --- SVG Icons ---
const CheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const PlusIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const TrashIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);
const LogOutIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);
const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const EyeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const DownloadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);
const ClipboardCheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path>
  </svg>
);
const AlertTriangleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const LoaderIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);


const UploadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);
const FileTextIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

// --- Auth Context ---
const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGOUT':
      localStorage.clear();
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOAD_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    default:
      return state;
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
  });
  // initializing: true while we check localStorage — prevents flash of login page for logged-in users
  const [initializing, setInitializing] = React.useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        dispatch({ type: 'LOAD_USER', payload: { token, user: JSON.parse(user) } });
      } catch (e) {
        localStorage.clear(); // corrupt data — clear it
      }
    }
    setInitializing(false); // done checking — now render the app
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- API Layer (Real & Mock) ---

// This is the REAL API that talks to your Flask backend
const realApi = {
  login: async (username, password, role) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },
  register: async (username, email, password, role) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },
  
  // --- Forgot Password ---
  sendOtp: async (email) => {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },
  verifyOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');
    return data; // { reset_token }
  },
  resetPassword: async (reset_token, new_password) => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_token, new_password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  // --- Teacher Functions ---
  createExam: async (examData, token) => {
    const res = await fetch(`${API_BASE_URL}/exams`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(examData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create exam');
    }
    return res.json();
  },
  getTeacherExams: async (token) => {
    const res = await fetch(`${API_BASE_URL}/exams/teacher`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch exams');
    return res.json();
  },
  getExamResults: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch results');
    }
    return res.json();
  },
  downloadExamResults: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/results?format=csv`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to download results');
    }
    
    // Trigger file download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_results_${examId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  deleteExam: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete exam');
    }
    return res.json();
  },

  updateExamSchedule: async (examId, scheduledStart, scheduledEnd, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ scheduledStart, scheduledEnd }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update schedule');
    }
    return res.json();
  },
  
  // --- Student Functions ---
  
  // Look up exam by short code (e.g. "AB3K7Z") — returns { examId, title }
  getExamByCode: async (code, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/code/${encodeURIComponent(code.trim().toUpperCase())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Exam code not found');
    }
    return res.json();
  },

  // NEW: Get exam details BEFORE starting
  getExamDetails: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      // Attach opensAt so the UI can show a live countdown even on 403
      const e = new Error(err.error || 'Failed to get exam details');
      e.opensAt = err.opensAt || null; // UTC ISO string from backend
      throw e;
    }
    return res.json();
  },

  startExam: async (examId, studentInfo, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ studentInfo }), // Send student info
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start exam');
    }
    return res.json();
  },
  getExamQuestions: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get questions');
    }
    return res.json();
  },
  submitExam: async (examId, answers, proctorLogs, snapshots, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ answers, proctorLogs, snapshots }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit exam');
    }
    return res.json();
  },

  autoSaveAnswers: async (examId, answers, token) => {
    try {
      await fetch(`${API_BASE_URL}/exams/${examId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
    } catch (e) {} // silent fail
  },

  getStudentHistory: async (token) => {
    const res = await fetch(`${API_BASE_URL}/student/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to fetch history'); }
    return res.json();
  },

  getExamByCode: async (code, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/code/${encodeURIComponent(code.trim().toUpperCase())}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Exam code not found'); }
    return res.json();
  },

  getExamReport: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/report`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to fetch report'); }
    return res.json();
  },

  getExamAnalytics: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to fetch analytics'); }
    return res.json();
  },

  getMyAnalytics: async (examId, token) => {
    const res = await fetch(`${API_BASE_URL}/exams/${examId}/my-analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to fetch analytics'); }
    return res.json();
  },
};

// This is the MOCK API for frontend-only development
const mockApi = {
  // Mock database
  _users: [
    { _id: 't1', username: 'teacher', email: 't@t.com', password: 'pass', role: 'teacher' },
    { _id: 's1', username: 'student', email: 's@s.com', password: 'pass', role: 'student' }
  ],
  _exams: [],
  _questions: {},
  _results: [],
  
  login: async (username, password, role) => {
    await new Promise(res => setTimeout(res, 500));
    const user = mockApi._users.find(u => u.username === username && u.password === password && u.role === role);
    if (user) {
      const token = `mock-token-${user._id}`;
      return { token, user: { username: user.username, email: user.email, role: user.role } };
    } else {
      throw new Error('Invalid username, password, or role');
    }
  },
  register: async (username, email, password, role) => {
    await new Promise(res => setTimeout(res, 500));
    if (mockApi._users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    const newUser = { _id: `u${Date.now()}`, username, email, password, role };
    mockApi._users.push(newUser);
    const token = `mock-token-${newUser._id}`;
    return { token, user: { username: newUser.username, email: newUser.email, role: newUser.role } };
  },
  createExam: async (examData, token) => {
    await new Promise(res => setTimeout(res, 500));
    const newExam = {
      _id: `e${Date.now()}`,
      title: examData.title,
      duration: parseInt(examData.duration) * 60,
      questionCount: examData.questions.length,
      totalMarks: examData.questions.reduce((sum, q) => sum + parseInt(q.marks), 0),
      showResults: examData.showResults,
      requiredFields: examData.requiredFields,
      createdBy: 'teacher' // Mocked
    };
    mockApi._exams.push(newExam);
    
    mockApi._questions[newExam._id] = examData.questions.map((q, i) => ({
      _id: `q${newExam._id}_${i}`,
      examId: newExam._id,
      ...q
    }));
    return { message: "Exam created successfully!", exam: newExam };
  },
  getTeacherExams: async (token) => {
    await new Promise(res => setTimeout(res, 500));
    return mockApi._exams;
  },
  getExamResults: async (examId, token) => {
    await new Promise(res => setTimeout(res, 500));
    const exam = mockApi._exams.find(e => e._id === examId);
    const requiredFields = exam.requiredFields || [];
    const results = mockApi._results.filter(r => r.examId === examId);
    
    // Add studentInfo to results
    return results.map(r => {
        const fullResult = {...r};
        for (const field of requiredFields) {
            fullResult[field] = r.studentInfo[field] || "N/A";
        }
        return fullResult;
    });
  },
  downloadExamResults: async (examId, token) => {
    await new Promise(res => setTimeout(res, 500));
    alert("Mock Download: CSV would be generated here.");
  },
  deleteExam: async (examId, token) => {
    await new Promise(res => setTimeout(res, 500));
    mockApi._exams = mockApi._exams.filter(e => e._id !== examId);
    mockApi._results = mockApi._results.filter(r => r.examId !== examId);
    delete mockApi._questions[examId];
    return { message: "Exam deleted" };
  },
  // NEW: Get exam details
  getExamDetails: async (examId, token) => {
    await new Promise(res => setTimeout(res, 200));
    const exam = mockApi._exams.find(e => e._id === examId);
    if (!exam) {
        throw new Error("Exam not found");
    }
     // Check if student already submitted
    if (mockApi._results.find(r => r.examId === examId)) {
        throw new Error("You have already completed this exam");
    }
    return {
        title: exam.title,
        duration: exam.duration,
        questionCount: exam.questionCount,
        requiredFields: exam.requiredFields || []
    };
  },
  startExam: async (examId, studentInfo, token) => {
    await new Promise(res => setTimeout(res, 500));
    if (!mockApi._exams.find(e => e._id === examId)) {
        throw new Error("Exam not found");
    }
    if (mockApi._results.find(r => r.examId === examId)) {
        throw new Error("You have already completed this exam");
    }
    // In mock, we just proceed. The studentInfo is saved on submit.
    return { message: "Exam started", status: "started", studentInfo: studentInfo };
  },
  getExamQuestions: async (examId, token) => {
    await new Promise(res => setTimeout(res, 500));
    const questions = mockApi._questions[examId];
    if (!questions) {
      throw new Error('Exam not found');
    }
    const exam = mockApi._exams.find(e => e._id === examId);
    // Shuffle and remove answers
    return [...questions].sort(() => 0.5 - Math.random()).map(q => {
      const { answers, ...rest } = q;
      rest.duration = exam.duration; // Add duration
      return rest;
    });
  },
  submitExam: async (examId, answers, proctorLogs, token) => {
    await new Promise(res => setTimeout(res, 500));
    const questions = mockApi._questions[examId];
    const exam = mockApi._exams.find(e => e._id === examId);
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    const totalMarks = questions.reduce((sum, q) => sum + parseInt(q.marks), 0);
    
    // Find the studentInfo that was *supposed* to be saved
    // In mock, we just make it up
    const mockStudentInfo = {};
    if (exam.requiredFields) {
        exam.requiredFields.forEach(f => mockStudentInfo[f] = "Mock Data");
    }

    for (const q_id in answers) {
      const question = questions.find(q => q._id === q_id);
      const submitted = answers[q_id] || [];
      if (question && JSON.stringify(submitted.sort()) === JSON.stringify(question.answers.sort())) {
        score += parseInt(question.marks);
        correct++;
      } else {
        incorrect++;
      }
    }
    const result = {
      _id: `r${Date.now()}`,
      studentUsername: "student",
      examId: examId,
      studentInfo: mockStudentInfo,
      score: score,
      totalMarks: totalMarks,
      correct: correct,
      incorrect: incorrect,
      proctorLogs: proctorLogs,
      submittedAt: new Date()
    };
    mockApi._results.push(result);
    
    // Check if teacher wants to show results
    const show_results = exam.showResults;
    
    const response_data = {
        message: "Exam submitted successfully",
        showResults: show_results
    };
    
    if (show_results) {
        response_data.score = score;
        response_data.totalMarks = totalMarks;
        response_data.correct = correct;
        response_data.incorrect = incorrect;
    }

    return response_data;
  },
};

// Use this 'api' object throughout the app
const api = USE_MOCK_API ? mockApi : realApi;

// --- Helper Hooks & Components ---

// Hook for handling API calls with loading and error states
function useApi(apiFunction) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const callApi = async (...args) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      setState({ data: null, loading: false, error: err.message });
      throw err;
    }
  };

  return [callApi, state.data, state.loading, state.error];
}

// ─── IST Timezone Helpers ─────────────────────────────────────
// Always render in Asia/Kolkata — correct on any browser, no manual offset added.
const fmtIST = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST';
};
const secsUntil = (iso) => iso ? Math.floor((new Date(iso).getTime() - Date.now()) / 1000) : null;
// ─────────────────────────────────────────────────────────────

// Button Component
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  const disabledStyle = "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabledStyle} ${className}`}
      {...props}
    >
      {disabled && <LoaderIcon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// Input Component
const Input = React.forwardRef(({ type = 'text', label, name, value, onChange, placeholder, error, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      ref={ref}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));

// PasswordInput — Input with an eye toggle
const PasswordInput = ({ label, name, value, onChange, placeholder = '••••••••', ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full">
      {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            // Eye-off icon
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7a9.77 9.77 0 012.168-3.793M6.343 6.343A9.956 9.956 0 0112 5c5 0 9 4 9 7a9.77 9.77 0 01-1.635 3.024M15 12a3 3 0 01-3 3m0 0a3 3 0 01-3-3m3 3v.01M3 3l18 18" />
            </svg>
          ) : (
            // Eye icon
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

// Checkbox Component
const Checkbox = ({ label, name, checked, onChange, ...props }) => (
  <label className="flex items-center gap-2 text-sm text-gray-700">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      {...props}
    />
    {label}
  </label>
);

// ConfirmationModal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- NEW: Proctor Warning Modal Component ---
function ProctorWarningModal({ isOpen, onClose, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-gray-700 text-lg mb-6">{message}</p>
        <Button variant="primary" onClick={onClose} className="w-full">
          I Understand
        </Button>
      </div>
    </div>
  );
}


// ── Forgot Password Flow ──────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  // step: 'email' | 'otp' | 'reset' | 'done'
  const [step, setStep]               = useState('email');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [resetToken, setResetToken]   = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [info, setInfo]               = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(''); setInfo('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const data = await api.sendOtp(email.trim().toLowerCase());
      // Dev mode: backend returns the OTP directly when SMTP is not configured
      if (data.dev_otp) {
        setInfo(`[DEV MODE] SMTP not configured. Your OTP is: ${data.dev_otp}`);
      } else {
        setInfo('OTP sent! Check your inbox (and spam/junk folder).');
      }
      setStep('otp');
      setResendCooldown(60);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const data = await api.verifyOtp(email.trim().toLowerCase(), otp.trim());
      setResetToken(data.reset_token);
      setStep('reset');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPwd) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.resetPassword(resetToken, newPassword);
      setStep('done');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        {/* Step: email */}
        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Forgot Password?</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your registered email and we'll send you an OTP.</p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input label="Email Address" name="fp-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </Button>
            </form>
          </>
        )}

        {/* Step: otp */}
        {step === 'otp' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Enter OTP</h3>
              <p className="text-sm text-gray-500 mt-1">A 6-digit OTP was sent to <strong>{email}</strong>.</p>
            </div>
            {info && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-3">{info}</p>}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit OTP</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="______"
                  className="w-full text-center text-3xl font-mono tracking-[.4em] px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </Button>
              <div className="text-center text-sm text-gray-500">
                Didn't receive it?{' '}
                {resendCooldown > 0
                  ? <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  : <button type="button" onClick={handleSendOtp} className="text-blue-600 hover:underline font-medium">Resend OTP</button>
                }
              </div>
            </form>
          </>
        )}

        {/* Step: reset */}
        {step === 'reset' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Set New Password</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a strong new password for your account.</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <PasswordInput label="New Password" name="new-pwd" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} required />
              <PasswordInput label="Confirm Password" name="confirm-pwd" value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)} required />
              {/* Strength hint */}
              {newPassword && (
                <div className="flex gap-1 h-1">
                  {[1,2,3,4].map(i => {
                    const len = newPassword.length;
                    const hasUpper = /[A-Z]/.test(newPassword);
                    const hasNum   = /\d/.test(newPassword);
                    const hasSpec  = /[^A-Za-z0-9]/.test(newPassword);
                    const strength = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                    const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'];
                    return <div key={i} className={`flex-1 rounded-full ${i <= strength ? colors[strength-1] : 'bg-gray-200'}`} />;
                  })}
                </div>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Saving…' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h3>
            <p className="text-sm text-gray-500 mb-6">Your password has been updated. You can now log in with your new password.</p>
            <Button variant="primary" className="w-full" onClick={onClose}>Back to Login</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage({ onBack }) {
  const { user, dispatch } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info'); // 'info' | 'password'
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Info form state
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [bio,       setBio]       = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const token = localStorage.getItem('token');
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API_BASE_URL}/profile`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setMsg({ type: 'error', text: data.error }); return; }
        setProfile(data);
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatarUrl || '');
      })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load profile.' }))
      .finally(() => setLoading(false));
  }, []);

  const saveInfo = async () => {
    setMsg({ type: '', text: '' });
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ fullName, email, phone, bio, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: data.error }); return; }
      setProfile(data.profile);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setMsg({ type: '', text: '' });
    if (newPw !== confirmPw) { setMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6)    { setMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile/change-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: data.error }); return; }
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setMsg({ type: 'success', text: 'Password changed successfully!' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.fullName || profile?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
              : initials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile?.fullName || profile?.username || '...'}</h2>
            <p className="text-blue-100 capitalize">{profile?.role} · {profile?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {['info', 'password'].map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg({ type: '', text: '' }); }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'info' ? 'Profile Info' : 'Change Password'}
            </button>
          ))}
        </div>

        <div className="px-5 sm:px-8 py-5 sm:py-7">
          {/* Alert */}
          {msg.text && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.text}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoaderIcon className="w-8 h-8 text-blue-500" /></div>
          ) : tab === 'info' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-gray-400">(cannot change)</span></label>
                  <input value={profile?.username || ''} disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9999999999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL <span className="text-gray-400">(optional)</span></label>
                <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/photo.jpg"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio <span className="text-gray-400">(max 300 chars)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell something about yourself..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <p className="text-xs text-gray-400 mt-1">{bio.length}/300</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveInfo} disabled={saving} variant="primary" className="px-6">
                  {saving ? <><LoaderIcon className="w-4 h-4 mr-2" />Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input value={currentPw} onChange={e => setCurrentPw(e.target.value)} type="password" placeholder="Enter current password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input value={newPw} onChange={e => setNewPw(e.target.value)} type="password" placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input value={confirmPw} onChange={e => setConfirmPw(e.target.value)} type="password" placeholder="Repeat new password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={savePassword} disabled={saving} variant="primary" className="px-6">
                  {saving ? <><LoaderIcon className="w-4 h-4 mr-2" />Saving...</> : 'Change Password'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Auth Components (Login/Register) ---
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [role, setRole] = useState('student');
  const [showForgot, setShowForgot] = useState(false);
  
  const { dispatch } = useAuth();
  const [callLogin, , loginLoading, loginError] = useApi(api.login);
  const [callRegister, , registerLoading, registerError] = useApi(api.register);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  const loading = loginLoading || registerLoading;
  const error = loginError || registerError;

  const validateEmail = (val) => {
    if (!val) { setEmailError('Email is required.'); return false; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(ok ? '' : 'Please enter a valid email address.');
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin) {
      if (!validateEmail(email)) return;
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        return;
      }
      setConfirmPasswordError('');
    }
    try {
      let data;
      if (isLogin) {
        data = await callLogin(username, password, role);
        dispatch({ type: 'LOGIN', payload: data });
      } else {
        await callRegister(username, email, password, role);
        // After successful registration → redirect to login form
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setRegisterSuccess(true);
      }
    } catch (err) {
      // handled by useApi
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 sm:p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {/* Registration success banner */}
        {registerSuccess && isLogin && (
          <div className="mb-4 flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span><strong>Account created successfully!</strong> Please log in with your credentials.</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="john.doe"
            required
          />
          
          {!isLogin && (
            <div>
              <Input 
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={(e) => validateEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
              />
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>
          )}

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!isLogin && (
            <div>
              <PasswordInput
                label="Confirm Password"
                name="confirm-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
                placeholder="••••••••"
                required
              />
              {confirmPasswordError && <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>}
            </div>
          )}

          {/* Role dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Forgot password link — login only */}
          {isLogin && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </form>
        
        <p className="text-sm text-center text-gray-600 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => { setIsLogin(!isLogin); setEmailError(''); setConfirmPasswordError(''); setRegisterSuccess(false); }}
            className="font-medium text-blue-600 hover:text-blue-500 ml-1"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// --- App Components (Main) ---

function App() {
  const { isAuthenticated, initializing, user, dispatch } = useAuth();

  const [page, setPage] = useState('dashboard');

  const navigate = (pageName, queryParams = {}) => {
    setPage(pageName);
    const params = new URLSearchParams();
    params.set('page', pageName);
    Object.keys(queryParams).forEach(k => params.set(k, queryParams[k]));
    window.history.pushState({}, '', '?' + params.toString());
  };

  // Browser back/forward
  useEffect(() => {
    const onPop = () => {
      const p = new URLSearchParams(window.location.search).get('page') || 'dashboard';
      setPage(p);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // After login → always go to dashboard with clean URL
  const prevAuthRef = React.useRef(isAuthenticated);
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      setPage('dashboard');
      window.history.replaceState({}, '', window.location.pathname);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // While checking localStorage, show a blank loading screen
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderIcon className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ANY URL visited while not logged in → Login page
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  const renderPage = () => {
    const getExamId = (prefix) => {
      const part = page.split(prefix)[1];
      if (!part) return null;
      return part.split('&')[0].split('?')[0];
    };

    if (page === 'profile')                   return <ProfilePage onBack={() => navigate('dashboard')} />;
    if (page.startsWith('create-exam'))     return <CreateExamForm onExamCreated={() => navigate('dashboard')} />;
    if (page.startsWith('publish-result-')) {
      const examId    = page.replace('publish-result-', '');
      const examTitle = pageParams?.title || 'Exam';
      return <PublishResultPage examId={examId} examTitle={examTitle} onBack={() => navigate('dashboard')} />;
    }
    if (page.startsWith('my-result-')) {
      const examId    = page.replace('my-result-', '');
      const examTitle = pageParams?.title || 'Exam';
      return <StudentMyResultPage examId={examId} examTitle={examTitle} onBack={() => navigate('dashboard')} />;
    }
    if (page.startsWith('report-')) {
      const examId = getExamId('report-');
      const examTitle = new URLSearchParams(window.location.search).get('title');
      return <ExamReportPage examId={examId} examTitle={examTitle} onBack={() => navigate('dashboard')} />;
    }
    if (page.startsWith('view-results-')) {
      const examId = getExamId('view-results-');
      const examTitle = new URLSearchParams(window.location.search).get('title');
      return <ViewResultsPage examId={examId} examTitle={examTitle} onBack={() => navigate('dashboard')} />;
    }
    if (page.startsWith('analytics-')) {
    const examId = page.replace('analytics-', '');
    return <StudentAnalyticsPage examId={examId} examTitle="Exam Analytics" onBack={() => setPage('student-dashboard')} />;
  }

  if (page.startsWith('start-exam-')) {
      const examId = getExamId('start-exam-');
      return <StartExamPage examId={examId} onBack={() => navigate('dashboard')} onStartExam={() => navigate('take-exam-' + examId)} />;
    }
    if (page.startsWith('take-exam-')) {
      return <ExamTakingPage examId={getExamId('take-exam-')} onSubmitSuccess={() => navigate('dashboard')} />;
    }
    return <Dashboard setPage={navigate} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onProfile={() => navigate('profile')} onLogout={() => {
        dispatch({ type: 'LOGOUT' });
        window.history.replaceState({}, '', window.location.pathname);
        setPage('dashboard');
      }} />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {renderPage()}
      </main>
    </div>
  );
}

function Header({ user, onLogout, onProfile }) {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">SmartProctor</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 hidden sm:block">
            Welcome, <strong className="capitalize">{user.username}</strong> ({user.role})
          </span>
          <Button onClick={onProfile} variant="secondary" className="px-3 py-1.5 text-sm">
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          <Button onClick={onLogout} variant="secondary" className="px-3 py-1.5 text-sm">
            <LogOutIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function Dashboard({ setPage }) {
  const { user } = useAuth();
  return (
    <div>
      {user.role === 'teacher' ? (
        <TeacherDashboard setPage={setPage} />
      ) : (
        <StudentDashboard setPage={setPage} />
      )}
    </div>
  );
}

// --- Teacher Components ---
function TeacherDashboard({ setPage }) {
  const { token } = useAuth();
  const [callGetExams, exams, loading, error] = useApi(api.getTeacherExams);
  const [callDeleteExam, , deleteLoading, deleteError] = useApi(api.deleteExam);
  const [callUpdateSchedule, , scheduleLoading, scheduleError] = useApi(api.updateExamSchedule);
  
  // Delete modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  // Schedule modal state
  const [scheduleModalExam, setScheduleModalExam] = useState(null);
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd,   setSchedEnd]   = useState('');
  const [schedMsg,   setSchedMsg]   = useState('');

  useEffect(() => {
    callGetExams(token);
  }, []);

  const handleViewResults = (exam) => {
    setPage(`view-results-${exam._id}`, { title: exam.title });
  };

  const openDeleteConfirmation = (exam) => {
    setExamToDelete(exam);
    setIsModalOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setExamToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!examToDelete) return;
    try {
      await callDeleteExam(examToDelete._id, token);
      callGetExams(token);
    } catch (err) {}
    finally { closeDeleteConfirmation(); }
  };

  // Open schedule modal pre-filled with existing schedule
  const openScheduleModal = (exam) => {
    setScheduleModalExam(exam);
    // Convert stored UTC ISO string → IST for the datetime-local input.
    // Use Intl to extract IST parts — correct on any browser, no manual offset.
    const toISTLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d)) return '';
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(d);
      const get = (t) => parts.find(p => p.type === t)?.value || '00';
      const hh = get('hour') === '24' ? '00' : get('hour');
      return `${get('year')}-${get('month')}-${get('day')}T${hh}:${get('minute')}`;
    };
    setSchedStart(toISTLocal(exam.scheduledStart));
    setSchedEnd(toISTLocal(exam.scheduledEnd));
    setSchedMsg('');
  };

  const closeScheduleModal = () => {
    setScheduleModalExam(null);
    setSchedStart('');
    setSchedEnd('');
    setSchedMsg('');
  };

  const handleScheduleSave = async () => {
    if (schedStart && schedEnd && new Date(schedStart) >= new Date(schedEnd)) {
      setSchedMsg('End time must be after start time.');
      return;
    }
    // Convert IST datetime-local value → UTC ISO string for the backend.
    // We split the string manually and use Date.UTC so the browser's own
    // timezone is never involved — then subtract 5:30 to go from IST → UTC.
    const istToUTC = (localStr) => {
      if (!localStr) return null;
      const [datePart, timePart] = localStr.split('T');
      const [y, mo, d] = datePart.split('-').map(Number);
      const [h, mi]    = timePart.split(':').map(Number);
      // Date.UTC treats these as UTC; subtract IST offset (5h30m) to get real UTC
      const utcMs = Date.UTC(y, mo - 1, d, h, mi) - (5.5 * 60 * 60 * 1000);
      return new Date(utcMs).toISOString();
    };
    try {
      await callUpdateSchedule(scheduleModalExam._id, istToUTC(schedStart) || null, istToUTC(schedEnd) || null, token);
      setSchedMsg('Schedule saved!');
      callGetExams(token);
      setTimeout(closeScheduleModal, 1000);
    } catch (err) {
      setSchedMsg(scheduleError || 'Failed to save schedule.');
    }
  };

  const handleClearSchedule = async () => {
    setSchedStart('');
    setSchedEnd('');
    try {
      await callUpdateSchedule(scheduleModalExam._id, null, null, token);
      setSchedMsg('Schedule cleared.');
      callGetExams(token);
      setTimeout(closeScheduleModal, 1000);
    } catch (err) {
      setSchedMsg('Failed to clear schedule.');
    }
  };

  // Helper: human-readable schedule badge for exam card
  const getScheduleBadge = (exam) => {
    if (!exam.scheduledStart && !exam.scheduledEnd) return null;
    const now = new Date();
    const start = exam.scheduledStart ? new Date(exam.scheduledStart) : null;
    const end   = exam.scheduledEnd   ? new Date(exam.scheduledEnd)   : null;
    // Use pre-formatted IST strings from backend if available, else format client-side
    const startIST = exam.scheduledStartIST || fmtIST(exam.scheduledStart);
    const endIST   = exam.scheduledEndIST   || fmtIST(exam.scheduledEnd);
    if (end && now > end)     return { label: 'Closed',    color: 'bg-red-100 text-red-700',     detail: `Ended ${endIST}` };
    if (start && now < start) return { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700', detail: `Opens ${startIST}` };
    return { label: 'Open', color: 'bg-green-100 text-green-700', detail: end ? `Closes ${endIST}` : 'No end time set' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Teacher Dashboard</h2>
        <Button onClick={() => setPage('create-exam')} className="w-full sm:w-auto">
          <PlusIcon className="w-5 h-5" />
          Create New Exam
        </Button>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Your Exams</h3>
        {loading && <LoaderIcon className="w-8 h-8 mx-auto" />}
        {error && <p className="text-red-500">{error}</p>}
        {deleteError && <p className="text-red-500 mb-4">Error deleting exam: {deleteError}</p>}
        {exams && exams.length === 0 && !loading && (
          <p className="text-gray-500">You haven't created any exams yet.</p>
        )}
        {exams && exams.length > 0 && (
          <ul className="space-y-4">
            {exams.map(exam => {
              const badge = getScheduleBadge(exam);
              return (
              <li key={exam._id} className="p-4 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-semibold text-gray-900">{exam.title}</h4>
                    {badge && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {exam.questionCount} questions | {exam.totalMarks} marks | {exam.duration / 60} minutes
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
                    Code: <code className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-sm">{exam.examCode || '—'}</code>
                    <span className="hidden sm:inline text-gray-400">(ID: <code className="bg-gray-100 p-0.5 rounded text-xs break-all">{exam._id}</code>)</span>
                  </p>
                  {badge && (
                    <p className="text-xs text-gray-500 mt-0.5">{badge.detail}</p>
                  )}
                </div>
                <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
                  <Button onClick={() => handleViewResults(exam)} variant="secondary" className="w-full sm:w-auto">
                    <EyeIcon className="w-5 h-5" />
                    View Results
                  </Button>
                  <Button onClick={() => setPage(`report-${exam._id}`, { title: exam.title })} variant="secondary" className="w-full sm:w-auto">
                    📊 Report
                  </Button>
                  <Button onClick={() => setPage(`publish-result-${exam._id}`, { title: exam.title })} variant="secondary" className="w-full sm:w-auto">
                    🏆 Generate Result
                  </Button>
                  <Button onClick={() => openScheduleModal(exam)} variant="secondary" className="w-full sm:w-auto">
                    🗓 Schedule
                  </Button>
                  <Button onClick={() => openDeleteConfirmation(exam)} variant="danger" disabled={deleteLoading} className="w-full sm:w-auto">
                    <TrashIcon className="w-5 h-5" />
                    Delete
                  </Button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModalExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Schedule Exam Window</h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{scheduleModalExam.title}</strong> — set when students can access this exam.
              Leave both fields empty to allow access anytime.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date &amp; Time <span className="text-blue-600 font-semibold">(IST — India Standard Time)</span>
                </label>
                <input
                  type="datetime-local"
                  value={schedStart}
                  onChange={(e) => setSchedStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date &amp; Time <span className="text-blue-600 font-semibold">(IST — India Standard Time)</span>
                </label>
                <input
                  type="datetime-local"
                  value={schedEnd}
                  onChange={(e) => setSchedEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-400">✅ Enter times in IST (UTC+5:30). Students outside this window will be blocked.</p>
            </div>
            {schedMsg && (
              <p className={`text-sm mt-3 font-medium ${schedMsg.includes('saved') || schedMsg.includes('cleared') ? 'text-green-600' : 'text-red-600'}`}>
                {schedMsg}
              </p>
            )}
            <div className="flex justify-between mt-5 gap-2">
              <Button variant="secondary" onClick={handleClearSchedule} disabled={scheduleLoading}>
                Clear Schedule
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={closeScheduleModal}>Cancel</Button>
                <Button variant="primary" onClick={handleScheduleSave} disabled={scheduleLoading}>
                  {scheduleLoading ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title="Delete Exam?"
        message={`Are you sure you want to delete "${examToDelete?.title}"? This will also delete all student submissions and cannot be undone.`}
      />
    </div>
  );
}

// ── ImageLightbox ─────────────────────────────────────────────────────────────
// Shows a thumbnail during exam; clicking opens a fullscreen overlay so the
// student can inspect the image clearly without leaving the question.
function ImageLightbox({ src, alt }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = React.useRef(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const closeModal = () => { setOpen(false); setScale(1); setPos({ x: 0, y: 0 }); };

  const zoomIn  = (e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 5)); };
  const zoomOut = (e) => { e.stopPropagation(); setScale(s => { const n = Math.max(s - 0.5, 1); if (n === 1) setPos({ x:0, y:0 }); return n; }); };
  const resetZoom = (e) => { e.stopPropagation(); setScale(1); setPos({ x: 0, y: 0 }); };

  // Scroll-wheel zoom
  const onWheel = (e) => {
    e.preventDefault();
    setScale(s => {
      const next = e.deltaY < 0 ? Math.min(s + 0.25, 5) : Math.max(s - 0.25, 1);
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  };

  // Drag-to-pan when zoomed
  const onMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };
  const onMouseUp = () => setDragging(false);

  return (
    <>
      {/* ── Thumbnail ── */}
      <div className="mb-5">
        <div className="relative inline-block group cursor-zoom-in" onClick={() => setOpen(true)}>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-56 rounded-xl border border-gray-200 object-contain shadow-sm transition-transform group-hover:scale-[1.02]"
          />
          {/* Zoom hint overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl bg-black/20">
            <span className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M11 8v6M8 11h6"/></svg>
              Click to enlarge
            </span>
          </div>
        </div>
      </div>

      {/* ── Lightbox modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* Toolbar */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
            <button onClick={zoomOut} disabled={scale <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-lg font-bold disabled:opacity-30 transition-colors"
              title="Zoom out">−</button>
            <span className="text-white text-sm font-mono bg-white/10 px-2 py-0.5 rounded-full min-w-[52px] text-center"
              onClick={resetZoom} title="Click to reset" style={{cursor:'pointer'}}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} disabled={scale >= 5}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-lg font-bold disabled:opacity-30 transition-colors"
              title="Zoom in">+</button>
            <button onClick={closeModal}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/80 text-white text-xl font-bold transition-colors ml-2"
              title="Close (Esc)">✕</button>
          </div>

          {/* Zoom hint bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs pointer-events-none select-none">
            Scroll to zoom · Drag to pan · Click outside or press Esc to close
          </div>

          {/* Image container */}
          <div
            className="overflow-hidden flex items-center justify-center"
            style={{ width: '100vw', height: '100vh' }}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: dragging ? 'none' : 'transform 0.15s ease',
                cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                userSelect: 'none',
                borderRadius: '12px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ── TopicManager ──────────────────────────────────────────────────────────────
// Teacher defines topic names, then assigns questions to each topic.
// A question already assigned to one topic is hidden from other topics' pickers.
function TopicManager({ questions, onTopicsChange }) {
  // topics: [{ name: string, questionIndices: number[] }]
  const [topics, setTopics]           = useState([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [expandedTopic, setExpanded]  = useState(null); // topic index currently open

  // Sync topic assignments back to questions array
  const syncToQuestions = (updatedTopics) => {
    // Build a map: questionIndex → topicName
    const topicMap = {};
    updatedTopics.forEach(t => {
      t.questionIndices.forEach(qi => { topicMap[qi] = t.name; });
    });
    const updatedQuestions = questions.map((q, i) => ({
      ...q,
      topic: topicMap[i] || q.topic || '',
    }));
    onTopicsChange(updatedQuestions);
  };

  const addTopic = () => {
    const name = newTopicName.trim();
    if (!name) return;
    if (topics.find(t => t.name.toLowerCase() === name.toLowerCase())) return;
    const updated = [...topics, { name, questionIndices: [] }];
    setTopics(updated);
    setNewTopicName('');
    setExpanded(updated.length - 1);
  };

  const removeTopic = (tIdx) => {
    const updated = topics.filter((_, i) => i !== tIdx);
    setTopics(updated);
    syncToQuestions(updated);
    if (expandedTopic === tIdx) setExpanded(null);
  };

  const renameTopic = (tIdx, name) => {
    const updated = topics.map((t, i) => i === tIdx ? { ...t, name } : t);
    setTopics(updated);
    syncToQuestions(updated);
  };

  const toggleQuestion = (tIdx, qIdx) => {
    const updated = topics.map((t, i) => {
      if (i !== tIdx) return t;
      const has = t.questionIndices.includes(qIdx);
      return {
        ...t,
        questionIndices: has
          ? t.questionIndices.filter(x => x !== qIdx)
          : [...t.questionIndices, qIdx],
      };
    });
    setTopics(updated);
    syncToQuestions(updated);
  };

  // Which question indices are already assigned to OTHER topics (not tIdx)
  const assignedElsewhere = (tIdx) => {
    const s = new Set();
    topics.forEach((t, i) => { if (i !== tIdx) t.questionIndices.forEach(qi => s.add(qi)); });
    return s;
  };

  // Questions that have text (skip blank placeholders)
  const usableQuestions = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.text && q.text.trim().length > 0);

  if (questions.filter(q => q.text?.trim()).length === 0) {
    return null; // Don't show until at least one question has text
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-indigo-500">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Topic Assignment</h3>
          <p className="text-xs text-gray-500">Add topics, then select which questions belong to each. Each question can only belong to one topic.</p>
        </div>
      </div>

      {/* ── Add topic input ── */}
      <div className="flex flex-col sm:flex-row gap-2 mt-5 mb-4">
        <input
          type="text"
          value={newTopicName}
          onChange={e => setNewTopicName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
          placeholder="e.g. Algebra, Thermodynamics, World War II…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="button"
          onClick={addTopic}
          disabled={!newTopicName.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Topic
        </button>
      </div>

      {topics.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
          No topics yet — type a topic name above and click Add Topic.
        </p>
      )}

      {/* ── Topic accordion list ── */}
      <div className="space-y-3">
        {topics.map((topic, tIdx) => {
          const elsewhere = assignedElsewhere(tIdx);
          const isOpen = expandedTopic === tIdx;
          const count = topic.questionIndices.length;

          return (
            <div key={tIdx} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Topic header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : tIdx)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  <input
                    type="text"
                    value={topic.name}
                    onChange={e => renameTopic(tIdx, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="font-semibold text-sm text-gray-800 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-indigo-300 focus:px-2 rounded w-48"
                  />
                  <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                    {count} question{count !== 1 ? 's' : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeTopic(tIdx)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove topic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

              {/* Question picker */}
              {isOpen && (
                <div className="px-4 py-3 space-y-2 bg-white">
                  {usableQuestions.length === 0 && (
                    <p className="text-xs text-gray-400">No questions with text yet. Add question text below first.</p>
                  )}
                  {usableQuestions.map(({ q, i }) => {
                    const isAssignedHere = topic.questionIndices.includes(i);
                    const isAssignedElsewhere = elsewhere.has(i);
                    const disabled = isAssignedElsewhere && !isAssignedHere;

                    return (
                      <label
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                          ${isAssignedHere    ? 'border-indigo-300 bg-indigo-50'  : ''}
                          ${disabled          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : ''}
                          ${!isAssignedHere && !disabled ? 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30' : ''}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isAssignedHere}
                          disabled={disabled}
                          onChange={() => !disabled && toggleQuestion(tIdx, i)}
                          className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            Q{i + 1}: {q.text.length > 80 ? q.text.slice(0, 80) + '…' : q.text}
                          </p>
                          {isAssignedElsewhere && !isAssignedHere && (
                            <p className="text-xs text-orange-500 mt-0.5">
                              Already assigned to "{topics.find((t, ti) => ti !== tIdx && t.questionIndices.includes(i))?.name}"
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{q.marks}mk</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {topics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-2">Assignment summary:</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-full font-medium">
                {t.name}: {t.questionIndices.length} Q
              </span>
            ))}
            {(() => {
              const assigned = new Set(topics.flatMap(t => t.questionIndices));
              const unassigned = usableQuestions.filter(({ i }) => !assigned.has(i)).length;
              return unassigned > 0
                ? <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">{unassigned} unassigned</span>
                : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── QuestionImageUpload ───────────────────────────────────────────────────────
// Lets a teacher pick an image from their device, uploads it to the backend,
// and shows a persistent preview. Students load it from /images/<id>.
function QuestionImageUpload({ imageUrl, onUploaded, onRemoved }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const inputRef = React.useRef();

  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_MB  = 5;

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError('Only JPEG, PNG, GIF and WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB} MB (this file is ${(file.size/1024/1024).toFixed(1)} MB).`);
      return;
    }

    setUploading(true);
    try {
      // Read as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // strip data-URI prefix
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data:     base64,
          mimeType: file.type,
          filename: file.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed.'); return; }

      // imageUrl is a path like /images/<id> — make it absolute
      onUploaded(`${API_BASE_URL}${data.imageUrl}`);
    } catch (e) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {imageUrl ? (
        // ── Preview ───────────────────────────────────────────────────────────
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Question"
            className="max-h-48 max-w-full rounded-lg border border-gray-200 object-contain shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => { onRemoved(); if (inputRef.current) inputRef.current.value = ''; }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow"
            title="Remove image"
          >✕</button>
          <p className="mt-1 text-xs text-gray-400">Click ✕ to remove and upload a different image.</p>
        </div>
      ) : (
        // ── Drop zone / picker ────────────────────────────────────────────────
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors
            ${uploading ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <>
              <LoaderIcon className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600 font-medium">Uploading image…</p>
            </>
          ) : (
            <>
              <UploadIcon className="w-8 h-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">Click or drag & drop an image here</p>
              <p className="text-xs text-gray-400">JPEG · PNG · GIF · WEBP · max 5 MB</p>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function CreateExamForm({ onExamCreated }) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [showResults, setShowResults] = useState(true); 
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], answers: [], marks: 1, imageUrl: '' }
  ]);
  const [requiredFields, setRequiredFields] = useState([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd]     = useState('');
  
  const [callCreateExam, , loading, error] = useApi(api.createExam);
  const [examLink, setExamLink] = useState(null);
  const [copied, setCopied] = useState(false);

  // PDF Import state
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfStatus, setPdfStatus]       = useState(null); // {type:'success'|'error'|'info', msg:''}
  const pdfInputRef = useRef(null);

  const handlePdfImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfStatus({ type: 'error', msg: 'Please select a valid PDF file.' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setPdfStatus({ type: 'error', msg: 'PDF is too large (max 20 MB). Please use a smaller file.' });
      return;
    }

    setPdfImporting(true);
    setPdfStatus({ type: 'info', msg: `Reading "${file.name}" and extracting questions with AI...` });

    try {
      // Convert PDF to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // POST to our Flask backend — avoids CORS blocking of direct browser→Anthropic calls
      const response = await fetch(`${API_BASE_URL}/import-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pdf: base64Data, filename: file.name }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');

      const imported = data.questions;

      // Replace blank default question, or append to existing ones
      setQuestions(prev => {
        const isDefaultBlank = prev.length === 1 && !prev[0].text && prev[0].options.every(o => !o);
        return isDefaultBlank ? imported : [...prev, ...imported];
      });

      setPdfStatus({
        type: 'success',
        msg: `✅ Imported ${data.count} question${data.count !== 1 ? 's' : ''} from "${file.name}". Review and adjust if needed.`
      });
    } catch (err) {
      setPdfStatus({ type: 'error', msg: `Import failed: ${err.message}` });
    } finally {
      setPdfImporting(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleTopicsChange = (updatedQuestions) => {
    setQuestions(updatedQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };
  
  const handleAnswerChange = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    const answerSet = new Set(question.answers); // This will now store indices, e.g., [0, 2]
    
    if (answerSet.has(oIndex)) {
      answerSet.delete(oIndex);
    } else {
      answerSet.add(oIndex);
    }
    
    question.answers = Array.from(answerSet);
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', options: ['', '', '', ''], answers: [], marks: 1 }
    ]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };
  
  // --- NEW: Functions for Required Student Fields ---
  const addRequiredField = () => {
    setRequiredFields([...requiredFields, '']);
  };
  
  const removeRequiredField = (index) => {
    setRequiredFields(requiredFields.filter((_, i) => i !== index));
  };
  
  const handleRequiredFieldChange = (index, value) => {
    const newFields = [...requiredFields];
    newFields[index] = value;
    setRequiredFields(newFields);
  };
  // --- End of new functions ---
  
  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for insecure contexts (like http)
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleSubmit = async () => {
    if (questions.some(q => q.answers.length === 0)) {
        alert("Please select at least one correct answer for every question.");
        return;
    }
    
    // Create a deep copy to avoid mutating state
    const questionsForApi = JSON.parse(JSON.stringify(questions));
    let allOptionsFilled = true;
    
    // Map answer indices back to option values for the backend
    for (const q of questionsForApi) {
      const answerValues = q.answers.map(index => q.options[index]);
      
      if (q.options.some(opt => opt.trim() === '')) {
        allOptionsFilled = false;
      }
      
      q.answers = answerValues;
    }

    if (!allOptionsFilled) {
      alert("Please fill in all option text fields for every question before saving.");
      return;
    }
    
    // NEW: Validate required fields
    const finalRequiredFields = requiredFields.map(f => f.trim()).filter(f => f.length > 0);
    if (new Set(finalRequiredFields).size !== finalRequiredFields.length) {
        alert("Required student fields must have unique names.");
        return;
    }
    
    // Validate schedule if enabled
    if (scheduleEnabled) {
      if (!scheduledStart || !scheduledEnd) {
        alert("Please set both a start and end time for the exam schedule.");
        return;
      }
      if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
        alert("Scheduled end time must be after start time.");
        return;
      }
      // Ensure exam duration fits within the scheduled window
      const windowMinutes = (new Date(scheduledEnd) - new Date(scheduledStart)) / 60000;
      const durationMinutes = parseInt(duration, 10);
      if (durationMinutes > windowMinutes) {
        alert(
          `Exam duration (${durationMinutes} min) is longer than the scheduled window (${Math.round(windowMinutes)} min).\n\n` +
          `Please either:\n` +
          `• Reduce the duration to ≤ ${Math.round(windowMinutes)} min, OR\n` +
          `• Extend the end time to at least ${durationMinutes} minutes after the start time.`
        );
        return;
      }
    }

    // Convert IST datetime-local string → UTC ISO for the backend.
    // Split manually and use Date.UTC so browser timezone is never involved.
    const istToUTC = (localStr) => {
      if (!localStr) return null;
      const [datePart, timePart] = localStr.split('T');
      const [y, mo, d] = datePart.split('-').map(Number);
      const [h, mi]    = timePart.split(':').map(Number);
      const utcMs = Date.UTC(y, mo - 1, d, h, mi) - (5.5 * 60 * 60 * 1000);
      return new Date(utcMs).toISOString();
    };

    try {
      const examData = { 
          title, 
          duration, 
          questions: questionsForApi, 
          showResults,
          requiredFields: finalRequiredFields,
          scheduledStart: scheduleEnabled ? istToUTC(scheduledStart) : null,
          scheduledEnd:   scheduleEnabled ? istToUTC(scheduledEnd)   : null,
      }; 
      const result = await callCreateExam(examData, token);
      setExamLink({ id: result.exam._id, code: result.exam.examCode });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // error handled by hook
    }
  };
  
  if (examLink) {
    const shareMessage = `📝 *Exam Invitation*\n\nYou have been invited to take an exam on SmartProctor.\n\n🔑 *Exam Code:* ${examLink.code}\n\n📌 Steps to join:\n1. Open SmartProctor\n2. Click "Join Exam"\n3. Enter code: *${examLink.code}*\n\nGood luck! 🎯`;
    const shareMessagePlain = `Exam Invitation\n\nYou have been invited to take an exam on SmartProctor.\n\nExam Code: ${examLink.code}\n\nSteps to join:\n1. Open SmartProctor\n2. Click "Join Exam"\n3. Enter the code above\n\nGood luck!`;

    const shareOptions = [
      {
        label: 'WhatsApp',
        color: 'bg-[#25D366] hover:bg-[#1ebe5d]',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L.054 23.25a.75.75 0 00.916.916l5.392-1.478A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.523-5.183-1.432l-.371-.221-3.844 1.053 1.053-3.844-.221-.371A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        ),
        onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank'),
      },
      {
        label: 'Telegram',
        color: 'bg-[#229ED9] hover:bg-[#1a8bbf]',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.1 13.466l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.848.093z"/></svg>
        ),
        onClick: () => window.open(`https://t.me/share/url?text=${encodeURIComponent(shareMessage)}`, '_blank'),
      },
      {
        label: 'Email',
        color: 'bg-gray-600 hover:bg-gray-700',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        ),
        onClick: () => window.open(`mailto:?subject=${encodeURIComponent('Exam Invitation — SmartProctor')}&body=${encodeURIComponent(shareMessagePlain)}`, '_blank'),
      },
      {
        label: 'SMS',
        color: 'bg-green-600 hover:bg-green-700',
        icon: (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        ),
        onClick: () => window.open(`sms:?body=${encodeURIComponent(shareMessagePlain)}`, '_blank'),
      },
    ];

    const handleCopy = () => {
      copyToClipboard(examLink.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Exam Invitation — SmartProctor', text: shareMessagePlain });
        } catch {}
      }
    };

    return (
      <div className="max-w-lg mx-auto">
        {/* Success header */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 sm:px-8 py-6 sm:py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardCheckIcon className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Exam Created!</h2>
            <p className="text-green-100 text-sm mt-1">Share the code below with your students</p>
          </div>

          <div className="px-5 sm:px-8 py-5 sm:py-6">
            {/* Exam code display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 text-center mb-6">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-widest mb-2">Exam Code</p>
              <code className="text-3xl sm:text-4xl font-mono font-bold text-blue-700 tracking-[0.2em] sm:tracking-[0.3em]">{examLink.code}</code>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {copied
                    ? <><svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!</>
                    : <><svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy Code</>
                  }
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-600"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
                    Share
                  </button>
                )}
              </div>
            </div>

            {/* Share via apps */}
            <p className="text-sm font-semibold text-gray-600 mb-3 text-center">Share directly via</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {shareOptions.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={opt.onClick}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-white text-xs font-semibold transition-transform hover:scale-105 active:scale-95 shadow-sm ${opt.color}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Message preview */}
            <details className="mb-5">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">Preview message that will be sent</summary>
              <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{shareMessagePlain}</pre>
            </details>

            {/* Advanced: Exam ID */}
            <details className="mb-6">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">Show full Exam ID (advanced)</summary>
              <div className="mt-2 bg-gray-100 p-3 rounded-lg flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-gray-600 break-all">{examLink.id}</code>
                <button onClick={() => copyToClipboard(examLink.id)} className="shrink-0 text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Copy</button>
              </div>
            </details>

            <button
              onClick={onExamCreated}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-6">Create New Exam</h2>
        {error && <p className="text-red-500 mb-4 text-center">Error creating exam: {error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Final Year Physics"
            required
          />
          <Input 
            label="Duration (in minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 60"
            required
            min="1"
          />
        </div>
        <div className="mt-6">
            <Checkbox
                label="Show results to student immediately after submission"
                checked={showResults}
                onChange={(e) => setShowResults(e.target.checked)}
            />
        </div>
        <div className="mt-4 border-t pt-4">
            <Checkbox
                label="Schedule exam window (restrict when students can access this exam)"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
            />
            {scheduleEnabled && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date &amp; Time <span className="text-blue-600 font-semibold">(IST — India Standard Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required={scheduleEnabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date &amp; Time <span className="text-blue-600 font-semibold">(IST — India Standard Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required={scheduleEnabled}
                  />
                </div>
                <p className="md:col-span-2 text-xs text-blue-700">
                  ✅ Enter times in IST (Indian Standard Time, UTC+5:30). Students outside this window will be blocked.
                </p>
                {/* Live duration vs window warning */}
                {scheduledStart && scheduledEnd && (() => {
                  const windowMin = Math.round((new Date(scheduledEnd) - new Date(scheduledStart)) / 60000);
                  const durMin = parseInt(duration, 10) || 0;
                  if (windowMin > 0 && durMin > windowMin) {
                    return (
                      <p className="md:col-span-2 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded p-2">
                        ⚠️ Duration ({durMin} min) exceeds the scheduled window ({windowMin} min).
                        Please reduce the duration or extend the end time.
                      </p>
                    );
                  }
                  if (windowMin > 0) {
                    return (
                      <p className="md:col-span-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                        ✅ Window is {windowMin} min — fits the {durMin}-min exam duration.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
        </div>
      </div>
      
      {/* --- NEW: Required Student Fields Section --- */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Required Student Fields</h3>
        <p className="text-sm text-gray-600 mb-4">
            Ask students for extra info before they start (e.g., "Full Name", "Roll Number").
            This will be shown in the results.
        </p>
        <div className="space-y-3">
            {requiredFields.map((field, index) => (
                <div key={index} className="flex items-center gap-3">
                    <Input 
                      value={field}
                      onChange={(e) => handleRequiredFieldChange(index, e.target.value)}
                      placeholder="e.g., Roll Number"
                      className="flex-1"
                    />
                    <Button type="button" variant="danger" onClick={() => removeRequiredField(index)} title="Remove Field">
                        <TrashIcon className="w-5 h-5" />
                    </Button>
                </div>
            ))}
        </div>
        <Button type="button" variant="secondary" onClick={addRequiredField} className="mt-4">
            <PlusIcon className="w-5 h-5" />
            Add Field
        </Button>
      </div>
      {/* --- End of New Section --- */}

      {/* ─── PDF Import Panel ─── */}
      <div className="bg-white shadow-lg rounded-xl p-6 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-xl shrink-0">
            <FileTextIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Import Questions from PDF</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a PDF containing MCQ questions. AI will automatically extract all questions, options, and correct answers.
            </p>

            {/* Status message */}
            {pdfStatus && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2 ${
                pdfStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                pdfStatus.type === 'error'   ? 'bg-red-50 text-red-800 border border-red-200' :
                                               'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {pdfStatus.type === 'info' && <LoaderIcon className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{pdfStatus.msg}</span>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {/* Hidden file input */}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfImport}
              />
              <button
                type="button"
                disabled={pdfImporting}
                onClick={() => { setPdfStatus(null); pdfInputRef.current?.click(); }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm
                  ${pdfImporting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  }`}
              >
                {pdfImporting
                  ? <><LoaderIcon className="w-4 h-4" /> Extracting questions...</>
                  : <><UploadIcon className="w-4 h-4" /> Choose PDF File</>
                }
              </button>
              <span className="text-xs text-gray-400">PDF up to 20 MB · Questions will be added below</span>
            </div>
          </div>
        </div>
      </div>
      {/* ─── End PDF Import Panel ─── */}

      {/* ─── Topic Manager ─── */}
      <TopicManager questions={questions} onTopicsChange={handleTopicsChange} />

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-white shadow-lg rounded-xl p-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">Question {qIndex + 1}</h3>
            {q.topic && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {q.topic}
              </span>
            )}
          </div>
          
          <Button 
            type="button" 
            onClick={() => removeQuestion(qIndex)}
            variant="danger" 
            className="absolute top-4 right-4 px-2 py-1"
            title="Delete Question"
          >
            <TrashIcon className="w-5 h-5" />
          </Button>

          <div className="space-y-4">
            <Input 
              label="Question Text"
              value={q.text}
              onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
              placeholder="What is...?"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Image <span className="text-gray-400 font-normal">(optional — JPEG, PNG, GIF, WEBP · max 5 MB)</span>
              </label>
              <QuestionImageUpload
                imageUrl={q.imageUrl || ''}
                onUploaded={(url) => handleQuestionChange(qIndex, 'imageUrl', url)}
                onRemoved={() => handleQuestionChange(qIndex, 'imageUrl', '')}
              />
            </div>
            <div className="flex gap-4 items-end flex-wrap">
              <Input 
                label="Marks"
                type="number"
                value={q.marks}
                onChange={(e) => handleQuestionChange(qIndex, 'marks', parseInt(e.target.value) || 1)}
                required
                min="1"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">Options & Correct Answers</legend>
              <p className="text-xs text-gray-500 mb-2">Check the box for each correct answer.</p>
              <div className="space-y-3">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <Checkbox
                      name={`q${qIndex}_ans_${oIndex}`}
                      label=""
                      checked={q.answers.includes(oIndex)}
                      onChange={() => handleAnswerChange(qIndex, oIndex)}
                    />
                    <Input 
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Type text for Option ${oIndex + 1} here`}
                      required
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      ))}
      
      <div className="flex justify-between items-center">
        <Button type="button" variant="secondary" onClick={addQuestion}>
          <PlusIcon className="w-5 h-5" />
          Add Question
        </Button>
        
        {error && <p className="text-red-500">Error creating exam: {error}</p>}
        
        <Button type="button" variant="primary" disabled={loading} onClick={handleSubmit}>
          {loading ? <><LoaderIcon className="w-4 h-4 mr-2" />Creating...</> : 'Create Exam'}
        </Button>
      </div>
    </div>
  );
}


// ─── Shared Topic Analytics Helpers ─────────────────────────────────────────
const TOPIC_COLORS = {
  Strong:  { bar: '#22c55e', badge: 'bg-green-100 text-green-700',  label: 'Strong'  },
  Improve: { bar: '#f59e0b', badge: 'bg-yellow-100 text-yellow-700', label: 'Improve' },
  Weak:    { bar: '#ef4444', badge: 'bg-red-100 text-red-700',       label: 'Weak'    },
};
const topicStatus = (pct) => pct >= 75 ? 'Strong' : pct >= 50 ? 'Improve' : 'Weak';

function TopicBar({ topic, pct, status, correct, incorrect }) {
  const s = TOPIC_COLORS[status] || TOPIC_COLORS.Improve;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-32 text-sm font-medium text-gray-700 shrink-0 truncate">{topic}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.bar }} />
      </div>
      <span className="w-10 text-right text-sm font-bold" style={{ color: s.bar }}>{pct}%</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.badge} w-16 text-center`}>{s.label}</span>
      <span className="text-xs text-gray-400 w-20 text-right">{correct}✓ {incorrect}✗</span>
    </div>
  );
}

// ─── Student Analytics Page (shown after exam submission or from history) ─────
function StudentAnalyticsPage({ examId, examTitle, onBack }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMyAnalytics(examId, token)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [examId, token]);

  if (loading) return <div className="p-20 text-center"><LoaderIcon className="w-10 h-10 mx-auto text-blue-500 mb-3" /><p className="text-gray-500">Loading your analytics...</p></div>;
  if (error)   return <div className="p-10 bg-white rounded-xl shadow text-center text-red-500"><p>{error}</p><Button onClick={onBack} variant="secondary" className="mt-4">Back</Button></div>;
  if (!data)   return null;

  const topics    = data.topicStats || [];
  const strong    = topics.filter(t => t.status === 'Strong');
  const needsWork = topics.filter(t => t.status !== 'Strong');
  const pct       = data.totalMarks > 0 ? Math.round(data.score / data.totalMarks * 100) : 0;
  const grade     = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F';
  const gradeColor= pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{examTitle || 'Exam'} — Your Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Topic-wise performance breakdown</p>
        </div>
        <Button onClick={onBack} variant="secondary" className="w-full sm:w-auto">Back</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Score', value: `${pct}%`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Correct', value: `${data.score}/${data.totalMarks}`, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
          { label: 'Grade', value: grade, color: gradeColor, bg: 'bg-gray-50 border-gray-100' },
          { label: 'Strong Topics', value: `${strong.length}/${topics.length}`, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-3 sm:p-5 ${c.bg}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{c.label}</p>
            <p className={`text-2xl sm:text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Topic breakdown bars */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Topic Breakdown</h3>
        {topics.length === 0
          ? <p className="text-gray-400 text-center py-6">No topic data available.</p>
          : topics.map(t => <TopicBar key={t.topic} topic={t.topic} pct={t.percentage} status={t.status} correct={t.correct} incorrect={t.incorrect} />)
        }
      </div>

      {/* Strong / Needs work */}
      {topics.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-4">✅ Strong Topics</h3>
            {strong.length === 0
              ? <p className="text-gray-400 text-sm">Keep practising — you'll get there!</p>
              : strong.map(t => (
                <div key={t.topic} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="flex items-center gap-2 text-sm text-gray-700"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t.topic}</span>
                  <span className="text-sm font-bold text-green-600">{t.percentage}%</span>
                </div>
              ))
            }
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4">📚 Needs Work</h3>
            {needsWork.length === 0
              ? <p className="text-gray-400 text-sm">Excellent! You're strong in all topics.</p>
              : needsWork.map(t => (
                <div key={t.topic} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="flex items-center gap-2 text-sm text-gray-700"><span className={`w-2 h-2 rounded-full inline-block ${t.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} />{t.topic}</span>
                  <span className={`text-sm font-bold ${t.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{t.percentage}%</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher Analytics Tab (inside ViewResultsPage) ───────────────────────────
function TeacherAnalyticsTab({ examId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    api.getExamAnalytics(examId, token)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [examId, token]);

  if (loading) return <div className="p-20 text-center"><LoaderIcon className="w-10 h-10 mx-auto text-blue-500 mb-3" /><p className="text-gray-500">Loading analytics...</p></div>;
  if (error)   return <div className="p-10 text-red-500 text-center">{error}</div>;
  if (!data || data.totalStudents === 0) return <div className="p-10 text-center text-gray-400">No submissions yet — analytics will appear here once students complete the exam.</div>;

  const topics   = data.topicSummary   || [];
  const students = data.studentBreakdowns || [];
  const shown    = selectedStudent ? students.find(s => s.studentId === selectedStudent) : null;

  return (
    <div className="space-y-6">
      {/* Overall class topic performance */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">Class Topic Performance
            <span className="ml-2 text-xs font-normal text-gray-400">({data.totalStudents} student{data.totalStudents !== 1 ? 's' : ''})</span>
          </h3>
          {selectedStudent && (
            <button onClick={() => setSelectedStudent(null)} className="text-xs text-blue-600 underline">← Show class overview</button>
          )}
        </div>

        {shown ? (
          // Per-student view
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">{shown.studentUsername[0].toUpperCase()}</div>
              <div>
                <p className="font-semibold text-gray-800">{shown.studentUsername}</p>
                <p className="text-xs text-gray-400">Score: {shown.score}/{shown.totalMarks} ({shown.totalMarks > 0 ? Math.round(shown.score/shown.totalMarks*100) : 0}%)</p>
              </div>
            </div>
            {shown.topicStats.map(t => <TopicBar key={t.topic} topic={t.topic} pct={t.percentage} status={topicStatus(t.percentage)} correct={t.correct} incorrect={t.incorrect} />)}
          </>
        ) : (
          // Class overview
          topics.map(t => <TopicBar key={t.topic} topic={t.topic} pct={t.percentage} status={topicStatus(t.percentage)} correct={t.correct} incorrect={t.incorrect} />)
        )}
      </div>

      {/* Per-student table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Individual Student Analytics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-bold text-gray-600">#</th>
                <th className="py-3 px-4 font-bold text-gray-600">Student</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-center">Score</th>
                {topics.map(t => (
                  <th key={t.topic} className="py-3 px-4 font-bold text-gray-600 text-center whitespace-nowrap">{t.topic}</th>
                ))}
                <th className="py-3 px-4 font-bold text-gray-600 text-center">Detail</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const topicMap = {};
                (s.topicStats || []).forEach(t => { topicMap[t.topic] = t; });
                const pct = s.totalMarks > 0 ? Math.round(s.score / s.totalMarks * 100) : 0;
                return (
                  <tr key={s.studentId} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedStudent === s.studentId ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-4 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{s.studentUsername}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-black ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{pct}%</span>
                    </td>
                    {topics.map(t => {
                      const ts = topicMap[t.topic];
                      const p  = ts ? ts.percentage : null;
                      const c  = p === null ? 'bg-gray-100 text-gray-400' : p >= 75 ? 'bg-green-100 text-green-700' : p >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';
                      return (
                        <td key={t.topic} className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c}`}>{p !== null ? `${p}%` : '—'}</span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(selectedStudent === s.studentId ? null : s.studentId)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-bold border-0 cursor-pointer transition-colors"
                      >
                        {selectedStudent === s.studentId ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function ViewResultsPage({ examId, examTitle, onBack }) {
  const { token } = useAuth();
  const [callGetResults, results, loading, error] = useApi(api.getExamResults);
  const [callDownload, , downloadLoading] = useApi(api.downloadExamResults);
  const [customColumns, setCustomColumns] = useState([]);
  const [snapshotStudent, setSnapshotStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('Results');
  const [logsStudent, setLogsStudent] = useState(null);

  useEffect(() => {
    if (examId && token) {
      callGetResults(examId, token).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const standard = ['_id','studentUsername','score','totalMarks','correct','incorrect','submittedAt','proctorLogs','snapshots','studentId','examId','status','studentInfo','rank'];
          setCustomColumns(Object.keys(data[0]).filter(k => !standard.includes(k)));
        }
      }).catch(() => {});
    }
  }, [examId, token]);

  const DashboardAnalytics = ({ data }) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const avg = (data.reduce((s, r) => s + (Number(r.score) || 0), 0) / data.length).toFixed(1);
    const flagged = data.filter(r => r.proctorLogs && r.proctorLogs.length > 0).length;
    const top = data.length > 0 ? data[0].score : 0;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h4 className="text-blue-700 text-xs font-bold uppercase tracking-wider">Class Average</h4>
          <p className="text-3xl font-black text-blue-900">{avg} <span className="text-lg font-normal">pts</span></p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <h4 className="text-green-700 text-xs font-bold uppercase tracking-wider">Top Score</h4>
          <p className="text-3xl font-black text-green-900">{top} <span className="text-lg font-normal">pts</span></p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <h4 className="text-red-700 text-xs font-bold uppercase tracking-wider">Security Alerts</h4>
          <p className="text-3xl font-black text-red-900">{flagged} <span className="text-lg font-normal text-red-700">flagged</span></p>
        </div>
      </div>
    );
  };

  if (!examId) return <div className="p-10 text-center text-red-500 bg-white rounded-xl shadow">Error: Invalid Exam ID.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {snapshotStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setSnapshotStudent(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Webcam Snapshots - {snapshotStudent.name}</h3>
              <Button variant="secondary" onClick={() => setSnapshotStudent(null)}>Close</Button>
            </div>
            {snapshotStudent.snapshots && snapshotStudent.snapshots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {snapshotStudent.snapshots.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt={`Snapshot ${i+1}`} className="w-full rounded-lg border border-gray-200" />
                    <span className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">#{i+1}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-center py-10">No snapshots captured.</p>}
          </div>
        </div>
      )}

      {logsStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setLogsStudent(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Proctor Log - {logsStudent.name}</h3>
              <Button variant="secondary" onClick={() => setLogsStudent(null)}>Close</Button>
            </div>
            {logsStudent.logs && logsStudent.logs.length > 0 ? (
              <ul className="space-y-2">
                {logsStudent.logs.map((log, i) => {
                  const icons = { tab_change: '🔀 Tab', fullscreen_exit: '⛶ FS', security_violation: '🚫 Block', auto_submit: '⚡ Auto', device_detected: '📱 Device' };
                  return (
                    <li key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-xs font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded">{icons[log.type] || '!'}</span>
                      <div>
                        <p className="text-sm font-semibold text-red-800 capitalize">{(log.type || '').replace(/_/g,' ')}</p>
                        <p className="text-xs text-red-600">{log.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{log.timestamp || ''}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-gray-500 text-center py-10">No violations recorded.</p>}
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl p-6 flex justify-between items-center border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam Results</h2>
          <p className="text-gray-500 font-medium">{examTitle || `Exam ID: ${examId}`}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => callDownload(examId, token)} variant="secondary" disabled={downloadLoading || loading}>
            <DownloadIcon className="w-4 h-4" /> Download CSV
          </Button>
          <Button onClick={onBack} variant="secondary">Back</Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['Results', 'Topic Analytics'].map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all border-0 cursor-pointer ${activeTab === tab ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >{tab}</button>
        ))}
      </div>

      {activeTab === 'Topic Analytics' ? (
        <TeacherAnalyticsTab examId={examId} />
      ) : loading ? (
        <div className="p-20 text-center bg-white rounded-xl shadow">
          <LoaderIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
          <p className="text-gray-500">Loading student performance data...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-red-500 bg-white rounded-xl shadow text-center">
          <AlertTriangleIcon className="w-10 h-10 mx-auto mb-2" />
          <p>Failed to fetch results: {error}</p>
        </div>
      ) : (
        <>
          <DashboardAnalytics data={results} />
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            {!results || results.length === 0 ? (
              <p className="text-gray-500 text-center py-20 font-medium">No students have completed this exam yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-gray-50 border-b-2 border-gray-100">
                    <tr>
                      <th className="py-4 px-4 font-bold text-gray-700 text-center">#</th>
                      <th className="py-4 px-4 font-bold text-gray-700">Student</th>
                      {customColumns.map(col => (
                        <th key={col} className="py-4 px-4 font-bold text-gray-700 capitalize">{col.replace(/_/g,' ')}</th>
                      ))}
                      <th className="py-4 px-4 font-bold text-gray-700 text-center">Score</th>
                      <th className="py-4 px-4 font-bold text-green-600 text-center">Correct</th>
                      <th className="py-4 px-4 font-bold text-red-600 text-center">Incorrect</th>
                      <th className="py-4 px-4 font-bold text-gray-700">Violations</th>
                      <th className="py-4 px-4 font-bold text-gray-700">Snapshots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r._id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-gray-500">
                          {r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : `#${r.rank || i+1}`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{r.studentUsername}</td>
                        {customColumns.map(col => (
                          <td key={col} className="py-3 px-4 text-gray-600">{r[col] || 'N/A'}</td>
                        ))}
                        <td className="py-3 px-4 text-center">
                          <span className="text-blue-600 font-black">{r.score}</span>
                          <span className="text-gray-400 font-bold"> / {r.totalMarks}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-green-600">{r.correct}</td>
                        <td className="py-3 px-4 text-center font-bold text-red-600">{r.incorrect}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setLogsStudent({ name: r.studentUsername, logs: r.proctorLogs })}
                            className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer ${r.proctorLogs?.length > 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700'}`}
                          >
                            {r.proctorLogs ? r.proctorLogs.length : 0} Alerts
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSnapshotStudent({ name: r.studentUsername, snapshots: r.snapshots })}
                            className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer ${r.snapshots?.length > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500'}`}
                          >
                            Cam {r.snapshots?.length || 0}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// --- Student Components ---
function StudentDashboard({ setPage }) {
  const { token } = useAuth();
  const [examInput, setExamInput] = useState('');
  const [error, setError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [callGetHistory, history, historyLoading] = useApi(api.getStudentHistory);

  useEffect(() => { callGetHistory(token); }, []);

  const looksLikeCode = (val) => /^[A-Za-z0-9]{4,8}$/.test(val.trim()) && val.trim().length < 20;

  const handleStart = async () => {
    const val = examInput.trim();
    if (!val) { setError('Please enter an Exam Code or Exam ID.'); return; }
    setError('');
    if (looksLikeCode(val)) {
      setLookupLoading(true);
      try {
        const result = await api.getExamByCode(val, token);
        setPage(`start-exam-${result.examId}`);
      } catch (err) {
        setError(err.message || 'Exam code not found. Please check and try again.');
      } finally { setLookupLoading(false); }
    } else {
      setPage(`start-exam-${val}`);
    }
  };

  const pct = (s, t) => t > 0 ? Math.round((s / t) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Student Dashboard</h2>

      <div className="bg-white shadow-lg rounded-xl p-5 sm:p-8 max-w-lg mx-auto text-center">
        <h3 className="text-xl font-semibold mb-2">Join an Exam</h3>
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Enter the <strong>Exam Code</strong> (e.g. <code className="bg-gray-100 px-1 rounded">AB3K7Z</code>) provided by your teacher, or paste the full Exam ID.
        </p>
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <Input label="" value={examInput}
            onChange={(e) => setExamInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Enter exam code or ID..." className="flex-1 w-full" error={error} />
          <Button onClick={handleStart} disabled={lookupLoading} className="w-full sm:w-auto py-3 px-6">
            {lookupLoading ? 'Looking up...' : 'Start Exam'}
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">My Exam History</h3>
        {historyLoading && <div className="text-center py-8"><LoaderIcon className="w-8 h-8 mx-auto text-blue-500" /></div>}
        {!historyLoading && (!history || history.length === 0) && (
          <p className="text-gray-500 text-center py-8">You have not completed any exams yet.</p>
        )}
        {history && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-sm font-bold text-gray-700">Exam</th>
                  <th className="py-3 px-4 text-sm font-bold text-gray-700 text-center">Score</th>
                  <th className="py-3 px-4 text-sm font-bold text-gray-700 text-center">Alerts</th>
                  <th className="py-3 px-4 text-sm font-bold text-gray-700">Submitted</th>
                  <th className="py-3 px-4 text-sm font-bold text-gray-700">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const p = pct(h.score, h.totalMarks);
                  const bar = p >= 75 ? 'bg-green-500' : p >= 50 ? 'bg-yellow-400' : 'bg-red-400';
                  return (
                    <tr key={h.submissionId || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{h.examTitle}</p>
                        <p className="text-xs text-gray-400">{h.questionCount} questions</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {h.showResults ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-blue-600">{h.score}/{h.totalMarks}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${bar}`} style={{width:`${p}%`}}></div>
                            </div>
                            <span className="text-xs text-gray-500">{p}%</span>
                          </div>
                        ) : <span className="text-xs text-gray-400 italic">Hidden by teacher</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${h.proctorAlerts > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{h.proctorAlerts}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {h.submittedAt || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => setPage(`analytics-${h.examId}`)}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-xs font-bold border-0 cursor-pointer transition-colors">
                            📊 Analytics
                          </button>
                          {h.resultPublished ? (
                            <button onClick={() => setPage(`my-result-${h.examId}`, { title: h.examTitle })}
                              className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-xs font-bold border-0 cursor-pointer transition-colors">
                              🏆 View Result
                            </button>
                          ) : (
                            <span title="Teacher hasn't published the result yet"
                              className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-xs font-medium border border-dashed border-gray-200 cursor-not-allowed text-center block">
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StartExamPage({ examId, onBack, onStartExam }) {
    const { token } = useAuth();
    const [callStart, , startLoading, startError] = useApi(api.startExam);
    const [studentInfo, setStudentInfo] = useState({});

    // Manage exam details fetch manually so we can capture opensAt from errors
    const [examDetails, setExamDetails]     = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(true);
    const [isRefetching, setIsRefetching]   = useState(false); // silent re-fetch at countdown=0
    const [detailsError, setDetailsError]   = useState(null); // plain string for non-schedule errors
    const [opensAt, setOpensAt]             = useState(null); // UTC ISO — set when exam not started yet

    const [countdown, setCountdown] = useState(null);
    const [justOpened, setJustOpened] = useState(false);

    // initial=true → show full-page spinner; initial=false → silent background refresh
    const fetchDetails = async (initial = true) => {
        if (initial) setDetailsLoading(true);
        else setIsRefetching(true);
        setDetailsError(null);
        try {
            const data = await api.getExamDetails(examId, token);
            setExamDetails(data);
            setOpensAt(null);
            setCountdown(0); // ensure isOpen becomes true immediately
        } catch (e) {
            if (e.opensAt) {
                setOpensAt(e.opensAt);
                setDetailsError(e.message);
            } else {
                setDetailsError(e.message);
            }
        } finally {
            if (initial) setDetailsLoading(false);
            else setIsRefetching(false);
        }
    };

    useEffect(() => { fetchDetails(true); }, [examId, token]);

    // Start countdown from opensAt (works whether it came from error or examDetails)
    const opensAtISO = opensAt || examDetails?.scheduledStart || null;
    useEffect(() => {
        if (!opensAtISO) return;
        const secs = secsUntil(opensAtISO);
        if (!secs || secs <= 0) return;
        setCountdown(secs);
        const iv = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(iv);
                    // Flip to Start Exam Now INSTANTLY (countdown=0 triggers isOpen=true)
                    // then silently re-fetch details in background for required fields etc.
                    setJustOpened(true);
                    setTimeout(() => setJustOpened(false), 4000);
                    setTimeout(() => fetchDetails(false), 300); // slight delay so UI updates first
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [opensAtISO]);

    const handleStart = async () => {
        if (examDetails && examDetails.requiredFields) {
            for (const f of examDetails.requiredFields) {
                if (!studentInfo[f] || studentInfo[f].trim() === '') { alert(`Please fill in: ${f}`); return; }
            }
        }
        try { await callStart(examId, studentInfo, token); onStartExam(); } catch (e) {}
    };

    const fmtCountdown = (s) => {
        if (!s || s <= 0) return null;
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };

    if (detailsLoading) return (
        <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto">
            <LoaderIcon className="w-12 h-12 mx-auto mb-4" /><h2 className="text-xl font-semibold">Loading exam details...</h2>
        </div>
    );

    // Non-schedule errors (exam not found, already submitted, etc.) — dead-end screen
    if (detailsError && !opensAt) {
        return (
            <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto">
                <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-600">Cannot Join Exam</h2>
                <p className="text-gray-700 mb-6">{detailsError}</p>
                <Button onClick={onBack} variant="secondary">Back to Dashboard</Button>
            </div>
        );
    }

    // isWaiting: countdown is actively ticking down (> 0)
    const isWaiting = countdown !== null && countdown > 0;
    // isOpen: countdown finished (=0), OR no countdown was ever needed (exam already open when page loaded)
    const isOpen    = !isWaiting && (countdown === 0 || (countdown === null && !!examDetails));
    const cdText    = fmtCountdown(countdown);
    const opensAtLabel  = opensAt ? fmtIST(opensAt) : (examDetails?.scheduledStartIST || (examDetails?.scheduledStart ? fmtIST(examDetails.scheduledStart) : null));
    const closesAtLabel = examDetails?.scheduledEndIST || (examDetails?.scheduledEnd ? fmtIST(examDetails.scheduledEnd) : null);

    return (
        <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">

            {/* Header */}
            {isWaiting ? (
                <>
                    <div className="text-5xl mb-3">⏳</div>
                    <h2 className="text-2xl font-bold mb-1 text-yellow-700">Exam Not Started Yet</h2>
                    <p className="text-gray-500 mb-5 text-sm">{detailsError}</p>
                </>
            ) : (
                <h2 className="text-2xl font-bold mb-4">{examDetails?.title}</h2>
            )}

            {/* Countdown banner */}
            {(isWaiting || !isOpen) && cdText && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 flex flex-col items-center gap-1">
                    <p className="text-yellow-700 font-semibold text-sm uppercase tracking-wide">Exam opens in</p>
                    <p className="text-4xl font-black text-yellow-600 font-mono tracking-wider">{cdText}</p>
                    {opensAtLabel && <p className="text-sm text-yellow-600 mt-1">Opens at: <strong>{opensAtLabel}</strong></p>}
                </div>
            )}

            {/* "Just opened" flash */}
            {isOpen && justOpened && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700 font-semibold text-sm animate-pulse">
                    🎉 Exam is now open! You can start.
                </div>
            )}

            {isOpen && !justOpened && <p className="text-gray-600 mb-6">You are about to start the exam. Make sure you are ready.</p>}

            {/* Exam info — only shown once details loaded */}
            {examDetails && (
                <ul className="text-left space-y-2 text-gray-600 mb-6 bg-gray-50 rounded-xl p-4">
                    <li><strong>Questions:</strong> {examDetails.questionCount}</li>
                    <li><strong>Time Limit:</strong> {Math.round(examDetails.duration / 60)} minutes</li>
                    <li><strong>Total Marks:</strong> {examDetails.totalMarks}</li>
                    {opensAtLabel  && <li><strong>Opens:</strong>  {opensAtLabel}</li>}
                    {closesAtLabel && <li><strong>Closes:</strong> {closesAtLabel}</li>}
                    <li className="text-red-600 font-semibold">⚠️ Webcam, fullscreen &amp; tab monitoring will be active</li>
                </ul>
            )}

            {examDetails?.requiredFields?.length > 0 && (
                <div className="mb-6 text-left space-y-3">
                    <p className="font-semibold text-gray-700">Please fill in before starting:</p>
                    {examDetails.requiredFields.map(field => (
                        <Input key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}
                            value={studentInfo[field] || ''} onChange={(e) => setStudentInfo(p => ({...p, [field]: e.target.value}))}
                            placeholder={`Enter your ${field}`} required />
                    ))}
                </div>
            )}

            {startError && <p className="text-red-500 text-sm mb-4">{startError}</p>}

            <div className="flex gap-4 justify-center items-center flex-wrap">
                {/* Back to Dashboard — always visible */}
                <Button onClick={onBack} variant="secondary">Back to Dashboard</Button>

                {/* Waiting: yellow disabled button with live countdown inside */}
                {(isWaiting || !isOpen) && cdText && (
                    <button
                        disabled
                        className="inline-flex flex-col items-center justify-center gap-0.5 px-6 py-3 rounded-lg font-semibold bg-yellow-400 text-yellow-900 opacity-90 cursor-not-allowed shadow-sm min-w-[170px]"
                    >
                        <span className="text-xs font-bold uppercase tracking-wide opacity-75">Wait</span>
                        <span className="text-lg font-black font-mono leading-tight">{cdText}</span>
                    </button>
                )}

                {/* Open: green Start Exam Now — enabled instantly when countdown hits 0 */}
                {isOpen && (
                    <Button
                        onClick={handleStart}
                        disabled={startLoading}
                        className={`min-w-[170px] ${justOpened ? 'animate-pulse' : ''} bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white`}
                    >
                        {startLoading ? 'Starting...' : '✓ Start Exam Now'}
                    </Button>
                )}
            </div>
        </div>
    );
}

function ExamTakingPage({ examId, onSubmitSuccess }) {
  const { token } = useAuth();
  const [callGetQuestions, , qLoading, qError] = useApi(api.getExamQuestions);

  const [questions, setQuestions] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [proctorLogs, setProctorLogs] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  // Use local submit state so rank/result always display correctly
  const [submitState, setSubmitState] = useState({ loading: false, result: null, error: null });
  const [warningToShow, setWarningToShow] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  // Multi-face warning
  const [faceWarning, setFaceWarning] = useState(null);
  // Track how long face has been absent (in 5-second ticks)
  const noFaceTicksRef = useRef(0);
  const noFaceWarnedRef = useRef(false); // so we only log once per absence streak
  // Track how long multiple faces have been present (in 5-second ticks)
  const multiFaceTicksRef = useRef(0);
  const multiFaceWarnedRef = useRef(false);
  // Device detection
  const [deviceWarning, setDeviceWarning] = useState(null);
  const deviceWarnedRef = useRef(false);

  const webcamRef = useRef(null);
  const isFinishedRef = useRef(isFinished);
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const timerRef = useRef(null);
  const faceIntervalRef = useRef(null);

  // Load face-api.js models and start multi-face detection
  useEffect(() => {
    const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    let loaded = false;

    const loadAndStart = async () => {
      // Dynamically inject face-api script if not already present
      if (!window.faceapi) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      try {
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
        loaded = true;
      } catch (e) {
        console.warn('Face detection models failed to load:', e);
        return;
      }

      faceIntervalRef.current = setInterval(async () => {
        if (isFinishedRef.current || !loaded) return;
        if (!webcamRef.current) return;
        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) return;
        try {
          const detections = await window.faceapi.detectAllFaces(
            video,
            new window.faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
          );
          if (detections.length === 0) {
            noFaceTicksRef.current += 1; // each tick = 5 seconds
            // After 3 ticks (≥15 s) with no face: show warning + log once per streak
            if (noFaceTicksRef.current >= 3 && !noFaceWarnedRef.current) {
              noFaceWarnedRef.current = true;
              setFaceWarning('⚠️ No face detected for 15+ seconds! Please return in front of the camera.');
              if (!isFinishedRef.current) {
                setProctorLogs(prev => {
                  if (prev.length >= 5) return prev;
                  const nl = [...prev, { type: 'security_violation', message: 'Face absent for 15+ seconds', timestamp: new Date().toISOString() }];
                  const n = nl.length;
                  let title = `Proctoring Warning (${n}/5)`;
                  let msg = `Your face was not detected for 15+ seconds. `;
                  if (n === 4) msg += 'One more warning will result in auto-submission.';
                  else if (n >= 5) { title = 'Final Warning (5/5)'; msg += 'Your exam will be auto-submitted.'; }
                  setWarningToShow({ title, message: msg });
                  return nl;
                });
              }
            } else if (noFaceTicksRef.current < 3) {
              // Still within first 15s — show a soft hint but don't log
              setFaceWarning('No face detected! Please stay in front of the camera.');
            }
          } else if (detections.length > 1) {
            // Multiple faces — start or continue the multi-face timer
            noFaceTicksRef.current = 0;
            noFaceWarnedRef.current = false;
            multiFaceTicksRef.current += 1; // each tick = 5 seconds
            setFaceWarning(`⚠️ ${detections.length} faces detected! Only you should be visible.`);

            // Log warning once per 15-second streak of multi-face
            if (multiFaceTicksRef.current >= 3 && !multiFaceWarnedRef.current) {
              multiFaceWarnedRef.current = true;
              if (!isFinishedRef.current) {
                setProctorLogs(prev => {
                  if (prev.length >= 5) return prev;
                  const nl = [...prev, { type: 'security_violation', message: `Multiple faces detected for 15+ seconds: ${detections.length} faces`, timestamp: new Date().toISOString() }];
                  const n = nl.length;
                  let title = `Proctoring Warning (${n}/5)`;
                  let msg = `Multiple faces detected for 15+ seconds. Only you should be in frame. `;
                  if (n === 4) msg += 'One more warning will result in auto-submission.';
                  else if (n >= 5) { title = 'Final Warning (5/5)'; msg += 'Your exam will be auto-submitted.'; }
                  setWarningToShow({ title, message: msg });
                  return nl;
                });
              }
            }
          } else {
            // Exactly 1 face — all good, reset counters
            noFaceTicksRef.current = 0;
            noFaceWarnedRef.current = false;
            multiFaceTicksRef.current = 0;
            multiFaceWarnedRef.current = false;
            setFaceWarning(null); // Clear warning when 1 face
          }
        } catch (e) {}
      }, 5000); // Check every 5 seconds
    };

    loadAndStart();
    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const load = async () => {
      try {
        const data = await callGetQuestions(examId, token);
        const qList = data && data.questions ? data.questions : (Array.isArray(data) ? data : []);
        if (qList.length > 0) {
          setQuestions(qList);
          setTimeLeft(qList[0].duration || 3600);
          if (data && data.savedAnswers && Object.keys(data.savedAnswers).length > 0)
            setAnswers(data.savedAnswers);
          if (document.documentElement.requestFullscreen)
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
          setQuestions([]); setTimeLeft(0);
        }
      } catch (e) {}
    };
    load();
  }, [examId, token]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { clearInterval(timerRef.current); handleSubmit(true, 'time_out'); return; }
    timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  useEffect(() => {
    const log = (type, msg) => {
      if (isFinishedRef.current) return;
      setProctorLogs(prev => {
        if (prev.length >= 5) return prev;
        const nl = [...prev, { type, message: msg, timestamp: new Date().toISOString() }];
        const n = nl.length;
        let title = `Proctoring Warning (${n}/5)`;
        let m2 = `Event: ${msg}. `;
        if (n <= 3) m2 += 'Do not do this again.';
        else if (n === 4) m2 += 'One more warning will result in auto-submission.';
        else { title = 'Final Warning (5/5)'; m2 += 'Your exam will be auto-submitted.'; }
        setWarningToShow({ title, message: m2 });
        return nl;
      });
    };
    const snap = () => {
      if (webcamRef.current && !isFinishedRef.current) {
        const img = webcamRef.current.getScreenshot();
        if (img) setSnapshots(p => [...p, img]);
      }
    };
    const vis = () => { if (document.hidden) log('tab_change', 'User switched tabs or minimized window'); };
    const fs = () => { if (!document.fullscreenElement && !isFinishedRef.current) log('fullscreen_exit', 'User exited full-screen'); };

    // Block copy/paste silently — show a brief toast but DO NOT count as a warning
    const blk = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isFinishedRef.current) {
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
      }
    };

    // Block right-click silently — no warning consumed
    const onContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isFinishedRef.current) {
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
      }
    };

    // Detect and block navigation shortcuts
    const onKeyDown = (e) => {
      if (isFinishedRef.current) return;

      // Silent blocks — copy/paste/print shortcuts, no warning consumed
      const silentKeys = ['c','v','x','a','p','s','u'];
      if (e.ctrlKey && silentKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
        return;
      }

      const blocked = [
        e.altKey && e.key === 'Tab',       // Alt+Tab
        e.altKey && e.key === 'F4',         // Alt+F4
        e.altKey,                            // ANY Alt key combination
        e.key === 'Meta',                    // Windows/Cmd key
        e.ctrlKey && e.key === 'w',         // Close tab
        e.ctrlKey && e.key === 't',         // New tab
        e.ctrlKey && e.key === 'n',         // New window
        e.ctrlKey && e.key === 'Tab',       // Switch tab
        e.key === 'F12',                     // DevTools
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
        log('tab_change', `Blocked shortcut: ${e.altKey ? 'Alt+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.key}`);
      }
    };


    document.addEventListener('visibilitychange', vis);
    document.addEventListener('fullscreenchange', fs);
    document.addEventListener('copy', blk);
    document.addEventListener('paste', blk);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    // Random snapshots: take one every 30-90 seconds
    let snapTimeout;
    const scheduleSnap = () => {
      const delay = Math.floor(Math.random() * 60000) + 30000; // 30-90s
      snapTimeout = setTimeout(() => {
        snap();
        if (!isFinishedRef.current) scheduleSnap();
      }, delay);
    };
    scheduleSnap();
    return () => {
      document.removeEventListener('visibilitychange', vis);
      document.removeEventListener('fullscreenchange', fs);
      document.removeEventListener('copy', blk);
      document.removeEventListener('paste', blk);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(snapTimeout);
    };
  }, []);

  // ── COCO-SSD Real Device Detection ────────────────────────────────────────
  const cocoIntervalRef = useRef(null);
  const cocoModelRef    = useRef(null);  // persist model across renders

  useEffect(() => {
    const DEVICE_CLASSES = new Set([
      'cell phone', 'laptop', 'tablet', 'tv',
      'remote', 'keyboard', 'mouse', 'book',
    ]);

    const logDevice = (label) => {
      if (isFinishedRef.current || deviceWarnedRef.current) return;
      deviceWarnedRef.current = true;
      const display = label.charAt(0).toUpperCase() + label.slice(1);
      setDeviceWarning(`📱 ${display} detected in camera!`);

      // Count toward the 5-warning auto-submit
      setProctorLogs(prev => {
        if (prev.length >= 5) return prev;
        const nl = [...prev, { type: 'device_detected', message: `Device detected: ${label}`, timestamp: new Date().toISOString() }];
        const n = nl.length;
        let title = `Proctoring Warning (${n}/5) — Device Detected`;
        let msg = `📱 ${display} was detected in your camera. Electronic devices are not allowed. `;
        if (n <= 3) msg += 'Do not use any devices during the exam.';
        else if (n === 4) msg += 'One more warning will result in auto-submission.';
        else { title = 'Final Warning (5/5)'; msg += 'Your exam will be auto-submitted now.'; }
        setWarningToShow({ title, message: msg });
        return nl;
      });

      // Reset after 20s so repeated detection is possible
      setTimeout(() => { deviceWarnedRef.current = false; setDeviceWarning(null); }, 20000);
    };

    const getVideo = () => {
      // react-webcam stores the <video> element at .video
      const el = webcamRef.current?.video;
      if (el && el.readyState >= 2 && el.videoWidth > 0) return el;
      // fallback: find any playing <video> on the page
      const vids = document.querySelectorAll('video');
      for (const v of vids) {
        if (!v.paused && v.readyState >= 2 && v.videoWidth > 0) return v;
      }
      return null;
    };

    const runDetection = async () => {
      if (isFinishedRef.current) return;
      const videoEl = getVideo();
      if (!videoEl) return;

      try {
        const preds = await cocoModelRef.current.detect(videoEl);
        for (const p of preds) {
          if (DEVICE_CLASSES.has(p.class) && p.score > 0.50) {
            console.log(`[COCO-SSD] Detected: ${p.class} (${(p.score * 100).toFixed(0)}%)`);
            logDevice(p.class);
            break;
          }
        }
      } catch (e) {
        console.warn('[COCO-SSD] Detection error:', e.message);
      }
    };

    const injectScript = (src) =>
      new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = res;
        s.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    const loadAndRun = async () => {
      try {
        console.log('[COCO-SSD] Loading TensorFlow.js...');
        await injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');

        // Wait for tf global
        let t = 0;
        while (!window.tf && t++ < 20) await new Promise(r => setTimeout(r, 300));
        if (!window.tf) { console.warn('[COCO-SSD] TF.js not available'); return; }

        console.log('[COCO-SSD] Loading COCO-SSD model script...');
        await injectScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');

        // Wait for cocoSsd global
        t = 0;
        while (!window.cocoSsd && t++ < 20) await new Promise(r => setTimeout(r, 300));
        if (!window.cocoSsd) { console.warn('[COCO-SSD] cocoSsd not available'); return; }

        console.log('[COCO-SSD] Loading model weights...');
        cocoModelRef.current = await window.cocoSsd.load();
        console.log('[COCO-SSD] ✅ Model ready — device detection active');

        // Start detection interval
        cocoIntervalRef.current = setInterval(runDetection, 3000);

      } catch (e) {
        console.warn('[COCO-SSD] Failed to initialize:', e.message);
      }
    };

    // Delay start by 5s to let webcam warm up first
    const startTimer = setTimeout(loadAndRun, 5000);

    return () => {
      clearTimeout(startTimer);
      if (cocoIntervalRef.current) clearInterval(cocoIntervalRef.current);
      if (cocoModelRef.current) {
        try { cocoModelRef.current.dispose?.(); } catch (_) {}
        cocoModelRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!questions || isFinished) return;
    const si = setInterval(() => {
      if (!isFinishedRef.current) api.autoSaveAnswers(examId, answersRef.current, token);
    }, 5000); // Auto-save every 5 seconds
    return () => clearInterval(si);
  }, [questions, isFinished, examId, token]);

  useEffect(() => {
    if (isFinished || proctorLogs.length < 5) return;
    setTimeout(() => handleSubmit(true, 'proctor_violation'), 1500);
  }, [proctorLogs, isFinished]);

  const handleSubmit = async (isAuto = false, reason = null) => {
    if (isFinishedRef.current) return;
    setIsFinished(true); setShowReview(false);
    clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    let logs = [...proctorLogs];
    if (isAuto) {
      const m = reason === 'proctor_violation' ? 'Auto-submitted: 5 violations.' : 'Time ran out';
      if (!logs.find(l => l.type === 'auto_submit' && l.message === m))
        logs.push({ type: 'auto_submit', message: m, timestamp: new Date().toISOString() });
    }
    setSubmitState({ loading: true, result: null, error: null });
    try {
      const result = await api.submitExam(examId, answers, logs, snapshots, token);
      setSubmitState({ loading: false, result, error: null });
    } catch (e) {
      setSubmitState({ loading: false, result: null, error: e.message || 'Submission failed' });
    }
  };

  if (qLoading || questions === null)
    return <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto"><LoaderIcon className="w-12 h-12 mx-auto mb-4"/><h2 className="text-xl font-semibold">Loading Exam...</h2></div>;

  if (qError)
    return <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto"><AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4"/><h2 className="text-xl font-semibold text-red-600">Error</h2><p className="text-gray-700 mb-6">{qError}</p><Button onClick={onSubmitSuccess} variant="secondary">Back</Button></div>;

  if (isFinished)
    return <ExamResultPage result={submitState.result} error={submitState.error} loading={submitState.loading} onDone={onSubmitSuccess} />;

  if (!questions || questions.length === 0)
    return <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto"><p>No questions found.</p></div>;

  const cq = questions[currentQIndex];
  const ca = answers[cq._id] || [];
  const answered = Object.values(answers).filter(a => Array.isArray(a) && a.length > 0).length;

  if (showReview) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-1">Review Before Submitting</h2>
          <p className="text-gray-500 mb-6">{answered} of {questions.length} questions answered.</p>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mb-6">
            {questions.map((q, i) => {
              const done = Array.isArray(answers[q._id]) && answers[q._id].length > 0;
              return (
                <button key={q._id} onClick={() => { setCurrentQIndex(i); setShowReview(false); }}
                  className={`h-10 w-10 rounded-lg text-sm font-bold border-2 ${done ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-500 hover:border-yellow-400'}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span> Not answered</span>
          </div>
          {answered < questions.length && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 text-yellow-800 text-sm">
              {questions.length - answered} question(s) unanswered. You can still go back.
            </div>
          )}
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setShowReview(false)} className="flex-1">Back to Exam</Button>
            <Button variant="primary" onClick={() => handleSubmit(false)} className="flex-1">Confirm &amp; Submit</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProctorWarningModal isOpen={!!warningToShow} title={warningToShow?.title} message={warningToShow?.message}
        onClose={() => { setWarningToShow(null); if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); }} />

      {/* Copy/paste blocked toast */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl flex items-center gap-2">
          🚫 Copy &amp; paste is disabled during the exam
        </div>
      )}

      {/* Face warning banner */}
      {faceWarning && (
        <div className="bg-red-600 text-white text-center font-bold py-2 px-4 rounded-xl mb-3 animate-pulse">
          ⚠️ {faceWarning}
        </div>
      )}

      {/* Device detection warning banner */}
      {deviceWarning && (
        <div className="bg-orange-500 text-white text-center font-bold py-2 px-4 rounded-xl mb-3 flex items-center justify-center gap-2 animate-pulse">
          📱 {deviceWarning}
          <span className="text-orange-100 text-xs font-normal">(Warning issued — reported to teacher)</span>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-xl p-4 mb-6 flex justify-between items-center sticky top-4 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Exam in Progress</h2>
          <p className="text-sm text-gray-600">Q {currentQIndex + 1}/{questions.length} &nbsp;|&nbsp; <span className="text-green-600 font-medium">{answered} answered</span></p>
        </div>
        <div className={`text-2xl font-bold p-3 rounded-lg ${timeLeft <= 60 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
          {Math.floor(timeLeft / 60).toString().padStart(2,'0')}:{(timeLeft % 60).toString().padStart(2,'0')}
        </div>
      </div>

      <div className="fixed bottom-4 left-2 sm:left-4 w-24 sm:w-32 h-18 sm:h-24 rounded-lg overflow-hidden border-2 border-blue-500 shadow-xl z-50">
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
      </div>

      <div className="bg-white shadow-lg rounded-xl p-8">
        <h3 className="text-xl font-semibold mb-2">Question {currentQIndex + 1} ({cq.marks} marks)</h3>
        <p className="text-gray-800 text-lg mb-4">{cq.text}</p>
        {cq.imageUrl && (
          <ImageLightbox src={cq.imageUrl} alt={`Question ${currentQIndex + 1}`} />
        )}
        <div className="space-y-3">
          {cq.options && cq.options.map((opt, idx) => (
            <label key={idx} className={`block w-full p-4 border rounded-lg cursor-pointer transition-colors ${ca.includes(opt) ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
              <Checkbox checked={ca.includes(opt)} onChange={() => {
                const s = new Set(ca); s.has(opt) ? s.delete(opt) : s.add(opt);
                setAnswers({ ...answers, [cq._id]: Array.from(s) });
              }} label={opt} />
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <Button onClick={() => setCurrentQIndex(p => p-1)} disabled={currentQIndex === 0} variant="secondary">Previous</Button>
        <div className="flex gap-3">
          <Button onClick={() => setShowReview(true)} variant="primary">Review &amp; Submit</Button>
          {currentQIndex < questions.length - 1 && (
            <Button onClick={() => setCurrentQIndex(p => p+1)}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamResultPage({ result, error, loading, onDone }) {
  if (loading) return (
    <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <LoaderIcon className="w-12 h-12 mx-auto mb-4" />
      <h2 className="text-xl font-semibold">Submitting your answers...</h2>
    </div>
  );
  if (error) return (
    <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-red-600">Submission Error</h2>
      <p className="text-gray-700 mb-6">{error}</p>
      <Button onClick={onDone} variant="secondary">Back to Dashboard</Button>
    </div>
  );
  if (result) {
    if (result.showResults === false) {
      return (
        <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto">
          <CheckIcon className="w-16 h-16 text-green-500 bg-green-100 rounded-full p-2 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Exam Submitted!</h2>
          <p className="text-lg text-gray-700 mb-6">Your submission has been recorded. Results will be released by your teacher.</p>
          <Button onClick={onDone} variant="primary" className="w-full">Back to Dashboard</Button>
        </div>
      );
    }
    const pct = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow-lg max-w-md mx-auto">
        <CheckIcon className="w-16 h-16 text-green-500 bg-green-100 rounded-full p-2 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-2">Exam Submitted!</h2>
        <p className="text-gray-500 mb-4">Here is your result:</p>
        <div className="text-6xl font-bold text-blue-600 mb-1">
          {result.score}<span className="text-3xl text-gray-400"> / {result.totalMarks}</span>
        </div>
        <p className="text-lg text-gray-500 mb-5">{pct}%</p>
        <div className="flex justify-center gap-6 text-gray-700 mb-6">
          <span className="text-green-600 font-semibold">{result.correct} correct</span>
          <span className="text-red-500 font-semibold">{result.incorrect} incorrect</span>
        </div>
        <Button onClick={onDone} variant="primary" className="w-full">Back to Dashboard</Button>
      </div>
    );
  }
  return null;
}



// ── PublishResultPage ──────────────────────────────────────────────────────────
function PublishResultPage({ examId, examTitle, onBack }) {
  const { token } = useAuth();
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState({ type: '', text: '' });
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [passingPct, setPassingPct]   = useState(35);
  const [publishMode, setPublishMode] = useState('now');
  const [scheduleAt, setScheduleAt]   = useState('');

  const loadStatus = () =>
    fetch(`${API_BASE_URL}/exams/${examId}/result-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => { setStatus(d); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { loadStatus(); }, [examId, token]);

  const handleGenerate = async () => {
    setMsg({ type: '', text: '' });
    if (publishMode === 'schedule' && !scheduleAt) {
      setMsg({ type: 'error', text: 'Please select a date and time.' }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/exams/${examId}/publish-result`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: institution, examDescription: description,
          passingPercent: passingPct, publishNow: publishMode === 'now',
          resultPublishAt: publishMode === 'schedule' ? scheduleAt : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Failed.' }); return; }
      setPopupData(data); setShowPopup(true); loadStatus();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    finally { setSaving(false); }
  };

  const GRADES = [
    { grade: 'O',  range: '90–100%', color: 'text-purple-700 bg-purple-50' },
    { grade: 'A+', range: '80–89%',  color: 'text-blue-700 bg-blue-50' },
    { grade: 'A',  range: '70–79%',  color: 'text-green-700 bg-green-50' },
    { grade: 'B+', range: '60–69%',  color: 'text-teal-700 bg-teal-50' },
    { grade: 'B',  range: '50–59%',  color: 'text-yellow-700 bg-yellow-50' },
    { grade: 'C',  range: '40–49%',  color: 'text-orange-700 bg-orange-50' },
    { grade: 'D',  range: `${passingPct}–39%`, color: 'text-amber-700 bg-amber-50' },
    { grade: 'F',  range: `< ${passingPct}%`,  color: 'text-red-700 bg-red-50' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showPopup && popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Result Published!</h2>
            <p className="text-gray-500 text-sm mb-6">
              {popupData.isPublished ? 'Students can now see their result.' : `Scheduled for ${popupData.publishAt}.`}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-3"><p className="text-2xl font-black text-blue-700">{popupData.totalStudents??'—'}</p><p className="text-xs text-blue-500 mt-0.5">Students</p></div>
              <div className="bg-green-50 rounded-xl p-3"><p className="text-2xl font-black text-green-700">{popupData.passCount??'—'}</p><p className="text-xs text-green-500 mt-0.5">Passed</p></div>
              <div className="bg-purple-50 rounded-xl p-3"><p className="text-2xl font-black text-purple-700">{popupData.avgScore??'—'}</p><p className="text-xs text-purple-500 mt-0.5">Avg</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setShowPopup(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Close</button>
              <button onClick={()=>{setShowPopup(false);onBack();}} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">Dashboard</button>
            </div>
          </div>
        </div>
      )}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back
      </button>
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl px-6 py-6 text-white">
        <div className="flex items-center gap-3"><span className="text-3xl">🏆</span><div><h2 className="text-xl font-bold">Generate Result</h2><p className="text-blue-200 text-sm">{examTitle}</p></div></div>
      </div>
      {!loading && status?.generated && (
        <div className={`rounded-xl px-5 py-4 border flex items-start gap-3 ${status.isPublished?'bg-green-50 border-green-200':'bg-yellow-50 border-yellow-200'}`}>
          <span className="text-xl">{status.isPublished?'✅':'⏳'}</span>
          <div>
            <p className="font-semibold text-sm">{status.isPublished?'Result is live':'Result scheduled'}</p>
            <p className="text-xs text-gray-500">{status.totalStudents} students · {status.passCount} passed · Avg {status.avgScore}</p>
          </div>
        </div>
      )}
      {msg.text && <div className={`px-4 py-3 rounded-lg text-sm ${msg.type==='error'?'bg-red-50 text-red-700 border border-red-200':'bg-green-50 text-green-700 border border-green-200'}`}>{msg.text}</div>}
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
        <h3 className="font-semibold text-gray-800">Configuration</h3>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
          <input value={institution} onChange={e=>setInstitution(e.target.value)} placeholder="e.g. Delhi Public School"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Description</label>
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="e.g. Annual Exam 2025"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Passing %: <strong>{passingPct}%</strong></label>
          <input type="range" min={10} max={60} value={passingPct} onChange={e=>setPassingPct(Number(e.target.value))} className="w-full accent-blue-600"/>
          <div className="flex justify-between text-xs text-gray-400"><span>10%</span><span>60%</span></div></div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Grade Scale</p>
          <div className="grid grid-cols-4 gap-1.5">{GRADES.map(g=>(
            <div key={g.grade} className={`rounded-lg px-2 py-1.5 text-center ${g.color}`}>
              <p className="font-black text-base">{g.grade}</p><p className="text-xs">{g.range}</p>
            </div>))}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Publish Mode</p>
          <div className="flex gap-3">
            <label className={`flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer ${publishMode==='now'?'border-blue-500 bg-blue-50':'border-gray-200'}`}>
              <input type="radio" value="now" checked={publishMode==='now'} onChange={()=>setPublishMode('now')} className="accent-blue-600"/>
              <div><p className="font-semibold text-sm">Now</p><p className="text-xs text-gray-400">Immediate</p></div>
            </label>
            <label className={`flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer ${publishMode==='schedule'?'border-blue-500 bg-blue-50':'border-gray-200'}`}>
              <input type="radio" value="schedule" checked={publishMode==='schedule'} onChange={()=>setPublishMode('schedule')} className="accent-blue-600"/>
              <div><p className="font-semibold text-sm">Schedule</p><p className="text-xs text-gray-400">Pick time</p></div>
            </label>
          </div>
          {publishMode==='schedule'&&(
            <input type="datetime-local" value={scheduleAt} onChange={e=>setScheduleAt(e.target.value)}
              min={new Date().toISOString().slice(0,16)} className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/>
          )}
        </div>
        <button onClick={handleGenerate} disabled={saving||loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50">
          {saving?'Generating...':'🏆 Generate & Publish Result'}
        </button>
      </div>
    </div>
  );
}

// ── StudentMyResultPage ─────────────────────────────────────────────────────
function StudentMyResultPage({ examId, examTitle, onBack }) {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/exams/${examId}/my-result`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.error) setError(d.error); else setData(d);
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [examId, token]);

  if (loading) return <div className="text-center py-16"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-gray-500">Loading result...</p></div>;
  if (error)   return <div className="max-w-lg mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-2xl text-center"><p className="text-red-700 font-semibold mb-4">{error}</p><button onClick={onBack} className="px-5 py-2 bg-blue-600 text-white rounded-lg">Back</button></div>;
  if (!data)   return null;

  const { result, exam } = data;
  const gc = { O:'bg-purple-100 text-purple-800','A+':'bg-blue-100 text-blue-800',A:'bg-green-100 text-green-800','B+':'bg-teal-100 text-teal-800',B:'bg-yellow-100 text-yellow-800',C:'bg-orange-100 text-orange-800',D:'bg-amber-100 text-amber-800',F:'bg-red-100 text-red-800' };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back
      </button>
      <div className={`rounded-2xl p-6 text-center ${result.passed?'bg-gradient-to-br from-green-500 to-emerald-600':'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
        <p className="text-5xl mb-2">{result.passed?'🎉':'📚'}</p>
        <h2 className="text-2xl font-black mb-1">{result.passed?'Congratulations!':'Better Luck Next Time'}</h2>
        <p className="text-sm opacity-80">{exam.title}</p>
        {exam.institutionName&&<p className="text-xs opacity-70 mt-0.5">{exam.institutionName}</p>}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-black text-blue-700">{result.score}<span className="text-lg text-blue-400">/{result.totalMarks}</span></p>
            <p className="text-sm text-blue-500 mt-1">Score</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-3xl font-black text-purple-700">{result.percentage}%</p>
            <p className="text-sm text-purple-500 mt-1">Percentage</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <span className={`text-2xl font-black px-3 py-1 rounded-lg inline-block ${gc[result.grade]||'bg-gray-100 text-gray-800'}`}>{result.grade}</span>
            <p className="text-xs text-gray-500 mt-1">Grade</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-black text-gray-800">#{result.rank}</p>
            <p className="text-xs text-gray-500 mt-1">Rank/{result.totalStudents}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className={`text-2xl font-black ${result.passed?'text-green-600':'text-red-600'}`}>{result.passed?'Pass':'Fail'}</p>
            <p className="text-xs text-gray-500 mt-1">Status</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Answer Summary</h3>
        <div className="flex gap-4">
          <div className="flex-1 text-center p-3 bg-green-50 rounded-xl"><p className="text-2xl font-black text-green-600">{result.correct}</p><p className="text-xs text-green-500">Correct</p></div>
          <div className="flex-1 text-center p-3 bg-red-50 rounded-xl"><p className="text-2xl font-black text-red-500">{result.incorrect}</p><p className="text-xs text-red-400">Incorrect</p></div>
          <div className="flex-1 text-center p-3 bg-orange-50 rounded-xl"><p className="text-2xl font-black text-orange-500">{result.alerts}</p><p className="text-xs text-orange-400">Alerts</p></div>
        </div>
      </div>
      {result.topicStats && result.topicStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Topic Performance</h3>
          <div className="space-y-3">
            {result.topicStats.map(t=>(
              <div key={t.topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{t.topic}</span>
                  <span className="text-gray-500">{t.marksEarned}/{t.totalMarks} · {t.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${t.percentage>=60?'bg-green-500':t.percentage>=35?'bg-yellow-400':'bg-red-400'}`} style={{width:`${t.percentage}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-center text-xs text-gray-400 pb-4">Submitted: {result.submittedAt} · Class avg: {exam.avgScore}/{exam.totalMarks}</p>
    </div>
  );
}

function ExamReportPage({ examId, examTitle, onBack }) {
  const { token } = useAuth();
  const [callGetReport, report, loading, error] = useApi(api.getExamReport);
  const [filter, setFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pdfStatus, setPdfStatus] = useState('');

  useEffect(() => { if (examId && token) callGetReport(examId, token); }, [examId, token]);

  const filtered = () => {
    if (!report || !report.students) return [];
    if (filter === 'pass')    return report.students.filter(s => s.percentage >= 50);
    if (filter === 'fail')    return report.students.filter(s => s.percentage < 50);
    if (filter === 'flagged') return report.students.filter(s => s.alerts > 0);
    return report.students;
  };

  const generatePDF = async (students) => {
    setPdfStatus('Generating...');
    try {
      if (!window.jspdf) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      let y = 20;
      const ln = (text, x, size=10, style='normal', rgb=[0,0,0]) => {
        doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...rgb);
        doc.text(String(text), x, y);
      };
      const np = (n=10) => { if (y+n > 278) { doc.addPage(); y = 20; } };

      ln(report.examTitle, 14, 16, 'bold', [30,64,175]); y += 7;
      ln(`Marks: ${report.totalMarks}  |  Questions: ${report.questionCount}  |  Students: ${report.totalStudents}  |  Avg: ${report.avgScore}`, 14, 9, 'normal', [100,100,100]); y += 8;
      doc.line(14, y, pw-14, y); y += 8;

      students.forEach(s => {
        np(55);
        ln(`${s.rank}. ${s.username}`, 14, 12, 'bold', [30,64,175]); y += 6;
        const col = s.percentage >= 75 ? [22,163,74] : s.percentage >= 50 ? [202,138,4] : [220,38,38];
        ln(`Score: ${s.score}/${s.totalMarks} (${s.percentage}%)   Correct: ${s.correct}   Incorrect: ${s.incorrect}   Alerts: ${s.alerts}`, 14, 10, 'bold', col); y += 5;
        if (s.submittedAt) { ln(`Submitted: ${s.submittedAt}`, 14, 9, 'normal', [120,120,120]); y += 5; }
        if (s.questionBreakdown) {
          s.questionBreakdown.forEach((q, qi) => {
            np(7);
            const qt = q.text.length > 75 ? q.text.substring(0,75)+'...' : q.text;
            ln(`${q.correct ? '✓' : '✗'} Q${qi+1}: ${qt}`, 18, 8, 'normal', q.correct ? [22,163,74] : [220,38,38]); y += 5;
          });
        }
        y += 3; doc.setDrawColor(220,220,220); doc.line(14, y, pw-14, y); y += 6;
      });
      doc.save(`${(report.examTitle||'Exam').replace(/\s+/g,'_')}_Report.pdf`);
      setPdfStatus('Downloaded!'); setTimeout(() => setPdfStatus(''), 3000);
    } catch(e) { setPdfStatus('Failed: ' + e.message); }
  };

  const BarChart = ({ data, labelKey, valueKey, maxVal, color='#3B82F6' }) => {
    if (!data || !data.length) return null;
    const bh = 22, gap = 5, cw = 420, lw = 150;
    const mx = maxVal || Math.max(...data.map(d => d[valueKey]), 1);
    return (
      <div className="overflow-x-auto">
        <svg width={cw+lw+60} height={data.length*(bh+gap)+20} style={{fontFamily:'sans-serif'}}>
          {data.map((d,i) => {
            const bw = Math.max(2, Math.round((d[valueKey]/mx)*cw));
            const ty = i*(bh+gap)+bh/2+3;
            const label = String(d[labelKey]);
            return (
              <g key={i}>
                <text x={lw-6} y={ty} textAnchor="end" fontSize="11" fill="#374151" dominantBaseline="middle">
                  {label.length>20 ? label.substring(0,20)+'…' : label}
                </text>
                <rect x={lw} y={i*(bh+gap)} width={bw} height={bh} fill={color} rx="3"/>
                <text x={lw+bw+5} y={ty} fontSize="11" fill="#374151" dominantBaseline="middle">{d[valueKey]}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) return <div className="text-center p-12 bg-white rounded-xl shadow"><LoaderIcon className="w-12 h-12 mx-auto text-blue-500 mb-4"/><p>Loading report...</p></div>;
  if (error)   return <div className="text-center p-12 bg-white rounded-xl shadow"><AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4"/><p className="text-red-600 mb-4">{error}</p><Button onClick={onBack} variant="secondary">Back</Button></div>;
  if (!report) return null;

  const students = filtered();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-xl p-6 flex justify-between items-start border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam Report</h2>
          <p className="text-gray-500">{examTitle || report.examTitle}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button onClick={() => generatePDF(students)} variant="secondary" disabled={!!pdfStatus}>
            📄 {pdfStatus || `PDF (${students.length} students)`}
          </Button>
          <Button onClick={onBack} variant="secondary">Back</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Total Students', report.totalStudents,                        'blue'],
          ['Average Score',  `${report.avgScore}/${report.totalMarks}`,   'purple'],
          ['Top Score',      `${report.topScore}/${report.totalMarks}`,   'green'],
          ['Pass Rate',      `${report.passCount}/${report.totalStudents}`,'yellow'],
        ].map(([lbl, val, col]) => (
          <div key={lbl} className={`bg-${col}-50 border border-${col}-100 rounded-xl p-4 text-center`}>
            <p className={`text-${col}-700 text-xs font-bold uppercase tracking-wide`}>{lbl}</p>
            <p className={`text-2xl font-black text-${col}-900 mt-1`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-2 flex-wrap items-center">
        <span className="text-sm font-semibold text-gray-600 mr-1">Filter:</span>
        {[['all','All'],['pass','Passed ≥50%'],['fail','Failed'],['flagged','Flagged']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${filter===v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{students.length} shown</span>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Score Distribution</h3>
        <BarChart data={students.map(s => ({name: s.username, score: s.score}))} labelKey="name" valueKey="score" maxVal={report.totalMarks} color="#3B82F6" />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Question Difficulty (Wrong Answers)</h3>
        <BarChart data={(report.questionStats||[]).map((q,i) => ({name:`Q${i+1}: ${q.text.substring(0,28)}…`, incorrect: q.incorrect}))} labelKey="name" valueKey="incorrect" maxVal={report.totalStudents} color="#EF4444" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100"><h3 className="text-lg font-bold">Student Results</h3></div>
        {!students.length ? <p className="text-gray-500 text-center py-12">No students match this filter.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[750px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#','Student','Score','%','✓','✗','Alerts','Submitted',''].map(h => (
                    <th key={h} className="py-3 px-4 font-bold text-gray-700 text-center first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s,i) => {
                  const bc = s.percentage>=75?'bg-green-500':s.percentage>=50?'bg-yellow-400':'bg-red-400';
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-500">#{s.rank}</td>
                      <td className="py-3 px-4 font-semibold">{s.username}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{s.score}/{s.totalMarks}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${bc}`} style={{width:`${s.percentage}%`}}></div>
                          </div>
                          <span className="text-xs font-semibold">{s.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-green-600">{s.correct}</td>
                      <td className="py-3 px-4 text-center font-bold text-red-500">{s.incorrect}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.alerts>0?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>{s.alerts}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{s.submittedAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedStudent(selectedStudent?.username===s.username ? null : s)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                            {selectedStudent?.username===s.username ? 'Hide' : 'View'}
                          </button>
                          <button onClick={() => generatePDF([s])}
                            className="px-2 py-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-bold mb-4">Question Breakdown — {selectedStudent.username}</h3>
          <div className="space-y-2">
            {(selectedStudent.questionBreakdown||[]).map((q,i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${q.correct?'bg-green-50 border border-green-100':'bg-red-50 border border-red-100'}`}>
                <span className={`font-bold text-sm mt-0.5 ${q.correct?'text-green-600':'text-red-500'}`}>{q.correct?'✓':'✗'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Q{i+1}: {q.text}</p>
                  {!q.correct && <p className="text-xs text-red-600 mt-1">Answered: <em>{q.studentAnswer?.join(', ')||'No answer'}</em> · Correct: <em>{q.correctAnswer?.join(', ')}</em></p>}
                </div>
                <span className="text-xs font-semibold text-gray-500">{q.marks}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// --- Root Render ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  // Create a root element if it doesn't exist
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  const root = createRoot(newRoot);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
}