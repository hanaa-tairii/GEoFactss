import { app } from "./app";
import { config } from "./config";

app.listen(config.port, () => console.log(`GeoFacts API listening on port ${config.port}`));
