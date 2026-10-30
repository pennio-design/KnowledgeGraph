import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface IntakeFormProps {
  onSubmit: (goal: string, background: string, constraints: string) => void;
  isLoading: boolean;
}

const STEPS = [
  {
    key: 'goal',
    label: 'What do you want to learn or achieve?',
    placeholder: 'e.g. Become a senior React developer, or master system design...',
    hint: 'Be specific. More detail gives a better roadmap.',
    required: true,
  },
  {
    key: 'background',
    label: 'What relevant skills or experience do you already have?',
    placeholder: 'e.g. I know basic JS and HTML, but struggle with hooks...',
    hint: '',
    required: true,
  },
  {
    key: 'constraints',
    label: 'How do you prefer to learn, and what is your timeline?',
    placeholder: 'e.g. Free resources only, 10 hours/week, prefer videos...',
    hint: 'Optional.',
    required: false,
  },
] as const;

type FormKey = typeof STEPS[number]['key'];

const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<FormKey, string>>({ goal: '', background: '', constraints: '' });

  const current = STEPS[step];
  const isValid = !current.required || formData[current.key].trim().length > 3;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (!isValid || isLoading) return;
    if (isLast) onSubmit(formData.goal.trim(), formData.background.trim(), formData.constraints.trim());
    else setStep(step + 1);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="flex gap-2 mb-8" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label="Question progress">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-slate-900' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="min-h-[200px] space-y-4">
          <label htmlFor={`intake-${current.key}`} className="block text-sm font-bold text-slate-900">
            {step + 1}/3 · {current.label}
          </label>
          <textarea
            key={current.key}
            id={`intake-${current.key}`}
            autoFocus
            maxLength={1000}
            value={formData[current.key]}
            onChange={e => setFormData({ ...formData, [current.key]: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNext();
              }
            }}
            className="w-full p-4 text-lg bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-0 outline-none transition-colors resize-none h-32 placeholder:text-slate-400"
            placeholder={current.placeholder}
          />
          {current.hint && <p className="text-xs text-slate-500">{current.hint}</p>}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || isLoading}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30 px-4 py-2"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isValid || isLoading}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Building roadmap (10-20s)</>
            ) : (
              <>{isLast ? 'Generate roadmap' : 'Next'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
