import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="mt-auto pt-6 border-t">
            <nav className="w-64 bg-white shadow-md p-4">
                <h1 className="text-xl font-bold mb-6">ExamPlatform</h1>
                <ul>
                    <li className="mb-2"><Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link></li>
                    <li className="mb-2"><Link to="/exams/create" className="text-blue-600 hover:underline">Créer Examen</Link></li>
                </ul>
                <div className="mt-auto pt-6 border-t mt-4">
                    <p className="mb-2 text-sm text-gray-600">Connecté en tant que: {user?.name}</p>
                    <button onClick={handleLogout} className="text-red-500 hover:underline text-sm font-bold">Déconnexion</button>
                </div>
            </nav>
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
