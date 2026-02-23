# backend/main.py

import os
from contextlib import asynccontextmanager  # ライフサイクルイベント

import torch
from fastapi import FastAPI  # アプリ本体
from fastapi.staticfiles import StaticFiles  # 静的ファイルのマウント
from starlette.middleware.cors import CORSMiddleware  # ルーター登録用

# 環境変数
from src.core.config import CLEANUP_ON_EXIT, FRONTEND_URL, STATIC_BASE_PATH, STATIC_BASE_URL

# Docling
from src.core.model_setup import ensure_models_downloaded
from src.services.academic import academic_api
from src.services.academic.academic_store import cleanup_temp_academic_files

# GPUチェック
print(torch.__version__)
print("CUDA available:", torch.cuda.is_available())
print("Device count:", torch.cuda.device_count())
print("Device name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else None)

# ============================================================
# ライフサイクルイベント（起動・終了時の処理）
# ============================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションのライフサイクル管理
    - yield前: アプリ起動時の処理
    - yield後: アプリ終了時の処理
    """

    # --- 起動時の処理 ---
    print("アプリケーションを起動しています...")
    #
    if not os.path.exists(STATIC_BASE_PATH):
        os.makedirs(STATIC_BASE_PATH, exist_ok=True)
        print(f"フォルダを作成しました{STATIC_BASE_PATH}")

    # Doclingモデルの確認
    if not ensure_models_downloaded():
        print("[Warning] Docling models not found. First request will take longer.")

    yield  # ← ここでアプリケーションが実行される

    # --- 終了時の処理 ---
    print("アプリケーションを終了しています...")
    if CLEANUP_ON_EXIT == "true":
        cleanup_temp_academic_files()  # 論文一時ファイル削除実行


# ============================================================
# アプリケーションのセットアップ
# ============================================================

app = FastAPI(
    title="Academic Reader",
    description="学術論文リーダー",
    version="1.0.0",
    lifespan=lifespan,  # ← lifespanを指定
)

# ============================================================
# マウント処理
# ============================================================

# 学術論文用ストレージ
academic_storage_dir = STATIC_BASE_PATH / "academic"
academic_storage_dir.mkdir(parents=True, exist_ok=True)

app.mount(
    f"{STATIC_BASE_URL}/academic",  # -> "/static/academic"
    StaticFiles(directory=academic_storage_dir),
    name="static_academic",
)

# ============================================================
# CORS設定（フロントエンドとの通信を許可）
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # フロントエンド の URL を指定
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # 必要なメソッドのみ許可
    allow_headers=["Content-Type", "Authorization"],  # 必要なヘッダーのみ許可
)


# ============================================================
# ルーター登録（実装順）
# ============================================================


app.include_router(academic_api.router)  # 4. academic

# ============================================================
# エンドポイント（テスト用）
# ===========================================================


@app.get("/")
def read_root():
    return {"message": "document: localhost:8000/docs"}


# uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
