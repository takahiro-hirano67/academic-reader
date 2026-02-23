# backend/src/core/config.py

import os
from pathlib import Path

from dotenv import load_dotenv

# .envファイル読み込み
load_dotenv()

# フロントエンド側のURL
FRONTEND_URL = os.getenv("FRONTEND_URL")

# HuggingFace TOKEN（Doclingで内部的に使用される可能性を考慮）
HF_TOKEN = os.getenv("HF_TOKEN")

# プロジェクトのルートパス
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
# 静的ファイル
STATIC_BASE_PATH = PROJECT_ROOT / "storage"
STATIC_BASE_URL = "/static"

# 一時ファイルを削除するか
CLEANUP_ON_EXIT = "true"