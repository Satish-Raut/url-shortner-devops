import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const Navbar = () => {
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userdata, setUserData] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await axios.get(
          `${API_URL}/auth/me`,
          {
            withCredentials: true,
            /* Authorization: `Bearer ${localStorage.getItem("token")}` */
          }
        );

        console.log("user data by Id at Navbar: \n", res.data);
        if (res.data.loggedIn) {
          setIsLoggedIn(true);
          setUserData(res.data.user);
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkAuth();
  }, []);

  const handleLogOut = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const res = await axios.post(
        `${API_URL}/logout`,
        {},
        {
          withCredentials: true,
          /* Authorization: `Bearer ${localStorage.getItem("token")}` */
        }
      );

      // { NOTE: Clear token from localStorage }
      // localStorage.removeItem("token");

      setIsLoggedIn(false);
      setUserData({});
      setIsDropdownOpen(false);

      toast.success(res.data.message);
      navigate("/");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 glass-card mx-2 sm:mx-4 my-2 sm:my-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg sm:text-xl">U</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white hidden sm:block">
              URL<span className="text-primary">Shortner</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {!isLoggedIn ? (
            <>

              {/* Login */}
              <Link
                to="/login"
                className="text-sm font-semibold text-muted hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
              >
                Login
              </Link>
              {/* Register */}
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300"
              >
                Sign Up
              </Link>

            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-primary/30 hover:scale-105 transition cursor-pointer"
              >
                {userdata?.name?.charAt(0)}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 sm:w-56 bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-5 animate-fade-in">

                  {/* User Info */}
                  <div className="flex flex-col gap-1 border-b border-white/10 pb-3 mb-3">
                    <p className="text-white font-semibold text-sm sm:text-base">
                      Welcome {userdata?.name}
                    </p>

                    <p className="text-muted text-xs sm:text-sm whitespace-nowrap overflow-hidden truncate">
                      {userdata?.email}
                    </p>
                  </div>

                  {/* Profile */}
                  <button
                    onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-green-500/10 transition font-semibold text-sm cursor-pointer"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogOut}
                    className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition font-semibold text-sm cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
          <Link
            to="/urlshortner"
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/25 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Short URL
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          {!isLoggedIn ? (
            <>

              {/* Login */}
              <Link
                to="/login"
                className="text-sm font-semibold text-muted hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
              >
                Login
              </Link>
              {/* Register */}
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300"
              >
                Sign Up
              </Link>

            </>
          ) : (

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-primary/30 hover:scale-105 transition cursor-pointer"
              >
                {userdata?.name?.charAt(0)}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 sm:w-56 bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-5 animate-fade-in">

                  {/* User Info */}
                  <div className="flex flex-col gap-1 border-b border-white/10 pb-3 mb-3">
                    <p className="text-white font-semibold text-sm sm:text-base">
                      Welcome {userdata?.name}
                    </p>

                    <p className="text-muted text-xs sm:text-sm whitespace-nowrap overflow-hidden truncate">
                      {userdata?.email}
                    </p>
                  </div>

                  {/* Profile */}
                  <button
                    onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-green-500/10 transition font-semibold text-sm cursor-pointer"
                  >
                    Profile
                  </button>
                  {/* Logout */}
                  <button
                    onClick={handleLogOut}
                    className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition font-semibold text-sm cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-4 pb-6 md:hidden flex flex-col items-center gap-6 animate-fade-in">
          <Link
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xl font-bold text-white hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full max-w-xs text-center px-6 py-3 text-lg font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/50 transition-all"
          >
            Sign Up
          </Link>
          <Link
            to="/urlshortner"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full max-w-xs text-center px-6 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25"
          >
            Create Short URL
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
