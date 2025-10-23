import net from 'net';

/**
 * Simple loopback broker-like server for tests.
 * Accepts a single length-prefixed (optional) or raw synthetic frame and responds
 * with a synthetic RESULT list depending on rpc name embedded in payload.
 */
export function startLoopbackBroker(port: number): Promise<net.Server> {
  const server = net.createServer(socket => {
    socket.on('data', buf => {
      // Very naive parse: look for "XWB_RPC:" line
      const text = buf.toString('utf8');
      const lines = text.split(/\n/);
      const header = lines[0] || '';
      let rpcName = 'UNKNOWN';
      if (header.startsWith('XWB_RPC:')) rpcName = header.slice('XWB_RPC:'.length).trim();
      if (rpcName.startsWith('ORWPT LIST')) {
        const payload = '100^DOE,JOHN^1234^M^01/12/1965\n101^DOE,JANE^2345^F^07/03/1972\nEND';
        socket.write(Buffer.from(payload, 'utf8'));
      } else if (rpcName === 'XUS SIGNON SETUP') {
        socket.write(Buffer.from('#SIGNON_SETUP\nEND', 'utf8'));
      } else if (rpcName === 'XUS AV CODE') {
        socket.write(Buffer.from('#AV_OK\nEND', 'utf8'));
      } else {
        socket.write(Buffer.from('RESULT\nEND', 'utf8'));
      }
    });
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}
