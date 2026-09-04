import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return (React.createElement(Navigate, { to: "/login", state: { from: `${location.pathname}${location.search}`, fromState: location.state }, replace: true }));
    }
    return React.createElement(React.Fragment, null, children);
};
export default ProtectedRoute;
