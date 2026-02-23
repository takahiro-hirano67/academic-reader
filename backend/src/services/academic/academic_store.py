# backend/src/services/academic/academic_store.py

import json
import shutil
from pathlib import Path
from typing import Any, List
from uuid import uuid4

from src.core.config import STATIC_BASE_PATH, STATIC_BASE_URL

# ==========================================
# 1. データ管理（ファイルベース）
# ==========================================


def _get_base_dir(doc_id: str) -> Path:
    """IDごとのベースディレクトリを取得"""
    return STATIC_BASE_PATH / "academic" / doc_id


def save_academic_data(markdown_text: str, images: List[Any]) -> str:
    """
    解析結果（Markdownと画像）を保存する
    Args:
        markdown_text (str): 抽出されたMarkdown
        images (List): PIL Imageオブジェクトのリスト
    Returns:
        str: 生成されたID
    """
    doc_id = str(uuid4())
    base_dir = _get_base_dir(doc_id)
    figure_dir = base_dir / "figures"

    # ディレクトリ作成
    base_dir.mkdir(parents=True, exist_ok=True)
    figure_dir.mkdir(parents=True, exist_ok=True)

    # 1. Markdown保存
    with open(base_dir / "content.md", "w", encoding="utf-8") as f:
        f.write(markdown_text)

    # 2. 画像保存
    saved_images_meta = []
    for idx, img in enumerate(images, 1):
        filename = f"fig_{idx:03d}.png"
        save_path = figure_dir / filename

        # PNGとして保存
        img.save(save_path, format="PNG")

        saved_images_meta.append(
            {
                "id": f"fig_{idx:03d}",
                "label": f"Figure {idx}",  # 論文らしく Figure 表記
                "filename": filename,
            }
        )

    # メタデータ保存（画像リストなど）
    meta = {"id": doc_id, "images": saved_images_meta}
    with open(base_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return doc_id


# ==========================================
# 2. アクセス用URL生成
# ==========================================


def build_academic_figure_url(doc_id: str, filename: str) -> str:
    # URL: /static/academic/{id}/figures/{filename}
    return f"{STATIC_BASE_URL}/academic/{doc_id}/figures/{filename}"


# ==========================================
# 3. クリーンアップ
# ==========================================


def cleanup_temp_academic_files():
    target_dir = STATIC_BASE_PATH / "academic"
    if target_dir.exists():
        try:
            shutil.rmtree(target_dir)
            print(f"[Academic] Cleanup: Deleted {target_dir}")
        except Exception as e:
            print(f"[Academic] Cleanup Error: {e}")
