client-app-start:
	cd client-app; PORT=3012 npm start

client-app-build:
	cd client-app; npm run build

client-app-upload:
	./scripts/upload-client-app.sh
