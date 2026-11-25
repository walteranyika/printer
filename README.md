# Tillie

A small receipt builder for independent businesses. Enter business details and sale items, choose one of five receipt designs, and print through QZ Tray.

## Run locally

```sh
npm install
npm run dev
```

## Use

- Edit the business name, location, phone number, and receipt date.
- Add, update, or remove products; each line includes a quantity and unit price.
- Edit the receipt's closing message; line breaks and wrapped lines are included in both the preview and printout.
- Set an editable receipt number, shown near the bottom of both the preview and printout.
- Select a currency and one of the Classic, Modern, Bold, Minimal, or Market designs.
- Install and start [QZ Tray](https://qz.io/download/) on the computer connected to the printer.
- Select **Connect** in the app, allow the QZ Tray connection if prompted, and choose the receipt printer.
- Select **Print this receipt** to send raw ESC/POS text and control commands directly to the selected printer. The layout uses 48-character lines for a typical 80 mm receipt printer.
- Choose a receipt design in the preview; the printout applies compatible text formatting such as alignment, bold, and separators.

The editor starts with sample details and products that can be changed or removed. Receipt data is kept in the current page and is not saved.

QZ security signing is configured in `src/utils/qz-setup.js` before the app connects. The bundled demo certificate/key is for local development only and is exposed to anyone who can load the frontend. Do not use it, or any production private key, in a deployed browser app. For production, keep the private key on a server and implement a signing endpoint; provide only the public certificate to the browser. QZ may still prompt if the certificate is not trusted by the local QZ Tray installation.

This raw ESC/POS output requires a receipt printer and driver that accept ESC/POS commands. The app does not rasterize HTML or print the browser preview.
