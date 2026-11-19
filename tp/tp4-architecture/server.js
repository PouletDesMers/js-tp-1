// Démarrage : la seule ligne qui connaît le stockage et le port.

import { createApp } from "./src/app.js";

const PORT = 4000;

createApp().listen(PORT, () => {
  console.log(`API sur http://localhost:${PORT}`);
});
