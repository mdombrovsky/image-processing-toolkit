import React from 'react';
import logo from './logo.svg';
import ImageProcessor from './image_processor/ImageProcessor'
import './App.css';

function App() {
  return (
    <div className="App">
      <h1 className="m-2 mb-3">Image processing toolkit</h1>
      <ImageProcessor />
    </div>
  );
}

export default App;
