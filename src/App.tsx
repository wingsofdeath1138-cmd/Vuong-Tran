import React, { useEffect, useState } from 'react';
import Host from './components/Host';
import Player from './components/Player';

export default function App() {
  const [isPlayer, setIsPlayer] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
      setIsPlayer(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-stone-900">
      {isPlayer ? <Player /> : <Host />}
    </div>
  );
}
