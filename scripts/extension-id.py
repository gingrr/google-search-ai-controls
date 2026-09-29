#!/usr/bin/env python3
import hashlib
import subprocess
import sys

if len(sys.argv) != 2:
    print("Usage: extension-id.py /path/to/signing-key.pem", file=sys.stderr)
    sys.exit(2)

key_path = sys.argv[1]
proc = subprocess.run(
    ["openssl", "pkey", "-in", key_path, "-pubout", "-outform", "DER"],
    check=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)
digest = hashlib.sha256(proc.stdout).hexdigest()[:32]
translation = str.maketrans("0123456789abcdef", "abcdefghijklmnop")
print(digest.translate(translation))
