less:
	lessc -x less/style.less | cleancss > css/style.css

js:
	cat js/parser.js js/libs/bootstrap/bootstrap-collapse.min.js | yui-compressor --type js -o js/main.min.js

all:
	make less
	make js

.PHONY: less js all