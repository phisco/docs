build:
	rm -Rf public
	mkdir public
	hugo -c landingpage -d public
	cp landingpage/* public/.
	hugo -c upbound -d public/upbound -b /upbound
	hugo -c content2 -d public/content2 -b /content2

watch1:
	hugo -c content1 -d public/content1 -b /content1 -w

watch2:
	hugo -c content2 -d public/content2 -b /content2 -w

serve:
	$(MAKE) build
	cd public && python3 -m http.server --cgi 80

deploy:
	rm -Rf public
	git clone git@gitlab.com:unomena-clients/upbound-docs-static.git public
	cd public && git checkout master && git rm -rf * && git commit -m "Delete everything"
	hugo -c landingpage -d public
	cp landingpage/* public/.
	hugo -c upbound -d public/upbound -b /upbound
	hugo -c content2 -d public/content2 -b /content2
	cd public && git add . && git commit -m "Static push" && git push -u origin master
