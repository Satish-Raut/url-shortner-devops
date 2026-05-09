import { useState } from "react";
import { MdOutlineEmail, MdLockOutline, MdRefresh } from "react-icons/md";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import HomeAnimatedBackground from "../Components/HomeAnimatedBackground";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const EmailVerify = () => {
  const [activeTab, setActiveTab] = useState(null); // null | "code"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = location.state?.userEmail;

  /* ── OTP input handler ── */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  /* ── Resend cooldown -> With this backend print a link in console.── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const mailData = await axios.post(`${API_URL}/verify-email`, {}, { withCredentials: true })

      console.log("Response from Backend:", mailData);
      toast.success(mailData.data.message || "Verification email resent!");

      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to resend email");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpFilled) return;
    const token = otp.join("");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await axios.post(`${API_URL}/verify-email-token`, { token, email: userEmail });
      toast.success(res.data.message || "Email verified successfully!");
      navigate("/profile");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    }
  };

  const otpFilled = otp.every((d) => d !== "");

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 min-h-screen text-white relative flex items-center justify-center">
      <HomeAnimatedBackground />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          {/* Icon orb */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150 animate-pulse-slow" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/30">
              <MdOutlineEmail className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Verify your{" "}
            <span className="text-gradient">Email</span>
          </h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            We sent a verification link to your inbox.<br />
            Choose how you'd like to proceed.
          </p>
        </div>

        {/* ── Glass card ── */}
        <div className="glass-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">

          {/* Email badge */}
          <div className="px-6 pt-6 pb-5 border-b border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <MdOutlineEmail className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted font-bold mb-0.5">
                  Verification sent to
                </p>
                <p className="text-white text-sm font-semibold truncate">
                  {userEmail}
                </p>
              </div>
              <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Pending
              </span>
            </div>
          </div>

          {/* ── CTA Buttons ── */}
          <div className="px-6 py-6 space-y-3">
            {/* Resend verification link */}
            <button
              id="resend-verification-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`group w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer active:scale-[0.98]
                ${resendCooldown > 0
                  ? "bg-white/5 border border-white/10 text-muted cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]"
                }`}
            >
              <MdRefresh
                className={`w-5 h-5 transition-transform duration-500 ${resendCooldown > 0 ? "" : "group-hover:rotate-180"}`}
              />
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : "Resend Verification Link"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[11px] text-muted font-semibold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {/* Verify with code */}
            <button
              id="verify-with-code-btn"
              onClick={() => setActiveTab(activeTab === "code" ? null : "code")}
              className={`group w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer active:scale-[0.98]
                ${activeTab === "code"
                  ? "bg-white/10 border border-white/15 text-white"
                  : "bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02]"
                }`}
            >
              <MdLockOutline className="w-5 h-5 text-secondary" />
              Verify with Code
              <svg
                className={`w-4 h-4 ml-auto text-muted transition-transform duration-300 ${activeTab === "code" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* ── OTP Panel (collapsible) ── */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${activeTab === "code" ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="px-6 pb-6 border-t border-white/[0.06] pt-5">
              <p className="text-center text-sm text-muted mb-5 leading-relaxed">
                Enter the 6-digit code from your email
              </p>

              {/* OTP boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl border bg-white/[0.05] text-white outline-none transition-all duration-200
                      ${digit
                        ? "border-primary ring-2 ring-primary/20 bg-primary/10"
                        : "border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                      }`}
                  />
                ))}
              </div>

              {/* Submit OTP */}
              <button
                id="submit-otp-btn"
                onClick={handleVerifyOtp}
                disabled={!otpFilled}
                className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer active:scale-[0.98]
                  ${otpFilled
                    ? "bg-gradient-to-r from-secondary to-accent text-white shadow-lg shadow-secondary/25 hover:shadow-secondary/40 hover:scale-[1.02]"
                    : "bg-white/5 border border-white/10 text-muted cursor-not-allowed"
                  }`}
              >
                <HiOutlineShieldCheck className="w-5 h-5" />
                Verify Email
              </button>
            </div>
          </div>

          {/* ── Footer hint ── */}
          <div className="px-6 py-4 border-t border-white/[0.05] bg-white/[0.01]">
            <p className="text-center text-xs text-muted leading-relaxed">
              Didn't receive anything?{" "}
              <span className="text-white/60">Check your spam folder</span> or resend the link above.
            </p>
          </div>

        </div>

        {/* ── Info chips below card ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {[
            { icon: "🔒", text: "Secured with TLS" },
            { icon: "⏱️", text: "Link expires in 24h" },
            { icon: "📨", text: "Check spam if missing" },
          ].map(({ icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-muted text-xs font-medium"
            >
              <span>{icon}</span>
              {text}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
};

export default EmailVerify;