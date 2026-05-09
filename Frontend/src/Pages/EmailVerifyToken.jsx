import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { MdOutlineEmail } from "react-icons/md";
import HomeAnimatedBackground from "../Components/HomeAnimatedBackground";
import toast from "react-hot-toast";

const EmailVerifyToken = () => {
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const email = params.get("email");

    if (!token || !email) {
      setStatus("error");
      return;
    }

    const verifyToken = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        await axios.post(`${API_URL}/verify-email-token`, { token, email });
        setStatus("success");
        toast.success("Email verified successfully!");
        
        // Redirect to profile or home after success
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      } catch (error) {
        setStatus("error");
        toast.error(error.response?.data?.message || "Verification failed");
      }
    };

    verifyToken();
  }, [location, navigate]);

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 min-h-screen text-white relative flex items-center justify-center">
      <HomeAnimatedBackground />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="glass-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl p-8 text-center">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className={`absolute inset-0 rounded-full blur-2xl scale-150 animate-pulse-slow ${status === 'success' ? 'bg-green-500/20' : status === 'error' ? 'bg-red-500/20' : 'bg-primary/20'}`} />
            <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl ${status === 'success' ? 'from-green-500 to-green-600 shadow-green-500/30' : status === 'error' ? 'from-red-500 to-red-600 shadow-red-500/30' : 'from-primary to-secondary shadow-primary/30'}`}>
              <MdOutlineEmail className="w-9 h-9 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3">
            {status === "verifying" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </h2>

          <p className="text-muted text-sm leading-relaxed mb-6">
            {status === "verifying" && "Please wait while we confirm your secure token."}
            {status === "success" && "Your email has been successfully verified. Redirecting you to your profile..."}
            {status === "error" && "The token is invalid or has expired. Please request a new verification link."}
          </p>
          
          {status === "error" && (
            <button
              onClick={() => navigate("/profile")}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300"
            >
              Back to Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default EmailVerifyToken;
