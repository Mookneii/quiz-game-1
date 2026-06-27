import React from 'react';
import { useParams } from 'react-router-dom';

const GameHistoryDetail = () => {
  const { gameResultId } = useParams();

  return (
    <div>
      <h1>Game History Detail</h1>
      <p>This is a placeholder for the Game History Detail page for result ID: {gameResultId}.</p>
    </div>
  );
};

export default GameHistoryDetail;
