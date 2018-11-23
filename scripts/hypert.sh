#!/usr/bin/env bash

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname "$(dirname "$(realpath "$0")")")

	# On Linux with Electron 2.0.x running out of a VM causes
	# a freeze so we only enable this flag on macOS
	export ELECTRON_ENABLE_LOGGING=1
else
	ROOT=$(dirname "$(dirname "$(readlink -f $0)")")
fi

function hypert() {
	cd "$ROOT"

	if [[ "$OSTYPE" == "darwin"* ]]; then
		NAME=`node -p "require('./product.json').nameLong"`
		HYPERT="./.build/electron/$NAME.app/Contents/MacOS/Electron"
	else
		NAME=`node -p "require('./product.json').applicationName"`
		HYPERT=".build/electron/$NAME"
	fi

	# Node modules
	test -d node_modules || yarn

	# Get electron
	node build/lib/electron.js || ./node_modules/.bin/gulp electron

	# Manage built-in extensions
	if [[ "$1" == "--builtin" ]]; then
		exec "$HYPERT" build/builtin
		return
	fi

	# Sync built-in extensions
	# node build/lib/builtInExtensions.js

	# Build
	# test -d out || ./node_modules/.bin/gulp compile

	# Configuration
	export NODE_ENV=development
	export HYPERT_DEV=1
	export HYPERT_CLI=1
	export ELECTRON_ENABLE_STACK_DUMPING=1

	# Launch Code
	exec "$HYPERT" . "$@"
}

# Use the following to get v8 tracing:
# code --js-flags="--trace-hydrogen --trace-phase=Z --trace-deopt --code-comments --hydrogen-track-positions --redirect-code-traces" "$@"

hypert "$@"
