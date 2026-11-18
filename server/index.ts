import 'dotenv/config';
import { createApp } from './app.js';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);
if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer between 0 and 65535');
}

const app = createApp();
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
