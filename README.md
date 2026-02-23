# Academic Reader

**Academic Reader** は、学術論文のPDFを高精度に解析し、Markdownテキストと画像（図表）として抽出・表示するローカル専用のWebアプリケーションです。

強力な文書解析ライブラリである [Docling](https://github.com/DS4SD/docling) をバックエンドに採用しており、複雑な段組み、数式、表、図版を含む論文PDFを正確に構造化して読み取ることができます。

![スクリーンショット](フロントエンドのスクリーンショット添付予定)

## 開発目的

* 英語の学術論文を快適に読むために作成しました。

## 課題と解決策

* 英語の論文PDFは、ブラウザで表示してもブラウザの翻訳機能は使えず、Google翻訳などのソフトにテキストを貼り付けることで翻訳します。しかし、文字数制限もあり、不便でした。
* また、LLMに翻訳させるアプローチもありますが、トークン消費量が多く、解説もさせる場合は「翻訳」→「解説」とLLMによる情報の加工が2回行われることになり、正確である保証はありません。
* そこで、Doclingを用いてMarkdownに変換してブラウザ上に表示すれば、ブラウザの翻訳機能をそのまま利用でき、英語 <--> 日本語 を切り替えながら読み進めることが可能です。
* また、高精度なMarkdownとして出力されるため、LLMに与えるコンテキストとしても最適です。（LaTeX記法の数式や、構造化されたテーブル出力にも対応）
* 画像も抽出されているため、画像のみをダウンロードすることも可能です。（NotebookLM向けのクリーンな資料作成にも適しています）

## オフラインツール

* 技術スタックはWebアプリ向けですが、Dockerを利用しローカルサーバーを起動して利用するオフラインツールとしての運用を想定しています。
* **理由**:
  * Docklingは内部で高精度なOCRモデルを利用しており、GPUによる処理が必要。
  * クラウドでのGPUデプロイは通常と比べコストが高く、今回の処理ではそこまで高性能のGPUは不要。
  * 用途的にもWeb上に公開する必要性があまりない。

## 主な機能

* **PDFの高精度構造解析**: DoclingによるPDFの読み取り（数式、表、段落の認識）。
* **図表の自動抽出**: 論文内に含まれるFigure（図）やTable（表）を画像として自動で切り出し、サイドパネルに一覧表示。
* **Markdownビューワー**: 抽出されたテキストを、数式対応（KaTeX）のクリーンなMarkdownとして表示。
* **原文PDFプレビュー**: 解析結果と元のPDFをワンクリックで切り替えて比較確認が可能。
* **1クリックコピー**: 解析されたMarkdownの全文をクリップボードに一瞬でコピー。
* **1クリックダウンロード**: 解析されたMarkdownの全文をその場で`.md`ファイルとしてダウンロード。

## 技術スタック

* **Backend**
  * Python 3.12
  * FastAPI (APIサーバー)
  * Docling (PDF解析・OCR)
  * PyTorch (GPUアクセラレーション)
  * uv (高速なパッケージマネージャー)
* **Frontend**
  * Next.js (React)
  * Tailwind CSS
  * React Markdown / rehype-katex (Markdown・数式レンダリング)
* **Infrastructure**
  * Docker / Docker Compose

## セットアップと起動方法

本システムは、Docker環境での実行を推奨しています。コンテナ内でGPUを使用するための設定（`nvidia-container-toolkit`）が必要です。

### 1. 準備

初回起動時のみ、バックエンドの依存関係ファイル（`uv.lock`）を生成しておく必要があります。
※すでに生成済みの場合はスキップしてください。

```bash
cd backend
uv sync --frozen --no-dev
cd ..

```

### 2. 環境変数の設定

`backend` と `frontend` のディレクトリに、それぞれ環境変数ファイルを作成します。
リポジトリにある `.example` ファイルをコピーして利用してください。

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local

```

### 3. Docker Compose での起動

ルートディレクトリで以下のコマンドを実行します。

```bash
docker compose up --build

```

* バックエンド: `http://localhost:8000`
* フロントエンド: `http://localhost:3000`

> **Note**: 初回起動時は、Doclingが必要とするレイアウト解析やOCR用のモデルデータ（数GB）をHugging Faceからダウンロードするため、最初の解析に時間がかかります。モデルデータはDockerのボリューム（`model-cache`）に永続化されるため、次回以降は高速に処理されます。

## ディレクトリ構成

```text
academic-reader/
├── backend/                # FastAPI バックエンド
│   ├── src/
│   │   ├── core/           # 設定、モデル初期化
│   │   └── services/
│   │       └── academic/   # PDF解析ロジック、APIルーター
│   ├── pyproject.toml      # 依存関係定義
│   └── Dockerfile
├── frontend/               # Next.js フロントエンド
│   ├── app/                # UIページ構成
│   ├── components/         # 共通コンポーネント (MarkdownViewer, ImageModal等)
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml      # コンテナ構成定義

```