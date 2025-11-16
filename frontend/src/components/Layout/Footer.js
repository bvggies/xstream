import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Xstream" className="h-8 w-auto" />
              <span className="text-lg font-bold text-white">Xstream</span>
            </div>
            <p className="text-dark-400 text-sm">
              Your ultimate destination for live football streaming.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-dark-400 hover:text-white text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/matches" className="text-dark-400 hover:text-white text-sm">
                  Matches
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-dark-400 hover:text-white text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-dark-400 hover:text-white text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-dark-400 hover:text-white text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-dark-400 hover:text-white text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-dark-400 hover:text-white text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-dark-800 text-center text-dark-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Xstream. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

