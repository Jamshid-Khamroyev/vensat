import { useRef, useState } from 'react';
import { FileUp, Link2, ClipboardPaste, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const COLLECTIONS = [
  { value: 'pdf_documents', label: 'Reading sources (pdf_documents)' },
  { value: 'dsat_rules', label: 'Standard Conventions rules (dsat_rules)' },
] as const;

type Collection = typeof COLLECTIONS[number]['value'];

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const Sources = () => {
  const [collection, setCollection] = useState<Collection>('pdf_documents');
  const [pdf, setPdf] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<'pdf' | 'text' | 'url' | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadPdf = async () => {
    if (!pdf) return toast.error('Choose a PDF first');
    setBusy('pdf');
    try {
      const form = new FormData();
      form.append('pdf', pdf);
      form.append('collectionName', collection);
      const { data } = await api.post('/api/rag/upload-pdf', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const chunks = data?.data?.chunks;
      setLastResult(`${pdf.name}${chunks ? ` · ${chunks} chunks` : ''} added to ${collection}`);
      toast.success('PDF added to sources');
      setPdf(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      toast.error(errorMessage(error, 'PDF upload failed'));
    } finally {
      setBusy(null);
    }
  };

  const uploadText = async () => {
    if (!text.trim()) return toast.error('Paste some text first');
    setBusy('text');
    try {
      const { data } = await api.post('/api/rag/upload', { text: text.trim(), collectionName: collection });
      setLastResult(`${data?.data?.chunks ?? 0} chunks added to ${collection}`);
      toast.success('Text added to sources');
      setText('');
    } catch (error) {
      toast.error(errorMessage(error, 'Upload failed'));
    } finally {
      setBusy(null);
    }
  };

  const scanUrl = async () => {
    if (!/^https?:\/\//.test(url.trim())) return toast.error('Enter a full URL starting with http(s)://');
    setBusy('url');
    try {
      await api.post('/api/rag/scan', { url: url.trim() });
      setLastResult(`Articles from ${url.trim()} added to pdf_documents`);
      toast.success('Website scanned');
      setUrl('');
    } catch (error) {
      toast.error(errorMessage(error, 'Scan failed'));
    } finally {
      setBusy(null);
    }
  };

  const spinner = <Loader2 className="w-4 h-4 animate-spin" />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Sources</h1>
        <p className="text-muted-foreground">
          Real reading material that question generation draws from. Source-first, not AI-first.
        </p>
      </header>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Collection for PDF and text uploads</span>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value as Collection)}
          className="bluebook-input h-12"
        >
          {COLLECTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      <section className="bluebook-card p-5 sm:p-6 border-dashed border-2 border-input text-center space-y-3">
        <FileUp className="w-8 h-8 text-primary mx-auto" />
        <div>
          <h2 className="text-lg">Upload a PDF</h2>
          <p className="text-sm text-muted-foreground">Split into chunks, embedded and stored in the vector database.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button type="button" onClick={() => fileRef.current?.click()} className="bluebook-button !bg-accent !text-accent-foreground">
            {pdf ? pdf.name : 'Choose PDF'}
          </button>
          {pdf && (
            <button type="button" onClick={uploadPdf} disabled={busy !== null} className="bluebook-button">
              {busy === 'pdf' && spinner} Upload
            </button>
          )}
        </div>
      </section>

      <section className="bluebook-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg">Scan a website</h2>
        </div>
        <p className="text-sm text-muted-foreground">Finds article links on the page and ingests each one.</p>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          inputMode="url"
          className="bluebook-input h-12"
        />
        <button type="button" onClick={scanUrl} disabled={busy !== null} className="bluebook-button w-full">
          {busy === 'url' && spinner} Scan
        </button>
      </section>

      <section className="bluebook-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardPaste className="w-5 h-5 text-primary" />
          <h2 className="text-lg">Paste text</h2>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an academic passage…"
          rows={5}
          className="bluebook-input resize-y"
        />
        <button type="button" onClick={uploadText} disabled={busy !== null} className="bluebook-button w-full !bg-transparent !text-foreground border-[1.5px] border-foreground">
          {busy === 'text' && spinner} Add to sources
        </button>
      </section>

      {lastResult && (
        <div className="flex items-start gap-2 rounded-md bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{lastResult}</span>
        </div>
      )}
    </div>
  );
};

export default Sources;
