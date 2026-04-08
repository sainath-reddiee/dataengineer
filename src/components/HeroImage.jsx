import React from 'react';

const HeroImage = () => {
  return (
    <div className='flex justify-center items-center'>
      <img 
        src='https://imagedelivery.net/LqiWLm-3MGbYHtFuUbcBtA/119580eb-abd9-4191-b93a-f01938786700/public' 
        alt='Data Engineering Blog Banner'
        width={1200}
        height={630}
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
};

export default HeroImage;