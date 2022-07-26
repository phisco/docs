build:
	rm -Rf public
	mkdir public
	hugo -c landingpage -d public
	cp landingpage/* public/.
	hugo -c upbound -d public/upbound -b /upbound
	hugo -c content2 -d public/content2 -b /content2

watch1:
	hugo -c upbound -d public/upbound -b /upbound -w

watch2:
	hugo -c content2 -d public/content2 -b /content2 -w

serve:
	$(MAKE) build
	cd public && python3 -m http.server --cgi 80
