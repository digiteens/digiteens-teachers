import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Navbar from './Navbar'; // Import the Navbar component

import Classroom from "./Classroom";
import Activity from "./Activity";
import Activity_Detail from "./Activity_Detail";
import Results from "./Results";
import PastActivities from "./PastActivities";
import Class_List from "./Class_List";
import Info from "./Info";
import LoginPage from "./LoginPage";
import Start_Module from "./Start_Module";
import Start_Activity from "./Start_Activity";
import Plan_Module from "./Plan_Module";
import Manage_Activity from "./Manage_Activity";
import Home from "./Home"; // Assuming Home is in a separate file

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> {/* Use the Navbar component here */}
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/Activity_Detail/:classid/:progid/:argid/:modid/:actid/:isCompetitive" element={<ProtectedRoute><Activity_Detail /></ProtectedRoute>} />
          <Route path="/Classroom/:classid" element={<ProtectedRoute><Classroom /></ProtectedRoute>} />
          <Route path="/Activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/Results/:classid/:progid/:argid/:modid/:actid" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/PastActivities/:classid" element={<ProtectedRoute><PastActivities /></ProtectedRoute>} />
          <Route path="/Class_List/:classid" element={<ProtectedRoute><Class_List /></ProtectedRoute>} />
          <Route path="/Info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
          <Route path="/LoginPage" element={<LoginPage />} /> {/* LoginPage should not be protected */}
          <Route path="/Start_Module/:classid" element={<ProtectedRoute><Start_Module /></ProtectedRoute>} />
          <Route path="/Start_Activity/:classid/:progid" element={<ProtectedRoute><Start_Activity /></ProtectedRoute>} />
          <Route path="/Plan_Module/:classid/:progid/:argid/:modid" element={<ProtectedRoute><Plan_Module /></ProtectedRoute>} />
          <Route path="/Manage_Activity/:classid" element={<ProtectedRoute><Manage_Activity /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;