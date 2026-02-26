'use client';

import { useState, useRef } from 'react';
import { Upload, FileArchive, ArrowRight, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { processZipAction } from '@/actions/process-zip';

interface FileResult {
  oldName: string;
  newName: string;
  status: 'pending' | 'success' | 'error';
  rawText?: string;
  details?: {
    rpa: string;
    name: string;
    value: string;
    cpf: string;
  };
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/zip') {
      setZipFile(files[0]);
      setError(null);
    } else {
      setError('Por favor, envie um arquivo ZIP.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setZipFile(files[0]);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!zipFile || !pattern.trim()) return;

    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', zipFile);
      formData.append('pattern', pattern);

      const result = await processZipAction(formData);

      if (result.success && result.data) {
        setResults(result.files);
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        setError(result.error || 'Erro ao processar o arquivo.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <main className="container main-content px-4 py-12 flex flex-col gap-10">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter">
            PDF Renamer <span className="text-indigo-500">Elite</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-lg">
            Processamento profissional de documentos escaneados via OCR.
          </p>
        </header>

        <section className="config-section bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl shadow-xl">
          <div className="input-group">
            <label htmlFor="pattern" className="text-sm font-semibold text-zinc-400 mb-2 block">
              Número Prefixo <span className="text-red-500 font-bold">* Obrigatório</span>
            </label>
            <input
              id="pattern"
              type="text"
              required
              className={`w-full p-4 rounded-xl bg-black/50 border transition-all ${!pattern.trim() ? "border-red-500/30" : "border-zinc-800 focus:border-indigo-500"}`}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Ex: 26"
            />
            <p className="mt-2 text-[11px] text-zinc-600 font-medium">
              Este número será utilizado como identificador inicial na renomeação dos arquivos.
            </p>
          </div>
        </section>

        <section
          className={`upload-card ${isDragging ? 'dragging border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/20'} border-2 border-dashed p-12 rounded-3xl hover:bg-zinc-900/30 transition-all cursor-pointer flex flex-col items-center gap-6`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".zip"
            onChange={handleFileChange}
          />

          <div className="icon-wrapper w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
            {zipFile ? <FileArchive size={32} /> : <Upload size={32} />}
          </div>

          <div className="text-center space-y-1">
            {zipFile ? (
              <>
                <p className="text-lg font-bold text-zinc-100">{zipFile.name}</p>
                <p className="text-sm text-indigo-400 font-medium">{(zipFile.size / 1024 / 1024).toFixed(2)} MB • Pronto para processar</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-zinc-200">Arraste seu arquivo ZIP aqui</p>
                <p className="text-sm text-zinc-500">ou clique para selecionar um arquivo</p>
              </>
            )}
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="flex justify-center">
          <button
            className={`w-full max-w-sm h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${(!zipFile || isProcessing || !pattern.trim()) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
            disabled={!zipFile || isProcessing || !pattern.trim()}
            onClick={handleProcess}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                <span>Gerar PDFs Renomeados</span>
              </>
            )}
          </button>
        </div>

        {results.length > 0 && (
          <section className="file-list space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Arquivos Processados</h3>
              <span className="text-[10px] font-black bg-zinc-800 px-2 py-1 rounded text-zinc-400 uppercase tracking-widest">{results.length} Itens</span>
            </div>

            <div className="grid gap-2">
              {results.map((file, index) => (
                <div key={index} className="file-item flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                  <div className="file-info flex items-center gap-3 overflow-hidden">
                    <span className="text-sm font-medium text-zinc-400 truncate max-w-[200px] sm:max-w-md">{file.oldName}</span>
                    <ArrowRight size={14} className="text-zinc-600 shrink-0" />
                    <span className="text-sm font-bold text-white truncate">{file.newName}.pdf</span>
                  </div>
                  <div className={`text-[9px] font-black px-2 py-1 rounded-full ${file.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                    {file.status === 'success' ? 'OK' : 'ERRO'}
                  </div>
                </div>
              ))}
            </div>

            {downloadUrl && (
              <div className="flex justify-center mt-10">
                <a
                  href={downloadUrl}
                  download="pdfs_renomeados.zip"
                  className="w-full max-w-sm h-14 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20"
                >
                  <Download size={22} />
                  Baixar Pack (.zip)
                </a>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer-custom mt-auto">
        <div className="footer-container">
          <nav className="social-links">
            <a href="https://www.linkedin.com/in/luishenriquesc/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Linkedin">
              <svg className="social-icon" viewBox="0 0 24 24" fill="#fff">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="https://github.com/luisitcho/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg className="social-icon" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/luisitcho/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg className="social-icon" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </nav>
          <span className="footer-copy text-zinc-400">© 2026 - Todos os direitos reservados</span>
          <div className="footer-dev">
            <span className="opacity-40 text-zinc-400">Desenvolvido por </span>
            <a href="https://luisitcho.com.br/" target="_blank" rel="noopener noreferrer">Luisitcho</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
