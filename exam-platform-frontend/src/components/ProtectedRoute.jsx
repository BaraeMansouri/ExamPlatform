import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useContext(AuthContext);

    // ⏳ Chargement
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                Loading...
            </div>
        );
    }

    // 🔐 Non connecté
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // ✅ Autorisé
    return <Outlet />;
};

export default ProtectedRoute;