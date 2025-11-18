import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Shield, Vote } from "lucide-react";
import Logo from '../common/Logo';

const Navbar = ({ isAdminLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ... (Keep your existing links definitions here: publicLinks, adminLinks) ...
  const publicLinks = [
    { path: "/Register", name: "Register", icon: <User size={18} /> }, // Increased icon size
    { path: "/Verify", name: "Verify", icon: <Shield size={18} /> },
    { path: "/district-register", name: "District Reg", icon: <Vote size={18} /> },
  ];

  const adminLinks = [
    { path: "/district-dashboard", name: "Dashboard" },
    { path: "/create-election", name: "Create Election" },
    { path: "/view-election", name: "All Elections" },
  ];

  const links = isAdminLoggedIn ? adminLinks : publicLinks;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? "bg-slate-900/90 backdrop-blur-xl border-white/10 py-4 shadow-2xl" // Increased padding
            : "bg-transparent border-transparent py-6" // Increased padding
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          
          {/* LOGO */}
          <div onClick={() => navigate("/")} className="cursor-pointer scale-110"> {/* Made logo slightly larger */}
            <Logo size="small" animated={true} />
          </div>

          {/* DESKTOP NAVIGATION - TEXT SIZE INCREASED */}
          <div className="hidden md:flex items-center gap-3 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            {links.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  onMouseEnter={() => setHoveredPath(item.path)}
                  onMouseLeave={() => setHoveredPath(location.pathname)}
                  className="relative px-6 py-3 rounded-full text-lg font-medium transition-colors duration-300 flex items-center gap-2.5" 
                >
                  {/* The Sliding Glow Background */}
                  {hoveredPath === item.path && (
                    <motion.div
                      layoutId="navbar-glow"
                      className="absolute inset-0 bg-blue-600 rounded-full z-0 shadow-[0_0_20px_rgba(37,99,235,0.5)]" // Added shadow to glow
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  
                  {/* The Text/Icon */}
                  <span className={`relative z-10 flex items-center gap-2 ${
                    hoveredPath === item.path ? "text-white" : "text-gray-300"
                  }`}>
                    {item.icon && item.icon}
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* AUTH BUTTONS */}
          <div className="hidden md:flex items-center gap-4">
            {!isAdminLoggedIn ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(37,99,235,0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/district-login")}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold shadow-lg border border-white/10 transition-all"
              >
                District Login
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 text-lg border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <LogOut size={20} />
                Logout
              </motion.button>
            )}
          </div>

          {/* ... Keep Mobile Menu Toggle ... */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>
      {/* ... Keep Mobile Menu Overlay ... */}
       <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[88px] left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 z-40 md:hidden overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {links.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 text-lg ${
                    location.pathname === item.path 
                      ? "bg-blue-600 text-white" 
                      : "bg-white/5 text-gray-300"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              
              {!isAdminLoggedIn ? (
                <button
                  onClick={() => {
                    navigate("/district-login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold"
                >
                  District Login
                </button>
              ) : (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-xl bg-red-500/20 text-red-400 text-lg font-bold border border-red-500/30"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;