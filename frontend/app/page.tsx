// frontend/app/page.tsx

"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import { ImageModal } from "@/components/ui/ImageModal";
import MarkdownViewer from "@/components/ui/MarkdownViewer";
import {
    AlertCircle,
    File,
    FileText,
    Image as ImageIcon,
    Loader2,
    PanelRightClose,
    PanelRightOpen,
    RotateCcw,
    Upload,
    Download,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// 型定義更新
type AcademicImage = {
    id: string;
    label: string;
    url: string;
};

type ParseResponse = {
    filename: string;
    text_length: number;
    content: string;
    images: AcademicImage[];
};

export default function AcademicReaderPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ParseResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showImages, setShowImages] = useState(true); // 画像表示トグル
    // --- モーダル用State ---
    const [selectedImage, setSelectedImage] = useState<{ url: string; label: string } | null>(null);
    // --- 表示モードの切り替え（PDFは精度確認用など） ---
    const [viewMode, setViewMode] = useState<"markdown" | "pdf">("markdown");

    // --- PDF表示用のURL生成とクリーンアップ ---
    const pdfUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        // コンポーネントのアンマウント時やファイル変更時にURLを解放
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/academic/parse`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "解析に失敗しました");
            }

            const data: ParseResponse = await response.json();
            setResult(data);
            setShowImages(true); // 解析完了時は画像を表示
            setViewMode("markdown"); // 解析完了後はMarkdown表示に戻す
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ダウンロード機能
    const handleDownload = () => {
        if (!result || !result.content) return;
        const blob = new Blob([result.content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${result.filename}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // リセット
    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setSelectedImage(null); // 選択画像もクリア
        setViewMode("markdown");
    };

    // 結果表示モード
    if (result) {
        const hasImages = result.images.length > 0;

        return (
            <div className="h-full flex flex-col max-w-7xl mx-auto">
                {/* --- モーダル配置 --- */}
                <ImageModal
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    imageUrl={
                        selectedImage
                            ? `${process.env.NEXT_PUBLIC_API_URL}${selectedImage.url}`
                            : null
                    }
                    altText={selectedImage?.label}
                />
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="text-blue-600" />
                            {result.filename}
                        </h2>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                            文字数: {result.text_length.toLocaleString()}
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        {/* --- 表示モード切り替えトグル --- */}
                        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                            <button
                                onClick={() => setViewMode("markdown")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "markdown"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}>
                                <FileText size={14} />
                                解析結果
                            </button>
                            <button
                                onClick={() => setViewMode("pdf")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "pdf"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}>
                                <File size={14} />
                                原文PDF
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                            <div
                                className={
                                    viewMode === "pdf" ? "opacity-50 pointer-events-none" : ""
                                }>
                                <CopyButton text={result.content} label="全文コピー" />
                            </div>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                                <Download size={14} /> ダウンロード
                            </button>

                            {/* 画像トグルボタン */}
                            {hasImages && (
                                <button
                                    onClick={() => setShowImages(!showImages)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border bg-white text-slate-500 border-slate-200 hover:bg-slate-50 transition-all"
                                    title={showImages ? "画像を非表示にする" : "画像を表示する"}>
                                    {showImages ? (
                                        <PanelRightClose size={16} />
                                    ) : (
                                        <PanelRightOpen size={16} />
                                    )}
                                    {showImages ? "画像非表示" : "画像を表示"}
                                </button>
                            )}

                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-2xl text-gray-600 hover:bg-gray-100/50 transition-colors">
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden overflow-x-hidden">
                    {/* 左カラム: Markdown本文 OR PDFビューワー */}
                    <div
                        className={`
                            flex-1 relative
                            ${viewMode === "markdown"
                                ? "overflow-y-auto pb-20 pr-2"
                                : "h-full overflow-hidden"
                            }
                        `}>
                        {viewMode === "markdown" ? (
                            // --- Markdown表示モード ---
                            <MarkdownViewer content={result.content} />
                        ) : (
                            // --- PDF表示モード ---
                            <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                                {pdfUrl ? (
                                    <iframe
                                        src={`${pdfUrl}#view=FitH&navpanes=0`}
                                        className="w-full h-full border-none"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        PDFを表示できません
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 右カラム: 画像一覧 */}
                    {hasImages && showImages && (
                        <div className="w-96 shrink-0 flex flex-col border-l border-gray-200 pl-4 -mr-6 pr-6 pt-2 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <ImageIcon size={18} />
                                    抽出画像 ({result.images.length})
                                </h3>
                                <button
                                    onClick={() => setShowImages(false)}
                                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                    title="画像を非表示にする">
                                    <PanelRightClose size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-20">
                                {result.images.map((img) => (
                                    <div
                                        key={img.id}
                                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div
                                            className="aspect-auto bg-gray-50 rounded-md overflow-hidden mb-2 flex items-center justify-center relative group cursor-pointer"
                                            onClick={() =>
                                                setSelectedImage({ url: img.url, label: img.label })
                                            } // モーダルを開く
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_API_URL}${img.url}`}
                                                alt={img.label}
                                                className="max-w-full max-h-60 object-contain hover:scale-105 transition-transform duration-200"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    拡大表示
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-sm font-bold text-gray-700">
                                                {img.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // アップロード待機モード
    return (
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">学術論文リーダー</h1>
                <p className="text-gray-500">
                    PDFをアップロードして、高精度な構造解析（数式・表・図版）を実行します
                </p>
            </div>

            <div className="w-full border-2 border-dashed rounded-2xl p-12 text-center bg-white hover:border-gray-400 transition-all">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                            {file ? (
                                <FileText className="w-8 h-8 text-green-600" />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        {file ? (
                            <div>
                                <p className="text-lg font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-medium text-gray-700">PDFファイルを選択</p>
                        )}
                    </div>
                </label>
            </div>

            {error && (
                <div className="mt-6 p-4 w-full bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {file && (
                <button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="mt-8 w-full max-w-sm py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            解析中...
                        </>
                    ) : (
                        <>
                            <FileText />
                            解析を開始する
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
