import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import HomeAnimatedBackground from "../Components/HomeAnimatedBackground";
import { MdOutlineEmail, MdVerified } from "react-icons/md";

/* ─────────────────────────────────────────────────────────
   Small reusable stat card
───────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color }) => (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 border border-white/5 hover:border-white/10 transition-all group">
        <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color} shadow-lg`}
        >
            {icon}
        </div>
        <div>
            <p className="text-2xl font-extrabold text-white">{value ?? "—"}</p>
            <p className="text-xs text-muted font-semibold uppercase tracking-wider mt-0.5">
                {label}
            </p>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Main Profile component
───────────────────────────────────────────────────────── */
const Profile = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    /* ── state ── */
    const [user, setUser] = useState(null);
    const [urls, setUrls] = useState([]);
    const [loading, setLoading] = useState(true);

    /* edit-name modal */
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [savingName, setSavingName] = useState(false);

    /* ── fetch current user ── */
    useEffect(() => {
        const init = async () => {
            try {
                const [meRes, urlRes] = await Promise.all([
                    axios.get(`${API_URL}/auth/me`, { withCredentials: true }),
                    axios.get(`${API_URL}/urlshortner`, { withCredentials: true }),
                ]);

                if (!meRes.data.loggedIn) {
                    navigate("/login");
                    return;
                }

                // console.log(meRes)
                setUser(meRes.data.user);
                setNewName(meRes.data.user?.name || "");

                const mapped = urlRes.data.map((item) => ({
                    id: item.id,
                    originalUrl: item.url,
                    shortUrl: item.shortCode,
                    clicks: item.clicks,
                    createdAt: item.createdAt,
                }));
                setUrls(mapped);
            } catch {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [API_URL, navigate]);

    /* ── derived stats ── */
    const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);
    const topLink = [...urls].sort((a, b) => b.clicks - a.clicks)[0];

    /* ── Set the data of the user to EDIT ── */
    const handleEditClick = async () => {
        setEditingName(user.name);
        setEditingId(user.id);
    };

    /* ── save name ── */
    const handleSaveName = async () => {
        if (!newName.trim()) return toast.error("Name cannot be empty");
        try {
            setSavingName(true);
            // adjust endpoint if your backend differs
            const res = await axios.put(
                `${API_URL}/update-profile/${editingId}`,
                { name: newName.trim() },
                { withCredentials: true },
            );
            setUser((prev) => ({ ...prev, name: newName.trim() }));
            setEditingName(false);
            toast.success(res.message || "Name updated!");
        } catch {
            toast.error("Failed to update name");
        } finally {
            setSavingName(false);
        }
    };

    /* ── logout ── */
    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
            toast.success("Logged out successfully");
            navigate("/");
            setTimeout(() => window.location.reload(), 1000);
        } catch {
            toast.error("Failed to logout");
        }
    };

    /* ── loading skeleton ── */
    if (loading) {
        return (
            <section className="pt-32 pb-20 px-6 min-h-screen text-white relative">
                <HomeAnimatedBackground />
                <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                    <div className="h-40 glass-card rounded-3xl" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 glass-card rounded-2xl" />
                        ))}
                    </div>
                    <div className="h-64 glass-card rounded-3xl" />
                </div>
            </section>
        );
    }

    //   console.log(user)

    const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "N/A";

    return (
        <section className="pt-32 pb-20 px-4 sm:px-6 min-h-screen text-white relative animate-in fade-in duration-700">
            <HomeAnimatedBackground />

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                {/* ── Page heading ── */}
                <div className="text-center mb-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        Your <span className="text-gradient">Profile</span>
                    </h1>
                    <p className="text-muted mt-2">
                        Manage your account and view your link stats
                    </p>
                </div>

                {/* ── Profile hero card ── */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                    {/* avatar */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-white shadow-2xl shadow-primary/30 select-none">
                            {avatarLetter}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                            <svg
                                className="w-3.5 h-3.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* user info */}
                    <div className="flex-1 text-center sm:text-left">
                        {editingName ? (
                            <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                                <input
                                    id="profile-name-input"
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                    className="bg-background/60 border border-border rounded-xl px-4 py-2 text-white text-xl font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-full sm:w-auto"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveName}
                                        disabled={savingName}
                                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer"
                                    >
                                        {savingName ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingName(false);
                                            setNewName(user?.name || "");
                                        }}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                                    {user?.name}
                                </h2>
                                <button
                                    id="edit-name-btn"
                                    onClick={() => handleEditClick(user)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
                                    title="Edit name"
                                >
                                    <svg
                                        className="w-4 h-4"
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
                            </div>
                        )}

                        {/* Email Verification */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                            <p className="text-muted text-sm">{user?.email}</p>

                            {!user.isEmailValid ? (
                                <NavLink
                                    to="/verify-email"
                                    state={{ userEmail: user?.email }}
                                    id="verify-email-btn"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
               bg-amber-500/15 border border-amber-500/30 text-amber-400 
               text-xs font-semibold hover:bg-amber-500/25 
               hover:border-amber-500/50 transition-all 
               cursor-pointer active:scale-95"
                                >
                                    <MdOutlineEmail className="w-4 h-4" />
                                    Verify Email
                                </NavLink>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
                   bg-green-500/15 border border-green-500/30 text-green-400 
                   text-xs font-semibold">
                                    <MdVerified className="w-4 h-4" />
                                    Verified
                                </span>
                            )}
                        </div>

                        {/* User Registration Date */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
                                <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Member since {memberSince}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Logout button */}
                    <button
                        id="profile-logout-btn"
                        onClick={handleLogout}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-sm font-semibold cursor-pointer"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        Logout
                    </button>
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                    <StatCard
                        label="Total Links"
                        value={urls.length}
                        color="bg-primary/20 text-primary"
                        icon={
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Total Clicks"
                        value={totalClicks}
                        color="bg-secondary/20 text-secondary"
                        icon={
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Top Link Clicks"
                        value={topLink?.clicks ?? 0}
                        color="bg-accent/20 text-accent"
                        icon={
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Avg Clicks / Link"
                        value={urls.length ? Math.round(totalClicks / urls.length) : 0}
                        color="bg-green-500/20 text-green-400"
                        icon={
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        }
                    />
                </div>

                {/* ── Recent links table ── */}
                <div className="glass-card rounded-3xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white">Your Links</h3>
                        <button
                            id="profile-create-link-btn"
                            onClick={() => navigate("/urlshortner")}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 cursor-pointer active:scale-95"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            New Link
                        </button>
                    </div>

                    {urls.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-muted"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    />
                                </svg>
                            </div>
                            <p className="text-muted font-medium">No links yet</p>
                            <p className="text-muted/60 text-sm mt-1">
                                Create your first short link to get started
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {/* Table header – hidden on mobile */}
                            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 text-[11px] uppercase tracking-wider text-muted font-bold">
                                <span>Link</span>
                                <span className="text-center">Clicks</span>
                                <span className="text-right">Created</span>
                            </div>

                            {urls.slice(0, 10).map((url, i) => (
                                <div
                                    key={url.id}
                                    className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group animate-in fade-in slide-in-from-left-4 duration-500"
                                    style={{
                                        animationDelay: `${i * 60}ms`,
                                        animationFillMode: "both",
                                    }}
                                >
                                    {/* link details */}
                                    <div className="min-w-0">
                                        <a
                                            href={`${API_URL.replace(/\/+$/, "")}/${url.shortUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary font-semibold text-sm hover:underline"
                                        >
                                            url.short/{url.shortUrl}
                                        </a>
                                        <p className="text-muted text-xs mt-0.5 truncate max-w-xs sm:max-w-sm">
                                            {url.originalUrl}
                                        </p>
                                    </div>

                                    {/* clicks */}
                                    <div className="flex items-center sm:justify-center gap-1.5">
                                        <span className="text-[10px] uppercase text-muted sm:hidden">
                                            Clicks:
                                        </span>
                                        <span className="text-white font-bold">{url.clicks}</span>
                                    </div>

                                    {/* date */}
                                    <div className="flex items-center sm:justify-end gap-1.5">
                                        <span className="text-[10px] uppercase text-muted sm:hidden">
                                            Created:
                                        </span>
                                        <span className="text-muted text-xs">
                                            {new Date(url.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {urls.length > 10 && (
                                <div className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => navigate("/urlshortner")}
                                        className="text-primary text-sm font-semibold hover:underline cursor-pointer"
                                    >
                                        View all {urls.length} links →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Account info card ── */}
                <div className="glass-card p-6 rounded-3xl border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400 fill-mode-both">
                    <h3 className="text-lg font-bold text-white mb-5">Account Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { label: "Full Name", value: user?.name },
                            { label: "Email Address", value: user?.email },
                            { label: "Member Since", value: memberSince },
                            { label: "Account Status", value: "Active" },
                        ].map(({ label, value }) => (
                            <div
                                key={label}
                                className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4"
                            >
                                <p className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">
                                    {label}
                                </p>
                                <p className="text-white font-semibold text-sm">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Profile;
