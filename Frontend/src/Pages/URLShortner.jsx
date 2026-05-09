import { useState } from "react";
import axios from "axios";
import UrlCards from "./UrlCards";
import { toast } from "react-hot-toast";
import HomeAnimatedBackground from "../Components/HomeAnimatedBackground";
import { useNavigate } from "react-router";

const URLShortner = () => {
  const navigate = useNavigate()
  const [urls, setUrls] = useState([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [customTail, setCustomTail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    setIsSubmitting(true);

    try {
      const data = {
        url: originalUrl,
        shortUrl: customTail,
      };

      console.log("Data at Frontend:", data);

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await axios.post(`${API_URL}/urlshortner`, data, {
        withCredentials: true,
        /* Authorization: `Bearer ${localStorage.getItem("token")}` */
      });

      console.log("Response from Backend:", res.data);

      const newUrl = {
        id: Date.now(),
        originalUrl: originalUrl,
        shortUrl: res.data.shortUrl || customTail,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };

      setUrls((prev) => [newUrl, ...prev]);

      setOriginalUrl("");
      setCustomTail("");
      toast.success(res?.data?.message);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to shorten URL";
      toast.error(errorMessage);
      
      // Redirect to login page for login 
      navigate("/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pt-32 pb-20 px-6 min-h-screen text-white z-0 animate-in fade-in duration-700 relative">
      <HomeAnimatedBackground />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Create Your <span className="text-gradient">Short Link</span>
          </h1>
          <p className="text-muted text-lg max-w-lg mx-auto">
            Enter your long URL and choose a custom path if you want.
          </p>
        </div>

        {/* Form Section */}
        <div className="glass-card p-10 rounded-3xl shadow-2xl border border-white/5 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/*IDEA: Original URL Input box */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted ml-1">
                  Original URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very-long-link"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder:text-muted/50"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                />
              </div>

              {/*IDEA: Short URL Input box */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted ml-1">
                  Custom Link (Optional)
                </label>
                <div className="flex flex-col sm:flex-row bg-background/50 border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
                  <span className="text-muted text-sm border-b sm:border-b-0 sm:border-r border-border pb-2 mb-2 sm:pb-0 sm:mb-0 sm:pr-3 sm:mr-3 font-medium flex items-center">
                    url.short/
                  </span>
                  <input
                    type="text"
                    placeholder="my-link"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-muted/50 w-full"
                    value={customTail}
                    onChange={(e) => setCustomTail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* IDEA: Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`cursor-pointer w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-xl shadow-primary/20 active:scale-[0.98] transform hover:scale-[1.01] flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Shortening...
                </>
              ) : (
                "Shorten URL"
              )}
            </button>
          </form>
        </div>

        {/* List Section */}
        <UrlCards urls={urls} setUrls={setUrls} />
      </div>
    </section>
  );
};

export default URLShortner;
