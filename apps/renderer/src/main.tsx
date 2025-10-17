import { createRoot } from 'react-dom/client';
import './index.css';
import './preload.d.ts';

const App = () => (
  <div style={{ padding: 24 }}>
    <h1>BildBot Desktop</h1>
    <button
      onClick={async () => window.alert(JSON.stringify(await window.bb.ping('hello'), null, 2))}
    >
      IPC ping
    </button>
  </div>
);

createRoot(document.getElementById('root')!).render(<App />);
