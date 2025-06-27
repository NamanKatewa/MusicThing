import React from 'react';

interface WelcomeProps {
  onFolderSelect: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onFolderSelect }) => {
  return (
    <div className="welcome-container">
      <h1>Welcome to MusicThing</h1>
      <p>To get started, please select the folder where your music is stored.</p>
      <button onClick={onFolderSelect} className="btn btn-primary">
        Select Music Folder
      </button>
    </div>
  );
};

export default Welcome;
