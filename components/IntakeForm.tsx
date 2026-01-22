
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Lightbulb, Clock, CheckCircle, BrainCircuit, Target } from 'lucide-react';

interface IntakeFormProps {
  onSubmit: (goal: string, background: string, constraints: string) => void;
  isLoading: boolean;
}

const LOADING_TIPS = [
  "Analyzing your learning goals...",
  "Searching for high-quality free resources...",
  "Breaking down complex topics into bite-sized nodes...",
  "Optimizing roadmap for your schedule...",
  "Did you know? Spaced repetition increases retention by up to 80%.",
  "Curating content from YouTube, MDN, and GitHub...",
  "Almost there! Architecting your visual graph..."
];

const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [background, setBackground] = useState('');
  const [constraints, setConstraints] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(goal, background, constraints);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isCurrentStepValid = () => {
    if (step === 1) return goal.trim().length >= 10;
    if (step === 2) return background.trim().length >= 10;
    if (step === 3) return constraints.trim().length >= 10;
    return false;
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
            <BrainCircuit className="w-16 h-16 text-blue-600" />
          </div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Architecting Your Roadmap</h2>
        <div className="flex items-center gap-2 text-blue-600 font-bold mb-8 bg-blue-50 px-6 py-3 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{LOADING_TIPS[tipIndex]}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-lg">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PERSONALIZED</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SCHEDULE-FIT</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QUALITY-FILTERED</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black text-blue-600 tracking-widest uppercase">Question {step} / 3</span>
          <span className="text-xs font-bold text-slate-400">{Math.round((step / 3) * 100)}% Complete</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-700 ease-in-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">What do you want to learn?</h2>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Be specific about your goal. E.g., "I want to become a frontend developer and build modern web apps using React."</p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="E.g. I want to master data analysis with Python to solve business problems..."
              className="w-full h-44 p-6 rounded-3xl border-2 border-slate-100 focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all resize-none text-lg font-medium leading-relaxed"
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-6 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">What's your background?</h2>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Tell us about your related skills. This helps us tailor the difficulty and skip basics you already know.</p>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="E.g. I'm a graphic designer, familiar with HTML but never used JavaScript. I'm comfortable with logic..."
              className="w-full h-44 p-6 rounded-3xl border-2 border-slate-100 focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all resize-none text-lg font-medium leading-relaxed"
            />
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-6 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">Timeline & Style?</h2>
            </div>
            <p className="text-slate-500 mb-6 font-medium">How many hours per week? Do you prefer videos, interactive coding, or text-based deep dives?</p>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="E.g. 15 hours/week mostly on evenings. Prefer interactive platforms and video tutorials. Need to be ready in 4 months..."
              className="w-full h-44 p-6 rounded-3xl border-2 border-slate-100 focus:border-blue-500 focus:ring-8 focus:ring-blue-50 outline-none transition-all resize-none text-lg font-medium leading-relaxed"
            />
          </div>
        )}

        <div className="flex gap-4 pt-6">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
            >
              Back
            </button>
          )}
          <button
            disabled={!isCurrentStepValid() || isLoading}
            onClick={handleNext}
            className="flex-[2] py-4 px-6 rounded-2xl font-black text-white bg-slate-900 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
          >
            {step === 3 ? (
              <>
                Generate Roadmap
                <Sparkles className="w-5 h-5 text-amber-300" />
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
