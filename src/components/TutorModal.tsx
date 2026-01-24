import React, { useState, useEffect } from 'react';
import { generateTutorLesson } from '../services/geminiService';
import { X, BookOpen, Terminal, Lightbulb, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TutorModalProps {
  nodeTitle: string;
  onClose: () => void;
}

const TutorModal: React.FC<TutorModalProps> = ({ nodeTitle, onClose }) => {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');

  useEffect(() => {
    let mounted = true;
    const fetchLesson = async () => {
      try {
        const data = await generateTutorLesson(nodeTitle);
        if (mounted) {
            setLesson(data);
            setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };
    fetchLesson();
    return () => { mounted = false; };
  }, [nodeTitle]);

  const handleQuizAnswer = (index: number) => {
    if (index === lesson.quiz[0].answer) {
      setQuizState('correct');
    } else {
      setQuizState('wrong');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Synthesizing Sources</h3>
          <p className="text-slate-500 text-sm">Consulting documentation, forums, and tech blogs...</p>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Deep Dive: {nodeTitle}</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Multi-Source Synthesis</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Academic */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">The Textbook Definition</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">{lesson.academic.content}</p>
          </div>

          {/* Section 2: Practical */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">In Production</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{lesson.practical.content}</p>
          </div>

          {/* Section 3: Analogy */}
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Lightbulb className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">The Mental Model</span>
            </div>
            <p className="text-slate-800 italic leading-relaxed">"{lesson.analogy.content}"</p>
          </div>

          {/* Quiz Section */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Quick Check</h3>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-900 mb-4">{lesson.quiz[0].question}</p>
              
              <div className="space-y-2">
                {lesson.quiz[0].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleQuizAnswer(i)}
                    disabled={quizState !== 'unanswered'}
                    className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all ${
                      quizState === 'unanswered' 
                        ? 'hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-600'
                        : i === lesson.quiz[0].answer
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : quizState === 'wrong' && 'opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {opt}
                      {quizState !== 'unanswered' && i === lesson.quiz[0].answer && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>

              {quizState === 'correct' && (
                 <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-emerald-700 text-xs font-medium animate-in fade-in">
                    Correct! {lesson.quiz[0].explanation}
                 </div>
              )}
              {quizState === 'wrong' && (
                 <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-700 text-xs font-medium animate-in fade-in flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Incorrect. Try to review the "Mental Model" section above.
                 </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorModal;
