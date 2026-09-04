import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
const App = () => {
    return (React.createElement(ThemeProvider, null,
        React.createElement(AuthProvider, null,
            React.createElement(Router, null,
                React.createElement("div", { className: "flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" },
                    React.createElement(Navbar, null),
                    React.createElement("main", { className: "flex-grow" },
                        React.createElement(Routes, null,
                            React.createElement(Route, { path: "/", element: React.createElement(Home, null) }),
                            React.createElement(Route, { path: "/about", element: React.createElement(About, null) }),
                            React.createElement(Route, { path: "/pricing", element: React.createElement(Pricing, null) }),
                            React.createElement(Route, { path: "/contact", element: React.createElement(Contact, null) }),
                            React.createElement(Route, { path: "/login", element: React.createElement(Login, null) }),
                            React.createElement(Route, { path: "/p/:slug", element: React.createElement(SharedPersona, null) }),
                            React.createElement(Route, { path: "/profile", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(UserProfile, null)) }),
                            React.createElement(Route, { path: "/manual-input", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(ManualInput, null)) }),
                            React.createElement(Route, { path: "/structured-input", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(StructuredInput, null)) }),
                            React.createElement(Route, { path: "/raw-input", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(RawInput, null)) }),
                            React.createElement(Route, { path: "/chat", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(Chat, null)) }),
                            React.createElement(Route, { path: "/trip-planner", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(TripPlanner, null)) }),
                            React.createElement(Route, { path: "/creative-helper", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(CreativeHelper, null)) }),
                            React.createElement(Route, { path: "/text-adventure", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(TextAdventure, null)) }),
                            React.createElement(Route, { path: "/decision-helper", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(DecisionHelper, null)) }),
                            React.createElement(Route, { path: "/studio", element: React.createElement(ProtectedRoute, null,
                                    React.createElement(PersonaStudio, null)) }))),
                    React.createElement(Footer, null))))));
};
export default App;
