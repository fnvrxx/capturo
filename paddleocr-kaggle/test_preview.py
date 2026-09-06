"""Test preview serialization with real image arrays, without downloading OCR models."""
import ast
import base64
import io
import json
import unittest
from pathlib import Path

import numpy as np
from PIL import Image


source = ast.parse(Path(__file__).with_name('service.py').read_text())
helpers = ast.Module(body=[node for node in source.body if isinstance(node, ast.FunctionDef) and node.name in {'result_lines', 'result_page'}], type_ignores=[])
namespace = {'base64': base64, 'io': io, 'json': json, 'Image': Image}
exec(compile(helpers, 'service.py', 'exec'), namespace)


class PreviewTest(unittest.TestCase):
    def prediction(self, texts=None):
        pixels = np.zeros((1500, 3000, 3), dtype=np.uint8)
        pixels[:, :, 2] = 255  # BGR red, which must remain red in browser RGB.
        return {
            'doc_preprocessor_res': {'output_img': pixels},
            'rec_texts': ['Nama: Fajar'] if texts is None else texts,
            'rec_scores': np.array([0.976]),
            'rec_polys': np.array([[[10, 20], [60, 15], [65, 40], [12, 45]]]),
        }

    def test_coordinates_and_color_match_page_raster_after_thumbnail(self):
        page = namespace['result_page'](self.prediction(), 1)
        self.assertEqual((page['width'], page['height']), (3000, 1500))
        self.assertEqual(page['lines'][0]['bbox'], [[10, 20], [60, 15], [65, 40], [12, 45]])
        self.assertEqual(page['lines'][0]['confidence'], 0.976)
        self.assertEqual(page['lines'][0]['page_index'], 1)
        preview = Image.open(io.BytesIO(base64.b64decode(page['image'].split(',', 1)[1])))
        self.assertEqual(preview.size, (2000, 1000))
        red, _, blue = preview.getpixel((0, 0))
        self.assertGreater(red, 240)
        self.assertLess(blue, 10)
        json.dumps(page)  # No NumPy objects escape into the HTTP JSON response.

    def test_empty_page_is_retained_and_page_ids_do_not_collide(self):
        blank = namespace['result_page'](self.prediction([]), 0)
        self.assertEqual(blank['lines'], [])
        first = namespace['result_page'](self.prediction(), 0)
        second = namespace['result_page'](self.prediction(), 1)
        self.assertNotEqual(first['lines'][0]['id'], second['lines'][0]['id'])


if __name__ == '__main__':
    unittest.main()
