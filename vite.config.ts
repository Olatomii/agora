import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { LabEngine, labMiddleware, makeProvider } from './server/lab';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const engine = new LabEngine({ ready: !!env.OPENAI_API_KEY, provider: 'OpenAI', models: { A: env.AGORA_MODEL_A || 'gpt-4.1-mini', B: env.AGORA_MODEL_B || 'gpt-4.1-mini', judge: env.AGORA_MODEL_JUDGE || 'gpt-4.1-mini' }, maxCalls: 8 }, makeProvider(env.OPENAI_API_KEY || ''));
  return { plugins: [react(), { name: 'agora-local-ai-lab', configureServer(server) { server.middlewares.use(labMiddleware(engine)); server.httpServer?.once('close', () => engine.stopAll()); } }], base: './', server: { host: '127.0.0.1', port: 5173, strictPort: true } };
});
