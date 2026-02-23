# backend/Dockerfile

## ベースイメージ ##
FROM python:3.12-slim

# OpenCV/RapidOCRに必要なシステムライブラリをインストール
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

## 作業ディレクトリを設定 ##
WORKDIR /app

## uvをインストール ##
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

## uvのvenv作成場所を明示 ##
ENV UV_PROJECT_ENVIRONMENT=/app/.venv

## 依存関係定義のみ先にコピー ##
COPY pyproject.toml uv.lock ./

## 依存関係のインストール ##
# --frozenでlockファイルを厳密に再現
RUN uv sync --frozen --no-dev

## アプリのコードをコピー ##
COPY . .

## FastAPI 開発サーバーのポート（明示的に記載） ##
EXPOSE 8000

## コンテナ起動時に実行するコマンド ##
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]