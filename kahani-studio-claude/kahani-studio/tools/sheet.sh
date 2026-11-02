#!/bin/bash
# usage: tools/sheet.sh outdir t1 t2 ...   — renders frames in parallel
out=$1; shift; cd "$(dirname "$0")/.."
for t in "$@"; do node tools/shot.mjs $out/f$t.png "t=$t&nocaps=1" 2>&1 | sed "s/^/[$t] /" & done; wait
