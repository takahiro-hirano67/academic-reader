# backend/src/core/model_setup.py

from docling.document_converter import DocumentConverter

def ensure_models_downloaded():
    """起動時にモデルが存在するか確認（Docling）"""
    try:
        # 軽量な初期化テスト（実際のPDFは使わない）
        __ = DocumentConverter()
        print("[Docling] ✓ Models are ready.")
        return True
    except Exception:
        # モデル未ダウンロードの場合のメッセージ
        print("[Docling] ⚠ Models will be downloaded on first use.")
        print("         (This may take a few minutes on first request)")
        return False
