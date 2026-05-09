import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Signing in...");

    try {
      // {Get th Url of Server(Backend) to which we make request from the env file}
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

      //{ Now get send the details to the backend for varification and get the responce}
      const response = await axios.post(`${API_URL}/login`, formData, {
        withCredentials: true,
      });

      if (response.data.success) {
        /* if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        } */
        toast.success(response.data.message, { id: loadingToast });
        // Follow the backend's redirection command
        navigate(response.data.redirectTo || "/");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.data.message || "Login failed", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Login Error:", error);

      // Handle known backend responses attached to an error (like 404 Not Found)->{if the user not registered redirect him to Registration Page}
      if (error.response && error.response.status === 404 && error.response.data.redirectTo) {
        toast.error(error.response.data.message || "Account not found.", { id: loadingToast });
        navigate(error.response.data.redirectTo);
      } else {
        toast.error(
          error.response?.data?.message || "An error occurred during login",
          { id: loadingToast },
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32 pb-12 overflow-x-hidden relative">
      <AnimatedBackground />
      <div className="glass-card w-full max-w-4xl flex flex-col md:flex-row rounded-2xl shadow-2xl auth-card-entrance overflow-hidden">

        {/* Image Section */}
        <div className="hidden md:block md:w-1/2 relative bg-primary/10">
          <img
            src="/images/login-bg.png"
            alt="Login Illustration"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent flex flex-col justify-end p-8 staggered-reveal [animation-delay:0.8s]">
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Welcome Back!</h2>
            <p className="text-white/80 drop-shadow-sm">Ready to shorten more links and track your audience? Access your dashboard now.</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-10 staggered-reveal [animation-delay:0.2s]">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
              Sign <span className="text-gradient">In</span>
            </h1>
            <p className="text-muted text-sm">
              Please enter your details to sign in.
            </p>
          </div>

          {/* React automatically passes the event to handleSubmit function. */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 staggered-reveal [animation-delay:0.4s]">
              <label className="text-sm font-medium ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none placeholder:text-muted/50"
                required
              />
            </div>

            <div className="space-y-2 staggered-reveal [animation-delay:0.5s]">
              {/* TODO:" Handle The forgot Password" */}
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* {Password Field} */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none placeholder:text-muted/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 mt-4 cursor-pointer staggered-reveal [animation-delay:0.6s]"
            >
              Sign In
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-muted staggered-reveal [animation-delay:0.7s]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Register for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
