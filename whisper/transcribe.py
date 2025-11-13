import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser(description="Run Whisper transcription and return JSON output.")
    parser.add_argument("--audio", required=True, help="Path to the audio file to transcribe")
    parser.add_argument("--model", default="base", help="Whisper model name (tiny, base, small, medium, large)")
    parser.add_argument("--language", default=None, help="Force transcription language (optional)")

    args = parser.parse_args()

    try:
        import whisper
    except ImportError as exc:
        raise SystemExit("openai-whisper is not installed. Please run `pip install openai-whisper`." ) from exc

    try:
        model = whisper.load_model(args.model)
        result = model.transcribe(
            args.audio,
            language=args.language,
            fp16=False,
        )

        output = {
            "text": result.get("text", "").strip(),
            "language": result.get("language"),
            "segments": result.get("segments", []),
        }

        sys.stdout.write(json.dumps(output, ensure_ascii=False))
    except Exception as err:  # noqa: BLE001
        error_payload = {
            "error": str(err),
        }
        sys.stdout.write(json.dumps(error_payload, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()

