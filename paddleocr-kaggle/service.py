import base64
import io
import json
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

os.environ.setdefault('PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK', '1')

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from paddleocr import PaddleOCR
from PIL import Image

ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'application/pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024
ocr = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global ocr
    device = 'gpu:0' if os.system('nvidia-smi > /dev/null 2>&1') == 0 else 'cpu'
    ocr = PaddleOCR(
        device=device,
        text_detection_model_name='PP-OCRv5_mobile_det',
        text_recognition_model_name='en_PP-OCRv5_mobile_rec',
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )
    yield


app = FastAPI(title='Captuto PaddleOCR', lifespan=lifespan)


def require_token(authorization: str | None) -> None:
    expected = os.environ.get('PADDLE_OCR_TOKEN')
    if not expected or authorization != f'Bearer {expected}':
        raise HTTPException(status_code=401, detail='Unauthorized')


def result_lines(prediction) -> list[dict]:
    raw_payload = prediction.json if hasattr(prediction, 'json') else prediction
    raw_payload = raw_payload() if callable(raw_payload) else raw_payload
    payload = json.loads(raw_payload) if isinstance(raw_payload, str) else raw_payload
    result = payload.get('res', payload)
    texts = result.get('rec_texts', [])
    scores = result.get('rec_scores', [])
    boxes = result.get('rec_polys', result.get('rec_boxes', []))
    return [
        {
            'text': str(text),
            'confidence': float(scores[index]) if index < len(scores) else 0.0,
            'bbox': boxes[index].tolist() if index < len(boxes) and hasattr(boxes[index], 'tolist') else (boxes[index] if index < len(boxes) else []),
        }
        for index, text in enumerate(texts)
    ]


def result_page(prediction, page_index: int) -> dict:
    # Use exactly the raster on which PaddleOCR returned its coordinates,
    # including PDF pages and any orientation/preprocessing already applied.
    pixels = prediction['doc_preprocessor_res']['output_img']
    height, width = pixels.shape[:2]
    preview = Image.fromarray(pixels[:, :, ::-1])  # PaddleX uses BGR.
    preview.thumbnail((2000, 2000))
    buffer = io.BytesIO()
    preview.save(buffer, format='JPEG', quality=85)
    lines = result_lines(prediction)
    for index, line in enumerate(lines):
        line['page_index'] = page_index
        line['id'] = f'{page_index}-{index}'
    return {
        'page_index': page_index,
        'width': int(width),
        'height': int(height),
        'image': 'data:image/jpeg;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii'),
        'lines': lines,
    }


@app.get('/health')
def health():
    return {'status': 'ok', 'model': 'PaddleOCR', 'pid': os.getpid()}


@app.post('/ocr')
async def recognize(file: UploadFile = File(...), authorization: str | None = Header(default=None)):
    require_token(authorization)
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail='Only JPG, PNG, and PDF files are accepted.')

    content = await file.read()
    if not content or len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail='File must be between 1 byte and 10 MB.')

    suffix = Path(file.filename or 'document').suffix or '.png'
    with tempfile.NamedTemporaryFile(suffix=suffix) as temp_file:
        temp_file.write(content)
        temp_file.flush()
        pages = [result_page(prediction, index) for index, prediction in enumerate(ocr.predict(temp_file.name))]

    return {'lines': [line for page in pages for line in page['lines']], 'pages': pages}
