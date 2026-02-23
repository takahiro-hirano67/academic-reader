# backend/src/services/academic/supports/academic_parser.py

import io
from typing import Any, Dict

import torch
from docling.datamodel.base_models import InputFormat
from docling.datamodel.document import PictureItem, TableItem
from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

# グローバルでコンバーターを保持
_converter = None


def get_converter() -> DocumentConverter:
    """
    シングルトンパターンでコンバーターを取得
    高精度な解析オプションを設定
    """
    global _converter
    if _converter is None:
        # --- GPUが利用可能かチェック ---
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Docling] Using device: {device}")

        # --- パイプラインオプションの設定 ---
        pipeline_options = PdfPipelineOptions()

        # --- 基本機能 ---
        pipeline_options.do_ocr = True  # OCRを有効化（画像化された文字対策）
        pipeline_options.ocr_options = RapidOcrOptions(
            backend="torch"
        )  # OCRでGPUを明示的に使用するよう指定
        pipeline_options.do_table_structure = True  # 表構造解析を有効化

        # --- 論文解析向け ---
        pipeline_options.do_formula_enrichment = True  # 数式解析
        pipeline_options.generate_picture_images = True  # 図の画像抽出
        pipeline_options.generate_table_images = (
            True  # 【追加】表の画像抽出（複雑な表対策）
        )

        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=pipeline_options,
                    # 数式をMarkdown内で明示的に$..$などのLatex形式で出すための設定
                )
            }
        )
    return _converter


def extract_content_from_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    PDFからMarkdownと画像を抽出する

    Args:
        pdf_bytes: PDFファイルのバイナリデータ

    Returns:
        str: Markdown形式のテキスト

    Raises:
        Exception: パース失敗時
    """
    try:
        converter = get_converter()

        # 1. BytesIOから直接変換
        pdf_stream = io.BytesIO(pdf_bytes)
        # ソース名を指定
        from docling.datamodel.document import DocumentStream

        doc_stream = DocumentStream(name="input.pdf", stream=pdf_stream)

        # 変換実行
        result = converter.convert(doc_stream)

        # 2. Markdown抽出
        markdown_text = result.document.export_to_markdown()

        # 3. 画像(Picture)と表(Table)の画像を両方抽出する
        extracted_images = []
        for element, _level in result.document.iterate_items():
            # 図(PictureItem) または 表(TableItem) を対象にする
            if isinstance(element, (PictureItem, TableItem)):
                # element.image.pil_image に PIL形式で格納
                if element.image and element.image.pil_image:
                    extracted_images.append(element.image.pil_image)

        return {"markdown": markdown_text, "images": extracted_images}

    except Exception as e:
        print(f"[Docling] PDF parsing error: {e}")
        raise Exception(f"PDF解析に失敗しました: {str(e)}")
