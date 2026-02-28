'use client';

import { useState, useRef } from 'react';
import { Upload, FileArchive, ArrowRight, Download, RefreshCw, AlertCircle, HelpCircle, Info, ChevronDown } from 'lucide-react';
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
  const [showInfo, setShowInfo] = useState(false);
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
    <div className="flex flex-col min-h-screen">
      <main className="container main-content animate-in space-y-16">

        {/* Header - Minimalist */}
        <header className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Renomeador de Recibo de Pagamento
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <p className="subtitle max-w-sm leading-relaxed text-zinc-500">
                Ferramenta dedicada para processamento em lote e organização de documentos via OCR.
              </p>

              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 group cursor-pointer w-fit outline-none"
              >
                <div className="w-5 h-5 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-white transition-colors help-glow">
                  <Info size={10} className="text-zinc-600 group-hover:text-white transition-colors help-pulse" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-white transition-colors">
                  Como funciona?
                </span>
                <ChevronDown size={10} className={`text-zinc-700 transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Info Grid - Collapsible */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-zinc-900 overflow-hidden transition-all duration-500 ease-in-out ${showInfo ? 'max-h-60 opacity-100 pt-8 mb-8' : 'max-h-0 opacity-0 py-0 border-transparent'}`}>
            <div className="space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">O que é extraído</h2>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                RPA, Nome, Valor Recebido e CPF detectados automaticamente através de OCR.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Formato de Saída</h2>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                {"{Prefixo}"}_RPA {"{RPA}"}_DIARISTA {"{Nome}"}_{"{Valor}"}_{"{CPF}"}.pdf
              </p>
            </div>
          </div>
        </header>

        {/* Form Area */}
        <div className="space-y-12">

          {/* Config */}
          <section className="space-y-3 max-w-xs">
            <div className="flex items-center gap-2">
              <label htmlFor="pattern" className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block shrink-0">
                Número Prefixo
              </label>
              <div className="group relative">
                <div className="w-5 h-5 rounded-full border border-zinc-900 flex items-center justify-center help-glow cursor-help">
                  <HelpCircle size={11} className="text-zinc-700 group-hover:text-white transition-colors animate-in help-pulse" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 leading-normal rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl">
                  O valor inserido será o início do nome. Ex: se for "17", o arquivo será "17_RPA 1777_DIARISTA NOME_VALOR_CPF.pdf".
                </div>
              </div>
            </div>
            <input
              id="pattern"
              type="text"
              required
              className="minimalist-input"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Ex: 17"
            />
          </section>

          {/* Upload */}
          <section
            className={`minimalist-card flex flex-col items-center justify-center gap-4 py-16 ${isDragging ? 'border-zinc-500' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".zip"
              onChange={handleFileChange}
            />

            <div className="text-center space-y-2">
              {zipFile ? (
                <>
                  <FileArchive size={20} className="mx-auto text-white mb-2" />
                  <p className="text-xs font-medium text-white">{zipFile.name}</p>
                  <p className="text-[10px] text-zinc-600 uppercase">{(zipFile.size / 1024 / 1024).toFixed(2)} MB • Pronto</p>
                </>
              ) : (
                <>
                  <Upload size={18} className="mx-auto text-zinc-800 mb-2" />
                  <p className="text-zinc-600 text-xs text-balance">Arraste seu ZIP aqui ou clique para selecionar</p>
                </>
              )}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="text-red-500 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Action Button */}
          <div>
            <button
              className={`minimalist-btn ${(!zipFile || isProcessing || !pattern.trim()) ? 'opacity-20 grayscale pointer-events-none' : ''}`}
              disabled={!zipFile || isProcessing || !pattern.trim()}
              onClick={handleProcess}
            >
              {isProcessing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Processar Documentos</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <section className="animate-in space-y-8 pt-12">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Resultados</h3>
              <div className="h-[1px] flex-1 bg-zinc-900"></div>
              <span className="text-[10px] text-zinc-600">{results.length} Arquivos</span>
            </div>

            <div className="grid gap-px bg-zinc-900 border border-zinc-900 overflow-hidden">
              {results.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-5 bg-black">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs text-zinc-600 truncate max-w-[150px]">{file.oldName}</span>
                    <ArrowRight size={12} className="text-zinc-800" />
                    <span className="text-xs text-white font-medium truncate">{file.newName}.pdf</span>
                  </div>
                  <div className={`text-[9px] font-bold ${file.status === 'success' ? 'text-zinc-400' : 'text-red-500'}`}>
                    {file.status === 'success' ? 'OK' : 'FALHA'}
                  </div>
                </div>
              ))}
            </div>

            {downloadUrl && (
              <div className="pt-4">
                <a
                  href={downloadUrl}
                  download="pdfs_renomeados.zip"
                  className="inline-flex items-center gap-2 text-white text-sm font-medium border-b border-zinc-800 hover:border-white transition-all pb-1"
                >
                  <Download size={16} />
                  Baixar Pack Completo
                </a>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer-custom">
        <div className="footer-container">
          <span className="opacity-40 tracking-tight">© 2026 • Todos os direitos reservados</span>
          <div className="footer-dev">
            <span className="opacity-20 text-[9px] uppercase tracking-widest font-bold">Desenvolvido por</span>
            <a href="https://luisitcho.com.br/" target="_blank" rel="noopener noreferrer">Luisitcho</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
