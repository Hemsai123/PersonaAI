import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import Pricing from './components/Pricing';
import Contact from './components/Contact';
import UserProfile from './components/UserProfile';
import ManualInput from './components/ManualInput';
import StructuredInput from './components/StructuredInput';
import RawInput from './components/RawInput';
import Chat from './components/Chat';
import TripPlanner from './components/TripPlanner';
import CreativeHelper from './components/CreativeHelper';
import TextAdventure from './components/TextAdventure';
import DecisionHelper from './components/DescisionHelper';
import PersonaStudio from './components/PersonaStudio';
import Navbar from './components/Navbar';
import Login from './components/Login';
import SharedPersona from './components/SharedPersona';

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
};

const AppContent = () => {
    const location = useLocation();
    const fullScreenRoutes = [
        '/chat',
        '/decision-helper',
        '/studio',
        '/text-adventure',
        '/creative-helper',
    ];
    const isFullScreenApp = fullScreenRoutes.some((route) => location.pathname.startsWith(route));

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <ScrollToTop />
            <Navbar />
            <main className="flex-grow flex flex-col">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/p/:slug" element={<SharedPersona />} />
                    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/manual-input" element={<ProtectedRoute><ManualInput /></ProtectedRoute>} />
                    <Route path="/structured-input" element={<ProtectedRoute><StructuredInput /></ProtectedRoute>} />
                    <Route path="/raw-input" element={<ProtectedRoute><RawInput /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/trip-planner" element={<ProtectedRoute><TripPlanner /></ProtectedRoute>} />
                    <Route path="/creative-helper" element={<ProtectedRoute><CreativeHelper /></ProtectedRoute>} />
                    <Route path="/text-adventure" element={<ProtectedRoute><TextAdventure /></ProtectedRoute>} />
                    <Route path="/decision-helper" element={<ProtectedRoute><DecisionHelper /></ProtectedRoute>} />
                    <Route path="/studio" element={<ProtectedRoute><PersonaStudio /></ProtectedRoute>} />
                </Routes>
            </main>
            {!isFullScreenApp && <Footer />}
        </div>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
