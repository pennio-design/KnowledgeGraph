import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Roadmap } from '../types';
import { Download, X, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface CertificateViewProps {
  roadmap: Roadmap;
  onClose: () => void;
}

const CertificateView: React.FC<CertificateViewProps> = ({ roadmap, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userName, setUserName] = useState('');
  const [showInput, setShowInput] = useState(true);

  // Generate a mock "Blockchain" Verification ID
  const verificationId = `KG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);

    try {
      // 1. Capture the DOM element as a high-res canvas
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // 2. Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2] // Match canvas aspect ratio
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`KnowledgeGraph-Certificate-${roadmap.title.replace(/\s+/g, '-')}.pdf`);
      onClose();
    } catch (err) {
      console.error("Certificate failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (showInput) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Roadmap Completed!</h2>
          <p className="text-slate-500 mb-6">You've mastered 100% of <strong>{roadmap.title}</strong>. Enter your name to sign the certificate.</p>
          
          <input 
            type="text" 
            placeholder="Your Full Name" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-4 border border-slate-200 rounded-lg mb-4 text-center font-bold text-lg focus:border-slate-900 outline-none"
            autoFocus
          />
          
          <button 
            onClick={() => userName.length > 2 && setShowInput(false)}
            disabled={userName.length < 3}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            Preview Certificate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto py-10 px-4 flex flex-col items-center">
      
      {/* HUD Controls */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 text-white">
        <div>
          <h2 className="font-bold text-lg">Certificate Preview</h2>
          <p className="text-slate-400 text-sm">Verify details before exporting.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>

      {/* The Actual Certificate (Printable Area) */}
      <div 
        ref={certificateRef}
        className="bg-white text-slate-900 w-[1000px] h-[700px] relative shadow-2xl flex-shrink-0"
        style={{ fontFamily: 'serif' }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border-4 border-slate-900 flex flex-col items-center justify-between py-16 px-20">
          
          {/* Header */}
          <div className="text-center space-y-4">
             <div className="flex items-center justify-center gap-2 mb-4">
                <div className="bg-slate-900 text-white p-1 rounded">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-sans font-bold text-sm tracking-[0.2em] text-slate-900 uppercase">KnowledgeGraph Certified</span>
             </div>
             <h1 className="text-6xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'sans-serif' }}>
               CERTIFICATE
             </h1>
             <p className="text-xl text-slate-500 font-sans tracking-widest uppercase">Of Mastery</p>
          </div>

          {/* Body */}
          <div className="text-center w-full space-y-8">
            <p className="text-lg italic text-slate-500">This credential certifies that</p>
            <div className="text-5xl font-bold text-slate-900 border-b-2 border-slate-900/10 pb-4 px-12 inline-block min-w-[400px]">
              {userName}
            </div>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Has successfully completed the comprehensive curriculum for <br/>
              <strong className="text-slate-900 text-2xl block mt-2">{roadmap.title}</strong>
              demonstrating proficiency in {roadmap.nodes.length} core competencies.
            </p>
          </div>

          {/* Footer / Signatures */}
          <div className="w-full flex justify-between items-end mt-12 pt-8 border-t border-slate-100">
             <div className="text-center">
               <div className="font-sans font-bold text-slate-900 text-lg">{dateStr}</div>
               <div className="text-xs text-slate-400 font-sans uppercase tracking-wider mt-1">Date Issued</div>
             </div>

             {/* Gold Seal Effect */}
             <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                   <div className="w-20 h-20 border-2 border-amber-100/50 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-white drop-shadow-md" />
                   </div>
                </div>
             </div>

             <div className="text-center">
               <div className="font-sans font-bold text-slate-900 text-lg">{verificationId}</div>
               <div className="text-xs text-slate-400 font-sans uppercase tracking-wider mt-1">Verification ID</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
