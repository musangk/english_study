"""Run: python3 -m unittest discover -s tests   (no dependencies)
Checks the Python CLI follows the same rules as coach/core.js."""
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "cli"))
import lsf  # noqa: E402

FIX = (ROOT / "tests/fixtures/report_en.md").read_text(encoding="utf-8")
PACK = lsf.load_pack("en")


class CoreParity(unittest.TestCase):
    def test_hash_vectors_match_js(self):
        vec = json.loads((ROOT / "tests/fixtures/hash_vectors.json").read_text(encoding="utf-8"))
        for s, h in vec.items():
            self.assertEqual(lsf.hash_id(s), h, s)

    def test_parse_json_and_table(self):
        r, src = lsf.parse_report(FIX, PACK)
        self.assertEqual((src, len(r["errors"]), len(r["expressions"])), ("json", 2, 3))
        r2, src2 = lsf.parse_report(FIX.split("```lsf-report")[0], PACK)
        self.assertEqual((src2, len(r2["errors"]), r2["scores"]["fluency"]), ("table", 2, 4))
        with self.assertRaises(ValueError):
            lsf.parse_report("hello", PACK)

    def test_mission_matches_js_rules(self):
        store = lsf.empty_store()
        m = lsf.pick_mission(store, PACK, "2026-11-16")  # Monday
        self.assertEqual(m["trackKey"], "work")
        r, _ = lsf.parse_report(FIX, PACK)
        res = lsf.apply_report(store, r, m, "2026-11-16")
        self.assertEqual(res["added"], 5)
        sat = lsf.pick_mission(store, PACK, "2026-11-21")
        self.assertTrue(sat["review"])
        self.assertEqual(sat["scenario"], r["scenario"])
        for p in (PACK, lsf.load_pack("ja")):
            mm = lsf.pick_mission(lsf.empty_store(), p, "2026-11-18")
            rv = lsf.review_prompt(p, mm)
            self.assertNotRegex(lsf.start_prompt(p, lsf.empty_store(), mm) + rv, r"\{\{\w+\}\}")
            json.loads(rv.split("```lsf-report")[1].split("```")[0])


class CliFlow(unittest.TestCase):
    def run_cli(self, *args):
        buf = io.StringIO()
        with redirect_stdout(buf):
            lsf.main(list(args))
        return buf.getvalue()

    def test_end_to_end(self):
        with tempfile.TemporaryDirectory() as d:
            data = str(Path(d) / "store.json")
            rep = Path(d) / "r.md"
            rep.write_text(FIX, encoding="utf-8")
            self.assertIn("created", self.run_cli("--data", data, "init"))
            self.assertIn("sparring partner", self.run_cli("--data", data, "start"))
            self.assertIn("lsf-report", self.run_cli("--data", data, "review"))
            self.assertIn("new cards 5", self.run_cli("--data", data, "log", str(rep)))
            self.assertIn("| 세션 | 1 |", self.run_cli("--data", data, "stats"))
            self.assertEqual(len(self.run_cli("--data", data, "anki").strip().splitlines()), 5)
            store = json.loads(Path(data).read_text(encoding="utf-8"))
            self.assertEqual(store["version"], 1)


if __name__ == "__main__":
    unittest.main()
