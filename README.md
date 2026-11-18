# Noor Classroom

A responsive, multilingual Quran tutoring classroom built with HTML5, Tailwind CSS (CDN), vanilla JavaScript modules, Jitsi Meet External API, and the AlQuran Cloud API.

## Features

- Premium dark interface with emerald and gold accents.
- English, Arabic, and French interface translations, including RTL layout for Arabic.
- Teacher-created rooms with random room IDs and shareable invitation URLs.
- Student joining by link or room code, without a Noor account.
- Embedded Jitsi Meet audio/video classroom with microphone, camera, screen-share and hang-up controls.
- Shared Surah/Ayah selection and Quran Arabic text via AlQuran Cloud.
- Pointer/touch whiteboard with ink colour, brush size and eraser.
- Teacher-created room links stored in the browser's local storage.
- Responsive layouts for mobile, tablet and desktop.

## Quick start

This is a static website. No build step is required.

1. Unzip the project.
2. Open the `noor_classroom` folder.
3. For local testing, run a static server from this folder. For example:

   ```bash
   python -m http.server 8080
   ```

4. Visit `http://localhost:8080`.

Opening `index.html` directly with `file://` may prevent JavaScript modules and browser APIs from working. Use a local server.

## Deploy to Netlify

### Drag-and-drop

1. Sign in to Netlify.
2. Choose **Add new site → Deploy manually**.
3. Drag the unzipped project folder (the folder containing `index.html`) into the deploy area.
4. Netlify will publish the static site and provide a URL.

### Git deployment

1. Push the project folder to a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository.
4. Set **Build command** to empty and **Publish directory** to `.`.
5. Deploy.

## Deploy to Vercel

1. Push the project folder to GitHub.
2. In Vercel, select **Add New → Project** and import the repository.
3. Choose **Other** as the framework preset.
4. Leave the build command and output directory blank/default (or set output directory to `.` if prompted).
5. Deploy.

Alternatively, install the Vercel CLI and run `vercel` from this folder. No compilation is required.

## Video classroom: important deployment notes

This starter uses the public Jitsi Meet service at `meet.jit.si` through its External API. It does not require an API key for the basic integration, but:

- Public Jitsi availability, capacity, rate limits, moderation and policies are controlled by the Jitsi service. This project cannot promise uninterrupted or guaranteed call quality.
- A random room name is an unguessable invitation identifier, **not authentication**. Anyone who obtains the link may be able to attempt to join. Do not use this configuration for sensitive or confidential sessions.
- Public Jitsi deployments may change their guest access, lobby, moderator and authentication behaviour. Test teacher/student joining from separate networks and devices before using this for real lessons.
- The embedded call's own UI may expose additional controls depending on Jitsi configuration. The outer controls use the Jitsi External API commands.
- For stronger privacy and teacher-controlled room creation, use a managed Jitsi deployment with authentication/lobby settings, or LiveKit Cloud with a server-side token endpoint. Never put a LiveKit API secret in browser JavaScript.

### Production-grade LiveKit alternative

A production LiveKit setup needs a small backend/serverless function that:
1. Authenticates the teacher or validates a signed invitation.
2. Issues short-lived room-scoped participant tokens using the LiveKit API secret.
3. Returns the token to the browser over HTTPS.
4. Enforces room permissions (e.g. teacher can publish/share; student can subscribe).

The API secret must remain server-side in Vercel/Netlify environment variables. This static starter intentionally does not pretend that a client-side secret is safe.

## Quran text and Mushaf notes

- Quran Arabic text is requested from `https://api.alquran.cloud/v1/` when a Surah/Ayah is selected.
- The current reader displays an Ayah text panel, not a scanned Madinah Mushaf page image. It synchronizes the Surah and Ayah selection.
- Text/audio availability and API uptime depend on the third-party API and the user's internet connection.
- Verify Quran text and recitation with a trusted Mushaf before teaching. Do not rely on a software interface as the sole source for Quranic correctness.
- The initial audio edition is used as an API response source for text; this project does not play recitation audio.

## Room synchronization

The app sends small classroom messages using Jitsi's `sendEndpointTextMessage` and listens for `endpointTextMessageReceived`. Jitsi versions/deployments can differ in support and message routing. Test synchronization in your chosen Jitsi environment. If your deployment does not relay endpoint text messages to all participants, replace this transport with a room-authorized realtime channel (for example, Supabase Realtime or a WebSocket service). The whiteboard currently sends a compressed canvas snapshot after drawing pauses; it is suitable for a prototype, not a high-frequency collaborative drawing engine.

## Privacy and data

- No Noor user account system or server-side database is included.
- Room history is stored only in the current browser's local storage.
- The invitation URL contains the room identifier. Treat it like a password and share it privately.
- Jitsi and AlQuran Cloud are third-party services and receive network requests from users' browsers. Review their current privacy policies and terms before production use.
- Use HTTPS in deployment. Camera/microphone and clipboard APIs require secure contexts in modern browsers (localhost is treated as secure for development).

## Project structure

```text
noor_classroom/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── app.js
    └── i18n.js
```

## Browser support

Use a current version of Chrome, Edge, Firefox or Safari. Camera, microphone and screen sharing depend on browser support and user permissions. Screen sharing is typically best supported on desktop browsers; mobile browser support varies.

## Customization

- Translations: edit `js/i18n.js`.
- Theme and responsive styling: edit `css/styles.css`.
- Room, call, Mushaf and whiteboard logic: edit `js/app.js`.
- Landing content and page structure: edit `index.html`.

## License

This starter is provided as a customizable project template. Check the licenses and terms of all third-party services and libraries you choose to use.
