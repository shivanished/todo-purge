.PHONY: dev build

dev:
	@./bin/dev.js $(filter-out $@,$(MAKECMDGOALS))

build:
	@./bin/run.js $(filter-out $@,$(MAKECMDGOALS))

# Catch-all pattern to prevent Make from complaining about unknown targets
%:
	@:

