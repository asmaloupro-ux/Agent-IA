import { createApp } from "./app.js";

// Railway fournit PORT ; 4000 en local.
const port = Number(process.env.PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`API prête sur http://localhost:${port}`);
});
