import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generateTutorLesson, MissingApiKeyError } from '../services/geminiService';
import { TutorLesson } from '../types';
import { X, BookOpen, Terminal, Lightbulb, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TutorModalProps {
  nodeTitle: string;
  onClose: () => void;
  onMissingKey: () => void;
}

const TutorModal: React.FC<TutorModalProps> = ({ nodeTitle, onClose, onMissingKey }) => {
  const [lesson, setLesson] = useState<TutorLesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);
  // Parents pass fresh inline callbacks every render; keep them out of the fetch effect's deps.
  const callbacks = useRef({ onClose, onMissingKey });
  callbacks.current = { onClose, onMissingKey };

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setPicked(null);
    generateTutorLesson(nodeTitle)
      .then(l => { if (active) setLesson(l); })
      .catch(e => {
        if (!active) return;
        if (e instanceof MissingApiKeyError) { callbacks.current.onClose(); callbacks.current.onMissingKey(); return; }
        setError(e instanceof Error ? e.message : 'Could not load the lesson.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [nodeTitle]);

  useEffect(() => load(), [load]);

  const shell = (children: React.ReactNode) => (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Tutor: ${nodeTitle}`}>
      {children}
    </div>
  );

  if (loading) {
    return shell(
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Writing your lesson</h3>
        <p className="text-slate-500 text-sm">This takes a few seconds.</p>
      </div>,
    );
  }

  if (error || !lesson) {
    return shell(
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <p className="text-sm text-slate-700">{error ?? 'Could not load the lesson.'}</p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Close</button>
          <button onClick={load} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">Retry</button>
        </div>
      </div>,
    );
  }

  const quiz = lesson.quiz[0];
  const answered = picked !== null;
  const correct = picked === quiz.answer;

  return shell(
    <div className="bg-slate-50 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{nodeTitle}</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI-generated lesson · verify against the linked sources</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto p-6 space-y-6">
        <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-blue-700"><BookOpen className="w-4 h-4" /><h3 className="text-xs font-bold uppercase tracking-wider">Definition</h3></div>
          <p className="text-slate-700 leading-relaxed">{lesson.academic.content}</p>
        </section>

        <section className="bg-slate-900 text-slate-200 p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3 text-emerald-400"><Terminal className="w-4 h-4" /><h3 className="text-xs font-bold uppercase tracking-wider">In production</h3></div>
          <p className="leading-relaxed">{lesson.practical.content}</p>
        </section>

        <section className="bg-amber-50 p-5 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-3 text-amber-700"><Lightbulb className="w-4 h-4" /><h3 className="text-xs font-bold uppercase tracking-wider">Mental model</h3></div>
          <p className="text-slate-800 italic leading-relaxed">"{lesson.analogy.content}"</p>
        </section>

        <section className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Quick check</h3>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-900 mb-4">{quiz.question}</p>
            <div className="space-y-2">
              {quiz.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setPicked(i)}
                  disabled={answered}
                  className={`w-full text-left p-3 rounded-lg text-sm font-medium border transition-colors ${
                    !answered ? 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                      : i === quiz.answer ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : i === picked ? 'bg-red-50 border-red-200 text-red-800'
                      : 'border-transparent opacity-50'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {opt}
                    {answered && i === quiz.answer && <CheckCircle className="w-4 h-4" />}
                  </span>
                </button>
              ))}
            </div>
            {answered && (
              <div className={`mt-4 p-3 rounded-lg text-xs font-medium ${correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`} role="status">
                {correct ? 'Correct. ' : 'Not quite. '}{quiz.explanation}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>,
  );
};

export default TutorModal;
