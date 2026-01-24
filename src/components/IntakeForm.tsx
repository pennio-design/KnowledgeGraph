import React, { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface IntakeFormProps {
  onSubmit: (goal: string, background: string, constraints: string) => void;
  isLoading: boolean;
}

const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: '',
    background: '',
    constraints: ''
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(formData.goal, formData.background, formData.constraints);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const isCurrentStepValid = () => {
    if (step === 1) return formData.goal.length > 3;
    if (step === 2) return formData.background.length > 3;
    return true; // Step 3 is optional/constraints
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Progress Indicator - Functional, not decorative */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= step ? 'bg-slate-900' : 'bg-slate-200'
            }`} 
          />
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="min-h-[200px]">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-bold text-slate-900">
                What is your primary learning objective?
              </label>
              <textarea
                autoFocus
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
                onKeyDown={handleKeyDown}
                className="w-full p-4 text-lg bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-0 outline-none transition-colors resize-none h-32 placeholder:text-slate-400"
                placeholder="e.g. Become a Senior React Developer or Master System Design..."
              />
              <p className="text-xs text-slate-500">Be specific. The more details, the better the roadmap.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-bold text-slate-900">
                What is your current experience level?
              </label>
              <textarea
                autoFocus
                value={formData.background}
                onChange={(e) => setFormData({...formData, background: e.target.value})}
                onKeyDown={handleKeyDown}
                className="w-full p-4 text-lg bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-0 outline-none transition-colors resize-none h-32 placeholder:text-slate-400"
                placeholder="e.g. I know basic JS and HTML, but struggle with hooks..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-bold text-slate-900">
                Any constraints or preferences?
              </label>
              <textarea
                autoFocus
                value={formData.constraints}
                onChange={(e) => setFormData({...formData, constraints: e.target.value})}
                onKeyDown={handleKeyDown}
                className="w-full p-4 text-lg bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-0 outline-none transition-colors resize-none h-32 placeholder:text-slate-400"
                placeholder="e.g. Free resources only, 10 hours/week, prefer videos..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || isLoading}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 px-4 py-2"
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isCurrentStepValid() || isLoading}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing</>
            ) : (
              <>{step === 3 ? 'Generate Roadmap' : 'Next'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
