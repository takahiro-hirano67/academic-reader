# backend/src/services/academic/academic_api.py

from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from src.services.academic.academic_store import build_academic_figure_url, save_academic_data
from src.services.academic.supports.academic_parser import extract_content_from_pdf

router = APIRouter(prefix="/api/academic", tags=["学術論文(Academic)"])


# 画像の型
class AcademicImage(BaseModel):
    id: str
    label: str
    url: str


# レスポンスモデル
class AcademicParseResponse(BaseModel):
    filename: str
    text_length: int
    content: str
    images: List[AcademicImage]  # 追加


@router.post("/parse", response_model=AcademicParseResponse)
async def parse_academic_pdf(file: UploadFile = File(...)):
    """
    アップロードされた学術論文PDFからテキストを抽出する
    Doclingを使用して高精度な構造解析を実行
    """
    # バリデーション
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="PDFファイルのみ対応しています")

    # ファイル読み込み
    content = await file.read()

    # ファイルサイズチェック（50MB制限）
    MAX_SIZE = 50 * 1024 * 1024
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail=f"ファイルサイズが上限({MAX_SIZE // 1024 // 1024}MB)を超えています")

    # Doclingでパース（例外は自動的にHTTPExceptionに変換される）
    try:
        # 抽出実行（辞書を返す）
        result_data = extract_content_from_pdf(content)
        markdown_text = result_data["markdown"]
        pil_images = result_data["images"]

        # 保存処理
        doc_id = save_academic_data(markdown_text, pil_images)

        # レスポンス用画像データ作成
        # save_academic_dataの実装に合わせてURLを生成
        response_images = []
        for idx in range(1, len(pil_images) + 1):
            filename = f"fig_{idx:03d}.png"
            response_images.append(
                {"id": f"fig_{idx:03d}", "label": f"Figure {idx}", "url": build_academic_figure_url(doc_id, filename)}
            )

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF解析エラー: {str(e)}")

    return {
        "filename": file.filename,
        "text_length": len(markdown_text),
        "content": markdown_text,
        "images": response_images,
    }
