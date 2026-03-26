
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [mode, setMode] = useState("login");
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "Student", school: "", nickname: "", grade: "", verificationCode: "" });
    const [loginForm, setLoginForm] = useState({ name: "", password: "" });
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [showWelcome, setShowWelcome] = useState(false);
    const [welcomeUserData, setWelcomeUserData] = useState(null);
    const [availableGrades, setAvailableGrades] = useState([]);
    useEffect(() => {
        const stored = localStorage.getItem("catUser");
        if (stored) {
            const user = JSON.parse(stored);
            if (user.role === 'Creator') router.push("/creator");
            else if (user.role === 'Headmaster' || user.role === 'Teacher') router.push("/admin");
            else router.push("/dashboard");
        }
    }, [router]);



    const fetchCustomGrades = async (code) => {
        try {
            const res = await fetch(`/api/public/grades?code=${code}`);
            if (res.ok) {
                const data = await res.json();
                const grades = Array.isArray(data) ? data : [];
                setAvailableGrades(grades);
                
                // Auto-select first available option
                if (grades.length > 0) {
                    const firstGrade = grades[0];
                    if (firstGrade.school_sections && firstGrade.school_sections.length > 0) {
                        setFormData(prev => ({ ...prev, grade: `${firstGrade.name} - ${firstGrade.school_sections[0].name}` }));
                    } else {
                        setFormData(prev => ({ ...prev, grade: firstGrade.name }));
                    }
                }
            }
        } catch (e) { console.error("Error fetching custom grades:", e); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Frontend validation for email domain
        if (!formData.email.endsWith("@educ.ph")) {
            setError("Wait! 🛑 Registration requires an official @educ.ph email.");
            return;
        }

        // Password complexity check
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasLower = /[a-z]/.test(formData.password);
        if (formData.password.length < 8 || !hasUpper || !hasLower) {
            setError("Wait! 🛑 Password must be at least 8 characters and include BOTH uppercase and lowercase letters.");
            return;
        }

        try {
            const response = await fetch("/api/auth/register", { 
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData) 
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem("catUser", JSON.stringify(data.user));
                const role = data.user.role;
                if (role === 'Headmaster') {
                    setWelcomeUserData(data.user);
                    setShowWelcome(true);
                } else if (role === 'Creator') {
                    router.push("/creator");
                } else if (role === 'Teacher') {
                    router.push("/admin");
                } else {
                    router.push("/dashboard");
                }
            } else { setError(data.error); }
        } catch (e) { setError("Connect error! 😿 Check if server is running."); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify(loginForm) });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem("catUser", JSON.stringify(data.user));
                const role = data.user.role;
                if (role === 'Creator') router.push("/creator");
                else if (role === 'Headmaster' || role === 'Teacher') router.push("/admin");
                else router.push("/dashboard");
            } else { setError(data.error); }
        } catch (e) { setError("Connect error! 😿 Check if server is running."); }
    };

    return (
        <div className="min-h-screen bg-[#fcfaff] text-slate-800 relative overflow-x-hidden font-sans selection:bg-primary/20 flex flex-col">

            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-light/60 mix-blend-multiply filter blur-[80px] blob-shape opacity-70"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 mix-blend-multiply filter blur-[100px] blob-shape animation-delay-2000 opacity-60"></div>
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-accent/20 mix-blend-multiply filter blur-[60px] blob-shape animation-delay-4000 opacity-50"></div>
            </div>

            {/* Floating Elements (Stars/Paws) */}
            <div className="absolute top-20 left-1/4 text-primary/30 text-4xl animate-float-slow select-none pointer-events-none">✨</div>
            <div className="absolute bottom-32 left-1/3 text-accent/30 text-5xl animate-float-slower select-none pointer-events-none">🐾</div>
            <div className="absolute top-1/3 right-1/4 text-secondary/30 text-3xl animate-float select-none pointer-events-none">🌟</div>

            {/* Back Button */}
            <button
                className="absolute top-8 left-8 flex items-center gap-2 px-5 py-2.5 bg-white/50 hover:bg-white backdrop-blur-md rounded-full text-sm font-bold text-slate-500 hover:text-primary transition-all shadow-sm hover:shadow-md z-20 group"
                onClick={() => router.push("/")}
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Explore Academy
            </button>

            {/* Main Container */}
            <div className="flex-1 flex items-center justify-center p-4 w-full z-10 relative mt-16">
                <div className="premium-card cat-ears max-w-[480px] w-full animate-fade-in relative flex flex-col justify-center min-h-[500px]">

                <div className="mb-8 text-center relative z-10">
                    <div className="inline-block p-4 bg-primary-light rounded-full mb-4 shadow-inner border border-white">
                        <span className="text-4xl">{mode === "login" ? "😸" : "🐾"}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
                        {mode === "login" ? "Welcome back!" : "Join the Academy!"}
                    </h1>
                    <p className="text-slate-500 mt-3 font-medium text-sm md:text-base px-4">
                        {mode === "login" ? "Ready to continue your adventure?" : "Step into the ultimate learning room."}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-8 text-sm font-bold text-center border border-red-200 shadow-sm animate-pulse-soft flex items-center justify-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="relative z-10 w-full">
                    {mode === "login" ? (
                        <div className="flex flex-col gap-6 w-full">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                                    <span className="text-primary">●</span> Username
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex. Whiskers"
                                    className="input-field"
                                    value={loginForm.name}
                                    onChange={(e) => { setLoginForm({ ...loginForm, name: e.target.value }); setError(""); }}
                                />
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                                    <span className="text-accent">●</span> Access Phrase
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="input-field"
                                    value={loginForm.password}
                                    onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setError(""); }}
                                />
                            </div>

                            <button className="btn-primary mt-6 w-full flex items-center justify-center gap-2" onClick={handleLogin}>
                                Enter Academy <span className="text-xl leading-none">🚀</span>
                            </button>

                            <div className="relative flex items-center justify-center mt-6">
                                <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                                <span className="relative bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">or join us</span>
                            </div>

                            <p className="text-center text-sm font-medium text-slate-500 mt-2">
                                Not part of the Academy yet? <span className="text-primary cursor-pointer font-bold hover:text-primary-dark transition-colors" onClick={() => { setMode("register"); setError(""); }}>Apply Now</span>
                            </p>
                        </div>
                    ) : ( // TargetLintErrorIds: [react-jsx-nesting]
                        <div className="w-full">
                            {step === 1 ? (
                                <div className="flex flex-col gap-5 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                                            <input type="text" placeholder="Pick a cool name" className="input-field py-3.5" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Nickname</label>
                                            <input type="text" placeholder="Cool alias" className="input-field py-3.5" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Working/Studying At</label>
                                            <input type="text" placeholder="School name" className="input-field py-3.5" value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">School Email (@educ.ph)</label>
                                            <input type="email" placeholder="you@educ.ph" className="input-field py-3.5" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                                        </div>
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Password</label>
                                            <input type="password" placeholder="Create a password" className="input-field py-3.5" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-1">Invite Code <span className="text-red-500 font-black ml-1 text-[8px] uppercase tracking-tighter">Required 🛡️</span></label>
                                            <input type="text" placeholder="Provided code" className="input-field py-3.5" value={formData.verificationCode} onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })} />
                                        </div>
                                    </div>
                                    <button className="btn-primary mt-4 w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0" disabled={!formData.name || !formData.email || !formData.verificationCode || !formData.password || !formData.school} 
                                        onClick={async () => {
                                            await fetchCustomGrades(formData.verificationCode);
                                            setStep(2);
                                        }}>
                                        Next Step <span className="text-lg leading-none">✨</span>
                                    </button>

                                    <div className="relative flex items-center justify-center mt-4">
                                        <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                                        <span className="relative bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">already a member?</span>
                                    </div>

                                    <p className="text-center text-sm font-medium text-slate-500 mt-2">
                                        Have an account? <span className="text-primary cursor-pointer font-bold hover:text-primary-dark transition-colors" onClick={() => { setMode("login"); setError(""); }}>Log In Here</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6 w-full animate-fade-in">
                                    <div className="bg-primary-light/40 border border-primary/20 rounded-[2rem] p-6 text-center shadow-inner relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">🎓</div>
                                        <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2 relative z-10">Academy Suggestion</p>
                                        <p className="text-slate-800 font-extrabold text-xl relative z-10">You belong in:</p>
                                        <div className="inline-block bg-white px-6 py-2 rounded-full mt-3 font-bold text-primary shadow-sm border border-primary/10 relative z-10">
                                            {formData.grade || "Processing... 🐾"}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 text-left w-full mt-2">
                                        <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Select Your Room</label>
                                        <div className="relative">
                                            <select
                                                className="input-field appearance-none cursor-pointer pr-12 font-bold"
                                                value={formData.grade}
                                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            >
                                                {availableGrades.length > 0 ? (
                                                    availableGrades.map(g => (
                                                        <optgroup key={g.id} label={g.name} className="font-bold text-slate-800">
                                                            {g.school_sections?.map(s => (
                                                                <option key={s.id} value={`${g.name} - ${s.name}`} className="font-medium">
                                                                    {s.name}
                                                                </option>
                                                            ))}
                                                            {(!g.school_sections || g.school_sections.length === 0) && (
                                                                <option value={g.name} className="font-medium">Standard Room</option>
                                                            )}
                                                        </optgroup>
                                                    ))
                                                ) : (
                                                    <>
                                                        {["Kinder 1", "Kinder 2"].map(g => <option key={g} value={g}>{g}</option>)}
                                                        {[1, 2, 3, 4, 5, 6].map(gradeNum => (
                                                            <optgroup key={gradeNum} label={`Grade ${gradeNum}`} className="font-bold text-slate-800">
                                                                <option value={`Grade ${gradeNum}`} className="font-medium">Standard Room</option>
                                                                <option value={`Grade ${gradeNum} - Section 1`} className="font-medium">Section 1</option>
                                                                <option value={`Grade ${gradeNum} - Section 2`} className="font-medium">Section 2</option>
                                                                <option value={`Grade ${gradeNum} - Section 3`} className="font-medium">Section 3</option>
                                                            </optgroup>
                                                        ))}
                                                    </>
                                                )}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                                                ▼
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button className="flex-1 btn-secondary !px-4" onClick={() => setStep(1)}>Go Back</button>
                                        <button className="flex-[2] btn-primary flex items-center justify-center gap-2" onClick={handleRegister}>
                                            Finalize <span className="text-lg leading-none">🎯</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* Simple Help Footer */}
            <footer className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 mt-20 opacity-60 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2026 Cat Academy Project</p>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <a href="mailto:risingtechinnovations@gmail.com" className="hover:text-primary transition-colors">Support: risingtechinnovations@gmail.com</a>
                    <span className="cursor-pointer hover:text-slate-800">Privacy</span>
                    <span className="cursor-pointer hover:text-slate-800">Terms</span>
                </div>
            </footer>

            {/* Headmaster Welcome Modal */}
            {showWelcome && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40 animate-fade-in">
                    <div className="premium-card cat-ears max-w-md w-full p-10 text-center animate-scale-up border-primary/30 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary"></div>
                        <div className="text-7xl mb-6">🎓</div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
                            Welcome, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Headmaster {welcomeUserData?.nickname || welcomeUserData?.name}!</span>
                        </h2>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                            Congratulations! You are now the Headmaster of your primary room. Lead your team and inspire your students! 🌸
                        </p>
                        <button 
                            className="btn-primary w-full !py-4 shadow-xl shadow-primary/20"
                            onClick={() => router.push("/admin")}
                        >
                            Start Leading Now 🚀
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
