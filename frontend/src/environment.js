const server = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
export default server;
