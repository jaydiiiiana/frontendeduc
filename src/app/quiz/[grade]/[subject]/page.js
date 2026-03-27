"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";
import { calculateLevel } from "@/lib/xp";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const grade = params.grade ? decodeURIComponent(params.grade) : "";
  const subjectTitle = params.subject ? decodeURIComponent(params.subject) : "";

  useEffect(() => {
    const storedUser = localStorage.getItem("catUser");
    if (!storedUser) {
      router.push("/");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  if (!user) return <div className="flex-center" style={{ height: "100vh" }}>Loading...</div>;

  const staticGradeData = curriculum[grade] || [];
  const customData = JSON.parse(localStorage.getItem("customCurriculum") || "{}");
  const customGradeData = customData[grade] || [];
  const allGradeData = [...staticGradeData, ...customGradeData];

  const subjectData = allGradeData.find((s) => s.title === subjectTitle);
  const questions = subjectData?.subjects?.[0]?.questions || [];

  if (questions.length === 0) return (
    <div className="flex-center" style={{ height: "100vh", flexDirection: "column", gap: "2rem" }}>
      <h2>Oops! No questions found for {grade} / {subjectTitle} 😿</h2>
      <button className="btn-secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard 🐾</button>
    </div>
  );

  const handleAnswer = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentQuestionIndex].a) {
      setScore(score + 10);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      // Update User EXP
      const totalExp = user.exp + score;
      const updatedUser = { ...user, exp: totalExp, level: calculateLevel(totalExp) };
      localStorage.setItem("catUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  if (isFinished) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-slate-50">
        <div className="premium-card max-w-md w-full text-center animate-scale-in">
          <span className="text-8xl mb-6 block">🏆</span>
          <h1 className="text-4xl font-black text-slate-800 mb-2">Quizzed Out! 🐾</h1>
          <p className="text-slate-500 font-medium mb-8">Great work! You scored <span className="text-primary font-black">{score}</span> points!</p>
          <div className="bg-primary-light/50 p-6 rounded-3xl mb-8 border border-primary/10">
             <p className="text-slate-600 font-bold mb-1">New Level: <span className="text-primary font-black text-xl">{user.level}</span></p>
             <p className="text-slate-600 font-bold">Total EXP: <span className="text-primary font-black text-xl">{user.exp}</span></p>
          </div>
          <button className="btn-primary w-full" onClick={() => router.push("/dashboard")}>Return to Dashboard 🐾</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-6 py-12 md:py-24">
      <div className="premium-card max-w-3xl mx-auto relative !p-8 md:!p-16">
        <div className="flex justify-between items-center mb-10">
           <h2 className="text-2xl md:text-3xl font-black text-slate-800">{subjectTitle} Quiz 🐾</h2>
           <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Scholar Assessment</span>
        </div>
        
        {/* Progress Tracker */}
        <div className="w-full bg-slate-100 h-3 rounded-full mb-12 relative overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-accent-blue rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-right italic">Question {currentQuestionIndex + 1} of {questions.length}</p>

        <div className="mb-12">
          <h3 className="text-2xl md:text-4xl font-black text-slate-800 mb-10 leading-snug">{currentQ.q}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentQ.options.map((opt, i) => {
              const isCorrect = isAnswered && opt === currentQ.a;
              const isSelected = selectedOption === opt;
              const isWrong = isAnswered && isSelected && opt !== currentQ.a;
              
              return (
                <button 
                  key={i} 
                  disabled={isAnswered}
                  onClick={() => handleAnswer(opt)}
                  className={`
                    p-6 rounded-3xl text-lg md:text-xl font-bold transition-all duration-300 border-4 border-transparent text-center
                    ${!isAnswered ? 'bg-white shadow-premium hover:shadow-xl hover:border-primary/10 hover:-translate-y-1' : ''}
                    ${isCorrect ? 'bg-success-light !border-green-500/50 text-slate-800' : ''}
                    ${isWrong ? 'bg-error-light !border-error-dark/30 text-slate-800' : ''}
                    ${isAnswered && !isCorrect && !isWrong ? 'bg-slate-50 opacity-40 grayscale' : ''}
                  `}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <div className="mt-12 flex justify-center animate-fade-in">
            <button className="btn-primary !py-5 !px-16 w-full md:w-auto min-w-[300px] shadow-xl shadow-primary/20" onClick={handleNext}>
              {currentQuestionIndex < questions.length - 1 ? "Next Question 🐾" : "Finish Quiz 🐾"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
