import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const UrlCards = ({ urls, setUrls }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [editShortUrl, setEditShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async (id, shortcode) => {
    try {
      const api_url = import.meta.env.VITE_API_URL || "http://localhost:3000";
      
      // Ensure absolute URL even if api_url is relative (like /api)
      let baseUrl = api_url;
      if (api_url.startsWith("/")) {
        baseUrl = window.location.origin + api_url;
      }
      
      // Normalize slashes (remove trailing and ensure one between base and code)
      const cleanBase = baseUrl.replace(/\/+$/, "");
      const fullUrl = `${cleanBase}/${shortcode}`;

      // Try modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = fullUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error("Unable to copy to clipboard");
        }
      }

      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Link copied!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  const handleDeleteUrl = (id) => {
    toast((t) => (
      <span className="flex flex-col gap-4 text-sm text-gray-700">
        <p className="font-medium text-gray-800">
          Are you sure you want to delete this URL?
        </p>

        <div className="flex justify-end gap-3 mt-2">
          <button
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition duration-200 cursor-pointer"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setIsLoading(true);
                const API_URL =
                  import.meta.env.VITE_API_URL || "http://localhost:3000";

                await axios.delete(`${API_URL}/${id}`, {
                  withCredentials: true,
                  /* headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                  } */
                });

                // {Update the ulrls on which map is applied}
                setUrls((prev) => prev.filter((url) => url.id !== id));

                toast.success("URL deleted successfully!");
              } catch (error) {
                console.error("Error deleting URL:", error);
                const errorMessage =
                  error.response?.data?.error || "Failed to delete URL";

                toast.error(errorMessage);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            Yes, Delete
          </button>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition duration-200 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </span>
    ));
  };

  const handleEditClick = (url) => {
    console.log(url)
    setEditingId(url.id);
    setEditUrl(url.originalUrl);
    setEditShortUrl(url.shortUrl);
  };

  const handleUpdateUrl = async () => {
    if (!editUrl) {
      toast.error("Original URL is required!");
      return;
    }

    try {
      setIsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      // Send the request to server to update the data in the backend database
      const response = await axios.put(`${API_URL}/${editingId}`, {
        url: editUrl,
        shortUrl: editShortUrl || undefined,
      }, {
        withCredentials: true,
        /* headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        } */
      });


      setUrls(urls.map(url =>
        url.id === editingId
          ? {
            ...url,
            originalUrl: response.data.originalUrl,
            shortUrl: response.data.shortUrl,
          }
          : url
      ));

      setEditingId(null);
      setEditUrl("");
      setEditShortUrl("");
      toast.success("URL updated successfully!");
    } catch (error) {
      console.error("Error updating URL:", error);
      const errorMessage = error.response?.data?.error || "Failed to update URL";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditUrl("");
    setEditShortUrl("");
  };

  // This is used to fetch the data from the backend database
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await axios.get(`${API_URL}/urlshortner`, {
          withCredentials: true,
          /* headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          } */
        });
        // console.log(res);

        // Map backend database fields to frontend property names
        const mappedData = res.data.map((item) => ({
          id: item.id,
          originalUrl: item.url,
          shortUrl: item.shortCode,
          clicks: item.clicks,
          createdAt: item.createdAt,
        }));

        setUrls(mappedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // Fetch on initial load
    fetchUrls();

    // Re-fetch when user returns to this tab (makes clicks feel dynamic)
    window.addEventListener("focus", fetchUrls);
    return () => window.removeEventListener("focus", fetchUrls);
  }, [setUrls]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold px-2">Recent Links</h2>
      <div className="grid gap-4">
        {urls.length > 0 ? (
          urls.map((url) => (
            <div key={url.id}>
              {editingId === url.id ? (
                // EDIT MODAL
                <div className="glass-card p-6 rounded-2xl border border-primary/30 space-y-4 animate-in fade-in zoom-in duration-300">
                  <h3 className="text-lg font-bold text-white mb-4">Edit URL</h3>

                  {/* Input Fields */}
                  <div className="space-y-3">
                    {/* handle Original URL */}
                    <div>
                      <label className="text-sm font-semibold text-muted block mb-2">
                        Original URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder:text-muted/50"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* Handle The ShortCode URL */}
                    <div>
                      <label className="text-sm font-semibold text-muted block mb-2">
                        Short Code
                      </label>
                      <input
                        type="text"
                        value={editShortUrl}
                        onChange={(e) => setEditShortUrl(e.target.value)}
                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder:text-muted/50"
                        placeholder="Leave empty to keep current"
                      />
                    </div>

                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUpdateUrl}
                      disabled={isLoading}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // NORMAL CARD VIEW
                <div
                  className="glass-card p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5 group hover:border-white/10 transition-all animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
                >
                  {/* IDEA: URL-Details */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Short URL (Clickable) */}
                      <a
                        href={`${(() => {
                          const api_url = import.meta.env.VITE_API_URL || "http://localhost:3000";
                          let baseUrl = api_url;
                          if (api_url.startsWith("/")) {
                            baseUrl = window.location.origin + api_url;
                          }
                          return baseUrl.replace(/\/+$/, "");
                        })()}/${url.shortUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-bold hover:underline truncate text-base sm:text-lg"
                      >
                        url.short/{url.shortUrl}
                      </a>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(url.id, url.shortUrl)}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${copiedId === url.id
                          ? "bg-green-500/20 text-green-400"
                          : "hover:bg-white/5 text-muted"
                          }`}
                        title={copiedId === url.id ? "Copied!" : "Copy link"}
                      >
                        {copiedId === url.id ? (
                          <svg
                            className="w-4 h-4 cursor-pointer"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 cursor-pointer"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}

                      </button>

                    </div>

                    {/* Original URL */}
                    <p className="text-sm text-muted break-all sm:truncate max-w-full md:max-w-md">
                      {url.originalUrl}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-8 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    {/* IDEA: Click Counts */}
                    <div className="text-center md:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">
                        Clicks
                      </p>
                      <p className="text-xl font-bold text-white">{url.clicks}</p>
                    </div>

                    {/* IDEA: the date of short-url creation showing */}
                    <div className="text-center md:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">
                        Date
                      </p>
                      <p className="text-sm font-medium text-white/80">
                        {new Date(url.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-auto md:ml-4">

                      {/* update the url */}
                      <button
                        onClick={() => handleEditClick(url)}
                        disabled={isLoading}
                        className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title="Edit URL"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {/* Delete the url */}
                      <button
                        onClick={() => handleDeleteUrl(url.id)}
                        disabled={isLoading}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete URL"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>

                    </div>
                  </div>

                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 glass-card rounded-3xl border border-dashed border-white/10">
            <p className="text-muted">
              No links created yet. Start shortening!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlCards;
