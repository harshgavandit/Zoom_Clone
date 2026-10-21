import server from './app.js';
server.listen(Number(process.env.PORT || 8000), '0.0.0.0', () => {
  console.log(`Apna Video Call running at http://localhost:${process.env.PORT || 8000}`);
});
