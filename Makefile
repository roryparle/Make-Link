.PHONY: clean publish

.DEFAULT: makelink.xpi

makelink.xpi:
	./make.sh

clean:
	rm -f chrome/makelink.jar *.xpi

publish: makelink.xpi
	./publish.sh


