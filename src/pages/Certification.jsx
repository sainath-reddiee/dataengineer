import React from 'react';

const Certification = () => {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* Optional: Add a small header or breadcrumb here if you want */}
      
      <div className="flex-grow w-full h-full relative">
        <iframe
          src="https://snowcert.streamlit.app/?embed=true" 
          title="Snowflake Certification Prep"
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: '100vh' }}
          allow="camera; microphone; clipboard-read; clipboard-write;"
        />
      </div>
    </div>
  );
};

export default Certification;
