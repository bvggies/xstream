import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiLayout,
  FiPlay,
  FiUsers,
  FiFlag,
  FiBarChart2,
  FiFilm,
  FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: FiLayout },
    { path: '/admin/matches', label: 'Matches', icon: FiPlay },
    { path: '/admin/highlights', label: 'Highlights', icon: FiFilm },
    { path: '/admin/users', label: 'Users', icon: FiUsers },
    { path: '/admin/reports', label: 'Reports', icon: FiFlag },
    { path: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  ];

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-700 z-40"
    >
      <div className="p-6 border-b border-dark-700">
        <Link to="/admin" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Xstream" className="h-8 w-auto" />
          <span className="text-xl font-bold text-white">Admin</span>
        </Link>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white w-full transition-all"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default AdminSidebar;

