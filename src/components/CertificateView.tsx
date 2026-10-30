import React, { useRef, useState } from 'react';
import { Certificate, Roadmap } from '../types';
import { Download, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';

interface CertificateViewProps {
  roadmap: Roadmap;
  onIssue: (certificate: Certificate) => void;
  onClose: () => void;
}

/** Deterministic ID derived from the record, so re-opening or re-printing shows the same value. */
async function makeCertificateId(roadmapId: string, name: string, issuedAt: number): Promise<string> {
  const data = new TextEncoder().encode(`${roadmapId}|${name}|${issuedAt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `KG-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`.toUpperCase();
}

const CertificateView: React.FC<CertificateViewProps> = ({ roadmap, onIssue, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const certificate = roadmap.certificate;

  const issue = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return;
    const issuedAt = Date.now();
    onIssue({ id: await makeCertificateId(roadmap.id, trimmed, issuedAt), name: trimmed, issuedAt });
  };

  const handleDownload = async () => {
    if (!certificateRef.current || !certificate) return;
    setIsDownloading(true);
    setError(null);
    try {
      // Loaded on demand: ~600 kB that most sessions never need.
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [w, h] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`KnowledgeGraph-Certificate-${roadmap.title.replace(/[^\w]+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Certificate failed', err);
      setError('Could not generate the PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!certificate) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cert-title">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" aria-hidden />
          </div>
          <h2 id="cert-title" className="text-2xl font-black text-slate-900 mb-2">Roadmap completed</h2>
          <p className="text-slate-500 mb-6">You completed 100% of <strong>{roadmap.title}</strong>. Enter your name for the certificate.</p>
          <label htmlFor="cert-name" className="sr-only">Your full name</label>
          <input
            id="cert-name"
            type="text"
            placeholder="Your full name"
            maxLength={80}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && issue()}
            className="w-full p-4 border border-slate-200 rounded-lg mb-4 text-center font-bold text-lg focus:border-slate-900 outline-none"
            autoFocus
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-slate-600 rounded-lg font-semibold hover:bg-slate-50">Cancel</button>
            <button
              onClick={issue}
              disabled={name.trim().length < 3}
              className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dateStr = new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-auto py-10 px-4 flex flex-col items-center" role="dialog" aria-modal="true" aria-label="Certificate preview">
      <div className="w-full max-w-[1000px] flex flex-wrap gap-4 justify-between items-center mb-8 text-white">
        <div>
          <h2 className="font-bold text-lg">Certificate preview</h2>
          <p className="text-slate-400 text-sm">Scroll sideways on small screens.</p>
        </div>
        <div className="flex gap-4 items-center">
          {error && <span role="alert" className="text-sm text-red-300">{error}</span>}
          <button onClick={onClose} className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">Close</button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>

      <div ref={certificateRef} className="bg-white text-slate-900 w-[1000px] h-[700px] relative shadow-xl flex-shrink-0" style={{ fontFamily: 'serif' }}>
        <div className="absolute inset-4 border-4 border-slate-900 flex flex-col items-center justify-between py-14 px-20">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-slate-900 text-white p-1 rounded"><ShieldCheck className="w-6 h-6" /></div>
              <span className="font-sans font-bold text-sm tracking-[0.2em] text-slate-900 uppercase">KnowledgeGraph</span>
            </div>
            <h1 className="text-6xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'sans-serif' }}>CERTIFICATE</h1>
            <p className="text-xl text-slate-500 font-sans tracking-widest uppercase">Of completion</p>
          </div>

          <div className="text-center w-full space-y-8">
            <p className="text-lg italic text-slate-500">This certificate records that</p>
            <div className="text-5xl font-bold text-slate-900 border-b-2 border-slate-900/10 pb-4 px-12 inline-block min-w-[400px]">{certificate.name}</div>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              completed all {roadmap.nodes.length} steps of the learning roadmap<br />
              <strong className="text-slate-900 text-2xl block mt-2">{roadmap.title}</strong>
            </p>
          </div>

          <div className="w-full">
            <div className="flex justify-between items-end pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="font-sans font-bold text-slate-900 text-lg">{dateStr}</div>
                <div className="text-xs text-slate-500 font-sans uppercase tracking-wider mt-1">Date issued</div>
              </div>
              <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-amber-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="font-sans font-bold text-slate-900 text-lg">{certificate.id}</div>
                <div className="text-xs text-slate-500 font-sans uppercase tracking-wider mt-1">Record ID</div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-slate-500 font-sans">
              Completion is self-reported by the learner within KnowledgeGraph and has not been assessed by a third party.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
