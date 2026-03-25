
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ name: "", password: "", age: "", grade: "", verificationCode: "" });
  const [loginForm, setLoginForm] = useState({ name: "", password: "" });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleAgeChange = (e) => {
    const age = parseInt(e.target.value);
    setFormData({ ...formData, age });
    let suggestedGrade = age <= 6 ? "Kinder 1" : `Grade ${Math.min(6, age - 6)} - Section 1`;
    setFormData((prev) => ({ ...prev, age, grade: suggestedGrade }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(formData) });
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
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-pink-50 to-blue-50 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-pink-100 rounded-full blur-[100px] opacity-50"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-50"></div>

      {/* Back Button */}
      <button 
        className="absolute top-6 left-6 px-4 py-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors z-20"
        onClick={() => router.push("/")}
      >
        ← Explore Academy
      </button>

      {/* Main Container */}
      <div className="premium-card cat-ears max-w-lg w-full z-10 animate-fade-in transition-all">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
             {mode === "login" ? "Welcome back! 😸" : "A New Friend! 🐾"}
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
             {mode === "login" ? "Your journey continues here." : "Step into the ultimate learning room."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-400 p-4 rounded-2xl mb-8 text-sm font-bold text-center border border-red-100 animate-pulse">
             ⚠️ {error}
          </div>
        )}

        {mode === "login" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Username</label>
              <input 
                 type="text" 
                 placeholder="Ex. Whiskers" 
                 className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 focus:border-primary-light focus:bg-white rounded-3xl outline-none transition-all font-medium"
                 value={loginForm.name} 
                 onChange={(e) => { setLoginForm({ ...loginForm, name: e.target.value }); setError(""); }}
              />
            </div>
            
            <div className="flex flex-col gap-2">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Access Phrase</label>
               <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 focus:border-primary-light focus:bg-white rounded-3xl outline-none transition-all font-medium"
                  value={loginForm.password} 
                  onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setError(""); }}
               />
            </div>
            
            <button className="btn-primary mt-4" onClick={handleLogin}>
               Enter the School 🚀
            </button>
            
            <p className="text-center text-sm font-medium text-slate-400 mt-4">
              Not part of the Academy yet? <span className="text-primary cursor-pointer font-bold hover:underline" onClick={() => setMode("register")}>Apply Now</span>
            </p>
          </div>
        ) : (
          <div>
             {step === 1 ? (
                <div className="flex flex-col gap-6">
                   <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                         <input type="text" placeholder="Pick a cool name" className="w-full px-6 py-3 bg-slate-50 border-2 border-slate-50 focus:border-primary-light rounded-3xl outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
                         <input type="password" placeholder="Create a password" className="w-full px-6 py-3 bg-slate-50 border-2 border-slate-50 focus:border-primary-light rounded-3xl outline-none" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Your Age</label>
                         <input type="number" placeholder="Enter age" className="w-full px-6 py-3 bg-slate-50 border-2 border-slate-50 focus:border-primary-light rounded-3xl outline-none" value={formData.age} onChange={handleAgeChange} />
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Invite Token 🛡️</label>
                         <input type="text" placeholder="Provided by your parent/teacher" className="w-full px-6 py-3 bg-slate-50 border-2 border-slate-50 focus:border-primary-light rounded-3xl outline-none" value={formData.verificationCode} onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })} />
                      </div>
                   </div>
                   <button className="btn-primary" disabled={!formData.name || !formData.age || !formData.verificationCode} onClick={() => setStep(2)}>Next Step 🐾</button>
                   <p className="text-center text-xs font-bold text-slate-300 mt-2">
                      Have an account? <span className="text-primary cursor-pointer hover:underline" onClick={() => setMode("login")}>Login</span>
                   </p>
                </div>
             ) : (
                <div className="flex flex-col gap-6">
                   <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center shadow-inner">
                      <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Academy Suggestion 🎓</p>
                      <p className="text-slate-600 font-bold text-lg">You belong in: {formData.grade}</p>
                   </div>
                   
                   <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Change Placement</label>
                      <select 
                         className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-3xl appearance-none font-bold text-slate-700 focus:border-primary outline-none cursor-pointer" 
                         value={formData.grade} 
                         onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      >
                         {["Kinder 1", "Kinder 2"].map(g => <option key={g} value={g}>{g}</option>)}
                         {[1, 2, 3, 4, 5, 6].map(gradeNum => (
                            <optgroup key={gradeNum} label={`Grade ${gradeNum}`}>
                               <option value={`Grade ${gradeNum}`}>Standard Room</option>
                               <option value={`Grade ${gradeNum} - Section 1`}>Section 1</option>
                               <option value={`Grade ${gradeNum} - Section 2`}>Section 2</option>
                               <option value={`Grade ${gradeNum} - Section 3`}>Section 3</option>
                            </optgroup>
                         ))}
                      </select>
                   </div>

                   <div className="flex gap-4">
                      <button className="flex-1 bg-slate-100 py-4 rounded-3xl font-bold text-slate-400 hover:bg-slate-200" onClick={() => setStep(1)}>Go Back</button>
                      <button className="flex-[2] btn-primary" onClick={handleRegister}>Finalize 🎯</button>
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

    </div>
  );
}
